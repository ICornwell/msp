import { useUserWorkListBehaviour } from '././workListBehaviour.js';
import { useUserWorkDetailBehaviour } from './workDetailBehaviour.js';

export function UserWorkListFeature() {
  const { config: config1 } = useUserWorkListBehaviour();
  const { config: config2 } = useUserWorkDetailBehaviour();
  return [config1, config2];
}

export default UserWorkListFeature;
