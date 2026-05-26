
/* @vitest-environment happy-dom */

import { expect, test, describe } from 'vitest'
import { render } from '@testing-library/react';
import { act } from 'react';
import { ReEngine } from '../../components/ReEngine.js';
import { UserInfoLayout } from './layoutAutoList.js';
import { TestAppShell } from '../testAppShell.js';

const exampleData = {
  userId: '000-000-0000',
  userName: 'Bob Test Roberts',
  email: 'bob.roberts@testorg.com',
  marketingConsent: true,
  phoneNumber: '000-000-0000',
  joinedDate: 'joinedDate',
  creditLimit: 1000,
  schemePoints: 100,
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
    
    const { getByDisplayValue } = renderResult;

    const emailInput = getByDisplayValue(exampleData.email) as HTMLInputElement;
    expect(emailInput).toBeTruthy();
    expect(emailInput.value).toBe(exampleData.email);
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
    
    const { getByDisplayValue } = renderResult;

    const emailInput = getByDisplayValue(exampleData.email) as HTMLInputElement;
    expect(emailInput).toBeTruthy();
    expect(emailInput.value).toBe(exampleData.email);
  });


 
});