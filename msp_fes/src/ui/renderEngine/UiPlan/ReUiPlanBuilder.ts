import { BSDDTOf, CNTX, ContextOf, LDDTOf, RDDTOf, ReUiPlan, ReUiPlanElement, ReUiPlanElementSet, ReUiPlanElementShareableProps, ReUiPlanExpressionProp, RSDDTOf, TDDTOf, WithLDDT } from './ReUiPlan'
import type { FluxorProps } from '../fluxor/fluxorProps'
import { defaultDisplayMap } from '../fluxor/defaultDisplayMap'
import { ReComponentBinder } from '../components/ReComponentProps'
import { ComponentWrapper } from '../components/ReComponentWrapper'
import { FluxorData } from '../fluxor/fluxorData'


// ============================================================================
// Helper Types
// ============================================================================

export type PropsOf<T extends ComponentWrapper<any>> =
  T extends ComponentWrapper<infer P> ? P : never;

// ExtentionOf extracts the extension type E from ComponentWrapper
// The RT parameter is the base builder type - extension methods will return RT & ExtentionOf<T, RT>
export type ExtentionOf<T extends ComponentWrapper<any, any>, RT = unknown> =
  // 1. Extract E from ComponentWrapper<P, E>
  T extends ComponentWrapper<any, infer E> 
    // 2. Is E an object (has properties)?
    ? E extends object 
      // 3. Map over each key K in E
      ? { [K in keyof E]: 
          // 4. Is E[K] a function?
          E[K] extends ((...args: infer A) => any) 
            // 5. YES: Rewrite return type to RT & ExtentionOf<T, RT>
            ? (...args: A) => RT & ExtentionOf<T, RT> 
            // 6. NO: Keep property as-is
            : E[K] 
        }
      : E    // Not an object, return as-is
    : never; // Didn't match ComponentWrapper

// Full builder type with extension - used to properly type return values
export type ComponentBuilderWithExt<C extends CNTX, T extends ComponentWrapper<any, any>, P, RT> = 
  ReUiPlanComponentBuilder<C, T, P, RT> & ExtentionOf<T, ReUiPlanComponentBuilder<C, T, P, RT>>;

export type DataOf<D extends FluxorData<any>> =
  D extends FluxorData<infer T> ? T : never;

export type ReBuilder = {
  build: <BS>(buildSettings: BS) => any
}



// ============================================================================
// Base interface for all builders - provides end/build and stack unwinding
// T = the accumulated context stack type
// ============================================================================

export interface ReBuilderBase<T> {
  build: <BS>(buildSettings: BS) => any;
  end: () => T;
}

export interface ExtenderBase<T> {

  _none: () => T;
}

// ============================================================================
// ReUiPlanBuilder - top level plan builder
// ============================================================================

export type ReUiPlanBuilderElementsOptions<C extends CNTX> = {
  fromElementSetBuilder: (builder: ReUiPlanElementSetBuilder<C, ReUiPlanBuilder<C>>) => ReUiPlanBuilder<C>,
  fromElementSetObject: (set: ReUiPlanElementSet) => ReUiPlanBuilder<C>,
  fromInlineElementSet: ReUiPlanElementSetBuilder<C, ReUiPlanBuilder<C>>
}

export interface ReUiPlanBuilder<C extends CNTX> extends ReBuilderBase<undefined> {
  withDisplayTypeMap: (map: [string, string][]) => ReUiPlanBuilder<C>
  withRules: (rules: string[]) => ReUiPlanBuilder<C>
  withFluxorSet: (Fluxors: FluxorProps<any>[]) => ReUiPlanBuilder<C>
  withElementSet: {
    forDataDescribedBy<RDDT2 extends FluxorData<any>>(dataDescriptor: RDDT2): ReUiPlanBuilderElementsOptions<CNTX<BSDDTOf<C>, RSDDTOf<C>, RDDT2, RDDT2, TDDTOf<C>>>
  } & ReUiPlanBuilderElementsOptions<C>
  withDescription: (description: string) => ReUiPlanBuilder<C>
  BuildUiPlan: <BS>(buildSettings?: BS) => ReUiPlan
  end: () => undefined
  build: <BS>(buildSettings: BS) => ReUiPlan
}

// ============================================================================
// ReUiPlanElementSetBuilder - builds a set of elements
// Uses recursive pattern: each operation wraps current context in stack
// ============================================================================

export interface ReUiPlanElementSetBuilder<C extends CNTX, RT> extends ReBuilderBase<RT> {
  showingItem: {
    fromElementBuilder: (builder: ReUiPlanComponentBuilder<any, any, any, any>) => ReUiPlanElementSetBuilder<C, RT>,
    fromElementObject: (element: ReUiPlanElement) => ReUiPlanElementSetBuilder<C, RT>,
    fromInlineElementUsingComponent: <T extends ComponentWrapper<any, any>>(component: T) =>
      ComponentBuilderWithExt<C, T, PropsOf<T>, ReUiPlanElementSetBuilder<C, RT>>
    fromInlineElementUsingDataMap: () =>
      ReUiPlanComponentBuilder<C, any, any, ReUiPlanElementSetBuilder<C, RT>>
  }

