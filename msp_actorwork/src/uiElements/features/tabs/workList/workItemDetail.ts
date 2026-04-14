import { Re, PresetTextComponent, PresetDateComponent } from 'msp_ui_common/uiLib';
import { Columns, LabelFrame } from 'msp_ui_common/uiLib';
import { userWorkListFluxorData } from '../../../fluxorObjects/workListFluxor.js';

export function workItemDetail() {
  return Re.makeUiPlan('WorkItemDetail', '1.0')

    .withElementSet.usingFluxor(userWorkListFluxorData)
    .fromInlineElementSet

      // ── Work details ────────────────────────────────────────────────
      .showingItem.fromComponentElement(LabelFrame)
        .withLabel('Work Item')
        .containingElementSet()

          .showingItem.fromComponentElement(Columns)
            .withComponentProps({columns: 2, fillDirection: 'down'})
            .containingElementSet()

              .showingItem.fromComponentElement(PresetTextComponent)
                .withLabel('Reference')
                .withValueBinding((ctx) => ctx.localData.work_workreference)
              .endElement

              .showingItem.fromComponentElement(PresetTextComponent)
                .withLabel('Type')
                .withValueBinding((ctx) => ctx.localData.work_type)
              .endElement

              .showingItem.fromComponentElement(PresetTextComponent)
                .withLabel('Description')
                .withValueBinding((ctx) => ctx.localData.work_description)
              .endElement

              .showingItem.fromComponentElement(PresetDateComponent)
                .withLabel('Raised On')
                .withValueBinding((ctx) => ctx.localData.work_raisedOn)
              .endElement

              .showingItem.fromComponentElement(PresetDateComponent)
                .withLabel('SLA Due')
                .withValueBinding((ctx) => ctx.localData.work_slaDueDate)
              .endElement

              .showingItem.fromComponentElement(PresetDateComponent)
                .withLabel('Deadline')
                .withValueBinding((ctx) => ctx.localData.work_deadline)
              .endElement

            .end()
          .endElement

        .end()
      .endElement

      // ── Participation details ────────────────────────────────────────
      .showingItem.fromComponentElement(LabelFrame)
        .withLabel('Participation')
        .containingElementSet()

          .showingItem.fromComponentElement(Columns)
            .withComponentProps({columns: 2, fillDirection: 'down'})
            .containingElementSet()

              .showingItem.fromComponentElement(PresetTextComponent)
                .withLabel('Name')
                .withValueBinding((ctx) => ctx.localData.participation_name)
              .endElement

              .showingItem.fromComponentElement(PresetTextComponent)
                .withLabel('Type')
                .withValueBinding((ctx) => ctx.localData.participation_type)
              .endElement

              .showingItem.fromComponentElement(PresetTextComponent)
                .withLabel('Description')
                .withValueBinding((ctx) => ctx.localData.participation_description)
              .endElement

              .showingItem.fromComponentElement(PresetDateComponent)
                .withLabel('Created On')
                .withValueBinding((ctx) => ctx.localData.participation_createdOn)
              .endElement

              .showingItem.fromComponentElement(PresetDateComponent)
                .withLabel('SLA Due')
                .withValueBinding((ctx) => ctx.localData.participation_slaDueDate)
              .endElement

              .showingItem.fromComponentElement(PresetDateComponent)
                .withLabel('Deadline')
                .withValueBinding((ctx) => ctx.localData.participation_deadline)
              .endElement

            .end()
          .endElement

        .end()
      .endElement

    .endSet
    .BuildUiPlan();
}
