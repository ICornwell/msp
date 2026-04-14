// eslint-disable-next-line no-unused-vars

import UniversalInput from "../core/UniversalInput.js";

import { ReComponentCommonProps, ReComponentSystemProps } from '../../../renderEngine/components/ReComponentProps.js';
import { createLeafComponent } from '../../../renderEngine/components/ReComponentWrapper.js';
import { getLinkClickStrategy } from "../core/index.js";
export type PresetLinkInputProps = {
  linkName?: string;
  textVariant?: string
  
}  ;

export default function PresetLinkInput(props: PresetLinkInputProps & ReComponentCommonProps & ReComponentSystemProps) {

  return (
    <UniversalInput
    label = {props.label}
    value = {props.value}
    error = {props.error}
     
    testId = {props.testId} 
    helperText= {props.helperText}
    disabled= {props.disabled}
    events = {props.events}
    //TODO: componentProps should have been mapped into props
    strategy = {getLinkClickStrategy((props as any).componentProps.linkName ?? 'unknown-link')}
    dataType = 'text'
    displayMode = 'readonly'
    hints = {[]}
    // strategyKey: providedKey,
    forceReadonly = {true}
    notes = {props.notes}
    />
  );
}

export const PresetLinkComponent = createLeafComponent<PresetLinkInputProps>(PresetLinkInput, 'PresetLink');