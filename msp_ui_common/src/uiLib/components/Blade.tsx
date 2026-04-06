import React, { useEffect } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';
import { usePresentationBladeState, usePresentationDispatch } from '../contexts/PresentationDispatchContext.js';
import { useDataCache } from '../hooks/useDataCache.js';
import { DataCacheMsg } from '../contexts/DataCacheContext.js';
import { isViewDataContent_Matching_ViewDataIndentifier } from 'msp_common';
import { ReEngine } from '../renderEngine/components/ReEngine.js';


interface BladeProps {

}

const bladeWidth = 320;

export const Blade: React.FC<BladeProps> = ({

}) => {

  const { loadData } = useDataCache();
  const bladeState  = usePresentationBladeState();
  const { dispatch } = usePresentationDispatch();
  const [loadedData, setLoadedData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  if (!isLoading && !loadedData && bladeState.viewDataIdentifier && bladeState.open) {
    setIsLoading(true);
    setIsOpen(true);
    // Request the data view to be loaded - this will trigger a DataViewLoaded event that we subscribe to below
    loadData(bladeState.viewDataIdentifier);
  }

  if (!bladeState.open && isOpen) {
    setIsOpen(false);
    setLoadedData(null);
    setIsLoading(false);
  } 

  useDataCache((datamsg: DataCacheMsg) => {
    if (datamsg.type === 'DataViewLoaded') {
      console.log('DataViewLoaded event received in Blade:', datamsg);
      setLoadedData(datamsg.viewDataContent);
      setIsLoading(false);
    }
    
  }, (dataMsg: DataCacheMsg) => dataMsg.type === 'DataViewLoaded'
   && isViewDataContent_Matching_ViewDataIndentifier(dataMsg.viewDataContent, bladeState.viewDataIdentifier),
  [bladeState.viewDataIdentifier]); // Re-subscribe if the blade's viewDataIdentifier changes

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
    setLoadedData(null);
    setIsLoading(false);
    dispatch({ requestType: 'closeBlade', target: 'UserProfileBlade' });
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
          {bladeState.title || 'Details'}
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