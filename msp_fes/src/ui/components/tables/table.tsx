
import React, { PropsWithChildren, useMemo } from 'react';

import { createExtendedComponent } from '../../renderEngine/components/ReComponentWrapper';
import { ReComponentCommonProps } from '../../renderEngine/components/ReComponentProps';

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table'
import { ReExtensionBuilder } from '../../renderEngine/UiPlan/ReUiPlanBuilder';

// ============================================
// Table Props
// ============================================
export type TableProps<TData = any> = {
  icon?: React.ElementType;
  tableConfig?: TableConfig<TData>;
  data?: TData[];
  // These come from the render engine
  record?: TData | TData[];
  dataDescriptor?: FluxorData<TData>;
};

// Import FluxorData type
import { FluxorData } from '../../renderEngine/fluxor/fluxorData';
import { FluxorProps } from '../../renderEngine/fluxor/fluxorProps';

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
export interface TableColumnConfig<TData = any, TValue = any> {
  id: string;
  accessorKey?: keyof TData;
  accessorFn?: (row: TData) => TValue;
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
  customAggregation?: (values: TValue[], rows: TData[]) => TValue;
  weightColumn?: keyof TData;  // For weighted average
  
  // Display
  cellRenderer?: React.ComponentType<CellRendererProps<TData, TValue>>;
  rangeStyle?: RangeStyle;
  rangeThreshold?: number;
  customRangeStyle?: (value: TValue, min: TValue, max: TValue) => React.CSSProperties;
  
  // Filter UI
  filterUI?: FilterUIComponent;
  filterFn?: (row: TData, value: TValue, filterValue: any) => boolean;
  
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

export interface ColumnFooterContext<TData, TValue> {
  columnId: string;
  rows: TData[];
  values: TValue[];
  aggregatedValue?: TValue;
}

export interface CellRendererProps<TData, TValue> {
  value: TValue;
  row: TData;
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
export interface TableConfig<TData = any> {
  orientation: TableOrientation;
  columns: TableColumnConfig<TData>[];
  columnGroups: ColumnGroupConfig[];
  dataAccessor?: (ctx: any) => TData[];
  
  // Schema-driven columns
  useSchemaColumns?: boolean;
  schemaSelector?: (data: TData) => (keyof TData)[];
  
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
export interface ColumnBuilder<TData, RT> {
  // Type-safe column from property accessor - THE KEY API!
  // s => s.userName gives us both the key AND the value type
  column<K extends keyof TData>(
    accessor: (data: TData) => TData[K]
  ): ColumnOptions<TData, TData[K], RT>;
  
  // Computed column - accessor returns derived value
  computed<TValue>(
    id: string,
    accessor: (data: TData) => TValue
  ): ColumnOptions<TData, TValue, RT>;
  
  // Column group - wraps multiple columns
  columnGroup(id: string, header: string): ColumnGroupBuilder<TData, RT>;
  
  // Dynamic columns from data relationships
  // e.g., forEach(ctx => ctx.root.program.layers) to create column per layer
  forEach<TItem>(
    sourceAccessor: (ctx: ForEachContext<TData>) => TItem[],
    columnFactory: (item: TItem, index: number, builder: ColumnBuilder<TData, RT>) => void
  ): ColumnBuilder<TData, RT>;
  
  // End columns and return to parent builder
  endColumns: RT;
}

// Context passed to forEach for accessing parent data
export interface ForEachContext<TData> {
  root: any;  // Root context object
  parentData?: TData[];
}

// Options available after starting a column
export interface ColumnOptions<TData, TValue, RT> {
  // Header
  withHeader(header: string): ColumnOptions<TData, TValue, RT>;
  withHeaderFn(fn: (ctx: ColumnHeaderContext) => React.ReactNode): ColumnOptions<TData, TValue, RT>;
  
  // Layout
  pinned(pin: ColumnPin): ColumnOptions<TData, TValue, RT>;
  withWidth(width: number | 'auto'): ColumnOptions<TData, TValue, RT>;
  withMinWidth(width: number): ColumnOptions<TData, TValue, RT>;
  withMaxWidth(width: number): ColumnOptions<TData, TValue, RT>;
  
