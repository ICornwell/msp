import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, DateTimePicker, DateCalendar, MultiSectionDigitalClock } from '@mui/x-date-pickers';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { Button, Container, Popper, Stack, styled } from '@mui/material';
import { useState, memo } from 'react';
import { InputStrategy, StrategyContext } from '../inputStrategies';
import { format, parse, isValid } from 'date-fns';
// Calendar adornment as a React component
const DateAdornment = memo(function DateAdornment(props: {
  context: StrategyContext;
  includeTime: boolean;
  timeZone?: string;
}) {
  const { context, includeTime, timeZone } = props;
  const { onValueChange } = context.metadata as any
  const [anchorEl, setAnchorEl] = useState<null | SVGSVGElement>(null);
  const [open, setOpen] = useState(false);
  const value = new Date(Date.parse((context.value as string) || '')) as Date | null;



  function onOpenClick(event: React.MouseEvent<SVGSVGElement>) {
    setAnchorEl(anchorEl ? null : event.currentTarget);
    setOpen(true);
  }

  const SolidContainer = styled(Container)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.shadows[3],
    padding: theme.spacing(2),
  }));

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <span style={{ display: 'flex', alignItems: 'center' }}>
        <CalendarTodayIcon
          style={{ cursor: 'pointer', opacity: 0.9 }}
          onClick={(event) => onOpenClick(event)}
          aria-label={includeTime ? 'Open date and time picker' : 'Open date picker'}
        />
        <Popper open={open} anchorEl={anchorEl} placement="bottom-start" style={{ zIndex: 1300 }}>
          <SolidContainer >
          <Stack spacing={2} direction='row' >
            <DateCalendar

              value={value}
              onChange={(date) => {
                setOpen(false);
                setAnchorEl(null);
                onValueChange?.((date?.toISOString()) || null);
              }}
              //renderInput={({ inputRef, inputProps, InputProps }) => null}
              timezone={timeZone}
            />
            {(includeTime) ?
              <MultiSectionDigitalClock
                value={value}
                onChange={(date) => {
                  setOpen(false);
                  setAnchorEl(null);
                  // onValueChange(date as Date | null);
                }}
                timezone={timeZone}
                ampm={true}
              />
              : null}
          </Stack>
          <div style={{ display: "flex" }}>
            <Button
              style={{ marginLeft: "auto" }}
              onClick={() => {
                setOpen(false);
                setAnchorEl(null);
              }}
            >Close</Button>
          </div>
          </SolidContainer>
        </Popper>

      </span>
    </LocalizationProvider>
  );
});

export interface DateStrategyOptions {
  includeTime?: boolean;
  defaultTime?: string; // e.g. '09:00'
  timeZone?: string; // e.g. 'Europe/London'
  dateFormat?: string; // e.g. 'yyyy-MM-dd' or 'yyyy-MM-dd HH:mm'
}

export function createDateStrategy(options: DateStrategyOptions = {}): InputStrategy<string | null> {
  const {
    includeTime = false,
    // defaultTime = '00:00',
    timeZone,
    dateFormat = includeTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy',
  } = options;

  return {
    formatter: {
      useFormatForEdit: true,
      format: (value: unknown, _ctx: StrategyContext) => {
        const dateValue = new Date(Date.parse((value as string) || ''));
        if (!dateValue || !isValid(dateValue)) return '';
        return format(dateValue, dateFormat);
      },
      // getA11yProps: (value: Date | null) => ({
      //   'aria-label': includeTime ? 'Date and time input' : 'Date input',
      // }),
    },
    parser: {
      parse: (input: string) => {
        if (!input) return { success: true, value: null, rawInput: input };
        const parsed = parse(input, dateFormat, new Date());
        if (isValid(parsed)) {
          return { success: true, value: parsed.toISOString(), rawInput: input };
        }
        return { success: false, value: null, rawInput: input, error: 'Invalid date' };
      },

    },
    adornment: {
      getEndAdornment(ctx) {
        return <DateAdornment context={ctx} includeTime={includeTime} timeZone={timeZone} />;
      },
      // getA11yProps: () => ({
      //   'aria-label': includeTime ? 'Date and time picker' : 'Date picker',
      //   role: 'button',
      // }),
    },


  };
}