  showingContainer: {
    fromContainerElementBuilder: (builder: ReUiPlanComponentBuilder<any, any, any, any>) => ReUiPlanElementSetBuilder<C, RT>,
    fromContainerElementObject: (element: ReUiPlanElement) => ReUiPlanElementSetBuilder<C, RT>,
    fromInlineContainerElementUsingComponent: <T extends ComponentWrapper<any, any>>(component: T) =>
      ComponentBuilderWithExt<C, T, PropsOf<T>, ReUiPlanElementContainerBuilder<C, RT>>
    fromInlineContainerElementUsingDataMap: () =>
      ReUiPlanComponentBuilder<C, any, any, ReUiPlanElementContainerBuilder<C, RT>>
  }

  withSharedProps: () => ReUiPlanSharedPropsBuilder<C, any, any, ReUiPlanElementSetBuilder<C, RT>>

  endSet: RT

  build: <BS>(buildSettings: BS) => { components: ReUiPlanElementSet, sharedProps: ReUiPlanElement[] }
  end: () => RT
}

export interface ReUiPlanDecoratorSetBuilder<C extends CNTX, RT> extends ReBuilderBase<RT> {
  showingContainer: {
    fromContainerElementBuilder: (builder: ReUiPlanComponentBuilder<any, any, any, any>) => ReUiPlanDecoratorSetBuilder<C, RT>,
    fromContainerElementObject: (element: ReUiPlanElement) => ReUiPlanDecoratorSetBuilder<C, RT>,
    fromInlineContainerElementUsingComponent: <T extends ComponentWrapper<any, any>>(component: T) =>
      ComponentBuilderWithExt<C, T, PropsOf<T>, ReUiPlanDecoratorSetBuilder<C, RT>>
    fromInlineContainerElementUsingDataMap: () =>
      ReUiPlanComponentBuilder<C, any, any, ReUiPlanDecoratorSetBuilder<C, RT>>
  }

  endDecoratorSet: RT

  build: <BS>(buildSettings: BS) => { components: ReUiPlanElementSet }
  end: () => RT
}


// ============================================================================
// ReUiPlanElementContainerBuilder - for container elements that hold child sets
// When entering a container, we can change LDDT (local data context)
// ============================================================================

export interface ReUiPlanElementContainerBuilder<C extends CNTX, RT> extends ReBuilderBase<RT> {
  containing: ReUiPlanElementSetBuilder<C, ReUiPlanElementSetBuilder<C, RT>>
  containingForDataDescribedBy: <LDDT2 extends FluxorData<any>>(_dataDescriptor: LDDT2) =>
    ReUiPlanElementSetBuilder<WithLDDT<C, LDDT2>, ReUiPlanElementSetBuilder<C, RT>>
  end: () => RT
}

// ============================================================================
// ReUiPlanComponentBuilder - builds individual components
// Uses recursive type wrapping for proper stack unwinding
// ============================================================================

export interface ReUiPlanComponentBuilder<C extends CNTX, T extends ComponentWrapper<any, any>, P, RT> extends ReBuilderBase<RT> {
  forDataDescribedBy: <LDDT2 extends FluxorData<any>>(_dataDescriptor: LDDT2) => ComponentBuilderWithExt<CNTX<BSDDTOf<C>, RSDDTOf<C>, RDDTOf<C>, LDDT2, TDDTOf<C>>, T, P, RT>
  withHideWhenRule: (hidden: boolean | ReUiPlanExpressionProp<ContextOf<C>>) => ComponentBuilderWithExt<C, T, P, RT>
  hide: () => ComponentBuilderWithExt<C, T, P, RT>
  withDisableWhenRule: (disabled: boolean | ReUiPlanExpressionProp<ContextOf<C>>) => ComponentBuilderWithExt<C, T, P, RT>
  disable: () => ComponentBuilderWithExt<C, T, P, RT>
  withErrorCondition: (error: boolean | ReUiPlanExpressionProp<ContextOf<C>>) => ComponentBuilderWithExt<C, T, P, RT>
  withHelperText: (helperText: string | ReUiPlanExpressionProp<ContextOf<C>>) => ComponentBuilderWithExt<C, T, P, RT>
  withLabel: (label: string | ReUiPlanExpressionProp<ContextOf<C>>) => ComponentBuilderWithExt<C, T, P, RT>
  withLabelPosition: (labelPosition: 'top' | 'start' | 'end' | 'bottom' | ReUiPlanExpressionProp<ContextOf<C>>) => ComponentBuilderWithExt<C, T, P, RT>
  withDisplayMode: (displayMode: 'editing' | 'editable' | 'readonly' | ReUiPlanExpressionProp<ContextOf<C>>) => ComponentBuilderWithExt<C, T, P, RT>
  withoutCollectionExpansion: (isSingleChildForArrays: boolean) => ComponentBuilderWithExt<C, T, P, RT>
  withDecorators: () => ReUiPlanDecoratorSetBuilder<C, ComponentBuilderWithExt<C, T, P, RT>>
  withValueBinding: (binding: ReComponentBinder<DataOf<RDDTOf<C>>, DataOf<LDDTOf<C>>>) => ComponentBuilderWithExt<C, T, P, RT>
  withExtraBinding: (boundPropName: string, binding: ReComponentBinder<DataOf<RDDTOf<C>>, DataOf<LDDTOf<C>>>) => ComponentBuilderWithExt<C, T, P, RT>
  basedOnElementBuilder: (builder: ReUiPlanComponentBuilder<any, any, any, any>) => ComponentBuilderWithExt<C, T, P, RT>
  basedOnElement: (element: ReUiPlanElement) => ComponentBuilderWithExt<C, T, P, RT>
  none: () => ComponentBuilderWithExt<C, T, P, RT>
  withComponentProps: (props: P) => ComponentBuilderWithExt<C, T, P, RT>
  // For setting temporary variables in context
  withTempVar: <K extends string, V>(key: K, value: V) => ComponentBuilderWithExt<C, T, P, RT>
  build: <BS>(buildSettings: BS) => ReUiPlanElement
  endElement: RT
  end: () => RT
}

