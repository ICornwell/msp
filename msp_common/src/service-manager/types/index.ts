export type ServicePayload = {
  [key: string]: any;
};

export type ServiceResult = {
  success: boolean;
  data?: any;
  error?: string;
};

export type ServiceActivityFunction = (payload: ServicePayload, result: ServiceResult) => ServiceResult;

export interface ServiceActivityRegistration {
  namespace: string;
  activityName: string;
  version: string;
  activities: ServiceActivityFunction | ServiceActivityFunction[];
}