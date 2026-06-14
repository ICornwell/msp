import { useAwsSettingsBehaviour } from './awsSettingsBehaviour.js';

export function AwsSettingsFeature() {
  const { config } = useAwsSettingsBehaviour();
  return [config];
}

export default AwsSettingsFeature;
