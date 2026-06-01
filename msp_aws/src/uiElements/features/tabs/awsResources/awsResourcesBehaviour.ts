import { createBehaviour, eventTypes } from 'msp_ui_common/uiLib';

import { awsResourcesContent } from './awsResourcesContent.js';

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
    .build();

  return { config };
};
