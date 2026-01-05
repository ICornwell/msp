import { FluxorData } from "../../fluxor/fluxorData";
export type UserInfo = {
    userId: string;
    userName: string;
    email: string;
    marketingConsent: boolean;
    phoneNumber: string;
    joinedDate: string;
    creditLimit: number;
    schemePoints: number;
    friends?: UserInfo[];
    requests?: UserRequests[];
    preferences?: UserPreferences;
};
export type UserPreferences = {
    fontSize: string;
    colorPalette: string;
};
export type UserRequests = {
    title: string;
    notes: string;
    dateRequested: string;
    dateNeededBy: string;
    dateCompleted?: string;
    isCompleted: boolean;
};
export declare const userRequestFluxorData: FluxorData<UserRequests>;
export declare const userPreferencesFluxorData: FluxorData<UserPreferences>;
export declare const userInfoFluxorData: FluxorData<UserInfo>;
