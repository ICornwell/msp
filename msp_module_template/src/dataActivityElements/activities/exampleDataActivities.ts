import { ActivitySet, buildActivitySet } from 'msp_svr_common';

import {
  listModule_TemplateArtefactsHandler,
  listModule_TemplateAssertionsHandler,
  writeModule_TemplateAssertionsHandler,
  writeModule_TemplateSemanticAssertionsHandler,
} from '../services/exampleDataservices.js';



export const exampleDataActivities: ActivitySet =
  buildActivitySet()
    .withNamespace('pamela')
    .withVersion('1.0.0')
    .withMatchingVersionRange('*')
    .withContext('*')
    .use({
      activityName: 'pamelaArtefacts',
      funcs: listModule_TemplateArtefactsHandler,
    })
    .use({
      activityName: 'pamelaAssertions',
      funcs: listModule_TemplateAssertionsHandler,
    })
     .use({
      activityName: 'writeModule_TemplateAssertions',
      funcs: writeModule_TemplateAssertionsHandler,
    })
    .use({
      activityName: 'writeModule_TemplateSemanticAssertions',
      funcs: writeModule_TemplateSemanticAssertionsHandler,
    })

    .build();
