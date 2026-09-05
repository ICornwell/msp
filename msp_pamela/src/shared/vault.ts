import { fetchSecretForServiceId, storeSecretForServiceId } from 'msp_svr_common';

export type PamelaCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
};

const PAMELA_SECRET_SERVICE_ID = 'msp_pamela.data';

export async function tryVaultSecret(secretName: string): Promise<string | undefined> {
  try {
    const response = await fetchSecretForServiceId({
      serviceId: PAMELA_SECRET_SERVICE_ID,
      secretName,
      requesterServiceId: PAMELA_SECRET_SERVICE_ID,
    }, {
      includeIdClaim: true,
    });

    return response.secret?.trim() || undefined;
  } catch {
    return undefined;
  }
}

export async function storePamelaSecretAccessKey(secretAccessKey: string): Promise<void> {
  await storeSecretForServiceId(
    {
      serviceId: PAMELA_SECRET_SERVICE_ID,
      secretName: 'pamela.secretAccessKey',
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

export async function resolvePamelaCredentials(region?: string): Promise<PamelaCredentials> {
  const resolvedRegion = region?.trim() || process.env['PAMELA_REGION'] || 'eu-west-2';

  const [accessKeyId, secretAccessKey, sessionToken] = await Promise.all([
    resolveString('pamela.accessKeyId', 'PAMELA_ACCESS_KEY_ID', 'local-dev-access-key'),
    resolveString('pamela.secretAccessKey', 'PAMELA_SECRET_ACCESS_KEY', 'local-dev-secret-key'),
    tryVaultSecret('pamela.sessionToken'),
  ]);

  return {
    accessKeyId,
    secretAccessKey,
    sessionToken,
    region: resolvedRegion,
  };
}
