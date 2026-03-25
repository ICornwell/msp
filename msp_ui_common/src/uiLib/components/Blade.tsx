import React from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';

interface BladeProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string | null;
  children?: React.ReactNode;
}

const bladeWidth = 320;

export const Blade: React.FC<BladeProps> = ({
  isOpen,
  onClose,
  contentId,
  children,
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
        {children ?? (
          contentId ? (
            <Box>{`Configuration options for ${contentId}`}</Box>
          ) : (
            <Box>Select a configuration option</Box>
          )
        )}
      </Box>
    </Drawer>
  );
};