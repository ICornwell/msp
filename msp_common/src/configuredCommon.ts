import { Config } from "./sharedconfig.js";
import { makeManifest } from "./manifests/manifestBuilder.js";
import { authenticatedGet, authenticatedDelete, authenticatedPatch, authenticatedPost, authenticatedPut } from "./als/index.js";
import { Manifest } from "./manifests/index.js";
import { registerManifest } from "./manifests/registration.js";

let cachedConfig: Partial<Config> = {}

export function setConfig(config: Partial<Config>) {
  cachedConfig = config
}

export function getConfig(): Partial<Config> {
  return cachedConfig
}

export const manifest = {
 make: makeManifest(getConfig()),
 register: (manifest: Manifest) => registerManifest(manifest)
}

export const httpRequest = {
  get: async (url: string): Promise<any> => { authenticatedGet(getConfig().clientCredentials!, url) },
  post: async (url: string, body?: any): Promise<any> => { authenticatedPost(getConfig().clientCredentials!, url, body) },
  put: async (url: string, body?: any): Promise<any> => { authenticatedPut(getConfig().clientCredentials!, url, body) },
  patch: async (url: string, body?: any): Promise<any> => { authenticatedPatch(getConfig().clientCredentials!, url, body) },
  delete: async (url: string): Promise<any> => { authenticatedDelete(getConfig().clientCredentials!, url) },
}

export default  {manifest, httpRequest, setConfig, getConfig};