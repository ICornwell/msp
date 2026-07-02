import { Columns, LabelFrame, PresetBooleanComponent, PresetSelectComponent, StatusLabel } from 'msp_ui_common/uiLib';
import { builder5 as wizPage4 } from '../awsSetupWizardContent';
import { awsEdgeDbFluxorData, awsPostgresFluxorData, awsRedisFluxorData } from '../../../../../fluxorObjects/awsSetupWizardFluxor.js';

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
                .usingFluxor(awsPostgresFluxorData, (ctx: any) => ctx.localData.desiredState?.postgres ?? {})
                .showingItem.fromComponentElement(PresetSelectComponent)
                  .withLabel('Database size (xs / sm / md / lg / xl)')
                  .withComponentProps({
                    options: ['xs', 'sm', 'md', 'lg', 'xl'],
                  })
                  .withValueBinding((ctx: any) => ctx.localData.instanceSize ?? 'md')
                .endElement
                .showingItem.fromComponentElement(PresetBooleanComponent)
                  .withLabel('High availability (Multi-AZ failover)')
                  .withValueBinding((ctx: any) => !!ctx.localData.multiAz)
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
                .usingFluxor(awsRedisFluxorData, (ctx: any) => ctx.localData.desiredState?.redis ?? {})
                .showingItem.fromComponentElement(PresetBooleanComponent)
                  .withLabel('Include Redis in this environment?')
                  .withValueBinding((ctx: any) => ctx.localData.enabled !== false)
                .endElement
                .showingItem.fromComponentElement(PresetSelectComponent)
                  .withLabel('Cache size (xs / sm / md / lg)')
                  .withComponentProps({
                    options: ['xs', 'sm', 'md', 'lg'],
                  })
                  .withValueBinding((ctx: any) => ctx.localData.nodeSize ?? 'sm')
                .endElement
                .showingItem.fromComponentElement(PresetSelectComponent)
                  .withLabel('Mode (cache / durable)')
                  .withComponentProps({
                    options: ['cache', 'durable'],
                  })
                  .withValueBinding((ctx: any) => ctx.localData.mode ?? 'cache')
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
                .usingFluxor(awsEdgeDbFluxorData, (ctx: any) => ctx.localData.desiredState?.edgeDb ?? {})
                .showingItem.fromComponentElement(PresetBooleanComponent)
                  .withLabel('Include EdgeDB in this environment?')
                  .withValueBinding((ctx: any) => ctx.localData.enabled !== false)
                .endElement
                .showingItem.fromComponentElement(PresetBooleanComponent)
                  .withLabel('Dedicated PostgreSQL for EdgeDB (recommended for production)?')
                  .withValueBinding((ctx: any) => !!ctx.localData.dedicatedPostgres)
                .endElement
                .showingItem.fromComponentElement(PresetSelectComponent)
                  .withLabel('Resource profile (xs / sm / md / lg)')
                  .withComponentProps({
                    options: ['xs', 'sm', 'md', 'lg'],
                  })
                  .withValueBinding((ctx: any) => ctx.localData.resourceProfile ?? 'sm')
                .endElement
              .end()
            .endElement
          .end()
        .endElement
      .end()
    .endPage;
}
