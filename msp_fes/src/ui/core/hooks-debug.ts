export function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.VITEST_WORKER_ID !== undefined;
}
  