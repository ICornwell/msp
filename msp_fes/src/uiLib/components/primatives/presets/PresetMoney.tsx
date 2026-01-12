// eslint-disable-next-line no-unused-vars

import UniversalInput from "../core/UniversalInput.js";

import { ReComponentCommonProps, ReComponentSystemProps } from '../../../renderEngine/components/ReComponentProps.js';
import { createLeafComponent } from '../../../renderEngine/components/ReComponentWrapper.js';

import { createMoneyStrategy, expressionParsers } from "../core/index.js";

export type PresetMoneyInputProps = {
    decimalPlaces?: number;
  currencySymbol?: string;
}  ;

export default function PresetMoneyInput(props: PresetMoneyInputProps & ReComponentCommonProps & ReComponentSystemProps) {

  return (
    <UniversalInput
    label = {props.label}
    value = {props.value}
    error = {props.error}
     
    testId = {props.testId} 
    helperText= {props.helperText}
    disabled= {props.disabled}
    events = {props.events}
    strategy = {createMoneyStrategy({
      decimalPlaces: props.decimalPlaces ?? 2,
      thousandsSeparator: true,
      expressionParser: expressionParsers.get('math'),
      currencySymbol: props.currencySymbol ?? '$'
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

export const PresetMoneyComponent = createLeafComponent<PresetMoneyInputProps>(PresetMoneyInput, 'PresetMoney');