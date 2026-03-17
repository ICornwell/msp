import { makeManifest } from "msp_common";
import Config from "../config.js";

// Service Hub API is the collector of all manifests for the platform
// but still requires it's own manifest

const dataHubManifest = makeManifest(Config)
  .withAllowedContexts(['*'])
  .addService('datahub_service1')
    
    .endService
.build()

export default dataHubManifest;