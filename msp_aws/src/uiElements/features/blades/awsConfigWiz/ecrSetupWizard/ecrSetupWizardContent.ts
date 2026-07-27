import { Re, Stepper } from 'msp_ui_common/uiLib';

import { ecrSetupWizardFluxorData } from '../../../../fluxorObjects/ecrSetupWizardFluxor.js';
import { withRepositoryScopePage } from './pages/repositoryScopePage.js';
import { withRepositoryPoliciesPage } from './pages/repositoryPoliciesPage.js';
import { withIntegrationPage } from './pages/integrationPage.js';
import { withReviewApplyPage } from './pages/reviewApplyPage.js';

export const builder = Re.makeUiPlan('EcrSetupConfig', '1.0')
  .withElementSet.usingFluxor(ecrSetupWizardFluxorData)
  .fromInlineElementSet
  .showingItem.fromComponentElement(Stepper)
  .withOrientation('horizontal');

export const builder2 = withRepositoryScopePage(builder);
export const builder3 = withRepositoryPoliciesPage(builder2);
export const builder4 = withIntegrationPage(builder3);
export const builder5 = withReviewApplyPage(builder4);

export const ecrSetupWizardPlan = builder5
  .endElement
  .endSet
  .BuildUiPlan();
