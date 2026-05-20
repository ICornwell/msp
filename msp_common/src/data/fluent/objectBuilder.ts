import { TrueFalse, stringifyObject } from '../fluent/builderUtils.js';
import { DomainObject, DomainObjectRelation, Schema, SchemaPropertiesFor, RelsTypes, AddRel, versionedResourceId, DOWithNewToRels, DOWithNewFromRels, NameOfDomainObject, GETRELSFORNAME, DataOfSchema } from '../models/api/data.js';

export type SchemaOfDomainObjectBuilder<DOB extends DomainValueObjectBuilder<any, any>> =
  (DOB extends DomainValueObjectBuilder<any, infer S> ? S : never);


export interface ObjectBuilder<RT, O extends string, S extends Schema<any, any>, RelsTo extends RelsTypes = {}, RelsFrom extends RelsTypes = {}> {
  withId: (id: string, version: string) => RT;
  forDomain: (domain: versionedResourceId) => RT;
  forProduct: (product: versionedResourceId) => RT;
  withDefaultPresentationLabel: (label: string) => RT;
  withDefaultDocPathName: (pathName: string) => RT;
  withDbStoreLabel: (dbStoreLabel: string) => RT;
  withRelationTo: <N extends string, T extends DomainObject<any, any>>(
    name: N,
    targetObject: T,
    cascadeDeletes: TrueFalse
  ) => RTWithNewRelsTo<RT, AddRel<O, N, RelsTo>>;
  withRelationFrom: <N extends string, T extends DomainObject<any, any>>(
    name: N,
    targetObject: T,
    cascadeDeletes: TrueFalse
  ) => RTWithNewRelsFrom<RT, AddRel<O, N, RelsFrom>>;
  buildObject: () => DomainObject<O, S>;
}

export interface DomainValueObjectBuilder<O extends string, S extends Schema<any, any>,
 RelsTo extends RelsTypes = {}, RelsFrom extends RelsTypes = {}>
   extends ObjectBuilder<DomainValueObjectBuilder<O, S, RelsTo, RelsFrom>, O, S, RelsTo, RelsFrom> {
}

export interface DomainEntityObjectBuilder<O extends string, S extends Schema<any, any>, RelsTo extends RelsTypes = {}, RelsFrom extends RelsTypes = {}>
   extends ObjectBuilder<DomainEntityObjectBuilder<O, S, RelsTo, RelsFrom>, O, S, RelsTo, RelsFrom> {

  withUniqueBusinessKey: (businessKey: string | string[] | ((data: DataOfSchema<S>) => string)) => DomainEntityObjectBuilder<O, S, RelsTo, RelsFrom>;
  withAlternateKey?: (businessKey: string | string[] | ((data: DataOfSchema<S>) => string)) => DomainEntityObjectBuilder<O, S, RelsTo, RelsFrom>;

}

type RTWithNewRelsFrom<RT, NewRelsFrom extends RelsTypes> = RT extends ObjectBuilder<infer R, infer O,  infer S, infer RelsTo, any>
  ? ObjectBuilder<R, O, S, RelsTo, NewRelsFrom>
  : never;

type RTWithNewRelsTo<RT, NewRelsTo extends RelsTypes> = RT extends ObjectBuilder<infer R, infer O,  infer S, any, infer RelsFrom>
  ? ObjectBuilder<R, O, S, NewRelsTo, RelsFrom>
  : never;

function createBaseBuilder<RT, O extends string, S extends Schema<any, any>, RelsTo extends RelsTypes = {}, RelsFrom extends RelsTypes = {}>(
  domainObj: DomainObject<any, any>) {
 const builder: Partial<ObjectBuilder<RT, O, S, RelsTo, RelsFrom>> =  {
    withId: function (id: string, version: string): RT {
      domainObj.vid = { domain: domainObj.domain, name: id, version };
      return builder as unknown as RT;
    },

    forDomain: function (domain: versionedResourceId): RT {
      domainObj.domain = domain;
      domainObj.vid.domain = domain;
      return builder as unknown as RT;
    },

    forProduct: function (product: versionedResourceId): RT {
      domainObj.product = product;
      return builder as unknown as RT;
    },
    withDefaultPresentationLabel: function (label: string): RT {
      domainObj.defaultPresentationLabel = label;
      return builder as unknown as RT;
    },
    withDefaultDocPathName: function (pathName: string): RT {
      domainObj.defaultDocPathName = pathName;
      return builder as unknown as RT;
    },
    withDbStoreLabel: function (storeLabel: string): RT {
      domainObj.storeWithDBLabel = storeLabel;
      return builder as unknown as RT;
    },

   
    withRelationTo<N extends string, TO extends DomainObject<any, any>>(name: N, targetObject: TO, cascadeDeletes: TrueFalse)
      : RTWithNewRelsTo<RT, AddRel<O, N, RelsTo>> {
      if (!domainObj.allowedRelationsTo) {
        domainObj.allowedRelationsTo = [];
      }

      addDomainObjectRelationTo(targetObject, name, domainObj, cascadeDeletes);
      return builder as unknown as RTWithNewRelsTo<RT, AddRel<O, N, RelsTo>>;
    },

    withRelationFrom<N extends string, SO extends DomainObject<any, any>>(name: N, sourceObject: SO, cascadeDeletes: TrueFalse)
      : RTWithNewRelsFrom<RT, AddRel<O, N, RelsFrom>> {
      if (!domainObj.allowedRelationsFrom) {
        domainObj.allowedRelationsFrom = [];
      }

      addDomainObjectRelationFrom(sourceObject, name, domainObj, cascadeDeletes);
      return builder as unknown as RTWithNewRelsFrom<RT, AddRel<O, N, RelsFrom>>;
    },
    buildObject: () =>domainObj as DomainObject<O,S>

    
  };

  return builder;
}

