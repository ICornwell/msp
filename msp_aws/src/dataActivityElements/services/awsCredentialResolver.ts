import { fetchSecretForServiceId } from 'msp_svr_common';

export type AwsCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
};

const SERVICE_ID = 'msp_aws.data';

async function tryVaultSecret(secretName: string): Promise<string | undefined> {
  try {
    const response = await fetchSecretForServiceId({
      serviceId: SERVICE_ID,
      secretName,
      requesterServiceId: SERVICE_ID,
    }, {
      includeIdClaim: true,
    });

    return response.secret?.trim() || undefined;
  } catch {
    return undefined;
  }
}

async function resolveString(
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