export interface ReUiPlanSharedPropsBuilder<C extends CNTX, T, P, RT> extends ReBuilderBase<RT> {
  forDataDescribedBy: <LDDT2 extends FluxorData<any>>(_dataDescriptor: LDDT2) => ReUiPlanSharedPropsBuilder<CNTX<BSDDTOf<C>, RSDDTOf<C>, RDDTOf<C>, LDDT2, TDDTOf<C>>, T, P, RT>
  withLabelPosition: (labelPosition: 'top' | 'start' | 'end' | 'bottom' | ReUiPlanExpressionProp<ContextOf<C>>) => ReUiPlanSharedPropsBuilder<C, T, P, RT>
  withDisplayMode: (displayMode: 'editing' | 'editable' | 'readonly' | ReUiPlanExpressionProp<ContextOf<C>>) => ReUiPlanSharedPropsBuilder<C, T, P, RT>
  withDecorators: () => ReUiPlanDecoratorSetBuilder<C, ReUiPlanSharedPropsBuilder<C, T, P, RT>>
  withComponentProps: <P>(props: P) => ReUiPlanSharedPropsBuilder<C, T, P, RT>

  build: <BS>(buildSettings: BS) => ReUiPlanElement
  endSharedProps: RT
  end: () => RT
}

// ============================================================================
// Factory Functions
// ============================================================================

export function CreateReUiPlan<C extends CNTX = CNTX>(name: string, version?: string): ReUiPlanBuilder<C> {
  const reUiPlan = {
    id: name,
    name: name,
    description: '',
    version: version ?? 'default',
    displayTypeMap: defaultDisplayMap,
    rules: [],
    fluxors: [],
    mainPlanElementSet: [],
    sharedProps: [],
    buildSettings: undefined,
    dataDescriptor: undefined
  } as ReUiPlan

  let mainPlainElementSetBuilders: ReUiPlanElementSetBuilder<any, any>[] = [];

  function getWithElementsOptions<C2 extends CNTX>(returnTo: ReUiPlanBuilder<C2>, dataDescriptor?: FluxorData<any>): ReUiPlanBuilderElementsOptions<C2> {
    return {
      fromElementSetBuilder: function (elementSetBuilder: ReUiPlanElementSetBuilder<any, any>): ReUiPlanBuilder<C2> {
        mainPlainElementSetBuilders.push(elementSetBuilder);
        return returnTo;
      },
      fromElementSetObject: function (set: ReUiPlanElementSet): ReUiPlanBuilder<C2> {
        if (!reUiPlan.mainPlanElementSet) {
          reUiPlan.mainPlanElementSet = [];
        }
        reUiPlan.mainPlanElementSet.push(...set);
        return returnTo;
      },
      fromInlineElementSet: CreateReUiPlanElementSet<C2, ReUiPlanBuilder<C2>>(returnTo, mainPlainElementSetBuilders, dataDescriptor)
    }
  }

  const builder: ReUiPlanBuilder<C> = {
    withElementSet: {
      forDataDescribedBy: function <RDDT2 extends FluxorData<any>>(newDataDescriptor: RDDT2) {
        type NewC = CNTX<BSDDTOf<C>, RSDDTOf<C>, RDDT2, RDDT2, TDDTOf<C>>;
        return getWithElementsOptions<NewC>(builder as any, newDataDescriptor);
      },
      ...(getWithElementsOptions<C>({} as ReUiPlanBuilder<C>))
    },

    withDisplayTypeMap: function (map: [string, string][]) {
      reUiPlan.displayTypeMap = map;
      return builder;
    },
    withRules: function (rules: string[]) {
      reUiPlan.rules = rules;
      return builder;
    },
    withFluxorSet: function (Fluxors: FluxorProps<any>[]) {
      reUiPlan.fluxors = Fluxors;
      return builder;
    },
    withDescription: function (description: string) {
      reUiPlan.description = description;
      return builder;
    },
    BuildUiPlan: function <BS>(buildSettings: BS) {
      for (const esb of mainPlainElementSetBuilders) {
        const elements = esb.build(buildSettings);
        if (!reUiPlan.mainPlanElementSet) {
          reUiPlan.mainPlanElementSet = [];
        }
        reUiPlan.mainPlanElementSet.push(...elements.components);
        reUiPlan.sharedProps?.push(...((elements.sharedProps ?? []).filter(sp => sp && sp.isUsed)));
      }
      reUiPlan.buildSettings = buildSettings;
      return reUiPlan;
    },
    build: function <BS>(_buildSettings: BS) { console.log('Use BuildUiPlan instead of build'); return reUiPlan; },
    end: function () {
      return undefined;
    }
  }

  // Patch up circular reference
  Object.assign(builder.withElementSet, getWithElementsOptions<C>(builder));

  return builder;
}

