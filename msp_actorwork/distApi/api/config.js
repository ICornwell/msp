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
const clientCredentials = {
    clientId: process.env['UI_API_CLIENT_ID'] || '76202d65-88a6-4d3e-8bf6-b67ecb0fe78c',
    // clientDev: process.env['UI_API_CLIENT_DEVKEY'] || '',
    clientSecret: process.env['UI_API_CLIENT_SECRET'] || '',
    tenantId: process.env['AUTH_TOKEN_URL'] || '027f47db-adad-450a-8118-4bd5b6feef63',
    scope: process.env['UI_API_CLIENT_SCOPES'] || 'api://76202d65-88a6-4d3e-8bf6-b67ecb0fe78c/.default',
    authority: process.env['AUTH_AUTHORITY_HOST'] || ''
};
const config = {
    ...SharedConfig,
    product: thisProduct,
    clientCredentials,
    serviceHubApiUrl: SharedConfig?.getHostUrl?.('serviceHub') || 'http://localhost:4001',
    myUrl: SharedConfig?.getHostUrl?.(thisProduct.name) || 'http://localhost:4003',
    myMFUrl: SharedConfig?.getMFHostUrl?.(thisProduct.name) || 'http://localhost:3003'
};
export const Config = config;
//# sourceMappingURL=config.js.map