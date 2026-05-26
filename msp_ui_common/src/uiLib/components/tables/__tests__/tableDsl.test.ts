import { describe, expect, it, vi } from 'vitest';
import { extendWithTable } from '../table.js';

function buildTableConfig(configure: (extension: any) => void) {
  const returnTo = {};
  const builder = {};
  const extension = extendWithTable(returnTo, builder, {} as any) as any;

  configure(extension);

  const extendedElement = { componentProps: {} as Record<string, unknown> };
  extension._buildExtension({}, extendedElement);
  return (extendedElement.componentProps as { tableConfig: any }).tableConfig;
}

describe('table fluent DSL', () => {
  it('builds base table configuration with column options', () => {
    const config = buildTableConfig((extension) => {
      extension.withOrientation('rows-vertical');
      extension.withVirtualization(42, 9);
      extension.enableSorting(true);
      extension.enableColumnResizing(true);

      extension.withColumns()
        .column((row: { name: string }) => row.name)
        .withHeader('Display Name')
        .sortable(true)
        .resizable(true)
        .endColumns;
    });

    expect(config.orientation).toBe('rows-vertical');
    expect(config.virtualization).toEqual({ enabled: true, rowHeight: 42, overscan: 9 });
    expect(config.enableSorting).toBe(true);
    expect(config.enableColumnResizing).toBe(true);
    expect(config.columns).toHaveLength(1);
    expect(config.columns[0].id).toBe('name');
    expect(config.columns[0].header).toBe('Display Name');
    expect(config.columns[0].sortable).toBe(true);
    expect(config.columns[0].resizable).toBe(true);
  });

  it('builds grouped columns and links members by id', () => {
    const config = buildTableConfig((extension) => {
      extension.withColumns()
        .columnGroup('person', 'Person')
        .column((row: { age: number }) => row.age)
        .withHeader('Age')
        .endGroup
        .endColumns;
    });

    expect(config.columnGroups).toHaveLength(1);
    expect(config.columnGroups[0]).toEqual({ id: 'person', header: 'Person', columns: ['age'] });
    expect(config.columns).toHaveLength(1);
    expect(config.columns[0].id).toBe('age');
    expect(config.columns[0].groupId).toBe('person');
  });

  it('enables schema mode and attaches filtering for an existing column', () => {
    const schemaSelector = vi.fn((_data: { name: string }) => ['name' as const]);
    const customFilter = vi.fn(() => true);

    const config = buildTableConfig((extension) => {
      extension.withColumns()
        .column((row: { name: string }) => row.name)
        .endColumns;

      extension.withColumnsFromSchema(schemaSelector);
      extension.withFiltering()
        .forColumn((row: { name: string }) => row.name)
        .withCustomFilter(customFilter)
        .endFiltering;
    });

    expect(config.useSchemaColumns).toBe(true);
    expect(config.schemaSelector).toBe(schemaSelector);
    expect(config.enableFiltering).toBe(true);
    expect(config.columns[0].filterFn).toBe(customFilter);
  });
});
