import { makeManifest } from 'msp_common';
export function createActorworkManifest(config) {
    const manifest = makeManifest(config)
        .withAllowedContexts(['*'])
        .addService()
        .forProduct({
        domain: 'actorwork',
        name: 'Actor Work Management',
        version: '1.0.0',
        variantName: 'default'
    })
        .withAllowedContexts(['*'])
        .addUiFeature()
        .withRemoteName('actorwork/UserProfileFeature')
        .withAllowedContexts(['*'])
        .forProduct({
        domain: 'actorwork',
        name: 'User Profile UI',
        version: '1.0.0'
    })
        .endUiFeature
        .endService
        .build();
    return manifest;
}
//# sourceMappingURL=manifest.js.map