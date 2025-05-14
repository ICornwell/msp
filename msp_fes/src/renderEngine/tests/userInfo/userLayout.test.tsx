
import { expect, test, describe } from 'vitest'
import { render } from '@testing-library/react';
import { act } from 'react';
import { ReEngine } from '../../components/ReEngine';
import { UserInfoLayout } from '../../../renderEngine/tests/userInfo/layout.tsx';
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
          <ReEngine UiPlan={UserInfoLayout().build()} sourceData={exampleData} />
        </TestAppShell>
      );
    });
    
    const { getByLabelText } = renderResult;
    // console.log(container.innerHTML); // Keep for debugging if needed
    
    // Get the input element by its label (more resilient than using testId)
    const emailInput = getByLabelText('User Email');
    
    // Check if the input value contains the expected email
    expect(emailInput).toHaveValue(exampleData.testUserInfo.email);
  });

 
});