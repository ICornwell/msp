import { Ports } from './ports.js';

const sharedconfig = {
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