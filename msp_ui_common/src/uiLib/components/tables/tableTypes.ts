import type React from 'react';
import type { FluxorData } from 'msp_common';
import type {
  CNTX,
  DataOf,
  ElementBuilderQuartet,
  FluentSimple,
  FluentSubBuilder,
  LDDTOf,
  ReBuilderBase,
  ReExtensionBuilder,
} from '../../renderEngine/UiPlan/ReUiPlanBuilder.js';

export type TableProps<TData extends FluxorData<any> = FluxorData<any>> = {
  icon?: React.ElementType;
  tableConfig?: TableConfig<TData>;
  data?: DataOf<TData>[];
  record?: DataOf<TData> | DataOf<TData>[];
  dataDescriptor: TData;
};

export type TableOrientation = 'rows-horizontal' | 'rows-vertical';

export enum AggregationType {
  None = 'none',
  Sum = 'sum',
  Average = 'average',
  WeightedAverage = 'weighted-average',
  Count = 'count',
  CountDistinct = 'count-distinct',
  Min = 'min',
  Max = 'max',
  First = 'first',
  Last = 'last',
  Custom = 'custom'
}

export type ColumnPin = 'left' | 'right' | 'none';

export enum RangeStyle {
  None = 'none',
  GreenToRed = 'green-to-red',
  RedToGreen = 'red-to-green',
  BlueScale = 'blue-scale',
  Threshold = 'threshold',
  Custom = 'custom'
}

export type FilterUIComponent = React.ComponentType<FilterUIProps<any>>;

export interface FilterUIProps<TValue> {
  value: TValue | undefined;
  onChange: (value: TValue | undefined) => void;
  column: TableColumnConfig<any>;
  allValues?: TValue[];
}

