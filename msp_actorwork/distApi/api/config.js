// Actorwork Service Configuration
import { SharedConfig } from "msp_svr_common";
// what/which product is service for?
// ServiceHub is a little unusual in that it hosts the platform itself
const thisProduct = {
    domain: 'actorWork',
    name: 'actorWorkMainService',
    variantName: 'default',
    version: '1.0.0'
};
function resolveClientCredentials() {
    return {
        clientId: process.env['MSP_core_clientId'] || '',
        clientSecret: process.env['MSP_core_clientSecret'] || '',
        tenantId: process.env['MSP_tenantId'] || '',
        scope: process.env['MSP_core_clientScopes'] || '',
        authority: process.env['MSP_authority'] || ''
    };
}
export function resolveConfig() {
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
//# sourceMappingURL=config.js.map