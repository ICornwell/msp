
import React, { PropsWithChildren, useMemo } from 'react';

import { ComponentWrapper, createExtendedComponent } from '../../renderEngine/components/ReComponentWrapper';
import { ReComponentCommonProps, ReComponentSystemProps } from '../../renderEngine/components/ReComponentProps';

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table'
import { ReExtensionBuilder, ReBuilderBase, DataOf, CreateReUiPlanComponent, ElementBuilderQuartet, createElementBuilderQuartet, CNTX } from '../../renderEngine/UiPlan/ReUiPlanBuilder';
import { ReUiPlanElement, ReUiPlanElementSetMember } from '../../renderEngine/UiPlan/ReUiPlan';
// ============================================
// Table Props
// ============================================
export type TableProps<TData extends FluxorData<any> = FluxorData<any>> = {
  icon?: React.ElementType;
  tableConfig?: TableConfig<DataOf<TData>>;
  data?: DataOf<TData>[];
  // These come from the render engine
  record?: DataOf<TData> | DataOf<TData>[];
  dataDescriptor: TData;
};

// Import FluxorData type
import { FluxorData } from '../../renderEngine/fluxor/fluxorData';
import { FluxorProps } from '../../renderEngine/fluxor/fluxorProps';
import { data } from 'happy-dom/lib/PropertySymbol.js';
import { Re } from '../../renderEngine';

// ============================================
// Table Layout
// ============================================
export type TableOrientation = 'rows-horizontal' | 'rows-vertical';  // standard vs pivoted

// ============================================
// Aggregation Types - semantic rules for what CAN be aggregated
// ============================================
export enum AggregationType {
  None = 'none',           // Cannot aggregate (IDs, names)
  Sum = 'sum',             // Additive values (totals, amounts)
  Average = 'average',     // Rate-like values (percentages, ratios)
  WeightedAverage = 'weighted-average',  // Needs weight column
  Count = 'count',         // Count of non-null values
  CountDistinct = 'count-distinct',  // Count unique values
  Min = 'min',
  Max = 'max',
  First = 'first',         // First value in group
  Last = 'last',           // Last value in group
  Custom = 'custom'        // Custom aggregation function
}

// ============================================
// Column Definition Types
// ============================================
export type ColumnPin = 'left' | 'right' | 'none';

// Range coloring styles - enums not strings!
export enum RangeStyle {
  None = 'none',
  GreenToRed = 'green-to-red',     // Low=green, High=red (costs)
  RedToGreen = 'red-to-green',     // Low=red, High=green (scores)
  BlueScale = 'blue-scale',        // Intensity scale
  Threshold = 'threshold',          // Above/below threshold coloring
  Custom = 'custom'
}

// Filter UI components - the actual component types
export type FilterUIComponent = React.ComponentType<FilterUIProps<any>>;

export interface FilterUIProps<TValue> {
  value: TValue | undefined;
  onChange: (value: TValue | undefined) => void;
  column: TableColumnConfig<any>;
  allValues?: TValue[];  // For dropdown/autocomplete
}

// Our internal column config (not TanStack's)
export interface TableColumnConfig<TData extends FluxorData<any> = FluxorData<any>, TValue = any> {
  id: string;
  accessorKey?: keyof DataOf<TData>;
  accessorFn?: (row: DataOf<TData>) => TValue;
  header?: string;
  headerFn?: (ctx: ColumnHeaderContext) => React.ReactNode;

  // Layout
  pin?: ColumnPin;
  width?: number | 'auto';
  minWidth?: number;
  maxWidth?: number;

  // Behavior
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  resizable?: boolean;

  // Aggregation (semantic!)
  aggregationType?: AggregationType;
  aggregationLabel?: string;
  customAggregation?: (values: TValue[], rows: DataOf<TData>[]) => TValue;
  weightColumn?: keyof DataOf<TData>;  // For weighted average

  // Display
  cellRenderer?: React.ComponentType<CellRendererProps<TData, TValue>>;
  rangeStyle?: RangeStyle;
  rangeThreshold?: number;
  customRangeStyle?: (value: TValue, min: TValue, max: TValue) => React.CSSProperties;

  // Filter UI
  filterUI?: FilterUIComponent;
  filterFn?: (row: DataOf<TData>, value: TValue, filterValue: any) => boolean;

  // Footer
  footer?: string;
  footerFn?: (ctx: ColumnFooterContext<TData, TValue>) => React.ReactNode;

  // Column groups
  groupId?: string;
}

export interface ColumnHeaderContext {
  columnId: string;
  isSorted: boolean;
  sortDirection?: 'asc' | 'desc';
}

export interface ColumnFooterContext<TData extends FluxorData<any>, TValue> {
  columnId: string;
  rows: DataOf<TData>[];
  values: TValue[];
  aggregatedValue?: TValue;
}

