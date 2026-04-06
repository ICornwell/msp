import type { ServiceActivity, 
  ServiceActivityResultBuilder } from 'msp_svr_common';

import type { DataObject,  ViewDataContent } from 'msp_common';


// Activity input payload
export type GetUserProfileDataPayload = {
  userId: string;
};

// Activity result data
export type UserProfileData = {
  userId: string;
  name: string;
  email: string;
  userName: string;
} & Partial<DataObject>;

// Mock data for now - in real implementation this would query a database
const mockUserData: Record<string, ViewDataContent<UserProfileData>> = {
  'user-123': {
    viewDomain: 'actorwork',
    viewName: 'UserProfile',
    viewVersion: '1.0.0',
    viewRootEntityType: 'UserProfile',
    viewRootEntityId: 'currentuser',
    viewRootEntityBusKey: 'user-123',
    viewRootId: 'user-123',
    content: {
      __entityId: 'currentuser',
      id: 'currentuser',
      userId: 'user-123',
      name: 'John Doe',
      email: 'john.doe@example.com',
      userName: 'johndoe',
    }
  },
  'user-456': {
    viewDomain: 'actorwork',
    viewName: 'UserProfile',
    viewVersion: '1.0.0',
    viewRootEntityType: 'UserProfile',
    viewRootEntityId: 'currentuser',
    viewRootEntityBusKey: 'user-456',
    viewRootId: 'user-456',
    content: {
      __entityId: 'currentuser',
      id: 'currentuser',
      userId: 'user-456',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      userName: 'janesmith',
    }
  },
  'ian@smallwalrus.com': {
    viewDomain: 'actorwork',
    viewName: 'UserProfile',
    viewVersion: '1.0.0',
    viewRootEntityType: 'UserProfile',
    viewRootEntityId: 'currentuser',
    viewRootEntityBusKey: 'ian@smallwalrus.com',
    viewRootId: 'currentuser',
    content: {
      __entityId: 'currentuser',
      id: 'currentuser',
      userId: 'ian@smallwalrus.com',
      name: 'Ian Walrus',
      email: 'ian@smallwalrus.com',
      userName: 'ian',
    }
  }
};

async function getUserProfileDataHandler(
  payload: GetUserProfileDataPayload,
  resultBuilder: ServiceActivityResultBuilder
): Promise<ServiceActivityResultBuilder> {
  try {
    const { userId } = payload;

    // Validate input
    if (!userId || typeof userId !== 'string') {
      return resultBuilder.failed('Invalid userId: must be a non-empty string', {
        code: 'INVALID_INPUT',
      });
    }

    // Fetch user data (mock for now)
    const userData = mockUserData[userId];

    if (!userData) {
      return resultBuilder.failed(`User not found: ${userId}`, {
        code: 'USER_NOT_FOUND',
        userId,
      });
    }

    resultBuilder.log(`Successfully retrieved user profile for: ${userId}`);
    return resultBuilder.success({ data: [userData] });
  } catch (error) {
    return resultBuilder.failed('Failed to retrieve user profile', error);
  }
}

export const GetUserProfileDataActivity: ServiceActivity = {
  namespace: 'actorwork',
  activityName: 'getUserProfileData',
  version: '1.0.0',
  matchingVersionRange: '^1.0.0',
  context: '*',
  funcs: getUserProfileDataHandler,
};
