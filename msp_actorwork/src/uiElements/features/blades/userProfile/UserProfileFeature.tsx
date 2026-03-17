import * as uiLibNs from 'msp_ui_common/uiLib';
import { useUserProfileBehaviour } from './UserBladeBehaviour.js';

type UiLibModule = typeof uiLibNs;
type UiLibModuleWithDefault = UiLibModule & { default?: UiLibModule };

const uiLib: UiLibModule = (uiLibNs as UiLibModuleWithDefault).default ?? uiLibNs;

export function UserProfileFeature() {
  const { Behaviour } = uiLib;
  const config = useUserProfileBehaviour();
  return <Behaviour config={config} />;
}

export default UserProfileFeature;
