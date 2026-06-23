import { createBehaviour } from 'msp_ui_common/uiLib';
import { eventTypes } from 'msp_ui_common/uiLib';
import { workListContent } from './workListContent.js';

export const useUserWorkListBehaviour = () => {
  const config = createBehaviour()
    .whenStarted()
        .makeRequest
          .toActivity.withoutWaiting({
            id: 'getUserWork',
            action: 'actorwork/getUserWorkListData/1.0.0',
            payloadFromSession: (sessionInfo) => ({ userId: sessionInfo?.userId }),
          })
          .endActivity()
        .endHandler()
    // Add menu entry once data has arrived
    .whenEventRaised(eventTypes.DataCache.DATA_LOADED)
      .whenDataIdentifierSatisfies((vid) => vid?.name === 'UserWorkList' && !vid?.recordId)
      .makeRequest
        .toPresentation.toOpenTab('UserWorkListTab',
          {title: 'User Work List', closable: false},
            workListContent(),
            ({viewDataIdentifier}) => viewDataIdentifier
          )
          .endPresentation()
        .endHandler()
    .build();

  return { config };
};
