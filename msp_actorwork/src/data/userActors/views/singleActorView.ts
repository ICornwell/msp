import {createView} from 'msp_svr_common'
import { userActorObject } from '../userActorObjectsAndRelations.js';



export const accountsPeopleOrdersItemsProductsViewContext = createView('account-people')
  .withVersion('1.0')
  .withConfigSet('main')
  .withRootKey('accountNumber')
  .withRootElement(userActorObject, false)
    
    .end()
  .endView()
  .build();