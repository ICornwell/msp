import { beforeAll, describe, expect, it } from 'vitest';
import { config as loadEnvironment } from 'dotenv';
import { ReadData, runDataActivity, setConfig } from 'msp_svr_common';

import { resolveConfig } from '../../src/dataActivityElements/config.js';
import { ArtefactAssertionsView } from '../../src/data/graph/index.js';
import { loadPamelaBrightstarViewData } from '../setups/pamelaBrightstarSetup.js';

loadEnvironment();

describe('PAMELA Brightstar backend write', () => {
  let viewData: Awaited<ReturnType<typeof loadPamelaBrightstarViewData>>;

  beforeAll(async () => {
    setConfig(resolveConfig());
    viewData = await loadPamelaBrightstarViewData();
  });

  it('writes every fixture artefact and its assertions through the data activity', async () => {
    expect(viewData).toHaveLength(89);
    expect(viewData[0]).toMatchObject({
      name: 'cls_enterprise',
      kind: 'artefact',
      assertions: expect.arrayContaining([
        expect.objectContaining({
          name: 'asrt_00001',
          subject: 'cls_enterprise',
          predicate: 'hasName',
          object: 'Enterprise',
          polarity: 'positive',
        }),
      ]),
    });
    expect(viewData[0]!.assertions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: 'ctx_broad_cls_enterprise',
        predicate: 'withInContext',
        object: 'ctx_new_business',
      }),
      expect.objectContaining({
        name: 'ctx_local_cls_enterprise',
        predicate: 'withInContext',
        object: expect.stringContaining('Enterprise was identified'),
      }),
    ]));
    expect(viewData.flatMap((artefact) => artefact!.assertions)).toHaveLength(966);
    expect(viewData.flatMap((artefact) =>
      artefact!.assertions!.flatMap((assertion) => assertion.assertionsAboutAssertion),
    )).toHaveLength(1_173);

    for (const data of viewData) {
      const response = await runDataActivity(
        'pamela',
        'writePamelaAssertions',
        '1.0.0',
        'default',
        data,
        { timeoutMs: 120_000 },
      );

      expect(response.success, response.message).toBe(true);
      expect(response.result).toBeDefined();
    }

    expect(ArtefactAssertionsView.name).toBe('ArtefactAssertions');
  }, 15 * 60_000);

  it('loads the assertion view from the enterprise root artefact', async () => {
    const response = await ReadData(ArtefactAssertionsView, 'cls_enterprise', {
      useBusinessKey: true,
      timeoutMs: 120_000,
    });
    const content = response?.result?.data?.content;

    expect(response?.success, response?.message).toBe(true);
    expect(content).toMatchObject({
      name: 'cls_enterprise',
      kind: 'artefact',
      assertions: [
        expect.objectContaining({
          name: 'asrt_00001',
          subject: 'cls_enterprise',
          predicate: 'hasName',
          object: 'Enterprise',
          polarity: 'positive',
        }),
      ],
    });
  }, 120_000);
});
