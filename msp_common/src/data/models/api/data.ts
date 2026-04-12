import { JOIN, Flatten, TrueFalse, ReKey } from '../../fluent/builderUtils.js';

export type versionedResourceId = {
  id: string;
  version: string;
};

export type DataObject = {
  id: string,
  __entityId: string,
  __tmpId: string,
  __metadata: {
    "__label": string,
    "__objectType": versionedResourceId,
    "__schema": versionedResourceId
    "__isEntity": boolean,
    "__originalId": string,
    "__timeStamp": number,
    "__transactionId": string,
    "__viewType": string,
    "__signature": {
      signerId: string,
      signature: string
    }
  }
}

export type InheritedPropertiesOf<T extends Schema<any, any>> =
  T extends Schema<any, undefined>
  ? {}  // Base case: no inheritsFromSchema, return empty
  : T extends Schema<any, infer IS>
  ? IS extends Schema<infer ID, any>
  ? JOIN<ID, InheritedPropertiesOf<IS>> // Recurse on parent schema
  : {}  // Fallback: shouldn't reach here
  : {};  // Fallback: shouldn't reach here

export type PropsOfSchema<T extends Schema<any, any>> =
  JOIN<InheritedPropertiesOf<T>, (T extends Schema<infer D, any> ? D : never)>

export type PropsOfDomainObject<T extends DomainObject | DomainObject[]> =
  T extends Array<infer AT>
  ? AT extends DomainObject<any, infer S, any, any> ? PropsOfSchema<S> : never
  : T extends DomainObject<any, infer S, any, any> ? PropsOfSchema<S> : never;

export type NameOfDomainObject<T extends DomainObject> =
  T extends Array<infer AT>
  ? AT extends DomainObject<infer N, any, any, any> ? (N extends string ? N : 'nonstring') : 'noname'
  : T extends DomainObject<infer N, any, any, any> ? (N extends string ? N : 'nonstring') : 'noname';

export type UNARRAY<T> = T extends Array<infer AT> ? AT : T;


export type SchemaPropertyName = string;
export type SchemaPropertyInfoType = "Text" | "Integer" | "Float" | "Boolean" | "Date" | "DateTime" | "Time" | "Money" | "Percentage" | "Image" | "Json" | "Custom";

export type SchemaProperty<T> = {
  name?: string;
  dictionaryId: versionedResourceId;
  infoType: SchemaPropertyInfoType;
  defaultLabel?: string;
  type? : T
}

export type SchemaPropertiesFor<D> = {
  [K in keyof D]: SchemaProperty<D[K]>;
}

export type Schema<D, IS extends Schema<any, any> | undefined = undefined> = {
  vid: versionedResourceId;
  name?: string
  domain?: versionedResourceId;  // Optional until bound to product
  product?: versionedResourceId;  // Optional until bound to product
  inheritsFromSchema?: IS;
  properties: Partial<Flatten<SchemaPropertiesFor<Partial<D>> & (IS extends Schema<infer ID> ? Partial<SchemaPropertiesFor<ID>> : {})>>;
}

export type DomainObjectRelation<RN extends string, TDO> = {
  name: RN;
  relatedObject: TDO;
  relatedObjectId: versionedResourceId;
  cascadeDeletes: TrueFalse;
}

export type SchemaOfDomainObject<DO extends DomainObject> =
  (DO extends DomainObject<any, infer S, any, any> ? S : never);

export type RelsTypes = {};

type RelsFromNames<DO extends DomainObject> =
  DO extends DomainObject<any, any, any, infer RF> ? { [rk in keyof RF]: (RF[rk] extends never ? never : RF[rk]) } : never;

type RelsToNames<DO extends DomainObject> =
  DO extends DomainObject<any, any, infer RT, any> ? { [rk in keyof RT]: (RT[rk] extends never ? never : RT[rk]) } : never;

export type DOWithNewToRels<DO extends DomainObject, N extends string, O extends string> =
  DomainObject<
    NameOfDomainObject<DO>,
    SchemaOfDomainObject<DO>,
    AddRel<O extends string ? O : never, N, RelsToNames<DO>>,
    RelsFromNames<DO> // extends RelsTypes ? DO['allowedRelationsFromNames'] : RelsTypes
  >;

export type DOWithNewFromRels<DO extends DomainObject, N extends string, O extends string> =
  DomainObject<
    NameOfDomainObject<DO>,
    SchemaOfDomainObject<DO>,
    RelsToNames<DO>, // extends RelsTypes ? DO['allowedRelationsToNames']  : RelsTypes,
    AddRel<O extends string ? O : never, N, RelsFromNames<DO>>
  >;



export type AddRel<O extends string, N extends string, RT extends RelsTypes,> =
  O extends keyof RT
  ? { [key in keyof RT]: key extends O ? ({} extends RT[O] ? never : RT[O]) | N : RT[key] }
  : ReKey<RT & { [key in O]: N }>;

export type ObjsOf<RT extends RelsTypes> =
  keyof RT;

export type RelsOf<O extends string, RT extends RelsTypes> =
  O extends keyof RT
  ? RT[O]
  : never;

export type GETRELSFORNAME<T, N extends string> = T extends { [k in N]: infer R } ? R : never;

export type DomainObject<N extends string = string, S extends Schema<any, any> = any, RelsTo extends RelsTypes = {}, RelsFrom extends RelsTypes = {}> = {
  vid: versionedResourceId;
  name: N
  domain?: versionedResourceId;  // Optional until bound to product
  product?: versionedResourceId;  // Optional until bound to product
  schema?: S;
  schemaId?: versionedResourceId;
  isEntity?: TrueFalse;
  allowedRelationsTo: DomainObjectRelation<string, any>[];
  allowedRelationsFrom: DomainObjectRelation<string, any>[];
  _allowedRelationsToNames: RelsTo;
  _allowedRelationsFromNames: RelsFrom;
  relationsTo: <ToDO extends DomainObject<any, any, any, any>>(domainObject: ToDO) => GETRELSFORNAME<RelsTo, NameOfDomainObject<ToDO>>;
  relationsFrom: <FromDO extends DomainObject<any, any, any, any>>(domainObject: FromDO) => GETRELSFORNAME<RelsFrom, NameOfDomainObject<FromDO>>;
  schemaProperties: SchemaPropertiesFor<S>;
  serialise: () => string;
}

export type RelsFromDO<DO extends DomainObject> = DO extends DomainObject<any, any, any, infer RF> ? RF : never;
export type RelsToDO<DO extends DomainObject> = DO extends DomainObject<any, any, infer RT, any> ? RT : never;

export type PropertiesOf<T extends Schema<any, any>> =
  InheritedPropertiesOf<T> & (T extends Schema<infer D, any> ? Partial<D> : never);

export type DataOfSchema<T extends Schema<any, any>> =
  (T extends Schema<infer D, any> ? D : never);

type KeyConcat<Prefix extends string | undefined, Key extends string> = Prefix extends string ? `${Prefix}_${Key}` : Key;

export type PrefixedDataOfSchema<Domain extends string | undefined, Prefix extends string | undefined,T extends Schema<any, any>> =
  (T extends Schema<infer D, any> ? (
    { [key in keyof D as KeyConcat<Domain, KeyConcat<Prefix, Extract<key, string>>>]: D[key] }
  ) : never);