export function CreateReUiPlanElementSet<C extends CNTX, RT>(
  returnTo: RT,
  elementSetBuilders: ReUiPlanElementSetBuilder<any, any>[],
  dataDescriptor?: FluxorData<any>
): ReUiPlanElementSetBuilder<C, RT> {
  let components: ReUiPlanElementSet = []
  let componentBuilders: ReUiPlanComponentBuilder<any, any, any, any>[] = []
  let sharedProps: ReUiPlanSharedPropsBuilder<any, any, any, any>[] = []

  const builder: ReUiPlanElementSetBuilder<C, RT> = {
    showingItem: {
      fromElementBuilder: (componentBuilder: ReUiPlanComponentBuilder<any, any, any, any>): ReUiPlanElementSetBuilder<C, RT> => {
        componentBuilders.push(componentBuilder);
        return builder;
      },
      fromElementObject: (element: ReUiPlanElement): ReUiPlanElementSetBuilder<C, RT> => {
        components.push({ componentName: element.componentName, options: element });
        return builder;
      },
      fromInlineElementUsingComponent: <T extends ComponentWrapper<any, any>>(component: T): ReUiPlanComponentBuilder<C, T, PropsOf<T>, ReUiPlanElementSetBuilder<C, RT>> & ExtentionOf<T> =>
        CreateReUiPlanComponent<C, T, PropsOf<T>, ReUiPlanElementSetBuilder<C, RT>>({} as ReUiPlanElementSetBuilder<C, RT>, component.displayName, componentBuilders, undefined, dataDescriptor),
      fromInlineElementUsingDataMap: (): ReUiPlanComponentBuilder<C, any, any, ReUiPlanElementSetBuilder<C, RT>> =>
        CreateReUiPlanComponent<C, any, any, ReUiPlanElementSetBuilder<C, RT>>({} as ReUiPlanElementSetBuilder<C, RT>, '', componentBuilders, undefined, dataDescriptor),
    },
    showingContainer: {
      fromContainerElementBuilder: (componentBuilder: ReUiPlanComponentBuilder<any, any, any, any>): ReUiPlanElementSetBuilder<C, RT> => {
        componentBuilders.push(componentBuilder);
        return builder;
      },
      fromContainerElementObject: (element: ReUiPlanElement): ReUiPlanElementSetBuilder<C, RT> => {
        components.push({ componentName: element.componentName, options: element });
        return builder;
      },
      fromInlineContainerElementUsingComponent: <T extends ComponentWrapper<any>>(component: T): ReUiPlanComponentBuilder<C, T, PropsOf<T>, ReUiPlanElementContainerBuilder<C, RT>> & ExtentionOf<T> =>
        CreateReUiPlanComponent<C, T, PropsOf<T>, ReUiPlanElementContainerBuilder<C, RT>>({} as ReUiPlanElementContainerBuilder<C, RT>, component.displayName, componentBuilders),
      fromInlineContainerElementUsingDataMap: (): ReUiPlanComponentBuilder<C, any, any, ReUiPlanElementContainerBuilder<C, RT>> =>
        CreateReUiPlanComponent<C, any, any, ReUiPlanElementContainerBuilder<C, RT>>({} as ReUiPlanElementContainerBuilder<C, RT>, '', componentBuilders)
    },
    withSharedProps: () => ({} as ReUiPlanSharedPropsBuilder<C, any, any, ReUiPlanElementSetBuilder<C, RT>>),
    endSet: returnTo,
    build: function <BS>(buildSettings: BS) {
      for (const cb of componentBuilders) {
        const element = cb.build(buildSettings);
        components.push({ componentName: element.componentName, options: { ...element, ...element.componentProps }, containing: element.children });
      }
      const sharedPropsElements: ReUiPlanElement[] = [];
      for (const spb of sharedProps) {
        const spElement = spb.build(buildSettings);
        sharedPropsElements.push(spElement);
      }
      return { components: components as ReUiPlanElementSet, sharedProps: sharedPropsElements };
    },
    end: function () {
      return returnTo;
    }
  }

  builder.withSharedProps = () => CreateReUiSharedProps<C, any, any, ReUiPlanElementSetBuilder<C, RT>>(builder, componentBuilders.length, sharedProps, undefined, dataDescriptor);

  // Patch up inline methods with proper return references
  builder.showingItem.fromInlineElementUsingComponent = <T extends ComponentWrapper<any>>(component: T): ReUiPlanComponentBuilder<C, T, PropsOf<T>, ReUiPlanElementSetBuilder<C, RT>>  & ExtentionOf<T> =>
    CreateReUiPlanComponent<C, T, PropsOf<T>, ReUiPlanElementSetBuilder<C, RT>>(builder, component.displayName, componentBuilders, undefined, dataDescriptor);

  builder.showingItem.fromInlineElementUsingDataMap = (): ReUiPlanComponentBuilder<C, any, any, ReUiPlanElementSetBuilder<C, RT>> =>
    CreateReUiPlanComponent<C, any, any, ReUiPlanElementSetBuilder<C, RT>>(builder, '', componentBuilders, undefined, dataDescriptor);

  builder.showingContainer.fromInlineContainerElementUsingComponent = <T extends ComponentWrapper<any>>(component: T): ReUiPlanComponentBuilder<C, T, PropsOf<T>, ReUiPlanElementContainerBuilder<C, RT>>  & ExtentionOf<T> => {
    const containedElementSetBuilders: ReUiPlanElementSetBuilder<any, any>[] = [];
    const containerBuilder = CreateReUiPlanElementContainer<C, RT>(builder, containedElementSetBuilders, dataDescriptor);
    return CreateReUiPlanComponent<C, T, PropsOf<T>, ReUiPlanElementContainerBuilder<C, RT>>(containerBuilder, component.displayName, componentBuilders, containedElementSetBuilders, dataDescriptor);
  }

  builder.showingContainer.fromInlineContainerElementUsingDataMap = (): ReUiPlanComponentBuilder<C, any, any, ReUiPlanElementContainerBuilder<C, RT>> => {
    const containedElementSetBuilders: ReUiPlanElementSetBuilder<any, any>[] = [];
    const containerBuilder = CreateReUiPlanElementContainer<C, RT>(builder, containedElementSetBuilders, dataDescriptor);
    return CreateReUiPlanComponent<C, any, any, ReUiPlanElementContainerBuilder<C, RT>>(containerBuilder, '', componentBuilders, containedElementSetBuilders, dataDescriptor);
  }

  elementSetBuilders.push(builder);

  return builder;
}