  // Behavior
  sortable(enabled?: boolean): ColumnOptions<TData, TValue, RT>;
  filterable(enabled?: boolean): ColumnOptions<TData, TValue, RT>;
  editable(enabled?: boolean): ColumnOptions<TData, TValue, RT>;
  resizable(enabled?: boolean): ColumnOptions<TData, TValue, RT>;
  
  // Aggregation - type-safe based on TValue!
  withAggregation(type: AggregationType, label?: string): ColumnOptions<TData, TValue, RT>;
  withWeightedAverage(weightColumn: keyof TData): ColumnOptions<TData, TValue, RT>;
  withCustomAggregation(
    fn: (values: TValue[], rows: TData[]) => TValue,
    label?: string
  ): ColumnOptions<TData, TValue, RT>;
  
  // Display
  withRenderer(component: React.ComponentType<CellRendererProps<TData, TValue>>): ColumnOptions<TData, TValue, RT>;
  withRangeStyle(style: RangeStyle, threshold?: number): ColumnOptions<TData, TValue, RT>;
  withCustomRangeStyle(
    fn: (value: TValue, min: TValue, max: TValue) => React.CSSProperties
  ): ColumnOptions<TData, TValue, RT>;
  
  // Filter UI
  withFilterUI(component: React.ComponentType<FilterUIProps<TValue>>): ColumnOptions<TData, TValue, RT>;
  withCustomFilter(fn: (row: TData, value: TValue, filterValue: any) => boolean): ColumnOptions<TData, TValue, RT>;
  
  // Footer
  withFooter(footer: string): ColumnOptions<TData, TValue, RT>;
  withFooterFn(fn: (ctx: ColumnFooterContext<TData, TValue>) => React.ReactNode): ColumnOptions<TData, TValue, RT>;
  
  // Chain to next column or end
  column<K extends keyof TData>(accessor: (data: TData) => TData[K]): ColumnOptions<TData, TData[K], RT>;
  computed<TNewValue>(id: string, accessor: (data: TData) => TNewValue): ColumnOptions<TData, TNewValue, RT>;
  columnGroup(id: string, header: string): ColumnGroupBuilder<TData, RT>;
  forEach<TItem>(
    sourceAccessor: (ctx: ForEachContext<TData>) => TItem[],
    columnFactory: (item: TItem, index: number, builder: ColumnBuilder<TData, RT>) => void
  ): ColumnBuilder<TData, RT>;
  endColumns: RT;
}

// Column group builder for nested headers
export interface ColumnGroupBuilder<TData, RT> {
  column<K extends keyof TData>(accessor: (data: TData) => TData[K]): ColumnGroupColumnOptions<TData, TData[K], RT>;
  computed<TValue>(id: string, accessor: (data: TData) => TValue): ColumnGroupColumnOptions<TData, TValue, RT>;
  endGroup: ColumnBuilder<TData, RT>;
}

// Column options within a group (same options but returns to group)
export interface ColumnGroupColumnOptions<TData, TValue, RT> {
  // Header
  withHeader(header: string): ColumnGroupColumnOptions<TData, TValue, RT>;
  withHeaderFn(fn: (ctx: ColumnHeaderContext) => React.ReactNode): ColumnGroupColumnOptions<TData, TValue, RT>;
  
  // Layout
  pinned(pin: ColumnPin): ColumnGroupColumnOptions<TData, TValue, RT>;
  withWidth(width: number | 'auto'): ColumnGroupColumnOptions<TData, TValue, RT>;
  withMinWidth(width: number): ColumnGroupColumnOptions<TData, TValue, RT>;
  withMaxWidth(width: number): ColumnGroupColumnOptions<TData, TValue, RT>;
  
