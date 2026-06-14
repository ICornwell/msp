import { createBehaviour, eventTypes } from 'msp_ui_common/uiLib';

import { awsSetupWizardContent } from './awsSetupWizardContent.js';

const defaultSetupContext = {
  setupId: 'aws-cluster-setup-default',
  region: 'eu-west-2',
  clusterName: 'msp-dev-eks',
};

export const useAwsSettingsBehaviour = () => {
  const config = createBehaviour()
    .whenStarted()
    
    .dispatch.toMenus
      .add({
        id: 'aws-open-setup-wizard',
        label: 'AWS Setup Wizard',
        eventName: eventTypes.Navigation.ITEM_CLICK,
        action: 'openAwsSetupWizard',
        menuTarget: 'settings',
        context: defaultSetupContext,
        groupId: 'platform-infrastructure',
      })
      
      .endMenus()
    .whenEventRaised(eventTypes.Navigation.ITEM_CLICK)
    .whenEventSatisfies((event) => event?.payload?.action === 'awsWizardConnect')
    .dispatch.toActivity
      .callAsync({
        id: 'connectAwsCredentials',
        action: 'aws/connectAwsCredentials/1.0.0',
        payloadFromEvent: (event) => ({
          ...defaultSetupContext,
          setupId: event?.payload?.viewDataContent?.setupId ?? defaultSetupContext.setupId,
          region: event?.payload?.viewDataContent?.region ?? defaultSetupContext.region,
          clusterName: event?.payload?.viewDataContent?.clusterName ?? defaultSetupContext.clusterName,
          accountId: event?.payload?.viewDataContent?.accountId,
          accountName: event?.payload?.viewDataContent?.accountName,
          accessKeyId: event?.payload?.viewDataContent?.accessKeyId,
          secretAccessKey: event?.payload?.viewDataContent?.secretAccessKey,
          sessionToken: event?.payload?.viewDataContent?.sessionToken,
        }),
      })

    .endActivity()
    .whenEventRaised(eventTypes.Navigation.ITEM_CLICK)
    .whenEventSatisfies((event) => event?.payload?.action === 'openAwsSetupWizard')
    .dispatch.toPresentation
      .openBlade(
        'AwsSetupWizardBlade',
        { title: 'AWS Setup Configuration Wizard', bladeWidthPreset: 3 },
        awsSetupWizardContent(),
        {
          viewDomain: 'aws',
          viewName: 'AwsClusterSetupConfig',
          viewVersion: '1.0.0',
          viewRootEntityId: defaultSetupContext.setupId,
        },
      )
      .endPresentation()
    .whenEventRaised(eventTypes.Activity.ACTIVITY_SUCCEEDED)
    .whenEventSatisfies(
      (event) =>
        event?.payload?.namespace === 'aws' &&
        event?.payload?.activityName === 'connectAwsCredentials' &&
        event?.payload?.result?.result?.connected === true,
    )
    .dispatch.toActivity
      .callAsync({
        id: 'refreshAwsWizardViewsAfterConnect',
        action: 'aws/refreshAwsWizardViews/1.0.0',
        payloadFromEvent: (event) => {
          const connectResult = event?.payload?.result?.result ?? {};
          return {
            ...defaultSetupContext,
            setupId: connectResult.setupId ?? defaultSetupContext.setupId,
            region: connectResult.region ?? defaultSetupContext.region,
            clusterName: connectResult.clusterName ?? defaultSetupContext.clusterName,
            refreshes: [
              'setupConfig',
              'wizardBootstrap',
              'eksClusters',
              'ecrRepositories',
              'networkTopology',
            ],
          };
        },
      })
    .endActivity()
    .build();

  return { config };
};
