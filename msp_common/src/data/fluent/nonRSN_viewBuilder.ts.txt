import { Flatten, MakeArray, JOIN, TrueFalse } from './builderUtils.js';
import { PropsOfDomainObject, DomainObject, NameOfDomainObject, GETRELSFORNAME, RelsFromDO, versionedResourceId,
   PathOfDomainObject } from '../models/api/data.js';
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

type PathOfSingleDomainObject<DO> = DO extends DomainObject<any, infer P, any, any, any> ?  P : never;

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
    ? B extends ViewElementNonRecursive<infer ParentDT, infer ParentDO, infer parentPDO, infer ParentEName, infer InnerRT>
      ? (ParentEName extends string | number | symbol
        ? RETC<
          ViewElementNonRecursive<
            JOIN<ParentDT, { [K in EName]+?: NewDataForCNTX }>,
            ParentDO,
            parentPDO,
            ParentEName,
            ReType<InnerRT, JOIN<ParentDT, { [K in EName]+?: NewDataForCNTX }>, ParentEName>
          >,
          NewDataForCNTX
        >
        : T)
    :  B extends ViewElementRecursive<infer ParentDT, infer ParentDO, infer parentPDO, infer ParentEName, infer InnerRT>
      ? (ParentEName extends string | number | symbol
        ? RETC<
          ViewElementRecursive<
            JOIN<ParentDT, { [K in EName]+?: NewDataForCNTX }>,
            ParentDO,
            parentPDO,
            ParentEName,
            ReType<InnerRT, JOIN<ParentDT, { [K in EName]+?: NewDataForCNTX }>, ParentEName>
          >,
          NewDataForCNTX
        >
        : T)
    : (B extends ViewBuilder<any>
        ? RETC<
          ViewBuilder< NewDataForCNTX >, // just base the view's datatype to the rootelements datatype
          NewDataForCNTX
        >
      : CURC<B, NewDataForCNTX>) // fallback
    :T // fallback
  : T // fallback;

// ============================================================================================================
// ViewElementBuilder - similar to test interface in test.ts
// DT = Data Type for this element
// EName = Element Name (string literal)
// RT = Return Type (what to return to on .end())
// ============================================================================================================

type NonRecursiveSubElementRT<
  DT,
  DO extends DomainObject,
  PDO extends DomainObject,
  EName extends string | number | symbol,
  RT extends RETC<any, any>,
  SubEName extends string,
  NDO extends DomainObject<any, any, any>,
  IC extends TrueFalse
> = NEXC<
  ViewElementNonRecursive<
    MakeArray<PropsOfDomainObject<NDO>, IC>,
    NDO,
    DO,
    SubEName,
    CURC<
      ViewElementNonRecursive<
        JOIN<DT, CreateObjProp<SubEName, PropsOfDomainObject<NDO>, IC>>,
        DO,
        PDO,
        EName,
        ReType<RT, JOIN<DT, CreateObjProp<SubEName, PropsOfDomainObject<NDO>, IC>>, EName>
      >,
      JOIN<DT, CreateObjProp<SubEName, PropsOfDomainObject<NDO>, IC>>
    >
  >,
  MakeArray<PropsOfDomainObject<NDO>, IC>
>;

type RecursiveSubElementRT<
  DT,
  DO extends DomainObject,
  PDO extends DomainObject,
  EName extends string | number | symbol,
  RT extends RETC<any, any>,
  SubEName extends string,
  NDO extends DomainObject<any, any, any>,
  IC extends TrueFalse
> = NEXC<
  ViewElementRecursive<
    MakeArray<PropsOfDomainObject<NDO>, IC>,
    NDO,
    DO,
    SubEName,
    CURC<
      ViewElementRecursive<
        JOIN<DT, CreateObjProp<SubEName, PropsOfDomainObject<NDO>, IC>>,
        DO,
        PDO,
        EName,
        ReType<RT, JOIN<DT, CreateObjProp<SubEName, PropsOfDomainObject<NDO>, IC>>, EName>
      >,
      JOIN<DT, CreateObjProp<SubEName, PropsOfDomainObject<NDO>, IC>>
    >
  >,
  MakeArray<PropsOfDomainObject<NDO>, IC>
>;

type RecursiveEntrySubElementRT<
  DT,
  DO extends DomainObject,
  PDO extends DomainObject,
  EName extends string | number | symbol,
  RT extends RETC<any, any>,
  SubEName extends string,
  NDO extends DomainObject<any, any, any>,
  IC extends TrueFalse
