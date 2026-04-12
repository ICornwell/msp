import { GetUserProfileDataActivity } from "../services/getUserProfileData.js";
import { GetUserWorkListDataActivity } from "./getUserWorkListData.js";
import { ServiceActivity } from "../../../msp_svr_common/dist/service-manager/serviceActivitySet.js";

export function getServiceActivities(): ServiceActivity[] {
    return [
        GetUserProfileDataActivity,
        GetUserWorkListDataActivity
    ];
}