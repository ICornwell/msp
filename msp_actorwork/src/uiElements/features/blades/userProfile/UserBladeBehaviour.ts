import { createBehaviour } from 'msp_ui_common/uiLib/behaviours';

// This behaviour orchestrates the User Profile feature flow:
// 1. Listen for UserChanged
// 2. Request GetUserProfileData from service
// 3. Listen for DataLoaded
// 4. Add "See User Profile" menu item
// 5. Listen for menu click
// 6. Open User Profile blade

export function useUserProfileBehaviour() {
  return UserProfileBehaviourConfig;
}

export const UserProfileBehaviourConfig = createBehaviour()
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
    .whenEventSatisfies((event: any) => event.payload?.dataType === 'userProfile')
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
