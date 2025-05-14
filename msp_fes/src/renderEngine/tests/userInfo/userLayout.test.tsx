
import { expect, test, describe } from 'vitest'
import { render } from '@testing-library/react';


import { ReEngine } from '../../components/ReEngine';

import { UserInfoLayout } from '../../../renderEngine/tests/userInfo/layout.tsx';

import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

const cache = createCache({
  key: 'css',
  prepend: true,
});

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
    const { getByTestId } = render(
   <CacheProvider value={cache}>
      <ReEngine UiPlan={UserInfoLayout().build()} sourceData={exampleData} />
   </CacheProvider>
    )

    const tb1 = getByTestId('test.user.email');
    expect(tb1.innerText).toMatch(exampleData.testUserInfo.email)
  });

 
});