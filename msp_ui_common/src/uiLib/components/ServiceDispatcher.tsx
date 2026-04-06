import {
  ActivityDispatchProvider
} from '../contexts/ActivityDispatchContext.js';

export type ServiceDispatcherConfig = {
  serviceHubUrl?: string;
  defaultTimeout?: number;
};

/**
 * @deprecated Use ActivityDispatchProvider directly.
 * Kept for backward compatibility — renders ActivityDispatchProvider with the same config shape.
 */
export function ServiceDispatcher({ config, children }: { config?: ServiceDispatcherConfig; children?: any }) {
  return (
    <ActivityDispatchProvider
      serviceHubUrl={config?.serviceHubUrl}
      defaultTimeout={config?.defaultTimeout}
    >
      {children}
    </ActivityDispatchProvider>
  );
}

