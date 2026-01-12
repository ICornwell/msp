
import { ClientCredentialsConfig, SharedConfig } from "msp_common"

const clientCredentials: ClientCredentialsConfig = {
    clientId: process.env['UI_API_CLIENT_ID'] || '76202d65-88a6-4d3e-8bf6-b67ecb0fe78c',
    clientDev: process.env['UI_API_CLIENT_DEVKEY'],
    clientSecret: process.env['UI_API_CLIENT_SECRET'], 
    tenantId: process.env['AUTH_TOKEN_URL'] || '027f47db-adad-450a-8118-4bd5b6feef63',
    scope: process.env['UI_API_CLIENT_SCOPES'] || 'api://76202d65-88a6-4d3e-8bf6-b67ecb0fe78c/.default',
    authority: process.env['AUTH_AUTHORITY_HOST'] || ''
}

const config ={
    ...SharedConfig,
    clientCredentials
}

export const Config = config

export default Config