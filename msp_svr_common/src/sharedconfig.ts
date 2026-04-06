import { ClientCredentialsConfig } from 'msp_common';
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
    myMFUrl: string,
    serviceHubApiUrl: string,
    serviceHubMfUrl: string,
    semaphoresUrl: string,
    uiWebUrl: string,
    uiBffUrl: string,
    getHostUrl: (service: string) => string,
    getMFHostUrl: (service: string) => string,
    clientCredentials?: ClientCredentialsConfig 

}

const sharedconfig: Partial<Config> = {
    serviceHubApiUrl: HostName('serviceHub'),
    serviceHubMfUrl: HostName('serviceHub'),
    semaphoresUrl: HostName('semaphores'),
    uiWebUrl: HostName('uiWeb'),
    uiBffUrl: HostName('uiBff'),

    getHostUrl: HostName,
    getMFHostUrl: MFHostName
}
export function HostName(service: string): string {
    const host = process.env[`${service.toUpperCase()}_HOST`];
    if (host) {
        return `https://${host}:443`;
    }

    return `http://localhost:${(Ports.core as any)?.[service]}`;
}

export function MFHostName(service: string): string {
    const host = process.env[`${service.toUpperCase()}_MF_HOST`];
    if (host) {
        return `https://${host}:443`;
    }

    return `http://localhost:${(Ports.core as any)?.[`MF_${service}`]}`;
}

export const SharedConfig = sharedconfig

export default SharedConfig