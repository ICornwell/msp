export type ProxyProvider = 'aws' | 'azure' | 'gcp' | 'github' | 'stripe' | 'custom';

export type ProxyCredentialInjectionMode =
  | 'bearerToken'
  | 'header'
  | 'bodyField';

export type ProxyExecutionEnvelope = {
  version: string;
  requestId: string;
  tenantId?: string;
  context?: Record<string, string>;
  execution?: {
    continueOnError?: boolean;
    timeoutMs?: number;
    maxConcurrency?: number;
  };
  steps: ProxyExecutionStep[];
  redaction?: ProxyRedactionPolicy;
};

export type ProxyExecutionStep = {
  id: string;
  provider: ProxyProvider;
  operation: string;
  request: ProxyHttpRequestShape;
  credentialBinding?: {
    credentialRef: string;
    injections: ProxyCredentialInjection[];
  };
  capture?: {
    includeRequest?: boolean;
    includeResponseHeaders?: boolean;
    includeResponseBody?: boolean;
  };
};

export type ProxyCredentialInjection = {
  targetPath: string;
  mode: ProxyCredentialInjectionMode;
};

export type ProxyHttpRequestShape = {
  method: string;
  url: string;
  path?: string;
  query?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  body?: unknown;
};

export type ProxyExecutionResultEnvelope = {
  version: string;
  requestId: string;
  success: boolean;
  finalStepId?: string;
  timing: {
    startedAt: number;
    endedAt: number;
    durationMs: number;
  };
  steps: ProxyStepResult[];
  output?: {
    provider: ProxyProvider;
    operation: string;
    data: unknown;
  };
  errors: ProxyExecutionError[];
};

export type ProxyStepResult = {
  id: string;
  success: boolean;
  status?: number;
  request?: ProxyHttpRequestShape;
  response?: {
    headers?: Record<string, unknown>;
    body?: unknown;
  };
  redactionsApplied: string[];
  error?: ProxyExecutionError;
};

export type ProxyExecutionError = {
  code:
    | 'POLICY_DENIED'
    | 'UNKNOWN_PROVIDER'
    | 'UNSUPPORTED_OPERATION'
    | 'CREDENTIAL_NOT_FOUND'
    | 'UNRESOLVED_REFERENCE'
    | 'UPSTREAM_HTTP_ERROR'
    | 'STEP_TIMEOUT'
    | 'REDACTION_FAILURE';
  message: string;
  stepId?: string;
  retryable?: boolean;
  details?: Record<string, unknown>;
};

export type ProxyRedactionPolicy = {
  mask?: string;
  sensitiveKeyPatterns?: string[];
  sensitivePaths?: string[];
};

const DEFAULT_MASK = '***';
const DEFAULT_SENSITIVE_KEY_PATTERNS = [
  'authorization',
  'token',
  'secret',
  'accesskeyid',
  'secretaccesskey',
  'sessiontoken',
  'apikey',
  'password',
  'set-cookie',
];

export function sanitizeProxyResultEnvelope(
  envelope: ProxyExecutionResultEnvelope,
  redaction?: ProxyRedactionPolicy,
): ProxyExecutionResultEnvelope {
  const cloned = deepClone(envelope);
  const mask = redaction?.mask || DEFAULT_MASK;
  const keyPatterns = (redaction?.sensitiveKeyPatterns || DEFAULT_SENSITIVE_KEY_PATTERNS)
    .map((p) => p.toLowerCase());

  const redactionsApplied: string[] = [];

  redactByKeyPattern(cloned, '', keyPatterns, mask, redactionsApplied);
  applySensitivePaths(cloned, redaction?.sensitivePaths || [], mask, redactionsApplied);

  for (const step of cloned.steps) {
    step.redactionsApplied = Array.from(new Set([...step.redactionsApplied, ...redactionsApplied]));
  }

  return cloned;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function redactByKeyPattern(
  value: unknown,
  path: string,
  keyPatterns: string[],
  mask: string,
  redactionsApplied: string[],
): void {
  if (!value || typeof value !== 'object') return;

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const childPath = path ? `${path}.${index}` : String(index);
      redactByKeyPattern(item, childPath, keyPatterns, mask, redactionsApplied);
    });
    return;
  }

  const record = value as Record<string, unknown>;
  for (const [key, child] of Object.entries(record)) {
    const lower = key.toLowerCase();
    const childPath = path ? `${path}.${key}` : key;

    if (keyPatterns.some((pattern) => lower.includes(pattern))) {
      record[key] = mask;
      redactionsApplied.push(childPath);
      continue;
    }

    redactByKeyPattern(child, childPath, keyPatterns, mask, redactionsApplied);
  }
}

