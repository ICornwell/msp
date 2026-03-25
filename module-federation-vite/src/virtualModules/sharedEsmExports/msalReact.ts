export function msalReactExportCode(): string {
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

    const sharedModule = pick('MsalProvider')
      ? candidates.find((c) => c && c.MsalProvider)
      : (moduleFactory?.default ?? moduleFactory);
    export default sharedModule;
    export const AuthenticatedTemplate = pick('AuthenticatedTemplate');
    export const MsalAuthenticationTemplate = pick('MsalAuthenticationTemplate');
    export const MsalConsumer = pick('MsalConsumer');
    export const MsalContext = pick('MsalContext');
    export const MsalProvider = pick('MsalProvider');
    export const UnauthenticatedTemplate = pick('UnauthenticatedTemplate');
    export const useAccount = pick('useAccount');
    export const useIsAuthenticated = pick('useIsAuthenticated');
    export const useMsal = pick('useMsal');
    export const useMsalAuthentication = pick('useMsalAuthentication');
    export const version = pick('version');
    export const withMsal = pick('withMsal');
  `;
}
