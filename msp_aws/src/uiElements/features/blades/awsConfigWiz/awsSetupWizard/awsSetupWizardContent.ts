import { Re, Stepper } from 'msp_ui_common/uiLib';

import { awsSetupWizardFluxorData } from '../../../../fluxorObjects/awsSetupWizardFluxor.js';
import { withPlatformIntentPage } from './pages/platformIntentPage.js';
import { withTrustIdentityPage } from './pages/trustIdentityPage.js';
import { withNetworkShapePage } from './pages/networkShapePage.js';
import { withSecurityBaselinePage } from './pages/securityBaselinePage.js';
import { withDataServicesPage } from './pages/dataServicesPage.js';
import { withResourceNamingPage } from './pages/resourceNamingPage.js';
import { withReviewCreatePage } from './pages/reviewCreatePage.js';

export const builder = Re.makeUiPlan('AwsClusterSetupConfig', '1.0')
    .withElementSet.usingFluxor(awsSetupWizardFluxorData)
    .fromInlineElementSet
    .showingItem.fromComponentElement(Stepper)
    .withOrientation('horizontal');

export const builder2 = withPlatformIntentPage(builder);
export const builder3 = withTrustIdentityPage(builder2);
export const builder4 = withNetworkShapePage(builder3);
export const builder5 = withSecurityBaselinePage(builder4);
export const builder6 = withDataServicesPage(builder5);
export const builder7 = withResourceNamingPage(builder6);
export const builder8 = withReviewCreatePage(builder7);

export function awsSetupWizardContent() {

  return builder8
    .endElement
    .endSet
    .BuildUiPlan();
}

