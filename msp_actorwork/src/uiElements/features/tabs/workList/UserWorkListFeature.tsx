import { useUserWorkListBehaviour } from '././workListBehaviour.js';

export function UserWorkListFeature() {
  const { config } = useUserWorkListBehaviour();
  return config;
}

export default UserWorkListFeature;
