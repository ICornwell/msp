import { httpRequest } from "../configuredCommon.js";
import { Manifest } from "./manifest.js";

export async function registerManifest(manifest: Manifest): Promise<any> {
  const url = `${manifest.serverUrl}/api/manifest/register`;
  return httpRequest.post(url, manifest);
}