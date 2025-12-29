// eslint-disable-next-line no-unused-vars
import { Typography } from "@mui/material";
import { ReComponentCommonProps, ReComponentSystemProps } from '../../../renderEngine/components/ReComponentProps';
import { createLeafEditableComponent, createLeafReadOnlyComponent } from '../../../renderEngine/components/ReComponentWrapper';
import LabelContainer from './labelContainer';
import { TextInputProps } from '../editing/textInput';

export default function TextReadOnly(props: TextInputProps & ReComponentCommonProps & ReComponentSystemProps) {
  const { value } = props;
 
  return (
    <LabelContainer {...props} component={
      <Typography>{value}</Typography>
    }
    />
  );
}

export const TextReadOnlyComponent = createLeafReadOnlyComponent<TextInputProps>(TextReadOnly, 'Text');
export const TextEditableComponent = createLeafEditableComponent<TextInputProps>(TextReadOnly, 'Text');