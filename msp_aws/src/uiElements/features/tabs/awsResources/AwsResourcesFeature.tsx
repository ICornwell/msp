import { useAwsResourcesBehaviour } from './awsResourcesBehaviour.js';

export function AwsResourcesFeature() {
  const { config } = useAwsResourcesBehaviour();
  return [config];
}

export default AwsResourcesFeature;
