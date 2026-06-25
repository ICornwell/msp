import { Columns, LabelFrame, PresetTextComponent } from 'msp_ui_common/uiLib';
import { builder4 as wizPage3 } from '../awsSetupWizardContent';
export function withResourceNamingPage(builder: typeof wizPage3) {
  return builder
    .withPage('resource-naming', 'Resource Naming')
      .withDescription('Confirm cluster and repository naming defaults.')
      .withButtons([
        { label: 'Back', role: 'back' },
        { label: 'Next', role: 'next' },
      ])
      .containingElementSet()
        .showingItem.fromComponentElement(LabelFrame)
          .withLabel('Resources')
          .containingElementSet()
            .showingItem.fromComponentElement(Columns)
              .withComponentProps({ columns: 2, fillDirection: 'down' })
              .containingElementSet()
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('Cluster Name')
                  .withValueBinding((ctx: any) => ctx.localData.clusterName)
                .endElement
                .showingItem.fromComponentElement(PresetTextComponent)
                  .withLabel('ECR Repositories')
                  .withValueBinding((ctx: any) =>
                    (ctx.localData.desiredState?.ecr?.repositories ?? [])
                      .map((repository: any) => repository.repositoryName)
                      .join(', '),
                  )
                .endElement
              .end()
            .endElement
          .end()
        .endElement
      .end()
    .endPage;
}
