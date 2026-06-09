import { ClientCredentialsConfig, JWTValidationConfig } from 'msp_common';
import { Ports } from './ports.js';

export type ProductConfig = {
    domain: string,
    name: string,
    variantName: string,
    version: string
}



export type Config = {
    product: ProductConfig,
    myPort: string,
    myDataPort: string,
    myUrl: string,
    myMFUrl: string,
    myDataUrl: string,
    serviceHubApiUrl: string,
    serviceHubMfUrl: string,
    dataHubApiUrl: string,
    semaphoresUrl: string,
    uiWebUrl: string,
    uiBffUrl: string,
    getHostUrl: (service: string, domain?: string, version?: string, variantName?: string) => string,
    getMFHostUrl: (service: string, domain?: string, version?: string, variantName?: string) => string,
    getDataHostUrl: (service: string, domain?: string, version?: string, variantName?: string) => string,
    getPort: (service: string, domain?: string, version?: string, variantName?: string) => number,
    getDataPort: (service: string, domain?: string, version?: string, variantName?: string) => number,
    clientCredentials?: ClientCredentialsConfig,
    jwtValidation?: JWTValidationConfig

}

const sharedconfig: Partial<Config> = {
    serviceHubApiUrl: HostName('serviceHub'),
    serviceHubMfUrl: HostName('serviceHub'),
    dataHubApiUrl: HostName('dataHub'),
    semaphoresUrl: HostName('msp_semaphores'),
    uiWebUrl: HostName('uiWeb'),
    uiBffUrl: HostName('uiBff'),

    getHostUrl: HostName,
    getMFHostUrl: MFHostName,
    getDataHostUrl: DataHostName,
    getPort: Port,
    getDataPort: (service: string, domain?: string, version?: string, variantName?: string) =>
         Port(service, domain, version, variantName, true)
}

function makeName(service: string, domain?: string, version?: string, variantName?: string) {
    return `${domain ? domain + '-' : ''}${service}${version ? '-' + version : ''}${variantName ? '-' + variantName : ''}`;
}

function Port(service: string, domain: string = '', version: string = '1.0.0', variantName: string = 'default', fordata: boolean = false): number {
    if (process.env[`${service.toUpperCase()}_HOST`]) {
        // when hostnames are in env vars, the system is out
        // of the local development environment and we should assume standard ports
        // and use of https
        return 443;
     }
    
    if ((Ports.core as any)?.[service] && (domain === '' || domain === 'core')) {
        return (Ports.core as any)[service];
    }
    
    const moduleName = makeName(service, domain, version, variantName);
    if ((Ports.modules as any)?.[moduleName]) {
        return !fordata ? (Ports.modules as any)[moduleName].services : (Ports.modules as any)[moduleName].data;
    }
    throw new Error(`No port found for service ${moduleName}. Please add to Ports configuration.`);
}

export function HostName(service: string, domain: string = '', version: string = '1.0.0', variantName: string = 'default'): string {
    let host = process.env[`${service.toUpperCase()}_HOST`];
    if (host) {
        return `https://${host}:443`;
    }

    if ((Ports.core as any)?.[service] && (domain === '' || domain === 'core')) {
        host = `http://localhost:${(Ports.core as any)[service]}`;
        return host;
    }
    
    const moduleName = makeName(service, domain, version, variantName);
    if ((Ports.modules as any)?.[moduleName]) {
        host = `http://localhost:${(Ports.modules as any)[moduleName].services}`;
        return host;
    }
    throw new Error(`No host found for service ${moduleName}. Please set environment variable ${service.toUpperCase()}_HOST or add to Ports configuration.`);
}

export function MFHostName(service: string, domain: string = '', version: string = '1.0.0', variantName: string = 'default'): string {
    let host = process.env[`${service.toUpperCase()}_MF_HOST`];
    if (host) {
        return `https://${host}:443`;
    }

    if ((Ports.core as any)?.[service] && (domain === '' || domain === 'core')) {
        host = `http://localhost:${(Ports.core as any)[`MF_${service}`]}`;
        return host;
    }

    const moduleName = makeName(service, domain, version, variantName);
    if ((Ports.modules as any)?.[moduleName]) {
        host = `http://localhost:${(Ports.modules as any)[moduleName].ui}`;
        return host;
    }
    throw new Error(`No host found for ui service ${moduleName}. Please set environment variable ${service.toUpperCase()}_MF_HOST or add to Ports configuration.`);
}

export function DataHostName(service: string, domain: string = '', version: string = '1.0.0', variantName: string = 'default'): string {
    let host = process.env[`${service.toUpperCase()}_DATA_HOST`];
    if (host) {
        return `https://${host}:443`;
    }

    if ((Ports.core as any)?.[service] && (domain === '' || domain === 'core')) {
        host = `http://localhost:${(Ports.core as any)[`DATA_${service}`]}`;
        return host;
    }

    const moduleName = makeName(service, domain, version, variantName);
    if ((Ports.modules as any)?.[moduleName]) {
        host = `http://localhost:${(Ports.modules as any)[moduleName].data}`;
        return host;
    }
    throw new Error(`No host found for data service ${moduleName}. Please set environment variable ${service.toUpperCase()}_DATA_HOST or add to Ports configuration.`);
}

export const SharedConfig = sharedconfig

export default SharedConfig