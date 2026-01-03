import { useState, useEffect, useRef, useContext, useReducer, useCallback, useMemo, FormEvent, FormEventHandler } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  InputBase,
  Box,
  Avatar,
  styled,
  alpha
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  ArrowDropDown as ArrowDropDownIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';
import { AppMenu } from './AppMenu';
import { MenuItem as AppMenuItem } from '../types';
import { useUserSessionContext } from '../contexts/UserSessionContext';
import { HTMLFormElement } from 'happy-dom';

interface TopBarProps {
  toggleSidebar: () => void;
  sidebarCollapsed: boolean;
  menuItems: AppMenuItem[];
  profileMenuItems: AppMenuItem[];
  openBlade: (contentId: string) => void;
}

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

export const TopBar: React.FC<TopBarProps> = ({
  toggleSidebar,
  sidebarCollapsed,
  menuItems,
  profileMenuItems,
  openBlade
}) => {
  const {login, loggedOut, currentUser} = useUserSessionContext();

  const [searchValue, setSearchValue] = useState<string>('');
  const [profileMenuAnchorEl, setProfileMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [mainMenuAnchorEl, setMainMenuAnchorEl] = useState<HTMLElement | null>(null);

  const handleProfileMenuOpen = (event: Partial<MouseEvent>) => {
    console.log('Profile menu open', event.currentTarget, mainMenuAnchorEl, event.currentTarget == mainMenuAnchorEl);
    setProfileMenuAnchorEl(event.currentTarget as HTMLElement);
  };

  const handleMainMenuOpen = (event: Partial<MouseEvent>) => {
    console.log('Profile menu open', event.currentTarget, mainMenuAnchorEl, event.currentTarget == profileMenuAnchorEl);
    setMainMenuAnchorEl(event.currentTarget as HTMLElement);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchorEl(null);
  };

  const handleMainMenuClose = () => {
    setMainMenuAnchorEl(null);
  };

  const handleSearchChange = (e: Partial<Event>) => {
    const target = e?.target as HTMLInputElement;
    setSearchValue(target.value);
  };

  const handleSearchSubmit = (e: Partial<Event>) => {
    e.preventDefault?.();
    console.log('Search submitted:', searchValue);
    // Implement search functionality
  };

  const handleMenuItemClick = (menuItem: AppMenuItem) => {
    if (menuItem.bladeId) {
      openBlade(menuItem.bladeId);
    }
    if (menuItem.action) {
      menuItem.action();
    }
    handleProfileMenuClose();
  };

  return (
    <AppBar position="static" style={{ zIndex: 5200 }}>
      <Toolbar>
        <IconButton
          key="toggle-sidebar"
          edge="start"
          color="inherit"
          aria-label="toggle sidebar"
          onClick={toggleSidebar}
          sx={{ mr: 2 }}
        >
          {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ display: { xs: 'none', sm: 'block' } }}
        >
          App Name
        </Typography>

        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <form onSubmit={handleSearchSubmit}>
            <StyledInputBase
              placeholder="Search…"
              inputProps={{ 'aria-label': 'search' }}
              value={searchValue}
              onChange={handleSearchChange}
            />
          </form>
        </Search>

        <Box sx={{ flexGrow: 1 }} />
        <Box>
          <IconButton
            key ="menu-button"
            edge="start"
            color="inherit"
            aria-label="toggle menu"
            onClick={(e) => handleMainMenuOpen(e as unknown as MouseEvent)}
            sx={{ mr: 2 }}
          >
            <MenuIcon sx={{ display: { xs: 'block' } }} />
          </IconButton>
          <AppMenu
              nameTag='Main Menu'
              key='menu1'
              anchorEl={mainMenuAnchorEl}
              open={Boolean(mainMenuAnchorEl)}
              onClose={handleMainMenuClose}
              menuItems={menuItems}
              onMenuItemClick={handleMenuItemClick} />
        </Box>
        {currentUser.isAuthenticated ? (
          <Box>
            <Button
              key="profile-menu-button"
              color="inherit"
              onClick={(e) => handleProfileMenuOpen(e as unknown as MouseEvent)}
              startIcon={<Avatar sx={{ width: 24, height: 24 }}>{currentUser.userName?.charAt(0) || 'U'}</Avatar>}
              endIcon={<ArrowDropDownIcon />}
            >
              {currentUser?.userName || 'User'}
            </Button>
            <AppMenu
              nameTag='Profile Menu'
              key='menu2'
              anchorEl={profileMenuAnchorEl}
              open={Boolean(profileMenuAnchorEl)}
              onClose={handleProfileMenuClose}
              menuItems={profileMenuItems}
              onMenuItemClick={handleMenuItemClick} />
          </Box>
        ) : (
          <Button color="inherit" onClick={login}>
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};