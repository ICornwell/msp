import Button from '@mui/material/Button';

import { useUiEventPublisher } from '../../contexts/UiEventContext.js';
import { NavigationEvents } from '../../events/uiNavEventMsgTypes.js';
import { ReComponentCommonProps, ReComponentSystemProps } from '../../renderEngine/components/ReComponentProps.js';
import { createLeafComponent } from '../../renderEngine/components/ReComponentWrapper.js';
import { UiNavigationEvent } from '../../events/uiEvents.js';

export type BasicButtonProps = {
  internalName: string;
  size?: 'small' | 'medium' | 'large';
  context?: Record<string, any>;
  includeRecordInContext?: boolean;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
} & ReComponentCommonProps & ReComponentSystemProps ;

export default function BasicButton(
  props: BasicButtonProps,
) {
  const { raiseUiEvent } = useUiEventPublisher<UiNavigationEvent>();

  const handleClick = () => {
    const context = props.includeRecordInContext
      ? {
          ...(props.context ?? {}),
          ...(props.record ?? {}),
        }
      : props.context;

    raiseUiEvent({
      messageType: NavigationEvents.ITEM_CLICK,
      payload: {
        viewDataIdentifier: '__unknown__',
        viewDataContent: props.record,
        action: props.internalName,
        context,
      },
      timestamp: Date.now(),
    });
  };

  return (
    <Button
      disabled={props.disabled}
      onClick={handleClick}
      size={props.size ?? 'medium'}
      variant={props.variant ?? 'contained'}
      color={props.color ?? 'primary'}
      data-testid={props.testId}
    >
      {props.label ?? props.internalName}
    </Button>
  );
}

export const BasicButtonComponent = createLeafComponent<BasicButtonProps>(
  BasicButton,
  'BasicButton',
);
