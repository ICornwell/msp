// UI Request Messages - commands to subsystems

export type UiRequestMessage<T = any> = {
  messageType: string;
  payload: T;
  correlationId?: string;
  timestamp?: number;
};

// Data subsystem requests
export type DataRequest<T = any> = UiRequestMessage<{
  requestType: 'load' | 'save' | 'delete' | 'invalidate';
  dataType: string;
  dataKey: string;
  data?: T;
  forceRefresh?: boolean;
}>;

export function createDataRequest<T>(
  requestType: DataRequest['payload']['requestType'],
  dataType: string,
  dataKey: string,
  data?: T,
  forceRefresh = false
): DataRequest<T> {
  return {
    messageType: 'DataRequest',
    payload: { requestType, dataType, dataKey, data, forceRefresh },
    timestamp: Date.now(),
  };
}

// Service call requests
export type ServiceCallRequest<T = any> = UiRequestMessage<{
  namespace: string;
  activityName: string;
  version: string;
  payload: T;
  context?: string;
}>;

export function createServiceCallRequest<T>(
  namespace: string,
  activityName: string,
  version: string,
  payload: T,
  context?: string
): ServiceCallRequest<T> {
  return {
    messageType: 'ServiceCallRequest',
    payload: { namespace, activityName, version, payload, context },
    timestamp: Date.now(),
  };
}

// Presentation subsystem requests
export type PresentationRequest = UiRequestMessage<{
  requestType: 'openBlade' | 'closeBlade' | 'openTab' | 'closeTab' | 'navigate' | 'showModal' | 'hideModal';
  target: string;
  params?: any;
}>;

export function createPresentationRequest(
  requestType: PresentationRequest['payload']['requestType'],
  target: string,
  params?: any
): PresentationRequest {
  return {
    messageType: 'PresentationRequest',
    payload: { requestType, target, params },
    timestamp: Date.now(),
  };
}

// Menu management requests
export type MenuRequest = UiRequestMessage<{
  requestType: 'add' | 'remove' | 'enable' | 'disable' | 'update';
  menuId: string;
  label?: string;
  action?: string;
  enabled?: boolean;
  visible?: boolean;
  context?: any;
}>;

export function createMenuRequest(
  requestType: MenuRequest['payload']['requestType'],
  menuId: string,
  options?: Partial<Omit<MenuRequest['payload'], 'requestType' | 'menuId'>>
): MenuRequest {
  return {
    messageType: 'MenuRequest',
    payload: { requestType, menuId, ...options },
    timestamp: Date.now(),
  };
}
