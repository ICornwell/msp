import { Columns, LabelFrame, PresetBooleanComponent, PresetSelectComponent, PresetTextComponent, StatusLabel } from 'msp_ui_common/uiLib';
import type { builder2 as wizPage1 } from '../ecrSetupWizardContent.js';
import { ecrDesiredStateFluxorData, ecrLifecyclePolicyFluxorData } from '../../../../../fluxorObjects/ecrSetupWizardFluxor.js';

export function withRepositoryPoliciesPage(builder: typeof wizPage1) {
  return builder
    .withPage('repository-policies', 'Repository Policies')
      .withButtons([
        { label: 'Back', role: 'back' },
        { label: 'Next', role: 'next' },
      ])
      .containingElementSet()
        .usingFluxor(ecrDesiredStateFluxorData, (ctx: any) => ctx.localData.desiredState ?? {})
        .showingItem.fromComponentElement(LabelFrame)
          .withLabel('Set baseline repository security and retention defaults.')
          .containingElementSet()
            .showingItem.fromComponentElement(StatusLabel)
              .withLabel('')
              .withValueBinding(() => {
                return 'These defaults are applied to planned repositories and can be refined per-repository later.';
              })
            .endElement
            .showingItem.fromComponentElement(Columns)
              .withComponentProps({ columns: 2, fillDirection: 'down' })
              .containingElementSet()
                .showingItem.fromComponentElement(PresetBooleanComponent)
                  .withLabel('Scan Images On Push')
                  .withValueBinding((ctx: any) => ctx.localData.scanOnPushDefault !== false)
                .endElement
                .showingItem.fromComponentElement(PresetSelectComponent)
                  .withLabel('Tag Mutability')
                  .withComponentProps({
                    options: [
                      { value: 'IMMUTABLE', description: 'Immutable tags (recommended)' },
                      { value: 'MUTABLE', description: 'Mutable tags' },
                    ],
                  })
                  .withValueBinding((ctx: any) => ctx.localData.imageTagMutabilityDefault ?? 'IMMUTABLE')
                .endElement
                .showingItem.fromComponentElement(PresetSelectComponent)
                  .withLabel('Encryption Type')
                  .withComponentProps({
                    options: [
                      { value: 'AES256', description: 'AES256 (AWS managed)' },
                      { value: 'KMS', description: 'KMS key managed' },
                    ],
                  })
                  .withValueBinding((ctx: any) => ctx.localData.encryptionTypeDefault ?? 'AES256')
                .endElement
              .end()
            .endElement
            .showingItem.fromComponentElement(Columns)
              .withComponentProps({ columns: 2, fillDirection: 'down' })
              .containingElementSet()
                .usingFluxor(ecrLifecyclePolicyFluxorData, (ctx: any) => ctx.localData.lifecyclePolicy ?? {})
                .showingItem.fromComponentElement(PresetBooleanComponent)
                  .withLabel('Enable Lifecycle Policy')
                  .withValueBinding((ctx: any) => ctx.localData.enabled !== false)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Untagged Retention Days')
                  .withValueBinding((ctx: any) => String(ctx.localData.untaggedRetentionDays ?? 14))
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Max Image Count')
                  .withValueBinding((ctx: any) => String(ctx.localData.maxImageCount ?? 200))
                .endElement
              .end()
            .endElement
          .end()
        .endElement
      .end()
    .endPage;
}
