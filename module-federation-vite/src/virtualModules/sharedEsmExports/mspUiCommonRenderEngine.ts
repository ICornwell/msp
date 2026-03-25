export function mspUiCommonRenderEngineExportCode(): string {
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
    export const Re = pick('Re');
  `;
}
