import { createEntityObject } from "msp_common";
import { userActorSchema } from "./userActorSchemas.js";
import { systemActorSchema } from "./systemActorSchemas.js";
import { groupActorSchema } from "./groupActorSchemas.js";

export const userActorObject = createEntityObject('user', userActorSchema)
          .withFQId({ namespace: 'actorWork', version: '1.0'})
          .forDomain({ name: 'actorWork', version: '1.0' })
          .buildObject();

export const systemActorObject = createEntityObject('system', systemActorSchema)
          .withFQId({ namespace: 'actorWork', version: '1.0'})
          .forDomain({ name: 'actorWork', version: '1.0' })
          .buildObject();

export const groupActorObject = createEntityObject('user', groupActorSchema)
          .withFQId({ namespace: 'actorWork', version: '1.0'})
          .forDomain({ name: 'actorWork', version: '1.0' })
          .buildObject();