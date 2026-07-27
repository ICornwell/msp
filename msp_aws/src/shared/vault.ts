import { fetchSecretForServiceId, storeSecretForServiceId } from 'msp_svr_common';

export type AwsCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
};

const AWS_SECRET_SERVICE_ID = 'msp_aws.data';

export async function tryVaultSecret(secretName: string): Promise<string | undefined> {
  try {
    const response = await fetchSecretForServiceId({
      serviceId: AWS_SECRET_SERVICE_ID,
      secretName,
      requesterServiceId: AWS_SECRET_SERVICE_ID,
    }, {
      includeIdClaim: true,
    });

    return response.secret?.trim() || undefined;
  } catch {
    return undefined;
  }
}

export async function storeAwsSecretAccessKey(secretAccessKey: string): Promise<void> {
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
}

export async function resolveString(
  secretName: string,
  envKey: string,
  fallback: string,
): Promise<string> {
  const fromVault = await tryVaultSecret(secretName);
  if (fromVault) return fromVault;
  return process.env[envKey]?.trim() || fallback;
}

export async function resolveAwsCredentials(region?: string): Promise<AwsCredentials> {
  const resolvedRegion = region?.trim() || process.env['AWS_REGION'] || 'eu-west-2';

  const [accessKeyId, secretAccessKey, sessionToken] = await Promise.all([
    resolveString('aws.accessKeyId', 'AWS_ACCESS_KEY_ID', 'local-dev-access-key'),
    resolveString('aws.secretAccessKey', 'AWS_SECRET_ACCESS_KEY', 'local-dev-secret-key'),
    tryVaultSecret('aws.sessionToken'),
  ]);

  return {
    accessKeyId,
    secretAccessKey,
    sessionToken,
    region: resolvedRegion,
  };
}