  // Behavior
  sortable(enabled?: boolean): ColumnGroupColumnOptions<TData, TValue, RT>;
  filterable(enabled?: boolean): ColumnGroupColumnOptions<TData, TValue, RT>;
  editable(enabled?: boolean): ColumnGroupColumnOptions<TData, TValue, RT>;
  resizable(enabled?: boolean): ColumnGroupColumnOptions<TData, TValue, RT>;
  
  // Aggregation
  withAggregation(type: AggregationType, label?: string): ColumnGroupColumnOptions<TData, TValue, RT>;
  withWeightedAverage(weightColumn: keyof TData): ColumnGroupColumnOptions<TData, TValue, RT>;
  withCustomAggregation(fn: (values: TValue[], rows: TData[]) => TValue, label?: string): ColumnGroupColumnOptions<TData, TValue, RT>;
  
  // Display
  withRenderer(component: React.ComponentType<CellRendererProps<TData, TValue>>): ColumnGroupColumnOptions<TData, TValue, RT>;
  withRangeStyle(style: RangeStyle, threshold?: number): ColumnGroupColumnOptions<TData, TValue, RT>;
  withCustomRangeStyle(fn: (value: TValue, min: TValue, max: TValue) => React.CSSProperties): ColumnGroupColumnOptions<TData, TValue, RT>;
  
  // Filter UI
  withFilterUI(component: React.ComponentType<FilterUIProps<TValue>>): ColumnGroupColumnOptions<TData, TValue, RT>;
  withCustomFilter(fn: (row: TData, value: TValue, filterValue: any) => boolean): ColumnGroupColumnOptions<TData, TValue, RT>;
  
  // Footer
  withFooter(footer: string): ColumnGroupColumnOptions<TData, TValue, RT>;
  withFooterFn(fn: (ctx: ColumnFooterContext<TData, TValue>) => React.ReactNode): ColumnGroupColumnOptions<TData, TValue, RT>;
  
  // Chain to next column in group
  column<K extends keyof TData>(accessor: (data: TData) => TData[K]): ColumnGroupColumnOptions<TData, TData[K], RT>;
  computed<TNewValue>(id: string, accessor: (data: TData) => TNewValue): ColumnGroupColumnOptions<TData, TNewValue, RT>;
  
  // End group and return to column builder
  endGroup: ColumnBuilder<TData, RT>;
}

// ============================================
// Filter Builder Interface
// ============================================
export interface FilterBuilder<TData, RT> {
  // Column-specific filter
  forColumn<K extends keyof TData>(
    accessor: (data: TData) => TData[K]
  ): FilterColumnOptions<TData, TData[K], RT>;
  
  // Global search filter
  globalSearch(columns?: (keyof TData)[]): FilterBuilder<TData, RT>;
  
  endFiltering: RT;
}

export interface FilterColumnOptions<TData, TValue, RT> {
  withUI(component: React.ComponentType<FilterUIProps<TValue>>): FilterColumnOptions<TData, TValue, RT>;
  withCustomFilter(fn: (row: TData, value: TValue, filterValue: any) => boolean): FilterColumnOptions<TData, TValue, RT>;
  
  // Chain
  forColumn<K extends keyof TData>(accessor: (data: TData) => TData[K]): FilterColumnOptions<TData, TData[K], RT>;
  endFiltering: RT;
}

// ============================================
// Table Extension Interface
// ============================================
export interface TableExtension<RT = any, TData = any> extends ReExtensionBuilder {
  // Set the data type for type-safe columns
  forDataType<T>(): TableExtension<RT, T>;
  
  // Orientation
  withOrientation(orientation: TableOrientation): TableExtension<RT, TData>;
  
  // Virtualization for large datasets
  withVirtualization(rowHeight: number, overscan?: number): TableExtension<RT, TData>;
  
  // Type-safe column builder - THE MAIN API
  withColumns(): ColumnBuilder<TData, RT>;
  
  // Auto-generate columns from schema (future: will use FluxorProps metadata)
  withColumnsFromSchema(selector?: (data: TData) => (keyof TData)[]): TableExtension<RT, TData>;
  
  // Filter configuration
  withFiltering(): FilterBuilder<TData, RT>;
  
