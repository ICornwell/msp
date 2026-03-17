import { makeManifest } from "msp_common";
import Config from "../config.js";

// Service Hub API is the collector of all manifests for the platform
// but still requires it's own manifest

const serviceHubManifest = makeManifest(Config)
  .withAllowedContexts(['*'])
  .addService('default-navigation')
   
    .endService
.build()

export default serviceHubManifest;