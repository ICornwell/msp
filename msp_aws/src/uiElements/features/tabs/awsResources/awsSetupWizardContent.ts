import { Columns, LabelFrame, PresetButtonComponent, PresetSecretComponent, PresetTextComponent, Re, StatusIcon, StatusLabel, Stepper } from 'msp_ui_common/uiLib';

import { awsSetupWizardFluxorData } from '../../../fluxorObjects/awsSetupWizardFluxor.js';

export function awsSetupWizardContent() {
  return Re.makeUiPlan('AwsClusterSetupConfig', '1.0')
    .withElementSet.usingFluxor(awsSetupWizardFluxorData)
    .fromInlineElementSet
    .showingItem.fromComponentElement(Stepper)
    .withOrientation('horizontal')
    .withPage('platform-intent', 'Platform Intent')
      .withDescription('Define the platform setup intent for this AWS environment.')
      .withButton({ label: 'Next', role: 'next' })
      .containingElementSet()
        .showingItem.fromComponentElement(LabelFrame)
          .withLabel('Intent')
          .containingElementSet()
            .showingItem.fromComponentElement(Columns)
              .withComponentProps({ columns: 2, fillDirection: 'down' })
              .containingElementSet()
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Setup Id')
                  .withValueBinding((ctx) => ctx.localData.setupId)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Status')
                  .withValueBinding((ctx) => ctx.localData.status)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Wizard Version')
                  .withValueBinding((ctx) => ctx.localData.wizardVersion)
                .endElement
              .end()
            .endElement
          .end()
        .endElement
      .end()
    .endPage
    .withPage('trust-identity', 'Trust and Identity')
      
      .withDescription('Capture account and identity routing for setup execution.')
      .withButtons([
        { label: 'Back', role: 'back' },
        { label: 'Next', role: 'next' },
      ])
      .containingElementSet()
        .showingItem.fromComponentElement(LabelFrame)
          .withLabel('Trust')
          .containingElementSet()
            .showingItem.fromComponentElement(Columns)
              .withComponentProps({ columns: 2, fillDirection: 'down' })
              .containingElementSet()
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Account Id')
                  .withValueBinding((ctx) => ctx.localData.accountId)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Account Name')
                  .withValueBinding((ctx) => ctx.localData.accountName)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Region')
                  .withValueBinding((ctx) => ctx.localData.region)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Access Key Id')
                  .withValueBinding((ctx) => ctx.localData.accessKeyId)
                .endElement
                .showingItem.fromComponentElement(PresetSecretComponent)
                  .withLabel('Secret Access Key')
                  .withValueBinding((ctx) => ctx.localData.secretAccessKey)
                .endElement
                .showingItem.fromComponentElement(PresetSecretComponent)
                  .withLabel('Session Token (Optional)')
                  .withValueBinding((ctx) => ctx.localData.sessionToken)
                .endElement
                .showingItem.fromComponentElement(PresetButtonComponent)
                  .withLabel('Connect')
                  .withComponentProps({
                    internalName: 'awsWizardConnect',
                    size: 'small',
                    includeRecordInContext: true,
                    context: {
                      setupId: 'aws-cluster-setup-default',
                      region: 'eu-west-2',
                      clusterName: 'msp-dev-eks',
                    },
                  })
                .endElement
                .showingItem.fromComponentElement(StatusIcon)
                  .withLabel('Connection')
                  .withValueBinding((ctx) => ctx.localData.connectionStatus)
                .endElement
                .showingItem.fromComponentElement(StatusLabel)
                  .withLabel('Connection Result')
                  .withValueBinding((ctx) => {
                    const status = ctx.localData.connectionStatus;
                    const message = ctx.localData.connectionMessage?.trim();
                    if (status === 'success') {
                      return message || 'Connection succeeded';
                    }
                    if (status === 'failed') {
                      return `Connection failed: ${message || 'Unknown error'}`;
                    }
                    return message || 'Not connected yet.';
                  })
                .endElement
              .end()
            .endElement
          .end()
        .endElement
      .end()
    .endPage
    .withPage('network-shape', 'Network Shape')
      .withDescription('Review network defaults used for initial reconciliation.')
      .withButtons([
        { label: 'Back', role: 'back' },
        { label: 'Next', role: 'next' },
      ])
      
      .containingElementSet()
        .showingItem.fromComponentElement(LabelFrame)
          .withLabel('Network')
          .containingElementSet()
            .showingItem.fromComponentElement(Columns)
              .withComponentProps({ columns: 2, fillDirection: 'down' })
              .containingElementSet()
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('VPC CIDR')
                  .withValueBinding((ctx) => ctx.localData.desiredState?.network?.vpcCidr)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Public Subnets')
                  .withValueBinding((ctx) => `${ctx.localData.desiredState?.network?.publicSubnetCount ?? ''}`)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Private Subnets')
                  .withValueBinding((ctx) => `${ctx.localData.desiredState?.network?.privateSubnetCount ?? ''}`)
                .endElement
              .end()
            .endElement
          .end()
        .endElement
      .end()
    .endPage
    .withPage('resource-naming', 'Resource Naming')
      .withDescription('Confirm cluster and repository naming defaults.')
      .withButtons([
        { label: 'Back', role: 'back' },
        { label: 'Next', role: 'next' },
      ])
      .containingElementSet()
        .showingItem.fromComponentElement(LabelFrame)
          .withLabel('Resources')
          .containingElementSet()
            .showingItem.fromComponentElement(Columns)
              .withComponentProps({ columns: 2, fillDirection: 'down' })
              .containingElementSet()
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Cluster Name')
                  .withValueBinding((ctx) => ctx.localData.clusterName)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('ECR Repositories')
                  .withValueBinding((ctx) => (ctx.localData.desiredState?.ecr?.repositories ?? []).join(', '))
                .endElement
              .end()
            .endElement
          .end()
        .endElement
      .end()
    .endPage
    .withPage('review-create', 'Review and Create')
      .withDescription('Use the AWS menu actions to save draft or run dry-run reconciliation.')
      .withButtons([
        { label: 'Back', role: 'back' },
        { label: 'Finish', role: 'finish', variant: 'contained' },
      ])
      .containingElementSet()
        .showingItem.fromComponentElement(LabelFrame)
          .withLabel('Summary')
          .containingElementSet()
            .showingItem.fromComponentElement(Columns)
              .withComponentProps({ columns: 1, fillDirection: 'down' })
              .containingElementSet()
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Updated At')
                  .withValueBinding((ctx) => ctx.localData.updatedAt)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Current Status')
                  .withValueBinding((ctx) => ctx.localData.status)
                .endElement
              .end()
            .endElement
          .end()
        .endElement
      .end()
    .endPage
    .endElement
    .endSet
    .BuildUiPlan();
}