> = NEXC<
  ViewElementRecursive<
    MakeArray<PropsOfDomainObject<NDO>, IC>,
    NDO,
    DO,
    SubEName,
    CURC<
      ViewElementNonRecursive<
        JOIN<DT, CreateObjProp<SubEName, PropsOfDomainObject<NDO>, IC>>,
        DO,
        PDO,
        EName,
        ReType<RT, JOIN<DT, CreateObjProp<SubEName, PropsOfDomainObject<NDO>, IC>>, EName>
      >,
      JOIN<DT, CreateObjProp<SubEName, PropsOfDomainObject<NDO>, IC>>
    >
  >,
  MakeArray<PropsOfDomainObject<NDO>, IC>
>;

// once a recursive subelement is added, we are in a recursive builder context,
//  which has the additional Recurse method to allow recursion on that subelement
// which means a relation back to where the first recursive subelement in this chain was added,
//  which is the only place we can recurse back to, as we only allow one level of recursion
export interface ViewElementRecursive<
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
  ) => RecursiveSubElementRT<DT, DO, PDO, EName, RT, SubEName, NDO, IC>;

  withSubElement: <NDO extends DomainObject<any, any, any>, IC extends TrueFalse>(
    nextDomainObject: NDO,
    isCollection: IC
  ) => RecursiveSubElementRT<DT, DO, PDO, EName, RT, PathOfDomainObject<NDO>, NDO, IC>;

  withRelation: (relation: GETRELSFORNAME<RelsFromDO<PDO>, NameOfDomainObject<DO>>) =>
    CNTX<ViewElementRecursive<DT, DO, PDO, EName, RT>, PropsOfDomainObject<DO>>;

  withDocPathName: <P extends string>(docPathName: P) =>
    CNTX<ViewElementRecursive<DT, DomainObjectWithNewPath<DO, P>, PDO, EName, RT>, PropsOfDomainObject<DO>>;

  recurse: { end: () => RT};

  end: ()=>RT
  __build: () => ViewElement<any>;
}

export interface ViewElementNonRecursive<
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
  ) => NonRecursiveSubElementRT<DT, DO, PDO, EName, RT, SubEName, NDO, IC>;

  withSubElement: <NDO extends DomainObject<any, any, any>, IC extends TrueFalse>(
    nextDomainObject: NDO,
    isCollection: IC
  ) => NonRecursiveSubElementRT<DT, DO, PDO, EName, RT, PathOfDomainObject<NDO>, NDO, IC>;

  withRelation: (relation: GETRELSFORNAME<RelsFromDO<PDO>, NameOfDomainObject<DO>>) =>
    CNTX<ViewElementNonRecursive<DT, DO, PDO, EName, RT>, PropsOfDomainObject<DO>>;

  withDocPathName: <P extends string>(docPathName: P) =>
    CNTX<ViewElementNonRecursive<DT, DomainObjectWithNewPath<DO, P>, PDO, EName, RT>, PropsOfDomainObject<DO>>;

  withRecursiveNamedSubElement: <SubEName extends string, NDO extends DomainObject<any, any, any>, IC extends TrueFalse>(
    name: SubEName,
    nextDomainObject: NDO,
    isCollection: IC
  ) =>
    RecursiveEntrySubElementRT<DT, DO, PDO, EName, RT, SubEName, NDO, IC>;

  withRecursiveSubElement: <NDO extends DomainObject<any, any, any>, IC extends TrueFalse>(
    nextDomainObject: NDO,
    isCollection: IC
  ) =>
    RecursiveEntrySubElementRT<DT, DO, PDO, EName, RT, PathOfDomainObject<NDO>, NDO, IC>;

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
      ViewElementNonRecursive<
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

