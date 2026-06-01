import type { FluxorData } from 'msp_common'
import { linkSchema } from "../../data/work/linkSchemas.js";
import { userActorSchema } from "../../data/actors/userActorSchemas.js";
import { workSchema } from "../../data/work/workSchemas.js";
import { PrefixedDataOfSchema } from 'msp_common';

export type UserWorkListProps = PrefixedDataOfSchema< undefined, 'actor',typeof userActorSchema> 
    & PrefixedDataOfSchema< undefined, 'link', typeof linkSchema>
    & PrefixedDataOfSchema< undefined, 'work', typeof workSchema>


export const userWorkListFluxorData: FluxorData<Partial<UserWorkListProps>> = {
    actor_name: { dictionaryName: 'workActor-actors-name', attributeName: 'name', label: 'User ID' },
    actor_userName: { dictionaryName: 'workActor-actors-userName', attributeName: 'userName', label: 'User Name' },
    actor_email: { dictionaryName: 'workActor-actors-email', attributeName: 'email', label: 'Email Address' },
    work_workreference: { dictionaryName: 'workActor-work-workreference', attributeName: 'workreference', label: 'Ref' },
    work_raisedOn: { dictionaryName: 'workActor-work-raisedOn', attributeName: 'raisedOn', label: 'Raised On' },
    work_slaDueDate: { dictionaryName: 'workActor-work-slaDueDate', attributeName: 'slaDueDate', label: 'SLA Due Date' },
    work_deadline: { dictionaryName: 'workActor-work-deadline', attributeName: 'deadline', label: 'Deadline' },
    work_type: { dictionaryName: 'workActor-work-type', attributeName: 'type', label: 'Type' },
    work_description: { dictionaryName: 'workActor-work-description', attributeName: 'description', label: 'Description' },
    link_name: { dictionaryName: 'workActor-link-name', attributeName: 'name', label: 'Link Name' },
    link_type: { dictionaryName: 'workActor-link-type', attributeName: 'type', label: 'Link Type' },
    link_description: { dictionaryName: 'workActor-link-description', attributeName: 'description', label: 'Link Description' },
    link_createdOn: { dictionaryName: 'workActor-link-createdOn', attributeName: 'createdOn', label: 'Link Created On' },
    link_slaDueDate: { dictionaryName: 'workActor-link-slaDueDate', attributeName: 'slaDueDate', label: 'Link SLA Due Date' },
    link_deadline: { dictionaryName: 'workActor-link-deadline', attributeName: 'deadline', label: 'Link Deadline' },
}