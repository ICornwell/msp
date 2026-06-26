import { InputStrategy } from '../inputStrategies.js';
import type { ReactNode } from 'react';

export type ComplexSelectionCell = {
  columnName: string;
  value: unknown;
  renderAs?: unknown;
};

export type ComplexSelectionOption = {
  value: string;
  row: ComplexSelectionCell[];
  icon?: ReactNode;
};

export interface ComplexSelectionStrategyOptions {
  options: ComplexSelectionOption[];
  isMultiSelectAllowed?: boolean;
  showSelectAll?: boolean;
  showSelectNone?: boolean;
  applyFilterToColumns?: string[];
  multiSelectAsArray?: boolean;
  multiSelectAsDelimittedString?: string;
  width?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function createComplexSelectionStrategy(_options: ComplexSelectionStrategyOptions): InputStrategy<string | null> {
  // Scaffold only: complex table selection behavior will be implemented incrementally.
  return {
    formatter: {
      format: (value: unknown) => String(value ?? ''),
    },
    parser: {
      parse: (input: string) => ({ success: true, value: input || null }),
    },
  };
}
