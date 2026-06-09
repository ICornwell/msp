import { getUserProfileDataHandler } from "../services/getUserProfileData.js";
import { getUserWorkListDataHandler } from "../services/getUserWorkListData.js";
import { ActivitySet, buildActivitySet } from "msp_svr_common";

const actorWorkActivities: ActivitySet = buildActivitySet()
        .withNamespace('actorwork')
        .withVersion('1.0.0')
        .withMatchingVersionRange('*')
        .withContext('*')
        .use({
            activityName: 'getUserProfileData',
            funcs: getUserProfileDataHandler
        })
        .use({
            activityName: 'getUserWorkListData',
            funcs: getUserWorkListDataHandler
        })
   .build();

export { actorWorkActivities };