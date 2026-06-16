import { createBehaviour, eventTypes } from 'msp_ui_common/uiLib';
import { matchesId } from 'msp_common';
import { awsClusterSetupConfigView, awsResourceInventoryView } from '../../../../data/index.js';

import { awsResourcesContent } from './awsResourcesContent.js';

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
    .whenDataIdentifierSatisfies((vid) => matchesId(vid, awsResourceInventoryView.getViewIdentifier()) && !vid?.recordId)
    .dispatch.toPresentation
      .openTab(
        'AwsResourcesTab',
        { title: 'AWS Resources', closable: false },
        awsResourcesContent(),
        ({ viewDataIdentifier }) => viewDataIdentifier,
      )
      .endPresentation()
    .whenEventRaised(eventTypes.DataCache.DATA_LOADED)
        .whenDataIdentifierSatisfies((vid) => matchesId(vid, awsClusterSetupConfigView.getViewIdentifier()))
    .dispatch.toMenus
      .add({
        id: 'aws-save-setup-draft',
        label: 'Save AWS Setup Draft',
        eventName: eventTypes.Navigation.ITEM_CLICK,
        action: 'saveAwsSetupDraft',
        menuTarget: 'top',
        context: defaultSetupContext,
      })
      .add({
        id: 'aws-dry-run-reconcile',
        label: 'Dry Run AWS Setup Plan',
        eventName: eventTypes.Navigation.ITEM_CLICK,
        action: 'dryRunAwsSetup',
        menuTarget: 'top',
        context: defaultSetupContext,
      })
      .endMenus()
    .whenEventRaised(eventTypes.Navigation.ITEM_CLICK)
    .whenEventSatisfies((event) => event?.payload?.action === 'saveAwsSetupDraft')
    .dispatch.toActivity
      .callAsync({
        id: 'saveAwsSetupDraft',
        action: 'aws/writeClusterSetupConfig/1.0.0',
        payloadFromEvent: (event) => ({
          ...defaultSetupContext,
          ...(event?.payload?.viewDataContent ?? {}),
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
          ...(event?.payload?.viewDataContent ?? {}),
          dryRun: true,
        }),
      })
      .endActivity()
    .build();

  return { config };
};
