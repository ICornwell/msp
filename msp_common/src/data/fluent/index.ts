import { createProduct } from "./productBuilder.js";
import { createSchema } from "./schemaBuilder.js";
import { createDomainObject } from "./objectBuilder.js"
import { createView } from "./viewBuilder.js";
import { createRelations } from "./objectRelationsBuilder.js";
import type { ProductBuilder } from "./productBuilder.js";
import type { SchemaBuilder } from "./schemaBuilder.js";
import type { DomainObjectBuilder } from "./objectBuilder.js";
import type { ViewBuilder } from "./viewBuilder.js";

import type {Schema, SchemaProperty, DataObject, DomainObject,
  DataOfSchema, PrefixedDataOfSchema
} from "../models/api/data.js";

import type {View, ViewElement} from "../models/api/view.js";


export {
  createProduct,
  createSchema,
  createDomainObject,
  createRelations,
  createView
}

export type {
  ProductBuilder,
  SchemaBuilder,
  DomainObjectBuilder,
  ViewBuilder,
  Schema,
  SchemaProperty,
  DataObject,
  DomainObject,
  DataOfSchema,
  PrefixedDataOfSchema,
  View,
  ViewElement
}