import { ProductBuilder, createProduct } from "./productBuilder";
import { SchemaBuilder, createSchema  } from "./schemaBuilder";
import { DomainObjectBuilder, createDomainObject } from "./objectBuilder"
import { ViewBuilder, createViewBuilder } from "./viewBuilder";

import type {Schema, SchemaProperty, DataObject, DomainObject,
  DataOfSchema
} from "../models/api/data.js";

import type {View, ViewElement} from "../models/api/view.js";


export {
  ProductBuilder,
  createProduct,
  SchemaBuilder,
  createSchema,
  DomainObjectBuilder,
  createDomainObject,
  ViewBuilder,
  createViewBuilder
}

export type {
  Schema,
  SchemaProperty,
  DataObject,
  DomainObject,
  DataOfSchema,
  View,
  ViewElement
}