import { Flatten, MakeArray, JOIN, TrueFalse } from './builderUtils.js';
import { PropsOfDomainObject, DomainObject, NameOfDomainObject, GETRELSFORNAME, RelsFromDO, versionedResourceId, PathOfDomainObject } from '../models/api/data.js';
import { View, ViewElement, SubElement } from '../models/api/view.js';



// Creates a single property object with name N and type O, as array if IC is true
type CreateObjProp<
  N extends string | number | symbol,
  O extends Object, // Record<string | number | symbol, any>,
  IC extends TrueFalse = false
> = N extends RootEName 
? (IC extends true ?  O[] :  O)
: (IC extends true ? { [K in N]: O[] } : { [K in N]: O })

// Context wrapper - carries both builder (B) and data type (D)
type CNTX<B, D> = B & { data: Flatten<D>, build(): View<Flatten<D>> };

// alias for 'current' context
type CURC<B, D> = CNTX<B, D>
// alias for 'return' context
type RETC<B, D> = CNTX<B, D>
// alias for 'next' context
type NEXC<B, D> = CNTX<B, D>

// extracts builder type from context
type BuilderOf<T> = T extends CNTX<infer B, any> ? B : any;

type DomainObjectWithNewPath<DO extends DomainObject, P> = Omit<DO, 'defaultDocPathName'> & { defaultDocPathName: P };


// Runtime helper to extract builder from context
function getBuilder<T>(context: CNTX<T, any>): T {
  const { data, ...builder } = context as any;
  return builder as T;
}



// ============================================================================================================
// ReType - reconstructs parent context with extended data for building hierachies, recursing to the root
// ============================================================================================================

type ReType<T extends CURC<any, any>, NewDataForCNTX, EName> =
  EName extends string | number | symbol
  ? T extends CURC<infer B, any>
    ? B extends ViewElementBuilder<infer ParentDT, infer ParentDO, infer parentPDO, infer ParentEName, infer InnerRT>
      ? ParentEName extends string | number | symbol
        ? RETC<
          ViewElementBuilder<
            JOIN<ParentDT, { [K in EName]+?: NewDataForCNTX }>,
            ParentDO,
            parentPDO,
            ParentEName,
            ReType<InnerRT, JOIN<ParentDT, { [K in EName]+?: NewDataForCNTX }>, ParentEName>
          >,
          NewDataForCNTX
        >
        : T
    : B extends ViewBuilder<any>
        ? RETC<
          ViewBuilder< NewDataForCNTX >, // just base the view's datatype to the rootelements datatype
          NewDataForCNTX
        >
      : CURC<B, NewDataForCNTX> // fallback
    :T // fallback
  : T // fallback;

// ============================================================================================================
// ViewElementBuilder - similar to test interface in test.ts
// DT = Data Type for this element
// EName = Element Name (string literal)
// RT = Return Type (what to return to on .end())
// ============================================================================================================

type VB<VBType extends 'ViewElementBuilder' | 'ViewRecursiveElementBuilder',
  DT, DO extends DomainObject, PDO extends DomainObject,
  EName extends string | number | symbol, RT extends RETC<any, any>> = 
 VBType extends 'ViewElementBuilder' ? ViewElementNonRecursive<DT, DO, PDO, EName, RT> :
    ViewElementRecursive<DT, DO, PDO, EName, RT>;

export type SubElementRT<
  X extends 'ViewElementBuilder' | 'ViewRecursiveElementBuilder',
  DT,
  DO extends DomainObject,
  PDO extends DomainObject,
  EName extends string | number | symbol,
  RT extends RETC<any, any>,
  SubEName extends string, NDO extends DomainObject<any, any, any>, IC extends TrueFalse
> = NEXC<
      VB<X, MakeArray<PropsOfDomainObject<NDO>, IC>, NDO, DO, SubEName,
        CURC<
          ViewElementBuilder<JOIN<DT, CreateObjProp<SubEName, PropsOfDomainObject<NDO>, IC>>, DO, PDO, EName,
            ReType<RT, JOIN<DT, 
              CreateObjProp<SubEName, PropsOfDomainObject<NDO>, IC>>, EName>>,
                 JOIN<DT, CreateObjProp<SubEName, PropsOfDomainObject<NDO>, IC>>>
      >,
      MakeArray<PropsOfDomainObject<NDO>, IC>>

export interface ViewElementBase<
  X extends 'ViewElementBuilder' | 'ViewRecursiveElementBuilder',
  DT,
  DO extends DomainObject,
  PDO extends DomainObject,
  EName extends string | number | symbol,
  RT extends RETC<any, any>
