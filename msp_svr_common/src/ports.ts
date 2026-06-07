const ports = {
    core: {
        uiWeb: 3000,
        uiBff: 4000,
        serviceHub:  process.env.SERVICEHUB_INTERNAL_PORT || 4001,
        dataHub:  process.env.SERVICEHUB_INTERNAL_PORT || 4002,
        msp_actorwork:  process.env.ACTORWORK_INTERNAL_PORT || 4003,
        MF_msp_actorwork:  process.env.ACTORWORK_MF_INTERNAL_PORT || 3003,
        msp_semaphores: process.env.SEMAPHORES_INTERNAL_PORT || 4200,
        msp_security: process.env.SECURITY_INTERNAL_PORT || 4004,
    },
    modules: {
        'aws-awsMainService-1.0.0-default': {
            services: 4011,
            data: 5011,
            ui: 3011
        },
        'actorWork-activityService-1.0.0-default': {
            services: 4003,
            ui: 3003
        }
    }
}

export const Ports = ports;

export default Ports;