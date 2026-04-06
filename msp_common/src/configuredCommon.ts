import { Config } from "./sharedconfig.js";

let cachedConfig: Partial<Config> = {}

export function setConfig(config: Partial<Config>) {
  cachedConfig = config
}

export function getConfig(): Partial<Config> {
  return cachedConfig
}



export default  {setConfig, getConfig};