// eslint-disable-next-line no-unused-vars
import { FormControlLabel, FormHelperText } from "@mui/material";
import { ReComponentCommonProps, ReComponentSystemProps } from '../../../renderEngine/components/ReComponentProps';

export type LabelContainerProps = {
  component: React.ReactElement;
}

export default function LabelContainer(props: LabelContainerProps & ReComponentCommonProps & ReComponentSystemProps) {
  const { label, labelPosition, helperText, component } = props;
  
  return (
    <>
          <FormHelperText>{helperText as string}</FormHelperText>
          <FormControlLabel 
            control={component} labelPlacement={labelPosition} label={label as string} />
        </>
  );
}

