import { Columns, LabelFrame, PresetTextComponent } from 'msp_ui_common/uiLib';
import { builder7 as wizPage6 } from '../awsSetupWizardContent';
export function withReviewCreatePage(builder: typeof wizPage6) {
  return builder
    .withPage('review-create', 'Review and Create')
      .withButtons([
        { label: 'Back', role: 'back' },
        { label: 'Finish', role: 'finish', variant: 'contained' },
      ])
      .containingElementSet()
        .showingItem.fromComponentElement(LabelFrame)
          .withLabel('Summary: use AWS menu actions to save a draft or run dry-run reconciliation.')
          .containingElementSet()
            .showingItem.fromComponentElement(Columns)
              .withComponentProps({ columns: 1, fillDirection: 'down' })
              .containingElementSet()
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Updated At')
                  .withValueBinding((ctx: any) => ctx.localData.updatedAt)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Current Status')
                  .withValueBinding((ctx: any) => ctx.localData.status)
                .endElement
              .end()
            .endElement
          .end()
        .endElement
      .end()
    .endPage;
}
