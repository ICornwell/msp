import { Columns, LabelFrame, PresetTextComponent, StatusLabel } from 'msp_ui_common/uiLib';
import { builder3 as wizPage2 } from '../ecrSetupWizardContent.js';
import { ecrDesiredStateFluxorData } from '../../../../../fluxorObjects/ecrSetupWizardFluxor.js';

export function withIntegrationPage(builder: typeof wizPage2) {
  return builder
    .withPage('integration', 'Integration')
      .withButtons([
        { label: 'Back', role: 'back' },
        { label: 'Next', role: 'next' },
      ])
      .containingElementSet()
        .usingFluxor(ecrDesiredStateFluxorData, (ctx: any) => ctx.localData.desiredState ?? {})
        .showingItem.fromComponentElement(LabelFrame)
          .withLabel('Review integration defaults for EKS workloads and planned repository set.')
          .containingElementSet()
            .showingItem.fromComponentElement(StatusLabel)
              .withLabel('')
              .withValueBinding((ctx: any) => {
                const repositories = ctx.localData.repositories ?? [];
                if (!repositories.length) {
                  return 'No repositories planned yet. Save draft and refine repository plans in follow-up iterations.';
                }
                return repositories
                  .map((repo: any) => `${repo.repositoryName} (${repo.mode ?? 'createNew'})`)
                  .join('\n');
              })
            .endElement
            .showingItem.fromComponentElement(Columns)
              .withComponentProps({ columns: 2, fillDirection: 'down' })
              .containingElementSet()
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Default Region')
                  .withValueBinding((ctx: any) => ctx.localData.defaultRegion ?? ctx.rootData.region)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Status')
                  .withValueBinding((ctx: any) => ctx.rootData.status)
                .endElement
              .end()
            .endElement
          .end()
        .endElement
      .end()
    .endPage;
}
