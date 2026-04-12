import type { FluxorData } from 'msp_common'
import { participationSchema } from "../../data/work/participationSchemas.js";
import { userActorSchema } from "../../data/userActors/userActorSchemas.js";
import { workSchema } from "../../data/work/workSchemas.js";
import { PrefixedDataOfSchema } from 'msp_common';

export type UserWorkListProps = PrefixedDataOfSchema< undefined, 'actor',typeof userActorSchema> 
    & PrefixedDataOfSchema< undefined, 'participation', typeof participationSchema>
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
    participation_name: { dictionaryName: 'workActor-participation-name', attributeName: 'name', label: 'Participation Name' },
    participation_type: { dictionaryName: 'workActor-participation-type', attributeName: 'type', label: 'Participation Type' },
    participation_description: { dictionaryName: 'workActor-participation-description', attributeName: 'description', label: 'Participation Description' },
    participation_createdOn: { dictionaryName: 'workActor-participation-createdOn', attributeName: 'createdOn', label: 'Participation Created On' },
    participation_slaDueDate: { dictionaryName: 'workActor-participation-slaDueDate', attributeName: 'slaDueDate', label: 'Participation SLA Due Date' },
    participation_deadline: { dictionaryName: 'workActor-participation-deadline', attributeName: 'deadline', label: 'Participation Deadline' },
}