export interface CellRendererProps<TData extends FluxorData<any>, TValue> {
  value: TValue;
  row: DataOf<TData>;
  rowIndex: number;
  column: TableColumnConfig<TData, TValue>;
  isEditing?: boolean;
  onChange?: (newValue: TValue) => void;
}

// ============================================
// Column Group Config
// ============================================
export interface ColumnGroupConfig {
  id: string;
  header: string;
  columns: string[];  // column ids in this group
}

// ============================================
// Table Config - built by extension
// ============================================
export interface TableConfig<TData extends FluxorData<any> = FluxorData<any>> {
  orientation: TableOrientation;
  columns: TableColumnConfig<TData>[];
  columnGroups: ColumnGroupConfig[];
  dataAccessor?: (ctx: any) => DataOf<TData>[];

  // Schema-driven columns
  useSchemaColumns?: boolean;
  schemaSelector?: (data: DataOf<TData>) => (keyof DataOf<TData>)[];

  // Virtual scrolling config
  virtualization?: {
    enabled: boolean;
    rowHeight: number;
    overscan?: number;
  };

  // Global table options
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableColumnResizing?: boolean;
  enableRowSelection?: boolean;
}

// ============================================
// Type-Safe Column Builder Interface
// ============================================

// The column builder tracks TData so accessors are type-safe
export interface ColumnBuilder<C extends CNTX, RT> extends ReBuilderBase<RT> {
  // Type-safe column from property accessor - THE KEY API!
  // s => s.userName gives us both the key AND the value type
  column<K extends keyof DataOf<FluxorData<any>>>(
    accessor: (data: DataOf<FluxorData<any>>) => DataOf<FluxorData<any>>[K]
  ): ColumnOptions<C, DataOf<FluxorData<any>>[K], RT>;

  // Computed column - accessor returns derived value
  computed<TValue>(
    id: string,
    accessor: (data: DataOf<FluxorData<any>>) => TValue
  ): ColumnOptions<C, TValue, RT>;

  // Column group - wraps multiple columns
  columnGroup(id: string, header: string): ColumnGroupBuilder<C, RT>;
  // Dynamic columns from data relationships
  // e.g., forEach(ctx => ctx.root.program.layers) to create column per layer
  forEach<TItem>(
    sourceAccessor: (ctx: ForEachContext<FluxorData<any>>) => TItem[],
    columnFactory: (item: TItem, index: number, builder: ColumnBuilder<C, RT>) => void
  ): ColumnBuilder<C, RT>;

  // End columns and return to parent builder
  endColumns: RT;
}

// Context passed to forEach for accessing parent data
export interface ForEachContext<TData extends FluxorData<any>> {
  root: any;  // Root context object
  parentData?: DataOf<TData>[];
}

// Options available after starting a column
export interface ColumnOptions<C extends CNTX, TValue, RT> extends ReBuilderBase<RT> {
  // Header
  withHeader(header: string): ColumnOptions<C, TValue, RT>;
  withHeaderFn(fn: (ctx: ColumnHeaderContext) => React.ReactNode): ColumnOptions<C, TValue, RT>;

  // Layout
  pinned(pin: ColumnPin): ColumnOptions<C, TValue, RT>;
  withWidth(width: number | 'auto'): ColumnOptions<C, TValue, RT>;
  withMinWidth(width: number): ColumnOptions<C, TValue, RT>;
  withMaxWidth(width: number): ColumnOptions<C, TValue, RT>;

  // Behavior
  sortable(enabled?: boolean): ColumnOptions<C, TValue, RT>;
  filterable(enabled?: boolean): ColumnOptions<C, TValue, RT>;
  editable(enabled?: boolean): ColumnOptions<C, TValue, RT>;
  resizable(enabled?: boolean): ColumnOptions<C, TValue, RT>;

  // Aggregation - type-safe based on TValue!
  withAggregation(type: AggregationType, label?: string): ColumnOptions<C, TValue, RT>;
  withWeightedAverage(weightColumn: string): ColumnOptions<C, TValue, RT>;
  withCustomAggregation(
    fn: (values: TValue[], rows: any[]) => TValue,
    label?: string
  ): ColumnOptions<C, TValue, RT>;

  // Display
  withRenderer: {
    // Simple component renderer (backwards compatible)
    fromComponent: (component: React.ComponentType<any>) => ColumnOptions<C, TValue, RT>;
  } & ElementBuilderQuartet<C, ColumnOptions<C, TValue, RT>>;
  
  withRangeStyle(style: RangeStyle, threshold?: number): ColumnOptions<C, TValue, RT>;
  withCustomRangeStyle(
    fn: (value: TValue, min: TValue, max: TValue) => React.CSSProperties
  ): ColumnOptions<C, TValue, RT>;

