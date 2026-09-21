import type { ManifestBuildResult, TypedManifest } from 'msp_svr_common';
import { makeManifest } from 'msp_svr_common';
import { withModule_TemplateActorWorkModel } from './modelDeclarations.js';
import { addModule_TemplateDataFeatures } from './dataFeatures.js';
import { addModule_TemplateActivityFeatures } from './activityFeatures.js';

function createModule_TemplateServiceBuilder(config?: any) {
  const service = withModule_TemplateActorWorkModel(
    makeManifest(config)
      .withNamespace('Module_Template')
      .withAllowedContexts(['*'])
      .withService('Module_TemplateResourceService')
  )
    .forProducts([{ domain: '*', name: '*', version: '*' }])
    .withAllowedContexts(['*'])
 
    addModule_TemplateActivityFeatures(service)

    addModule_TemplateDataFeatures(service);

    return service;
}

export function createModule_TemplateManifest(config?: any) {
  return createModule_TemplateServiceBuilder(config)
    .endService
    .build();
}

export function createTypedModule_TemplateManifest(config?: any): TypedManifest {
  return createModule_TemplateServiceBuilder(config)
    .endService
    .buildTyped();
}

export function createModule_TemplateManifestBundle(config?: any): ManifestBuildResult<TypedManifest> {
  return createModule_TemplateServiceBuilder(config)
    .endService
    .buildFull();
}

export type TypedModule_TemplateManifest = ReturnType<typeof createTypedModule_TemplateManifest>;



// for type testing
/* // Compile-time proof that typed projection exposes the named link variant.
export type Module_TemplateTypedLinkVariantProof =
  TypedModule_TemplateManifest['Services']['Module_TemplateResourceService_1_0_0_default']['TypeVariants']['Work']


export const Module_TemplateTypedLinkVariantProof2 =
  createTypedModule_TemplateManifest().Services.Module_TemplateResourceService_1_0_0_default.TypeVariants.Link.Module_TemplateOperatorCreatesInventoryCase_1_0_0_default


export const Module_TemplateTypedLinkVariantProof3 =
  createTypedModule_TemplateManifest().Services.Module_TemplateResourceService_1_0_0_default.ActivityFeatures
 */

