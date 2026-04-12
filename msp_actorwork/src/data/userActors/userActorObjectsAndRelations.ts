import { createDomainObject } from "msp_common";
import { userActorSchema } from "./userActorSchemas.js";

export const userActorObject = createDomainObject('user', userActorSchema)
          .withId('userActor', '1.0')
          .forDomain({ id: 'actorWork', version: '1.0' })
          .withIsEntity(true)
          .buildDomainObject();