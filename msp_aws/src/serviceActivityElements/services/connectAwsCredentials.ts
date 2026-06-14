import type { ViewDataContent } from 'msp_common';
import { runDataActivity, runServiceActivity, storeSecretForServiceId, type ServiceActivityResultBuilder } from 'msp_svr_common';

export type ConnectAwsCredentialsPayload = {
  setupId?: string;
  clusterName?: string;
  region?: string;
  accountId?: string;
  accountName?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
};

const AWS_SECRET_SERVICE_ID = 'msp_aws.data';

function required(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
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
}

export async function connectAwsCredentialsHandler(
  payload: ConnectAwsCredentialsPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  const setupId = required(payload.setupId) ?? 'aws-cluster-setup-default';
  const region = required(payload.region) ?? 'eu-west-2';
  const clusterName = required(payload.clusterName) ?? 'msp-dev-eks';
  const accountId = required(payload.accountId);
  const accountName = required(payload.accountName);
  const accessKeyId = required(payload.accessKeyId);
  const secretAccessKey = required(payload.secretAccessKey);
  const sessionToken = required(payload.sessionToken);

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return resultBuilder.failed('accountId, accessKeyId and secretAccessKey are required to connect.', {
      code: 'INVALID_INPUT',
    });
  }

  const connection = await validateAwsConnectionViaDataActivity(
    accountId,
    region,
    accessKeyId,
    secretAccessKey,
    sessionToken,
  );

  const failureMessage = connection.message || 'Unable to connect to AWS with supplied credentials.';

  if (!connection.connected) {
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
        connectionMessage: failureMessage,
        connectionCheckedAt: connection.checkedAt || new Date().toISOString(),
      },
    );

    return resultBuilder.success({
      connected: false,
      connection,
      data: writeResponse.result?.data,
      accountId,
      accountName,
      region,
      setupId,
      clusterName,
    });
  }

  if (connection.accountId && connection.accountId !== accountId) {
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
      secretName: 'aws.accessKeyId',
      secret: accessKeyId,
      upsertMode: 'replace',
      clientCacheTtlMs: 5 * 60 * 1000,
    },
    { includeIdClaim: true },
  );

  await storeSecretForServiceId(
    {
      serviceId: AWS_SECRET_SERVICE_ID,
      secretName: 'aws.secretAccessKey',
      secret: secretAccessKey,
      upsertMode: 'replace',
      clientCacheTtlMs: 5 * 60 * 1000,
    },
    { includeIdClaim: true },
  );

  if (sessionToken) {
    await storeSecretForServiceId(
      {
        serviceId: AWS_SECRET_SERVICE_ID,
        secretName: 'aws.sessionToken',
        secret: sessionToken,
        upsertMode: 'replace',
        clientCacheTtlMs: 5 * 60 * 1000,
      },
      { includeIdClaim: true },
    );
  }

  resultBuilder.log(`AWS credentials connected for accountId=${accountId} region=${region}.`);
  return resultBuilder.success({
    connected: true,
    connection,
    data: writeResponse.result?.data,
    accountId,
    accountName,
    region,
    setupId,
    clusterName,
    credentialsStored: {
      accessKeyId: true,
      secretAccessKey: true,
      sessionToken: !!sessionToken,
    },
  });
}
