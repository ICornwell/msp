
import { SharedConfig, Config, ProductConfig,  } from "msp_svr_common"
import {ClientCredentialsConfig} from "msp_common"

// what/which product is service for?
// ServiceHub is a little unusual in that it hosts the platform itself
const thisProduct: ProductConfig = {
    domain: 'msp_core',
    name: 'msp_core',
    variantName: 'default',
    version: '1.0.0'
}

function resolveClientCredentials(): ClientCredentialsConfig {
    return {
        clientId: process.env['MSP_core_clientId'] || '',
        clientSecret: process.env['MSP_core_clientSecret'] || '',
        tenantId: process.env['MSP_tenantId'] || '',
        scope: process.env['MSP_core_clientScopes'] || '',
        authority: process.env['MSP_authority'] || ''
    };
}
export function resolveConfig(): Partial<Config> {
    const clientCredentials = resolveClientCredentials();
    return {
        ...SharedConfig,
        product: thisProduct,
        clientCredentials,
        serviceHubApiUrl: SharedConfig?.getHostUrl?.('serviceHub') || 'http://localhost:4001',
        myUrl: SharedConfig?.getHostUrl?.(thisProduct.name) || 'http://localhost:4003',
        myMFUrl: SharedConfig?.getMFHostUrl?.(thisProduct.name) || 'http://localhost:3003',
        jwtValidation: {
             trustedIssuers: process.env['MSP_core_issuers']
                ? process.env['MSP_core_issuers'].split(',')
                : [],
            audience: process.env['MSP_aud'],
            clockTolerance: 300,
            maxTokenAge: 3600
        }
    };
}