export function CreateReUiPlanDecoratorSet<C extends CNTX, RT>(
  returnTo: RT,
  decoratorSetBuilders: ReUiPlanDecoratorSetBuilder<any, any>[],
  dataDescriptor?: FluxorData<any>
): ReUiPlanDecoratorSetBuilder<C, RT> {
  let components: ReUiPlanElementSet = []
  let componentBuilders: ReUiPlanComponentBuilder<any, any, any, any>[] = []


  const builder: ReUiPlanDecoratorSetBuilder<C, RT> = {

    showingContainer: {
      fromContainerElementBuilder: (componentBuilder: ReUiPlanComponentBuilder<any, any, any, any>): ReUiPlanDecoratorSetBuilder<C, RT> => {
        componentBuilders.push(componentBuilder);
        return builder;
      },
      fromContainerElementObject: (element: ReUiPlanElement): ReUiPlanDecoratorSetBuilder<C, RT> => {
        components.push({ componentName: element.componentName, options: element });
        return builder;
      },
      fromInlineContainerElementUsingComponent: <T extends ComponentWrapper<any>>(component: T): ReUiPlanComponentBuilder<C, T, PropsOf<T>, ReUiPlanDecoratorSetBuilder<C, RT>>  & ExtentionOf<T>=>
        CreateReUiPlanComponent<C, T, PropsOf<T>, ReUiPlanDecoratorSetBuilder<C, RT>>({} as ReUiPlanDecoratorSetBuilder<C, RT>, component.displayName, componentBuilders),
      fromInlineContainerElementUsingDataMap: (): ReUiPlanComponentBuilder<C, any, any, ReUiPlanDecoratorSetBuilder<C, RT>> =>
        CreateReUiPlanComponent<C, any, any, ReUiPlanDecoratorSetBuilder<C, RT>>({} as ReUiPlanDecoratorSetBuilder<C, RT>, '', componentBuilders)
    },

    endDecoratorSet: returnTo,
    build: function <BS>(buildSettings: BS) {
      for (const cb of componentBuilders) {
        const element = cb.build(buildSettings);
        components.push({ componentName: element.componentName, options: { ...element, ...element.componentProps }, containing: element.children });
      }


      return { components: components as ReUiPlanElementSet };
    },
    end: function () {
      return returnTo;
    }
  }

  builder.showingContainer.fromInlineContainerElementUsingComponent = <T extends ComponentWrapper<any>>(component: T): ReUiPlanComponentBuilder<C, T, PropsOf<T>, ReUiPlanDecoratorSetBuilder<C, RT>>  & ExtentionOf<T>=> {
    const containedElementSetBuilders: ReUiPlanElementSetBuilder<any, any>[] = [];

    return CreateReUiPlanComponent<C, T, PropsOf<T>, ReUiPlanDecoratorSetBuilder<C, RT>>(builder, component.displayName, componentBuilders, containedElementSetBuilders, dataDescriptor);
  }

  builder.showingContainer.fromInlineContainerElementUsingDataMap = (): ReUiPlanComponentBuilder<C, any, any, ReUiPlanDecoratorSetBuilder<C, RT>> => {
    const containedElementSetBuilders: ReUiPlanElementSetBuilder<any, any>[] = [];

    return CreateReUiPlanComponent<C, any, any, ReUiPlanDecoratorSetBuilder<C, RT>>(builder, '', componentBuilders, containedElementSetBuilders, dataDescriptor);
  }

  decoratorSetBuilders.push(builder);

  return builder;
}

