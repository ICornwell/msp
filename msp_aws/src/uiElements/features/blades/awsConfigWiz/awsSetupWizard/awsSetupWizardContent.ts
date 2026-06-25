import { Re, Stepper } from 'msp_ui_common/uiLib';

import { awsSetupWizardFluxorData } from '../../../../fluxorObjects/awsSetupWizardFluxor.js';
import { withPlatformIntentPage } from './pages/platformIntentPage.js';
import { withTrustIdentityPage } from './pages/trustIdentityPage.js';
import { withNetworkShapePage } from './pages/networkShapePage.js';
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
export const builder5 = withResourceNamingPage(builder4);
export const builder6 = withReviewCreatePage(builder5);


export function awsSetupWizardContent() {

  return builder6
    .endElement
    .endSet
    .BuildUiPlan();
}
