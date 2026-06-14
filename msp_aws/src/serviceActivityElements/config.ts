import { SharedConfig, Config, ProductConfig } from 'msp_svr_common';
import { ClientCredentialsConfig } from 'msp_common';

const thisProduct: ProductConfig = {
  domain: 'aws',
  name: 'awsMainService',
  variantName: 'default',
  version: '1.0.0',
};

function resolveClientCredentials(): ClientCredentialsConfig {
  return {
    clientId: process.env['MSP_core_clientId'] || '',
    clientSecret: process.env['MSP_core_clientSecret'] || '',
    tenantId: process.env['MSP_tenantId'] || '',
    scope: process.env['MSP_core_clientScopes'] || '',
    authority: process.env['MSP_authority'] || '',
  };
}

export function resolveConfig(): Partial<Config> {
  const clientCredentials = resolveClientCredentials();
  return {
    ...SharedConfig,
    product: thisProduct,
    clientCredentials,
    serviceHubApiUrl: SharedConfig?.getHostUrl?.('serviceHub') || 'http://localhost:4001',
    myUrl: SharedConfig?.getHostUrl?.(thisProduct.name, thisProduct.domain, thisProduct.version, thisProduct.variantName) || 'http://localhost:4005',
    myMFUrl: SharedConfig?.getMFHostUrl?.(thisProduct.name, thisProduct.domain, thisProduct.version, thisProduct.variantName) || 'http://localhost:3005',
    myDataUrl: SharedConfig?.getDataHostUrl?.(thisProduct.name, thisProduct.domain, thisProduct.version, thisProduct.variantName) || 'http://localhost:5005',
    myPort: SharedConfig?.getPort?.(thisProduct.name, thisProduct.domain, thisProduct.version, thisProduct.variantName)?.toString() || '4005',
    jwtValidation: {
      trustedIssuers: process.env['MSP_core_issuers']
        ? process.env['MSP_core_issuers'].split(',')
        : [`https://login.microsoftonline.com/${SharedConfig.clientCredentials?.tenantId}/v2.0`,
                   `https://sts.windows.net/${SharedConfig.clientCredentials?.tenantId}/`],
      audience: (process.env['MSP_aud'] ?? '').split(',').map((aud) => aud.trim()),
      clockTolerance: 300,
      maxTokenAge: 3600,
    },
  };
}
