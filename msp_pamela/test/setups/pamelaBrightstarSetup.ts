import type { ArtefactAssertionsViewType } from '../../src/data/graph/index.js';
import { loadResourceJson } from './resourceLoader.js';

type FixtureArtefact = {
  id: string;
  preferred_label: string;
  kind: string;
  description?: string;
};

type FixtureReference = {
  kind: 'artefact' | 'assertion' | 'literal';
  id?: string;
  value?: string;
};

type FixtureAssertion = {
  id: string;
  subject: FixtureReference;
  predicate: string;
  object: FixtureReference;
  polarity: 'positive' | 'negative';
};

type PamelaBrightstarFixture = {
  artefacts: FixtureArtefact[];
  assertions: FixtureAssertion[];
};

type PamelaAssertionData = {
  name: string;
  kind: 'assertion';
  description?: string;
  subject: string;
  predicate: string;
  object: string;
  polarity: 'positive' | 'negative';
};

function referenceValue(reference: FixtureReference): string {
  return reference.kind === 'literal'
    ? reference.value ?? ''
    : reference.id ?? '';
}

function toAssertionData(assertion: FixtureAssertion): PamelaAssertionData {
  return {
    name: assertion.id,
    kind: 'assertion',
    subject: referenceValue(assertion.subject),
    predicate: assertion.predicate,
    object: referenceValue(assertion.object),
    polarity: assertion.polarity,
  };
}

const broadContextByKind: Record<string, string> = {
  Classifier: 'ctx_new_business',
  'Business Product': 'ctx_new_business',
  'Application or Service': 'ctx_stp',
  'Integration Artefact': 'ctx_stp',
  'Policy or Control': 'ctx_renewal',
  'Business Event': 'ctx_endorsement',
  'Business Information Artefact': 'ctx_referred',
  'External Service': 'ctx_referred',
  'Cost Factor': 'ctx_renewal',
  Context: 'ctx_new_business',
  'Source or Evidence': 'ctx_new_business',
};

function buildExtractedContextAssertions(artefact: FixtureArtefact): PamelaAssertionData[] {
  const broadContextId = broadContextByKind[artefact.kind] ?? 'ctx_new_business';
  const localContext = [
    `${artefact.preferred_label} was identified in the Brightstar enterprise analysis as a ${artefact.kind.toLowerCase()}.`,
    artefact.description ?? `The source material describes how ${artefact.preferred_label} participates in the operating model.`,
  ].join(' ');

  return [
    {
      name: `ctx_broad_${artefact.id}`,
      kind: 'assertion',
      subject: artefact.id,
      predicate: 'withInContext',
      object: broadContextId,
      polarity: 'positive',
    },
    {
      name: `ctx_local_${artefact.id}`,
      kind: 'assertion',
      subject: artefact.id,
      predicate: 'withInContext',
      object: localContext,
      polarity: 'positive',
    },
  ];
}

export async function loadPamelaBrightstarViewData(): Promise<ArtefactAssertionsViewType[]> {
  const fixture = await loadResourceJson<PamelaBrightstarFixture>(
    'pamela_brightstar_fixture_v0_1.json',
  );
  const assertionsBySubject = new Map<string, PamelaAssertionData[]>();

  for (const assertion of fixture.assertions) {
    const subjectId = assertion.subject.id;
    if (!subjectId) continue;

    const subjectAssertions = assertionsBySubject.get(subjectId) ?? [];
    subjectAssertions.push(toAssertionData(assertion));
    assertionsBySubject.set(subjectId, subjectAssertions);
  }

  for (const artefact of fixture.artefacts) {
    const subjectAssertions = assertionsBySubject.get(artefact.id) ?? [];
    subjectAssertions.push(...buildExtractedContextAssertions(artefact));
    assertionsBySubject.set(artefact.id, subjectAssertions);
  }

  return fixture.artefacts.map((artefact) => {
    const assertions = assertionsBySubject.get(artefact.id) ?? [];

    return {
      name: artefact.id,
      kind: 'artefact',
      description: artefact.description,
      context: undefined,
      provenance: 'pamela_brightstar_fixture_v0_1',
      assertions: assertions.map((assertion) => {
        const assertionAboutAssertion = assertionsBySubject.get(assertion.name) ?? [];

        return {
          ...assertion,
          assertionsAboutAssertion: assertionAboutAssertion,
          relatedAssertions: [],
        };
      }),
    };
  }) as ArtefactAssertionsViewType[];
}