  // Filter UI
  withFilterUI(component: React.ComponentType<FilterUIProps<TValue>>): ColumnOptions<C, TValue, RT>;
  withCustomFilter(fn: (row: any, value: TValue, filterValue: any) => boolean): ColumnOptions<C, TValue, RT>;

  // Footer
  withFooter(footer: string): ColumnOptions<C, TValue, RT>;
  withFooterFn(fn: (ctx: any) => React.ReactNode): ColumnOptions<C, TValue, RT>;

  // Chain to next column or end
  column(accessor: (data: any) => any): ColumnOptions<C, any, RT>;
  computed<TNewValue>(id: string, accessor: (data: any) => TNewValue): ColumnOptions<C, TNewValue, RT>;
  columnGroup(id: string, header: string): ColumnGroupBuilder<C, RT>;
  forEach<TItem>(
    sourceAccessor: (ctx: any) => TItem[],
    columnFactory: (item: TItem, index: number, builder: ColumnBuilder<C, RT>) => void
  ): ColumnBuilder<C, RT>;
  endColumns: RT;
}

// Column group builder for nested headers
export interface ColumnGroupBuilder<C extends CNTX, RT> extends ReBuilderBase<RT> {
  column(accessor: (data: any) => any): ColumnGroupColumnOptions<C, any, RT>;
  computed<TValue>(id: string, accessor: (data: any) => TValue): ColumnGroupColumnOptions<C, TValue, RT>;
  endGroup: ColumnBuilder<C, RT>;
}

// Column options within a group (same options but returns to group)
export interface ColumnGroupColumnOptions<C extends CNTX, TValue, RT> extends ReBuilderBase<RT> {
  // Header
  withHeader(header: string): ColumnGroupColumnOptions<C, TValue, RT>;
  withHeaderFn(fn: (ctx: ColumnHeaderContext) => React.ReactNode): ColumnGroupColumnOptions<C, TValue, RT>;

  // Layout
  pinned(pin: ColumnPin): ColumnGroupColumnOptions<C, TValue, RT>;
  withWidth(width: number | 'auto'): ColumnGroupColumnOptions<C, TValue, RT>;
  withMinWidth(width: number): ColumnGroupColumnOptions<C, TValue, RT>;
  withMaxWidth(width: number): ColumnGroupColumnOptions<C, TValue, RT>;

  // Behavior
  sortable(enabled?: boolean): ColumnGroupColumnOptions<C, TValue, RT>;
  filterable(enabled?: boolean): ColumnGroupColumnOptions<C, TValue, RT>;
  editable(enabled?: boolean): ColumnGroupColumnOptions<C, TValue, RT>;
  resizable(enabled?: boolean): ColumnGroupColumnOptions<C, TValue, RT>;

  // Aggregation
  withAggregation(type: AggregationType, label?: string): ColumnGroupColumnOptions<C, TValue, RT>;
  withWeightedAverage(weightColumn: string): ColumnGroupColumnOptions<C, TValue, RT>;
  withCustomAggregation(fn: (values: TValue[], rows: any[]) => TValue, label?: string): ColumnGroupColumnOptions<C, TValue, RT>;

  // Display
  withRenderer: {
    // Simple component renderer (backwards compatible)
    fromComponent: (component: React.ComponentType<any>) => ColumnGroupColumnOptions<C, TValue, RT>;
  } & ElementBuilderQuartet<C, ColumnGroupColumnOptions<C, TValue, RT>>;
  
  withRangeStyle(style: RangeStyle, threshold?: number): ColumnGroupColumnOptions<C, TValue, RT>;
  withCustomRangeStyle(fn: (value: TValue, min: TValue, max: TValue) => React.CSSProperties): ColumnGroupColumnOptions<C, TValue, RT>;

  // Filter UI
  withFilterUI(component: React.ComponentType<FilterUIProps<TValue>>): ColumnGroupColumnOptions<C, TValue, RT>;
  withCustomFilter(fn: (row: any, value: TValue, filterValue: any) => boolean): ColumnGroupColumnOptions<C, TValue, RT>;

  // Footer
  withFooter(footer: string): ColumnGroupColumnOptions<C, TValue, RT>;
  withFooterFn(fn: (ctx: any) => React.ReactNode): ColumnGroupColumnOptions<C, TValue, RT>;

  // Chain to next column in group
  column(accessor: (data: any) => any): ColumnGroupColumnOptions<C, any, RT>;
  computed<TNewValue>(id: string, accessor: (data: any) => TNewValue): ColumnGroupColumnOptions<C, TNewValue, RT>;

  // End group and return to column builder
  endGroup: ColumnBuilder<C, RT>;
}

// ============================================
// Filter Builder Interface
// ============================================
export interface FilterBuilder<C extends CNTX, RT> extends ReBuilderBase<RT> {
  // Column-specific filter
  forColumn<K extends string>(
    accessor: (data: any) => any
  ): FilterColumnOptions<C, any, RT>;

