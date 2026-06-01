import { makeManifest } from 'msp_svr_common';

export function createActorworkManifest(config?: any) {
  const manifest = makeManifest(config)
    .withNamespace('actorwork')
    .withAllowedContexts(['*'])
    .withService('ActorWork-UserService')
      
      .forProducts([{
          domain: '*',
          name: '*',
          version: '*'
        }])
      .withAllowedContexts(['*'])
      .withUiFeature('UserProfileFeature')
        .withRemoteName('actorwork_remoteEntry.js')
        .withAllowedContexts(['*'])
        .forProducts([{
          domain: '*',
          name: '*',
          version: '*'
        }])
        .endUiFeature
      .withUiFeature('UserWorkListFeature')
        .withRemoteName('actorwork_remoteEntry.js')
        .withAllowedContexts(['*'])
        .forProducts([{
          domain: '*',
          name: '*',
          version: '*'
        }])
        .endUiFeature
      .withActivityFeature('getUserProfileData', '1.0.0', 'default')
        .withAllowedContexts(['*'])
        .forProducts([{
          domain: '*',
          name: '*',
          version: '*'
        }])
        .endActivityFeature
      .withActivityFeature('getUserWorkListData', '1.0.0', 'default')
        .withAllowedContexts(['AUTH'])
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
