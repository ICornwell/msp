import { Columns, LabelFrame, PresetTextComponent } from 'msp_ui_common/uiLib';
import { builder3 as wizPage2 } from '../awsSetupWizardContent';
export function withNetworkShapePage(builder: typeof wizPage2) {
  return builder
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
                  .withValueBinding((ctx: any) => ctx.localData.desiredState?.network?.vpcCidr)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Public Subnets')
                  .withValueBinding((ctx: any) => `${ctx.localData.desiredState?.network?.publicSubnetCount ?? ''}`)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Private Subnets')
                  .withValueBinding((ctx: any) => `${ctx.localData.desiredState?.network?.privateSubnetCount ?? ''}`)
                .endElement
              .end()
            .endElement
          .end()
        .endElement
      .end()
    .endPage;
}