  // Global search filter
  globalSearch(columns?: string[]): FilterBuilder<C, RT>;

  endFiltering: RT;
}

export interface FilterColumnOptions<C extends CNTX, TValue, RT> extends ReBuilderBase<RT> {
  withUI(component: React.ComponentType<FilterUIProps<TValue>>): FilterColumnOptions<C, TValue, RT>;
  withCustomFilter(fn: (row: any, value: TValue, filterValue: any) => boolean): FilterColumnOptions<C, TValue, RT>;

  // Chain
  forColumn(accessor: (data: any) => any): FilterColumnOptions<C, any, RT>;
  endFiltering: RT;
}

// ============================================
// Table Extension Interface
// ============================================
export interface TableExtension<C extends CNTX, RT> extends ReExtensionBuilder {
  // Set the data type for type-safe columns
  forDataType<T extends FluxorData<any>>(): RT & TableExtension<C, RT>;

  // Orientation
  withOrientation(orientation: TableOrientation): RT & TableExtension<C, RT>;

  // Virtualization for large datasets
  withVirtualization(rowHeight: number, overscan?: number): RT & TableExtension<C, RT>;

  // Type-safe column builder - THE MAIN API
  withColumns(): ColumnBuilder<C, RT & TableExtension<C, RT>>;

  // Auto-generate columns from schema (future: will use FluxorProps metadata)
  withColumnsFromSchema(selector?: <T>(data: T) => (keyof T)[]): RT & TableExtension<C, RT>;

  // Filter configuration
  withFiltering(): FilterBuilder<C, RT & TableExtension<C, RT>>;

  // Global table options
  enableSorting(enabled?: boolean): RT & TableExtension<C, RT>;
  enableFiltering(enabled?: boolean): RT & TableExtension<C, RT>;
  enableColumnResizing(enabled?: boolean): RT & TableExtension<C, RT>;
  enableRowSelection(enabled?: boolean): RT & TableExtension<C, RT>;
}

// ============================================
// Column Builder Implementation
// ============================================

// Helper to extract property key from accessor function
// Uses a proxy to capture which property is accessed
function getAccessorKey(accessor: (data: any) => any): string {
  const accessed: string[] = [];
  const proxy = new Proxy({}, {
    get(_target, prop) {
      accessed.push(String(prop));
      return undefined;
    }
  });

  try {
    accessor(proxy);
  } catch {
    // Ignore errors from the proxy
  }

  return accessed[0] || 'unknown';
}

