import React, { useEffect } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';
import { usePresentationBladeState, usePresentationDispatch } from '../contexts/PresentationDispatchContext.js';

import { useDataLoading } from '../hooks/useDataLoading.js';
import { ReEngine } from '../renderEngine/components/ReEngine.js';


interface BladeProps {

}

const bladeWidth = 320;

export const Blade: React.FC<BladeProps> = ({

}) => {


  const bladeState = usePresentationBladeState();
  const { dispatch } = usePresentationDispatch();

  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [title, setTitle] = React.useState<string>(simpleTitle(bladeState?.title, 'Details'));

  let { isLoading, loadedData, clearState } = useDataLoading(bladeState?.viewDataIdentifier, setBladeTitle);

  function setBladeTitle(data: any) {
    setIsOpen(bladeState.open)
    setTitle(simpleTitle(bladeState?.title, 'Details', data));
    loadedData = data;
  }

  function simpleTitle(title?: string | ((context: any) => string), defaultTitle: string = 'Details', data: any = null) {
    if (typeof title === 'string') return title
    if (typeof title === 'function') return title(data);
    return defaultTitle;
  }

  if (!bladeState.open && isOpen) {
    setIsOpen(false);
    clearState();
  }

  useEffect(() => {
    // For demonstration, we can log the blade state whenever it changes
    console.log('Blade state changed:', bladeState);
  }, [bladeState]);

  let bladeContent = (<Typography variant="body1" sx={{ p: 2 }}>No content to display</Typography>);
  if (isLoading) {
    bladeContent = (<Typography variant="body1" sx={{ p: 2 }}>Loading...</Typography>);
  } else if (loadedData) {
    bladeContent = (<ReEngine UiPlan={bladeState.content} sourceData={loadedData.content} />);
  }



  if (!bladeState || !bladeState.content || !bladeState.viewDataIdentifier) {
    return null; // Don't render the blade if there's no content to show
  }

  function handleClose() {
    setIsOpen(false);
    clearState();
    dispatch({ requestType: 'closeBlade', target: 'UserProfileBlade', contextOwnerId: bladeState.contextOwnerId });
  }


  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={() => handleClose()}
      sx={{
        '& .MuiDrawer-paper': {
          width: bladeWidth,
          boxSizing: 'border-box',
          marginTop: '64px', // Adjust if you have a different AppBar height
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
          {title}
        </Typography>
        <IconButton onClick={() => handleClose()} edge="end">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />
      {bladeContent}
    </Drawer>
  );
};