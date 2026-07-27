import { BasicButton, Columns, LabelFrame, PresetTextComponent, StatusLabel } from 'msp_ui_common/uiLib';
import type { builder7 as wizPage6 } from '../awsSetupWizardContent';
export function withReviewCreatePage(builder: typeof wizPage6) {
  return builder
    .withPage('review-create', 'Review and Create')
      .withButtons([
        { label: 'Back', role: 'back' },
        { label: 'Finish', role: 'finish', variant: 'contained' },
      ])
      .containingElementSet()
        .showingItem.fromComponentElement(LabelFrame)
          .withLabel('Summary: save the current wizard state, then optionally run a dry-run reconcile check.')
          .containingElementSet()
            .showingItem.fromComponentElement(StatusLabel)
              .withLabel('')
              .withValueBinding(() => 'Save Draft persists your current settings. Dry Run Plan validates what would be applied without making infrastructure changes.')
            .endElement
            .showingItem.fromComponentElement(Columns)
              .withComponentProps({ columns: 2, fillDirection: 'down' })
              .containingElementSet()
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Updated At')
                  .withValueBinding(ctx => ctx.localData.updatedAt)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Current Status')
                  .withValueBinding(ctx => ctx.localData.status)
                .endElement
                .showingItem.fromComponentElement(BasicButton)
                  .withLabel('Save Draft')
                  .withComponentProps({
                    internalName: 'saveAwsSetupDraft',
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
                  .withLabel('Dry Run Plan')
                  .withComponentProps({
                    internalName: 'dryRunAwsSetup',
                    size: 'small',
                    includeRecordInContext: true,
                    context: {
                      setupId: 'aws-cluster-setup-default',
                      region: 'eu-west-2',
                      clusterName: 'msp-dev-eks',
                    },
                  })
                .endElement
              .end()
            .endElement
          .end()
        .endElement
      .end()
    .endPage;
}