function applySensitivePaths(
  value: unknown,
  paths: string[],
  mask: string,
  redactionsApplied: string[],
): void {
  if (!value || typeof value !== 'object' || paths.length === 0) return;

  for (const path of paths) {
    const segments = path.split('.').filter(Boolean);
    if (segments.length === 0) continue;

    if (setPathMask(value as Record<string, unknown>, segments, mask)) {
      redactionsApplied.push(path);
    }
  }
}

function setPathMask(
  root: Record<string, unknown>,
  segments: string[],
  mask: string,
): boolean {
  return setPathMaskRecursive(root, segments, 0, mask);
}

function setPathMaskRecursive(
  current: unknown,
  segments: string[],
  index: number,
  mask: string,
): boolean {
  if (!current || typeof current !== 'object') return false;

  const segment = segments[index];
  const isLast = index === segments.length - 1;

  if (Array.isArray(current)) {
    if (segment === '*') {
      let changed = false;
      for (const item of current) {
        changed = setPathMaskRecursive(item, segments, index + 1, mask) || changed;
      }
      return changed;
    }

    const numeric = Number(segment);
    if (Number.isNaN(numeric) || numeric < 0 || numeric >= current.length) return false;
    if (isLast) {
      current[numeric] = mask;
      return true;
    }
    return setPathMaskRecursive(current[numeric], segments, index + 1, mask);
  }

  const record = current as Record<string, unknown>;
  if (segment === '*') {
    let changed = false;
    for (const key of Object.keys(record)) {
      if (isLast) {
        record[key] = mask;
        changed = true;
      } else {
        changed = setPathMaskRecursive(record[key], segments, index + 1, mask) || changed;
      }
    }
    return changed;
  }

  if (!(segment in record)) return false;
  if (isLast) {
    record[segment] = mask;
    return true;
  }

  return setPathMaskRecursive(record[segment], segments, index + 1, mask);
}

const PLACEHOLDER_REGEX = /\$\{([a-zA-Z0-9_.-]+)\}/g;

export function findPlaceholders(value: string): string[] {
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = PLACEHOLDER_REGEX.exec(value)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

export function resolvePlaceholdersInValue<T = unknown>(
  value: T,
  scope: Record<string, unknown>,
): T {
  if (typeof value === 'string') {
    return resolvePlaceholdersInString(value, scope) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolvePlaceholdersInValue(item, scope)) as T;
  }

  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      output[key] = resolvePlaceholdersInValue(child, scope);
    }
    return output as T;
  }

  return value;
}

function resolvePlaceholdersInString(
  source: string,
  scope: Record<string, unknown>,
): string {
  return source.replace(PLACEHOLDER_REGEX, (_full, expr: string) => {
    const resolved = resolvePath(scope, expr);
    if (resolved === undefined || resolved === null) {
      throw new Error(`Unresolved placeholder: ${expr}`);
    }
    if (typeof resolved === 'object') {
      return JSON.stringify(resolved);
    }
    return String(resolved);
  });
}

function resolvePath(
  source: Record<string, unknown>,
  expr: string,
): unknown {
  const parts = expr.split('.').filter(Boolean);
  let current: unknown = source;

  for (const part of parts) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }

    if (Array.isArray(current)) {
      const idx = Number(part);
      if (!Number.isInteger(idx) || idx < 0 || idx >= current.length) {
        return undefined;
      }
      current = current[idx];
      continue;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return current;
}
