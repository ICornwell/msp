export type Stage1Artefact = {
  id: string;
  name: string;
  kind: string;
  description?: string;
  context?: string;
  provenance?: string;
};

export type Stage1Assertion = {
  id: string;
  name: string;
  kind: 'assertion';
  subject: string;
  predicate: string;
  object: string;
  polarity: 'positive' | 'negative' | 'uncertain';
  context?: string;
  provenance?: string;
};

export type Stage1Relation = {
  id: string;
  name: string;
  kind: 'relation';
  sourceId: string;
  relationType: 'hasAssertion' | 'relatesTo' | 'derivedFrom' | 'withInContext' | 'supports';
  targetId: string;
};

export function buildPamelaStage1Fixture() {
  const artefacts: Stage1Artefact[] = [
    { id: 'ent_Brightstar', name: 'CoverStar', kind: 'enterprise', description: 'Insurance enterprise', context: 'enterprise-context', provenance: 'fixture' },
    { id: 'prod_sme_package', name: 'SME Commercial Package', kind: 'product', description: 'Commercial package product', context: 'product-context', provenance: 'fixture' },
    { id: 'cover_property', name: 'Property Cover', kind: 'cover', description: 'Property insurance cover', context: 'product-context', provenance: 'fixture' },
    { id: 'cover_liability', name: 'Public Liability Cover', kind: 'cover', description: 'Liability insurance cover', context: 'product-context', provenance: 'fixture' },
    { id: 'team_underwriting', name: 'Underwriting Team', kind: 'team', description: 'Underwriting operations', context: 'org-context', provenance: 'fixture' },
  ];

  const assertions: Stage1Assertion[] = [
    { id: 'asrt_001', name: 'CoverStar has name', kind: 'assertion', subject: 'ent_Brightstar', predicate: 'hasName', object: 'CoverStar', polarity: 'positive', context: 'enterprise-context', provenance: 'fixture' },
    { id: 'asrt_002', name: 'SME package has name', kind: 'assertion', subject: 'prod_sme_package', predicate: 'hasName', object: 'SME Commercial Package', polarity: 'positive', context: 'product-context', provenance: 'fixture' },
    { id: 'asrt_003', name: 'Property cover has name', kind: 'assertion', subject: 'cover_property', predicate: 'hasName', object: 'Property Cover', polarity: 'positive', context: 'product-context', provenance: 'fixture' },
    { id: 'asrt_004', name: 'Liability cover has name', kind: 'assertion', subject: 'cover_liability', predicate: 'hasName', object: 'Public Liability Cover', polarity: 'positive', context: 'product-context', provenance: 'fixture' },
    { id: 'asrt_005', name: 'Underwriting team has name', kind: 'assertion', subject: 'team_underwriting', predicate: 'hasName', object: 'Underwriting Team', polarity: 'positive', context: 'org-context', provenance: 'fixture' },
    { id: 'asrt_006', name: 'Package includes property cover', kind: 'assertion', subject: 'prod_sme_package', predicate: 'includes', object: 'cover_property', polarity: 'positive', context: 'product-context', provenance: 'fixture' },
    { id: 'asrt_007', name: 'Package includes liability cover', kind: 'assertion', subject: 'prod_sme_package', predicate: 'includes', object: 'cover_liability', polarity: 'positive', context: 'product-context', provenance: 'fixture' },
    { id: 'asrt_008', name: 'Property cover is underwritten by team', kind: 'assertion', subject: 'cover_property', predicate: 'underwrittenBy', object: 'team_underwriting', polarity: 'positive', context: 'product-context', provenance: 'fixture' },
    { id: 'asrt_009', name: 'Liability cover is underwritten by team', kind: 'assertion', subject: 'cover_liability', predicate: 'underwrittenBy', object: 'team_underwriting', polarity: 'positive', context: 'product-context', provenance: 'fixture' },
    { id: 'asrt_010', name: 'Enterprise offers package', kind: 'assertion', subject: 'ent_Brightstar', predicate: 'offers', object: 'prod_sme_package', polarity: 'positive', context: 'enterprise-context', provenance: 'fixture' },
    { id: 'asrt_011', name: 'Underwriting team supports package', kind: 'assertion', subject: 'team_underwriting', predicate: 'supports', object: 'prod_sme_package', polarity: 'positive', context: 'org-context', provenance: 'fixture' },
    { id: 'asrt_012', name: 'Assertion six relates to package', kind: 'assertion', subject: 'asrt_006', predicate: 'relatesTo', object: 'prod_sme_package', polarity: 'positive', context: 'product-context', provenance: 'fixture' },
    { id: 'asrt_013', name: 'Assertion six derived from source', kind: 'assertion', subject: 'asrt_006', predicate: 'derivedFrom', object: 'policy-document-v1', polarity: 'positive', context: 'source-context', provenance: 'fixture' },
    { id: 'asrt_014', name: 'Assertion six with context', kind: 'assertion', subject: 'asrt_006', predicate: 'withInContext', object: 'renewal-cycle', polarity: 'positive', context: 'renewal-context', provenance: 'fixture' },
    { id: 'asrt_015', name: 'Assertion eight supports assertion six', kind: 'assertion', subject: 'asrt_008', predicate: 'supports', object: 'asrt_006', polarity: 'positive', context: 'product-context', provenance: 'fixture' },
    { id: 'asrt_016', name: 'Assertion nine supports assertion seven', kind: 'assertion', subject: 'asrt_009', predicate: 'supports', object: 'asrt_007', polarity: 'positive', context: 'product-context', provenance: 'fixture' },
    { id: 'asrt_017', name: 'Assertion twelve relates to assertion six', kind: 'assertion', subject: 'asrt_012', predicate: 'relatesTo', object: 'asrt_006', polarity: 'positive', context: 'product-context', provenance: 'fixture' },
    { id: 'asrt_018', name: 'Context relationship for renewal cycle', kind: 'assertion', subject: 'asrt_014', predicate: 'relatesTo', object: 'renewal-cycle', polarity: 'positive', context: 'renewal-context', provenance: 'fixture' },
    { id: 'asrt_019', name: 'Package qualified by SME', kind: 'assertion', subject: 'prod_sme_package', predicate: 'qualifiedBy', object: 'smE', polarity: 'positive', context: 'product-context', provenance: 'fixture' },
    { id: 'asrt_020', name: 'Property cover can cover property risk', kind: 'assertion', subject: 'cover_property', predicate: 'currentlyCovers', object: 'property-risk', polarity: 'positive', context: 'product-context', provenance: 'fixture' },
  ];

  const relations: Stage1Relation[] = [
    { id: 'rel_001', name: 'CoverStar has assertion 001', kind: 'relation', sourceId: 'ent_Brightstar', relationType: 'hasAssertion', targetId: 'asrt_001' },
    { id: 'rel_002', name: 'Package has assertion 006', kind: 'relation', sourceId: 'prod_sme_package', relationType: 'hasAssertion', targetId: 'asrt_006' },
    { id: 'rel_003', name: 'Package has assertion 007', kind: 'relation', sourceId: 'prod_sme_package', relationType: 'hasAssertion', targetId: 'asrt_007' },
    { id: 'rel_004', name: 'Package has assertion 019', kind: 'relation', sourceId: 'prod_sme_package', relationType: 'hasAssertion', targetId: 'asrt_019' },
    { id: 'rel_005', name: 'Assertion 006 relates to artefact product', kind: 'relation', sourceId: 'asrt_006', relationType: 'relatesTo', targetId: 'prod_sme_package' },
    { id: 'rel_006', name: 'Assertion 006 derived from source', kind: 'relation', sourceId: 'asrt_006', relationType: 'derivedFrom', targetId: 'policy-document-v1' },
    { id: 'rel_007', name: 'Assertion 006 with context', kind: 'relation', sourceId: 'asrt_006', relationType: 'withInContext', targetId: 'renewal-cycle' },
    { id: 'rel_008', name: 'Assertion 008 supports assertion 006', kind: 'relation', sourceId: 'asrt_008', relationType: 'supports', targetId: 'asrt_006' },
    { id: 'rel_009', name: 'Assertion 012 relates to assertion 006', kind: 'relation', sourceId: 'asrt_012', relationType: 'relatesTo', targetId: 'asrt_006' },
    { id: 'rel_010', name: 'Assertion 014 relates to renewal cycle', kind: 'relation', sourceId: 'asrt_014', relationType: 'relatesTo', targetId: 'renewal-cycle' },
  ];

  return {
    artefacts,
    assertions,
    relations,
  };
}
