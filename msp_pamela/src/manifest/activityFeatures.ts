import type { ManifestServiceBuilder } from 'msp_svr_common';


export function addPamelaActivityFeatures(service: ManifestServiceBuilder<any, any>)
{ 
  return service
    .withActivityFeature('listArtefacts', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endActivityFeature
    .withActivityFeature('listAssertions', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endActivityFeature
  
}

