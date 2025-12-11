import UniversalInput from "../core/UniversalInput";
import { ReComponentCommonProps, ReComponentSystemProps } from '../../../renderEngine/components/ReComponentProps';
import { createLeafComponent } from '../../../renderEngine/components/ReComponentWrapper';
import { createDateStrategy, DateStrategyOptions } from "../core";

export type PresetDateInputProps = DateStrategyOptions;

export default function PresetDateInput(props: PresetDateInputProps & ReComponentCommonProps & ReComponentSystemProps) {
  return (
    <UniversalInput
      label={props.label}
      value={props.value}
      error={props.error}
      testId={props.testId}
      helperText={props.helperText}
      disabled={props.disabled}
      events={props.events}
      strategy={createDateStrategy({
        includeTime: props.includeTime,
        defaultTime: props.defaultTime,
        timeZone: props.timeZone,
        dateFormat: props.dateFormat,
      })}
      dataType="date"
      displayMode="editing"
      hints={[]}
      forceReadonly={false}
      notes={props.notes}
    />
  );
}

export const PresetDateComponent = createLeafComponent<PresetDateInputProps>(PresetDateInput, 'PresetDate');
