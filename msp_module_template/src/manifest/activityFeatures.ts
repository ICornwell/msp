import type { ManifestServiceBuilder } from 'msp_svr_common';

export function addModuleXActivityFeatures(service: ManifestServiceBuilder<any, any>)
{ 
  return service
    .withActivityFeature('moduleXlView', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endActivityFeature
    
}

