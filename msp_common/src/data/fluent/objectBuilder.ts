import { TrueFalse, stringifyObject } from '../fluent/builderUtils.js';
import { DomainObject, DomainObjectRelation, Schema, SchemaPropertiesFor, RelsTypes, AddRel, versionedResourceId, DOWithNewToRels, DOWithNewFromRels, NameOfDomainObject, GETRELSFORNAME, DataOfSchema, PropsOfSchema } from '../models/api/data.js';

export type SchemaOfDomainObjectBuilder<DOB extends DomainValueObjectBuilder<any, any, any>> =
  (DOB extends DomainValueObjectBuilder<any, any, infer S> ? S : never);


export interface ObjectBuilder<RT, O extends string, P extends string, S extends Schema<any, any>, RelsTo extends RelsTypes = {}, RelsFrom extends RelsTypes = {}> {
  withFQId: (fqId: versionedResourceId) => RT;
  forDomain: (domain: versionedResourceId) => RT;
  forProduct: (product: versionedResourceId) => RT;
  withDefaultPresentationLabel: (label: string) => RT;
  withDefaultDocPathName: <P2 extends string>(pathName: P2) => RTWithNewDefaultDocPathName<RT, P2>;
  withDbStoreLabel: (dbStoreLabel: string) => RT;
  withRelationTo: <N extends string, T extends DomainObject<any, any, any>>(
    name: N,
    targetObject: T,
    cascadeDeletes: TrueFalse
  ) => RTWithNewRelsTo<RT, AddRel<O, N, RelsTo>>;
  withRelationFrom: <N extends string, T extends DomainObject<any, any, any>>(
    name: N,
    targetObject: T,
    cascadeDeletes: TrueFalse
  ) => RTWithNewRelsFrom<RT, AddRel<O, N, RelsFrom>>;
  buildObject: () => DomainObject<O, P, S>;
}

export interface DomainValueObjectBuilder<O extends string, P extends string, S extends Schema<any, any>,
  RelsTo extends RelsTypes = {}, RelsFrom extends RelsTypes = {}>
  extends ObjectBuilder<DomainValueObjectBuilder<O, P, S, RelsTo, RelsFrom>, O, P, S, RelsTo, RelsFrom> {
}

export interface DomainEntityObjectBuilder<O extends string, P extends string, S extends Schema<any, any>, RelsTo extends RelsTypes = {}, RelsFrom extends RelsTypes = {}>
  extends ObjectBuilder<DomainEntityObjectBuilder<O, P, S, RelsTo, RelsFrom>, O, P, S, RelsTo, RelsFrom> {

  withUniqueBusinessKey: (businessKey: string | string[] | ((data: DataOfSchema<S>) => string)) => DomainEntityObjectBuilder<O, P, S, RelsTo, RelsFrom>;
  withAlternateKey?: (businessKey: string | string[] | ((data: DataOfSchema<S>) => string)) => DomainEntityObjectBuilder<O, P, S, RelsTo, RelsFrom>;

}

type RTWithNewRelsFrom<RT, NewRelsFrom extends RelsTypes> = RT extends ObjectBuilder<infer R, infer O, infer P, infer S, infer RelsTo, any>
  ? ObjectBuilder<R, O, P, S, RelsTo, NewRelsFrom>
  : never;

type RTWithNewRelsTo<RT, NewRelsTo extends RelsTypes> = RT extends ObjectBuilder<infer R, infer O, infer P, infer S, any, infer RelsFrom>
  ? ObjectBuilder<R, O, P, S, NewRelsTo, RelsFrom>
  : never;

type RTWithNewDefaultDocPathName<RT, P2 extends string> = RT extends ObjectBuilder<infer R, infer O, any, infer S, infer RelsTo, infer RelsFrom>
  ? ObjectBuilder<R, O, P2, S, RelsTo, RelsFrom>
  : never;

