export type ReSchemaAttribute = { name: string, type: string, description?: string, defaultValue?: any, required?: boolean, enum?: string[] | number[] | boolean[] | object[] }
export type ReSchema = {
  name: string
  description?: string
  version: string
  attributes: ReSchemaAttribute[]
}