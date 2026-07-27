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

function assertTableDefinitionsUnlocked(config: TableConfig<any>, methodName: string): void {
  const assertUnlocked = (config as any).__assertDefinitionUnlocked as ((name: string) => void) | undefined;
  if (assertUnlocked) {
    assertUnlocked(methodName);
  }
}

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
  let _isBuilt = false;
  let currentColumn: TableColumnConfig<LDDTOf<C>> | null = null;

  const finishCurrentColumn = () => {
    if (currentColumn) {
      assertTableDefinitionsUnlocked(config, 'table.columns.finishCurrentColumn');
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
    let _isBuilt = false;
    const options: ColumnOptions<C, TValue, RT> = {
      withHeader(header: string) {
        assertTableDefinitionsUnlocked(config, 'table.columns.withHeader');
        col.header = header;
        return options;
      },

      withHeaderFn(fn) {
        assertTableDefinitionsUnlocked(config, 'table.columns.withHeaderFn');
        col.headerFn = fn;
        return options;
      },

      pinned(pin) {
        assertTableDefinitionsUnlocked(config, 'table.columns.pinned');
        col.pin = pin;
        return options;
      },

      withWidth(width) {
        assertTableDefinitionsUnlocked(config, 'table.columns.withWidth');
        col.width = width;
        return options;
      },

      withMinWidth(width) {
        assertTableDefinitionsUnlocked(config, 'table.columns.withMinWidth');
        col.minWidth = width;
        return options;
      },

      withMaxWidth(width) {
        assertTableDefinitionsUnlocked(config, 'table.columns.withMaxWidth');
        col.maxWidth = width;
        return options;
      },

      sortable(enabled = true) {
        assertTableDefinitionsUnlocked(config, 'table.columns.sortable');
        col.sortable = enabled;
        return options;
      },

      filterable(enabled = true) {
        assertTableDefinitionsUnlocked(config, 'table.columns.filterable');
        col.filterable = enabled;
        return options;
      },

      editable(enabled = true) {
        assertTableDefinitionsUnlocked(config, 'table.columns.editable');
        col.editable = enabled;
        return options;
      },

      resizable(enabled = true) {
        assertTableDefinitionsUnlocked(config, 'table.columns.resizable');
        col.resizable = enabled;
        return options;
      },

      withAggregation(type, label) {
        assertTableDefinitionsUnlocked(config, 'table.columns.withAggregation');
        col.aggregationType = type;
        col.aggregationLabel = label;
        return options;
      },

      withWeightedAverage(weightColumn) {
        assertTableDefinitionsUnlocked(config, 'table.columns.withWeightedAverage');
        col.aggregationType = 'weighted-average' as AggregationType;
        col.weightColumn = weightColumn as keyof DataOf<LDDTOf<C>>;
        return options;
      },

      withCustomAggregation(fn, label) {
        assertTableDefinitionsUnlocked(config, 'table.columns.withCustomAggregation');
        col.aggregationType = 'custom' as AggregationType;
        col.customAggregation = fn;
        col.aggregationLabel = label;
        return options;
      },

      withRenderer: undefined as unknown as ColumnOptions<C, TValue, RT>['withRenderer'],

      withRangeStyle(style, threshold) {
        assertTableDefinitionsUnlocked(config, 'table.columns.withRangeStyle');
        col.rangeStyle = style;
        col.rangeThreshold = threshold;
        return options;
      },

      withCustomRangeStyle(fn) {
        assertTableDefinitionsUnlocked(config, 'table.columns.withCustomRangeStyle');
        col.rangeStyle = 'custom' as RangeStyle;
        col.customRangeStyle = fn;
        return options;
      },

      withFilterUI(component) {
        assertTableDefinitionsUnlocked(config, 'table.columns.withFilterUI');
        col.filterUI = component;
        return options;
      },

      withCustomFilter(fn) {
        assertTableDefinitionsUnlocked(config, 'table.columns.withCustomFilter');
        col.filterFn = fn;
        return options;
      },

      withFooter(footer) {
        assertTableDefinitionsUnlocked(config, 'table.columns.withFooter');
        col.footer = footer;
        return options;
      },

      withFooterFn(fn) {
        assertTableDefinitionsUnlocked(config, 'table.columns.withFooterFn');
        col.footerFn = fn;
        return options;
      },

      column<K extends keyof DataOf<LDDTOf<C>>>(accessor: (data: DataOf<LDDTOf<C>>) => DataOf<LDDTOf<C>>[K]) {
        assertTableDefinitionsUnlocked(config, 'table.columns.column');
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
        assertTableDefinitionsUnlocked(config, 'table.columns.computed');
        finishCurrentColumn();
        const newCol: TableColumnConfig<LDDTOf<C>, TNewValue> = {
          id,
          accessorFn: accessor,
        };
        return createColumnOptions(newCol);
      },

      columnGroup(id: string, header: string) {
        assertTableDefinitionsUnlocked(config, 'table.columns.columnGroup');
        finishCurrentColumn();
        config.columnGroups.push({ id, header, columns: [] });
        return createColumnGroupBuilder<C, RT>(returnTo, config, id);
      },

      forEach<TItem>(
        sourceAccessor: (ctx: ForEachContext<LDDTOf<C>>) => TItem[],
        columnFactory: (item: TItem, index: number, builder: ColumnBuilder<C, RT>) => void
      ) {
        assertTableDefinitionsUnlocked(config, 'table.columns.forEach');
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
        if (_isBuilt) {
          return col;
        }
        finishCurrentColumn();
        _isBuilt = true;
        return col;
      },
      _resetBuildState() {
        _isBuilt = false;
      }
    };

    const rendererBuilders: any[] = [];
    options.withRenderer = {
      fromComponent: (component: React.ComponentType<CellRendererProps<LDDTOf<C>, TValue>>) => {
        assertTableDefinitionsUnlocked(config, 'table.columns.withRenderer.fromComponent');
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
      assertTableDefinitionsUnlocked(config, 'table.columnBuilder.column');
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
      assertTableDefinitionsUnlocked(config, 'table.columnBuilder.computed');
      finishCurrentColumn();
      const newCol: TableColumnConfig<LDDTOf<C>, TValue> = {
        id,
        accessorFn: accessor,
      };
      return createColumnOptions(newCol);
    },

    columnGroup(id: string, header: string) {
      assertTableDefinitionsUnlocked(config, 'table.columnBuilder.columnGroup');
      finishCurrentColumn();
      config.columnGroups.push({ id, header, columns: [] });
      return createColumnGroupBuilder<C, RT>(returnTo, config, id);
    },

    forEach<TItem>(
      sourceAccessor: (ctx: ForEachContext<LDDTOf<C>>) => TItem[],
      columnFactory: (item: TItem, index: number, builder: ColumnBuilder<C, RT>) => void
    ) {
      assertTableDefinitionsUnlocked(config, 'table.columnBuilder.forEach');
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
      if (_isBuilt) {
        return config;
      }
      finishCurrentColumn();
      _isBuilt = true;
      return config;
    },
    _resetBuildState() {
      currentColumn = null;
      _isBuilt = false;
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
      assertTableDefinitionsUnlocked(config, 'table.columnGroup.finishCurrentColumn');
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
        assertTableDefinitionsUnlocked(config, 'table.columnGroup.withHeader');
        col.header = header;
        return options;
      },
      withHeaderFn(fn: (ctx: ColumnHeaderContext) => React.ReactNode): ColumnGroupColumnOptions<C, TValue, RT> {
        assertTableDefinitionsUnlocked(config, 'table.columnGroup.withHeaderFn');
        col.headerFn = fn;
        return options;
      },
      pinned(pin: ColumnPin): ColumnGroupColumnOptions<C, TValue, RT> {
        assertTableDefinitionsUnlocked(config, 'table.columnGroup.pinned');
        col.pin = pin;
        return options;
      },
      withWidth(width: number | 'auto'): ColumnGroupColumnOptions<C, TValue, RT> {
        assertTableDefinitionsUnlocked(config, 'table.columnGroup.withWidth');
        col.width = width;
        return options;
      },
      withMinWidth(width: number): ColumnGroupColumnOptions<C, TValue, RT> {
        assertTableDefinitionsUnlocked(config, 'table.columnGroup.withMinWidth');
        col.minWidth = width;
        return options;
      },
      withMaxWidth(width: number): ColumnGroupColumnOptions<C, TValue, RT> {
        assertTableDefinitionsUnlocked(config, 'table.columnGroup.withMaxWidth');
        col.maxWidth = width;
        return options;
      },
      sortable(enabled = true): ColumnGroupColumnOptions<C, TValue, RT> {
        assertTableDefinitionsUnlocked(config, 'table.columnGroup.sortable');
        col.sortable = enabled;
        return options;
      },
      filterable(enabled = true): ColumnGroupColumnOptions<C, TValue, RT> {
        assertTableDefinitionsUnlocked(config, 'table.columnGroup.filterable');
        col.filterable = enabled;
        return options;
      },
      editable(enabled = true): ColumnGroupColumnOptions<C, TValue, RT> {
        assertTableDefinitionsUnlocked(config, 'table.columnGroup.editable');
        col.editable = enabled;
        return options;
      },
      resizable(enabled = true): ColumnGroupColumnOptions<C, TValue, RT> {
        assertTableDefinitionsUnlocked(config, 'table.columnGroup.resizable');
        col.resizable = enabled;
        return options;
      },
      withAggregation(type: AggregationType, label?: string): ColumnGroupColumnOptions<C, TValue, RT> {
        assertTableDefinitionsUnlocked(config, 'table.columnGroup.withAggregation');
        col.aggregationType = type;
        col.aggregationLabel = label;
        return options;
      },
      withWeightedAverage(weightColumn: string): ColumnGroupColumnOptions<C, TValue, RT> {
        assertTableDefinitionsUnlocked(config, 'table.columnGroup.withWeightedAverage');
        col.aggregationType = 'weighted-average' as AggregationType;
        col.weightColumn = weightColumn as keyof DataOf<LDDTOf<C>>;
        return options;
      },
      withCustomAggregation(fn: (values: TValue[], rows: any[]) => TValue, label?: string): ColumnGroupColumnOptions<C, TValue, RT> {
        assertTableDefinitionsUnlocked(config, 'table.columnGroup.withCustomAggregation');
        col.aggregationType = 'custom' as AggregationType;
        col.customAggregation = fn;
        col.aggregationLabel = label;
        return options;
      },

      withRenderer: undefined as unknown as ColumnGroupColumnOptions<C, TValue, RT>['withRenderer'],

      withRangeStyle(style: RangeStyle, threshold?: number): ColumnGroupColumnOptions<C, TValue, RT> {
        assertTableDefinitionsUnlocked(config, 'table.columnGroup.withRangeStyle');
        col.rangeStyle = style;
        col.rangeThreshold = threshold;
        return options;
      },
      withCustomRangeStyle(fn: (value: TValue, min: TValue, max: TValue) => React.CSSProperties) {
        assertTableDefinitionsUnlocked(config, 'table.columnGroup.withCustomRangeStyle');
        col.rangeStyle = 'custom' as RangeStyle;
        col.customRangeStyle = fn;
        return options;
      },
      withFilterUI(component: React.ComponentType<FilterUIProps<TValue>>) {
        assertTableDefinitionsUnlocked(config, 'table.columnGroup.withFilterUI');
        col.filterUI = component;
        return options;
      },
      withCustomFilter(fn: (row: DataOf<LDDTOf<C>>, value: TValue, filterValue: any) => boolean) {
        assertTableDefinitionsUnlocked(config, 'table.columnGroup.withCustomFilter');
        col.filterFn = fn;
        return options;
      },
      withFooter(footer: string) {
        assertTableDefinitionsUnlocked(config, 'table.columnGroup.withFooter');
        col.footer = footer;
        return options;
      },
      withFooterFn(fn: (ctx: ColumnFooterContext<LDDTOf<C>, TValue>) => React.ReactNode) {
        assertTableDefinitionsUnlocked(config, 'table.columnGroup.withFooterFn');
        col.footerFn = fn;
        return options;
      },

      column<K extends keyof DataOf<LDDTOf<C>>>(accessor: (data: DataOf<LDDTOf<C>>) => DataOf<LDDTOf<C>>[K]) {
        assertTableDefinitionsUnlocked(config, 'table.columnGroup.column');
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
        assertTableDefinitionsUnlocked(config, 'table.columnGroup.computed');
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
      },
      _resetBuildState() {
        // handled by the parent builder
      }
    };

    const rendererBuilders: any[] = [];
    options.withRenderer = {
      fromComponent: (component: React.ComponentType<CellRendererProps<LDDTOf<C>, TValue>>): ColumnGroupColumnOptions<C, TValue, RT> => {
        assertTableDefinitionsUnlocked(config, 'table.columnGroup.withRenderer.fromComponent');
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
      assertTableDefinitionsUnlocked(config, 'table.columnGroupBuilder.column');
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
      assertTableDefinitionsUnlocked(config, 'table.columnGroupBuilder.computed');
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
    },
    _resetBuildState() {
      // handled by the parent builder
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
      assertTableDefinitionsUnlocked(config, 'table.filter.forColumn');
      const key = getAccessorKey(accessor);
      const col = config.columns.find(c => c.id === key);

      const filterOptions: FilterColumnOptions<C, DataOf<LDDTOf<C>>[K], RT> = {
        withUI(component) {
          assertTableDefinitionsUnlocked(config, 'table.filter.withUI');
          if (col) col.filterUI = component;
          return this;
        },

        withCustomFilter(fn) {
          assertTableDefinitionsUnlocked(config, 'table.filter.withCustomFilter');
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
        },
        _resetBuildState() {
          // handled by the parent builder
        }
      };

      return filterOptions;
    },

    globalSearch(columns) {
      assertTableDefinitionsUnlocked(config, 'table.filter.globalSearch');
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
    },
    _resetBuildState() {
      // handled by the parent builder
    }
  };
}
