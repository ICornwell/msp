// eslint-disable-next-line no-unused-vars
import { Typography } from "@mui/material";
import { ReComponentCommonProps, ReComponentSystemProps } from '../../../renderEngine/components/ReComponentProps';
import { createLeafEditableComponent, createLeafReadOnlyComponent } from '../../../renderEngine/components/ReComponentWrapper';
import LabelContainer from './labelContainer';
import { CheckboxInputProps } from '../editing/checkboxInput';

export default function CheckboxReadOnly(props: CheckboxInputProps & ReComponentCommonProps & ReComponentSystemProps) {
  const { value, textRepresentation = {true: "Yes", false: "No", undefined: "Not set"} } = props;
 
  return (
    <LabelContainer {...props} component={
      <Typography>{textRepresentation[value as keyof typeof textRepresentation]}</Typography>
    }
    />
  );
}

export const CheckboxReadOnlyComponent = createLeafReadOnlyComponent<CheckboxInputProps>(CheckboxReadOnly, 'Checkbox');
export const CheckboxEditableComponent = createLeafEditableComponent<CheckboxInputProps>(CheckboxReadOnly, 'Checkbox');