function createBaseBuilder<RT, O extends string, P extends string, S extends Schema<any, any>,
  RelsTo extends RelsTypes = {}, RelsFrom extends RelsTypes = {}>(
    domainObj: DomainObject<any, any, any>, returnBuilder: RT) {
  const baseBuilder: Partial<ObjectBuilder<RT, O, P, S, RelsTo, RelsFrom>> = {
    withFQId: function (fqId: versionedResourceId): RT {
      domainObj.vid = fqId;
      domainObj.name = fqId.name;
      return returnBuilder;
    },


    forDomain: function (domain: versionedResourceId): RT {
      // unused
      if (!domainObj.defaultDocPathName) domainObj.defaultDocPathName = domain.name;
      return returnBuilder;
    },

    forProduct: function (product: versionedResourceId): RT {
      domainObj.product = product;
      return returnBuilder;
    },
    withDefaultPresentationLabel: function (label: string): RT {
      domainObj.defaultPresentationLabel = label;
      return returnBuilder;
    },
    withDefaultDocPathName: function <P2 extends string>(pathName: P2): RTWithNewDefaultDocPathName<RT, P2> {
      domainObj.defaultDocPathName = pathName;
      return returnBuilder as unknown as RTWithNewDefaultDocPathName<RT, P2>;
    },
    withDbStoreLabel: function (storeLabel: string): RT {
      domainObj.storeWithDBLabel = storeLabel;
      return returnBuilder as unknown as RT;
    },


    withRelationTo<N extends string, TO extends DomainObject<any, any, any>>(name: N, targetObject: TO, cascadeDeletes: TrueFalse)
      : RTWithNewRelsTo<RT, AddRel<O, N, RelsTo>> {
      if (!domainObj.allowedRelationsTo) {
        domainObj.allowedRelationsTo = [];
      }

      addDomainObjectRelationTo(targetObject, name, domainObj, cascadeDeletes);
      return returnBuilder as unknown as RTWithNewRelsTo<RT, AddRel<O, N, RelsTo>>;
    },

    withRelationFrom<N extends string, SO extends DomainObject<any, any, any>>(name: N, sourceObject: SO, cascadeDeletes: TrueFalse)
      : RTWithNewRelsFrom<RT, AddRel<O, N, RelsFrom>> {
      if (!domainObj.allowedRelationsFrom) {
        domainObj.allowedRelationsFrom = [];
      }

      addDomainObjectRelationFrom(sourceObject, name, domainObj, cascadeDeletes);
      return returnBuilder as unknown as RTWithNewRelsFrom<RT, AddRel<O, N, RelsFrom>>;
    },
    buildObject: () => domainObj as DomainObject<O, P, S>


  };

  return baseBuilder;
}

function createObject<S extends Schema<any, any>, O extends string, P extends string,
  RelsTo extends RelsTypes = {}, RelsFrom extends RelsTypes = {}>(
    name: O,
    schema: S): DomainObject<O, P, S, RelsTo, RelsFrom> { // default path of domain object is the same as its name, but can be overridden with withDefaultDocPathName
  let domainObj: DomainObject<O, P, S, RelsTo, RelsFrom> = {
    name: name,
    defaultDocPathName: name as unknown as P,
    vid: { name: '', version: '1.0' },
    domain: undefined,
    product: undefined,
    isEntity: undefined,
    allowedRelationsTo: [] as DomainObjectRelation<string, any>[],
    allowedRelationsFrom: [] as DomainObjectRelation<string, any>[],
    _allowedRelationsFromNames: {} as RelsFrom,
    _allowedRelationsToNames: {} as RelsTo,
    schemaProperties: schema.properties as SchemaPropertiesFor<S>,
    schema: schema as S,
    getBusinessKey: function (data: Partial<PropsOfSchema<S>>,
       failOptions?: { neverThrow?: boolean, throwMessage?: string, fallback?: string }): string | null {

      const key = getDerivedValueFromData(data, domainObj.businessKey, failOptions);

      return key;
    },
    getAlternateKey: function (data: Partial<PropsOfSchema<S>>,
       failOptions?: { neverThrow?: boolean, throwMessage?: string, fallback?: string }): string | null {

      const key = getDerivedValueFromData(data, domainObj.alternateKey, failOptions);

      return key;
    },
    DataType: {} as Partial<PropsOfSchema<S>>,
    relationsTo: function <ToDO extends DomainObject>(domainObject: ToDO): GETRELSFORNAME<RelsTo, NameOfDomainObject<ToDO>> {
      return this.allowedRelationsTo.filter(rel => rel.relatedObject == domainObject) as GETRELSFORNAME<RelsTo, NameOfDomainObject<ToDO>>;
    },
    relationsFrom: function <FromDO extends DomainObject>(domainObject: FromDO): GETRELSFORNAME<RelsFrom, NameOfDomainObject<FromDO>> {
      return this.allowedRelationsFrom.filter(rel => rel.relatedObject == domainObject) as GETRELSFORNAME<RelsFrom, NameOfDomainObject<FromDO>>;
    },
    serialise: () => stringifyObject(domainObj)
  };
  return domainObj;
}

