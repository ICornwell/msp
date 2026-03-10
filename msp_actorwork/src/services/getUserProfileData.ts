import type { ServiceActivity, ServiceActivityResultBuilder } from 'msp_common';

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
};

// Mock data for now - in real implementation this would query a database
const mockUserData: Record<string, UserProfileData> = {
  'user-123': {
    userId: 'user-123',
    name: 'John Doe',
    email: 'john.doe@example.com',
    userName: 'johndoe',
  },
  'user-456': {
    userId: 'user-456',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    userName: 'janesmith',
  },
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
    return resultBuilder.success(userData);
  } catch (error) {
    return resultBuilder.failed('Failed to retrieve user profile', error);
  }
}

export const GetUserProfileDataActivity: ServiceActivity = {
  namespace: 'actorwork',
  activityName: 'GetUserProfileData',
  version: '1.0.0',
  matchingVersionRange: '^1.0.0',
  context: '*',
  funcs: getUserProfileDataHandler,
};
