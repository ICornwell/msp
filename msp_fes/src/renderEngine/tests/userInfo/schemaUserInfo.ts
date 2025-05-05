import { fluxorSchemaBase, fluxAttribute, fluxObject } from '../../fluxor/fluxSchemaBase'

@fluxObject('testUserInfo')
export class SchemaUserInfo extends fluxorSchemaBase {

  @fluxAttribute(SchemaUserInfo, {dictionaryName: 'test.user.userId', preferredDisplayType:'text', label:'User Id'}) 
  userId: string = '';

  @fluxAttribute(SchemaUserInfo, {dictionaryName: 'test.user.userName', preferredDisplayType:'text', label:'User Name'})
  userName: string = '';

  @fluxAttribute(SchemaUserInfo, {dictionaryName: 'test.user.email', preferredDisplayType:'text', label:'User Email'})
  email: string = '';

  @fluxAttribute(SchemaUserInfo, {dictionaryName: 'test.user.marketingConsent', preferredDisplayType:'boolean', label:'Mkt. Consent'})
  marketingConsent: boolean = false;
 
  @fluxAttribute(SchemaUserInfo, {dictionaryName:'test.user.phoneNumber', preferredDisplayType:'text', label:'Phone Number'})
  phoneNumber: string = '';

  @fluxAttribute(SchemaUserInfo, {dictionaryName: 'test.user.joinedDate', preferredDisplayType:'date', label:'Date Joined'})
  joinedDate: string = '';

  @fluxAttribute(SchemaUserInfo, {dictionaryName: 'test.user.creditLimit', preferredDisplayType:'currency', label:'Credit Limit'})
  creditLimit: number = 0;

  @fluxAttribute(SchemaUserInfo, {dictionaryName: 'test.user.schemePoints', preferredDisplayComponent:'Number', label:'Scheme Points'})
  schemePoints: number = 0;
  
}