function createObject<S extends Schema<any, any>, O extends string, RelsTo extends RelsTypes = {}, RelsFrom extends RelsTypes = {}>(
  name: O,
  schema: S): DomainObject<O, S, RelsTo, RelsFrom> {
  let domainObj: DomainObject<O,S, RelsTo, RelsFrom> = {
    name: name,
    vid: {  name: '', version: '1.0' },
    domain: undefined,
    product: undefined,
    isEntity: undefined,
    allowedRelationsTo: [] as DomainObjectRelation<string, any>[],
    allowedRelationsFrom: [] as DomainObjectRelation<string, any>[],
    _allowedRelationsFromNames: {} as RelsFrom,
    _allowedRelationsToNames: {} as RelsTo,
    schemaProperties: schema.properties as SchemaPropertiesFor<S>,
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


export function createValueDomainObject<S extends Schema<any, any>, O extends string, RelsTo extends RelsTypes = {}, RelsFrom extends RelsTypes = {}>(
  name: O,
  schema: S): DomainValueObjectBuilder<O, S, RelsTo, RelsFrom> {
  

  const domainObj = createObject(name, schema);
  domainObj.isEntity = false;
  const partialBuilder = createBaseBuilder<DomainValueObjectBuilder<O, S, RelsTo, RelsFrom>, O, S, RelsTo, RelsFrom>(domainObj);

  const builder: DomainValueObjectBuilder<O, S, RelsTo, RelsFrom> = { 
    ...partialBuilder,
    buildObject: domainObj as DomainObject<O,S>
  } as unknown as DomainValueObjectBuilder<O, S, RelsTo, RelsFrom>;

  return builder;
}

export function createEntityDomainObject<S extends Schema<any, any>, O extends string, RelsTo extends RelsTypes = {}, RelsFrom extends RelsTypes = {}>(
  name: O,
  schema: S): DomainEntityObjectBuilder<O, S, RelsTo, RelsFrom> {
  

  const domainObj = createObject(name, schema);
  domainObj.isEntity = true;
  const partialBuilder = createBaseBuilder<DomainEntityObjectBuilder<O, S, RelsTo, RelsFrom>, O, S, RelsTo, RelsFrom>(domainObj);

  const builder: DomainEntityObjectBuilder<O, S, RelsTo, RelsFrom> = {
     ...partialBuilder,
       withUnqiueBusinessKey: function (uniqueBusinessKey: string | string[] | ((data: DataOfSchema<S>) => string)): DomainEntityObjectBuilder<O, S, RelsTo, RelsFrom> {
          domainObj.businessKey = uniqueBusinessKey;
          return builder as unknown as DomainEntityObjectBuilder<O, S, RelsTo, RelsFrom>;
        },
       withAlternateKey: function (alternateKey: string | string[] | ((data: DataOfSchema<S>) => string)): DomainEntityObjectBuilder<O, S, RelsTo, RelsFrom> {
          domainObj.alternateKey = alternateKey;
          return builder as unknown as DomainEntityObjectBuilder<O, S, RelsTo, RelsFrom>;
        }
    } as unknown as DomainEntityObjectBuilder<O, S, RelsTo, RelsFrom>;

  return builder;
}

// Convenience function to start building a schema
export function createValueObject<S extends Schema<any, any>, N extends string>(name: N, schema: S): DomainValueObjectBuilder<N, S, RelsTypes, RelsTypes> {
  return createValueDomainObject<S, N, RelsTypes, RelsTypes>(name, schema);
}

export function createEntityObject<S extends Schema<any, any>, N extends string>(name: N, schema: S): DomainEntityObjectBuilder<N, S, RelsTypes, RelsTypes> {
  return createEntityDomainObject<S, N, RelsTypes, RelsTypes>(name, schema);
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
 
  

  const s: DOWithNewFromRels<SO, N, NameOfDomainObject<TO>> = sourceObject as any as DOWithNewFromRels<typeof sourceObject, N, NameOfDomainObject<typeof targetObject>>; ;
  const t: DOWithNewToRels<typeof targetObject, N, NameOfDomainObject<SO>> = targetObject as any as DOWithNewToRels<typeof targetObject, N, NameOfDomainObject<typeof sourceObject>>; ;
  

  return { source : s,target: t };
}

function join(psv: string, newValue: string): string {
  if (!psv || psv.length === 0) {
    return newValue;
  } else {
    const parts = psv.split('|');

    return [...parts, newValue].join('|');
  }
}
