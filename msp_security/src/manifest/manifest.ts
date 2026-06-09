import { makeManifest } from 'msp_svr_common';
import { withSecurityActorWorkModel } from './modelDeclarations.js';

function createSecurityBuilder(config?: any) {
  return withSecurityActorWorkModel(
    makeManifest(config)
      .withNamespace('security')
      .withAllowedContexts(['*'])
      .withService('msp_security')
  )
    .forProducts([{ domain: '*', name: '*', version: '*' }])
    .withAllowedContexts(['*'])
    .withActivityFeature('executeProxyFlow', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endActivityFeature
    .withActivityFeature('issueAccessCapability', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endActivityFeature
    .withActivityFeature('storeServiceSecret', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endActivityFeature
    .withActivityFeature('retrieveServiceSecret', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endActivityFeature
    .withActivityFeature('getEncryptionPublicKey', '1.0.0', 'default')
      .withAllowedContexts(['*'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endActivityFeature

}

export function createSecurityManifest(config?: any) {
  return createSecurityBuilder(config)
    .endService
    .build();
}

export function createTypedSecurityManifest(config?: any) {
  return createSecurityBuilder(config)
    .endService
    .buildTyped();
}

export function createSecurityManifestBundle(config?: any) {
  return createSecurityBuilder(config)
    .endService
    .buildFull();
}