  // Global table options
  enableSorting(enabled?: boolean): TableExtension<RT, TData>;
  enableFiltering(enabled?: boolean): TableExtension<RT, TData>;
  enableColumnResizing(enabled?: boolean): TableExtension<RT, TData>;
  enableRowSelection(enabled?: boolean): TableExtension<RT, TData>;
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

function createColumnBuilder<TData, RT>(
  returnTo: RT,
  config: TableConfig<TData>,
  currentGroupId: string | null
): ColumnBuilder<TData, RT> {
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
    col: TableColumnConfig<TData, TValue>
  ): ColumnOptions<TData, TValue, RT> => {
    // Set currentColumn so finishCurrentColumn can push it
    currentColumn = col as TableColumnConfig<TData>;
    
    const options: ColumnOptions<TData, TValue, RT> = {
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
      
      withRenderer(component) {
        col.cellRenderer = component;
        return options;
      },
      
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
      column<K extends keyof TData>(accessor: (data: TData) => TData[K]) {
        finishCurrentColumn();
        const key = getAccessorKey(accessor);
        const newCol: TableColumnConfig<TData, TData[K]> = {
          id: key,
          accessorKey: key as K,
          accessorFn: accessor,
        };
        return createColumnOptions(newCol);
      },
      
      computed<TNewValue>(id: string, accessor: (data: TData) => TNewValue) {
        finishCurrentColumn();
        const newCol: TableColumnConfig<TData, TNewValue> = {
          id,
          accessorFn: accessor,
        };
        return createColumnOptions(newCol);
      },
      
      columnGroup(id: string, header: string) {
        finishCurrentColumn();
        config.columnGroups.push({ id, header, columns: [] });
        return createColumnGroupBuilder<TData, RT>(returnTo, config, id);
      },
      
      forEach<TItem>(
        sourceAccessor: (ctx: ForEachContext<TData>) => TItem[],
        columnFactory: (item: TItem, index: number, builder: ColumnBuilder<TData, RT>) => void
      ) {
        finishCurrentColumn();
        (config as any).forEachFactories = (config as any).forEachFactories || [];
        (config as any).forEachFactories.push({ sourceAccessor, columnFactory });
        return createColumnBuilder<TData, RT>(returnTo, config, currentGroupId);
      },
      
      get endColumns() {
        finishCurrentColumn();
        return returnTo;
      }
    };
    
    return options;
  };
  
  // The initial builder - before any column is started
  const builder: ColumnBuilder<TData, RT> = {
    column<K extends keyof TData>(accessor: (data: TData) => TData[K]) {
      finishCurrentColumn();
      const key = getAccessorKey(accessor);
      const newCol: TableColumnConfig<TData, TData[K]> = {
        id: key,
        accessorKey: key as K,
        accessorFn: accessor,
      };
      return createColumnOptions(newCol);
    },
    
    computed<TValue>(id: string, accessor: (data: TData) => TValue) {
      finishCurrentColumn();
      const newCol: TableColumnConfig<TData, TValue> = {
        id,
        accessorFn: accessor,
      };
      return createColumnOptions(newCol);
    },
    
    columnGroup(id: string, header: string) {
      finishCurrentColumn();
      config.columnGroups.push({ id, header, columns: [] });
      return createColumnGroupBuilder<TData, RT>(returnTo, config, id);
    },
    
    forEach<TItem>(
      sourceAccessor: (ctx: ForEachContext<TData>) => TItem[],
      columnFactory: (item: TItem, index: number, builder: ColumnBuilder<TData, RT>) => void
    ) {
      finishCurrentColumn();
      (config as any).forEachFactories = (config as any).forEachFactories || [];
      (config as any).forEachFactories.push({ sourceAccessor, columnFactory });
      return createColumnBuilder<TData, RT>(returnTo, config, currentGroupId);
    },
    
    get endColumns() {
      finishCurrentColumn();
      return returnTo;
    }
  };
  