>{
withNamedSubElement: <SubEName extends string, NDO extends DomainObject<any, any, any>, IC extends TrueFalse>(
    name: SubEName,
    nextDomainObject: NDO,
    isCollection: IC
  ) =>
    // return a deeper ViewElementBuilder context, wrapping this one, wrapper the previous one
    SubElementRT<X,DT, DO, PDO, EName, RT, SubEName, NDO, IC>;

  withSubElement: <NDO extends DomainObject<any, any, any>, IC extends TrueFalse>(
    nextDomainObject: NDO,
    isCollection: IC
  ) =>
    // return a deeper ViewElementBuilder context, wrapping this one, wrapper the previous one
    SubElementRT<X,DT, DO, PDO, EName, RT, PathOfDomainObject<NDO>, NDO, IC>;
  withRelation: (relation: GETRELSFORNAME<RelsFromDO<PDO>, NameOfDomainObject<DO>>) =>
    CNTX<ViewElementBuilder<DT, DO, PDO, EName, RT>, PropsOfDomainObject<DO>>;
  withDocPathName: <P extends string>(docPathName: P) => CNTX<ViewElementBuilder<DT, DomainObjectWithNewPath<DO, P>, PDO, EName, RT>, PropsOfDomainObject<DO>>;
 
}

export interface ViewElementRecursive<
  DT,
  DO extends DomainObject,
  PDO extends DomainObject,
  EName extends string | number | symbol,
  RT extends RETC<any, any>
> extends ViewElementBase<'ViewElementBuilder', DT, DO, PDO, EName, RT>{
  Recurse: () => CNTX<ViewElementBuilder<DT, DO, PDO, EName, RT>, PropsOfDomainObject<DO>>
}

export interface ViewElementNonRecursive<
  DT,
  DO extends DomainObject,
  PDO extends DomainObject,
  EName extends string | number | symbol,
  RT extends RETC<any, any>
> extends ViewElementBase<'ViewElementBuilder', DT, DO, PDO, EName, RT>{
withRecursiveNamedSubElement: <SubEName extends string, NDO extends DomainObject<any, any, any>, IC extends TrueFalse>(
    name: SubEName,
    nextDomainObject: NDO,
    isCollection: IC
  ) =>
    // return a deeper ViewElementBuilder context, wrapping this one, wrapper the previous one
    SubElementRT<'ViewRecursiveElementBuilder',DT, DO, PDO, EName, RT, SubEName, NDO, IC>;

  withRecursiveSubElement: <NDO extends DomainObject<any, any, any>, IC extends TrueFalse>(
    nextDomainObject: NDO,
    isCollection: IC
  ) =>
    // return a deeper ViewElementBuilder context, wrapping this one, wrapper the previous one
    SubElementRT<'ViewRecursiveElementBuilder',DT, DO, PDO, EName, RT, PathOfDomainObject<NDO>, NDO, IC>;
}

export interface ViewElementBuilder<
  DT,
  DO extends DomainObject,
  PDO extends DomainObject,
  EName extends string | number | symbol,
  RT extends RETC<any, any>
> extends ViewElementBase<'ViewElementBuilder', DT, DO, PDO, EName, RT> {
   // Single withNamedSubElement using object notation like test.ts deep() method
  

  end: () => RT;
  __build: () => ViewElement<any>;
}

// ============================================================================================================
// ViewBuilder - top level
// ============================================================================================================
type RootEName = "__root";
export interface ViewBuilder<RootDT = any> {
  withVersion: (version: string) => ViewBuilder<RootDT>;
  withConfigSet: (configSet: string) => ViewBuilder<RootDT>;
  withRootKey: (rootKey: string) => ViewBuilder<RootDT>;

  withRootElement: <NDO extends DomainObject<any, any, any>, IC extends TrueFalse>(domainObject: NDO, isCollection: IC) =>
    NEXC<
      ViewElementBuilder<
        MakeArray<PropsOfDomainObject<NDO>, IC>, NDO, NDO, RootEName,
        CURC<
          ViewBuilder<Flatten<JOIN<RootDT, CreateObjProp<RootEName, PropsOfDomainObject<NDO>, IC>>>>,
          Flatten<JOIN<MakeArray<RootDT, IC>, CreateObjProp<RootEName, PropsOfDomainObject<NDO>, IC>>>
        >
      >, MakeArray<PropsOfDomainObject<NDO>, IC>
    >;
  endView: () =>  {build: () => View<Flatten<RootDT>>, data: Flatten<RootDT>};
  // buildView: () => View;
  __build: () => View<any>;
}

// ============================================================================================================
// Runtime Implementation
// ============================================================================================================

export function createViewElementBuilder<
  DT,
  DO extends DomainObject,
  PDO extends DomainObject,
  EName extends string | number | symbol,
  RT extends CNTX<any, any>
