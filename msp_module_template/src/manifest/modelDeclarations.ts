import type {
  ManifestServiceBuilder,
  TypedManifest,
  TypedServiceManifestSection,

} from 'msp_svr_common';
import { makeTypeVariants } from 'msp_svr_common';


const moduleXTypeVariants = makeTypeVariants('1.0.0') // version and variantName here will apply to all, unless overridden at the variant level
  .withActorTypeVariantSet()  // version and variantName here will apply to all actor variants, unless overridden at the variant level
    .withActorTypeVariant('moduleXOperator') // version and variantName here will apply to this variant
      .withProperties(
        {
          namespace: 'moduleX',
          extendsType: 'user',
          shortName: 'ModuleX operator',
          longName: 'ModuleX platform operator',
          description: 'Human operator who requests, reviews, and acts on ModuleX work.',
          purpose: 'Operate ModuleX resources through governed platform activities.',
          featurePermissions: ['moduleX.inventory.request', 'moduleX.inventory.review'],
          dataEntitlements: ['moduleX.account.read', 'moduleX.region.read'],
          objectives: ['Request inventory', 'Review inventory results'],
          declaredByFeatures: ['ModuleXResourcesFeature'],
          allowedContexts: ['AUTH'],
        })
    .withActorTypeVariant('moduleXSecurityReviewer')
      .withProperties(
        {
          namespace: 'moduleX',
          extendsType: 'user',
          shortName: 'Security reviewer',
          longName: 'ModuleX security reviewer',
          description: 'Approves or rejects scoped access for ModuleX operational work.',
          purpose: 'Ensure ModuleX access remains purposeful and least-privileged.',
          featurePermissions: ['moduleX.inventory.approve'],
          dataEntitlements: ['moduleX.account.read', 'moduleX.region.read', 'moduleX.access.review'],
          objectives: ['Approve access scope', 'Close access review'],
          declaredByFeatures: ['ModuleXResourcesFeature'],
          allowedContexts: ['AUTH'],
        })
    .endActorTypeVariantSet
  .withWorkTypeVariantSet() // version and variantName here will apply to all work variants, unless overridden at the variant level
    .withWorkTypeVariant('moduleXAccountResource') // version and variantName here will apply to this variant
      .withProperties(
        {
          namespace: 'moduleX',
          extendsType: 'resource',
          shortName: 'ModuleX account',
          longName: 'ModuleX account resource',
          description: 'Long-lived record describing an ModuleX account boundary.',
          purpose: 'Represent the enduring account boundary used for ModuleX work.',
          dataEntitlements: ['moduleX.account.read'],
          objectives: ['Identify account scope', 'Anchor operational work'],
          declaredByFeatures: ['ModuleXResourcesFeature'],
          allowedContexts: ['AUTH'],
        })
    .withWorkTypeVariant('moduleXAccountResource', '1.0.0')
      .withProperties(
        {
          namespace: 'moduleX',
          extendsType: 'case',
          shortName: 'Inventory case',
          longName: 'ModuleX inventory case',
          description: 'Long-running case coordinating discovery, review, and follow-up.',
          purpose: 'Track ModuleX discovery work to a relatable operational outcome.',
          featurePermissions: ['moduleX.inventory.request', 'moduleX.inventory.review'],
          dataEntitlements: ['moduleX.account.read', 'moduleX.region.read'],
          objectives: ['Coordinate discovery work', 'Collect approvals', 'Review findings'],
          declaredByFeatures: ['ModuleXResourcesFeature'],
          allowedContexts: ['AUTH'],
        })
    .withWorkTypeVariant('moduleXInventoryStepGroup', '1.0.0')
      .withProperties(
        {
          namespace: 'moduleX',
          extendsType: 'taskGroup',
          shortName: 'Inventory step group',
          longName: 'ModuleX inventory task group',
          description: 'Groups sequential approval and execution steps for one inventory run.',
          purpose: 'Organize the single-concurrent flow around one inventory attempt.',
          featurePermissions: ['moduleX.inventory.request', 'moduleX.inventory.approve'],
          objectives: ['Sequence approvals', 'Sequence execution'],
          declaredByFeatures: ['ModuleXResourcesFeature'],
          allowedContexts: ['AUTH'],
        })
    
    .endWorkTypeVariantSet
  .endTypeVariants;





export function withModuleXActorWorkModel<
  TManifest extends TypedManifest,
  TService extends TypedServiceManifestSection,
>(builder: ManifestServiceBuilder<TManifest, TService>) {
  return builder.withTypeVariants(moduleXTypeVariants);
}
