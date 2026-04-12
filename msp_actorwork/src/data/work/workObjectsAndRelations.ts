import { createDomainObject, createRelations } from "msp_common";
import { workSchema } from "./workSchemas";
import { participationSchema } from "./participationSchemas";
import { userActorObject } from "../userActors/userActorObjectsAndRelations";

export const workObject = createDomainObject('work', workSchema)
          .withId('work', '1.0')
          .forDomain({ id: 'actorWork', version: '1.0' })
          .withIsEntity(true)
          .buildDomainObject();

export const participationObject = createDomainObject('participation', participationSchema)
          .withId('participation', '1.0')
          .forDomain({ id: 'actorWork', version: '1.0' })
          .withIsEntity(true)
          .buildDomainObject();

export const relatedObjects = createRelations()
  .allowRelationFrom('forWork', participationObject, workObject, false)
  .allowRelationFrom('hasParticipation', userActorObject, participationObject, true)
  .allowRelationTo('hasParticipation', participationObject, workObject, true)
  .allowRelationTo('withActor', userActorObject, participationObject, false)
  .buildRelatedObjects();

