export type ActorEntityType = 'user' | 'system';

export type ActorGroupType =
  | 'team'
  | 'group'
  | 'division'
  | 'branch'
  | 'organization';

export type ActorType = ActorEntityType | ActorGroupType;

export type WorkTier1Type = 'file' | 'resource';

export type WorkTier2Type = 'case' | 'job' | 'process';

export type WorkTier3Type = 'taskGroup';

export type WorkTier4Type = 'task';

export type WorkType = WorkTier1Type | WorkTier2Type | WorkTier3Type | WorkTier4Type;

export type TierName = 'tier1' | 'tier2' | 'tier3' | 'tier4';

export type CoreLinkType =
  | 'isMemberOf'
  | 'isSubsetOf'
  | 'underAuthorityOf'
  | 'creates'
  | 'changes'
  | 'closes'
  | 'contributesTo';

export type NodeCategory = 'actor' | 'work';

export type VariantScopedNodeCategory = NodeCategory | 'actorVariant' | 'workVariant';

export type LinkRule = {
  linkType: CoreLinkType;
  from: NodeCategory;
  to: NodeCategory;
  description: string;
};

export const coreLinkRules: LinkRule[] = [
  {
    linkType: 'isMemberOf',
    from: 'actor',
    to: 'actor',
    description: 'Actor entity or group is a member of a group actor.',
  },
  {
    linkType: 'isSubsetOf',
    from: 'actor',
    to: 'actor',
    description: 'Group actor is a structural subset of another group actor.',
  },
  {
    linkType: 'underAuthorityOf',
    from: 'actor',
    to: 'actor',
    description: 'Actor or group is governed by another actor/group authority.',
  },
  {
    linkType: 'creates',
    from: 'actor',
    to: 'work',
    description: 'Actor creates work.',
  },
  {
    linkType: 'changes',
    from: 'actor',
    to: 'work',
    description: 'Actor changes work.',
  },
  {
    linkType: 'closes',
    from: 'actor',
    to: 'work',
    description: 'Actor closes work.',
  },
  {
    linkType: 'contributesTo',
    from: 'work',
    to: 'work',
    description: 'Work item contributes to another work item.',
  },
];

export const workTierByType: Record<WorkType, TierName> = {
  file: 'tier1',
  resource: 'tier1',
  case: 'tier2',
  job: 'tier2',
  process: 'tier2',
  taskGroup: 'tier3',
  task: 'tier4',
};

export type DomainVariantDefinition = {
  namespace: string;
  product?: string;
  name: string;
  extendsCoreType: ActorType | WorkType;
  category: NodeCategory;
  declaringManifestPath?: string;
  owningFeatureIds?: string[];
  notes?: string;
};

export type LinkPrototypeEndpoint = {
  category: VariantScopedNodeCategory;
  coreType?: ActorType | WorkType;
  variantName?: string;
};

export type LinkPrototypeValue = string | string[] | boolean | number | Record<string, unknown> | null;

export type LinkPrototypeAttributeMap = Record<string, LinkPrototypeValue>;

export type LinkPrototypeHookNames = {
  onCreate?: string[];
  onChange?: string[];
  onRemove?: string[];
};

export type LinkPrototypeDefinition = {
  namespace: string;
  product?: string;
  name: string;
  linkType: CoreLinkType;
  from: LinkPrototypeEndpoint;
  to: LinkPrototypeEndpoint;
  shortName?: string;
  longName?: string;
  icon?: string;
  description?: string;
  purpose?: string;
  featurePermissions?: string[];
  dataEntitlements?: string[];
  workObjectives?: string[];
  staticAttributes?: LinkPrototypeAttributeMap;
  hooks?: LinkPrototypeHookNames;
};

export type VariantOwnershipRule = {
  namespace: string;
  product?: string;
  variantName: string;
  category: NodeCategory;
  owningFeatureIds: string[];
  mutationRule: 'declaring-module-only';
};

export function isLinkAllowed(linkType: CoreLinkType, from: NodeCategory, to: NodeCategory): boolean {
  return coreLinkRules.some((rule) => rule.linkType === linkType && rule.from === from && rule.to === to);
}

export function getTierForWorkType(workType: WorkType): TierName {
  return workTierByType[workType];
}

export function getVariantNamespaceKey(namespace: string, product?: string): string {
  return product ? `${namespace}/${product}` : namespace;
}
