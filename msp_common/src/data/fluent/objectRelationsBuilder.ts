import { TrueFalse } from '../fluent/builderUtils.js';
import { DomainObject, DOWithNewFromRels, DOWithNewToRels, NameOfDomainObject } from '../models/api/data.js';
import { addDomainObjectRelationFrom } from './objectBuilder.js';

type UpdateRO<RO, SourceDO extends DomainObject, TargetDO extends DomainObject> = 
  RO extends {} ? AddToRO<AddToRO<RO, SourceDO>, TargetDO> : never;
//  Flatten<AddToRO<AddToRO<RO, SourceDO>, TargetDO>> | { e:true };


// ? { [key in keyof RT]: key extends O ? RT[O] | N : RT[key] }
type AddToRO<RO, DO extends DomainObject> =
  
  //  NameOfDomainObject<DO> extends string
       (NameOfDomainObject<DO> extends keyof RO 
        ? { [key in keyof RO]: key extends NameOfDomainObject<DO> ? DO | (RO[key] extends never? never: RO[key]) : (key extends keyof RO ? RO[key] : never ) } 
        : (keyof RO extends never
          ? { [key in NameOfDomainObject<DO>]: DO }  // & { b:true, c: DO['name'] }
          : { [key in (keyof RO | NameOfDomainObject<DO>)]: key extends NameOfDomainObject<DO> ? DO  : (key extends keyof RO ? RO[key] : never ) } 
        )
      )
      //  : RO


export interface RelationsBuilder<RO> {

  allowRelationTo: <S extends DomainObject, N extends string, T extends DomainObject>(
    name: N,
    targetObject: T,
    sourceObject: S,
    cascadeDeletes: TrueFalse
  ) => RelationsBuilder<UpdateRO<RO, DOWithNewFromRels<S,N,NameOfDomainObject<T>>, DOWithNewToRels<T,N,NameOfDomainObject<S>>>>;
  allowRelationFrom: <S extends DomainObject, N extends string, T extends DomainObject>(
    name: N,
    sourceObject: S,
    targetObject: T,
    cascadeDeletes: TrueFalse
  ) => RelationsBuilder<UpdateRO<RO, DOWithNewFromRels<S,N,NameOfDomainObject<T>>, DOWithNewToRels<T,N,NameOfDomainObject<S>>>>;

  buildRelatedObjects: () => RO;
}

function createRelationsBuilder<RO>(currentObjects: RO) {

  const builder: RelationsBuilder<RO> = {
    allowRelationTo: function <T extends DomainObject, N extends string, S extends DomainObject>(
      name: N,
      targetObject: T,
      sourceObject: S,
      cascadeDeletes: TrueFalse
    ): RelationsBuilder<UpdateRO<RO, DOWithNewFromRels<S,N,NameOfDomainObject<T>>, DOWithNewToRels<T,N,NameOfDomainObject<S>>>> {
      return this.allowRelationFrom(name, sourceObject, targetObject, cascadeDeletes);
    /*
      // Note: the source and target are reversed <T,N,S> here because we're adding a relation from the perspective of the target object
      const { target, source } = addDomainObjectRelationTo<S,N,T>(targetObject, name, sourceObject, cascadeDeletes);
      const newObjects = {
        ...currentObjects,
        [target.name as string]: target,
        [source.name as string]: source
      } as UpdateRO<RO, typeof source, typeof target>;
      return createRelationsBuilder<UpdateRO<RO, typeof source, typeof target>>(newObjects); */
    },

    allowRelationFrom: function <S extends DomainObject, N extends string, T extends DomainObject>(
      name: N,
      sourceObject: S,
      targetObject: T,
      cascadeDeletes: TrueFalse
    ): RelationsBuilder<UpdateRO<RO, DOWithNewFromRels<S,N,NameOfDomainObject<T>>, DOWithNewToRels<T,N,NameOfDomainObject<S>>>> {
      
      const { target, source } = addDomainObjectRelationFrom<S, N, T>(sourceObject, name, targetObject, cascadeDeletes);
      const newObjects = {
        ...currentObjects,
        [target.name as string]: target,
        [source.name as string]: source
      } as UpdateRO<RO, typeof source, typeof target>;
      return createRelationsBuilder<UpdateRO<RO, typeof source, typeof target>>(newObjects);
    },

    buildRelatedObjects: function (): RO {
      return currentObjects as RO;
    }
  };

  return builder;   


}

export function relationsBuilder() {
  return createRelationsBuilder({});
}