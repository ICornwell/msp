import { ActivitySet, buildActivitySet } from 'msp_svr_common'

import { discoverOpenUiFeatures, registerUiFeatures } from '../services/index.js';

const discoveryActivitySet: ActivitySet = buildActivitySet()
    .withNamespace('discovery')
    .withVersion('1.0.0')
    .withMatchingVersionRange('*')
    .withContext('*')
    .use({
        activityName: 'discoverOpenUiFeatures',
        funcs: discoverOpenUiFeatures,
    })

    .use({
        activityName: 'registerUiFeature',
        funcs: registerUiFeatures,
    }).build();

export { discoveryActivitySet }