import {createView} from 'msp_common'
import { relatedObjects } from '../workObjectsAndRelations.js';

const { participation, work, user } = relatedObjects;

export const actorWorkView = createView('account-people')
  .withVersion('1.0')
  .withConfigSet('main')
  .withRootKey('id')
  .withRootElement(user, false)
    .withSubElement('participation', participation, true)
      .withRelation('hasParticipation')
      .withSubElement('work', work, false)
        .withRelation('forWork')
        .end()
      .end()
    
    .end()
  .endView()
  .build();