import { makeManifest } from "msp_svr_common";
import { getConfig } from "msp_svr_common";

// Service Hub API is the collector of all manifests for the platform
// but still requires it's own manifest

const dataHubManifest = makeManifest(getConfig())
  .withAllowedContexts(['*'])
  .addService('datahub_service1')
    
    .endService
.build()

export default dataHubManifest;