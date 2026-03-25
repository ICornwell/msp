export function mspUiCommonContextsExportCode(): string {
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

    const sharedModule = pick('UiEventProvider')
      ? candidates.find((c) => c && c.UiEventProvider)
      : (moduleFactory?.default ?? moduleFactory);
    export default sharedModule;
    export const DataCacheContext = pick('DataCacheContext');
    export const DataCacheProvider = pick('DataCacheProvider');
    export const EventMessageTypeMapping = pick('EventMessageTypeMapping');
    export const UiContentContext = pick('UiContentContext');
    export const UiContentProvider = pick('UiContentProvider');
    export const UiEventContext = pick('UiEventContext');
    export const UiEventProvider = pick('UiEventProvider');
    export const UserSessionContext = pick('UserSessionContext');
    export const UserSessionProvider = pick('UserSessionProvider');
    export const useDataCacheContext = pick('useDataCacheContext');
    export const useEventContext = pick('useEventContext');
    export const useUiEventContext = pick('useUiEventContext');
    export const useUserSessionContext = pick('useUserSessionContext');
  `;
}
