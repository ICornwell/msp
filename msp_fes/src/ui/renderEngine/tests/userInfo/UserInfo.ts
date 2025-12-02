import { FluxorData } from "../../fluxor/fluxorData"

export type UserInfo = {
  userId: string
  userName: string
  email: string
  marketingConsent: boolean
  phoneNumber: string
  joinedDate: string
  creditLimit: number
  schemePoints: number
  friends?: UserInfo[]
  requests?: UserRequests[]
  preferences?: UserPreferences
}

export type UserPreferences = {
  fontSize: string
  colorPalette: string
}

export type UserRequests = {
  title: string
  notes: string
  dateRequested: string
  dateNeededBy: string
  dateCompleted?: string
  isCompleted: boolean
}

export const userRequestFluxorData: FluxorData<UserRequests> = {
  title: { dictionaryName: 'UserRequests', attributeName: 'title', label: 'Title' },
  notes: { dictionaryName: 'UserRequests', attributeName: 'notes', label: 'Notes' },
  dateRequested: { dictionaryName: 'UserRequests', attributeName: 'dateRequested', label: 'Date Requested' },
  dateNeededBy: { dictionaryName: 'UserRequests', attributeName: 'dateNeededBy', label: 'Date Needed By' },
  dateCompleted: { dictionaryName: 'UserRequests', attributeName: 'dateCompleted', label: 'Date Completed' },
  isCompleted: { dictionaryName: 'UserRequests', attributeName: 'isCompleted', label: 'Is Completed' },
}

export const userPreferencesFluxorData: FluxorData<UserPreferences> = {
  fontSize: { dictionaryName: 'UserPreferences', attributeName: 'fontSize', label: 'Font Size' },
  colorPalette: { dictionaryName: 'UserPreferences', attributeName: 'colorPalette', label: 'Color Palette' },
}

export const userInfoFluxorData: FluxorData<UserInfo> = {
  userId: { dictionaryName: 'UserInfo', attributeName: 'userId', label: 'User ID' },
  userName: { dictionaryName: 'UserInfo', attributeName: 'userName', label: 'User Name' },
  email: { dictionaryName: 'UserInfo', attributeName: 'email', label: 'Email Address' },
  marketingConsent: { dictionaryName: 'UserInfo', attributeName: 'marketingConsent', label: 'Marketing Consent' },
  phoneNumber: { dictionaryName: 'UserInfo', attributeName: 'phoneNumber', label: 'Phone Number' },
  joinedDate: { dictionaryName: 'UserInfo', attributeName: 'joinedDate', label: 'Joined Date' },
  creditLimit: { dictionaryName: 'UserInfo', attributeName: 'creditLimit', label: 'Credit Limit' },
  schemePoints: { dictionaryName: 'UserInfo', attributeName: 'schemePoints', label: 'Scheme Points' },
  friends: { isArray: true, isComplex:true, dictionaryName: 'UserInfo', attributeName: 'friends', label: 'Friends' },
  requests: {isComplex:true, isArray:true },
  preferences: { isComplex:true},
}