>(
  returnTo: BuilderOf<RT>,
  elementName: string,
  queryObjectId: string,
  domainObject: DO,
  isCollection: TrueFalse,
  elementBuilders: Array<any>,
  queryIdsUsed: Set<string>
): CNTX<ViewElementBuilder<DT, DO, PDO, EName, RT>, DT> {

  const element: Partial<ViewElement<any>> = {
    object: domainObject.name,
    docPathName: elementName,
    queryObjectId: queryObjectId,
    isEntity: domainObject.isEntity ?? false,
    domainObjectId: domainObject.vid,
    isCollection: isCollection,
    relationFromParent: undefined,
    subElements: undefined
  };

  let subElementBuilders: Array<any> = [];

  function buildSubElement<SubEName extends string, DO extends DomainObject<any, any, any>, IC extends TrueFalse>(
      innerName: SubEName,
      innerDomainObject: DO,
      isCollection: IC
    ): any {
      // Extract element name and schema from wrapper object
      const elementName = innerName  as SubEName; // Placeholder since we don't have the wrapper object here
      //const schemaOrArray = SchemaOrArrayWrapper
      const isSubCollection = isCollection;
      const actualDomainObject = innerDomainObject;
      let actualQueryId = innerDomainObject.name as string;

      let idx = 2
      while (queryIdsUsed.has(actualQueryId)) {
        actualQueryId = `${innerDomainObject.name}_${idx}`;
        idx++;
      }

      queryIdsUsed.add(actualQueryId);
      const subElementBuilder = createViewElementBuilder(
        builder as any,
        elementName,
        actualQueryId,
        actualDomainObject,
        isSubCollection,
        subElementBuilders,
        queryIdsUsed
      );

      return subElementBuilder;
    }

  const builder: ViewElementBuilder<DT, DO, PDO, EName, RT> = {
    withRelation: function (relation: GETRELSFORNAME<RelsFromDO<PDO>, NameOfDomainObject<DO>>): any {
      element.relationFromParent = relation as unknown as string; // runtime doesn't care about the actual relation object, just need to store something to indicate there is a relation
      return builderContext;
    },
    withDocPathName: function (docPathName: string): any {
      element.docPathName = docPathName;
      return builderContext;
    },
    withNamedSubElement: buildSubElement,

    withSubElement: <DO extends DomainObject<any, any, any>, IC extends TrueFalse>(
      innerDomainObject: DO,
      isCollection: IC
    ) => buildSubElement(innerDomainObject.defaultDocPathName, innerDomainObject, isCollection),

    end: function (): RT {
      return returnTo as RT;
    },

    __build: function (): ViewElement<any> {
      if (subElementBuilders.length > 0) {
        element.subElements = subElementBuilders.map((seb: any) => getBuilder(seb).__build()) as SubElement[];
      }
      
      return element as SubElement;
    }
  };

  // Create context wrapper with data property
  const builderContext: CNTX<ViewElementBuilder<DT, DO, PDO, EName, RT>, DT> = {
    ...builder,
    data: {} as Flatten<DT>,
    build: function (): View<Flatten<DT>> {
      //const view = builder.build();
      return builder.__build() as unknown as View<Flatten<DT>>;
    }
  };

  elementBuilders.push(builderContext as any);

  return builderContext;
}

export function createViewBuilder<RootDT = any>(name: string): ViewBuilder<RootDT> {
  const view: Partial<View> = {
    name: name,
    version: '1.0',
    configSet: 'main',
    rootKey: '',
    rootElement: undefined,
    domain: undefined,
    product: undefined
  };

  let rootElementBuilder: any;
  const queryIdsUsed = new Set<string>();


  const builder: ViewBuilder<RootDT> = {
    withVersion: function (version: string): ViewBuilder<RootDT> {
      view.version = version;
      return builder;
    },

    withConfigSet: function (configSet: string): ViewBuilder<RootDT> {
      view.configSet = configSet;
      return builder;
    },

    withRootKey: function (rootKey: string): ViewBuilder<RootDT> {
      view.rootKey = rootKey;
      return builder;
    },

    withRootElement: function <RootEName extends string, DO extends DomainObject<any, any, any>>(domainObject: DO, isCollection: TrueFalse = false): any {
      // Extract element name and schema from wrapper object like test.ts
      const elementName = domainObject.name as RootEName; // Placeholder since we don't have the wrapper object here";

    //  const isCollection = Array.isArray(schemaOrArray);
      const actualSchema = domainObject;
      const queryId = 'root'; // Simple default

      const elementBuilder = createViewElementBuilder(
        builder,
        elementName,
        queryId,
        actualSchema,
        isCollection,
        [],
        queryIdsUsed
      );

      rootElementBuilder = elementBuilder;
      return elementBuilder;
    },

    endView: function (): CNTX<any, Flatten<typeof rootElementBuilder.data>> {
      return {
        data: {} as Flatten<RootDT>,
        build: function (): View<Flatten<RootDT>> {
          const view = builder.__build();
          view.dataType = this.data;
          return view as View<Flatten<RootDT>>;
        }
      }
    },

    __build: function (): View<any> {
      if (rootElementBuilder) {
        view.rootElement = getBuilder(rootElementBuilder).build();
      }
      view.viewDataIdentifier = {name: view.name!, version: view.version!} as versionedResourceId; // In real implementation, would need to generate a proper identifier
      
      return view as View<any>;    },
  };

  const builderContext: CNTX<any, RootDT> = {
    ...builder,
    data: {} as Flatten<RootDT>,
    build: function (): View<Flatten<RootDT>> {
      const view = builder.__build();
      return view as View<Flatten<RootDT>>;
    }
  };

  return builderContext;
}

// ============================================================================================================
// Convenience function
// ============================================================================================================

export function createView(name: string): ViewBuilder<any> {
  return createViewBuilder<{}>(name);
}
