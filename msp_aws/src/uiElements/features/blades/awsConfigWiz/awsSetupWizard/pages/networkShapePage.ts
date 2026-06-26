import { BasicButton, Columns, LabelFrame, PresetSelectComponent, PresetTextComponent, StatusLabel } from 'msp_ui_common/uiLib';
import { builder3 as wizPage2 } from '../awsSetupWizardContent';

export function withNetworkShapePage(builder: typeof wizPage2) {
  return builder
    .withPage('network-shape', 'Network Zones')
      .withButtons([
        { label: 'Back', role: 'back' },
        { label: 'Next', role: 'next' },
      ])
      .containingElementSet()
        .showingItem.fromComponentElement(LabelFrame)
          .withLabel('Network Topology: choose how workloads are separated across the network. Defaults come from environment purpose and can be adjusted here.')
          .containingElementSet()
            .showingItem.fromComponentElement(StatusLabel)
              .withLabel('')
              .withValueBinding(() => 'More separation increases security and simplifies compliance auditing, but adds cost and operational overhead. All topology modes produce subnets across multiple availability zones for resilience.')
            .endElement
            .showingItem.fromComponentElement(Columns)
              .withComponentProps({ columns: 2, fillDirection: 'down' })
              .containingElementSet()
                .showingItem.fromComponentElement(PresetSelectComponent)
                  .withLabel('Topology Mode (consolidated / split2 / fullSplit)')
                  .withComponentProps({
                    options: [
                      { value: 'consolidated', description: 'Consolidated' },
                      { value: 'split2', description: 'Split 2-Zone' },
                      { value: 'fullSplit', description: 'Full Split' },
                    ],
                  })
                  .withValueBinding((ctx: any) => ctx.localData.desiredState?.topologyMode ?? 'consolidated')
                .endElement
                .showingItem.fromComponentElement(PresetSelectComponent)
                  .withLabel('Availability Zones (2 or 3)')
                  .withComponentProps({
                    options: [
                      { value: '2', description: '2 AZs' },
                      { value: '3', description: '3 AZs' },
                    ],
                  })
                  .withValueBinding((ctx: any) => String(ctx.localData.desiredState?.azCount ?? 2))
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('VPC Address Range (CIDR)')
                  .withValueBinding((ctx: any) => ctx.localData.desiredState?.vpcCidr ?? '10.42.0.0/16')
                .endElement
                .showingItem.fromComponentElement(BasicButton)
                  .withLabel('Calculate Network Plan')
                  .withComponentProps({
                    internalName: 'awsWizardCalculateSubnets',
                    size: 'small',
                    includeRecordInContext: true,
                    context: { setupId: 'aws-cluster-setup-default' },
                  })
                .endElement
              .end()
            .endElement
          .end()
        .endElement
        .showingItem.fromComponentElement(LabelFrame)
          .withLabel('Calculated Subnet Plan')
          .containingElementSet()
            .showingItem.fromComponentElement(StatusLabel)
              .withLabel('')
              .withValueBinding((ctx: any) => {
                const subnets = ctx.localData.desiredState?.subnetPlan ?? [];
                if (subnets.length === 0) return 'Click "Calculate Network Plan" to generate the subnet layout.';
                return subnets
                  .map((s: any) => `${s.name}  |  ${s.cidr}  |  ${s.tier}  |  ${s.az}`)
                  .join('\n');
              })
            .endElement
          .end()
        .endElement
      .end()
    .endPage;
}
