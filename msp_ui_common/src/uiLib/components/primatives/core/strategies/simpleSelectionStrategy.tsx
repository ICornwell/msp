import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { InputStrategy, StrategyContext } from '../inputStrategies.js';

export type SimpleSelectionOptionInput =
  | string
  | { value: string; description: string; icon?: ReactNode };

type NormalizedSimpleOption = {
  value: string;
  description: string;
  icon?: ReactNode;
  isBlank?: boolean;
};

export interface SimpleSelectionStrategyOptions {
  options: SimpleSelectionOptionInput[];
  useStartsWithMatching?: boolean;
  showEmptyInList?: boolean;
  caseSensitive?: boolean;
  openOnComponentClick?: boolean;
}

function normalizeSimpleOptions(
  options: SimpleSelectionOptionInput[],
  showEmptyInList: boolean,
): NormalizedSimpleOption[] {
  const mapped = options.map((option) => {
    if (typeof option === 'string') {
      return { value: option, description: option };
    }
    return { value: option.value, description: option.description, icon: option.icon };
  });

  if (!showEmptyInList) {
    return mapped;
  }

  return [{ value: '', description: '--Blank--', isBlank: true }, ...mapped];
}

function normalizeForMatch(input: string, caseSensitive: boolean): string {
  return caseSensitive ? input : input.toLowerCase();
}

function pickBestMatch(
  input: string,
  options: NormalizedSimpleOption[],
  useStartsWithMatching: boolean,
  caseSensitive: boolean,
): NormalizedSimpleOption | undefined {
  const trimmed = input.trim();
  if (!trimmed) {
    return undefined;
  }

  const target = normalizeForMatch(trimmed, caseSensitive);

  const exact = options.find((option) => {
    const description = normalizeForMatch(option.description, caseSensitive);
    const value = normalizeForMatch(option.value, caseSensitive);
    return description === target || value === target;
  });

  if (exact) {
    return exact;
  }

  return options.find((option) => {
    const description = normalizeForMatch(option.description, caseSensitive);
    return useStartsWithMatching ? description.startsWith(target) : description.includes(target);
  });
}

function filterOptions(
  input: string,
  options: NormalizedSimpleOption[],
  useStartsWithMatching: boolean,
  caseSensitive: boolean,
): NormalizedSimpleOption[] {
  const trimmed = input.trim();
  if (!trimmed) {
    return options;
  }

  const normalizedTerm = normalizeForMatch(trimmed, caseSensitive);
  return options.filter((option) => {
    const description = normalizeForMatch(option.description, caseSensitive);
    return useStartsWithMatching ? description.startsWith(normalizedTerm) : description.includes(normalizedTerm);
  });
}

function renderWithHighlight(text: string, matchRaw: string, caseSensitive: boolean) {
  const match = matchRaw.trim();
  if (!match) {
    return text;
  }

  const haystack = normalizeForMatch(text, caseSensitive);
  const needle = normalizeForMatch(match, caseSensitive);
  const start = haystack.indexOf(needle);

  if (start < 0) {
    return text;
  }

  const end = start + match.length;
  return (
    <>
      {text.slice(0, start)}
      <strong>{text.slice(start, end)}</strong>
      {text.slice(end)}
    </>
  );
}

