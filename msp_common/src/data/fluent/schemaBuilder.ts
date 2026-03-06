import { JOIN, Flatten } from '../fluent/builderUtils.js';
import { Schema, SchemaPropertiesFor, SchemaProperty, SchemaPropertyInfoType, SchemaPropertyName, versionedResourceId } from '../models/api/data.js';


type SchemaType = {};



  export type DataOfSchemaBuilder<T extends SchemaBuilder<any, any>> = 
  (T extends SchemaBuilder<infer D, any> ? D : never);

export interface SchemaBuilder<D extends SchemaType, IS extends Schema<any, any> | undefined = undefined> {
  withId: (id: string, version: string) => SchemaBuilder<D, IS>;
  forDomain: (domain: versionedResourceId) => SchemaBuilder<D, IS>;
  forProduct: (product: versionedResourceId) => SchemaBuilder<D, IS>;
  inheritsFrom: <IS2 extends Schema<any, any>>(parentSchema: IS2) => SchemaBuilder<D, IS extends undefined ? IS2 : Schema<IS,IS2>>;
  withProperty: <PT, PK extends SchemaPropertyName = any>(
    name: PK
  ) => PropertyBuilder<any, PK, SchemaBuilder<D & { [P in PK]: PT }, IS>, IS>
  buildSchema: () => Schema<D, IS>;
}

export interface PropertyBuilder<T, PK extends SchemaPropertyName
, SB extends SchemaBuilder<any, any>, IS extends Schema<any, any> | undefined> {
  forType: <NewT>() => PropertyBuilder<NewT, PK, SB, IS>;
  withDictionaryId: (id: string, version: string) => PropertyBuilder<T, PK, SB, IS>;
  withInfoType: (infoType: SchemaPropertyInfoType) => PropertyBuilder<T, PK, SB, IS>;
  withDefaultLabel: (label: string) => PropertyBuilder<T, PK, SB, IS>;
  endProperty: () => SchemaBuilder<JOIN<DataOfSchemaBuilder<SB>, { [P in PK]: T }>, IS>;
  __build: () => SchemaProperty<T>; 
}

export function createPropertyBuilder<T,
  PK extends SchemaPropertyName,
  SB extends SchemaBuilder<any, any>, IS extends Schema<any, any> | undefined>
  (name: PK,
   parentBuilder: SB,
   currentProperty?: Partial<SchemaProperty<T>>): PropertyBuilder<T, PK, SB, IS> {
  const property:Partial<SchemaProperty<T>> =  currentProperty ?? {
    name: name as string,
    dictionaryId: { id: '', version: '1.0' },
    infoType: "Text",
    defaultLabel: undefined
  };

  const builder: PropertyBuilder<T, PK, SB, IS  > = {
    forType: function <NewT>(): PropertyBuilder<NewT, PK, SB, IS> {
      return createPropertyBuilder<NewT, PK, SB, IS>(name, parentBuilder, property as Partial<SchemaProperty<NewT>>);
    },
    withDictionaryId: function (id: string, version: string): PropertyBuilder<T, PK, SB, IS> {
      property.dictionaryId = { id, version };
      return builder;
    },

    withInfoType: function (infoType: SchemaPropertyInfoType): PropertyBuilder<T, PK, SB, IS> {
      property.infoType = infoType;
      return builder;
    },

    withDefaultLabel: function (label: string): PropertyBuilder<T, PK, SB, IS> {
      property.defaultLabel = label;
      return builder;
    },

    endProperty: function (): SchemaBuilder<any, any> {
      return parentBuilder as SchemaBuilder<JOIN<DataOfSchemaBuilder<SB>, { [P in PK]: T }>, IS>;
    },

    __build: function (): SchemaProperty<T> {
      return property as SchemaProperty<T>;
    }
  }
  return builder
};


export function createSchema<D extends SchemaType, IS extends Schema<any, any> | undefined = undefined>(name: string): SchemaBuilder<D, IS> {
  let schema: Partial<Schema<D, any>> = {
    name: name,
    vid: { id: '', version: '1.0' },
    domain: undefined,
    product: undefined,
    inheritsFromSchema: undefined,
    properties: {} as any
  };

  const propertyBuilders: PropertyBuilder<any, any, any, IS>[] = [];

  const builder: SchemaBuilder<D, IS> = {
    withId: function (id: string, version: string): SchemaBuilder<D, IS> {
      schema.vid = { id, version };
      return builder;
    },

    forDomain: function (domain: versionedResourceId): SchemaBuilder<D, IS> {
      schema.domain = domain;
      return builder;
    },

    forProduct: function (product: versionedResourceId): SchemaBuilder<D, IS> {
      schema.product = product;
      return builder;
    },

    inheritsFrom: function <IS2 extends Schema<any, any>>(parentSchema: IS2): SchemaBuilder<D, IS extends undefined ? IS2 : Schema<IS,IS2>> {
      schema.inheritsFromSchema = parentSchema;
      return builder as unknown as SchemaBuilder<D, IS extends undefined ? IS2 : Schema<IS,IS2>>;
    },

    withProperty: function <PK extends SchemaPropertyName>(
      name: PK
    ): PropertyBuilder<string, PK, SchemaBuilder<D, IS>, IS> {
      /*  if (!schema.properties) {
         schema.properties = {} as any;
       }
       (schema.properties as any)[key] = property; */
      const propertyBuilder = createPropertyBuilder<string,PK, SchemaBuilder<D, IS>, IS>(name, builder)
      propertyBuilders.push(propertyBuilder);
      return propertyBuilder as unknown as PropertyBuilder<string, PK, SchemaBuilder<D, IS>, IS>;
    },

    buildSchema: function (): Schema<D, IS> {
      schema.properties = propertyBuilders.reduce((acc, pb) => { 
        const prop = pb.__build() 
        return { ...acc, [prop.name as SchemaPropertyName]: prop }
      }, schema.inheritsFromSchema ? (schema.inheritsFromSchema.properties as any) : {}
    ) as Partial<Flatten<SchemaPropertiesFor<D> & (IS extends Schema<infer ID, undefined> ? SchemaPropertiesFor<ID> : {})>>;
      return schema as Schema<D, IS>;
    }
  };

  return builder;
}



// Convenience function to start building a schema
export function schema(name: string): SchemaBuilder<SchemaType, undefined> {
  return createSchema<SchemaType, undefined>(name);
}
