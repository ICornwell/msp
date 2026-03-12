const ports = {
    core: {
        uiWeb: 3000,
        uiBff: 4000,
        serviceHubMF: 3001,
        serviceHub:  process.env.SERVICEHUB_INTERNAL_PORT || 4001
    }
}

export const Ports = ports;

export default Ports;