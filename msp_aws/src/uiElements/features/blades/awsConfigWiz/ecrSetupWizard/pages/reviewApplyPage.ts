import { BasicButton, Columns, LabelFrame, PresetTextComponent, StatusLabel } from 'msp_ui_common/uiLib';
import { builder4 as wizPage3 } from '../ecrSetupWizardContent.js';

export function withReviewApplyPage(builder: typeof wizPage3) {
  return builder
    .withPage('review-apply', 'Review and Apply')
      .withButtons([
        { label: 'Back', role: 'back' },
        { label: 'Finish', role: 'finish', variant: 'contained' },
      ])
      .containingElementSet()
        .showingItem.fromComponentElement(LabelFrame)
          .withLabel('Persist this ECR setup draft and optionally run a dry-run reconcile plan.')
          .containingElementSet()
            .showingItem.fromComponentElement(StatusLabel)
              .withLabel('')
              .withValueBinding(() => 'Save Draft persists current ECR configuration. Dry Run Plan computes what would change without applying infrastructure mutations.')
            .endElement
            .showingItem.fromComponentElement(Columns)
              .withComponentProps({ columns: 2, fillDirection: 'down' })
              .containingElementSet()
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Updated At')
                  .withValueBinding((ctx: any) => ctx.localData.updatedAt)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Current Status')
                  .withValueBinding((ctx: any) => ctx.localData.status)
                .endElement
                .showingItem.fromComponentElement(BasicButton)
                  .withLabel('Save Draft')
                  .withComponentProps({
                    internalName: 'saveEcrSetupDraft',
                    size: 'small',
                    includeRecordInContext: true,
                    context: {
                      setupId: 'aws-ecr-setup-default',
                      region: 'eu-west-2',
                    },
                  })
                .endElement
                .showingItem.fromComponentElement(BasicButton)
                  .withLabel('Dry Run Plan')
                  .withComponentProps({
                    internalName: 'dryRunEcrSetup',
                    size: 'small',
                    includeRecordInContext: true,
                    context: {
                      setupId: 'aws-ecr-setup-default',
                      region: 'eu-west-2',
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
