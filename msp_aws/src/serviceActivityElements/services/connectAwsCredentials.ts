import type { ServiceRequestResult, ViewDataContent } from 'msp_common';
import { runDataActivity, runServiceActivity, storeSecretForServiceId, type ServiceActivityResultBuilder } from 'msp_svr_common';
import { tryVaultSecret } from '../../shared/vault.js';

export type ConnectAwsCredentialsPayload = {
  setupId?: string;
  clusterName?: string;
  region?: string;
  accountId?: string;
  accountName?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  persistCredentials?: boolean;
  isTestConnectionOnly?: boolean;
};

const AWS_SECRET_SERVICE_ID = 'msp_aws.data';
const REDACTED_SECRET = '__redacted__';

function required(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
}

function normalizeAccountId(value: string | undefined): string | undefined {
  const normalized = required(value);
  if (!normalized) return undefined;

  // Allow user-friendly formats like 5556-4775-5520 and persist canonical 12-digit form.
  const digitsOnly = normalized.replace(/\D/g, '');
  return digitsOnly.length > 0 ? digitsOnly : normalized;
}

type AwsConnectionStatus = {
  connected: boolean;
  accountId?: string;
  callerArn?: string;
  callerUserId?: string;
  message?: string;
  checkedAt?: string;
};

type AwsConnectionStatusRow = {
  connected?: boolean;
  accountId?: string;
  callerArn?: string;
  callerUserId?: string;
  message?: string;
  checkedAt?: string;
};

function normalizeConnectionStatus(row?: AwsConnectionStatusRow): AwsConnectionStatus {
  return {
    connected: !!row?.connected,
    accountId: row?.accountId,
    callerArn: row?.callerArn,
    callerUserId: row?.callerUserId,
    message: row?.message,
    checkedAt: row?.checkedAt,
  };
}

async function validateAwsConnectionViaDataActivity(
  accountId: string,
  region: string,
  accessKeyId: string,
  secretAccessKey: string,
  sessionToken?: string,
): Promise<AwsConnectionStatus> {
  try {
    const response = await runDataActivity<
      {
        accountId: string;
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken?: string;
      },
      { data?: ViewDataContent<AwsConnectionStatusRow>[] }
    >(
      'aws',
      'awsValidateCredentials',
      '1.0.0',
      'default',
      {
        accountId,
        region,
        accessKeyId,
        secretAccessKey,
        sessionToken,
      },
    );

    if (!response.success) {
      return {
        connected: false,
        message: response.message || 'AWS validation data activity failed.',
      };
    }

    const row = response.result?.data?.[0]?.content;
    return normalizeConnectionStatus(row);
  } catch (error: any) {
    return {
      connected: false,
      message: error?.message || 'AWS validation failed unexpectedly.',
    };
  }
}

