export function isTestEnvironment() {
    return process.env.NODE_ENV === 'test' || process.env.VITEST_WORKER_ID !== undefined;
}
//# sourceMappingURL=hooks-debug.js.map