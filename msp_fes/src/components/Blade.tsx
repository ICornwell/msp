import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

interface BladeProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string | null;
}

const bladeWidth = 320;

export const Blade: React.FC<BladeProps> = ({
  isOpen,
  onClose,
  contentId
}) => {
  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: bladeWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2
      }}>
        <Typography variant="h6">
          {contentId ? `Configure ${contentId}` : 'Configuration'}
        </Typography>
        <IconButton onClick={onClose} edge="end">
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Divider />
      
      <Box sx={{ p: 2 }}>
        {contentId ? (
          <Box>{`Configuration options for ${contentId}`}</Box>
        ) : (
          <Box>Select a configuration option</Box>
        )}
      </Box>
    </Drawer>
  );
};