function getDerivedValueFromData(data: any, rootKey: string | string[] | ((data: any) => string) | undefined,
  failOptions?: { neverThrow?: boolean, throwMessage?: string, fallback?: string }): string | null {

  if (!rootKey) {
    if (failOptions?.neverThrow) {
      return failOptions?.fallback ?? null;
    } else {
      throw new Error(failOptions?.throwMessage ?? 'No business key defined for domain object.');
    }
  }
  let derivedValue: string | null = null;
  try {
    if (typeof rootKey === 'string') {
      derivedValue = data![rootKey].toString();
    } else if (Array.isArray(rootKey)) {
      derivedValue = rootKey.map(k => data![k]!.toString()).filter(s => s).join('|');
    } else if (typeof rootKey === 'function') {
      derivedValue = rootKey(data) ?? (() => { throw new Error('Business key function returned undefined or null.'); })();
    }
  } catch (error) {
    if (failOptions?.neverThrow) {
      return failOptions?.fallback ?? null;
    } else {
      throw new Error(failOptions?.throwMessage ?? `Error while getting business key from data. (${error})`);
    }
  }
  if (!derivedValue) {
    if (failOptions?.neverThrow) {
      return failOptions?.fallback ?? null;
    } else {
      throw new Error(failOptions?.throwMessage ?? 'Business key derived value is undefined or null.');
    }
  }
  return derivedValue;
}


export function createValueDomainObject<S extends Schema<any, any>, O extends string, P extends string = O, RelsTo extends RelsTypes = {}, RelsFrom extends RelsTypes = {}>(
  name: O,
  schema: S): DomainValueObjectBuilder<O, P, S, RelsTo, RelsFrom> {


  const domainObj = createObject(name, schema);
  domainObj.isEntity = false;
  const builder = {} as DomainValueObjectBuilder<O, P, S, RelsTo, RelsFrom>;
  const partialBuilder = createBaseBuilder<DomainValueObjectBuilder<O, P, S, RelsTo, RelsFrom>, O, P, S, RelsTo, RelsFrom>
    (domainObj, builder as DomainValueObjectBuilder<O, P, S, RelsTo, RelsFrom>);

  Object.assign(builder, {
    ...partialBuilder,
    buildObject: () => domainObj as DomainObject<O, P, S>
  } as unknown as DomainValueObjectBuilder<O, P, S, RelsTo, RelsFrom>);

  return builder;
}

export function createEntityDomainObject<S extends Schema<any, any>, O extends string, P extends string = O, RelsTo extends RelsTypes = {}, RelsFrom extends RelsTypes = {}>(
  name: O,
  schema: S): DomainEntityObjectBuilder<O, P, S, RelsTo, RelsFrom> {


  const domainObj = createObject(name, schema);
  domainObj.isEntity = true;
  const builder = {} as DomainEntityObjectBuilder<O, P, S, RelsTo, RelsFrom>;
  const partialBuilder = createBaseBuilder<DomainEntityObjectBuilder<O, P, S, RelsTo, RelsFrom>, O, P, S, RelsTo, RelsFrom>
    (domainObj, builder);

  Object.assign(builder, {
    ...partialBuilder,
    withUniqueBusinessKey: function (uniqueBusinessKey: string | string[] | ((data: Partial<PropsOfSchema<S>>) => string)): DomainEntityObjectBuilder<O, P, S, RelsTo, RelsFrom> {
      domainObj.businessKey = uniqueBusinessKey;
      return builder as unknown as DomainEntityObjectBuilder<O, P, S, RelsTo, RelsFrom>;
    },
    withAlternateKey: function (alternateKey: string | string[] | ((data: Partial<PropsOfSchema<S>>) => string)): DomainEntityObjectBuilder<O, P, S, RelsTo, RelsFrom> {
      domainObj.alternateKey = alternateKey;
      return builder as unknown as DomainEntityObjectBuilder<O, P, S, RelsTo, RelsFrom>;
    }
  } as unknown as DomainEntityObjectBuilder<O, P, S, RelsTo, RelsFrom>);

  return builder;
}

