import { useUserProfileBehaviour } from './UserBladeBehaviour.js';

export function UserProfileFeature() {
  const { config } = useUserProfileBehaviour();
  return config;
}

export default UserProfileFeature;