  return builder;
}

function createColumnGroupBuilder<TData, RT>(
  returnTo: RT,
  config: TableConfig<TData>,
  groupId: string
): ColumnGroupBuilder<TData, RT> {
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
    col: TableColumnConfig<TData, TValue>
  ): ColumnGroupColumnOptions<TData, TValue, RT> => {
    currentColumn = col as TableColumnConfig<TData>;
    
    const options: ColumnGroupColumnOptions<TData, TValue, RT> = {
      withHeader(header: string) {
        col.header = header;
        return options;
      },
      withHeaderFn(fn: (ctx: ColumnHeaderContext) => React.ReactNode) {
        col.headerFn = fn;
        return options;
      },
      pinned(pin: ColumnPin) {
        col.pin = pin;
        return options;
      },
      withWidth(width: number | 'auto') {
        col.width = width;
        return options;
      },
      withMinWidth(width: number) {
        col.minWidth = width;
        return options;
      },
      withMaxWidth(width: number) {
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
      withAggregation(type: AggregationType, label?: string) {
        col.aggregationType = type;
        col.aggregationLabel = label;
        return options;
      },
      withWeightedAverage(weightColumn: keyof TData) {
        col.aggregationType = AggregationType.WeightedAverage;
        col.weightColumn = weightColumn;
        return options;
      },
      withCustomAggregation(fn: (values: TValue[], rows: TData[]) => TValue, label?: string) {
        col.aggregationType = AggregationType.Custom;
        col.customAggregation = fn;
        col.aggregationLabel = label;
        return options;
      },
      withRenderer(component: React.ComponentType<CellRendererProps<TData, TValue>>) {
        col.cellRenderer = component;
        return options;
      },
      withRangeStyle(style: RangeStyle, threshold?: number) {
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
      withCustomFilter(fn: (row: TData, value: TValue, filterValue: any) => boolean) {
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
      column<K extends keyof TData>(accessor: (data: TData) => TData[K]) {
        finishCurrentColumn();
        const key = getAccessorKey(accessor);
        const newCol: TableColumnConfig<TData, TData[K]> = {
          id: key,
          accessorKey: key as K,
          accessorFn: accessor,
        };
        return createGroupColumnOptions(newCol);
      },
      
      computed<TNewValue>(id: string, accessor: (data: TData) => TNewValue) {
        finishCurrentColumn();
        const newCol: TableColumnConfig<TData, TNewValue> = {
          id,
          accessorFn: accessor,
        };
        return createGroupColumnOptions(newCol);
      },
      
      get endGroup() {
        finishCurrentColumn();
        return createColumnBuilder<TData, RT>(returnTo, config, null);
      }
    };
    
    return options;
  };
  
  return {
    column<K extends keyof TData>(accessor: (data: TData) => TData[K]) {
      finishCurrentColumn();
      const key = getAccessorKey(accessor);
      const newCol: TableColumnConfig<TData, TData[K]> = {
        id: key,
        accessorKey: key as K,
        accessorFn: accessor,
      };
      return createGroupColumnOptions(newCol);
    },
    
    computed<TValue>(id: string, accessor: (data: TData) => TValue) {
      finishCurrentColumn();
      const newCol: TableColumnConfig<TData, TValue> = {
        id,
        accessorFn: accessor,
      };
      return createGroupColumnOptions(newCol);
    },
    
    get endGroup() {
      finishCurrentColumn();
      return createColumnBuilder<TData, RT>(returnTo, config, null);
    }
  };
}

// ============================================
// Filter Builder Implementation
// ============================================
function createFilterBuilder<TData, RT>(
  returnTo: RT,
  config: TableConfig<TData>
): FilterBuilder<TData, RT> {
  return {
    forColumn<K extends keyof TData>(accessor: (data: TData) => TData[K]) {
      const key = getAccessorKey(accessor);
      const col = config.columns.find(c => c.id === key);
      
      const filterOptions: FilterColumnOptions<TData, TData[K], RT> = {
        withUI(component) {
          if (col) col.filterUI = component;
          return this;
        },
        
        withCustomFilter(fn) {
          if (col) col.filterFn = fn;
          return this;
        },
        
        forColumn<K2 extends keyof TData>(accessor2: (data: TData) => TData[K2]) {
          return createFilterBuilder<TData, RT>(returnTo, config).forColumn(accessor2);
        },
        
        get endFiltering() {
          return returnTo;
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
    }
  };
}

// ============================================
// Table Extension Factory
// ============================================
export function extendWithTable<RT, TData = any>(returnTo: RT): TableExtension<RT, TData> {
  const config: TableConfig<TData> = {
    orientation: 'rows-horizontal',
    columns: [],
    columnGroups: [],
  };
  
  const extension: TableExtension<RT, TData> = {
    forDataType<T>() {
      // Returns same extension but with different TData type
      // Cast through returnTo to maintain the builder chain
      return returnTo as unknown as TableExtension<RT, T>;
    },
    
    withOrientation(orientation) {
      config.orientation = orientation;
      return returnTo as unknown as TableExtension<RT, TData>;
    },
    
    withVirtualization(rowHeight, overscan = 5) {
      config.virtualization = { enabled: true, rowHeight, overscan };
      return returnTo as unknown as TableExtension<RT, TData>;
    },
    
    withColumns() {
      return createColumnBuilder<TData, RT>(returnTo, config, null);
    },
    
    withColumnsFromSchema(selector?: (data: TData) => (keyof TData)[]) {
      (config as any).useSchemaColumns = true;
      (config as any).schemaSelector = selector;
      return returnTo as unknown as TableExtension<RT, TData>;
    },
    
    withFiltering() {
      config.enableFiltering = true;
      return createFilterBuilder<TData, RT>(returnTo, config);
    },
    
    enableSorting(enabled = true) {
      config.enableSorting = enabled;
      return returnTo as unknown as TableExtension<RT, TData>;
    },
    
    enableFiltering(enabled = true) {
      config.enableFiltering = enabled;
      return returnTo as unknown as TableExtension<RT, TData>;
    },
    
    enableColumnResizing(enabled = true) {
      config.enableColumnResizing = enabled;
      return returnTo as unknown as TableExtension<RT, TData>;
    },
    
    enableRowSelection(enabled = true) {
      config.enableRowSelection = enabled;
      return returnTo as unknown as TableExtension<RT, TData>;
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
function Table<TData = any>(
  props: TableProps<TData> & PropsWithChildren & ReComponentCommonProps
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
    allPropKeys: Object.keys(props)
  });
  
  // Use record (from binding) or data prop, ensure it's an array
  const tableData = useMemo(() => {
    const sourceData = record ?? data ?? [];
    return Array.isArray(sourceData) ? sourceData : [sourceData];
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
  
  // Convert our config to TanStack columns
  const tanstackColumns = useMemo(() => {
    if (!effectiveColumns.length) return [];
    
    const columnHelper = createColumnHelper<TData>();
    
    return effectiveColumns.map(col => {
      if (col.accessorKey) {
        return columnHelper.accessor(col.accessorKey as any, {
          id: col.id,
          header: col.header || col.id,
          cell: col.cellRenderer 
            ? (info) => {
                const Component = col.cellRenderer!;
                return <Component 
                  value={info.getValue()} 
                  row={info.row.original} 
                  rowIndex={info.row.index}
                  column={col}
                />;
              }
            : (info) => String(info.getValue() ?? ''),
          footer: col.footer,
          enableSorting: col.sortable ?? tableConfig?.enableSorting,
          enableColumnFilter: col.filterable ?? tableConfig?.enableFiltering,
        });
      } else if (col.accessorFn) {
        return columnHelper.accessor(col.accessorFn as any, {
          id: col.id,
          header: col.header || col.id,
          cell: col.cellRenderer
            ? (info) => {
                const Component = col.cellRenderer!;
                return <Component 
                  value={info.getValue()} 
                  row={info.row.original} 
                  rowIndex={info.row.index}
                  column={col}
                />;
              }
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
  TableProps & ReComponentCommonProps & PropsWithChildren, 
  TableExtension<any, any>
>(Table, 'Table', extendWithTable);