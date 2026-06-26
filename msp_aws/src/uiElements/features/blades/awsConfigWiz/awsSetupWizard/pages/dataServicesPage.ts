import { Columns, LabelFrame, PresetBooleanComponent, PresetSelectComponent, StatusLabel } from 'msp_ui_common/uiLib';
import { builder5 as wizPage4 } from '../awsSetupWizardContent';

export function withDataServicesPage(builder: typeof wizPage4) {
  return builder
    .withPage('data-services', 'Data Services')
      .withButtons([
        { label: 'Back', role: 'back' },
        { label: 'Next', role: 'next' },
      ])
      .containingElementSet()
        .showingItem.fromComponentElement(LabelFrame)
          .withLabel('PostgreSQL Database: managed relational storage for platform data in this environment.')
          .containingElementSet()
            .showingItem.fromComponentElement(StatusLabel)
              .withLabel('')
              .withValueBinding(() => 'The platform uses PostgreSQL for structured data. This is a managed AWS service (RDS) — AWS handles backups, patching, and failover for you.')
            .endElement
            .showingItem.fromComponentElement(Columns)
              .withComponentProps({ columns: 2, fillDirection: 'down' })
              .containingElementSet()
                .showingItem.fromComponentElement(PresetSelectComponent)
                  .withLabel('Database size (xs / sm / md / lg / xl)')
                  .withComponentProps({
                    options: ['xs', 'sm', 'md', 'lg', 'xl'],
                  })
                  .withValueBinding((ctx: any) => ctx.localData.desiredState?.postgres?.instanceSize ?? 'md')
                .endElement
                .showingItem.fromComponentElement(PresetBooleanComponent)
                  .withLabel('High availability (Multi-AZ failover)')
                  .withValueBinding((ctx: any) => !!ctx.localData.desiredState?.postgres?.multiAz)
                .endElement
              .end()
            .endElement
          .end()
        .endElement
        .showingItem.fromComponentElement(LabelFrame)
          .withLabel('Redis Cache')
          .containingElementSet()
            .showingItem.fromComponentElement(StatusLabel)
              .withLabel('')
              .withValueBinding(() => 'Redis provides fast in-memory caching for session data and hot data paths. Recommended for all environments above development.')
            .endElement
            .showingItem.fromComponentElement(Columns)
              .withComponentProps({ columns: 2, fillDirection: 'down' })
              .containingElementSet()
                .showingItem.fromComponentElement(PresetBooleanComponent)
                  .withLabel('Include Redis in this environment?')
                  .withValueBinding((ctx: any) => ctx.localData.desiredState?.redis?.enabled !== false)
                .endElement
                .showingItem.fromComponentElement(PresetSelectComponent)
                  .withLabel('Cache size (xs / sm / md / lg)')
                  .withComponentProps({
                    options: ['xs', 'sm', 'md', 'lg'],
                  })
                  .withValueBinding((ctx: any) => ctx.localData.desiredState?.redis?.nodeSize ?? 'sm')
                .endElement
                .showingItem.fromComponentElement(PresetSelectComponent)
                  .withLabel('Mode (cache / durable)')
                  .withComponentProps({
                    options: ['cache', 'durable'],
                  })
                  .withValueBinding((ctx: any) => ctx.localData.desiredState?.redis?.mode ?? 'cache')
                .endElement
              .end()
            .endElement
          .end()
        .endElement
        .showingItem.fromComponentElement(LabelFrame)
          .withLabel('Graph Database (EdgeDB)')
          .containingElementSet()
            .showingItem.fromComponentElement(StatusLabel)
              .withLabel('')
              .withValueBinding(() => 'EdgeDB is the platform\'s graph database, running inside the Kubernetes cluster. It uses PostgreSQL as its underlying store. You can share the platform database or provision a dedicated one.')
            .endElement
            .showingItem.fromComponentElement(Columns)
              .withComponentProps({ columns: 2, fillDirection: 'down' })
              .containingElementSet()
                .showingItem.fromComponentElement(PresetBooleanComponent)
                  .withLabel('Include EdgeDB in this environment?')
                  .withValueBinding((ctx: any) => ctx.localData.desiredState?.edgeDb?.enabled !== false)
                .endElement
                .showingItem.fromComponentElement(PresetBooleanComponent)
                  .withLabel('Dedicated PostgreSQL for EdgeDB (recommended for production)?')
                  .withValueBinding((ctx: any) => !!ctx.localData.desiredState?.edgeDb?.dedicatedPostgres)
                .endElement
                .showingItem.fromComponentElement(PresetSelectComponent)
                  .withLabel('Resource profile (xs / sm / md / lg)')
                  .withComponentProps({
                    options: ['xs', 'sm', 'md', 'lg'],
                  })
                  .withValueBinding((ctx: any) => ctx.localData.desiredState?.edgeDb?.resourceProfile ?? 'sm')
                .endElement
              .end()
            .endElement
          .end()
        .endElement
      .end()
    .endPage;
}
