import { Re, Table } from 'msp_ui_common';

import { awsResourcesFluxorData } from '../../../fluxorObjects/awsResourcesFluxor.js';

export function awsResourcesContent() {
  return Re.makeUiPlan('AwsResourceInventory', '1.0')
    .withElementSet.usingFluxor(awsResourcesFluxorData)
    .fromInlineElementSet
    .showingItem.fromComponentElement(Table)
    .withLabel('AWS Resource Inventory')
    .withHelperText('EKS clusters and ECR repositories discovered by aws service activities')
    .withColumns()
    .column((s) => s.aws_type).withHeader('Type')
    .column((s) => s.aws_name).withHeader('Name')
    .column((s) => s.aws_region).withHeader('Region')
    .column((s) => s.aws_status).withHeader('Status')
    .endColumns
    .endElement
    .endSet
    .BuildUiPlan();
}