export async function connectAwsCredentialsHandler(
  payload: ConnectAwsCredentialsPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {

  resultBuilder.setNoCacheDataFlag();

  const setupId = required(payload.setupId) ?? 'aws-cluster-setup-default';
  const region = required(payload.region) ?? 'eu-west-2';
  const clusterName = required(payload.clusterName) ?? 'msp-dev-eks';
  const accountId = normalizeAccountId(payload.accountId);
  const accountName = required(payload.accountName);
  const accessKeyId = required(payload.accessKeyId);
  const secretInput = required(payload.secretAccessKey);
  const sessionToken = required(payload.sessionToken);
  const isTestConnectionOnly = payload.isTestConnectionOnly;
  const persistCredentials = payload.persistCredentials === true;
  const isRedactedSecret = secretInput === REDACTED_SECRET;
  const secretAccessKey = isRedactedSecret ? await tryVaultSecret('aws.secretAccessKey') : secretInput;

  // check we have all required inputs before attempting to connect
  if (!accountId || !accessKeyId || !secretAccessKey) {
    resultBuilder.log('Missing required AWS credentials: accountId, accessKeyId and secretAccessKey are required.');
    return resultBuilder.successfullyFailed({
      connected: false,
      connection: {
        connected: false,
        accountId: 'unknown',
        callerArn: 'unknown',
        callerUserId: 'unknown',
        checkedAt: (new Date(Date.now())).toISOString(),
        message: 'Missing required AWS credentials: accountId, accessKeyId and secretAccessKey are required.',
      },
      data: {},
      accountId,
      accountName,
      region,
      setupId,
      clusterName,
    }, 'accountId, accessKeyId and secretAccessKey are required to connect.',
      {
        code: 'INVALID_INPUT',
      })
  }

  // if we have been asked to only check the connection,
  //  we can skip persisting the secret and just validate the credentials
  if (!isTestConnectionOnly) {
    const checkedAt = new Date().toISOString();
    const connectionMessage = 'Using existing vaulted secret (redacted input). Vault secret left unchanged.';
    const writeResponse = await runServiceActivity(
      'aws',
      'writeClusterSetupConfig',
      '1.0.0',
      {
        setupId,
        region,
        clusterName,
        accountId,
        accountName,
        accessKeyId,
        connectionStatus: 'success',
        connectionMessage,
        connectionCheckedAt: checkedAt,
        status: 'ready',
      },
    );

    if (!writeResponse.success) {
      return resultBuilder.failed(
        writeResponse.message || 'Failed to persist setup status while leaving vault secret unchanged.',
        { code: 'WRITE_SETUP_FAILED' },
      );
    }
  }

  // test the connection to AWS with the provided credentials
  try {
    const connection = await validateAwsConnectionViaDataActivity(
      accountId,
      region,
      accessKeyId,
      secretAccessKey!,
      sessionToken,
    );

    const failureMessage = connection.message || 'Unable to connect to AWS with supplied credentials.';
    let writeResponse: ServiceRequestResult<any> | undefined;
    // failed ?
    if (!connection.connected) {
      if (persistCredentials) {
      // update the config with the failed connection status and message
        writeResponse = await runServiceActivity(
          'aws',
          'writeClusterSetupConfig',
          '1.0.0',
          {
            setupId,
            region,
            clusterName,
            accountId,
            accountName,
            connectionStatus: 'failed',
            connectionMessage: failureMessage,
            connectionCheckedAt: connection.checkedAt || new Date().toISOString(),
          },
        );
      }
      // exit with status and message from the connection attempt
      return resultBuilder.success({
        connected: false,
        connection,
        data: writeResponse?.result?.data,
        accountId,
        accountName,
        region,
        setupId,
        clusterName,
      });
    }

    // check the connected accountId matches the provided accountId (if any)
    const callerAccountId = normalizeAccountId(connection.accountId) || connection.accountId;
    if (callerAccountId && callerAccountId !== accountId) {
      const mismatchMessage = `Provided accountId ${accountId} does not match AWS caller account ${connection.accountId}.`;

      const writeResponse = await runServiceActivity(
        'aws',
        'writeClusterSetupConfig',
        '1.0.0',
        {
          setupId,
          region,
          clusterName,
          accountId,
          accountName,
          connectionStatus: 'failed',
          connectionMessage: mismatchMessage,
          connectionCheckedAt: connection.checkedAt || new Date().toISOString(),
        },
      );

      return resultBuilder.success({
        connected: false,
        connection: {
          ...connection,
          message: mismatchMessage,
        },
        data: writeResponse.result?.data,
        accountId,
        accountName,
        region,
        setupId,
        clusterName,
      });
    }

    let credentialsStored = false;

    // rewrite the config and credentials to vault if requested (and not just a test connection)
    // with successfils status and message from the connection attempt
    if (persistCredentials) {
      const writeResponse = await runServiceActivity(
        'aws',
        'writeClusterSetupConfig',
        '1.0.0',
        {
          setupId,
          region,
          clusterName,
          accountId,
          accountName,
          ...(persistCredentials ? { accessKeyId } : {}),
          connectionStatus: 'success',
          connectionMessage: connection.message || 'Connection succeeded',
          connectionCheckedAt: connection.checkedAt || new Date().toISOString(),
          status: 'ready',
        },
      );

      if (!writeResponse.success) {
        return resultBuilder.failed(
          writeResponse.message || 'Connected to AWS but failed to persist setup status.',
          { code: 'WRITE_SETUP_FAILED' },
        );
      }

      

      await storeSecretForServiceId(
        {
          serviceId: AWS_SECRET_SERVICE_ID,
          secretName: 'aws.secretAccessKey',
          secret: secretAccessKey!,
          upsertMode: 'replace',
          clientCacheTtlMs: 5 * 60 * 1000,
        },
        { includeIdClaim: true },
      );

      credentialsStored = true;
    }


    // main return for successful connection
    resultBuilder.log(`AWS credentials validated for accountId=${accountId} region=${region}${persistCredentials ? ' and persisted to vault' : ''}.`);
    return resultBuilder.success({
      connected: true,
      connection,
      data: writeResponse?.result?.data,
      accountId,
      accountName,
      ...(persistCredentials ? { accessKeyId, secretAccessKey: '__redacted__' } : {}),
      region,
      setupId,
      clusterName,
      credentialsStored: {
        accessKeyId: false,
        secretAccessKey: credentialsStored ? '__redacted__' : undefined,
        sessionToken: false,
      },
    });
  } catch (error: any) {
    const message = error?.message || 'AWS connect flow failed unexpectedly.';
    resultBuilder.log(`AWS connect flow failed: ${message}`);
    return resultBuilder.successfullyFailed(
      {
        connected: false,
        connection: {
          connected: false,
          accountId,
          checkedAt: new Date().toISOString(),
          message,
        },
        data: {},
        accountId,
        accountName,
        region,
        setupId,
        clusterName,
      },
      message,
      { code: 'AWS_CONNECT_UNEXPECTED_ERROR' },
    );
  }
}
