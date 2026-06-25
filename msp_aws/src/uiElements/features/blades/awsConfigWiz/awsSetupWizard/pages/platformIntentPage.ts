import { Columns, LabelFrame, PresetTextComponent } from 'msp_ui_common/uiLib';
//import types { , CNTX } from 'msp_ui_common/uiLib/renderEngine';
import {builder as wizPages} from '../awsSetupWizardContent'

export function withPlatformIntentPage
(builder: typeof wizPages) {
  return builder
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
                  .withValueBinding((ctx: any) => ctx.localData.setupId)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Status')
                  .withValueBinding((ctx: any) => ctx.localData.status)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Wizard Version')
                  .withValueBinding((ctx: any) => ctx.localData.wizardVersion)
                .endElement
              .end()
            .endElement
          .end()
        .endElement
      .end()
    .endPage;
}
