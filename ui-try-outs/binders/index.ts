import { RecordAttributeBinder } from './RecordAttributeBinder'
import { FunctionAttributeBinder } from './FunctionAttributeBinder'
import { LocalAttributeBinder } from './LocalAttributeBinder'

import { RecordBinder } from './RecordBinder'
import { FunctionRecordBinder } from './FunctionRecordBinder'

export type Primative = string | number | boolean | null | undefined | Date

export type AttributeBinder = (all: any, local: any, attributeName: string) => Primative

export const Bind = {
  Attribute: {
    FromPath: RecordAttributeBinder,
    FromFunction: FunctionAttributeBinder,
    FromLocalRecord: LocalAttributeBinder
  },
  Record: {
    FromPath: RecordBinder,
    FromFunction: FunctionRecordBinder
  }
}

export interface ReBinder {
  getRecord: (_allData: any, localData: any) => any
  getAttributeValue: (record: any) => any
}

