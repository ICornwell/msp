import { useState } from 'react';
import { Behaviour, useUiEventSubscriber } from 'msp_ui_common/uiLib';
import { Blade } from 'msp_ui_common/uiLib/components';
import { useUserProfileBehaviour } from './UserBladeBehaviour.js';

type UserProfileData = {
  userId: string;
  name: string;
  email: string;
  userName: string;
};

export function UserProfileFeature() {
  const config = useUserProfileBehaviour();
  const [bladeOpen, setBladeOpen] = useState(false);
  const [userData, setUserData] = useState<UserProfileData | null>(null);

  // Capture user profile data when the service call completes
  useUiEventSubscriber({
    msgTypeFilter: (msg) =>
      msg.messageType === 'DataLoaded' &&
      msg.payload?.dataType === 'GetUserProfileData',
    callback: (msg) => setUserData(msg.payload?.data as UserProfileData),
  });

  // Open/close driven by PresentationRequest from the behaviour chain
  useUiEventSubscriber({
    msgTypeFilter: (msg) =>
      msg.messageType === 'PresentationRequest' &&
      msg.payload?.requestType === 'openBlade' &&
      msg.payload?.target === 'UserProfileBlade',
    callback: () => setBladeOpen(true),
  });

  useUiEventSubscriber({
    msgTypeFilter: (msg) =>
      msg.messageType === 'PresentationRequest' &&
      msg.payload?.requestType === 'closeBlade' &&
      msg.payload?.target === 'UserProfileBlade',
    callback: () => setBladeOpen(false),
  });

  return (
    <>
      <Behaviour config={config} />
      <Blade isOpen={bladeOpen} onClose={() => setBladeOpen(false)} contentId="UserProfileBlade">
        {userData && (
          <div style={{ padding: '8px 0' }}>
            <div><strong>Name:</strong> {userData.name}</div>
            <div><strong>Email:</strong> {userData.email}</div>
            <div><strong>Username:</strong> {userData.userName}</div>
          </div>
        )}
      </Blade>
    </>
  );
}

export default UserProfileFeature;
