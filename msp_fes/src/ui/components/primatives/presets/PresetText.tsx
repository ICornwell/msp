// eslint-disable-next-line no-unused-vars

import UniversalInput from "../core/UniversalInput.js";

import { ReComponentCommonProps, ReComponentSystemProps } from '../../../renderEngine/components/ReComponentProps';
import { createLeafComponent } from '../../../renderEngine/components/ReComponentWrapper.js';

export type PresetTextInputProps = {
  type?: string;
  textVariant?: string
  
}  ;

export default function PresetTextInput(props: PresetTextInputProps & ReComponentCommonProps & ReComponentSystemProps) {

  return (
    <UniversalInput
    label = {props.label}
    value = {props.value}
    error = {props.error}
     
    testId = {props.testId} 
    helperText= {props.helperText}
    disabled= {props.disabled}
    events = {props.events}
    //strategy = resolvedStrategy
    dataType = 'text'
    displayMode = 'editing'
    hints = {[]}
    // strategyKey: providedKey,
    forceReadonly = {false}
    notes = {props.notes}
    />
  );
}

export const PresetTextComponent = createLeafComponent<PresetTextInputProps>(PresetTextInput, 'PresetText');