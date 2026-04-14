import { createBehaviour } from 'msp_ui_common/uiLib';
import { eventTypes } from 'msp_ui_common/uiLib';
import { workItemDetail } from './workItemDetail.js';

export const useUserWorkDetailBehaviour = () => {
  const config = createBehaviour()
    
    // Show tab when requested
    .whenEventRaised(eventTypes.Navigation.ITEM_CLICK)
      .whenEventSatisfies((event: any) => event.payload?.viewDataIdentifier?.viewName === 'UserWorkList'
        && event.payload?.viewDataIdentifier.recordId)
      .dispatch.toPresentation
        .openTab('UserDetailTab',
          {title: (event: any) => `WD-${event.payload?.viewDataIdentifier.recordId}`,
           idSuffix: (event: any) =>event.payload?.viewDataIdentifier.recordId, closable: true},
          workItemDetail(),
          (event: any) => event.payload?.viewDataIdentifier
        )
        .end()
    .build();

  return { config };
};
