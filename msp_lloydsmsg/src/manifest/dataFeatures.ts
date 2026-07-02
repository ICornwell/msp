import type { ManifestServiceBuilder } from 'msp_svr_common';

export function addLloydsMsgDataFeatures(service: ManifestServiceBuilder<any, any>)
{ 
  return service
  /*
    .withDataFeature('lloydsMsgFetch', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endDataFeature
  */  
}