const SimpleSelectionAdornment = memo(function SimpleSelectionAdornment(props: {
  context: StrategyContext;
  options: NormalizedSimpleOption[];
  useStartsWithMatching: boolean;
  caseSensitive: boolean;
}) {
  const { context, options, useStartsWithMatching, caseSensitive } = props;
  const { onValueChange, strategyCommand, setStrategyState, setRawInput } = (context.metadata ?? {}) as any;

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [filterText, setFilterText] = useState('');
  const [lastFilterText, setLastFilterText] = useState('');
  const lastCommandSeqRef = useRef<number>(-1);
  const selectedOption = useMemo(() => {
    if (context.value === null || context.value === undefined || context.value === '') {
      return options.find((option) => option.isBlank);
    }
    return options.find((option) => option.value === String(context.value));
  }, [context.value, options]);
  const restoreText = selectedOption?.isBlank ? '' : (selectedOption?.description ?? '');

  const filtered = useMemo(() => {
    return filterOptions(filterText, options, useStartsWithMatching, caseSensitive);
  }, [filterText, options, useStartsWithMatching, caseSensitive]);

  const closePopup = () => {
    setOpen(false);
    setAnchorEl(null);
    setStrategyState?.((current: Record<string, unknown>) => ({ ...current, simpleSelectionOpen: false }));
  };

  const openPopup = (delta: number = 0) => {
    const inputAnchor = context.textInputRef?.current;
    const nextFilter = lastFilterText || '';
    const nextFiltered = filterOptions(nextFilter, options, useStartsWithMatching, caseSensitive);
    const selectedIndex = selectedOption
      ? nextFiltered.findIndex((option) => option.value === selectedOption.value)
      : -1;

    setAnchorEl(inputAnchor ?? null);
    setOpen(true);
    setStrategyState?.((current: Record<string, unknown>) => ({ ...current, simpleSelectionOpen: true }));
    setFilterText(nextFilter);
    setRawInput?.(nextFilter);
    setHighlightIndex((current) => {
      if (nextFiltered.length === 0) {
        return -1;
      }
      if (current < 0) {
        if (delta === 0 && selectedIndex >= 0) {
          return selectedIndex;
        }
        if (delta !== 0 && selectedIndex >= 0) {
          const movedIndex = selectedIndex + delta;
          if (movedIndex < 0) {
            return 0;
          }
          if (movedIndex >= nextFiltered.length) {
            return nextFiltered.length - 1;
          }
          return movedIndex;
        }
        return 0;
      }
      const candidate = current + delta;
      if (candidate < 0) {
        return 0;
      }
      if (candidate >= nextFiltered.length) {
        return nextFiltered.length - 1;
      }
      return candidate;
    });
  };

  const restoreSelection = () => {
    setFilterText('');
    setRawInput?.(restoreText);
    closePopup();
  };

  const commitSelection = () => {
    const selected = highlightIndex >= 0 && highlightIndex < filtered.length ? filtered[highlightIndex] : undefined;
    const fallback = selected ?? pickBestMatch(filterText, options, useStartsWithMatching, caseSensitive);
    const committedValue = fallback?.isBlank ? null : (fallback?.value ?? null);
    const committedText = fallback?.isBlank ? '' : (fallback?.description ?? '');
    onValueChange?.(committedValue);
    setRawInput?.(committedText);
    if (filterText.trim()) {
      setLastFilterText(filterText);
    }
    setFilterText(committedText);
    closePopup();
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    setFilterText(String(context.rawInput ?? ''));
    if (String(context.rawInput ?? '').trim()) {
      setLastFilterText(String(context.rawInput ?? ''));
    }
  }, [context.rawInput, open]);

  useEffect(() => {
    if (highlightIndex >= filtered.length) {
      setHighlightIndex(filtered.length > 0 ? filtered.length - 1 : -1);
    }
  }, [highlightIndex, filtered.length]);

  useEffect(() => {
    if (!strategyCommand || strategyCommand.seq === lastCommandSeqRef.current) {
      return;
    }
    lastCommandSeqRef.current = strategyCommand.seq;

    if (strategyCommand.name === 'simpleSelection.openAndMove') {
      const delta = Number(strategyCommand.payload?.delta ?? 1);
      openPopup(delta);
      return;
    }

    if (strategyCommand.name === 'simpleSelection.openPopup') {
      openPopup(0);
      return;
    }

    if (strategyCommand.name === 'simpleSelection.commitSelection') {
      commitSelection();
      return;
    }

    if (strategyCommand.name === 'simpleSelection.restoreSelection') {
      restoreSelection();
    }
  }, [
    strategyCommand,
    filtered,
    highlightIndex,
    options,
    useStartsWithMatching,
    caseSensitive,
  ]);

  return (
    <span style={{ display: 'flex', alignItems: 'center' }}>
      <ArrowDropDownIcon
        style={{ cursor: 'pointer', opacity: 0.9 }}
        onClick={(event) => {
          event.stopPropagation();
          openPopup(0);
        }}
        aria-label="Open selection list"
      />
      <Popper open={open} anchorEl={anchorEl} placement="bottom-start" style={{ zIndex: 1300 }}>
        <Paper elevation={3} sx={{ minWidth: 260, maxHeight: 320, overflow: 'auto' }}>
          <List dense>
            {filtered.map((option, index) => (
              <ListItemButton
                key={`${option.value}|${option.description}|${index}`}
                selected={index === highlightIndex}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setHighlightIndex(index)}
                onClick={() => {
                  onValueChange?.(option.isBlank ? null : option.value);
                  setRawInput?.(option.isBlank ? '' : option.description);
                  closePopup();
                }}
              >
                {option.icon ? <ListItemIcon>{option.icon}</ListItemIcon> : null}
                <ListItemText primary={renderWithHighlight(option.description, filterText, caseSensitive)} />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      </Popper>
    </span>
  );
});

export function createSimpleSelectionStrategy(
  options: SimpleSelectionStrategyOptions,
): InputStrategy<string | null> {
  const normalizedOptions = normalizeSimpleOptions(options.options ?? [], !!options.showEmptyInList);
  const useStartsWithMatching = options.useStartsWithMatching ?? true;
  const caseSensitive = options.caseSensitive ?? false;
  const openOnComponentClick = options.openOnComponentClick ?? true;

  return {
    formatter: {
      useFormatForEdit: true,
      format: (value: unknown) => {
        if (value === null || value === undefined || value === '') {
          return '';
        }
        const asString = String(value);
        const selected = normalizedOptions.find((option) => option.value === asString);
        return selected?.description ?? asString;
      },
    },
    parser: {
      parse: (input: string) => {
        const trimmed = input.trim();
        if (!trimmed) {
          return { success: true, value: null };
        }

        const selected = pickBestMatch(trimmed, normalizedOptions, useStartsWithMatching, caseSensitive);
        return { success: true, value: selected?.isBlank ? null : (selected?.value ?? null) };
      },
    },
    keyboard: {
      onKeyDown: (event: KeyboardEvent, ctx: StrategyContext) => {
        const strategyState = (ctx.metadata?.strategyState ?? {}) as Record<string, unknown>;
        const popupOpen = strategyState.simpleSelectionOpen === true;

        if (event.key === 'ArrowDown') {
          return {
            preventDefault: true,
            command: {
              name: 'simpleSelection.openAndMove',
              payload: { delta: 1 },
            },
          };
        }

        if (event.key === 'Tab') {
          return {
            command: {
              name: 'simpleSelection.commitSelection',
            },
          };
        }

        if (event.key === 'Escape' && popupOpen) {
          return {
            preventDefault: true,
            command: {
              name: 'simpleSelection.restoreSelection',
            },
          };
        }
      },
    },
    interaction: {
      onBlur: (ctx: StrategyContext) => {
        const strategyState = (ctx.metadata?.strategyState ?? {}) as Record<string, unknown>;
        if (strategyState.simpleSelectionOpen === true) {
          return {
            skipDefault: true,
            command: {
              name: 'simpleSelection.restoreSelection',
            },
          };
        }
      },
      onClick: (_event, ctx: StrategyContext) => {
        if (!openOnComponentClick) {
          return;
        }

        const strategyState = (ctx.metadata?.strategyState ?? {}) as Record<string, unknown>;
        if (strategyState.simpleSelectionOpen === true) {
          return;
        }

        return {
          command: {
            name: 'simpleSelection.openPopup',
          },
        };
      },
    },
    adornment: {
      getEndAdornment: (ctx) => (
        <SimpleSelectionAdornment
          context={ctx}
          options={normalizedOptions}
          useStartsWithMatching={useStartsWithMatching}
          caseSensitive={caseSensitive}
        />
      ),
    },
  };
}
