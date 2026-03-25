export function msalBrowserExportCode(): string {
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

    const sharedModule = pick('PublicClientApplication')
      ? candidates.find((c) => c && c.PublicClientApplication)
      : (moduleFactory?.default ?? moduleFactory);
    export default sharedModule;
    export const AccountEntity = pick('AccountEntity');
    export const ApiId = pick('ApiId');
    export const AuthError = pick('AuthError');
    export const AuthErrorCodes = pick('AuthErrorCodes');
    export const AuthErrorMessage = pick('AuthErrorMessage');
    export const AuthenticationHeaderParser = pick('AuthenticationHeaderParser');
    export const AuthenticationScheme = pick('AuthenticationScheme');
    export const AzureCloudInstance = pick('AzureCloudInstance');
    export const BrowserAuthError = pick('BrowserAuthError');
    export const BrowserAuthErrorCodes = pick('BrowserAuthErrorCodes');
    export const BrowserAuthErrorMessage = pick('BrowserAuthErrorMessage');
    export const BrowserCacheLocation = pick('BrowserCacheLocation');
    export const BrowserConfigurationAuthError = pick('BrowserConfigurationAuthError');
    export const BrowserConfigurationAuthErrorCodes = pick('BrowserConfigurationAuthErrorCodes');
    export const BrowserConfigurationAuthErrorMessage = pick('BrowserConfigurationAuthErrorMessage');
    export const BrowserPerformanceClient = pick('BrowserPerformanceClient');
    export const BrowserPerformanceMeasurement = pick('BrowserPerformanceMeasurement');
    export const BrowserUtils = pick('BrowserUtils');
    export const CacheLookupPolicy = pick('CacheLookupPolicy');
    export const ClientAuthError = pick('ClientAuthError');
    export const ClientAuthErrorCodes = pick('ClientAuthErrorCodes');
    export const ClientAuthErrorMessage = pick('ClientAuthErrorMessage');
    export const ClientConfigurationError = pick('ClientConfigurationError');
    export const ClientConfigurationErrorCodes = pick('ClientConfigurationErrorCodes');
    export const ClientConfigurationErrorMessage = pick('ClientConfigurationErrorMessage');
    export const DEFAULT_IFRAME_TIMEOUT_MS = pick('DEFAULT_IFRAME_TIMEOUT_MS');
    export const EventHandler = pick('EventHandler');
    export const EventMessageUtils = pick('EventMessageUtils');
    export const EventType = pick('EventType');
    export const InteractionRequiredAuthError = pick('InteractionRequiredAuthError');
    export const InteractionRequiredAuthErrorCodes = pick('InteractionRequiredAuthErrorCodes');
    export const InteractionRequiredAuthErrorMessage = pick('InteractionRequiredAuthErrorMessage');
    export const InteractionStatus = pick('InteractionStatus');
    export const InteractionType = pick('InteractionType');
    export const JsonWebTokenTypes = pick('JsonWebTokenTypes');
    export const LocalStorage = pick('LocalStorage');
    export const LogLevel = pick('LogLevel');
    export const Logger = pick('Logger');
    export const MemoryStorage = pick('MemoryStorage');
    export const NavigationClient = pick('NavigationClient');
    export const OIDC_DEFAULT_SCOPES = pick('OIDC_DEFAULT_SCOPES');
    export const PerformanceEvents = pick('PerformanceEvents');
    export const PromptValue = pick('PromptValue');
    export const ProtocolMode = pick('ProtocolMode');
    export const PublicClientApplication = pick('PublicClientApplication');
    export const PublicClientNext = pick('PublicClientNext');
    export const ServerError = pick('ServerError');
    export const ServerResponseType = pick('ServerResponseType');
    export const SessionStorage = pick('SessionStorage');
    export const SignedHttpRequest = pick('SignedHttpRequest');
    export const StringUtils = pick('StringUtils');
    export const StubPerformanceClient = pick('StubPerformanceClient');
    export const UrlString = pick('UrlString');
    export const WrapperSKU = pick('WrapperSKU');
    export const createNestablePublicClientApplication = pick('createNestablePublicClientApplication');
    export const createStandardPublicClientApplication = pick('createStandardPublicClientApplication');
    export const isPlatformBrokerAvailable = pick('isPlatformBrokerAvailable');
    export const stubbedPublicClientApplication = pick('stubbedPublicClientApplication');
    export const version = pick('version');
  `;
}
