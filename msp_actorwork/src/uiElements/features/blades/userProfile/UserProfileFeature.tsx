import { Behaviour } from 'msp_ui_common/uiLib/behaviours';
import { useUserProfileBehaviour } from './UserBladeBehaviour.js';

export function UserProfileFeature() {
  const config = useUserProfileBehaviour();
  return <Behaviour config={config} />;
}

export default UserProfileFeature;
