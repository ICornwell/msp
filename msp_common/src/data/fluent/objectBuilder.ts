import { TrueFalse, stringifyObject } from '../fluent/builderUtils.js';
import { DomainObject, DomainObjectRelation, Schema, SchemaPropertiesFor, RelsTypes, AddRel, versionedResourceId, DOWithNewToRels, DOWithNewFromRels, NameOfDomainObject, GETRELSFORNAME } from '../models/api/data.js';

export type SchemaOfDomainObjectBuilder<DOB extends DomainObjectBuilder<any, any>> =
  (DOB extends DomainObjectBuilder<any, infer S> ? S : never);




export interface DomainObjectBuilder<O extends string, S extends Schema<any, any>, RelsTo extends RelsTypes = {}, RelsFrom extends RelsTypes = {}> {
  withId: (id: string, version: string) => DomainObjectBuilder<O, S, RelsTo, RelsFrom>;
  forDomain: (domain: versionedResourceId) => DomainObjectBuilder<O, S, RelsTo, RelsFrom>;
  forProduct: (product: versionedResourceId) => DomainObjectBuilder<O, S, RelsTo, RelsFrom>;
  withIsEntity: (isEntity: TrueFalse) => DomainObjectBuilder<O, S, RelsTo, RelsFrom>;
  withRelationTo: <N extends string, T extends DomainObject<any, any>>(
    name: N,
    targetObject: T,
    cascadeDeletes: TrueFalse
  ) => DomainObjectBuilder<O, S, AddRel<O, N, RelsTo>, RelsFrom>;
  withRelationFrom: <N extends string, T extends DomainObject<any, any>>(
    name: N,
    targetObject: T,
    cascadeDeletes: TrueFalse
  ) => DomainObjectBuilder<O, S, RelsTo, AddRel<O, N, RelsFrom>>;

  buildDomainObject: () => DomainObject<O, S, RelsTo, RelsFrom>;
}



export function createDomainObject<S extends Schema<any, any>, O extends string, RelsTo extends RelsTypes = {}, RelsFrom extends RelsTypes = {}>(
  name: O,
  schema: S): DomainObjectBuilder<O, S, RelsTo, RelsFrom> {
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

  const builder: DomainObjectBuilder<O, S, RelsTo, RelsFrom> = {
    withId: function (id: string, version: string): DomainObjectBuilder<O, S, RelsTo, RelsFrom> {
      domainObj.vid = { domain: domainObj.domain, name: id, version };
      return builder as unknown as DomainObjectBuilder<O, S, RelsTo, RelsFrom>;
    },

    forDomain: function (domain: versionedResourceId): DomainObjectBuilder<O, S, RelsTo, RelsFrom> {
      domainObj.domain = domain;
      domainObj.vid.domain = domain;
      return builder as unknown as DomainObjectBuilder<O, S, RelsTo, RelsFrom>;
    },

    forProduct: function (product: versionedResourceId): DomainObjectBuilder<O, S, RelsTo, RelsFrom> {
      domainObj.product = product;
      return builder as unknown as DomainObjectBuilder<O, S, RelsTo, RelsFrom>;
    },

    withIsEntity: function (isEntity: TrueFalse): DomainObjectBuilder<O, S, RelsTo, RelsFrom> {
      domainObj.isEntity = isEntity;
      return builder as unknown as DomainObjectBuilder<O, S, RelsTo, RelsFrom>;
    },


    withRelationTo<N extends string, TO extends DomainObject<any, any>>(name: N, targetObject: TO, cascadeDeletes: TrueFalse)
      : DomainObjectBuilder<O, S, AddRel<O, N, RelsTo>, RelsFrom> {
      if (!domainObj.allowedRelationsTo) {
        domainObj.allowedRelationsTo = [];
      }

      addDomainObjectRelationTo(targetObject, name, domainObj, cascadeDeletes);
      return builder as unknown as DomainObjectBuilder<O, S, AddRel<O, N, RelsTo>, RelsFrom>;
    },

    withRelationFrom<N extends string, SO extends DomainObject<any, any>>(name: N, sourceObject: SO, cascadeDeletes: TrueFalse)
      : DomainObjectBuilder<O, S, RelsTo, AddRel<O, N, RelsFrom>> {
      if (!domainObj.allowedRelationsFrom) {
        domainObj.allowedRelationsFrom = [];
      }

      addDomainObjectRelationFrom(sourceObject, name, domainObj, cascadeDeletes);
      return builder as unknown as DomainObjectBuilder<O, S, RelsTo, AddRel<O, N, RelsFrom>>;
    },

    buildDomainObject: function (): DomainObject<O, S, RelsTo, RelsFrom> {
      return domainObj as DomainObject<O, S, RelsTo, RelsFrom>;
    }
  };

  return builder;
}

// Convenience function to start building a schema
export function domainObject<S extends Schema<any, any>, N extends string>(name: N, schema: S): DomainObjectBuilder<N, S, RelsTypes, RelsTypes> {
  return createDomainObject<S, N, RelsTypes, RelsTypes>(name, schema);
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