function createColumnBuilder<C extends CNTX, TData extends FluxorData<any>, RT>(
  returnTo: RT,
  config: TableConfig<TData>,
  currentGroupId: string | null,
  dataDescriptor: TData
): ColumnBuilder<C, RT> {
  let currentColumn: TableColumnConfig<TData> | null = null;

  const finishCurrentColumn = () => {
    if (currentColumn) {
      if (currentGroupId) {
        currentColumn.groupId = currentGroupId;
      }
      config.columns.push(currentColumn);
      currentColumn = null;
    }
  };

  // Creates the options object for a column - this gets returned after .column() or .computed()
  const createColumnOptions = <TValue,>(
    col: TableColumnConfig<TData, TValue>,
    dataDescriptor: TData
  ): ColumnOptions<C, TValue, RT> => {
    // Set currentColumn so finishCurrentColumn can push it
    currentColumn = col as TableColumnConfig<TData>;

    const options: ColumnOptions<C, TValue, RT> = {
      withHeader(header: string) {
        col.header = header;
        return options;
      },

      withHeaderFn(fn) {
        col.headerFn = fn;
        return options;
      },

      pinned(pin) {
        col.pin = pin;
        return options;
      },

      withWidth(width) {
        col.width = width;
        return options;
      },

      withMinWidth(width) {
        col.minWidth = width;
        return options;
      },

      withMaxWidth(width) {
        col.maxWidth = width;
        return options;
      },

      sortable(enabled = true) {
        col.sortable = enabled;
        return options;
      },

      filterable(enabled = true) {
        col.filterable = enabled;
        return options;
      },

      editable(enabled = true) {
        col.editable = enabled;
        return options;
      },

      resizable(enabled = true) {
        col.resizable = enabled;
        return options;
      },

      withAggregation(type, label) {
        col.aggregationType = type;
        col.aggregationLabel = label;
        return options;
      },

      withWeightedAverage(weightColumn) {
        col.aggregationType = AggregationType.WeightedAverage;
        col.weightColumn = weightColumn;
        return options;
      },

      withCustomAggregation(fn, label) {
        col.aggregationType = AggregationType.Custom;
        col.customAggregation = fn;
        col.aggregationLabel = label;
        return options;
      },

      // Use the quartet pattern for withRenderer
      withRenderer: {} as any,

      withRangeStyle(style, threshold) {
        col.rangeStyle = style;
        col.rangeThreshold = threshold;
        return options;
      },

      withCustomRangeStyle(fn) {
        col.rangeStyle = RangeStyle.Custom;
        col.customRangeStyle = fn;
        return options;
      },

      withFilterUI(component) {
        col.filterUI = component;
        return options;
      },

      withCustomFilter(fn) {
        col.filterFn = fn;
        return options;
      },

      withFooter(footer) {
        col.footer = footer;
        return options;
      },

      withFooterFn(fn) {
        col.footerFn = fn;
        return options;
      },

      // Chain to next column
      column<K extends keyof DataOf<TData>>(accessor: (data: DataOf<TData>) => DataOf<TData>[K]) {
        finishCurrentColumn();
        const key = getAccessorKey(accessor);
        const newCol: TableColumnConfig<TData, DataOf<TData>[K]> = {
          id: key,
          accessorKey: key as K,
          accessorFn: accessor,
        };
        return createColumnOptions(newCol, dataDescriptor);
      },

      computed<TNewValue>(id: string, accessor: (data: DataOf<TData>) => TNewValue) {
        finishCurrentColumn();
        const newCol: TableColumnConfig<TData, TNewValue> = {
          id,
          accessorFn: accessor,
        };
        return createColumnOptions(newCol, dataDescriptor);
      },

      columnGroup(id: string, header: string) {
        finishCurrentColumn();
        config.columnGroups.push({ id, header, columns: [] });
        return createColumnGroupBuilder<C, TData, RT>(returnTo, config, id, dataDescriptor);
      },

      forEach<TItem>(
        sourceAccessor: (ctx: ForEachContext<TData>) => TItem[],
        columnFactory: (item: TItem, index: number, builder: ColumnBuilder<C, RT>) => void
      ) {
        finishCurrentColumn();
        (config as any).forEachFactories = (config as any).forEachFactories || [];
        (config as any).forEachFactories.push({ sourceAccessor, columnFactory });
        return createColumnBuilder<C, TData, RT>(returnTo, config, currentGroupId, dataDescriptor);
      },

      get endColumns() {
        finishCurrentColumn();
        return returnTo;
      },

      end() {
        finishCurrentColumn();
        return returnTo;
      },

      build<BS>(_buildSettings: BS) {
        finishCurrentColumn();
        return col;
      }
    };

    // Initialize withRenderer with the quartet pattern
    // Store array to collect renderer element builders
    const rendererBuilders: any[] = [];
    options.withRenderer = {
      fromComponent: (component: React.ComponentType<CellRendererProps<TData, TValue>>) => {
        col.cellRenderer = component;
        return options;
      },
      ...createElementBuilderQuartet<C, ColumnOptions<C, TValue, RT>>(
        options,
        rendererBuilders,
        undefined,
        dataDescriptor
      )
    };
    
    // Store the renderer builders on the column config so they can be built later
    (col as any).__rendererBuilders = rendererBuilders;

    return options;
  };

  // The initial builder - before any column is started
  const builder: ColumnBuilder<C, RT> = {
    column<K extends keyof DataOf<TData>>(accessor: (data: DataOf<TData>) => DataOf<TData>[K]) {
      finishCurrentColumn();
      const key = getAccessorKey(accessor);
      const newCol: TableColumnConfig<TData, DataOf<TData>[K]> = {
        id: key,
        accessorKey: key as K,
        accessorFn: accessor,
      };
      return createColumnOptions(newCol, dataDescriptor);
    },

    computed<TValue>(id: string, accessor: (data: DataOf<TData>) => TValue) {
      finishCurrentColumn();
      const newCol: TableColumnConfig<TData, TValue> = {
        id,
        accessorFn: accessor,
      };
      return createColumnOptions(newCol, dataDescriptor);
    },

    columnGroup(id: string, header: string) {
      finishCurrentColumn();
      config.columnGroups.push({ id, header, columns: [] });
      return createColumnGroupBuilder<C, TData, RT>(returnTo, config, id, dataDescriptor);
    },

    forEach<TItem>(
      sourceAccessor: (ctx: ForEachContext<TData>) => TItem[],
      columnFactory: (item: TItem, index: number, builder: ColumnBuilder<C, RT>) => void
    ) {
      finishCurrentColumn();
      (config as any).forEachFactories = (config as any).forEachFactories || [];
      (config as any).forEachFactories.push({ sourceAccessor, columnFactory });
      return createColumnBuilder<C, TData, RT>(returnTo, config, currentGroupId, dataDescriptor);
    },

    get endColumns() {
      finishCurrentColumn();
      return returnTo;
    },

    end() {
      finishCurrentColumn();
      return returnTo;
    },

    build<BS>(_buildSettings: BS) {
      finishCurrentColumn();
      return config;
    }
  };

  return builder;
}

