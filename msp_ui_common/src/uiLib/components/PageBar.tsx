import React from 'react';
import Tabs from '@mui/material/Tabs';
import MuiTab from '@mui/material/Tab';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import { usePresentationCurrentTab } from '../contexts/PresentationDispatchContext.js';

// ── Styled pieces ──────────────────────────────────────────────────────────────

const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderRight: `1px solid ${theme.palette.divider}`,
  minWidth: 48,
  width: 48,
  flexShrink: 0,
  '& .MuiTabs-indicator': {
    left: 0,
    right: 'auto',
    width: 3,
    borderRadius: '0 2px 2px 0',
    backgroundColor: theme.palette.primary.main,
  },
}));

const StyledTab = styled(MuiTab)(({ theme }) => ({
  minWidth: 48,
  width: 48,
  minHeight: 48,
  padding: 0,
  color: theme.palette.text.secondary,
  transition: 'color 0.15s ease, background-color 0.15s ease',
  '&:hover': {
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.action.hover,
  },
  '&&.Mui-selected': {
    color: theme.palette.primary.main,
  },
}));

// ── Component ──────────────────────────────────────────────────────────────────

interface PageBarProps {
  /** If omitted, reads from PresentationDispatchContext (standard shell usage). */
  pages?: Array<{ id: string; title: string; icon?: React.ReactNode; isActive?: boolean }>;
  activePageId?: string;
  onPageChange?: (pageId: string) => void;
}

export function PageBar({ pages: pagesProp, activePageId: activePageIdProp, onPageChange }: PageBarProps) {
  const { tab, currentPage, activatePage } = usePresentationCurrentTab();

  const pages  = pagesProp  ?? tab?.pages ?? [];
  const active = activePageIdProp ?? currentPage?.id ?? pages.find(p => p.isActive)?.id ?? false;

  if (pages.length === 0) return null;

  const handleChange = (_: React.SyntheticEvent, pageId: string) => {
    onPageChange ? onPageChange(pageId) : activatePage?.(pageId);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <StyledTabs
        orientation="vertical"
        value={active}
        onChange={handleChange}
        aria-label="Page navigation"
      >
        {pages.map(page => (
          <Tooltip key={page.id} title={page.title} placement="right" arrow>
            {/* span needed so Tooltip can attach to a focusable element */}
            <StyledTab
              value={page.id}
              icon={page.icon as React.ReactElement | undefined}
              aria-label={page.title}
            />
          </Tooltip>
        ))}
      </StyledTabs>
    </Box>
  );
}

export default PageBar;
