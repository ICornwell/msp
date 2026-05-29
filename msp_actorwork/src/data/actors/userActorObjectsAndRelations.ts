import { createEntityObject } from "msp_common";
import { userActorSchema } from "./userActorSchemas.js";
import { systemActorSchema } from "./systemActorSchemas.js";
import { groupActorSchema } from "./groupActorSchemas.js";

export const userActorObject = createEntityObject('user', userActorSchema)
          .withId('userActor', '1.0')
          .forDomain({ name: 'actorWork', version: '1.0' })
          .buildObject();

export const systemActorObject = createEntityObject('system', systemActorSchema)
          .withId('systemActor', '1.0')
          .forDomain({ name: 'actorWork', version: '1.0' })
          .buildObject();

export const groupActorObject = createEntityObject('user', groupActorSchema)
          .withId('groupActor', '1.0')
          .forDomain({ name: 'actorWork', version: '1.0' })
          .buildObject();