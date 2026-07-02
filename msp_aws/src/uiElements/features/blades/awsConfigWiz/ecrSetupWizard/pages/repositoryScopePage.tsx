import { Columns, LabelFrame, PresetBooleanComponent, PresetSelectComponent, PresetTextComponent, StatusLabel, BasicButton, Table } from 'msp_ui_common/uiLib';
import { ecrSetupConfigView } from '../../../../../../data/index.js';
import { builder as wizPages } from '../ecrSetupWizardContent.js';
import { ecrDesiredStateFluxorData } from '../../../../../fluxorObjects/ecrSetupWizardFluxor.js';

export function withRepositoryScopePage(builder: typeof wizPages) {
  return builder
    .withPage('repository-scope', 'Repository Scope')
      .withButton({ label: 'Next', role: 'next' })
      .containingElementSet()
        .usingFluxor(ecrDesiredStateFluxorData, (ctx: any) => ctx.localData.desiredState ?? {})
        .showingItem.fromComponentElement(LabelFrame)
          .withLabel('Choose repository scope and naming defaults for ECR setup.')
          .containingElementSet()
            .showingItem.fromComponentElement(StatusLabel)
              .withLabel('')
              .withValueBinding(() => 'Start with naming defaults, then tune repository-level security and lifecycle in the next step.')
            .endElement
            .showingItem.fromComponentElement(Columns)
              .withComponentProps({ columns: 2, fillDirection: 'down' })
              .containingElementSet()
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Setup Id')
                  .withValueBinding((ctx: any) => ctx.rootData.setupId)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Region')
                  .withValueBinding((ctx: any) => ctx.rootData.region)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Repository Prefix')
                  .withValueBinding((ctx: any) => ctx.localData.repositoryPrefix ?? 'actorwork')
                .endElement
                .showingItem.fromComponentElement(PresetSelectComponent)
                  .withLabel('Naming Convention')
                  .withComponentProps({
                    options: [
                      { value: 'default', description: 'Default convention' },
                      { value: 'custom', description: 'Custom naming' },
                    ],
                  })
                  .withValueBinding((ctx: any) => ctx.localData.namingConventionMode ?? 'default')
                .endElement
                .showingItem.fromComponentElement(PresetBooleanComponent)
                  .withLabel('Add new ECR')
                  .withValueBinding((ctx: any) => !!ctx.localData.addNewEcr)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('ECR Name')
                  .withDisableWhenRule((ctx: any) => !ctx.localData.addNewEcr)
                  .withValueBinding((ctx: any) => ctx.localData.pendingRepositoryName ?? '')
                .endElement
                .showingItem.fromComponentElement(BasicButton)
                  .withLabel('Add new ECR to plan')
                  .withDisableWhenRule((ctx: any) => {
                    const enabled = !!ctx.localData.addNewEcr;
                    const name = ctx.localData.pendingRepositoryName?.trim();
                    return !enabled || !name;
                  })
                  .withComponentProps({
                    internalName: 'addEcrRepositoryToPlan',
                    size: 'small',
                    includeRecordInContext: true,
                    context: {
                      viewDataIdentifier: ecrSetupConfigView.getViewDataIdentifier('aws-ecr-setup-default'),
                    },
                  })
                .endElement
              .end()
            .endElement
          .end()
        .endElement
        .showingItem.fromComponentElement(LabelFrame)
          .withLabel('Planned ECR Repositories')
          .containingElementSet()
            .showingItem.fromComponentElement(Table)
              .withLabel('Repository plan')
              .withValueBinding((ctx: any) => (ctx.localData.repositories ?? []).map((repo: any) => ({
                ...repo,
                setupId: ctx.rootData.setupId,
              })))
              .withColumns()
              .column((r: any) => r.repositoryName).withHeader('Repository')
              .column((r: any) => r.region).withHeader('Region')
              .column((r: any) => r.mode).withHeader('Mode')
              .endColumns
              .withRemoveIcon(
                () => true,
                'removeEcrRepositoryFromPlan',
                (row: any) => ({
                  viewDataIdentifier: ecrSetupConfigView.getViewDataIdentifier(row?.setupId ?? 'aws-ecr-setup-default'),
                }),
              )
            .endElement
          .end()
        .endElement
      .end()
    .endPage;
}
