import { createBehaviour } from 'msp_ui_common/uiLib';
import { eventTypes } from 'msp_ui_common/uiLib';
import { workListContent } from './workListContent.js';

export const useUserWorkListBehaviour = () => {
  const config = createBehaviour()
    .whenStarted()
        .dispatch.toActivity
        .callAsync({
          id: 'getUserWork',
          action: 'actorwork/getUserWorkListData/1.0.0',
          payloadFromSession: (sessionInfo) => ({ userId: sessionInfo?.userId }),
        })
        .end()
    // Add menu entry once data has arrived
    .whenEventRaised(eventTypes.DataCache.DATA_LOADED)
      .whenEventSatisfies((event: any) => event.payload?.viewDataContent?.viewName === 'UserWorkList')
      .dispatch.toPresentation
        .openTab('UserWorkListTab',
          {title: 'User Work List', closable: false},
          workListContent(),
          (event: any) => event.payload?.viewDataIdentifier
        )
        .end()
    .build();

  return { config };
};
