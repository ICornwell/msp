import { makeManifest } from 'msp_common';

export function createActorworkManifest(config?: any) {
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
      .endService
    .build();

  return manifest;
}
