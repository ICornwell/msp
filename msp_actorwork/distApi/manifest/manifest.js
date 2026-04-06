import { makeManifest } from 'msp_svr_common';
export function createActorworkManifest(config) {
    const manifest = makeManifest(config)
        .withAllowedContexts(['*'])
        .addService('ActorWork-UserService')
        .forProducts([{
            domain: '*',
            name: '*',
            version: '*'
        }])
        .withAllowedContexts(['*'])
        .addUiFeature('UserProfileFeature')
        .withRemoteName('actorwork_remoteEntry.js')
        .withAllowedContexts(['*'])
        .forProducts([{
            domain: '*',
            name: '*',
            version: '*'
        }])
        .endUiFeature
        .addActivityFeature('getUserProfileData', '1.0.0', 'default')
        .withAllowedContexts(['*'])
        .forProducts([{
            domain: '*',
            name: '*',
            version: '*'
        }])
        .endActivityFeature
        .endService
        .build();
    return manifest;
}
//# sourceMappingURL=manifest.js.map