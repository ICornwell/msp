
import { SharedConfig } from "msp_svr_common"
import type { Config as ConfigType } from "msp_svr_common"

const config ={
    ...SharedConfig
}

export const Config: Partial<ConfigType> = config

export default Config