import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Box from '@mui/material/Box';

import { ReComponentCommonProps, ReComponentSystemProps } from '../../renderEngine/components/ReComponentProps.js';
import { createLeafComponent } from '../../renderEngine/components/ReComponentWrapper.js';

export type StatusIconInputProps = {
  successValue?: string;
  failureValue?: string;
};

export default function StatusIconInput(
  props: StatusIconInputProps & ReComponentCommonProps & ReComponentSystemProps,
) {
  const successValue = (props.successValue ?? 'success').toLowerCase();
  const failureValue = (props.failureValue ?? 'failed').toLowerCase();
  const normalizedValue = String(props.value ?? '').toLowerCase();

  const isSuccess = normalizedValue === successValue;
  const isFailed = normalizedValue === failureValue;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 40 }}>
      {isSuccess ? (
        <CheckCircleOutlineIcon color="success" fontSize="small" />
      ) : isFailed ? (
        <HighlightOffIcon color="error" fontSize="small" />
      ) : (
        <HelpOutlineIcon color="disabled" fontSize="small" />
      )}
    </Box>
  );
}

export const StatusIconComponent = createLeafComponent<StatusIconInputProps>(
  StatusIconInput,
  'StatusIcon',
);
