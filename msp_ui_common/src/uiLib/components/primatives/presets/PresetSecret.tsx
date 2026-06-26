import { useEffect, useMemo, useState } from 'react';

import UniversalInput from '../core/UniversalInput.js';
import { createSecretStrategy, DEFAULT_REDACTED_SECRET_VALUE } from '../core/strategies/secretStrategy.js';
import { ReComponentCommonProps, ReComponentSystemProps } from '../../../renderEngine/components/ReComponentProps.js';
import { createLeafComponent } from '../../../renderEngine/components/ReComponentWrapper.js';

export const REDACTED_SECRET_VALUE = DEFAULT_REDACTED_SECRET_VALUE;

export type PresetSecretInputProps = {
  redactedValue?: string;
};

function getInitialVisibleMode(_value: string, _isRedacted: boolean): boolean {
  return false;
}

export default function PresetSecretInput(
  props: PresetSecretInputProps & ReComponentCommonProps & ReComponentSystemProps,
) {
  const redactedValue = props.redactedValue ?? REDACTED_SECRET_VALUE;
  const value = String(props.value ?? '');
  const isRedacted = value === redactedValue;
  const canToggleVisibility = !isRedacted;

  const [isVisible, setIsVisible] = useState<boolean>(getInitialVisibleMode(value, isRedacted));

  useEffect(() => {
    setIsVisible(getInitialVisibleMode(value, isRedacted));
  }, [value, isRedacted]);

  const strategy = useMemo(
    () => createSecretStrategy({
      isVisible,
      redactedValue,
      canToggleVisibility,
      onToggleVisibility: () => { let newVis = !isVisible; setIsVisible(() => newVis); return newVis; },
      onBlur: (_val, _ctx) => {
        setIsVisible(false);
      }
    }),
    [isVisible, redactedValue, canToggleVisibility],
  );

  return (
    <UniversalInput
      label={props.label}
      value={props.value}
      error={props.error}
      testId={props.testId}
      helperText={props.helperText}
      disabled={props.disabled}
      events={props.events}
      strategy={strategy}
      dataType="text"
      displayMode="editing"
      hints={[]}
      forceReadonly={props.displayMode === 'readonly'}
      notes={props.notes}
    />
  );
}

export const PresetSecretComponent = createLeafComponent<PresetSecretInputProps>(
  PresetSecretInput,
  'PresetSecret',
);
