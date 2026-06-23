import { createBehaviour } from 'msp_ui_common/uiLib';
import { eventTypes } from 'msp_ui_common/uiLib';
import { UserInfoLayout } from './UserBladeContent.js';
import { SessionInfo } from 'msp_ui_common/uiLib/contexts';

export const useUserProfileBehaviour = () => {
  const config = createBehaviour()
    .whenStarted()
      .makeRequest.toActivity
        .withoutWaiting({
          id: 'getUserProfile',
          label: 'Get User Profile',
          action: 'actorwork/getUserProfileData/1.0.0',
          payloadFromSession: (sessionInfo: SessionInfo) => ({ userId: sessionInfo?.userId }),
        })
        .endActivity()
      .endHandler()
    // Add menu entry once data has arrived
    .whenEventRaised(eventTypes.DataCache.DATA_LOADED)
      .whenDataIdentifierSatisfies((vid) => vid?.name === 'UserProfile')
      .makeRequest.toMenus
        .toAdd({
          id: 'user-profile-menu',
          label: 'See User Profile',
          eventName: eventTypes.Navigation.ITEM_CLICK,
          action: 'openUserProfile',
          menuTarget: 'profile',
          context: { viewDataIdentifier: {
            'namespace': 'actorwork',
            'name': 'UserProfile',
            'version': '1.0.0',
            'viewRootEntityId': 'currentuser'}
          }
        })
        .toAdd({
          id: 'logout-user',
          label: 'Logout',
          eventName: eventTypes.Navigation.ITEM_CLICK,
          action: 'logoutUser',
          menuTarget: 'profile'
        })
        .endMenus()
      .endHandler()
    .whenEventRaised(eventTypes.Navigation.ITEM_CLICK)
      .whenDataIdentifierSatisfies((vid) => vid?.name === 'UserProfile')
      .makeRequest.toPresentation
        .toOpenBlade('UserProfileBlade',
          {title: 'User Profile'},
          UserInfoLayout(),
          ({viewDataIdentifier}) => viewDataIdentifier
        )
        .endPresentation()
      .endHandler()
    .whenEventRaised(eventTypes.Navigation.ITEM_CLICK)
      .whenEventSatisfies((event) => event?.payload?.action === 'logoutUser')
      .makeRequest.toSystem
        .toLogoutUser()
        .endSystem()
      .endHandler()
    .build();

  return { config };
};
