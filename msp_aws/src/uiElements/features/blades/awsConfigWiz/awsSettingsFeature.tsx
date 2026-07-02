import { useAwsSettingsBehaviour } from './awsSettingsBehaviour.js';
import { useAwsEcrWizardBehaviour } from './awsEcrWizardBehaviour.js';

export function AwsSettingsFeature() {
  const { config } = useAwsSettingsBehaviour();
  const { config: ecrConfig } = useAwsEcrWizardBehaviour();
  return [config, ecrConfig];
}

export default AwsSettingsFeature;
