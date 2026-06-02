import { describe, expect, it } from 'vitest';

import {
  findPlaceholders,
  resolvePlaceholdersInValue,
  sanitizeProxyResultEnvelope,
  type ProxyExecutionResultEnvelope,
} from './proxyExecutionContract.js';

describe('proxyExecutionContract', () => {
  it('resolves placeholders from prior step output', () => {
    const scope = {
      steps: {
        auth: {
          response: {
            body: {
              credentials: {
                sessionToken: 'token-123',
              },
            },
          },
        },
      },
      context: {
        tenantId: 'tenant-a',
      },
    };

    const request = {
      headers: {
        authorization: 'Bearer ${steps.auth.response.body.credentials.sessionToken}',
      },
      body: {
        tenant: '${context.tenantId}',
      },
    };

    const resolved = resolvePlaceholdersInValue(request, scope) as {
      headers: Record<string, string>;
      body: Record<string, string>;
    };

    expect(resolved.headers.authorization).toBe('Bearer token-123');
    expect(resolved.body.tenant).toBe('tenant-a');
  });

  it('finds placeholder expressions in a string', () => {
    const placeholders = findPlaceholders('x=${steps.s1.response.body.t}; y=${context.workItemId}');
    expect(placeholders).toEqual(['steps.s1.response.body.t', 'context.workItemId']);
  });

  it('redacts token-like keys and explicit wildcard paths', () => {
    const envelope: ProxyExecutionResultEnvelope = {
      version: '1.0',
      requestId: 'req-1',
      success: true,
      finalStepId: 's2',
      timing: {
        startedAt: 1,
        endedAt: 2,
        durationMs: 1,
      },
      steps: [
        {
          id: 's1',
          success: true,
          status: 200,
          response: {
            headers: {
              authorization: 'Bearer abc',
            },
            body: {
              credentials: {
                accessKeyId: 'AKIA-123',
                secretAccessKey: 'secret-123',
                sessionToken: 'token-123',
              },
            },
          },
          redactionsApplied: [],
        },
      ],
      output: {
        provider: 'aws',
        operation: 'sts:AssumeRole',
        data: {
          credentials: {
            accessKeyId: 'AKIA-123',
            secretAccessKey: 'secret-123',
            sessionToken: 'token-123',
          },
        },
      },
      errors: [],
    };

    const sanitized = sanitizeProxyResultEnvelope(envelope, {
      sensitivePaths: [
        'steps.*.response.body.credentials.accessKeyId',
        'steps.*.response.body.credentials.secretAccessKey',
        'steps.*.response.body.credentials.sessionToken',
      ],
    });

    const step = sanitized.steps[0];
    expect(step.response?.headers?.authorization).toBe('***');
    expect((step.response?.body as any).credentials.accessKeyId).toBe('***');
    expect((step.response?.body as any).credentials.secretAccessKey).toBe('***');
    expect((step.response?.body as any).credentials.sessionToken).toBe('***');

    // Ensure sensitive values are not present after sanitization.
    const serialized = JSON.stringify(sanitized);
    expect(serialized.includes('AKIA-123')).toBe(false);
    expect(serialized.includes('secret-123')).toBe(false);
    expect(serialized.includes('token-123')).toBe(false);
  });
});
