import { createProduct } from "./productBuilder.js";
import { createSchema } from "./schemaBuilder.js";
import { createValueObject, createEntityObject } from "./objectBuilder.js"
import { createSimpleSchemaFromType, createSimpleDomainObject } from "./simpleBuilder.js";
import { createView } from "./viewBuilder.js";
import { createRelations } from "./objectRelationsBuilder.js";
import type { ProductBuilder } from "./productBuilder.js";
import type { SchemaBuilder } from "./schemaBuilder.js";
import type { DomainValueObjectBuilder } from "./objectBuilder.js";
import type { ViewBuilder } from "./viewBuilder.js";
import type { SimpleSchemaDefinition, SimpleSchemaFromType, SimpleDomainObject, SimpleSchemaPropertyDefinition } from "./simpleBuilder.js";

import type {Schema, SchemaProperty, DataObject, DomainObject,
  DataOfSchema, PrefixedDataOfSchema,
  DataObjectMetaData
} from "../models/api/data.js";

import type {View, ViewElement} from "../models/api/view.js";


export {
  createProduct,
  createSchema,
  createValueObject,
  createEntityObject,
  createSimpleSchemaFromType,
  createSimpleDomainObject,
  createRelations,
  createView
}

export type {
  ProductBuilder,
  SchemaBuilder,
  DomainValueObjectBuilder as DomainObjectBuilder,
  ViewBuilder,
  Schema,
  SchemaProperty,
  DataObject,
  DataObjectMetaData,
  DomainObject,
  DataOfSchema,
  PrefixedDataOfSchema,
  View,
  ViewElement,
  SimpleSchemaDefinition,
  SimpleSchemaFromType,
  SimpleDomainObject,
  SimpleSchemaPropertyDefinition
}