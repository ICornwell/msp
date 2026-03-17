import type { FluxorData } from 'msp_ui_common/uiLib'
import { userActorSchema } from "../../data/userActors/userActorSchemas.js";
import type { DataOfSchema } from 'msp_common';

type props = DataOfSchema<typeof userActorSchema>

export const userInfoFluxorData: FluxorData<props> = {
  name: { dictionaryName: 'workActor-actors-name', attributeName: 'name', label: 'User ID' },
  userName: { dictionaryName: 'workActor-actors-userName', attributeName: 'userName', label: 'User Name' },
  email: { dictionaryName: 'workActor-actors-email', attributeName: 'email', label: 'Email Address' },
}