export type ActorworkConfig = {
    port: number;
    myUrl: string;
    uiRemoteUrl: string;
    serviceHubUrl: string;
    service: {
        name: string;
        domain: string;
        version: string;
    };
};
export declare const config: ActorworkConfig;
export default config;
