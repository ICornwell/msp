import type {
  ManifestServiceBuilder,
  TypedManifest,
  TypedServiceManifestSection,

} from 'msp_svr_common';
import { makeTypeVariants } from 'msp_svr_common';


const lloydsMsgTypeVariants = makeTypeVariants('1.0.0') // version and variantName here will apply to all, unless overridden at the variant level
  .withActorTypeVariantSet()  // version and variantName here will apply to all actor variants, unless overridden at the variant level
    .withActorTypeVariant('lloydsMsgOperator') // version and variantName here will apply to this variant
      .withProperties(
        {
          namespace: 'lloydsMsg',
          extendsType: 'user',
          shortName: 'LloydsMsg operator',
          longName: 'LloydsMsg platform operator',
          description: 'Human operator who requests, reviews, and acts on LloydsMsg work.',
          purpose: 'Operate LloydsMsg resources through governed platform activities.',
          featurePermissions: ['lloydsMsg.inventory.request', 'lloydsMsg.inventory.review'],
          dataEntitlements: ['lloydsMsg.account.read', 'lloydsMsg.region.read'],
          objectives: ['Request inventory', 'Review inventory results'],
          declaredByFeatures: ['LloydsMsgResourcesFeature'],
          allowedContexts: ['AUTH'],
        })
    .withActorTypeVariant('lloydsMsgSecurityReviewer')
      .withProperties(
        {
          namespace: 'lloydsMsg',
          extendsType: 'user',
          shortName: 'Security reviewer',
          longName: 'LloydsMsg security reviewer',
          description: 'Approves or rejects scoped access for LloydsMsg operational work.',
          purpose: 'Ensure LloydsMsg access remains purposeful and least-privileged.',
          featurePermissions: ['lloydsMsg.inventory.approve'],
          dataEntitlements: ['lloydsMsg.account.read', 'lloydsMsg.region.read', 'lloydsMsg.access.review'],
          objectives: ['Approve access scope', 'Close access review'],
          declaredByFeatures: ['LloydsMsgResourcesFeature'],
          allowedContexts: ['AUTH'],
        })
    .endActorTypeVariantSet
  .withWorkTypeVariantSet() // version and variantName here will apply to all work variants, unless overridden at the variant level
    .withWorkTypeVariant('lloydsMsgAccountResource') // version and variantName here will apply to this variant
      .withProperties(
        {
          namespace: 'lloydsMsg',
          extendsType: 'resource',
          shortName: 'LloydsMsg account',
          longName: 'LloydsMsg account resource',
          description: 'Long-lived record describing an LloydsMsg account boundary.',
          purpose: 'Represent the enduring account boundary used for LloydsMsg work.',
          dataEntitlements: ['lloydsMsg.account.read'],
          objectives: ['Identify account scope', 'Anchor operational work'],
          declaredByFeatures: ['LloydsMsgResourcesFeature'],
          allowedContexts: ['AUTH'],
        })
    .withWorkTypeVariant('lloydsMsgAccountResource', '1.0.0')
      .withProperties(
        {
          namespace: 'lloydsMsg',
          extendsType: 'case',
          shortName: 'Inventory case',
          longName: 'LloydsMsg inventory case',
          description: 'Long-running case coordinating discovery, review, and follow-up.',
          purpose: 'Track LloydsMsg discovery work to a relatable operational outcome.',
          featurePermissions: ['lloydsMsg.inventory.request', 'lloydsMsg.inventory.review'],
          dataEntitlements: ['lloydsMsg.account.read', 'lloydsMsg.region.read'],
          objectives: ['Coordinate discovery work', 'Collect approvals', 'Review findings'],
          declaredByFeatures: ['LloydsMsgResourcesFeature'],
          allowedContexts: ['AUTH'],
        })
    .withWorkTypeVariant('lloydsMsgInventoryStepGroup', '1.0.0')
      .withProperties(
        {
          namespace: 'lloydsMsg',
          extendsType: 'taskGroup',
          shortName: 'Inventory step group',
          longName: 'LloydsMsg inventory task group',
          description: 'Groups sequential approval and execution steps for one inventory run.',
          purpose: 'Organize the single-concurrent flow around one inventory attempt.',
          featurePermissions: ['lloydsMsg.inventory.request', 'lloydsMsg.inventory.approve'],
          objectives: ['Sequence approvals', 'Sequence execution'],
          declaredByFeatures: ['LloydsMsgResourcesFeature'],
          allowedContexts: ['AUTH'],
        })
    
    .endWorkTypeVariantSet
  .endTypeVariants;





export function withLloydsMsgActorWorkModel<
  TManifest extends TypedManifest,
  TService extends TypedServiceManifestSection,
>(builder: ManifestServiceBuilder<TManifest, TService>) {
  return builder.withTypeVariants(lloydsMsgTypeVariants);
}
