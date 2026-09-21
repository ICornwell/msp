import { beforeAll, describe, expect, it } from 'vitest';
import { config as loadEnvironment } from 'dotenv';
import { ReadData, runDataActivity, setConfig } from 'msp_svr_common';

import { resolveConfig } from '../../src/dataActivityElements/config.js';
import { SemanticArtefactAssertionsView } from '../../src/data/graph/index.js';

loadEnvironment();

describe('PAMELA semantic ISR persistence', () => {
  beforeAll(() => {
    setConfig(resolveConfig());
  });

  it('writes and reads an assertion with Artefact subject and object endpoints', async () => {
    const suffix = String(Date.now());
    const enterpriseName = `isr_brightstar_${suffix}`;
    const toolName = `isr_rating_tool_${suffix}`;
    const assertionName = `isr_supports_${suffix}`;
    const enterprise = {
      name: enterpriseName,
      kind: 'enterprise',
      __businessKey: enterpriseName,
    };
    const tool = {
      name: toolName,
      kind: 'tool',
      __businessKey: toolName,
    };
    const data: any = {
      ...enterprise,
      assertions: [{
        name: assertionName,
        kind: 'assertion',
        subject: enterpriseName,
        predicate: 'supports',
        object: toolName,
        polarity: 'positive',
        subjectArtefact: enterprise,
        objectArtefact: tool,
      }],
    };

    const writeResponse = await runDataActivity(
      'pamela',
      'writePamelaSemanticAssertions',
      '1.0.0',
      'default',
      data,
      { timeoutMs: 120_000 },
    );

    expect(writeResponse.success, writeResponse.message).toBe(true);
    expect(writeResponse.result).toBeDefined();

    const readResponse = await ReadData(SemanticArtefactAssertionsView, enterprise.name, {
      useBusinessKey: true,
      timeoutMs: 120_000,
    });

    expect(readResponse?.success, readResponse?.message).toBe(true);
    expect(readResponse?.result?.data?.content).toMatchObject({
      name: enterprise.name,
      assertions: [expect.objectContaining({
        subjectArtefact: expect.objectContaining({ name: enterprise.name }),
        objectArtefact: expect.objectContaining({ name: tool.name }),
      })],
    });
  }, 180_000);
});
