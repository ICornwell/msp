import type { ManifestServiceBuilder } from 'msp_svr_common';

export function addLloydsMsgActivityFeatures(service: ManifestServiceBuilder<any, any>)
{ 
  return service
    .withActivityFeature('lloydsMsglView', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endActivityFeature
    
}

