import type React from 'react';
import { createElementBuilderQuartet } from '../../renderEngine/UiPlan/ReUiPlanBuilder.js';
import type { CNTX, DataOf, LDDTOf } from '../../renderEngine/UiPlan/ReUiPlanBuilder.js';
import type {
  AggregationType,
  CellRendererProps,
  ColumnPin,
  ColumnBuilder,
  ColumnFooterContext,
  ColumnGroupBuilder,
  ColumnGroupColumnOptions,
  ColumnHeaderContext,
  ColumnOptions,
  FilterBuilder,
  FilterColumnOptions,
  FilterUIProps,
  ForEachContext,
  RangeStyle,
  TableColumnConfig,
  TableConfig,
} from './tableTypes.js';

type RuntimeTableConfig<C extends CNTX, RT> = TableConfig<LDDTOf<C>> & {
  forEachFactories?: Array<{
    sourceAccessor: (ctx: ForEachContext<LDDTOf<C>>) => unknown[];
    columnFactory: (item: unknown, index: number, builder: ColumnBuilder<C, RT>) => void;
  }>;
  globalSearchColumns?: string[];
};

type ColumnWithRendererBuilders<C extends CNTX, TValue> = TableColumnConfig<LDDTOf<C>, TValue> & {
  __rendererBuilders?: unknown[];
};

// Helper to extract property key from accessor function
// Uses a proxy to capture which property is accessed
function getAccessorKey<TData, TValue>(accessor: (data: TData) => TValue): string {
  const accessed: string[] = [];
  const proxy = new Proxy({}, {
    get(_target, prop) {
      accessed.push(String(prop));
      return undefined;
    }
  });

  try {
    accessor(proxy as TData);
  } catch {
    // Ignore errors from the proxy
  }

  return accessed[0] || 'unknown';
}

