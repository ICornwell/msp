import type { ViewDataIdentifier } from 'msp_common';
import { createBehaviour, eventTypes } from 'msp_ui_common/uiLib';

import { ecrSetupWizardPlan } from './ecrSetupWizardContent.js';
import { ecrSetupConfigView } from '../../../../data/index.js';

const defaultEcrSetupContext = {
  setupId: 'aws-ecr-setup-default',
  region: 'eu-west-2',
};

function getEcrSetupViewId(setupId?: string): ViewDataIdentifier {
  return ecrSetupConfigView.getViewDataIdentifier(setupId ?? defaultEcrSetupContext.setupId);
}

export const useAwsEcrWizardBehaviour = () => {
  const config = createBehaviour()
    .whenStarted()
      .makeRequest
        .toMenus
          .toAdd({
            id: 'aws-open-ecr-wizard',
            label: 'AWS ECR Wizard',
            eventName: eventTypes.Navigation.ITEM_CLICK,
            action: 'openAwsEcrWizard',
            menuTarget: 'settings',
            context: defaultEcrSetupContext,
            groupId: 'platform-infrastructure',
          })
        .endMenus()
      .endHandler()
    .whenEventRaised(eventTypes.Navigation.ITEM_CLICK)
      .whenEventSatisfies((event) => event?.payload?.action === 'openAwsEcrWizard')
      .makeRequest
        .toActivity.withoutWaiting({
          id: 'readEcrSetupOnOpen',
          action: 'aws/readEcrSetupConfig/1.0.0',
          payloadFromEvent: (event) => ({
            ...defaultEcrSetupContext,
            ...(event?.payload?.context ?? {}),
          }),
        })
        .withoutWaiting({
          id: 'listEcrRepositoriesOnOpen',
          action: 'aws/listEcrRepositories/1.0.0',
          payloadFromEvent: (event) => ({
            region: event?.payload?.context?.region ?? defaultEcrSetupContext.region,
          }),
        })
        .endActivity()
      .then()
      .makeRequest
        .toPresentation.toOpenBlade(
          'AwsEcrWizardBlade',
          () => ({ title: 'AWS ECR Configuration Wizard', bladeWidthPreset: 3, updateWhenDataChanges: true }),
          ecrSetupWizardPlan,
          getEcrSetupViewId(defaultEcrSetupContext.setupId),
        )
        .endPresentation()
      .endHandler()
    .whenEventRaised(eventTypes.Activity.ACTIVITY_SUCCEEDED)
      .whenEventSatisfies(
        (event) => event?.payload?.namespace === 'aws' && event?.payload?.activityName === 'listEcrRepositories',
      )
      .makeRequest
        .toData.toUpdateFromEventResult(
          () => getEcrSetupViewId(defaultEcrSetupContext.setupId),
          (result, data: any) => {
            const rows = (result?.data ?? []) as Array<{ content?: any }>;
            const repositories = rows.map((row) => ({
              repositoryName: row.content?.repositoryName,
              region: row.content?.region ?? defaultEcrSetupContext.region,
              mode: 'importExisting',
              existingRepositoryUri: row.content?.repositoryUri,
              scanOnPush: row.content?.scanOnPush !== false,
              imageTagMutability: row.content?.imageTagMutability ?? 'IMMUTABLE',
              encryptionType: 'AES256',
              recordId: `${row.content?.region ?? defaultEcrSetupContext.region}::${row.content?.repositoryName}`,
            })).filter((repo) => !!repo.repositoryName);

            return {
              ...data,
              desiredState: {
                ...(data?.desiredState ?? {}),
                repositories,
              },
            };
          },
        )
        .endData()
      .endHandler()
    .whenEventRaised(eventTypes.Navigation.ITEM_CLICK)
      .whenEventSatisfies((event) => event?.payload?.action === 'addEcrRepositoryToPlan')
      .makeRequest
        .toData.toUpdateFromEventAction(
          ({ event }) => {
            const viewId = (event as any)?.payload?.context?.viewDataIdentifier;
            return viewId || getEcrSetupViewId(defaultEcrSetupContext.setupId);
          },
          (event: any, data: any) => {
            const repoName = (
              event?.payload?.context?.repositoryName
              ?? data?.desiredState?.pendingRepositoryName
            )?.trim();
            if (!repoName) {
              return data;
            }

            const existing = (data?.desiredState?.repositories ?? []) as any[];
            const existsAlready = existing.some((repo) => repo.repositoryName === repoName);
            if (existsAlready) {
              return {
                ...data,
                desiredState: {
                  ...(data?.desiredState ?? {}),
                  pendingRepositoryName: '',
                },
              };
            }

            const region = data?.region ?? defaultEcrSetupContext.region;
            return {
              ...data,
              desiredState: {
                ...(data?.desiredState ?? {}),
                repositories: [
                  ...existing,
                  {
                    repositoryName: repoName,
                    region,
                    mode: 'createNew',
                    scanOnPush: data?.desiredState?.scanOnPushDefault !== false,
                    imageTagMutability: data?.desiredState?.imageTagMutabilityDefault ?? 'IMMUTABLE',
                    encryptionType: data?.desiredState?.encryptionTypeDefault ?? 'AES256',
                    recordId: `${region}::${repoName}`,
                  },
                ],
                pendingRepositoryName: '',
                addNewEcr: false,
              },
            };
          },
        )
        .endData()
      .endHandler()
    .whenEventRaised(eventTypes.Navigation.ITEM_CLICK)
      .whenEventSatisfies((event) => event?.payload?.action === 'removeEcrRepositoryFromPlan')
      .makeRequest
        .toData.toUpdateFromEventAction(
          ({ event }) => {
            const viewId = (event as any)?.payload?.context?.viewDataIdentifier;
            return viewId || getEcrSetupViewId(defaultEcrSetupContext.setupId);
          },
          (event: any, data: any) => {
            const recordId = event?.payload?.context?.recordId;
            const repositoryName = event?.payload?.context?.repositoryName;
            const existing = (data?.desiredState?.repositories ?? []) as any[];
            const repositories = existing.filter((repo) => {
              if (recordId) {
                return repo.recordId !== recordId;
              }
              return repo.repositoryName !== repositoryName;
            });

            return {
              ...data,
              desiredState: {
                ...(data?.desiredState ?? {}),
                repositories,
              },
            };
          },
        )
        .endData()
      .endHandler()
    .whenEventRaised(eventTypes.Navigation.ITEM_CLICK)
      .whenEventSatisfies((event) => event?.payload?.action === 'saveEcrSetupDraft')
      .makeRequest
        .toActivity.withoutWaiting({
          id: 'saveEcrSetupDraft',
          action: 'aws/writeEcrSetupConfig/1.0.0',
          payloadFromEvent: (event) => ({
            ...defaultEcrSetupContext,
            ...(event?.payload?.viewDataContent ?? {}),
            status: 'ready',
          }),
        })
        .endActivity()
      .endHandler()
    .whenEventRaised(eventTypes.Navigation.ITEM_CLICK)
      .whenEventSatisfies((event) => event?.payload?.action === 'dryRunEcrSetup')
      .makeRequest
        .toActivity.withoutWaiting({
          id: 'dryRunEcrSetupReconcile',
          action: 'aws/reconcileEcrSetupConfig/1.0.0',
          payloadFromEvent: (event) => ({
            ...defaultEcrSetupContext,
            ...(event?.payload?.viewDataContent ?? {}),
            dryRun: true,
          }),
        })
        .endActivity()
      .endHandler()
    .build();

  return { config };
};
