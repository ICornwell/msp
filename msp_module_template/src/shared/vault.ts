import { fetchSecretForServiceId, storeSecretForServiceId } from 'msp_svr_common';

export type Module_TemplateCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  region: string;
};

const MODULE_TEMPLATE_SECRET_SERVICE_ID = 'msp_module_template.data';

export async function tryVaultSecret(secretName: string): Promise<string | undefined> {
  try {
    const response = await fetchSecretForServiceId({
      serviceId: MODULE_TEMPLATE_SECRET_SERVICE_ID,
      secretName,
      requesterServiceId: MODULE_TEMPLATE_SECRET_SERVICE_ID,
    }, {
      includeIdClaim: true,
    });

    return response.secret?.trim() || undefined;
  } catch {
    return undefined;
  }
}

export async function storeModule_TemplateSecretAccessKey(secretAccessKey: string): Promise<void> {
  await storeSecretForServiceId(
    {
      serviceId: MODULE_TEMPLATE_SECRET_SERVICE_ID,
      secretName: 'module_template.secretAccessKey',
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

export async function resolveModule_TemplateCredentials(region?: string): Promise<Module_TemplateCredentials> {
  const resolvedRegion = region?.trim() || process.env['PAMELA_REGION'] || 'eu-west-2';

  const [accessKeyId, secretAccessKey, sessionToken] = await Promise.all([
    resolveString('module_template.accessKeyId', 'PAMELA_ACCESS_KEY_ID', 'local-dev-access-key'),
    resolveString('module_template.secretAccessKey', 'PAMELA_SECRET_ACCESS_KEY', 'local-dev-secret-key'),
    tryVaultSecret('module_template.sessionToken'),
  ]);

  return {
    accessKeyId,
    secretAccessKey,
    sessionToken,
    region: resolvedRegion,
  };
}