function createColumnGroupBuilder<C extends CNTX, TData extends FluxorData<any>, RT>(
  returnTo: RT,
  config: TableConfig<TData>,
  groupId: string,
  dataDescriptor: TData
): ColumnGroupBuilder<C, RT> {
  const group = config.columnGroups.find(g => g.id === groupId)!;
  let currentColumn: TableColumnConfig<TData> | null = null;

  const finishCurrentColumn = () => {
    if (currentColumn) {
      currentColumn.groupId = groupId;
      group.columns.push(currentColumn.id);
      config.columns.push(currentColumn);
      currentColumn = null;
    }
  };

  const createGroupColumnOptions = <TValue,>(
    col: TableColumnConfig<TData, TValue>,
    dataDescriptor: TData
  ): ColumnGroupColumnOptions<C, TValue, RT> => {
    currentColumn = col as TableColumnConfig<TData>;

    const options: ColumnGroupColumnOptions<C, TValue, RT> = {
      withHeader(header: string): ColumnGroupColumnOptions<C, TValue, RT> {
        col.header = header;
        return options;
      },
      withHeaderFn(fn: (ctx: ColumnHeaderContext) => React.ReactNode): ColumnGroupColumnOptions<C, TValue, RT> {
        col.headerFn = fn;
        return options;
      },
      pinned(pin: ColumnPin): ColumnGroupColumnOptions<C, TValue, RT> {
        col.pin = pin;
        return options;
      },
      withWidth(width: number | 'auto'): ColumnGroupColumnOptions<C, TValue, RT> {
        col.width = width;
        return options;
      },
      withMinWidth(width: number): ColumnGroupColumnOptions<C, TValue, RT> {
        col.minWidth = width;
        return options;
      },
      withMaxWidth(width: number): ColumnGroupColumnOptions<C, TValue, RT> {
        col.maxWidth = width;
        return options;
      },
      sortable(enabled = true): ColumnGroupColumnOptions<C, TValue, RT> {
        col.sortable = enabled;
        return options;
      },
      filterable(enabled = true): ColumnGroupColumnOptions<C, TValue, RT> {
        col.filterable = enabled;
        return options;
      },
      editable(enabled = true): ColumnGroupColumnOptions<C, TValue, RT> {
        col.editable = enabled;
        return options;
      },
      resizable(enabled = true): ColumnGroupColumnOptions<C, TValue, RT> {
        col.resizable = enabled;
        return options;
      },
      withAggregation(type: AggregationType, label?: string): ColumnGroupColumnOptions<C, TValue, RT> {
        col.aggregationType = type;
        col.aggregationLabel = label;
        return options;
      },
      withWeightedAverage(weightColumn: any): ColumnGroupColumnOptions<C, TValue, RT> {
        col.aggregationType = AggregationType.WeightedAverage;
        col.weightColumn = weightColumn;
        return options;
      },
      withCustomAggregation(fn: (values: TValue[], rows: any[]) => TValue, label?: string): ColumnGroupColumnOptions<C, TValue, RT> {
        col.aggregationType = AggregationType.Custom;
        col.customAggregation = fn;
        col.aggregationLabel = label;
        return options;
      },
      
      // Use the quartet pattern for withRenderer
      withRenderer: { fromComponent: (component: React.ComponentType<CellRendererProps<TData, TValue>>) => {
        col.cellRenderer = component;
        return options;
      }} as { fromComponent: (component: React.ComponentType<CellRendererProps<TData, TValue>>) => ColumnGroupColumnOptions<C, TValue, RT>}
         & ReBuilderBase<ColumnGroupColumnOptions<C, TValue, RT>>
         & ElementBuilderQuartet<C, ColumnGroupColumnOptions<C, TValue, RT>>,
      
      withRangeStyle(style: RangeStyle, threshold?: number): ColumnGroupColumnOptions<C, TValue, RT> {
        col.rangeStyle = style;
        col.rangeThreshold = threshold;
        return options;
      },
      withCustomRangeStyle(fn: (value: TValue, min: TValue, max: TValue) => React.CSSProperties) {
        col.rangeStyle = RangeStyle.Custom;
        col.customRangeStyle = fn;
        return options;
      },
      withFilterUI(component: React.ComponentType<FilterUIProps<TValue>>) {
        col.filterUI = component;
        return options;
      },
      withCustomFilter(fn: (row: DataOf<TData>, value: TValue, filterValue: any) => boolean) {
        col.filterFn = fn;
        return options;
      },
      withFooter(footer: string) {
        col.footer = footer;
        return options;
      },
      withFooterFn(fn: (ctx: ColumnFooterContext<TData, TValue>) => React.ReactNode) {
        col.footerFn = fn;
        return options;
      },

      // Chain to next column in group
      column<K extends keyof DataOf<TData>>(accessor: (data: DataOf<TData>) => DataOf<TData>[K]) {
        finishCurrentColumn();
        const key = getAccessorKey(accessor);
        const newCol: TableColumnConfig<TData, DataOf<TData>[K]> = {
          id: key,
          accessorKey: key as K,
          accessorFn: accessor,
        };
        return createGroupColumnOptions(newCol, dataDescriptor);
      },

      computed<TNewValue>(id: string, accessor: (data: DataOf<TData>) => TNewValue) {
        finishCurrentColumn();
        const newCol: TableColumnConfig<TData, TNewValue> = {
          id,
          accessorFn: accessor,
        };
        return createGroupColumnOptions(newCol, dataDescriptor);
      },

      get endGroup() {
        finishCurrentColumn();
        return createColumnBuilder<C, TData, RT>(returnTo, config, null, dataDescriptor);
      },

      end() {
        finishCurrentColumn();
        return returnTo;
      },

      build<BS>(_buildSettings: BS) {
        finishCurrentColumn();
        return col;
      }
    };

    // Initialize withRenderer with the quartet pattern
    const rendererBuilders: any[] = [];
    options.withRenderer = {
      fromComponent: (component: React.ComponentType<CellRendererProps<TData, TValue>>): ColumnGroupColumnOptions<C, TValue, RT> => {
        col.cellRenderer = component;
        return options;
      },
      ...createElementBuilderQuartet<C, ColumnGroupColumnOptions<C, TValue, RT>>(
        options,
        rendererBuilders,
        undefined,
        undefined
      )
    };
    
    // Store the renderer builders on the column config so they can be built later
    (col as any).__rendererBuilders = rendererBuilders;

    return options;
  };

  return {
    column<K extends keyof DataOf<TData>>(accessor: (data: DataOf<TData>) => DataOf<TData>[K]): ColumnGroupColumnOptions<C, DataOf<TData>[K], RT> {
      finishCurrentColumn();
      const key = getAccessorKey(accessor);
      const newCol: TableColumnConfig<TData, DataOf<TData>[K]> = {
        id: key,
        accessorKey: key as K,
        accessorFn: accessor,
      };
      return createGroupColumnOptions(newCol, dataDescriptor);
    },

    computed<TValue>(id: string, accessor: (data: DataOf<TData>) => TValue): ColumnGroupColumnOptions<C, TValue, RT> {
      finishCurrentColumn();
      const newCol: TableColumnConfig<TData, TValue> = {
        id,
        accessorFn: accessor,
      };
      return createGroupColumnOptions(newCol, dataDescriptor);
    },

    get endGroup(): ColumnBuilder<C, RT> {
      finishCurrentColumn();
      return createColumnBuilder<C, TData, RT>(returnTo, config, null, dataDescriptor);
    },

    end(): RT {
      finishCurrentColumn();
      return returnTo;
    },

    build<BS>(_buildSettings: BS) {
      finishCurrentColumn();
      return config;
    }
  };
}

