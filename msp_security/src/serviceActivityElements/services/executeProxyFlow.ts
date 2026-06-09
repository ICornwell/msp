import type { ServiceActivityResultBuilder } from 'msp_svr_common';

import {
  type ProxyExecutionEnvelope,
  type ProxyExecutionError,
  type ProxyExecutionResultEnvelope,
  type ProxyExecutionStep,
  type ProxyHttpRequestShape,
  type ProxyStepResult,
  resolvePlaceholdersInValue,
  sanitizeProxyResultEnvelope,
} from './proxyExecutionContract.js';

export type ExecuteProxyFlowPayload = {
  envelope: ProxyExecutionEnvelope;
};

export async function executeProxyFlowHandler(
  payload: ExecuteProxyFlowPayload,
  resultBuilder: ServiceActivityResultBuilder,
): Promise<ServiceActivityResultBuilder> {
  try {
    const envelope = payload?.envelope;
    if (!envelope) {
      return resultBuilder.failed('Missing payload.envelope for executeProxyFlow', {
        code: 'INVALID_INPUT',
      });
    }

    const validationError = validateEnvelope(envelope);
    if (validationError) {
      return resultBuilder.failed(validationError.message, validationError);
    }

    const executionResult = await executeEnvelope(envelope);
    const sanitized = sanitizeProxyResultEnvelope(executionResult, envelope.redaction);

    resultBuilder.log(
      `executeProxyFlow completed for requestId=${envelope.requestId} success=${sanitized.success}`,
    );

    return resultBuilder.success({ data: sanitized });
  } catch (error: any) {
    return resultBuilder.failed('executeProxyFlow failed unexpectedly', {
      code: 'UNEXPECTED_ERROR',
      message: error?.message || 'Unknown error',
    });
  }
}

async function executeEnvelope(
  envelope: ProxyExecutionEnvelope,
): Promise<ProxyExecutionResultEnvelope> {
  const startedAt = Date.now();
  const steps: ProxyStepResult[] = [];
  const errors: ProxyExecutionError[] = [];

  const continueOnError = envelope.execution?.continueOnError ?? false;

  for (const step of envelope.steps) {
    const scope = buildPlaceholderScope(steps, envelope.context || {});
    let resolvedRequest: ProxyHttpRequestShape;

    try {
      resolvedRequest = resolvePlaceholdersInValue(step.request, scope) as ProxyHttpRequestShape;
    } catch (error: any) {
      const unresolvedError: ProxyExecutionError = {
        code: 'UNRESOLVED_REFERENCE',
        message: error?.message || 'Failed to resolve placeholders',
        stepId: step.id,
        retryable: false,
      };

      steps.push({
        id: step.id,
        success: false,
        redactionsApplied: [],
        error: unresolvedError,
      });
      errors.push(unresolvedError);

      if (!continueOnError) {
        break;
      }
      continue;
    }

    try {
      const output = await executeStep(step, resolvedRequest);
      steps.push({
        id: step.id,
        success: true,
        status: output.status,
        request: step.capture?.includeRequest ? resolvedRequest : undefined,
        response: {
          headers: step.capture?.includeResponseHeaders === false ? undefined : output.headers,
          body: step.capture?.includeResponseBody === false ? undefined : output.body,
        },
        redactionsApplied: [],
      });
    } catch (error: any) {
      const execError = normalizeExecutionError(step.id, error);
      steps.push({
        id: step.id,
        success: false,
        request: step.capture?.includeRequest ? resolvedRequest : undefined,
        redactionsApplied: [],
        error: execError,
      });
      errors.push(execError);

      if (!continueOnError) {
        break;
      }
    }
  }

  const endedAt = Date.now();
  const finalStep = [...steps].reverse().find((step) => step.success);

  return {
    version: envelope.version,
    requestId: envelope.requestId,
    success: errors.length === 0,
    finalStepId: finalStep?.id,
    timing: {
      startedAt,
      endedAt,
      durationMs: endedAt - startedAt,
    },
    steps,
    output: finalStep?.response
      ? {
          provider: findStepProvider(envelope.steps, finalStep.id),
          operation: findStepOperation(envelope.steps, finalStep.id),
          data: finalStep.response.body,
        }
      : undefined,
    errors,
  };
}

