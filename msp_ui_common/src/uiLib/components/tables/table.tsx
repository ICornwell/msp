import React from 'react';
import { FluxorData } from 'msp_common';

import { createExtendedComponent } from '../../renderEngine/components/ReComponentWrapper.js';
import {
  CNTX,
  DataOf,
  FluentExtension,
  FluentSimple,
  FluentSubBuilder,
  LDDTOf,
} from '../../renderEngine/UiPlan/ReUiPlanBuilder.js';

import Table from './tableRuntime.js';
import { createColumnBuilder, createFilterBuilder } from './tableFluentBuilders.js';
import type {
  ColumnBuilder,
  FilterBuilder,
  TableConfig,
  TableExtension,
  TableOrientation,
} from './tableTypes.js';

export * from './tableTypes.js';

export function extendWithTable<C extends CNTX, RT>(
  returnTo: RT,
  builder: any,
  _contextPlaceHolder: C
): TableExtension<C, RT> {
  const config: TableConfig<LDDTOf<C>> = {
    orientation: 'rows-horizontal',
    columns: [],
    columnGroups: [],
  };

  const extension: FluentExtension = {
    forDataType<_T extends FluxorData<any>>(): FluentSimple {
      return returnTo as FluentSimple;
    },

    withOrientation(orientation: TableOrientation): FluentSimple {
      config.orientation = orientation;
      return builder as FluentSimple;
    },

    withVirtualization(rowHeight: number, overscan: number = 5): FluentSimple {
      config.virtualization = { enabled: true, rowHeight, overscan };
      return builder as FluentSimple;
    },

    withColumns(): FluentSubBuilder<ColumnBuilder<C, FluentSimple>> {
      return createColumnBuilder<C, FluentSimple>(
        builder as FluentSimple,
        config,
        null
      ) as unknown as FluentSubBuilder<ColumnBuilder<C, FluentSimple>>;
    },

    withColumnsFromSchema(selector?: (data: DataOf<LDDTOf<C>>) => (keyof DataOf<LDDTOf<C>>)[]): FluentSimple {
      (config as any).useSchemaColumns = true;
      (config as any).schemaSelector = selector;
      return builder as FluentSimple;
    },

    withFiltering(): FluentSubBuilder<FilterBuilder<C, FluentSimple>> {
      config.enableFiltering = true;
      return createFilterBuilder<C, FluentSimple>(
        builder as FluentSimple,
        config
      ) as unknown as FluentSubBuilder<FilterBuilder<C, FluentSimple>>;
    },

    enableSorting(enabled: boolean = true): FluentSimple {
      config.enableSorting = enabled;
      return builder as FluentSimple;
    },

    enableFiltering(enabled: boolean = true): FluentSimple {
      config.enableFiltering = enabled;
      return builder as FluentSimple;
    },

    enableColumnResizing(enabled: boolean = true): FluentSimple {
      config.enableColumnResizing = enabled;
      return builder as FluentSimple;
    },

    enableRowSelection(enabled: boolean = true): FluentSimple {
      config.enableRowSelection = enabled;
      return builder as FluentSimple;
    },

    _buildExtension: (_buildConfig: any, extendedElement: any) => {
      extendedElement.componentProps = {
        ...extendedElement.componentProps,
        tableConfig: config,
      };
    }
  };

  return extension as TableExtension<C, RT>;
}

export default Table;

type FEC = <C extends CNTX, RT, BLD>(returnTo: RT, builder: BLD, contextPlaceHolder: C) => TableExtension<C, RT>;

export const TableComponent = createExtendedComponent<
  React.ComponentProps<typeof Table>,
  FEC>(Table, 'Table', extendWithTable as FEC);

// NB. compiler warnings/errors relating to generic typing of 'extendWithTable'
// are due to other errors breaking inference - the code is usually correct.
// fix all other errors in this file, and all other fluent extension factories,
// before attempting to address generic typing issues with the extension functions.
// sometimes they can take a while to resolve even after the underlying issues are fixed.
