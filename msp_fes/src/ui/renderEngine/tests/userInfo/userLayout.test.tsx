
import { expect, test, describe } from 'vitest'
import { render } from '@testing-library/react';
import { act } from 'react';
import { ReEngine } from '../../components/ReEngine';
import { UserInfoLayout } from './layoutSimple.tsx';
import { TestAppShell } from '../testAppShell.tsx';

const exampleData = {
  testUserInfo: {
  userId: '000-000-0000',
  userName: 'Bob Test Roberts',
  email: 'bob.roberts@testorg.com',
  marketingConsent: true,
  phoneNumber: '000-000-0000',
  joinedDate: 'joinedDate',
  creditLimit: 1000,
  schemePoints: 100,
  }
}

describe('Layout has renderered and has content', () => {
  test('content matches string', () => {
    let renderResult: any;
    
    act(() => {
      renderResult = render(
        <TestAppShell>
          <ReEngine UiPlan={UserInfoLayout()} sourceData={exampleData} />
        </TestAppShell>
      );
    });
    
    const { getByLabelText } = renderResult;
       
    // Get the input element by its label (more resilient than using testId)
    const emailInput = getByLabelText('User Email');
    
    // Check if the input value contains the expected email
    (expect(emailInput) as any).toHaveValue(exampleData.testUserInfo.email);
  });

  test('column order horizontal first', () => {
    let renderResult: any;
    
    act(() => {
      renderResult = render(
        <TestAppShell>
          <ReEngine UiPlan={UserInfoLayout()} sourceData={exampleData} />
        </TestAppShell>
      );
    });
    
    const { getByLabelText } = renderResult;
       
    // Get the input element by its label (more resilient than using testId)
    const emailInput = getByLabelText('User Email');
    
    // Check if the input value contains the expected email
    (expect(emailInput) as any).toHaveValue(exampleData.testUserInfo.email);
  });


 
});