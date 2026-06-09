import { createBehaviour, eventTypes } from 'msp_ui_common/uiLib';

import { awsResourcesContent } from './awsResourcesContent.js';
import { awsSetupWizardContent } from './awsSetupWizardContent.js';

const defaultSetupContext = {
  setupId: 'aws-cluster-setup-default',
  region: 'eu-west-2',
  clusterName: 'msp-dev-eks',
};

export const useAwsResourcesBehaviour = () => {
  const config = createBehaviour()
    .whenStarted()
    .dispatch.toActivity
      .callAsync({
        id: 'getEksClusters',
        action: 'aws/listEksClusters/1.0.0',
        payload: { region: 'eu-west-2' },
      })
      .callAsync({
        id: 'getEcrRepositories',
        action: 'aws/listEcrRepositories/1.0.0',
        payload: { region: 'eu-west-2' },
      })
      .callAsync({
        id: 'readAwsClusterSetupConfig',
        action: 'aws/readClusterSetupConfig/1.0.0',
        payload: defaultSetupContext,
      })
    .endActivity()
    .whenEventRaised(eventTypes.DataCache.DATA_LOADED)
    .whenDataIdentifierSatisfies((vid) => vid?.viewName === 'AwsResourceInventory' && !vid?.recordId)
    .dispatch.toPresentation
      .openTab(
        'AwsResourcesTab',
        { title: 'AWS Resources', closable: false },
        awsResourcesContent(),
        ({ viewDataIdentifier }) => viewDataIdentifier,
      )
      .endPresentation()
    .whenEventRaised(eventTypes.DataCache.DATA_LOADED)
    .whenDataIdentifierSatisfies((vid) => vid?.viewName === 'AwsClusterSetupConfig')
    .dispatch.toMenus
      .add({
        id: 'aws-open-setup-wizard',
        label: 'AWS Setup Wizard',
        eventName: eventTypes.Navigation.ITEM_CLICK,
        action: 'openAwsSetupWizard',
        menuTarget: 'top',
        context: defaultSetupContext,
      } as any)
      .add({
        id: 'aws-save-setup-draft',
        label: 'Save AWS Setup Draft',
        eventName: eventTypes.Navigation.ITEM_CLICK,
        action: 'saveAwsSetupDraft',
        menuTarget: 'top',
        context: defaultSetupContext,
      } as any)
      .add({
        id: 'aws-dry-run-reconcile',
        label: 'Dry Run AWS Setup Plan',
        eventName: eventTypes.Navigation.ITEM_CLICK,
        action: 'dryRunAwsSetup',
        menuTarget: 'top',
        context: defaultSetupContext,
      } as any)
      .endMenus()
    .whenEventRaised(eventTypes.Navigation.ITEM_CLICK)
    .whenEventSatisfies((event) => event?.payload?.action === 'awsWizardConnect')
    .dispatch.toActivity
      .callAsync({
        id: 'connectAwsCredentials',
        action: 'aws/connectAwsCredentials/1.0.0',
        payloadFromEvent: (event) => ({
          ...defaultSetupContext,
          setupId: event?.payload?.context?.setupId ?? defaultSetupContext.setupId,
          region: event?.payload?.context?.region ?? defaultSetupContext.region,
          clusterName: event?.payload?.context?.clusterName ?? defaultSetupContext.clusterName,
          accountId: event?.payload?.context?.accountId,
          accountName: event?.payload?.context?.accountName,
          accessKeyId: event?.payload?.context?.accessKeyId,
          secretAccessKey: event?.payload?.context?.secretAccessKey,
          sessionToken: event?.payload?.context?.sessionToken,
        }),
      })
      .callAsync({
        id: 'refreshAwsWizardBootstrap',
        action: 'aws/getAwsWizardBootstrap/1.0.0',
        payloadFromEvent: (event) => ({
          ...defaultSetupContext,
          ...(event?.payload?.context ?? {}),
        }),
      })
      .callAsync({
        id: 'refreshSetupConfigAfterConnect',
        action: 'aws/readClusterSetupConfig/1.0.0',
        payloadFromEvent: (event) => ({
          ...defaultSetupContext,
          setupId: event?.payload?.context?.setupId ?? defaultSetupContext.setupId,
          region: event?.payload?.context?.region ?? defaultSetupContext.region,
          clusterName: event?.payload?.context?.clusterName ?? defaultSetupContext.clusterName,
        }),
      })
      .callAsync({
        id: 'refreshEksClustersFromWizardConnect',
        action: 'aws/listEksClusters/1.0.0',
        payloadFromEvent: (event) => ({
          region: event?.payload?.context?.region ?? defaultSetupContext.region,
        }),
      })
      .callAsync({
        id: 'refreshEcrReposFromWizardConnect',
        action: 'aws/listEcrRepositories/1.0.0',
        payloadFromEvent: (event) => ({
          region: event?.payload?.context?.region ?? defaultSetupContext.region,
        }),
      })
      .callAsync({
        id: 'refreshNetworkFromWizardConnect',
        action: 'aws/awsNetworkTopology/1.0.0',
        payloadFromEvent: (event) => ({
          region: event?.payload?.context?.region ?? defaultSetupContext.region,
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
    .whenEventRaised(eventTypes.Navigation.ITEM_CLICK)
    .whenEventSatisfies((event) => event?.payload?.action === 'saveAwsSetupDraft')
    .dispatch.toActivity
      .callAsync({
        id: 'saveAwsSetupDraft',
        action: 'aws/writeClusterSetupConfig/1.0.0',
        payloadFromEvent: (event) => ({
          ...defaultSetupContext,
          ...(event?.payload?.context ?? {}),
          status: 'ready',
        }),
      })
      .endActivity()
    .whenEventRaised(eventTypes.Navigation.ITEM_CLICK)
    .whenEventSatisfies((event) => event?.payload?.action === 'dryRunAwsSetup')
    .dispatch.toActivity
      .callAsync({
        id: 'dryRunAwsSetupReconcile',
        action: 'aws/reconcileClusterSetupConfig/1.0.0',
        payloadFromEvent: (event) => ({
          ...defaultSetupContext,
          ...(event?.payload?.context ?? {}),
          dryRun: true,
        }),
      })
      .endActivity()
    .build();

  return { config };
};