export function CreateReUiPlanElementContainer<C extends CNTX, RT>(
  returnTo: ReUiPlanElementSetBuilder<C, RT>,
  elementSetBuilders: ReUiPlanElementSetBuilder<any, any>[],
  dataDescriptor?: FluxorData<any>
): ReUiPlanElementContainerBuilder<C, RT> {
  return {
    containing: CreateReUiPlanElementSet<C, ReUiPlanElementSetBuilder<C, RT>>(returnTo, elementSetBuilders, dataDescriptor),
    containingForDataDescribedBy: function <LDDT2 extends FluxorData<any>>(newDataDescriptor: LDDT2) {
      type NewC = WithLDDT<C, LDDT2>;
      return CreateReUiPlanElementSet<NewC, ReUiPlanElementSetBuilder<C, RT>>(returnTo as any, elementSetBuilders, newDataDescriptor);
    },
    build: function <BS>(_buildSettings: BS) {
      return {};
    },
    end: function () {
      return returnTo.endSet;
    }
  } as ReUiPlanElementContainerBuilder<C, RT>;
}

export function CreateReUiPlanComponent<C extends CNTX, T extends ComponentWrapper<any, any>, P, RT>(
  returnTo: RT,
  name?: string,
  set?: ReUiPlanComponentBuilder<any, any, any, any>[],
  childBuilders?: ReUiPlanElementSetBuilder<any, any>[],
  dataDescriptor?: FluxorData<any>
): ComponentBuilderWithExt<C, T, P, RT> {
  const reUiPlanComponent: ReUiPlanElement = {
    hidden: false,
    disabled: false,
    error: false,
    helperText: undefined,
    label: undefined,
    labelPosition: undefined,
    displayMode: undefined,
    decorators: [],
    componentName: name,
    binding: undefined,
    extraBindings: {},
    children: undefined,
    buildSettings: undefined,
    dataDescriptor: dataDescriptor
  } as ReUiPlanElement
  let innerTypedComponentBuilders: ReUiPlanComponentBuilder<any, any, any, any> | undefined = undefined;
  const decoratorSetBuilders: ReUiPlanDecoratorSetBuilder<any, any>[] = [];
  const basedOn: (ReUiPlanComponentBuilder<any, any, any, any> | ReUiPlanElement)[] = [];

   const extention: ExtentionOf<T> = {} as ExtentionOf<T>;

  const builder: ComponentBuilderWithExt<C, T, P, RT> = {
    ...extention,
    forDataDescribedBy: function <LDDT2 extends FluxorData<any>>(innerDataDescriptor: LDDT2) {
      const newBuilder = CreateReUiPlanComponent<CNTX<BSDDTOf<C>, RSDDTOf<C>, RDDTOf<C>, LDDT2, TDDTOf<C>>, T, P, RT>(returnTo, name, set, childBuilders, innerDataDescriptor);
      innerTypedComponentBuilders = newBuilder
      return newBuilder
    },

    withHideWhenRule: function (hidden: boolean | ReUiPlanExpressionProp<ContextOf<C>>): ComponentBuilderWithExt<C, T, P, RT> {
      reUiPlanComponent.hidden = hidden;
      return builder;
    },
    hide: function (): ComponentBuilderWithExt<C, T, P, RT> {
      reUiPlanComponent.hidden = true;
      return builder;
    },
    disable: function (): ComponentBuilderWithExt<C, T, P, RT> {
      reUiPlanComponent.disabled = true;
      return builder;
    },
    withDisableWhenRule: function (disabled: boolean | ReUiPlanExpressionProp<ContextOf<C>>): ComponentBuilderWithExt<C, T, P, RT> {
      reUiPlanComponent.disabled = disabled;
      return builder;
    },
    withErrorCondition: function (error: boolean | ReUiPlanExpressionProp<ContextOf<C>>): ComponentBuilderWithExt<C, T, P, RT> {
      reUiPlanComponent.error = error;
      return builder;
    },
    withHelperText: function (helperText: string | ReUiPlanExpressionProp<ContextOf<C>>): ComponentBuilderWithExt<C, T, P, RT> {
      reUiPlanComponent.helperText = helperText;
      return builder;
    },
    withLabel: function (label: string | ReUiPlanExpressionProp<ContextOf<C>>): ComponentBuilderWithExt<C, T, P, RT> {
      reUiPlanComponent.label = label;
      return builder;
    },
    withLabelPosition: function (labelPosition: 'top' | 'start' | 'end' | 'bottom' | ReUiPlanExpressionProp<ContextOf<C>>): ComponentBuilderWithExt<C, T, P, RT> {
      reUiPlanComponent.labelPosition = labelPosition;
      return builder;
    },
    withDisplayMode: function (displayMode: 'editing' | 'editable' | 'readonly' | ReUiPlanExpressionProp<ContextOf<C>>): ComponentBuilderWithExt<C, T, P, RT> {
      reUiPlanComponent.displayMode = displayMode;
      return builder;
    },
    withoutCollectionExpansion: function (useSingleChildForArrays: boolean): ComponentBuilderWithExt<C, T, P, RT> {
      reUiPlanComponent.useSingleChildForArrays = useSingleChildForArrays;
      return builder;
    },
    withDecorators: () => {
      return CreateReUiPlanDecoratorSet<C, ReUiPlanComponentBuilder<C, T, P, RT>>(builder, decoratorSetBuilders, dataDescriptor);
      // decoratorSetBuilders.push(decoratorsetBuilder)
      // return decoratorsetBuilder;
    },

    withValueBinding: function (binding: ReComponentBinder<DataOf<RDDTOf<C>>, DataOf<LDDTOf<C>>>): ComponentBuilderWithExt<C, T, P, RT> {
      reUiPlanComponent.binding = binding;
      return builder;
    },
    withExtraBinding: function (boundPropName: string, binding: ReComponentBinder<DataOf<RDDTOf<C>>, DataOf<LDDTOf<C>>>): ComponentBuilderWithExt<C, T, P, RT> {
      if (!reUiPlanComponent.extraBindings) {
        reUiPlanComponent.extraBindings = {};
      }
      reUiPlanComponent.extraBindings[boundPropName] = binding;
      return builder;
    },
    basedOnElementBuilder: function (basebuilder: ReUiPlanComponentBuilder<any, any, any, any>): ComponentBuilderWithExt<C, T, P, RT> {
      basedOn.push(basebuilder);
      return builder;
    },
    basedOnElement: function (element: ReUiPlanElement): ComponentBuilderWithExt<C, T, P, RT> {
      basedOn.push(element);
      return builder;
    },
    none: function (): ComponentBuilderWithExt<C, T, P, RT> {
      reUiPlanComponent.hidden = false;
      reUiPlanComponent.disabled = false;
      reUiPlanComponent.error = false;
      reUiPlanComponent.helperText = undefined;
      reUiPlanComponent.label = undefined;
      reUiPlanComponent.decorators = [];
      reUiPlanComponent.binding = undefined;
      reUiPlanComponent.extraBindings = {};
      return builder;
    },
    withComponentProps: function (props: P): ComponentBuilderWithExt<C, T, P, RT>{
      reUiPlanComponent.componentProps = props;
      return builder;
    },
    withTempVar: function <K extends string, V>(_key: K, _value: V): ComponentBuilderWithExt<C, T, P, RT> {
      // This would set a temp var in context at runtime
      // For now, just return builder - actual implementation would store in context
      return builder;
    },
    build: function <BS>(buildSettings: BS) {
      const builtComponent = { buildSettings }
      for (const bb of basedOn) {
        if (Object.keys(bb).includes('build')) {
          const baseElement = (bb as any).build();
          Object.assign(builtComponent, ReUiPlanElementToReComponentProps(baseElement));
        } else {
          Object.assign(builtComponent, ReUiPlanElementToReComponentProps(bb as ReUiPlanElement));
        }
      }

      if (childBuilders && childBuilders.length > 0) {
        const childElements: ReUiPlanElementSet = [];
        const sharedPropsElements: ReUiPlanElement[] = [];
        for (const cb of childBuilders) {
          const built = cb.build(buildSettings);
          childElements.push(...built.components);
          sharedPropsElements.push(...(built.sharedProps.filter(sp => sp.isUsed)));
        }
        reUiPlanComponent.children = childElements;
        reUiPlanComponent.sharedProps = sharedPropsElements;
      }
      reUiPlanComponent.decorators = decoratorSetBuilders.flatMap(dsBuilder => {
        const dsBuilt = dsBuilder.build(buildSettings);
        return dsBuilt.components.map(c => ReUiPlanElementToReComponentProps(c.options));
      });
      Object.assign(builtComponent, ReUiPlanElementToReComponentProps(reUiPlanComponent));
      if (innerTypedComponentBuilders) {
        Object.assign(builtComponent, ReUiPlanElementToReComponentProps(innerTypedComponentBuilders.build(buildSettings)));
      }
      return builtComponent;
    },
    endElement: returnTo,
    end: function () {
      return returnTo;
    }
  }

  if (set) {
    set.push(builder);
  }

  return builder;
}

