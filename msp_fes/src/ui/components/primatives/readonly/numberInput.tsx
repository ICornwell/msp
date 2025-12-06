// eslint-disable-next-line no-unused-vars
import { Typography } from "@mui/material";
import { ReComponentCommonProps, ReComponentSystemProps } from '../../../renderEngine/components/ReComponentProps';
import { createLeafEditableComponent, createLeafReadOnlyComponent } from '../../../renderEngine/components/ReComponentWrapper';
import LabelContainer from './labelContainer';
import { NumberInputProps } from '../editing/numberInput';

export default function NumberReadOnly(props: NumberInputProps & ReComponentCommonProps & ReComponentSystemProps) {
  const { value, decimalPlaces } = props;
 
  const formattedValue = decimalPlaces !== undefined && !isNaN(Number(value))
    ? (Math.round((Number(value)) * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)).toFixed(decimalPlaces)
    : value;

  return (
    <LabelContainer {...props} component={
      <Typography>{formattedValue}</Typography>
    }
    />
  );
}

export const NumberReadOnlyComponent = createLeafReadOnlyComponent<NumberInputProps>(NumberReadOnly, 'Number');
export const NumberEditableComponent = createLeafEditableComponent<NumberInputProps>(NumberReadOnly, 'Number');