function buildSubElement( 
      queryIdsUsed: Set<string>,
      builder: any,
      subElementBuilders: Array<any>,
      recursive = false,
      recurseLevel: number = 0
    ) {
return function <SubEName extends string, DO extends DomainObject<any, any, any>, IC extends TrueFalse>(
      innerName: SubEName,
      innerDomainObject: DO,
      isCollection: IC,
     
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
      if (!recursive) {
      const subElementBuilder = createViewElementNonRecursiveBuilder(
        builder as any,
        elementName,
        actualQueryId,
        actualDomainObject,
        isSubCollection,
        subElementBuilders,
        queryIdsUsed
      );

      return subElementBuilder;
    } else {
      const subElementBuilder = createViewElementRecursiveBuilder(
        builder as any,
        elementName,
        actualQueryId,
        actualDomainObject,
        isSubCollection,
        subElementBuilders,
        queryIdsUsed,
        recurseLevel
      );
      return subElementBuilder;
    }
  }
}
// ============================================================================================================
// Runtime Implementation
// ============================================================================================================
export function createViewElementRecursiveBuilder<
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
  queryIdsUsed: Set<string>,
  recurseLevel: number = 1
): CNTX<ViewElementRecursive<DT, DO, PDO, EName, RT>, DT> {

  const element: Partial<ViewElement<any>> = {
    object: domainObject.name,
    docPathName: elementName,
    queryObjectId: queryObjectId,
    isEntity: domainObject.isEntity ?? false,
    domainObjectId: domainObject.vid,
    isCollection: isCollection,
    relationFromParent: undefined,
    subElements: undefined,
    isRecurseEndPoint: false,
    recurseLevel: recurseLevel
  };

  let subElementBuilders: Array<any> = [];

  
  const builder: ViewElementRecursive< DT, DO, PDO, EName, RT> = {
    withRelation: function (relation: GETRELSFORNAME<RelsFromDO<PDO>, NameOfDomainObject<DO>>): any {
      element.relationFromParent = relation as unknown as string; // runtime doesn't care about the actual relation object, just need to store something to indicate there is a relation
      return builderContext;
    },
    withDocPathName: function (docPathName: string): any {
      element.docPathName = docPathName;
      return builderContext;
    },
    withNamedSubElement:  <SubEName extends string, DO extends DomainObject<any, any, any>, IC extends TrueFalse>
      (name: SubEName, nextDomainObject: DO, isCollection: IC) => 
        buildSubElement(queryIdsUsed, builder, subElementBuilders, false, recurseLevel + 1)
      (name, nextDomainObject, isCollection),

    withSubElement: <DO extends DomainObject<any, any, any>, IC extends TrueFalse>(
      innerDomainObject: DO,
      isCollection: IC
    ) => buildSubElement(queryIdsUsed, builder, subElementBuilders, false, recurseLevel + 1)
          <PathOfSingleDomainObject<DO>, DO, IC>
          (innerDomainObject.defaultDocPathName, innerDomainObject, isCollection),

    recurse: {
      end: function (): RT {
        return returnTo as RT;
      }
    },

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
  const builderContext: CNTX<ViewElementRecursive<DT, DO, PDO, EName, RT>, DT> = {
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

export function createViewElementNonRecursiveBuilder<
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
): CNTX<ViewElementNonRecursive<DT, DO, PDO, EName, RT>, DT> {
  const element: Partial<ViewElement<any>> = {
    object: domainObject.name,
    docPathName: elementName,
    queryObjectId: queryObjectId,
    isEntity: domainObject.isEntity ?? false,
    domainObjectId: domainObject.vid,
    isCollection: isCollection,
    relationFromParent: undefined,
    subElements: undefined,
    isRecurseStartPoint: false
  };

  let subElementBuilders: Array<any> = [];

  
  const builder: ViewElementNonRecursive< DT, DO, PDO, EName, RT> = {
    withRelation: function (relation: GETRELSFORNAME<RelsFromDO<PDO>, NameOfDomainObject<DO>>): any {
      element.relationFromParent = relation as unknown as string; // runtime doesn't care about the actual relation object, just need to store something to indicate there is a relation
      return builderContext;
    },
    withDocPathName: function (docPathName: string): any {
      element.docPathName = docPathName;
      return builderContext;
    },
        withNamedSubElement:  <SubEName extends string, DO extends DomainObject<any, any, any>, IC extends TrueFalse>
      (name: SubEName, nextDomainObject: DO, isCollection: IC) => buildSubElement(queryIdsUsed, builder, subElementBuilders, false)
      (name, nextDomainObject, isCollection),

    withSubElement: <DO extends DomainObject<any, any, any>, IC extends TrueFalse>(
      innerDomainObject: DO,
      isCollection: IC
    ) => buildSubElement(queryIdsUsed, builder, subElementBuilders, false)
          <PathOfSingleDomainObject<DO>, DO, IC>
          (innerDomainObject.defaultDocPathName, innerDomainObject, isCollection),
    

     withRecursiveNamedSubElement:   <SubEName extends string, DO extends DomainObject<any, any, any>, IC extends TrueFalse>
      (name: SubEName, nextDomainObject: DO, isCollection: IC) => {
        element.isRecurseStartPoint = true; // mark this element as the start point of a recursive relationship
        return buildSubElement(queryIdsUsed, 
        builder, subElementBuilders, true)
      (name, nextDomainObject, isCollection)},

    withRecursiveSubElement: <DO extends DomainObject<any, any, any>, IC extends TrueFalse>(
      innerDomainObject: DO,
      isCollection: IC
    ) => {
      element.isRecurseStartPoint = true; // mark this element as the start point of a recursive relationship
      return buildSubElement(queryIdsUsed, builder, subElementBuilders, true)
          <PathOfSingleDomainObject<DO>, DO, IC>
          (innerDomainObject.defaultDocPathName, innerDomainObject, isCollection);
    },

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
  const builderContext: CNTX<ViewElementNonRecursive<DT, DO, PDO, EName, RT>, DT> = {
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

      const elementBuilder = createViewElementNonRecursiveBuilder(
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
  return  createViewBuilder<{}>(name);
} 
