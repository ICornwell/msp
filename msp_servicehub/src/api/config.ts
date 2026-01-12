
import { SharedConfig, Config as ConfigType, ProductConfig, ClientCredentialsConfig } from "msp_common"

// what/which product is service for?
// ServiceHub is a little unusual in that it hosts the platform itself
const thisProduct: ProductConfig = {
    domain: 'msp_core',
    name: 'msp_core',
    variantName: 'default',
    version: '1.0.0'
}

const clientCredentials: ClientCredentialsConfig = {
    clientId: process.env['UI_API_CLIENT_ID'] || '76202d65-88a6-4d3e-8bf6-b67ecb0fe78c',
    clientDev: process.env['UI_API_CLIENT_DEVKEY'],
    clientSecret: process.env['UI_API_CLIENT_SECRET'], 
    tenantId: process.env['AUTH_TOKEN_URL'] || '027f47db-adad-450a-8118-4bd5b6feef63',
    scope: process.env['UI_API_CLIENT_SCOPES'] || 'api://76202d65-88a6-4d3e-8bf6-b67ecb0fe78c/.default',
    authority: process.env['AUTH_AUTHORITY_HOST'] || ''
}

const config: Partial<ConfigType> ={
    ...SharedConfig,
    product: thisProduct,
    clientCredentials,
    myUrl: SharedConfig?.getHostUrl?.('core') || 'http://localhost:3000'
}

export const Config = config

export default Config