import UniversalInput from '../core/UniversalInput.js';
import { ReComponentCommonProps, ReComponentSystemProps } from '../../../renderEngine/components/ReComponentProps.js';
import { createLeafComponent } from '../../../renderEngine/components/ReComponentWrapper.js';
import {
  createComplexSelectionStrategy,
  createSimpleSelectionStrategy,
  ComplexSelectionOption,
  SimpleSelectionOptionInput,
} from '../core/strategies/index.js';

export type PresetSelectInputProps = {
  strategyType?: 'simpleSelection' | 'complexSelection';
  options?: SimpleSelectionOptionInput[];
  useStartsWithMatching?: boolean;
  showEmptyInList?: boolean;
  caseSensitive?: boolean;
  openOnComponentClick?: boolean;
  complexOptions?: ComplexSelectionOption[];
  isMultiSelectAllowed?: boolean;
  showSelectAll?: boolean;
  showSelectNone?: boolean;
  applyFilterToColumns?: string[];
  multiSelectAsArray?: boolean;
  multiSelectAsDelimittedString?: string;
  width?: 1 | 2 | 3 | 4 | 5 | 6;
};

export default function PresetSelectInput(props: PresetSelectInputProps & ReComponentCommonProps & ReComponentSystemProps) {
  const strategy = props.strategyType === 'complexSelection'
    ? createComplexSelectionStrategy({
        options: props.complexOptions ?? [],
        isMultiSelectAllowed: props.isMultiSelectAllowed,
        showSelectAll: props.showSelectAll,
        showSelectNone: props.showSelectNone,
        applyFilterToColumns: props.applyFilterToColumns,
        multiSelectAsArray: props.multiSelectAsArray,
        multiSelectAsDelimittedString: props.multiSelectAsDelimittedString,
        width: props.width,
      })
    : createSimpleSelectionStrategy({
        options: props.options ?? [],
        useStartsWithMatching: props.useStartsWithMatching,
        showEmptyInList: props.showEmptyInList,
        caseSensitive: props.caseSensitive,
        openOnComponentClick: props.openOnComponentClick,
      });

  return (
    <UniversalInput
      label={props.label}
      value={props.value}
      error={props.error}
      testId={props.testId}
      helperText={props.helperText}
      disabled={props.disabled}
      events={props.events}
      strategy={strategy}
      dataType="select"
      displayMode="editing"
      hints={[]}
      forceReadonly={false}
      notes={props.notes}
    />
  );
}

export const PresetSelectComponent = createLeafComponent<PresetSelectInputProps>(PresetSelectInput, 'PresetSelect');
