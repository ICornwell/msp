import { buildActivitySet } from 'msp_svr_common'
import type { ActivitySet } from 'msp_svr_common'

import { discoverOpenUiFeatures } from '../services/discovery/discoverOpenUiFestures.js';
import { registerManifest } from '../services/discovery/registerManifest.js';

const discoveryActivitySet: ActivitySet =
    buildActivitySet()
        .withNamespace('discovery')
        .withVersion('1.0.0')
        .withMatchingVersionRange('*')
        .withContext('*')
        .use({
            activityName: 'discoverOpenUiFeatures',
            funcs: discoverOpenUiFeatures
        })
        .use({
            activityName: 'registerManifest',
            funcs: registerManifest
        })
        .build();

export { discoveryActivitySet }