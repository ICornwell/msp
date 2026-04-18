import { createBehaviour } from 'msp_ui_common/uiLib';
import { eventTypes } from 'msp_ui_common/uiLib';
import { UserInfoLayout } from './UserBladeContent.js';
import { SessionInfo } from 'msp_ui_common/uiLib/contexts';

export const useUserProfileBehaviour = () => {
  const config = createBehaviour()
    .whenStarted()
      .dispatch.toActivity
        .callAsync({
          id: 'getUserProfile',
          label: 'Get User Profile',
          action: 'actorwork/getUserProfileData/1.0.0',
          payloadFromSession: (sessionInfo: SessionInfo) => ({ userId: sessionInfo?.userId }),
        })
        .end()
    // Add menu entry once data has arrived
    .whenEventRaised(eventTypes.DataCache.DATA_LOADED)
      .whenDataIdentifierSatisfies((vid) => vid?.viewName === 'UserProfile')
      .dispatch.toMenus
        .add({
          id: 'user-profile-menu',
          label: 'See User Profile',
          eventName: eventTypes.Navigation.ITEM_CLICK,
          action: 'openUserProfile',
          menuTarget: 'profile',
          context: { viewDataIdentifier: {
            'viewDomain': 'actorwork',
            'viewName': 'UserProfile',
            'viewVersion': '1.0.0',
            'viewRootEntityId': 'currentuser'}
          }
        } as any)
        .end()
    .whenEventRaised(eventTypes.Navigation.ITEM_CLICK)
      .whenDataIdentifierSatisfies((vid) => vid?.viewName === 'UserProfile')
      .dispatch.toPresentation
        .openBlade('UserProfileBlade',
          {title: 'User Profile'},
          UserInfoLayout(),
          ({viewDataIdentifier}) => viewDataIdentifier
        )
        .end()
    .build();

  return { config };
};
