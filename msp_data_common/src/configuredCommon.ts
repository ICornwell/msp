import { Config } from "./sharedconfig";
import { makeManifest } from "msp_svr_common";
import { authenticatedGet, authenticatedDelete, authenticatedPatch, authenticatedPost, authenticatedPut } from "msp_svr_common";
import { Manifest } from "msp_svr_common";
import { registerManifest } from "msp_svr_common";

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
  get: async (url: string): Promise<any> => { authenticatedGet( url) },
  post: async (url: string, body?: any): Promise<any> => { authenticatedPost(url, body) },
  put: async (url: string, body?: any): Promise<any> => { authenticatedPut(url, body) },
  patch: async (url: string, body?: any): Promise<any> => { authenticatedPatch(url, body) },
  delete: async (url: string): Promise<any> => { authenticatedDelete(url) },
}

export default  {manifest, httpRequest, setConfig, getConfig};