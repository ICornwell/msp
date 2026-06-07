import { Config } from "./sharedconfig.js";
import { makeManifest } from "./manifests/manifestBuilder.js";
import { authenticatedGet, authenticatedDelete, authenticatedPatch,
   authenticatedPost, authenticatedPut } from "./als/index.js";
import { Manifest } from "./manifests/index.js";
import { registerManifest } from "./app/manifestRegistration.js";

let cachedConfig: Partial<Config> = {}

export function setConfig(config: Partial<Config>) {
  cachedConfig = config
}

export function getConfig(): Partial<Config> {
  return cachedConfig
}

export const manifest = {
 make: makeManifest(getConfig()),
 register: (manifest: Manifest) => registerManifest(getConfig(), manifest)
}

export const httpRequest = {
  get: async (url: string): Promise<any> => { authenticatedGet(url) },
  post: async (url: string, body?: any): Promise<any> => { authenticatedPost(url, body) },
  put: async (url: string, body?: any): Promise<any> => { authenticatedPut(url, body) },
  patch: async (url: string, body?: any): Promise<any> => { authenticatedPatch(url, body) },
  delete: async (url: string): Promise<any> => { authenticatedDelete(url) },
}

export default  {manifest, httpRequest, setConfig, getConfig};