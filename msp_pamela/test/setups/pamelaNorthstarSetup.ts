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

type PamelaNorthstarFixture = {
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

export async function loadPamelaNorthstarViewData(): Promise<ArtefactAssertionsViewType[]> {
  const fixture = await loadResourceJson<PamelaNorthstarFixture>(
    'pamela_northstar_fixture_v0_1.json',
  );
  const assertionsBySubject = new Map<string, PamelaAssertionData[]>();

  for (const assertion of fixture.assertions) {
    const subjectId = assertion.subject.id;
    if (!subjectId) continue;

    const subjectAssertions = assertionsBySubject.get(subjectId) ?? [];
    subjectAssertions.push(toAssertionData(assertion));
    assertionsBySubject.set(subjectId, subjectAssertions);
  }

  return fixture.artefacts.map((artefact) => {
    const assertions = assertionsBySubject.get(artefact.id) ?? [];

    return {
      name: artefact.id,
      kind: 'artefact',
      description: artefact.description,
      context: undefined,
      provenance: 'pamela_northstar_fixture_v0_1',
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