export function createColumnBuilder<C extends CNTX, RT>(
  returnTo: RT,
  config: TableConfig<LDDTOf<C>>,
  currentGroupId: string | null,
): ColumnBuilder<C, RT> {
  const runtimeConfig = config as RuntimeTableConfig<C, RT>;
  let currentColumn: TableColumnConfig<LDDTOf<C>> | null = null;

  const finishCurrentColumn = () => {
    if (currentColumn) {
      if (currentGroupId) {
        currentColumn.groupId = currentGroupId;
      }
      config.columns.push(currentColumn);
      currentColumn = null;
    }
  };

  const createColumnOptions = <TValue,>(
    col: TableColumnConfig<LDDTOf<C>, TValue>
  ): ColumnOptions<C, TValue, RT> => {
    currentColumn = col as TableColumnConfig<LDDTOf<C>>;

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
        col.aggregationType = 'weighted-average' as AggregationType;
        col.weightColumn = weightColumn as keyof DataOf<LDDTOf<C>>;
        return options;
      },

      withCustomAggregation(fn, label) {
        col.aggregationType = 'custom' as AggregationType;
        col.customAggregation = fn;
        col.aggregationLabel = label;
        return options;
      },

      withRenderer: undefined as unknown as ColumnOptions<C, TValue, RT>['withRenderer'],

      withRangeStyle(style, threshold) {
        col.rangeStyle = style;
        col.rangeThreshold = threshold;
        return options;
      },

      withCustomRangeStyle(fn) {
        col.rangeStyle = 'custom' as RangeStyle;
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

      column<K extends keyof DataOf<LDDTOf<C>>>(accessor: (data: DataOf<LDDTOf<C>>) => DataOf<LDDTOf<C>>[K]) {
        finishCurrentColumn();
        const key = getAccessorKey(accessor);
        const newCol: TableColumnConfig<LDDTOf<C>, DataOf<LDDTOf<C>>[K]> = {
          id: key,
          accessorKey: key as K,
          accessorFn: accessor,
        };
        return createColumnOptions(newCol);
      },

      computed<TNewValue>(id: string, accessor: (data: DataOf<LDDTOf<C>>) => TNewValue) {
        finishCurrentColumn();
        const newCol: TableColumnConfig<LDDTOf<C>, TNewValue> = {
          id,
          accessorFn: accessor,
        };
        return createColumnOptions(newCol);
      },

      columnGroup(id: string, header: string) {
        finishCurrentColumn();
        config.columnGroups.push({ id, header, columns: [] });
        return createColumnGroupBuilder<C, RT>(returnTo, config, id);
      },

      forEach<TItem>(
        sourceAccessor: (ctx: ForEachContext<LDDTOf<C>>) => TItem[],
        columnFactory: (item: TItem, index: number, builder: ColumnBuilder<C, RT>) => void
      ) {
        finishCurrentColumn();
        runtimeConfig.forEachFactories = runtimeConfig.forEachFactories || [];
        runtimeConfig.forEachFactories.push({
          sourceAccessor: sourceAccessor as (ctx: ForEachContext<LDDTOf<C>>) => unknown[],
          columnFactory: columnFactory as (item: unknown, index: number, builder: ColumnBuilder<C, RT>) => void,
        });
        return createColumnBuilder<C, RT>(returnTo, config, currentGroupId);
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

    const rendererBuilders: any[] = [];
    options.withRenderer = {
      fromComponent: (component: React.ComponentType<CellRendererProps<LDDTOf<C>, TValue>>) => {
        col.cellRenderer = component;
        return options;
      },
      ...createElementBuilderQuartet<C, ColumnOptions<C, TValue, RT>>(
        options,
        rendererBuilders,
        undefined
      )
    };

    (col as ColumnWithRendererBuilders<C, TValue>).__rendererBuilders = rendererBuilders;

    return options;
  };

  const builder: ColumnBuilder<C, RT> = {
    column<K extends keyof DataOf<LDDTOf<C>>>(accessor: (data: DataOf<LDDTOf<C>>) => DataOf<LDDTOf<C>>[K]) {
      finishCurrentColumn();
      const key = getAccessorKey(accessor);
      const newCol: TableColumnConfig<LDDTOf<C>, DataOf<LDDTOf<C>>[K]> = {
        id: key,
        accessorKey: key as K,
        accessorFn: accessor,
      };
      return createColumnOptions(newCol);
    },

    computed<TValue>(id: string, accessor: (data: DataOf<LDDTOf<C>>) => TValue) {
      finishCurrentColumn();
      const newCol: TableColumnConfig<LDDTOf<C>, TValue> = {
        id,
        accessorFn: accessor,
      };
      return createColumnOptions(newCol);
    },

    columnGroup(id: string, header: string) {
      finishCurrentColumn();
      config.columnGroups.push({ id, header, columns: [] });
      return createColumnGroupBuilder<C, RT>(returnTo, config, id);
    },

    forEach<TItem>(
      sourceAccessor: (ctx: ForEachContext<LDDTOf<C>>) => TItem[],
      columnFactory: (item: TItem, index: number, builder: ColumnBuilder<C, RT>) => void
    ) {
      finishCurrentColumn();
      runtimeConfig.forEachFactories = runtimeConfig.forEachFactories || [];
      runtimeConfig.forEachFactories.push({
        sourceAccessor: sourceAccessor as (ctx: ForEachContext<LDDTOf<C>>) => unknown[],
        columnFactory: columnFactory as (item: unknown, index: number, builder: ColumnBuilder<C, RT>) => void,
      });
      return createColumnBuilder<C, RT>(returnTo, config, currentGroupId);
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

function createColumnGroupBuilder<C extends CNTX, RT>(
  returnTo: RT,
  config: TableConfig<LDDTOf<C>>,
  groupId: string,
): ColumnGroupBuilder<C, RT> {
  const group = config.columnGroups.find(g => g.id === groupId)!;
  let currentColumn: TableColumnConfig<LDDTOf<C>> | null = null;

  const finishCurrentColumn = () => {
    if (currentColumn) {
      currentColumn.groupId = groupId;
      group.columns.push(currentColumn.id);
      config.columns.push(currentColumn);
      currentColumn = null;
    }
  };

  const createGroupColumnOptions = <TValue,>(
    col: TableColumnConfig<LDDTOf<C>, TValue>,
  ): ColumnGroupColumnOptions<C, TValue, RT> => {
    currentColumn = col as TableColumnConfig<LDDTOf<C>>;

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
      withWeightedAverage(weightColumn: string): ColumnGroupColumnOptions<C, TValue, RT> {
        col.aggregationType = 'weighted-average' as AggregationType;
        col.weightColumn = weightColumn as keyof DataOf<LDDTOf<C>>;
        return options;
      },
      withCustomAggregation(fn: (values: TValue[], rows: any[]) => TValue, label?: string): ColumnGroupColumnOptions<C, TValue, RT> {
        col.aggregationType = 'custom' as AggregationType;
        col.customAggregation = fn;
        col.aggregationLabel = label;
        return options;
      },

      withRenderer: undefined as unknown as ColumnGroupColumnOptions<C, TValue, RT>['withRenderer'],

      withRangeStyle(style: RangeStyle, threshold?: number): ColumnGroupColumnOptions<C, TValue, RT> {
        col.rangeStyle = style;
        col.rangeThreshold = threshold;
        return options;
      },
      withCustomRangeStyle(fn: (value: TValue, min: TValue, max: TValue) => React.CSSProperties) {
        col.rangeStyle = 'custom' as RangeStyle;
        col.customRangeStyle = fn;
        return options;
      },
      withFilterUI(component: React.ComponentType<FilterUIProps<TValue>>) {
        col.filterUI = component;
        return options;
      },
      withCustomFilter(fn: (row: DataOf<LDDTOf<C>>, value: TValue, filterValue: any) => boolean) {
        col.filterFn = fn;
        return options;
      },
      withFooter(footer: string) {
        col.footer = footer;
        return options;
      },
      withFooterFn(fn: (ctx: ColumnFooterContext<LDDTOf<C>, TValue>) => React.ReactNode) {
        col.footerFn = fn;
        return options;
      },

      column<K extends keyof DataOf<LDDTOf<C>>>(accessor: (data: DataOf<LDDTOf<C>>) => DataOf<LDDTOf<C>>[K]) {
        finishCurrentColumn();
        const key = getAccessorKey(accessor);
        const newCol: TableColumnConfig<LDDTOf<C>, DataOf<LDDTOf<C>>[K]> = {
          id: key,
          accessorKey: key as K,
          accessorFn: accessor,
        };
        return createGroupColumnOptions(newCol);
      },

      computed<TNewValue>(id: string, accessor: (data: DataOf<LDDTOf<C>>) => TNewValue) {
        finishCurrentColumn();
        const newCol: TableColumnConfig<LDDTOf<C>, TNewValue> = {
          id,
          accessorFn: accessor,
        };
        return createGroupColumnOptions(newCol);
      },

      get endGroup() {
        finishCurrentColumn();
        return createColumnBuilder<C, RT>(returnTo, config, null);
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

    const rendererBuilders: any[] = [];
    options.withRenderer = {
      fromComponent: (component: React.ComponentType<CellRendererProps<LDDTOf<C>, TValue>>): ColumnGroupColumnOptions<C, TValue, RT> => {
        col.cellRenderer = component;
        return options;
      },
      ...createElementBuilderQuartet<C, ColumnGroupColumnOptions<C, TValue, RT>>(
        options,
        rendererBuilders,
        undefined
      )
    };

    (col as ColumnWithRendererBuilders<C, TValue>).__rendererBuilders = rendererBuilders;

    return options;
  };

  return {
    column<K extends keyof DataOf<LDDTOf<C>>>(accessor: (data: DataOf<LDDTOf<C>>) => DataOf<LDDTOf<C>>[K]): ColumnGroupColumnOptions<C, DataOf<LDDTOf<C>>[K], RT> {
      finishCurrentColumn();
      const key = getAccessorKey(accessor);
      const newCol: TableColumnConfig<LDDTOf<C>, DataOf<LDDTOf<C>>[K]> = {
        id: key,
        accessorKey: key as K,
        accessorFn: accessor,
      };
      return createGroupColumnOptions(newCol);
    },

    computed<TValue>(id: string, accessor: (data: DataOf<LDDTOf<C>>) => TValue): ColumnGroupColumnOptions<C, TValue, RT> {
      finishCurrentColumn();
      const newCol: TableColumnConfig<LDDTOf<C>, TValue> = {
        id,
        accessorFn: accessor,
      };
      return createGroupColumnOptions(newCol);
    },

    get endGroup(): ColumnBuilder<C, RT> {
      finishCurrentColumn();
      return createColumnBuilder<C, RT>(returnTo, config, null);
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

export function createFilterBuilder<C extends CNTX, RT>(
  returnTo: RT,
  config: TableConfig<LDDTOf<C>>
): FilterBuilder<C, RT> {
  const runtimeConfig = config as RuntimeTableConfig<C, RT>;
  return {
    forColumn<K extends keyof DataOf<LDDTOf<C>>>(accessor: (data: DataOf<LDDTOf<C>>) => DataOf<LDDTOf<C>>[K]) {
      const key = getAccessorKey(accessor);
      const col = config.columns.find(c => c.id === key);

      const filterOptions: FilterColumnOptions<C, DataOf<LDDTOf<C>>[K], RT> = {
        withUI(component) {
          if (col) col.filterUI = component;
          return this;
        },

        withCustomFilter(fn) {
          if (col) col.filterFn = fn;
          return this;
        },

        forColumn<K2 extends keyof DataOf<LDDTOf<C>>>(accessor2: (data: DataOf<LDDTOf<C>>) => DataOf<LDDTOf<C>>[K2]) {
          return createFilterBuilder<C, RT>(returnTo, config).forColumn(accessor2);
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
      runtimeConfig.globalSearchColumns = columns;
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
