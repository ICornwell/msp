// eslint-disable-next-line no-unused-vars

import UniversalInput from "../core/UniversalInput";

import { ReComponentCommonProps, ReComponentSystemProps } from '../../../renderEngine/components/ReComponentProps';
import { createLeafComponent } from '../../../renderEngine/components/ReComponentWrapper';

import { createBooleanStrategy } from "../core";

export type PresetBooleanInputProps = {
  textRepresentation?: { true: string; false: string; undefined: string };
}  ;

export default function PresetBooleanInput(props: PresetBooleanInputProps & ReComponentCommonProps & ReComponentSystemProps) {

  return (
    <UniversalInput
    label = {props.label}
    value = {props.value}
    error = {props.error}
     
    testId = {props.testId} 
    helperText= {props.helperText}
    disabled= {props.disabled}
    events = {props.events}
    strategy = {createBooleanStrategy({
      labels: {
        true: props.textRepresentation?.true ?? 'True',
        false: props.textRepresentation?.false ?? 'False',
        undefined: props.textRepresentation?.undefined ?? 'Undefined',
      },
      controlType: 'checkbox',
    })}
    dataType = 'text'
    displayMode = 'editing'
    hints = {[]}
    // strategyKey: providedKey,
    forceReadonly = {false}
    notes = {props.notes}
    />
  );
}

export const PresetBooleanComponent = createLeafComponent<PresetBooleanInputProps>(PresetBooleanInput, 'PresetBoolean');