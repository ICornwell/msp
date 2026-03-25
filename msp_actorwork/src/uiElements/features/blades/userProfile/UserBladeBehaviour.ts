import { createBehaviour } from 'msp_ui_common/uiLib';

export const useUserProfileBehaviour = () => createBehaviour()
  .whenEventRaised('UserChanged')
    .requestIsRaised.toActivitySubSystem
      .toCallActivityAsync({
        id: 'getUserProfile',
        label: 'Get User Profile',
        action: 'actorwork/GetUserProfileData/1.0.0',
        payloadFromEvent: (event: any) => ({ userId: event.payload?.userId }),
      })
      .end()
  .whenEventRaised('DataLoaded')
    .whenEventSatisfies((event: any) => event.payload?.dataType === 'GetUserProfileData')
    .requestIsRaised.toPresentationSubsystem.menus
      .toAdd({
        id: 'user-profile-menu',
        label: 'See User Profile',
        eventName: 'MENU',
        action: 'openUserProfile'
      } as any)
      .end()
  .whenEventRaised('MenuItemClick')
    .whenEventSatisfies((event: any) => event.payload?.menuId === 'user-profile-menu')
    .requestIsRaised.toPresentationSubsystem.requests
      .toOpenBlade('UserProfileBlade', (event: any) => ({ context: event.payload?.context }))
      .end()
  .build();