async function executeStep(
  step: ProxyExecutionStep,
  request: ProxyHttpRequestShape,
): Promise<{ status: number; headers?: Record<string, unknown>; body?: unknown }> {
  const requestWithCredentials = applyCredentialInjections(step, request);
  return executeGenericHttpRequest(requestWithCredentials);
}

function applyCredentialInjections(
  step: ProxyExecutionStep,
  request: ProxyHttpRequestShape,
): ProxyHttpRequestShape {
  if (!step.credentialBinding?.injections?.length) {
    return request;
  }

  const cloned = JSON.parse(JSON.stringify(request)) as ProxyHttpRequestShape;
  const credentialValue = resolveCredentialBinding(step);

  for (const injection of step.credentialBinding.injections) {
    switch (injection.mode) {
      case 'bearerToken': {
        const token = extractToken(credentialValue);
        setPathValue(cloned as unknown as Record<string, unknown>, normalizeTargetPath(injection.targetPath, 'request.headers.authorization'), `Bearer ${token}`);
        break;
      }
      case 'header': {
        setPathValue(
          cloned as unknown as Record<string, unknown>,
          normalizeTargetPath(injection.targetPath, 'request.headers.authorization'),
          asSerializableString(credentialValue),
        );
        break;
      }
      case 'bodyField': {
        setPathValue(
          cloned as unknown as Record<string, unknown>,
          normalizeTargetPath(injection.targetPath, 'request.body.credential'),
          credentialValue,
        );
        break;
      }
      default:
        throw {
          code: 'UNSUPPORTED_OPERATION',
          message: `Unsupported credential injection mode: ${(injection as any).mode}`,
          stepId: step.id,
          retryable: false,
        } as ProxyExecutionError;
    }
  }

  return cloned;
}

function resolveCredentialBinding(step: ProxyExecutionStep): unknown {
  const credentialRef = step.credentialBinding?.credentialRef;
  if (!credentialRef) {
    throw {
      code: 'CREDENTIAL_NOT_FOUND',
      message: `Missing credentialRef for step ${step.id}`,
      stepId: step.id,
      retryable: false,
    } as ProxyExecutionError;
  }

  if (!credentialRef.startsWith('env://')) {
    throw {
      code: 'UNSUPPORTED_OPERATION',
      message: `Unsupported credentialRef scheme for step ${step.id}: ${credentialRef}`,
      stepId: step.id,
      retryable: false,
    } as ProxyExecutionError;
  }

  const key = credentialRef.slice('env://'.length).trim();
  if (!key) {
    throw {
      code: 'CREDENTIAL_NOT_FOUND',
      message: `Empty env credential key in step ${step.id}`,
      stepId: step.id,
      retryable: false,
    } as ProxyExecutionError;
  }

  const value = process.env[key];
  if (!value) {
    throw {
      code: 'CREDENTIAL_NOT_FOUND',
      message: `Credential not found in env for key ${key}`,
      stepId: step.id,
      retryable: false,
    } as ProxyExecutionError;
  }

  const trimmed = value.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  return value;
}

function extractToken(value: unknown): string {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const token = record['token'] || record['accessToken'] || record['sessionToken'];
    if (typeof token === 'string' && token.trim()) {
      return token.trim();
    }
  }

  throw {
    code: 'CREDENTIAL_NOT_FOUND',
    message: 'Bearer token injection requires a token-like credential value',
    retryable: false,
  } as ProxyExecutionError;
}

function asSerializableString(value: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function normalizeTargetPath(path: string, fallback: string): string[] {
  const finalPath = (path || fallback).trim();
  if (!finalPath) {
    return fallback.split('.');
  }

  return finalPath.startsWith('request.')
    ? finalPath.slice('request.'.length).split('.').filter(Boolean)
    : finalPath.split('.').filter(Boolean);
}

function setPathValue(root: Record<string, unknown>, pathSegments: string[], value: unknown): void {
  if (pathSegments.length === 0) return;

  let current: Record<string, unknown> = root;
  for (let i = 0; i < pathSegments.length - 1; i++) {
    const segment = pathSegments[i];
    const next = current[segment];
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      current[segment] = {};
    }
    current = current[segment] as Record<string, unknown>;
  }

  current[pathSegments[pathSegments.length - 1]] = value;
}

