import { makeManifest } from 'msp_svr_common';
import { withSecurityActorWorkModel } from './modelDeclarations.js';

function createSecurityBuilder(config?: any) {
  return withSecurityActorWorkModel(
    makeManifest(config)
      .withAllowedContexts(['*'])
      .withService('msp_security')
  )
    .forProducts([{ domain: '*', name: '*', version: '*' }])
    .withAllowedContexts(['*'])
   
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




