import { ActivitySet, buildActivitySet } from 'msp_svr_common';

import {
  listPamelaArtefactsHandler,
  listPamelaAssertionsHandler,
  writePamelaAssertionsHandler,
  writePamelaSemanticAssertionsHandler,
} from '../services/pamelaDataservices.js';



export const PamelaResourceDataActivities: ActivitySet =
  buildActivitySet()
    .withNamespace('pamela')
    .withVersion('1.0.0')
    .withMatchingVersionRange('*')
    .withContext('*')
    .use({
      activityName: 'pamelaArtefacts',
      funcs: listPamelaArtefactsHandler,
    })
    .use({
      activityName: 'pamelaAssertions',
      funcs: listPamelaAssertionsHandler,
    })
     .use({
      activityName: 'writePamelaAssertions',
      funcs: writePamelaAssertionsHandler,
    })
    .use({
      activityName: 'writePamelaSemanticAssertions',
      funcs: writePamelaSemanticAssertionsHandler,
    })

    .build();
