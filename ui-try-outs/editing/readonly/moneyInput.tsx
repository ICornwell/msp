// eslint-disable-next-line no-unused-vars
import { Typography } from "@mui/material";
import { ReComponentCommonProps, ReComponentSystemProps } from '../../../renderEngine/components/ReComponentProps';
import { createLeafEditableComponent, createLeafReadOnlyComponent } from '../../../renderEngine/components/ReComponentWrapper';
import LabelContainer from './labelContainer';
import { MoneyInputProps } from '../editing/moneyInput';

export default function MoneyReadOnly(props: MoneyInputProps & ReComponentCommonProps & ReComponentSystemProps) {
  const { value, decimalPlaces, currencySymbol = '$' } = props;
 
  const formattedValue = decimalPlaces !== undefined && !isNaN(Number(value))
    ? (Math.round((Number(value)) * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)).toFixed(decimalPlaces)
    : value;

  return (
    <LabelContainer {...props} component={
      <Typography>{currencySymbol}{formattedValue}</Typography>
    }
    />
  );
}

export const MoneyReadOnlyComponent = createLeafReadOnlyComponent<MoneyInputProps>(MoneyReadOnly, 'Money');
export const MoneyEditableComponent = createLeafEditableComponent<MoneyInputProps>(MoneyReadOnly, 'Money');