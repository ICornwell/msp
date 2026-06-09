import { buildActivitySet, ServiceActivityResultBuilder } from 'msp_svr_common'
import type { ActivitySet } from 'msp_svr_common'
import { getRegisteredDataFeatures } from '../services/dataFeatureRegistry.js';
import { registerDataFeaturesActivity } from '../services/registerDataFeaturesActivity.js';



const discoveryActivitySet: ActivitySet = buildActivitySet()
.withNamespace('discovery')
.withVersion('1.0.0')
.withMatchingVersionRange('*')
.withContext('*')
.use({
      activityName: 'registerDataFeatures',
    funcs: registerDataFeaturesActivity
})
.use({

    activityName: 'getRegisteredDataFeatures',

    funcs: async (_payload, serviceResult: ServiceActivityResultBuilder) => {
        return serviceResult.success({
            features: getRegisteredDataFeatures,
        });
    }
})
.build();

export { discoveryActivitySet }