export interface TableColumnConfig<TData extends FluxorData<any> = FluxorData<any>, TValue = any> {
  id: string;
  accessorKey?: keyof DataOf<TData>;
  accessorFn?: (row: DataOf<TData>) => TValue;
  header?: string;
  headerFn?: (ctx: ColumnHeaderContext) => React.ReactNode;
  pin?: ColumnPin;
  width?: number | 'auto';
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  resizable?: boolean;
  aggregationType?: AggregationType;
  aggregationLabel?: string;
  customAggregation?: (values: TValue[], rows: DataOf<TData>[]) => TValue;
  weightColumn?: keyof DataOf<TData>;
  cellRenderer?: React.ComponentType<CellRendererProps<TData, TValue>>;
  rangeStyle?: RangeStyle;
  rangeThreshold?: number;
  customRangeStyle?: (value: TValue, min: TValue, max: TValue) => React.CSSProperties;
  filterUI?: FilterUIComponent;
  filterFn?: (row: DataOf<TData>, value: TValue, filterValue: any) => boolean;
  footer?: string;
  footerFn?: (ctx: ColumnFooterContext<TData, TValue>) => React.ReactNode;
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

export interface ColumnGroupConfig {
  id: string;
  header: string;
  columns: string[];
}

export interface TableConfig<TData extends FluxorData<any> = FluxorData<any>> {
  orientation: TableOrientation;
  columns: TableColumnConfig<TData>[];
  columnGroups: ColumnGroupConfig[];
  dataAccessor?: (ctx: any) => DataOf<TData>[];
  useSchemaColumns?: boolean;
  schemaSelector?: (data: DataOf<TData>) => (keyof DataOf<TData>)[];
  virtualization?: {
    enabled: boolean;
    rowHeight: number;
    overscan?: number;
  };
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enableColumnResizing?: boolean;
  enableRowSelection?: boolean;
}

export interface ColumnBuilder<C extends CNTX, RT> extends ReBuilderBase<RT> {
  column<K extends keyof DataOf<LDDTOf<C>>>(
    accessor: (data: DataOf<LDDTOf<C>>) => DataOf<LDDTOf<C>>[K]
  ): ColumnOptions<C, DataOf<LDDTOf<C>>[K], RT>;
  computed<TValue>(
    id: string,
    accessor: (data: DataOf<LDDTOf<C>>) => TValue
  ): ColumnOptions<C, TValue, RT>;
  columnGroup(id: string, header: string): ColumnGroupBuilder<C, RT>;
  forEach<TItem>(
    sourceAccessor: (ctx: ForEachContext<LDDTOf<C>>) => TItem[],
    columnFactory: (item: TItem, index: number, builder: ColumnBuilder<C, RT>) => void
  ): ColumnBuilder<C, RT>;
  endColumns: RT;
}

export interface ForEachContext<TData extends FluxorData<any>> {
  root: any;
  parentData?: DataOf<TData>[];
}

export interface ColumnOptions<C extends CNTX, TValue, RT> extends ReBuilderBase<RT> {
  withHeader(header: string): ColumnOptions<C, TValue, RT>;
  withHeaderFn(fn: (ctx: ColumnHeaderContext) => React.ReactNode): ColumnOptions<C, TValue, RT>;
  pinned(pin: ColumnPin): ColumnOptions<C, TValue, RT>;
  withWidth(width: number | 'auto'): ColumnOptions<C, TValue, RT>;
  withMinWidth(width: number): ColumnOptions<C, TValue, RT>;
  withMaxWidth(width: number): ColumnOptions<C, TValue, RT>;
  sortable(enabled?: boolean): ColumnOptions<C, TValue, RT>;
  filterable(enabled?: boolean): ColumnOptions<C, TValue, RT>;
  editable(enabled?: boolean): ColumnOptions<C, TValue, RT>;
  resizable(enabled?: boolean): ColumnOptions<C, TValue, RT>;
  withAggregation(type: AggregationType, label?: string): ColumnOptions<C, TValue, RT>;
  withWeightedAverage(weightColumn: string): ColumnOptions<C, TValue, RT>;
  withCustomAggregation(
    fn: (values: TValue[], rows: any[]) => TValue,
    label?: string
  ): ColumnOptions<C, TValue, RT>;
  withRenderer: {
    fromComponent: (component: React.ComponentType<any>) => ColumnOptions<C, TValue, RT>;
  } & ElementBuilderQuartet<C, ColumnOptions<C, TValue, RT>>;
  withRangeStyle(style: RangeStyle, threshold?: number): ColumnOptions<C, TValue, RT>;
  withCustomRangeStyle(
    fn: (value: TValue, min: TValue, max: TValue) => React.CSSProperties
  ): ColumnOptions<C, TValue, RT>;
  withFilterUI(component: React.ComponentType<FilterUIProps<TValue>>): ColumnOptions<C, TValue, RT>;
  withCustomFilter(fn: (row: DataOf<LDDTOf<C>>, value: TValue, filterValue: any) => boolean): ColumnOptions<C, TValue, RT>;
  withFooter(footer: string): ColumnOptions<C, TValue, RT>;
  withFooterFn(fn: (ctx: ColumnFooterContext<LDDTOf<C>, TValue>) => React.ReactNode): ColumnOptions<C, TValue, RT>;
  column<K extends keyof DataOf<LDDTOf<C>>>(
    accessor: (data: DataOf<LDDTOf<C>>) => DataOf<LDDTOf<C>>[K]
  ): ColumnOptions<C, DataOf<LDDTOf<C>>[K], RT>;
  computed<TNewValue>(id: string, accessor: (data: DataOf<LDDTOf<C>>) => TNewValue): ColumnOptions<C, TNewValue, RT>;
  columnGroup(id: string, header: string): ColumnGroupBuilder<C, RT>;
  forEach<TItem>(
    sourceAccessor: (ctx: ForEachContext<LDDTOf<C>>) => TItem[],
    columnFactory: (item: TItem, index: number, builder: ColumnBuilder<C, RT>) => void
  ): ColumnBuilder<C, RT>;
  endColumns: RT;
}

export interface ColumnGroupBuilder<C extends CNTX, RT> extends ReBuilderBase<RT> {
  column<K extends keyof DataOf<LDDTOf<C>>>(
    accessor: (data: DataOf<LDDTOf<C>>) => DataOf<LDDTOf<C>>[K]
  ): ColumnGroupColumnOptions<C, DataOf<LDDTOf<C>>[K], RT>;
  computed<TValue>(id: string, accessor: (data: DataOf<LDDTOf<C>>) => TValue): ColumnGroupColumnOptions<C, TValue, RT>;
  endGroup: ColumnBuilder<C, RT>;
}

export interface ColumnGroupColumnOptions<C extends CNTX, TValue, RT> extends ReBuilderBase<RT> {
  withHeader(header: string): ColumnGroupColumnOptions<C, TValue, RT>;
  withHeaderFn(fn: (ctx: ColumnHeaderContext) => React.ReactNode): ColumnGroupColumnOptions<C, TValue, RT>;
  pinned(pin: ColumnPin): ColumnGroupColumnOptions<C, TValue, RT>;
  withWidth(width: number | 'auto'): ColumnGroupColumnOptions<C, TValue, RT>;
  withMinWidth(width: number): ColumnGroupColumnOptions<C, TValue, RT>;
  withMaxWidth(width: number): ColumnGroupColumnOptions<C, TValue, RT>;
  sortable(enabled?: boolean): ColumnGroupColumnOptions<C, TValue, RT>;
  filterable(enabled?: boolean): ColumnGroupColumnOptions<C, TValue, RT>;
  editable(enabled?: boolean): ColumnGroupColumnOptions<C, TValue, RT>;
  resizable(enabled?: boolean): ColumnGroupColumnOptions<C, TValue, RT>;
  withAggregation(type: AggregationType, label?: string): ColumnGroupColumnOptions<C, TValue, RT>;
  withWeightedAverage(weightColumn: string): ColumnGroupColumnOptions<C, TValue, RT>;
  withCustomAggregation(fn: (values: TValue[], rows: any[]) => TValue, label?: string): ColumnGroupColumnOptions<C, TValue, RT>;
  withRenderer: {
    fromComponent: (component: React.ComponentType<any>) => ColumnGroupColumnOptions<C, TValue, RT>;
  } & ElementBuilderQuartet<C, ColumnGroupColumnOptions<C, TValue, RT>>;
  withRangeStyle(style: RangeStyle, threshold?: number): ColumnGroupColumnOptions<C, TValue, RT>;
  withCustomRangeStyle(fn: (value: TValue, min: TValue, max: TValue) => React.CSSProperties): ColumnGroupColumnOptions<C, TValue, RT>;
  withFilterUI(component: React.ComponentType<FilterUIProps<TValue>>): ColumnGroupColumnOptions<C, TValue, RT>;
  withCustomFilter(fn: (row: DataOf<LDDTOf<C>>, value: TValue, filterValue: any) => boolean): ColumnGroupColumnOptions<C, TValue, RT>;
  withFooter(footer: string): ColumnGroupColumnOptions<C, TValue, RT>;
  withFooterFn(fn: (ctx: ColumnFooterContext<LDDTOf<C>, TValue>) => React.ReactNode): ColumnGroupColumnOptions<C, TValue, RT>;
  column<K extends keyof DataOf<LDDTOf<C>>>(
    accessor: (data: DataOf<LDDTOf<C>>) => DataOf<LDDTOf<C>>[K]
  ): ColumnGroupColumnOptions<C, DataOf<LDDTOf<C>>[K], RT>;
  computed<TNewValue>(id: string, accessor: (data: DataOf<LDDTOf<C>>) => TNewValue): ColumnGroupColumnOptions<C, TNewValue, RT>;
  endGroup: ColumnBuilder<C, RT>;
}

export interface FilterBuilder<C extends CNTX, RT> extends ReBuilderBase<RT> {
  forColumn<K extends keyof DataOf<LDDTOf<C>>>(
    accessor: (data: DataOf<LDDTOf<C>>) => DataOf<LDDTOf<C>>[K]
  ): FilterColumnOptions<C, DataOf<LDDTOf<C>>[K], RT>;
  globalSearch(columns?: string[]): FilterBuilder<C, RT>;
  endFiltering: RT;
}

export interface FilterColumnOptions<C extends CNTX, TValue, RT> extends ReBuilderBase<RT> {
  withUI(component: React.ComponentType<FilterUIProps<TValue>>): FilterColumnOptions<C, TValue, RT>;
  withCustomFilter(fn: (row: DataOf<LDDTOf<C>>, value: TValue, filterValue: any) => boolean): FilterColumnOptions<C, TValue, RT>;
  forColumn<K extends keyof DataOf<LDDTOf<C>>>(
    accessor: (data: DataOf<LDDTOf<C>>) => DataOf<LDDTOf<C>>[K]
  ): FilterColumnOptions<C, DataOf<LDDTOf<C>>[K], RT>;
  endFiltering: RT;
}

export interface TableExtension<C extends CNTX, RT> extends ReExtensionBuilder<C, RT> {
  forDataType<_T extends FluxorData<any>>(): FluentSimple;
  withOrientation(orientation: TableOrientation): FluentSimple;
  withVirtualization(rowHeight: number, overscan?: number): FluentSimple;
  withColumns(): FluentSubBuilder<ColumnBuilder<C, FluentSimple>>;
  withColumnsFromSchema(selector?: <T>(data: T) => (keyof T)[]): FluentSimple;
  withFiltering(): FluentSubBuilder<FilterBuilder<C, FluentSimple>>;
  enableSorting(enabled?: boolean): FluentSimple;
  enableFiltering(enabled?: boolean): FluentSimple;
  enableColumnResizing(enabled?: boolean): FluentSimple;
  enableRowSelection(enabled?: boolean): FluentSimple;
}
