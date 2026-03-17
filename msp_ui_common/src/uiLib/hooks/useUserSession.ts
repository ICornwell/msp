import { useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import { useUserSessionContext } from '../contexts/UserSessionContext.js';


export type UserChangeHandler = {
  onLoggedIn: (userId: string) => void;
  onLoggedOut: (userId: string) => void;
}


const userChangeHandlers: Record<string, UserChangeHandler> = {}

export function useUserSession(): UserChangeHandler {
  const {currentUser} = useUserSessionContext();

  const handlerId = uuid();

  const handler: UserChangeHandler = {
    onLoggedIn: (_userId: string) => {},
    onLoggedOut: (_userId: string) => {}
  }

  useEffect(() => {
    Object.values(userChangeHandlers).forEach(h => {
      h.onLoggedIn(currentUser?.userId || '');
    })
    return () => {
      Object.values(userChangeHandlers).forEach(h => {
      h.onLoggedOut(currentUser?.userId || '');
    })
    };
  }, [currentUser]);

  useEffect(() => {
    userChangeHandlers[handlerId] = handler;
    return () => {
      delete userChangeHandlers[handlerId];
    };
  }, []);

  return handler;
}