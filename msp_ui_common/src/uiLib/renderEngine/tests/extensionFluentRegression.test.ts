import { describe, expect, it } from 'vitest';

import { Table, Stepper } from '../../coreComponents.js';
import { Re } from '../index.js';
import { userInfoFluxorData } from './userInfo/UserInfo.js';

describe('extension fluent regression coverage', () => {
  it('keeps Table extension methods after FluentSimple hop', () => {
    const plan = Re.makeUiPlan('table-regression-plan', '1.0')
      .withElementSet.usingFluxor(userInfoFluxorData)
      .fromInlineElementSet
      .showingItem.fromComponentElement(Table)
      .enableFiltering(true)
      .withColumns()
        .column((row) => row.userId)
          .withHeader('User ID')
        .column((row) => row.email)
          .withHeader('Email')
        .endColumns
      .endElement
      .endSet
      .BuildUiPlan();

    expect(plan.mainPlanElementSet?.length).toBeGreaterThan(0);
  });

  it('keeps Stepper page builder methods after withOrientation', () => {
    const plan = Re.makeUiPlan('stepper-regression-plan', '1.0')
      .withElementSet.usingFluxor(userInfoFluxorData)
      .fromInlineElementSet
      .showingItem.fromComponentElement(Stepper)
      .withOrientation('vertical')
      .withPage('page-1', 'Page 1')
        .withDescription('Validate fluent extension chaining after orientation')
        .withButton({ label: 'Next', role: 'next' })
      .endPage
      .withPage('page-2', 'Review')
        .withDescription('Second page ensures chaining stays valid after endPage')
        .withButtons([
          { label: 'Back', role: 'back' },
          { label: 'Finish', role: 'finish' },
        ])
      .endPage
      .endElement
      .endSet
      .BuildUiPlan();

    expect(plan.mainPlanElementSet?.length).toBeGreaterThan(0);
  });
});
