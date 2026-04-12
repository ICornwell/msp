import type { ServiceActivity, 
  ServiceActivityResultBuilder } from 'msp_svr_common';

import type { DataObject,  ViewDataContent } from 'msp_common';
import type { UserWorkListProps } from '../uiElements/fluxorObjects/workListFluxor.js';


// Activity input payload
export type GetUserWorkDataPayload = {
  userId: string;
};

// Activity result data
export type UserWorkData = Partial<UserWorkListProps> & Partial<DataObject>;

// Mock data for now - in real implementation this would query a database
const mockUserData: Record<string, ViewDataContent<UserWorkData[]>> = {
 
  'ian@smallwalrus.com': {
    viewDomain: 'actorwork',
    viewName: 'UserWorkList',
    viewVersion: '1.0.0',
    viewRootEntityType: 'Actor',
    viewRootEntityId: 'ian@smallwalrus.com',
    viewRootEntityBusKey: 'ian@smallwalrus.com',
    viewRootId: 'ian@smallwalrus.com',
    content: [{
      __entityId: 'ian@smallwalrus.com',
      id: 'ian@smallwalrus.com',
      actor_userName: 'Ian',
      work_workreference: 'WORK-12345',
      work_name: 'Example Work Item',
      work_type: 'Task',
      work_description: 'This is an example work item for Ian.',
      work_raisedOn: new Date('2024-04-06T10:00:00Z'),
      work_slaDueDate: new Date('2024-05-10T10:00:00Z'),
      work_deadline: new Date('2024-05-15T10:00:00Z'),
      participation_type: 'Review',
      participation_deadline: new Date('2026-04-25T10:00:00Z'),
      participation_slaDueDate: new Date('2026-04-18T10:00:00Z'),
      participation_name: 'Reviewer',
    
    },
  {
      __entityId: 'ian@smallwalrus.com',
      id: 'ian@smallwalrus.com',
      actor_userName: 'Ian',
      work_workreference: 'WORK-12346',
      work_name: 'Example Work Item',
      work_type: 'Task',
      work_description: 'This is an example work item for Ian.',
      work_raisedOn: new Date('2024-04-08T10:00:00Z'),
      work_slaDueDate: new Date('2024-05-120T10:00:00Z'),
      work_deadline: new Date('2024-05-17T10:00:00Z'),
      participation_type: 'Deploy',
      participation_deadline: new Date('2026-04-28T10:00:00Z'),
      participation_slaDueDate: new Date('2026-04-21T10:00:00Z'),
      participation_name: 'DevOps',
    
    }]
  }
};

async function getUserWorkListDataHandler(
  payload: GetUserWorkDataPayload,
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

    resultBuilder.log(`Successfully retrieved user work list for: ${userId}`);
    return resultBuilder.success({ data: [userData] });
  } catch (error) {
    return resultBuilder.failed('Failed to retrieve user work list', error);
  }
}

export const GetUserWorkListDataActivity: ServiceActivity = {
  namespace: 'actorwork',
  activityName: 'getUserWorkListData',
  version: '1.0.0',
  matchingVersionRange: '^1.0.0',
  context: 'AUTH', // Only authenticated users can call this activity
  funcs: getUserWorkListDataHandler,
};
