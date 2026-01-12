// eslint-disable-next-line no-unused-vars

import UniversalInput from "../core/UniversalInput.js";

import { ReComponentCommonProps, ReComponentSystemProps } from '../../../renderEngine/components/ReComponentProps';
import { createLeafComponent } from '../../../renderEngine/components/ReComponentWrapper.js';

import { createNumberStrategy } from '../core/strategies/numberStrategy.js';
import { expressionParsers } from "../core/index.js";

export type PresetNumberInputProps = {
  decimalPlaces?: number;
}  ;

export default function PresetNumberInput(props: PresetNumberInputProps & ReComponentCommonProps & ReComponentSystemProps) {

  return (
    <UniversalInput
    label = {props.label}
    value = {props.value}
    error = {props.error}
     
    testId = {props.testId} 
    helperText= {props.helperText}
    disabled= {props.disabled}
    events = {props.events}
    strategy = {createNumberStrategy({
      decimalPlaces: props.decimalPlaces ?? 2,
      thousandsSeparator: true,
      expressionParser: expressionParsers.get('math')
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

export const PresetNumberComponent = createLeafComponent<PresetNumberInputProps>(PresetNumberInput, 'PresetNumber');