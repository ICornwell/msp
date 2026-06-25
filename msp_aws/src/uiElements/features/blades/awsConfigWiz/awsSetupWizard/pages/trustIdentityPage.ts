import {
  BasicButton,
  Columns,
  LabelFrame,
  PresetSecretComponent,
  PresetTextComponent,
  StatusIcon,
  StatusLabel,
} from 'msp_ui_common/uiLib';

import { builder2 as wizPage1 } from '../awsSetupWizardContent';

export function withTrustIdentityPage(builder: typeof wizPage1) {
  return builder
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
                  .withValueBinding((ctx: any) => ctx.localData.accountId)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Account Name')
                  .withValueBinding((ctx: any) => ctx.localData.accountName)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Region')
                  .withValueBinding((ctx: any) => ctx.localData.region)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Access Key Id')
                  .withValueBinding((ctx: any) => ctx.localData.accessKeyId)
                .endElement
                .showingItem.fromComponentElement(PresetSecretComponent)
                  .withLabel('Secret Access Key')
                  .withValueBinding((ctx: any) => ctx.localData.secretAccessKey)
                .endElement
                .showingItem.fromComponentElement(PresetSecretComponent)
                  .withLabel('Session Token (Optional)')
                  .withValueBinding((ctx: any) => ctx.localData.sessionToken)
                .endElement
                .showingItem.fromComponentElement(BasicButton)
                  .withLabel('Test Credentials')
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
                .showingItem.fromComponentElement(BasicButton)
                  .withLabel('Store Credentials')
                  .withDisableWhenRule((ctx: any) => ctx?.localData?.connectionStatus !== 'success')
                  .withComponentProps({
                    internalName: 'awsWizardStoreCredentials',
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
                  .withValueBinding((ctx: any) => ctx.localData.connectionStatus)
                .endElement
                .showingItem.fromComponentElement(StatusLabel)
                  .withLabel('Connection Result')
                  .withValueBinding((ctx: any) => {
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
    .endPage;
}
