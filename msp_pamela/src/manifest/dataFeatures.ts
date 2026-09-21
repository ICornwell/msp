import type { ManifestServiceBuilder } from 'msp_svr_common';

export function addPamelaDataFeatures(service: ManifestServiceBuilder<any, any>)
{ 
  return service
    .withDataFeature('pamelaArtefacts', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endDataFeature
    .withDataFeature('pamelaAssertions', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endDataFeature
    .withDataFeature('writePamelaAssertions', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endDataFeature
    .withDataFeature('writePamelaSemanticAssertions', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endDataFeature
   
}