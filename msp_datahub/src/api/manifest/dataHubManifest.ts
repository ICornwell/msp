import { makeManifest } from "msp_svr_common";
import { getConfig } from "msp_svr_common";

// Service Hub API is the collector of all manifests for the platform
// but still requires it's own manifest

const dataHubManifest = makeManifest(getConfig())
  .withAllowedContexts(['*'])
  .addService('datahub_service1')
    .addActivityFeature('readDataView', '1.0.0', 'default')
        .withAllowedContexts(['*'])
        .forProducts([{
          domain: '*',
          name: '*',
          version: '*'
        }])
        .endActivityFeature
      .addActivityFeature('writeDataView', '1.0.0', 'default')
        .withAllowedContexts(['AUTH'])
        .forProducts([{
          domain: '*',
          name: '*',
          version: '*'
        }])
        .endActivityFeature
    .endService
.build()

export default dataHubManifest;