// ============================================
// Filter Builder Implementation
// ============================================
function createFilterBuilder<C extends CNTX, TData extends FluxorData<any>, RT>(
  returnTo: RT,
  config: TableConfig<TData>,
  dataDescriptor: TData
): FilterBuilder<C, RT> {
  return {
    forColumn<K extends keyof DataOf<TData>>(accessor: (data: DataOf<TData>) => DataOf<TData>[K]) {
      const key = getAccessorKey(accessor);
      const col = config.columns.find(c => c.id === key);

      const filterOptions: FilterColumnOptions<C, DataOf<TData>[K], RT> = {
        withUI(component) {
          if (col) col.filterUI = component;
          return this;
        },

        withCustomFilter(fn) {
          if (col) col.filterFn = fn;
          return this;
        },

        forColumn<K2 extends keyof DataOf<TData>>(accessor2: (data: DataOf<TData>) => DataOf<TData>[K2]) {
          return createFilterBuilder<C, TData, RT>(returnTo, config, dataDescriptor).forColumn(accessor2);
        },

        get endFiltering() {
          return returnTo;
        },

        end() {
          return returnTo;
        },

        build<BS>(_buildSettings: BS) {
          return config;
        }
      };

      return filterOptions;
    },

    globalSearch(columns) {
      (config as any).globalSearchColumns = columns;
      return this;
    },

    get endFiltering() {
      return returnTo;
    },

    end() {
      return returnTo;
    },

    build<BS>(_buildSettings: BS) {
      return config;
    }
  };
}

