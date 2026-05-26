import React, { PropsWithChildren, useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import { FluxorData } from 'msp_common';
import { FluxorProps } from 'msp_common';
import {
  CNTX,
  CreateReUiPlanComponent,
  DataOf,
  LDDTOf,
  ReUiPlanComponentBuilder,
  RDDTOf,
} from '../../renderEngine/UiPlan/ReUiPlanBuilder.js';
import { ReUiPlanElement, ReUiPlanElementSetMember } from '../../renderEngine/UiPlan/ReUiPlan.js';
import {
  ReComponentCommonProps,
  ReComponentDataFunctionContext,
  ReComponentSystemProps,
} from '../../renderEngine/components/ReComponentProps.js';
import type { ComponentWrapper } from '../../renderEngine/components/ReComponentWrapper.js';
import type { TableColumnConfig, TableProps } from './tableTypes.js';

type RendererBuildable = {
  build: (settings: unknown) => ReUiPlanElement;
};

type RuntimeRendererColumn<TData extends FluxorData<any>> = TableColumnConfig<TData> & {
  __rendererBuilders?: RendererBuildable[];
};

function getRendererBuilders<TData extends FluxorData<any>>(
  col: TableColumnConfig<TData>
): RendererBuildable[] | undefined {
  const builders = (col as RuntimeRendererColumn<TData>).__rendererBuilders;
  return Array.isArray(builders) ? builders : undefined;
}

function isReElementSet(renderer: unknown): renderer is ReUiPlanElementSetMember[] {
  return (
    Array.isArray(renderer) &&
    renderer.every((r) => (r as ReUiPlanElementSetMember)?.options?.isReUIPlanElement)
  );
}

function isComponentWrapper(renderer: unknown): renderer is ComponentWrapper<any, any> {
  return typeof renderer === 'object' && renderer !== null && !!(renderer as ComponentWrapper<any, any>).isComponentWrapper;
}

function Table<TData extends FluxorData<any> = FluxorData<any>>(
  props: TableProps<TData> & PropsWithChildren & ReComponentCommonProps & ReComponentSystemProps
) {
  const { tableConfig, data, record, dataDescriptor, children } = props;

  // Debug logging - more detailed
  console.log('Table render:', {
    hasTableConfig: !!tableConfig,
    useSchemaColumns: tableConfig?.useSchemaColumns,
    hasDataDescriptor: !!dataDescriptor,
    dataDescriptorKeys: dataDescriptor ? Object.keys(dataDescriptor) : [],
    hasRecord: !!record,
    recordIsArray: Array.isArray(record),
    recordLength: Array.isArray(record) ? record.length : 'N/A',
    tableConfigColumns: tableConfig?.columns?.length,
    allPropKeys: Object.keys(props)
  });

  // Use record (from binding) or data prop, ensure it's an array
  const tableData = useMemo(() => {
    const sourceData = record ?? data ?? [];
    const result = Array.isArray(sourceData) ? sourceData : [sourceData];
    console.log('Table tableData:', { sourceData, result, resultLength: result.length });
    return result;
  }, [record, data]);

  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Generate columns from schema if useSchemaColumns is true
  const schemaColumns = useMemo((): TableColumnConfig<TData>[] => {
    if (!tableConfig?.useSchemaColumns || !dataDescriptor) {
      console.log('Table: skipping schema columns -', { useSchemaColumns: tableConfig?.useSchemaColumns, hasDataDescriptor: !!dataDescriptor });
      return [];
    }

    const columns: TableColumnConfig<TData>[] = [];

    for (const [key, propDef] of Object.entries(dataDescriptor)) {
      // Skip internal markers and complex/array types for now
      if (key.startsWith('__') || key === 'isFluxorArray' || key === 'isFluxorComplex') continue;

      const fluxorProp = propDef as FluxorProps<any> & { isComplex?: boolean };

      // Skip complex nested objects for now (could expand later)
      if (fluxorProp.isComplex) continue;

      columns.push({
        id: key,
        accessorKey: key as keyof DataOf<TData>,
        header: fluxorProp.label || key,
        sortable: true,
        filterable: true,
      });
    }

    return columns;
  }, [tableConfig?.useSchemaColumns, dataDescriptor]);

  // Use schema columns if available, otherwise use config columns
  const effectiveColumns = tableConfig?.columns?.length ? tableConfig.columns : schemaColumns;

  console.log('Table effectiveColumns:', {
    configColumnsLength: tableConfig?.columns?.length,
    schemaColumnsLength: schemaColumns.length,
    effectiveColumnsLength: effectiveColumns.length,
    effectiveColumns: effectiveColumns.map((c: TableColumnConfig<TData>) => ({ id: c.id, accessorKey: c.accessorKey, hasFn: !!c.accessorFn }))
  });

  // Convert our config to TanStack columns
  const tanstackColumns = useMemo(() => {
    if (!effectiveColumns.length) return [];

    const columnHelper = createColumnHelper<DataOf<TData>>();

    return effectiveColumns.map((col: TableColumnConfig<TData>) => {
      const rendererBuilders = getRendererBuilders(col);
      if (!col.cellRenderer && rendererBuilders && rendererBuilders.length > 0) {
        // set the renderer by building from the builders to provide a ReUIPlanElementSetMember array
        (col as unknown as { cellRenderer: unknown }).cellRenderer = rendererBuilders.map((builder: RendererBuildable) => builder.build(props.options?.buildSettings))
          .map((e: ReUiPlanElement) => ({componentName: e.componentName, options: {...e}, containing: e.children}) as ReUiPlanElementSetMember); // cast to ReUiPlanElementSetMember
      }
      if (col.accessorKey || col.accessorKey) {
        return columnHelper.accessor(col.accessorKey as any, {
          id: col.id,
          header: col.header || col.id,
          cell: col.cellRenderer
            ? (info) =>  resolveRenderer(col.cellRenderer, col, info)!
            : (info) => String(info.getValue() ?? ''),
          footer: col.footer,
          enableSorting: col.sortable ?? tableConfig?.enableSorting,
          enableColumnFilter: col.filterable ?? tableConfig?.enableFiltering,
        });
      }

      return columnHelper.display({
        id: col.id,
        header: col.header || col.id,
      });
    });
  }, [tableConfig, effectiveColumns]);

  function resolveRenderer(
    renderer: unknown,
    col: TableColumnConfig<TData>,
    info: {
      getValue: () => unknown;
      row: { original: DataOf<TData>; index: number };
    }
  ): React.ReactElement | null {
    if (isReElementSet(renderer)) {
      // Array of ReUIPlanElementSet
      return (
      <>
        {props.reEngineElementFactory?.(renderer, info.row.original) as React.ReactElement}
      </>
      );
    } else if (isComponentWrapper(renderer)) {
      const element = (((CreateReUiPlanComponent(
        null, renderer
      ) as unknown as ReUiPlanComponentBuilder<any, any, any>)
        .withValueBinding((data:ReComponentDataFunctionContext<RDDTOf<CNTX>, LDDTOf<CNTX>>) => col.accessorFn ? col.accessorFn(data.localData as any) : (data.localData as any)?.[col.accessorKey as any])) as any)
        .build({})
      return (
      <>
        {props.reEngineElementFactory?.(element, info.row.original) as React.ReactElement ?? null}
      </>
      );
    }
    const Component = renderer as React.ComponentType<{ value: unknown; row: DataOf<TData>; rowIndex: number; column: TableColumnConfig<TData> }>;
    return (<Component
      value={info.getValue()}
      row={info.row.original}
      rowIndex={info.row.index}
      column={col}
    />)
  }

  const table = useReactTable({
    data: tableData,
    columns: tanstackColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: tableConfig?.enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: tableConfig?.enableFiltering ? getFilteredRowModel() : undefined,
  });

  // Basic table styles
  const tableStyles: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
    color: '#333',
  };

  const thStyles: React.CSSProperties = {
    padding: '8px 12px',
    textAlign: 'left',
    borderBottom: '2px solid #ddd',
    backgroundColor: '#f5f5f5',
    fontWeight: 600,
  };

  const tdStyles: React.CSSProperties = {
    padding: '8px 12px',
    borderBottom: '1px solid #eee',
  };

  return (
    <div className="re-table-container" style={{ overflow: 'auto', maxHeight: '400px' }}>
      <table className="re-table" style={tableStyles}>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                  style={{
                    ...thStyles,
                    cursor: header.column.getCanSort() ? 'pointer' : 'default'
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() && (
                    <span>{header.column.getIsSorted() === 'asc' ? ' 🔼' : ' 🔽'}</span>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} style={{ backgroundColor: row.index % 2 === 0 ? '#fff' : '#fafafa' }}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} style={tdStyles}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {effectiveColumns.some((c: TableColumnConfig) => c.footer || c.footerFn) && (
          <tfoot>
            {table.getFooterGroups().map((footerGroup) => (
              <tr key={footerGroup.id}>
                {footerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.footer, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </tfoot>
        )}
      </table>
      {children}
    </div>
  );
}

export default Table;
