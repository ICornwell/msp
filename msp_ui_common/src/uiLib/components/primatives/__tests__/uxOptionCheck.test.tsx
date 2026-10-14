/* @vitest-environment happy-dom */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import PresetUxOptionCheckInput from '../presets/PresetUxOptionCheck.js';

vi.mock('../../../contexts/UiEventContext.js', () => ({
  useUiEventPublisher: () => ({ raiseUiEvent: () => undefined }),
}));

describe('PresetUxOptionCheckInput', () => {
  test('commits boolean values immediately and follows controlled value updates', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <PresetUxOptionCheckInput
        label="Show optional panel"
        value={false}
        events={{ onChange }}
      />,
    );

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(screen.getByText('Show optional panel'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(checkbox.checked).toBe(true);

    rerender(
      <PresetUxOptionCheckInput
        label="Show optional panel"
        value={true}
        events={{ onChange }}
      />
    );
    expect(checkbox.checked).toBe(true);

    fireEvent.click(screen.getByText('Show optional panel'));
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith(false);
    expect(checkbox.checked).toBe(false);
  });

  test('does not commit while disabled', () => {
    const onChange = vi.fn();
    render(
      <PresetUxOptionCheckInput
        label="Show optional panel"
        value={false}
        disabled
        events={{ onChange }}
      />,
    );

    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});