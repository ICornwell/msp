const ports = {
    core: {
        uiWeb: 3000,
        uiBff: 4000,
        semaphores: process.env.SERVICEHUB_INTERNAL_PORT || 4200,
        serviceHub:  process.env.SERVICEHUB_INTERNAL_PORT || 4001,
        dataHub:  process.env.SERVICEHUB_INTERNAL_PORT || 4002,
        actorWorkMainService:  process.env.ACTORWORK_INTERNAL_PORT || 4003,
        MF_actorWorkMainService:  process.env.ACTORWORK_MF_INTERNAL_PORT || 3003
    }
}

export const Ports = ports;

export default Ports;