async function executeGenericHttpRequest(
  request: ProxyHttpRequestShape,
): Promise<{ status: number; headers?: Record<string, unknown>; body?: unknown }> {
  const method = request.method || 'GET';
  const url = buildUrlWithQuery(request.url, request.query);

  const response = await fetch(url, {
    method,
    headers: normalizeHeaders(request.headers),
    body: isBodyAllowed(method) ? toBody(request.body) : undefined,
  });

  const body = await parseResponseBody(response);

  return {
    status: response.status,
    headers: headersToObject(response.headers),
    body,
  };
}

function buildUrlWithQuery(url: string, query?: Record<string, unknown>): string {
  if (!query || Object.keys(query).length === 0) {
    return url;
  }

  const parsed = new URL(url);
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    parsed.searchParams.set(key, String(value));
  }
  return parsed.toString();
}

function normalizeHeaders(headers?: Record<string, unknown>): Record<string, string> {
  const output: Record<string, string> = {};
  if (!headers) return output;

  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined || value === null) continue;
    output[key] = String(value);
  }

  return output;
}

function isBodyAllowed(method: string): boolean {
  const upper = method.toUpperCase();
  return upper !== 'GET' && upper !== 'HEAD';
}

function toBody(body: unknown): string | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }
  if (typeof body === 'string') {
    return body;
  }
  return JSON.stringify(body);
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (!text) return undefined;

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return text;
}

function headersToObject(headers: Headers): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  headers.forEach((value, key) => {
    output[key] = value;
  });
  return output;
}

function buildPlaceholderScope(
  steps: ProxyStepResult[],
  context: Record<string, string>,
): Record<string, unknown> {
  const stepMap: Record<string, unknown> = {};
  for (const step of steps) {
    stepMap[step.id] = {
      response: step.response,
      success: step.success,
      error: step.error,
      status: step.status,
      request: step.request,
    };
  }

  return {
    steps: stepMap,
    context,
  };
}

function findStepProvider(steps: ProxyExecutionStep[], stepId: string) {
  return steps.find((step) => step.id === stepId)?.provider || 'custom';
}

function findStepOperation(steps: ProxyExecutionStep[], stepId: string) {
  return steps.find((step) => step.id === stepId)?.operation || 'unknown';
}

function validateEnvelope(envelope: ProxyExecutionEnvelope): ProxyExecutionError | undefined {
  if (!envelope.requestId?.trim()) {
    return {
      code: 'UNSUPPORTED_OPERATION',
      message: 'requestId is required',
      retryable: false,
    };
  }

  if (!Array.isArray(envelope.steps) || envelope.steps.length === 0) {
    return {
      code: 'UNSUPPORTED_OPERATION',
      message: 'At least one step is required',
      retryable: false,
    };
  }

  const seen = new Set<string>();
  for (const step of envelope.steps) {
    if (!step.id?.trim()) {
      return {
        code: 'UNSUPPORTED_OPERATION',
        message: 'Each step requires a non-empty id',
        retryable: false,
      };
    }

    if (seen.has(step.id)) {
      return {
        code: 'UNSUPPORTED_OPERATION',
        message: `Duplicate step id: ${step.id}`,
        retryable: false,
      };
    }
    seen.add(step.id);

    if (!step.request?.method || !step.request?.url) {
      return {
        code: 'UNSUPPORTED_OPERATION',
        message: `Step ${step.id} requires request.method and request.url`,
        stepId: step.id,
        retryable: false,
      };
    }
  }

  return undefined;
}

function normalizeExecutionError(stepId: string, error: unknown): ProxyExecutionError {
  const err = error as Partial<ProxyExecutionError> & { status?: number; message?: string };

  if (err && typeof err === 'object' && err.code) {
    return {
      code: err.code,
      message: err.message || 'Step execution failed',
      stepId: err.stepId || stepId,
      retryable: err.retryable,
      details: err.details,
    };
  }

  return {
    code: 'UPSTREAM_HTTP_ERROR',
    message: err?.message || 'Step execution failed',
    stepId,
    retryable: false,
    details: err?.status ? { status: err.status } : undefined,
  };
}
