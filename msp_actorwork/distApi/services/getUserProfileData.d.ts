import type { ServiceActivity } from 'msp_common';
export type GetUserProfileDataPayload = {
    userId: string;
};
export type UserProfileData = {
    userId: string;
    name: string;
    email: string;
    userName: string;
};
export declare const GetUserProfileDataActivity: ServiceActivity;
