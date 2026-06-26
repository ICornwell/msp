import {createView} from 'msp_common'
import { relatedObjects } from '../workObjectsAndRelations.js';

const { actorWorkLink, work, user } = relatedObjects;

export const actorWorkView = createView('actor-work')
  .withVersion('1.0')
  .withConfigSet('main')
 .useBusinessKey()
  .withRootElement(user, false)
    .withNamedSubElement('withWork', actorWorkLink, true)
      .withRelation('hasUserWork')
      .withNamedSubElement('work', work, false)
        .withRelation('withLinkedActorWork')
          .end()
      .end()
    
    .end()
  .endView()
  .build();