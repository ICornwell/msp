import IconButton from '@mui/material/IconButton';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { useUiEventPublisher } from '../../contexts/UiEventContext.js';
import { NavigationEvents } from '../../events/uiNavEventMsgTypes.js';
import { ReComponentCommonProps, ReComponentSystemProps } from '../../renderEngine/components/ReComponentProps.js';
import { createLeafComponent } from '../../renderEngine/components/ReComponentWrapper.js';

export type ClickableIconProps = {
  icon?: React.ElementType;
  eventMsgAction: string;
  eventMsgContext?: Record<string, any> | ((record: any) => Record<string, any>);
  includeRecordInContext?: boolean;
  title?: string;
  size?: 'small' | 'medium' | 'large';
} & ReComponentCommonProps & ReComponentSystemProps;

export default function ClickableIcon(props: ClickableIconProps) {
  const { raiseUiEvent } = useUiEventPublisher<any>();
  const Icon = props.icon ?? DeleteOutlineIcon;

  const handleClick = () => {
    const dynamicContext = typeof props.eventMsgContext === 'function'
      ? props.eventMsgContext(props.record)
      : (props.eventMsgContext ?? {});

    const context = props.includeRecordInContext
      ? {
          ...dynamicContext,
          ...(props.record ?? {}),
        }
      : dynamicContext;

    raiseUiEvent({
      messageType: NavigationEvents.ITEM_CLICK,
      payload: {
        viewDataIdentifier: context?.viewDataIdentifier ?? '__unknown__',
        viewDataContent: props.record,
        action: props.eventMsgAction,
        context,
      },
      timestamp: Date.now(),
    });
  };

  return (
    <IconButton
      size={props.size ?? 'small'}
      disabled={props.disabled}
      onClick={handleClick}
      title={props.title ?? props.label ?? props.eventMsgAction}
      data-testid={props.testId}
    >
      <Icon fontSize="small" />
    </IconButton>
  );
}

export const ClickableIconComponent = createLeafComponent<ClickableIconProps>(
  ClickableIcon,
  'ClickableIcon',
);