// Convenience function to start building a schema
export function createValueObject<S extends Schema<any, any>, N extends string, P extends string = N>(name: N, schema: S): DomainValueObjectBuilder<N, P, S, RelsTypes, RelsTypes> {
  return createValueDomainObject<S, N, P, RelsTypes, RelsTypes>(name, schema);
}

export function createEntityObject<S extends Schema<any, any>, N extends string, P extends string = N>(name: N, schema: S): DomainEntityObjectBuilder<N, P, S, RelsTypes, RelsTypes> {
  return createEntityDomainObject<S, N, P, RelsTypes, RelsTypes>(name, schema);
}

export function addDomainObjectRelationFrom<SO extends DomainObject,
  N extends string,
  TO extends DomainObject>
  (sourceObject: SO, name: N, targetObject: TO, cascadeDeletes: TrueFalse) {
  if (!sourceObject.allowedRelationsFrom) {
    sourceObject.allowedRelationsFrom = [];
  }
  sourceObject.allowedRelationsFrom?.push({ name, relatedObject: targetObject, relatedObjectId: (targetObject as any).vid, cascadeDeletes });

  // if not already present, add reverse relation to target object's allowedRelationsTo
  if (!targetObject.allowedRelationsTo) {
    targetObject.allowedRelationsTo = [];
  }
  if (!targetObject.allowedRelationsTo.find(rel => rel.name === name && rel.relatedObject == sourceObject)) {
    targetObject.allowedRelationsTo?.push({ name, relatedObject: sourceObject, relatedObjectId: (sourceObject as any).vid, cascadeDeletes });
  }

  return addNamedRelations<SO, N, TO>(sourceObject, targetObject, name, cascadeDeletes);;
}

export function addDomainObjectRelationTo<TO extends DomainObject,
  N extends string,
  SO extends DomainObject>(targetObject: SO, name: N, sourceObject: TO, cascadeDeletes: TrueFalse) {
  if (!targetObject.allowedRelationsTo) {
    targetObject.allowedRelationsTo = [];
  }
  targetObject.allowedRelationsTo?.push({ name, relatedObject: sourceObject, relatedObjectId: (sourceObject as any).vid, cascadeDeletes });

  // if not already present, add reverse relation to target object's allowedRelationsTo
  if (!sourceObject.allowedRelationsFrom) {
    sourceObject.allowedRelationsFrom = [];
  }
  if (!sourceObject.allowedRelationsFrom.find(rel => rel.name === name && rel.relatedObject == targetObject)) {
    sourceObject.allowedRelationsFrom?.push({ name, relatedObject: targetObject, relatedObjectId: (targetObject as any).vid, cascadeDeletes });
  }

  return addNamedRelations<SO, N, TO>(targetObject, sourceObject, name, cascadeDeletes); targetObject;
}
function addNamedRelations<SO extends DomainObject,
  N extends string,
  TO extends DomainObject>(sourceObject: SO, targetObject: TO, name: N, _cascadeDeletes: boolean)
  : { target: DOWithNewToRels<TO, N, NameOfDomainObject<SO>>, source: DOWithNewFromRels<SO, N, NameOfDomainObject<TO>> } {
  let toArr = targetObject._allowedRelationsFromNames as any;
  let fromArr = sourceObject._allowedRelationsToNames as any;
  if (!toArr) {
    targetObject._allowedRelationsFromNames = {} as any;
    toArr = targetObject._allowedRelationsFromNames as any;
  }
  if (!fromArr) {
    sourceObject._allowedRelationsToNames = {} as any;
    fromArr = sourceObject._allowedRelationsToNames as any;
  }

  toArr[targetObject.name as string] = join(toArr[targetObject.name as string], name);
  fromArr[sourceObject.name as string] = join(fromArr[sourceObject.name as string], name);



  const s: DOWithNewFromRels<SO, N, NameOfDomainObject<TO>> = sourceObject as any as DOWithNewFromRels<typeof sourceObject, N, NameOfDomainObject<typeof targetObject>>;;
  const t: DOWithNewToRels<typeof targetObject, N, NameOfDomainObject<SO>> = targetObject as any as DOWithNewToRels<typeof targetObject, N, NameOfDomainObject<typeof sourceObject>>;;


  return { source: s, target: t };
}

function join(psv: string, newValue: string): string {
  if (!psv || psv.length === 0) {
    return newValue;
  } else {
    const parts = psv.split('|');

    return [...parts, newValue].join('|');
  }
}
