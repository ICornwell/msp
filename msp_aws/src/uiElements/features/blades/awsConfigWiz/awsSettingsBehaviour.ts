import { createBehaviour, eventTypes } from 'msp_ui_common/uiLib';

import { awsSetupWizardContent } from './awsSetupWizardContent.js';
import { awsClusterSetupConfigView } from '../../../../data/index.js';

const defaultSetupContext = {
  setupId: 'aws-cluster-setup-default',
  region: 'eu-west-2',
  clusterName: 'msp-dev-eks',
};

export const useAwsSettingsBehaviour = () => {
  let lastEnteredCredentials: {
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionToken?: string;
  } = {};

  const config = createBehaviour()
    .whenStarted()
      .makeRequest
        .toMenus
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
      .endHandler()
    // --- Test Credentials ---
    .whenEventRaised(eventTypes.Navigation.ITEM_CLICK)
      .whenEventSatisfies((event) => event?.payload?.action === 'awsWizardConnect')
      .localEffect((context) => {
        const current = (context.event as any)?.payload?.viewDataContent ?? {};
        lastEnteredCredentials = {
          accessKeyId: current.accessKeyId,
          secretAccessKey: current.secretAccessKey,
          sessionToken: current.sessionToken,
        };
      })
      .endEffect()
      .makeRequest
        .toData.toUpdateFromEventResult(
          ({ event }) => awsClusterSetupConfigView.getViewDataIdentifier(
            event?.payload?.viewDataContent?.setupId ?? defaultSetupContext.setupId,
          ),
          (_result, data) => {
            const timestamp = new Date().toISOString();
            const updated = data;
            Object.assign(updated, {
              connectionStatus: '',
              connectionMessage: 'Testing AWS credentials with supplied values',
              connectionCheckedAt: timestamp,
              status: 'draft',
            });
            return updated;
          }
        )
        .endData()
      .then()
      .makeRequest
        .toActivity.withoutWaiting({
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
      .endHandler()
    // --- Store Credentials ---
    .whenEventRaised(eventTypes.Navigation.ITEM_CLICK)
      .whenEventSatisfies((event) => event?.payload?.action === 'awsWizardStoreCredentials')
      .localEffect((context) => {
        const current = (context.event as any)?.payload?.viewDataContent ?? {};
        lastEnteredCredentials = {
          accessKeyId: current.accessKeyId,
          secretAccessKey: current.secretAccessKey,
          sessionToken: current.sessionToken,
        };
      })
      .endEffect()
      .makeRequest
        .toData.toUpdateFromEventResult(
          ({ event }) => awsClusterSetupConfigView.getViewDataIdentifier(
            event?.payload?.viewDataContent?.setupId ?? defaultSetupContext.setupId,
          ),
          (_result, data) => {
            const timestamp = new Date().toISOString();
            const updated = data;
            Object.assign(updated, {
              connectionMessage: 'Storing validated credentials to secure vault',
              connectionCheckedAt: timestamp,
            });
            return updated;
          }
        )
        .endData()
      .then()
      .makeRequest
        .toActivity.withoutWaiting({
          id: 'storeAwsCredentials',
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
            persistCredentials: true,
          }),
        })
        .endActivity()
      .endHandler()
    // --- Calculate Subnet Plan ---
    .whenEventRaised(eventTypes.Navigation.ITEM_CLICK)
      .whenEventSatisfies((event) => event?.payload?.action === 'awsWizardCalculateSubnets')
      .makeRequest
        .toActivity.withoutWaiting({
          id: 'calculateSubnetPlan',
          action: 'aws/calculateSubnetPlan/1.0.0',
          payloadFromEvent: (event) => ({
            topologyMode: event?.payload?.viewDataContent?.desiredState?.topologyMode ?? 'consolidated',
            azCount: Number(event?.payload?.viewDataContent?.desiredState?.azCount ?? 2),
            vpcCidr: event?.payload?.viewDataContent?.desiredState?.vpcCidr ?? '10.42.0.0/16',
          }),
        })
        .endActivity()
      .endHandler()
    // --- Open Setup Wizard blade ---
    .whenEventRaised(eventTypes.Navigation.ITEM_CLICK)
      .whenEventSatisfies((event) => event?.payload?.action === 'openAwsSetupWizard')
      .makeRequest
        .toPresentation.toOpenBlade(
          'AwsSetupWizardBlade',
          () => ({ title: 'AWS Setup Configuration Wizard', bladeWidthPreset: 3, updateWhenDataChanges: true }),
          awsSetupWizardContent(),
          awsClusterSetupConfigView.getViewDataIdentifier(defaultSetupContext.setupId)
        )
        .endPresentation()
      .endHandler()
    // --- calculateSubnetPlan result ---
    .whenEventRaised(eventTypes.Activity.ACTIVITY_SUCCEEDED)
      .whenEventSatisfies(
        (event) =>
          event?.payload?.namespace === 'aws' &&
          event?.payload?.activityName === 'calculateSubnetPlan',
      )
      .makeRequest
        .toData.toUpdateFromEventResult(
          (_ctx) => awsClusterSetupConfigView.getViewDataIdentifier(defaultSetupContext.setupId),
          (result, data) => {
            const updated = data;
            Object.assign(updated, {
              desiredState: {
                ...(updated.desiredState ?? {}),
                subnetPlan: result.subnets,
                topologyMode: result.topologyMode,
                azCount: result.azCount,
                vpcCidr: result.vpcCidr,
              },
            });
            return updated;
          },
        )
        .endData()
      .endHandler()
    // --- connectAwsCredentials result ---
    .whenEventRaised(eventTypes.Activity.ACTIVITY_SUCCEEDED)
      .whenEventSatisfies(
        (event) =>
          event?.payload?.namespace === 'aws' &&
          event?.payload?.activityName === 'connectAwsCredentials',
      )
      .makeRequest
        .toData.toUpdateFromEventResult(
          ({ event }) => awsClusterSetupConfigView.getViewDataIdentifier(
            event?.payload?.result?.setupId ?? defaultSetupContext.setupId,
          ),
          (result, data) => {
            const timestamp = new Date().toISOString();
            const updated = data;
            if (result.connection.connected) {
              const credentialsStored = !!result.credentialsStored?.secretAccessKey;
              Object.assign(updated, {
                setupId: result.setupId ?? updated.setupId,
                region: result.region ?? updated.region,
                clusterName: result.clusterName ?? updated.clusterName,
                accountId: result.connection.accountId,
                accountName: result.accountName,
                accessKeyId: updated.accessKeyId ?? lastEnteredCredentials.accessKeyId,
                secretAccessKey: updated.secretAccessKey ?? lastEnteredCredentials.secretAccessKey,
                sessionToken: updated.sessionToken ?? lastEnteredCredentials.sessionToken,
                connectionStatus: 'success',
                connectionMessage: credentialsStored
                  ? (result.connection.message ?? 'AWS credentials validated and secret stored')
                  : (result.connection.message ?? 'AWS credentials validated'),
                connectionCheckedAt: result.connection.checkedAt,
                updatedAt: timestamp,
                status: 'ready',
              });
            } else {
              Object.assign(updated, {
                accessKeyId: updated.accessKeyId ?? lastEnteredCredentials.accessKeyId,
                secretAccessKey: updated.secretAccessKey ?? lastEnteredCredentials.secretAccessKey,
                sessionToken: updated.sessionToken ?? lastEnteredCredentials.sessionToken,
                connectionStatus: 'failed',
                connectionMessage: result.connection.message ?? 'AWS credentials failed - unknown reason',
                connectionCheckedAt: timestamp,
                status: 'draft',
              });
            }
            return updated;
          },
        )
        .endData()
      .endHandler()
    // --- Refresh views after successful store ---
    .whenEventRaised(eventTypes.Activity.ACTIVITY_SUCCEEDED)
      .whenEventSatisfies(
        (event) => {
          const connectResult = (event?.payload?.result ?? {}) as Record<string, any>;
          const credentialsStored = !!connectResult?.credentialsStored?.secretAccessKey;
          return event?.payload?.namespace === 'aws'
            && event?.payload?.activityName === 'connectAwsCredentials'
            && connectResult.connected === true
            && credentialsStored;
        },
      )
      .makeRequest
        .toActivity.withoutWaiting({
          id: 'refreshAwsWizardViewsAfterConnect',
          action: 'aws/refreshAwsWizardViews/1.0.0',
          payloadFromEvent: (event) => {
            const connectResult = (event?.payload?.result ?? {}) as Record<string, any>;
            return {
              ...defaultSetupContext,
              setupId: connectResult.setupId ?? defaultSetupContext.setupId,
              region: connectResult.region ?? defaultSetupContext.region,
              clusterName: connectResult.clusterName ?? defaultSetupContext.clusterName,
              refreshes: ['setupConfig', 'wizardBootstrap', 'eksClusters', 'ecrRepositories', 'networkTopology'],
            };
          },
        })
        .endActivity()
      .endHandler()
    .build();

  return { config };
};
