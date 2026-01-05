import { ClientCredentialsConfig } from './als/index.js';
import { Ports } from './ports.js';

export type ProductConfig = {
    domain: string,
    name: string,
    variantName: string,
    version: string
}

export type Config = {
    product: ProductConfig,
    myUrl: string,
    serviceHubApiUrl: string,
    serviceHubMfUrl: string,
    uiWebUrl: string,
    uiBffUrl: string,
    getHostUrl: (service: string) => string,
    clientCredentials?: ClientCredentialsConfig 

}

const sharedconfig: Partial<Config> = {
    serviceHubApiUrl: HostName('serviceHubApi'),
    serviceHubMfUrl: HostName('serviceHubMF'),
    uiWebUrl: HostName('uiWeb'),
    uiBffUrl: HostName('uiBff'),

    getHostUrl: HostName

}
export function HostName(service: string): string {
    const host = process.env[`${service.toUpperCase()}_HOST`];
    if (host) {
        return `https://${host}:443`;
    }

    return `http://localhost:${(Ports.core as any)?.[service]}`;
}

export const SharedConfig = sharedconfig

export default SharedConfig