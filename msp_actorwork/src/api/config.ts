// Actorwork Service Configuration
export type ActorworkConfig = {
  port: number;
  myUrl: string;
  uiRemoteUrl: string;
  serviceHubUrl: string;
  service: {
    name: string;
    domain: string;
    version: string;
  };
};

function getEnvOrDefault(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export const config: ActorworkConfig = {
  port: parseInt(getEnvOrDefault('PORT', '3101'), 10),
  myUrl: getEnvOrDefault('MY_URL', 'http://localhost:3101'),
  uiRemoteUrl: getEnvOrDefault('UI_REMOTE_URL', 'http://localhost:3102'),
  serviceHubUrl: getEnvOrDefault('SERVICEHUB_URL', 'http://localhost:4001'),
  service: {
    name: 'actorwork',
    domain: 'actorwork',
    version: '1.0.0',
  },
};

export default config;
