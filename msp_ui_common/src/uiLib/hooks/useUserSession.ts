import { useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { SessionInfo, useUserSessionContext } from '../contexts/UserSessionContext.js';


export type UserChangeHandler = {
  onLoggedIn: (sessionInfo: SessionInfo) => void;
  onLoggedOut: (sessionInfo: SessionInfo) => void;
}


export function useUserSession(handler: UserChangeHandler) {
  const { getSessionInfo, addHandler, removeHandler, login, loggedOut } = useUserSessionContext();

  const handlerId = uuid();



  useEffect(() => {
    addHandler(handlerId, handler);
    return () => {
      removeHandler(handlerId);
    };
  }, []);

  return {getSessionInfo, login, loggedOut};
}