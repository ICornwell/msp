import type {
  ManifestServiceBuilder,
  TypedManifest,
  TypedServiceManifestSection,

} from 'msp_svr_common';
import { makeTypeVariants } from 'msp_svr_common';


const securityTypeVariants = makeTypeVariants('1.0.0') // version and variantName here will apply to all, unless overridden at the variant level
  .withActorTypeVariantSet()  // version and variantName here will apply to all actor variants, unless overridden at the variant level
    .withActorTypeVariant('securityOperator') // version and variantName here will apply to this variant
      .withProperties(
        {
          namespace: 'security',
          extendsType: 'user',
          shortName: 'Security operator',
          longName: 'Security platform operator',
          description: 'Human operator who requests, reviews, and acts on Security work.',
          purpose: 'Operate Security resources through governed platform activities.',
          featurePermissions: ['security.inventory.request', 'security.inventory.review'],
          dataEntitlements: ['security.account.read', 'security.region.read'],
          objectives: ['Request inventory', 'Review inventory results'],
          declaredByFeatures: ['SecurityResourcesFeature'],
          allowedContexts: ['AUTH'],
        })
    .withActorTypeVariant('securitySecurityReviewer')
      .withProperties(
        {
          namespace: 'security',
          extendsType: 'user',
          shortName: 'Security reviewer',
          longName: 'Security security reviewer',
          description: 'Approves or rejects scoped access for Security operational work.',
          purpose: 'Ensure Security access remains purposeful and least-privileged.',
          featurePermissions: ['security.inventory.approve'],
          dataEntitlements: ['security.account.read', 'security.region.read', 'security.access.review'],
          objectives: ['Approve access scope', 'Close access review'],
          declaredByFeatures: ['SecurityResourcesFeature'],
          allowedContexts: ['AUTH'],
        })
    .endActorTypeVariantSet
  .withWorkTypeVariantSet() // version and variantName here will apply to all work variants, unless overridden at the variant level
    .withWorkTypeVariant('securityAccountResource') // version and variantName here will apply to this variant
      .withProperties(
        {
          namespace: 'security',
          extendsType: 'resource',
          shortName: 'Security account',
          longName: 'Security account resource',
          description: 'Long-lived record describing an Security account boundary.',
          purpose: 'Represent the enduring account boundary used for Security work.',
          dataEntitlements: ['security.account.read'],
          objectives: ['Identify account scope', 'Anchor operational work'],
          declaredByFeatures: ['SecurityResourcesFeature'],
          allowedContexts: ['AUTH'],
        })
    .withWorkTypeVariant('securityAccountResource', '1.0.0')
      .withProperties(
        {
          namespace: 'security',
          extendsType: 'case',
          shortName: 'Inventory case',
          longName: 'Security inventory case',
          description: 'Long-running case coordinating discovery, review, and follow-up.',
          purpose: 'Track Security discovery work to a relatable operational outcome.',
          featurePermissions: ['security.inventory.request', 'security.inventory.review'],
          dataEntitlements: ['security.account.read', 'security.region.read'],
          objectives: ['Coordinate discovery work', 'Collect approvals', 'Review findings'],
          declaredByFeatures: ['SecurityResourcesFeature'],
          allowedContexts: ['AUTH'],
        })
    .withWorkTypeVariant('securityInventoryStepGroup', '1.0.0')
      .withProperties(
        {
          namespace: 'security',
          extendsType: 'taskGroup',
          shortName: 'Inventory step group',
          longName: 'Security inventory task group',
          description: 'Groups sequential approval and execution steps for one inventory run.',
          purpose: 'Organize the single-concurrent flow around one inventory attempt.',
          featurePermissions: ['security.inventory.request', 'security.inventory.approve'],
          objectives: ['Sequence approvals', 'Sequence execution'],
          declaredByFeatures: ['SecurityResourcesFeature'],
          allowedContexts: ['AUTH'],
        })
   
    .endWorkTypeVariantSet
  .withLinkTypeVariantSet() // version and variantName here will apply to all link variants, unless overridden at the variant level
    .withLinkTypeVariant('securityOperatorCreatesInventoryCase', '1.0.0') // version and variantName here will apply to this variant
    .withProperties(
      {
        namespace: 'security',
        linkType: 'creates',
        shortName: 'Request inventory',
        longName: 'Security operator requests inventory case',
        description: 'Prototype for opening Security inventory work from an operator context.',
        purpose: 'Start a relatable Security inventory outcome with explicit requester intent.',
        featurePermissions: ['security.inventory.request'],
        dataEntitlements: ['security.account.read', 'security.region.read'],
        objectives: ['Create inventory case'],
        declaredByFeatures: ['SecurityResourcesFeature'],
        allowedContexts: ['AUTH'],
        from: { kind: 'actorVariant', variantName: 'securityOperator', namespace: 'security' },
        to: { kind: 'workVariant', variantName: 'securityInventoryCase', namespace: 'security' },
        staticAttributes: {
          stage: 'requested',
          businessOutcome: 'understand Security estate',
        }
      }
    )
    .withLinkTypeVariant('securitySecurityReviewerClosesAccessReview', '1.0.0')
    .withProperties(
      {
        namespace: 'security',
        linkType: 'closes',
        shortName: 'Approve scope',
        longName: 'Security security reviewer closes access review',
        description: 'Prototype for finalizing an Security access review step.',
        purpose: 'Close scoped approval work before execution proceeds.',
        featurePermissions: ['security.inventory.approve'],
        dataEntitlements: ['security.access.review'],
        objectives: ['Complete access review'],
        declaredByFeatures: ['SecurityResourcesFeature'],
        allowedContexts: ['AUTH'],
        from: { kind: 'actorVariant', variantName: 'securitySecurityReviewer', namespace: 'security' },
        to: { kind: 'workVariant', variantName: 'securityInventoryTaskGroup', namespace: 'security' },
        staticAttributes: {
          reviewDecision: 'approved',
        },
        lifecycleActivities: {
          onCreate: ['security/reviewInventoryExecution/1.0.0'],
        }
      })
    
    .endLinkTypeVariantSet
  .endTypeVariants;





export function withSecurityActorWorkModel<
  TManifest extends TypedManifest,
  TService extends TypedServiceManifestSection,
>(builder: ManifestServiceBuilder<TManifest, TService>) {
  return builder.withTypeVariants(securityTypeVariants);
}
