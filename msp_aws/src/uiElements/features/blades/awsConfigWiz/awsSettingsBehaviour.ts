import { createBehaviour, eventTypes } from 'msp_ui_common/uiLib';

import { awsSetupWizardContent } from './awsSetupWizardContent.js';
import { awsClusterSetupConfigView } from '../../../../data/index.js';

const defaultSetupContext = {
  setupId: 'aws-cluster-setup-default',
  region: 'eu-west-2',
  clusterName: 'msp-dev-eks',
};

export const useAwsSettingsBehaviour = () => {
  const config = createBehaviour()
    .whenStarted()

    .makeRequest.toMenus
    .toAdd({
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
    .makeRequest.toActivity
    .withoutWaiting({
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
    .makeRequest.toPresentation
      .toOpenBlade(
        'AwsSetupWizardBlade',
        () => ({ title: 'AWS Setup Configuration Wizard', bladeWidthPreset: 3, updateWhenDataChanges: true }),
        awsSetupWizardContent(),
        awsClusterSetupConfigView.getViewDataIdentifier(defaultSetupContext.setupId)
      )
    .endPresentation()
    .whenEventRaised(eventTypes.Activity.ACTIVITY_SUCCEEDED)
    .whenEventSatisfies(
      (event) =>
        event?.payload?.namespace === 'aws' &&
        event?.payload?.activityName === 'connectAwsCredentials',
    )
    .makeRequest.toData
    .updateFromEventPayloadResult(
      ({ event }) => awsClusterSetupConfigView.getViewDataIdentifier(
        event?.payload?.result?.setupId ?? defaultSetupContext.setupId,
      ),
      (result, data) => {

        const timestamp = new Date().toISOString();
        const updated = data
        if (result.connection.connected) {
          Object.assign(updated, {
            setupId: result.setupId ?? updated.setupId,
            region: result.region ?? updated.region,
            clusterName: result.clusterName ?? updated.clusterName,
            accountId: result.connection.accountId,
            accountName: result.accountName,
            connectionStatus: 'success',
            connectionMessage: result.connection.message ?? 'AWS credentials connected',
            connectionCheckedAt: result.connection.checkedAt,
            updatedAt: timestamp,
            status: 'ready',
          });
        } else {
          Object.assign(updated, {
            connectionStatus: 'failed',
            connectionMessage: result.message ?? 'AWS credentials failed - unknown reason',
            connectionCheckedAt: timestamp,
            status: 'draft',
          });
        }
        return updated;
      },
    )
    .endData()
    .whenEventRaised(eventTypes.Activity.ACTIVITY_SUCCEEDED)
    .whenEventSatisfies(
      (event) => {
        const connectResult = (event?.payload?.result ?? {}) as Record<string, any>;
        return event?.payload?.namespace === 'aws'
          && event?.payload?.activityName === 'connectAwsCredentials'
          && connectResult.connected === true;
      },
    )
    .makeRequest.toActivity
    .withoutWaiting({
      id: 'refreshAwsWizardViewsAfterConnect',
      action: 'aws/refreshAwsWizardViews/1.0.0',
      payloadFromEvent: (event) => {
        const connectResult = (event?.payload?.result ?? {}) as Record<string, any>;
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
