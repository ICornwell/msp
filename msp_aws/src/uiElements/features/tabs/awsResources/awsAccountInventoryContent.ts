import { Re, Table } from 'msp_ui_common';

import { awsAccountInventoryFluxorData } from '../../../fluxorObjects/awsAccountInventoryFluxor.js';

export function awsAccountInventoryContent() {
  return Re.makeUiPlan('AwsAccountInventory', '1.0')
    .withElementSet.usingFluxor(awsAccountInventoryFluxorData)
    .fromInlineElementSet
    .showingItem.fromComponentElement(Table)
    .withLabel('AWS Account Inventory')
    .withHelperText('Observed account resources (real AWS SDK reads) lined up against the desired state held by the setup wizards')
    .withColumns()
    .column((s) => s.aws_type).withHeader('Type')
    .column((s) => s.aws_name).withHeader('Name')
    .column((s) => s.aws_region).withHeader('Region')
    .column((s) => s.aws_status).withHeader('Status')
    .column((s) => s.aws_desired).withHeader('Desired State')
    .column((s) => s.aws_tags).withHeader('Tags')
    .endColumns
    .endElement
    .endSet
    .BuildUiPlan();
}
