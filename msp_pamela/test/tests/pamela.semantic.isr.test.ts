import { describe, expect, it } from 'vitest';
import { prepareIsrData } from 'msp_data_common';
import {
  SemanticArtefactAssertionsView,
  pamelaArtefactObject,
  pamelaAssertionObject,
} from '../../src/data/graph/index.js';

describe('PAMELA semantic Assertion endpoints and ISR transport', () => {
  it('models subject and object as Artefact branches and preserves shared identity', () => {
    const enterprise = {
      name: 'ent_brightstar',
      kind: 'enterprise',
      __businessKey: 'ent_brightstar',
    };
    const assertion = {
      name: 'asrt_supports',
      kind: 'assertion',
      subject: 'ent_brightstar',
      predicate: 'supports',
      object: 'tool_platform',
      polarity: 'positive',
      subjectArtefact: enterprise,
      objectArtefact: {
        name: 'tool_platform',
        kind: 'tool',
        __businessKey: 'tool_platform',
      },
    };
    (enterprise as any).assertions = [assertion];
    const data = enterprise;

    const prepared = prepareIsrData(SemanticArtefactAssertionsView, data as any) as any;

    expect(SemanticArtefactAssertionsView.rootElement.subElements?.[0].subElements)
      .toHaveLength(2);
    expect(prepared.assertions[0].subjectArtefact).toEqual({
      __mspReference: { object: pamelaArtefactObject.name, businessKey: 'ent_brightstar' },
    });
    expect(prepared.assertions[0].objectArtefact).toMatchObject({
      name: 'tool_platform',
      kind: 'tool',
    });
    expect(pamelaAssertionObject.name).toBe('pamelaAssertion');
    expect(JSON.stringify(prepared)).toBeDefined();
  });
});
