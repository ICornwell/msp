import Typography from '@mui/material/Typography';

import { ReComponentCommonProps, ReComponentSystemProps } from '../../renderEngine/components/ReComponentProps.js';
import { createLeafComponent } from '../../renderEngine/components/ReComponentWrapper.js';

export type StatusLabelInputProps = {
  emptyText?: string;
};

export default function StatusLabelInput(
  props: StatusLabelInputProps & ReComponentCommonProps & ReComponentSystemProps,
) {
  const value = String(props.value ?? '').trim();
  const text = value || props.emptyText || '';

  return (
    <Typography variant="body2" color={props.error ? 'error.main' : 'text.secondary'}>
      {text}
    </Typography>
  );
}

export const StatusLabelComponent = createLeafComponent<StatusLabelInputProps>(
  StatusLabelInput,
  'StatusLabel',
);
