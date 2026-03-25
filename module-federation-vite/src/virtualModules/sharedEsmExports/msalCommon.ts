export function msalCommonExportCode(): string {
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

    const sharedModule = pick('AuthorizationCodeClient')
      ? candidates.find((c) => c && c.AuthorizationCodeClient)
      : (moduleFactory?.default ?? moduleFactory);
    export default sharedModule;
    export const AADAuthorityConstants = pick('AADAuthorityConstants');
    export const AADServerParamKeys = pick('AADServerParamKeys');
    export const AccountEntity = pick('AccountEntity');
    export const AuthError = pick('AuthError');
    export const AuthErrorCodes = pick('AuthErrorCodes');
    export const AuthErrorMessage = pick('AuthErrorMessage');
    export const AuthToken = pick('AuthToken');
    export const AuthenticationHeaderParser = pick('AuthenticationHeaderParser');
    export const AuthenticationScheme = pick('AuthenticationScheme');
    export const Authority = pick('Authority');
    export const AuthorityFactory = pick('AuthorityFactory');
    export const AuthorityType = pick('AuthorityType');
    export const AuthorizationCodeClient = pick('AuthorizationCodeClient');
    export const AuthorizeProtocol = pick('AuthorizeProtocol');
    export const AzureCloudInstance = pick('AzureCloudInstance');
    export const BaseClient = pick('BaseClient');
    export const CacheAccountType = pick('CacheAccountType');
    export const CacheError = pick('CacheError');
    export const CacheErrorCodes = pick('CacheErrorCodes');
    export const CacheHelpers = pick('CacheHelpers');
    export const CacheManager = pick('CacheManager');
    export const CacheOutcome = pick('CacheOutcome');
    export const CacheType = pick('CacheType');
    export const CcsCredentialType = pick('CcsCredentialType');
    export const ClaimsRequestKeys = pick('ClaimsRequestKeys');
    export const ClientAssertionUtils = pick('ClientAssertionUtils');
    export const ClientAuthError = pick('ClientAuthError');
    export const ClientAuthErrorCodes = pick('ClientAuthErrorCodes');
    export const ClientAuthErrorMessage = pick('ClientAuthErrorMessage');
    export const ClientConfigurationError = pick('ClientConfigurationError');
    export const ClientConfigurationErrorCodes = pick('ClientConfigurationErrorCodes');
    export const ClientConfigurationErrorMessage = pick('ClientConfigurationErrorMessage');
    export const CodeChallengeMethodValues = pick('CodeChallengeMethodValues');
    export const Constants = pick('Constants');
    export const CredentialType = pick('CredentialType');
    export const DEFAULT_CRYPTO_IMPLEMENTATION = pick('DEFAULT_CRYPTO_IMPLEMENTATION');
    export const DEFAULT_SYSTEM_OPTIONS = pick('DEFAULT_SYSTEM_OPTIONS');
    export const DEFAULT_TOKEN_RENEWAL_OFFSET_SEC = pick('DEFAULT_TOKEN_RENEWAL_OFFSET_SEC');
    export const DefaultStorageClass = pick('DefaultStorageClass');
    export const EncodingTypes = pick('EncodingTypes');
    export const Errors = pick('Errors');
    export const GrantType = pick('GrantType');
    export const HeaderNames = pick('HeaderNames');
    export const HttpMethod = pick('HttpMethod');
    export const HttpStatus = pick('HttpStatus');
    export const IntFields = pick('IntFields');
    export const InteractionRequiredAuthError = pick('InteractionRequiredAuthError');
    export const InteractionRequiredAuthErrorCodes = pick('InteractionRequiredAuthErrorCodes');
    export const InteractionRequiredAuthErrorMessage = pick('InteractionRequiredAuthErrorMessage');
    export const JoseHeader = pick('JoseHeader');
    export const JsonWebTokenTypes = pick('JsonWebTokenTypes');
    export const LogLevel = pick('LogLevel');
    export const Logger = pick('Logger');
    export const NetworkError = pick('NetworkError');
    export const OAuthResponseType = pick('OAuthResponseType');
    export const OIDC_DEFAULT_SCOPES = pick('OIDC_DEFAULT_SCOPES');
    export const ONE_DAY_IN_MS = pick('ONE_DAY_IN_MS');
    export const PasswordGrantConstants = pick('PasswordGrantConstants');
    export const PerformanceClient = pick('PerformanceClient');
    export const PerformanceEventStatus = pick('PerformanceEventStatus');
    export const PerformanceEvents = pick('PerformanceEvents');
    export const PersistentCacheKeys = pick('PersistentCacheKeys');
    export const PlatformBrokerError = pick('PlatformBrokerError');
    export const PopTokenGenerator = pick('PopTokenGenerator');
    export const PromptValue = pick('PromptValue');
    export const ProtocolMode = pick('ProtocolMode');
    export const ProtocolUtils = pick('ProtocolUtils');
    export const RefreshTokenClient = pick('RefreshTokenClient');
    export const RequestParameterBuilder = pick('RequestParameterBuilder');
    export const ResponseHandler = pick('ResponseHandler');
    export const ResponseMode = pick('ResponseMode');
    export const ScopeSet = pick('ScopeSet');
    export const ServerError = pick('ServerError');
    export const ServerResponseType = pick('ServerResponseType');
    export const ServerTelemetryManager = pick('ServerTelemetryManager');
    export const SilentFlowClient = pick('SilentFlowClient');
    export const StringUtils = pick('StringUtils');
    export const StubPerformanceClient = pick('StubPerformanceClient');
    export const StubbedNetworkModule = pick('StubbedNetworkModule');
    export const THE_FAMILY_ID = pick('THE_FAMILY_ID');
    export const ThrottlingConstants = pick('ThrottlingConstants');
    export const ThrottlingUtils = pick('ThrottlingUtils');
    export const TimeUtils = pick('TimeUtils');
    export const TokenCacheContext = pick('TokenCacheContext');
    export const UrlString = pick('UrlString');
    export const UrlUtils = pick('UrlUtils');
    export const buildAccountToCache = pick('buildAccountToCache');
    export const buildClientInfo = pick('buildClientInfo');
    export const buildClientInfoFromHomeAccountId = pick('buildClientInfoFromHomeAccountId');
    export const buildStaticAuthorityOptions = pick('buildStaticAuthorityOptions');
    export const buildTenantProfile = pick('buildTenantProfile');
    export const createAuthError = pick('createAuthError');
    export const createCacheError = pick('createCacheError');
    export const createClientAuthError = pick('createClientAuthError');
    export const createClientConfigurationError = pick('createClientConfigurationError');
    export const createInteractionRequiredAuthError = pick('createInteractionRequiredAuthError');
    export const createNetworkError = pick('createNetworkError');
    export const formatAuthorityUri = pick('formatAuthorityUri');
    export const getClientAssertion = pick('getClientAssertion');
    export const getRequestThumbprint = pick('getRequestThumbprint');
    export const getTenantIdFromIdTokenClaims = pick('getTenantIdFromIdTokenClaims');
    export const invoke = pick('invoke');
    export const invokeAsync = pick('invokeAsync');
    export const tenantIdMatchesHomeTenant = pick('tenantIdMatchesHomeTenant');
    export const updateAccountTenantProfileData = pick('updateAccountTenantProfileData');
    export const version = pick('version');
  `;
}
