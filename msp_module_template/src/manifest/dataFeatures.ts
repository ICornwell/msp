import type { ManifestServiceBuilder } from 'msp_svr_common';

export function addModuleXDataFeatures(service: ManifestServiceBuilder<any, any>)
{ 
  return service
  /*
    .withDataFeature('moduleXFetch', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endDataFeature
  */  
}