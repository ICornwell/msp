import { GetUserProfileDataActivity } from "./getUserProfileData.js";
import { GetUserWorkListDataActivity } from "./getUserWorkListData.js";
import { ServiceActivity } from "msp_svr_common";

export function getServiceActivities(): ServiceActivity[] {
    return [
        GetUserProfileDataActivity,
        GetUserWorkListDataActivity
    ];
}