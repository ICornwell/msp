import { getConfig } from "../configuredCommon.js";
import { getTokenForService as getMsalToken, clearTokenCahe as msalClearTokenCache } from "./msal_auth.js";
import { getTokenForService as getGenericToken, clearTokenCahe as genericClearTokenCache } from "./generic_auth.js";


/**
 * Acquire an access token using client credentials flow
 */
export async function getTokenForService(): Promise<string> {
  const config = getConfig();
  const clientCredentials = config.clientCredentials!;
  switch (clientCredentials.authLibrary ?? 'generic') {
    case 'msal':
      return await getMsalToken() ?? "no token";
    case 'generic':
    default:
      return await getGenericToken() ?? "no token";
  }
}

export function clearTokenCahe() {  const config = getConfig();
  const clientCredentials = config.clientCredentials!;
  switch (clientCredentials.authLibrary ?? 'generic') {
    case 'msal':
      return msalClearTokenCache();
    case 'generic':
    default:
      return genericClearTokenCache();
  }
}