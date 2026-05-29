import type {
  ManifestServiceBuilder,
  TypedManifest,
  TypedServiceManifestSection,

} from 'msp_svr_common';
import { makeTypeVariants } from 'msp_svr_common';


const awsTypeVariants = makeTypeVariants('1.0.0') // version and variantName here will apply to all, unless overridden at the variant level
  .withActorTypeVariantSet()  // version and variantName here will apply to all actor variants, unless overridden at the variant level
    .withActorTypeVariant('awsOperator') // version and variantName here will apply to this variant
      .withProperties(
        {
          namespace: 'aws',
          extendsType: 'user',
          shortName: 'AWS operator',
          longName: 'AWS platform operator',
          description: 'Human operator who requests, reviews, and acts on AWS work.',
          purpose: 'Operate AWS resources through governed platform activities.',
          featurePermissions: ['aws.inventory.request', 'aws.inventory.review'],
          dataEntitlements: ['aws.account.read', 'aws.region.read'],
          objectives: ['Request inventory', 'Review inventory results'],
          declaredByFeatures: ['AwsResourcesFeature'],
          allowedContexts: ['AUTH'],
        })
    .withActorTypeVariant('awsSecurityReviewer')
      .withProperties(
        {
          namespace: 'aws',
          extendsType: 'user',
          shortName: 'Security reviewer',
          longName: 'AWS security reviewer',
          description: 'Approves or rejects scoped access for AWS operational work.',
          purpose: 'Ensure AWS access remains purposeful and least-privileged.',
          featurePermissions: ['aws.inventory.approve'],
          dataEntitlements: ['aws.account.read', 'aws.region.read', 'aws.access.review'],
          objectives: ['Approve access scope', 'Close access review'],
          declaredByFeatures: ['AwsResourcesFeature'],
          allowedContexts: ['AUTH'],
        })
    .endActorTypeVariantSet
  .withWorkTypeVariantSet() // version and variantName here will apply to all work variants, unless overridden at the variant level
    .withWorkTypeVariant('awsAccountResource') // version and variantName here will apply to this variant
      .withProperties(
        {
          namespace: 'aws',
          extendsType: 'resource',
          shortName: 'AWS account',
          longName: 'AWS account resource',
          description: 'Long-lived record describing an AWS account boundary.',
          purpose: 'Represent the enduring account boundary used for AWS work.',
          dataEntitlements: ['aws.account.read'],
          objectives: ['Identify account scope', 'Anchor operational work'],
          declaredByFeatures: ['AwsResourcesFeature'],
          allowedContexts: ['AUTH'],
        })
    .withWorkTypeVariant('awsAccountResource', '1.0.0')
      .withProperties(
        {
          namespace: 'aws',
          extendsType: 'case',
          shortName: 'Inventory case',
          longName: 'AWS inventory case',
          description: 'Long-running case coordinating discovery, review, and follow-up.',
          purpose: 'Track AWS discovery work to a relatable operational outcome.',
          featurePermissions: ['aws.inventory.request', 'aws.inventory.review'],
          dataEntitlements: ['aws.account.read', 'aws.region.read'],
          objectives: ['Coordinate discovery work', 'Collect approvals', 'Review findings'],
          declaredByFeatures: ['AwsResourcesFeature'],
          allowedContexts: ['AUTH'],
        })
    .withWorkTypeVariant('awsInventoryStepGroup', '1.0.0')
      .withProperties(
        {
          namespace: 'aws',
          extendsType: 'taskGroup',
          shortName: 'Inventory step group',
          longName: 'AWS inventory task group',
          description: 'Groups sequential approval and execution steps for one inventory run.',
          purpose: 'Organize the single-concurrent flow around one inventory attempt.',
          featurePermissions: ['aws.inventory.request', 'aws.inventory.approve'],
          objectives: ['Sequence approvals', 'Sequence execution'],
          declaredByFeatures: ['AwsResourcesFeature'],
          allowedContexts: ['AUTH'],
        })
    .withWorkTypeVariant('awsListEKSClusters', '1.0.0')
      .withProperties(
        {
          namespace: 'aws',
          extendsType: 'task',
          shortName: 'List EKS clusters',
          longName: 'AWS list EKS clusters task',
          description: 'Short-running execution task for EKS cluster inventory.',
          purpose: 'Execute one read-only AWS inventory step.',
          featurePermissions: ['aws.inventory.execute'],
          dataEntitlements: ['aws.eks.read'],
          objectives: ['Call EKS APIs', 'Normalize results', 'Attach audit trace'],
          declaredByFeatures: ['AwsResourcesFeature'],
          allowedContexts: ['AUTH'],
        },
      )
    .endWorkTypeVariantSet
  .withLinkTypeVariantSet() // version and variantName here will apply to all link variants, unless overridden at the variant level
    .withLinkTypeVariant('awsOperatorCreatesInventoryCase', '1.0.0') // version and variantName here will apply to this variant
    .withProperties(
      {
        namespace: 'aws',
        linkType: 'creates',
        shortName: 'Request inventory',
        longName: 'AWS operator requests inventory case',
        description: 'Prototype for opening AWS inventory work from an operator context.',
        purpose: 'Start a relatable AWS inventory outcome with explicit requester intent.',
        featurePermissions: ['aws.inventory.request'],
        dataEntitlements: ['aws.account.read', 'aws.region.read'],
        objectives: ['Create inventory case'],
        declaredByFeatures: ['AwsResourcesFeature'],
        allowedContexts: ['AUTH'],
        from: { kind: 'actorVariant', variantName: 'awsOperator', namespace: 'aws' },
        to: { kind: 'workVariant', variantName: 'awsInventoryCase', namespace: 'aws' },
        staticAttributes: {
          stage: 'requested',
          businessOutcome: 'understand AWS estate',
        }
      }
    )
    .withLinkTypeVariant('awsSecurityReviewerClosesAccessReview', '1.0.0')
    .withProperties(
      {
        namespace: 'aws',
        linkType: 'closes',
        shortName: 'Approve scope',
        longName: 'AWS security reviewer closes access review',
        description: 'Prototype for finalizing an AWS access review step.',
        purpose: 'Close scoped approval work before execution proceeds.',
        featurePermissions: ['aws.inventory.approve'],
        dataEntitlements: ['aws.access.review'],
        objectives: ['Complete access review'],
        declaredByFeatures: ['AwsResourcesFeature'],
        allowedContexts: ['AUTH'],
        from: { kind: 'actorVariant', variantName: 'awsSecurityReviewer', namespace: 'aws' },
        to: { kind: 'workVariant', variantName: 'awsInventoryTaskGroup', namespace: 'aws' },
        staticAttributes: {
          reviewDecision: 'approved',
        },
        lifecycleActivities: {
          onCreate: ['aws/reviewInventoryExecution/1.0.0'],
        }
      })
    .withLinkTypeVariant('awsListEksClustersTaskContributesToInventoryCase', '1.0.0')
    .withProperties(
      {
        namespace: 'aws',
        linkType: 'contributesTo',
        shortName: 'Cluster scan',
        longName: 'EKS cluster scan contributes to inventory case',
        description: 'Prototype linking one execution step to its broader AWS inventory outcome.',
        purpose: 'Keep execution trace tied to business-visible work.',
        featurePermissions: ['aws.inventory.execute'],
        dataEntitlements: ['aws.eks.read'],
        objectives: ['Collect cluster data', 'Support case outcome'],
        declaredByFeatures: ['AwsResourcesFeature'],
        allowedContexts: ['AUTH'],
        from: { kind: 'workVariant', variantName: 'awsListEksClustersTask', namespace: 'aws' },
        to: { kind: 'workVariant', variantName: 'awsInventoryCase', namespace: 'aws' },
        staticAttributes: {
          executionKind: 'inventory',
          targetResourceKind: 'eksCluster',
        },
        lifecycleActivities: {
          onCreate: ['aws/prepareInventoryExecution/1.0.0'],
          onRemove: ['aws/revokeInventoryExecution/1.0.0'],
        },
      }
    )
    .endLinkTypeVariantSet
  .endTypeVariants;





export function withAwsActorWorkModel<
  TManifest extends TypedManifest,
  TService extends TypedServiceManifestSection,
>(builder: ManifestServiceBuilder<TManifest, TService>) {
  return builder.withTypeVariants(awsTypeVariants);
}
