import { createBehaviour } from 'msp_ui_common/uiLib';
import { eventTypes } from 'msp_ui_common/uiLib';
import { workItemDetail } from './workItemDetail.js';

export const useUserWorkDetailBehaviour = () => {
  const config = createBehaviour()
    
    // Show tab when requested
    .whenEventRaised(eventTypes.Navigation.ITEM_CLICK)
      .whenDataIdentifierSatisfies((vid) => vid?.viewName === 'UserWorkList' && !!vid?.recordId)
      .dispatch.toPresentation
        .openTab('UserDetailTab',
          {title: ({viewDataIdentifier, event}) => `WD-${viewDataIdentifier?.recordId} ${event.payload}`,
           idSuffix: ({viewDataIdentifier}) => viewDataIdentifier?.recordId, closable: true},
          workItemDetail(),
          ({viewDataIdentifier}) => viewDataIdentifier
        )
        .end()
    .build();

  return { config };
};