export function CreateReUiSharedProps<C extends CNTX, T, P, RT>(
  returnTo: RT,
  fromComponentIndex: number,
  set?: ReUiPlanSharedPropsBuilder<any, any, any, any>[],
  childBuilders?: ReUiPlanElementSetBuilder<any, any>[],
  dataDescriptor?: FluxorData<any>
): ReUiPlanSharedPropsBuilder<C, T, P, RT> {
  const reUiPlanComponent: ReUiPlanElement = {
    hidden: false,
    disabled: false,
    error: false,
    helperText: undefined,
    label: undefined,
    labelPosition: undefined,
    displayMode: undefined,
    decorators: [],
    componentName: undefined,
    binding: undefined,
    extraBindings: {},
    children: undefined,
    buildSettings: undefined,
    dataDescriptor: dataDescriptor
  } as ReUiPlanElement
  let innerTypedComponentBuilders: ReUiPlanSharedPropsBuilder<any, any, any, any> | undefined = undefined;
  const basedOn: (ReUiPlanSharedPropsBuilder<any, any, any, any> | ReUiPlanElement)[] = [];
  const decoratorSetBuilders: ReUiPlanDecoratorSetBuilder<any, any>[] = [];

  const builder: ReUiPlanSharedPropsBuilder<C, T, P, RT> = {
    forDataDescribedBy: function <LDDT2 extends FluxorData<any>>(innerDataDescriptor: LDDT2) {
      const newBuilder = CreateReUiSharedProps<CNTX<BSDDTOf<C>, RSDDTOf<C>, RDDTOf<C>, LDDT2, TDDTOf<C>>, T, P, RT>(returnTo, fromComponentIndex, set, childBuilders, innerDataDescriptor);
      innerTypedComponentBuilders = newBuilder
      return newBuilder
    },


    withLabelPosition: function (labelPosition: 'top' | 'start' | 'end' | 'bottom' | ReUiPlanExpressionProp<ContextOf<C>>): ReUiPlanSharedPropsBuilder<C, T, P, RT> {
      reUiPlanComponent.labelPosition = labelPosition;
      reUiPlanComponent.isUsed = true
      return builder;
    },
    withDisplayMode: function (displayMode: 'editing' | 'editable' | 'readonly' | ReUiPlanExpressionProp<ContextOf<C>>): ReUiPlanSharedPropsBuilder<C, T, P, RT> {
      reUiPlanComponent.displayMode = displayMode;
      reUiPlanComponent.isUsed = true
      return builder;
    },
    withDecorators: () => {
      return CreateReUiPlanDecoratorSet<C, ReUiPlanSharedPropsBuilder<C, T, P, RT>>(builder, decoratorSetBuilders, dataDescriptor);
      // decoratorSetBuilders.push(decoratorsetBuilder)
      // return decoratorsetBuilder;
    },
    withComponentProps: function <CP extends ComponentWrapper<any>>(props: PropsOf<CP>): ReUiPlanSharedPropsBuilder<C, T, P, RT> {
      reUiPlanComponent.componentProps = { ...(reUiPlanComponent.componentProps ?? {}), ...props };
      reUiPlanComponent.isUsed = true
      return builder;
    },

    build: function <BS>(buildSettings: BS) {
      const builtComponent = { buildSettings }
      for (const bb of basedOn) {
        if (Object.keys(bb).includes('build')) {
          const baseElement = (bb as any).build();
          Object.assign(builtComponent, ReUiPlanElementToReComponentProps(baseElement));
        } else {
          Object.assign(builtComponent, ReUiPlanElementToReComponentProps(bb as ReUiPlanElement));
        }
      }

      if (childBuilders && childBuilders.length > 0) {
        const childElements: ReUiPlanElementSet = [];
        const sharedPropsElements: ReUiPlanElement[] = [];
        for (const cb of childBuilders) {
          const built = cb.build(buildSettings);
          childElements.push(...built.components);
          sharedPropsElements.push(...(built.sharedProps.filter(sp => sp.isUsed)));
        }

        reUiPlanComponent.children = childElements;
        reUiPlanComponent.sharedProps = sharedPropsElements;
      }

      reUiPlanComponent.decorators = decoratorSetBuilders.flatMap(dsBuilder => {
        const dsBuilt = dsBuilder.build(buildSettings);
        return dsBuilt.components.map(c => ReUiPlanElementToReComponentProps(c.options));
      });
      Object.assign(builtComponent, ReUiPlanElementToReComponentProps(reUiPlanComponent));
      if (innerTypedComponentBuilders) {
        Object.assign(builtComponent, ReUiPlanElementToReComponentProps(innerTypedComponentBuilders.build(buildSettings)));
      }
      (builtComponent as any).fromComponentIndex = fromComponentIndex;
      return builtComponent;
    },
    endSharedProps: returnTo,
    end: function () {
      return returnTo;
    }
  }

  if (set) {
    set.push(builder);
  }

  return builder;
}

export function ReUiPlanElementToReComponentProps(element: ReUiPlanElement): ReUiPlanElement {
  return {
    hidden: element.hidden,
    disabled: element.disabled,
    error: element.error,
    helperText: element.helperText,
    label: element.label,
    binding: element.binding,
    extraBindings: element.extraBindings,
    useSingleChildForArrays: element.useSingleChildForArrays,
    decorators: element.decorators,
    componentName: element.componentName,
    componentProps: element.componentProps,
    dataDescriptor: element.dataDescriptor,
    children: element.children,
    sharedProps: element.sharedProps,
    buildSettings: element.buildSettings,
    displayMode: element.displayMode,
    labelPosition: element.labelPosition,
    fromComponentIndex: element.fromComponentIndex,
    isUsed: element.isUsed,
  } as ReUiPlanElement;
}
