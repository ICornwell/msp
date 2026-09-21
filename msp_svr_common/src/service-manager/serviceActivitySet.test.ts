import { describe, expect, it } from 'vitest';
import { buildActivitySet } from './serviceActivitySet.js';

describe('ActivitySet', () => {
  it('passes its result builder to handlers and preserves handler failures', async () => {
    const activities = buildActivitySet()
      .withNamespace('test')
      .withVersion('1.0.0')
      .use({
        activityName: 'fails',
        funcs: async (_payload, resultBuilder) => resultBuilder
          .log('handler was invoked')
          .failed('Expected handler failure.', { code: 'EXPECTED_FAILURE' }),
      })
      .build();

    const result = (await activities.handle('test', 'fails', '1.0.0', 'default', {})).currentResult();

    expect(result).toMatchObject({
      success: false,
      message: 'Expected handler failure.',
      error: { code: 'EXPECTED_FAILURE' },
      logs: ['handler was invoked'],
    });
  });
});