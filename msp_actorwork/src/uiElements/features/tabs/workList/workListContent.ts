import { Re, PresetLinkComponent } from 'msp_ui_common';
import { Table, PresetDateComponent } from 'msp_ui_common';
import { userWorkListFluxorData } from '../../../fluxorObjects/workListFluxor.js';

export function workListContent() {
  const workListLayout = Re.makeUiPlan('UserInfo', '1.0')
    
    .withElementSet.usingFluxor(userWorkListFluxorData)
     .fromInlineElementSet

        
       .showingItem.fromComponentElement(Table)
          .withLabel('User Info Table')
          .withHelperText('A table showing vehicle information and calculated premiums')
          .enableFiltering(true)
          
    
      
      .withColumns()
        .column(s => s.work_workreference).pinned('left').pinned('right').withHeader('Work ID')
          .withRenderer
            .fromComponentElement(PresetLinkComponent)
            .withComponentProps({ linkName: 'work-item-detail' })
            .withValueBinding((context) => context.localData.work_workreference)
            .endElement
        .column(s => s.work_type)
        
        // Column group: User's participation info
        .columnGroup('link', 'Link')
          .column(s => s.link_type).withHeader('Make')
          .column(s => s.link_name).withHeader('Model')
          .column(s => s.link_slaDueDate).withHeader('SLA').withRenderer
            .fromComponentElement(PresetDateComponent)
            .withDisplayMode('readonly')
            .withValueBinding((context) => context.localData.link_slaDueDate)
            .endElement
          .column(s => s.link_deadline).withHeader('Deadline').withRenderer
            .fromComponentElement(PresetDateComponent)
            .withDisplayMode('readonly')
            .withValueBinding((context) => context.localData.link_deadline)
            .endElement
        .endGroup
        
        // Column group: Overall wqork dates
        .columnGroup('work', 'Overall')
          .column(s => s.work_raisedOn).withHeader('Raised').withRenderer
            .fromComponentElement(PresetDateComponent)
            .withDisplayMode('readonly')
            .withValueBinding((context) => context.localData.work_raisedOn).endElement
          .column(s => s.work_slaDueDate).withHeader('SLA').withRenderer
            .fromComponentElement(PresetDateComponent)
            .withDisplayMode('readonly')
            .withValueBinding((context) => context.localData.work_slaDueDate).endElement
          .column(s => s.work_deadline).withHeader('Deadline').withRenderer
            .fromComponentElement(PresetDateComponent)
            .withDisplayMode('readonly')
            .withValueBinding((context) => context.localData.work_deadline).endElement
        .endGroup
      .endColumns   
    .endElement 
  .endSet 
.BuildUiPlan()
return workListLayout
}