import { Columns, LabelFrame, PresetBooleanComponent, PresetSelectComponent, PresetTextComponent, StatusLabel } from 'msp_ui_common/uiLib';
import {builder as wizPages} from '../awsSetupWizardContent'

export function withPlatformIntentPage(builder: typeof wizPages) {
  return builder
    .withPage('platform-intent', 'Environment Intent')
      .withButton({ label: 'Next', role: 'next' })
      .containingElementSet()
        .showingItem.fromComponentElement(LabelFrame)
          .withLabel('Purpose: tell us what this environment is for. This sets sensible defaults throughout the wizard.')
          .containingElementSet()
            .showingItem.fromComponentElement(StatusLabel)
              .withLabel('')
              .withValueBinding(() => 'What will this environment be used for? Your answer sets defaults for network topology, redundancy, security, and data service sizing throughout the wizard.')
            .endElement
            .showingItem.fromComponentElement(Columns)
              .withComponentProps({ columns: 2, fillDirection: 'down' })
              .containingElementSet()
                .showingItem.fromComponentElement(PresetSelectComponent)
                  .withLabel('Environment Purpose')
                  .withComponentProps({
                    options: [
                      { value: 'coreDev', description: 'Core Development' },
                      { value: 'featureDev', description: 'Feature Development' },
                      { value: 'platformSoak', description: 'Platform Soak' },
                      { value: 'platformSIT', description: 'Platform SIT' },
                      { value: 'enterpriseSIT', description: 'Enterprise SIT' },
                      { value: 'platformEVT', description: 'Platform EVT' },
                      { value: 'enterpriseUAT', description: 'Enterprise UAT' },
                      { value: 'preProduction', description: 'Pre-Production' },
                      { value: 'production', description: 'Production' },
                    ],
                    useStartsWithMatching: false,
                  })
                  .withValueBinding((ctx: any) => ctx.localData.environmentPurpose ?? 'coreDev')
                .endElement
                .showingItem.fromComponentElement(PresetBooleanComponent)
                  .withLabel('A/B Mode (parallel version deployment)')
                  .withValueBinding((ctx: any) => !!ctx.localData.abMode)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Region')
                  .withValueBinding((ctx: any) => ctx.localData.region)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Setup Id')
                  .withValueBinding((ctx: any) => ctx.localData.setupId)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Status')
                  .withValueBinding((ctx: any) => ctx.localData.status)
                .endElement
              .end()
            .endElement
          .end()
        .endElement
      .end()
    .endPage;
}
