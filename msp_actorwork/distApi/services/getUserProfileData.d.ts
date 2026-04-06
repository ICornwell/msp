import type { ServiceActivity } from 'msp_svr_common';
import type { DataObject } from 'msp_common';
export type GetUserProfileDataPayload = {
    userId: string;
};
export type UserProfileData = {
    userId: string;
    name: string;
    email: string;
    userName: string;
} & Partial<DataObject>;
export declare const GetUserProfileDataActivity: ServiceActivity;
