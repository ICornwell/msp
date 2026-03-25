export function mspUiCommonBehavioursExportCode(): string {
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

    const sharedModule = pick('Behaviour')
      ? candidates.find((c) => c && c.Behaviour)
      : (moduleFactory?.default ?? moduleFactory);
    export default sharedModule;
    export const Behaviour = pick('Behaviour');
    export const createBehaviour = pick('createBehaviour');
  `;
}
