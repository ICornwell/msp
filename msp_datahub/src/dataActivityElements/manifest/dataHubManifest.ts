import { makeManifest } from "msp_svr_common";
import { getConfig } from "msp_svr_common";

// Service Hub API is the collector of all manifests for the platform
// but still requires it's own manifest

const dataHubManifest = makeManifest(getConfig())
  .withAllowedContexts(['*'])
  .withService('datahub_service1')
    .withActivityFeature('readDataView', '1.0.0', 'default')
        .withAllowedContexts(['*'])
        .forProducts([{
          domain: '*',
          name: '*',
          version: '*'
        }])
        .endActivityFeature
      .withActivityFeature('writeDataView', '1.0.0', 'default')
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