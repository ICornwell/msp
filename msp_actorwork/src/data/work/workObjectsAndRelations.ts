import { createRelations, createEntityObject } from "msp_common";
import { workSchema } from "./workSchemas";
import { linkSchema } from "./linkSchemas";
import { userActorObject, systemActorObject, groupActorObject } from "../actors/userActorObjectsAndRelations";
import { create } from "node:domain";

export const workObject = createEntityObject('work', workSchema)
          .withId('work', '1.0')
          .forDomain({ name: 'actorWork', version: '1.0' })
          .buildObject();

export const actorWorkLinkObject = createEntityObject('actorWorkLink', linkSchema)
          .withId('actorWorkLink', '1.0')
          .forDomain({ name: 'actorWork', version: '1.0' })
          .buildObject();

export const actorActorLinkObject = createEntityObject('actorActorLink', linkSchema)
          .withId('actorActorLink', '1.0')
          .forDomain({ name: 'actorWork', version: '1.0' })
          .buildObject();

export const workWorkLinkObject = createEntityObject('workWorkLink', linkSchema)
          .withId('workWorkLink', '1.0')
          .forDomain({ name: 'actorWork', version: '1.0' })
          .buildObject();

export const relatedObjects = createRelations()
  .allowRelationFromTo('isPartOf', workObject, workWorkLinkObject, false)
  .allowRelationFromTo('hasUserWork', userActorObject, actorWorkLinkObject, true)
  .allowRelationFromTo('hasSystemWork', systemActorObject, actorWorkLinkObject, true)
  .allowRelationFromTo('hasGroupWork', groupActorObject, actorWorkLinkObject, true)
  .allowRelationFromTo('withLinkedActorWork', actorWorkLinkObject, workObject, true)
  .allowRelationFromTo('withLinkedUserActor', actorWorkLinkObject, userActorObject, false)
  .allowRelationFromTo('withLinkedSystemActor', actorWorkLinkObject, systemActorObject, false)
  .allowRelationFromTo('withLinkedGroupActor', actorWorkLinkObject, groupActorObject, false)
  .allowRelationFromTo('withLinkedOtherWork', workWorkLinkObject, workObject, false)
  .buildRelatedObjects();



relatedObjects.actorWorkLink._allowedRelationsToNames