// ============================================
// Table Extension Factory
// ============================================
export function 
extendWithTable<C extends CNTX, RT, TData extends FluxorData<any>>(returnTo: RT, dataDescriptor: TData, _contextPlaceHolder: C): TableExtension<C, RT> {
  // TData is inferred from the dataDescriptor argument
  
  const config: TableConfig<TData> = {
    orientation: 'rows-horizontal',
    columns: [],
    columnGroups: [],
  };

  const extension: TableExtension<C, RT> = {
    forDataType<T extends FluxorData<any>>(): RT & TableExtension<C, RT> {
      // Returns same extension but with different TData type
      // Cast through returnTo to maintain the builder chain
      return returnTo as  (RT & TableExtension<C, RT>);
    },

    withOrientation(orientation: TableOrientation): RT & TableExtension<C, RT> {
      config.orientation = orientation;
      return returnTo as  (RT & TableExtension<C, RT>);
    },

    withVirtualization(rowHeight: number, overscan: number = 5): RT & TableExtension<C, RT> {
      config.virtualization = { enabled: true, rowHeight, overscan };
      return returnTo as  (RT & TableExtension<C, RT>);
    },

    withColumns(): ColumnBuilder<C, RT & TableExtension<C, RT>> {
      return createColumnBuilder<C, TData, RT & TableExtension<C, RT>>(returnTo as RT & TableExtension<C, RT>, config, null, dataDescriptor as TData);
    },

    withColumnsFromSchema(selector?: (data: DataOf<TData>) => (keyof DataOf<TData>)[]): RT & TableExtension<C, RT> {
      (config as any).useSchemaColumns = true;
      (config as any).schemaSelector = selector;
      return returnTo as (RT & TableExtension<C, RT>);
    },

    withFiltering(): FilterBuilder<C, RT & TableExtension<C, RT>> {
      config.enableFiltering = true;
      return createFilterBuilder<C, TData, RT & TableExtension<C, RT>>(returnTo as RT & TableExtension<C, RT>, config, dataDescriptor);
    },

    enableSorting(enabled: boolean = true): RT & TableExtension<C, RT> {
      config.enableSorting = enabled;
      return returnTo as (RT & TableExtension<C, RT>);
    },

    enableFiltering(enabled: boolean = true): RT & TableExtension<C, RT> {
      config.enableFiltering = enabled;
      return returnTo as (RT & TableExtension<C, RT>);
    },

    enableColumnResizing(enabled: boolean = true): RT & TableExtension<C, RT> {
      config.enableColumnResizing = enabled;
      return returnTo  as (RT & TableExtension<C, RT>);
    },

    enableRowSelection(enabled: boolean = true): RT & TableExtension<C, RT> {
      config.enableRowSelection = enabled;
      return returnTo  as (RT & TableExtension<C, RT>);
    },

    _buildExtension: (_buildConfig: any, extendedElement: any) => {
      extendedElement.componentProps = {
        ...extendedElement.componentProps,
        tableConfig: config,
      };
    }
  };

  return extension;
}

// ============================================
// Table Component
// ============================================
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
        accessorKey: key as keyof TData,
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
    effectiveColumns: effectiveColumns.map(c => ({ id: c.id, accessorKey: c.accessorKey, hasFn: !!c.accessorFn }))
  });

  // Convert our config to TanStack columns
  const tanstackColumns = useMemo(() => {
    if (!effectiveColumns.length) return [];

    const columnHelper = createColumnHelper<DataOf<TData>>();

    return effectiveColumns.map(col => {
      if (!col.cellRenderer && (col as any).__rendererBuilders && (col as any).__rendererBuilders.length > 0) {
        // set the renderer by building from the builders to provide a ReUIPlanElementSetMember array
        col.cellRenderer = (col as any).__rendererBuilders.map((builder: any) => builder.build(props.options?.buildSettings))
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

  function resolveRenderer(renderer: any, col: any, info): React.ReactElement | null {
    if (Array.isArray(renderer) && renderer.every(r => r.options?.isReUIPlanElement)) {
      // Array of ReUIPlanElementSet
      return (
      <>
        {props.reEngineElementFactory?.(renderer, info.row.original) as React.ReactElement}
      </>
      );
    } else if (renderer.isComponentWrapper) {
      const element = CreateReUiPlanComponent(null, renderer)
        .withValueBinding(data => col.accessorFn ? col.accessorFn(data.localData) : data.localData?.[col.accessorKey])
        .build({})
      return (
      <>
        {props.reEngineElementFactory?.(element, info.row.original) as React.ReactElement ?? null}
      </>
      );
    }
    const Component = renderer as React.ComponentType<any>;
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
        {effectiveColumns.some(c => c.footer || c.footerFn) && (
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

export const TableComponent = createExtendedComponent<
  TableProps<FluxorData<any>> & ReComponentCommonProps & ReComponentSystemProps & PropsWithChildren,
  TableExtension<CNTX, any>
>(Table, 'Table', extendWithTable);