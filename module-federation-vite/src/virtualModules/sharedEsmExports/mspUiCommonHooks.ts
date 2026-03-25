export function mspUiCommonHooksExportCode(): string {
  return `
    const fallbackCandidates = typeof fallbackModule !== 'undefined' ? [
      fallbackModule,
      fallbackModule?.default,
    ] : [];

    const candidates = [
      moduleFactory,
      moduleFactory?.default,
      ...fallbackCandidates,
    ];

    const pick = (key) => {
      for (const candidate of candidates) {
        if (candidate && candidate[key] !== undefined) {
          return candidate[key];
        }
      }
      return undefined;
    };

    const sharedModule = moduleFactory?.default ?? moduleFactory;
    export default sharedModule;
    export const useDataCache = pick('useDataCache');
    export const useUiContentHost = pick('useUiContentHost');
    export const useUiEventSubscriber = pick('useUiEventSubscriber');
    export const useUserSession = pick('useUserSession');
  `;
}
