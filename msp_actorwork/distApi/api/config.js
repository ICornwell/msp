function getEnvOrDefault(key, defaultValue) {
    return process.env[key] || defaultValue;
}
export const config = {
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
//# sourceMappingURL=config.js.map