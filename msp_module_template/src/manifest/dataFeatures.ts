import type { ManifestServiceBuilder } from 'msp_svr_common';

export function addModule_TemplateDataFeatures(service: ManifestServiceBuilder<any, any>)
{ 
  return service
    .withDataFeature('module_templateArtefacts', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endDataFeature
    .withDataFeature('module_templateAssertions', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endDataFeature
    .withDataFeature('writeModule_TemplateAssertions', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endDataFeature
    .withDataFeature('writeModule_TemplateSemanticAssertions', '1.0.0', 'default')
      .withAllowedContexts(['AUTH'])
      .forProducts([{ domain: '*', name: '*', version: '*' }])
      .endDataFeature
   
}