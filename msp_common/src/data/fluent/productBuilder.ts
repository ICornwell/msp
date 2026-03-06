import { Schema, versionedResourceId } from '../models/api/data.js';
import {  View, ViewElement } from '../models/api/view.js';
import { ViewBuilder } from './viewBuilder.js';

import { SchemaBuilder } from './schemaBuilder.js';

// ============================================================================================================
// Product - represents a complete Product with schemas and views
// ============================================================================================================

export interface Product {
  id: versionedResourceId;
  name: string;
  domain: versionedResourceId;
  inheritsFrom?: versionedResourceId;
  schemas: Map<string, Schema<any, any>>;  // Full snapshot (schema.vid.id -> schema)
  views: View[];  // Full snapshot
}

// ============================================================================================================
// ProductBuilder - delta-based builder that produces full snapshot
// ============================================================================================================

export interface ProductBuilder {
  withName: (name: string) => ProductBuilder;
  withId: (id: string, version: string) => ProductBuilder;
  withDomain: (domain: versionedResourceId) => ProductBuilder;
  inheritsFrom: (parentProduct: Product) => ProductBuilder;
  addView: (view: View | ViewBuilder<any>) => ProductBuilder;
  addSchema: (schema: Schema<any, any> | SchemaBuilder<any, any>) => ProductBuilder;
  overrideSchema: (schema: Schema<any, any> | SchemaBuilder<any, any>) => ProductBuilder;
  buildProduct: () => Product;
}

export function createProduct(): ProductBuilder {
  const product: Partial<Product> = {
    id: { id: '', version: '1.0.0' },
    name: '',
    domain: { id: 'prototype', version: '1.0' },
    inheritsFrom: undefined,
    schemas: new Map(),
    views: []
  };

  // Track deltas
  let parentProduct: Product | undefined;
  const addedSchemas = new Map<string, Schema<any, any>>();
  const overriddenSchemas = new Map<string, Schema<any, any>>();
  const addedViews: View[] = [];

  const builder: ProductBuilder = {
    withName: function (name: string): ProductBuilder {
      product.name = name;
      return builder;
    },

    withId: function (id: string, version: string): ProductBuilder {
      product.id = { id, version };
      return builder;
    },

    withDomain: function (domain: versionedResourceId): ProductBuilder {
      product.domain = domain;
      return builder;
    },

    inheritsFrom: function (parent: Product): ProductBuilder {
      parentProduct = parent;
      product.inheritsFrom = parent.id;
      return builder;
    },

    addView: function (viewInput: View | ViewBuilder<any>): ProductBuilder {
      // Extract view from builder if needed
      const view = isViewBuilder(viewInput) ? viewInput.__build() : viewInput;
      
      // Bind view to product
      const boundView: View = {
        ...view,
        domain: product.domain,
        product: product.id
      };
      
      addedViews.push(boundView);
      
      // Extract schemas from view and add them automatically
      extractSchemasFromView(boundView, addedSchemas, product.domain!, product.id!);
      
      return builder;
    },

    addSchema: function (schemaInput: Schema<any, any> | SchemaBuilder<any, any>): ProductBuilder {
      // Extract schema from builder if needed
      const schema = isSchemaBuilder(schemaInput) ? schemaInput.buildSchema() : schemaInput;
      
      // Bind schema to product
      const boundSchema: Schema<any, any> = {
        ...schema,
        domain: product.domain,
        product: product.id
      };
      
      addedSchemas.set(boundSchema.vid.id, boundSchema);
      return builder;
    },

    overrideSchema: function (schemaInput: Schema<any, any> | SchemaBuilder<any, any>): ProductBuilder {
      // Extract schema from builder if needed
      const schema = isSchemaBuilder(schemaInput) ? schemaInput.buildSchema() : schemaInput;
      
      // Bind schema to product
      const boundSchema: Schema<any, any> = {
        ...schema,
        domain: product.domain,
        product: product.id
      };
      
      overriddenSchemas.set(boundSchema.vid.id, boundSchema);
      return builder;
    },

    buildProduct: function (): Product {
      // Build full snapshot from deltas
      const finalSchemas = new Map<string, Schema<any, any>>();
      
      // 1. Copy inherited schemas
      if (parentProduct) {
        for (const [key, schema] of parentProduct.schemas) {
          finalSchemas.set(key, schema);
        }
      }
      
      // 2. Add new schemas
      for (const [key, schema] of addedSchemas) {
        finalSchemas.set(key, schema);
      }
      
      // 3. Apply overrides
      for (const [key, schema] of overriddenSchemas) {
        finalSchemas.set(key, schema);
      }
      
      // Build full views list
      const finalViews: View[] = [];
      
      // 1. Copy inherited views
      if (parentProduct) {
        finalViews.push(...parentProduct.views);
      }
      
      // 2. Add new views
      finalViews.push(...addedViews);
      
      return {
        id: product.id!,
        name: product.name!,
        domain: product.domain!,
        inheritsFrom: product.inheritsFrom,
        schemas: finalSchemas,
        views: finalViews
      };
    }
  };

  return builder;
}

// ============================================================================================================
// Helper Functions
// ============================================================================================================

function isViewBuilder(obj: any): obj is ViewBuilder<any> {
  return obj && typeof obj.buildView === 'function';
}

function isSchemaBuilder(obj: any): obj is SchemaBuilder<any, any> {
  return obj && typeof obj.buildSchema === 'function';
}

function extractSchemasFromView(
  view: View,
  schemasMap: Map<string, Schema<any, any>>,
  domain: versionedResourceId,
  product: versionedResourceId
): void {
  if (view.rootElement) {
    extractSchemasFromElement(view.rootElement, schemasMap, domain, product);
  }
}

function extractSchemasFromElement(
  element: ViewElement<any
  >,
  schemasMap: Map<string, Schema<any, any>>,
  domain: versionedResourceId,
  product: versionedResourceId
): void {
  // Note: We only have the schema ID reference here, not the actual schema
  // In a real implementation, you'd need a schema registry to look up schemas
  // For now, we'll skip this as schemas should be explicitly added
  
  // Recursively process sub-elements
  if (element.subElements) {
    for (const subElement of element.subElements) {
      extractSchemasFromElement(subElement, schemasMap, domain, product);
    }
  }
}

// Convenience function to start building a product
export function product(): ProductBuilder {
  return createProduct();
}
