// Shared by msp_ui_common and msp_ui_common/uiLib (same source entry point)
export function mspUiCommonExportCode(): string {
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

    const sharedModule = pick('Re')
      ? candidates.find((c) => c && c.Re)
      : (moduleFactory?.default ?? moduleFactory);
    export default sharedModule;
    export const Behaviour = pick('Behaviour');
    export const DataCacheProvider = pick('DataCacheProvider');
    export const PresetBooleanComponent = pick('PresetBooleanComponent');
    export const PresetDateComponent = pick('PresetDateComponent');
    export const PresetMoneyComponent = pick('PresetMoneyComponent');
    export const PresetNumberComponent = pick('PresetNumberComponent');
    export const PresetTextComponent = pick('PresetTextComponent');
    export const Re = pick('Re');
    export const ServiceDispatcher = pick('ServiceDispatcher');
    export const UiEventProvider = pick('UiEventProvider');
    export const createBehaviour = pick('createBehaviour');
    export const UiEventMenuBridge = pick('UiEventMenuBridge');\n    export const useDataCache = pick('useDataCache');
    export const useDataCacheContext = pick('useDataCacheContext');
    export const useUiEventContext = pick('useUiEventContext');
    export const useUiEventSubscriber = pick('useUiEventSubscriber');
    export const useUserSession = pick('useUserSession');
  `;
}
