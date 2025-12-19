import { BSDDTOf, CNTX, ContextOf, LDDTOf, RDDTOf, ReUiPlan, ReUiPlanElement, ReUiPlanElementSet, ReUiPlanExpressionProp, RSDDTOf, TDDTOf } from './ReUiPlan'
import type { FluxorProps } from '../fluxor/fluxorProps'
import { defaultDisplayMap } from '../fluxor/defaultDisplayMap'
import { ReComponentBinder, ReComponentReBinder } from '../components/ReComponentProps'
import { ComponentWrapper } from '../components/ReComponentWrapper'
import { FluxorData } from '../fluxor/fluxorData'
import { ExtensionOf, ComponentBuilderWithExt } from './ReUiPlanBuilder.extensions.generated';

// Re-export CNTX and type helpers for use in extensions
export type { CNTX, LDDTOf, RDDTOf, BSDDTOf, RSDDTOf, TDDTOf };

export type ContextAndRtOf<C extends CNTX, RT> = {
  __rt: () => RT
  __c: () => C
}

export type FluentSimple = { _fluentSimple: () => void }
export type FluentSubBuilder<SB> = { _fluentSubBuilder: () => SB }
export type FluentReturn = {}
export type FluentExtension = {}
// ============================================================================
// Helper Types
// ============================================================================

export type PropsOf<T extends ComponentWrapper<any>> =
  T extends ComponentWrapper<infer P> ? P : never;

export type DataOf<D extends FluxorData<any>> =
  D extends FluxorData<infer T> ? T : never;

export type ReBuilder = {
  build: <BS>(buildSettings: BS, dataDescriptor: FluxorData<any>) => any
}

export type ReExtensionBuilder<RT> = {
  _endExtension?: () => RT;
  _buildExtension?: <BS>(buildSettings: BS, extendedElement: any) => void;
}

export type ReNullExtension = {
   _buildExtension?: <BS>(buildSettings: BS, extendedElement: any) => void;
}



// ============================================================================
// Element Builder Quartet - Reusable pattern for configuring elements
// Used in showingItem, withRenderer, etc. - anywhere we accept an element
// ============================================================================

export type ElementBuilderQuartet<C extends CNTX, RT> = {
  fromElementBuilder: (builder: ReUiPlanComponentBuilder<any, any, any>) => RT;
  fromElementObject: (element: ReUiPlanElement) => RT;
  fromComponentElement: <T extends ComponentWrapper<any>>(component: T) =>
    ComponentBuilderWithExt<C, T, RT>;
  fromFluxorElement: () => ReUiPlanComponentBuilder<C, any, RT>;
};

// Helper to create a minimal builder for prebuilt elements
// All methods are no-ops that return self, satisfying the interface without doing work
function createPrebuiltElementBuilder<RT>(
  element: ReUiPlanElement,
  returnTo: RT
): ReUiPlanComponentBuilder<any, any, any> {
  const builder: any = {
    build: () => element,
    end: () => returnTo,
    endElement: returnTo
  };
  
  // All configuration methods are no-ops - element is already built
  const noOp = () => builder;
  builder.usingFluxor = noOp;
  builder.withHideWhenRule = noOp;
  builder.hide = noOp;
  builder.disable = noOp;
  builder.withDisableWhenRule = noOp;
  builder.withErrorCondition = noOp;
  builder.withHelperText = noOp;
  builder.withLabel = noOp;
  builder.withLabelPosition = noOp;
  builder.withDisplayMode = noOp;
  builder.withoutCollectionExpansion = noOp;
  builder.withDecorators = () => ({} as any);
  builder.withValueBinding = noOp;
  builder.withExtraBinding = noOp;
  builder.basedOnElementBuilder = noOp;
  builder.basedOnElement = noOp;
  builder.withComponentProps = noOp;
  builder.withTempVar = noOp;
  
  return builder as ReUiPlanComponentBuilder<any, any, any>;
}

// Factory to create the quartet - encapsulates the pattern
export function createElementBuilderQuartet<C extends CNTX, RT>(
  returnTo: RT,
  componentBuilders: ReUiPlanComponentBuilder<any, any, any>[],
  containedElementSetBuilders?: ReUiPlanElementSetBuilder<any, any>[],
  dataDescriptor?: FluxorData<any>
): ElementBuilderQuartet<C, RT> {
  return {
    fromElementBuilder: (componentBuilder: ReUiPlanComponentBuilder<any, any, any>): RT => {
      componentBuilders.push(componentBuilder);
      return returnTo;
    },
    fromElementObject: (element: ReUiPlanElement): RT => {
      componentBuilders.push(createPrebuiltElementBuilder(element, returnTo));
      return returnTo;
    },
    fromComponentElement: <T extends ComponentWrapper<any>>(component: T): ComponentBuilderWithExt<C, T, RT> =>
      CreateReUiPlanComponent(returnTo, component, componentBuilders, containedElementSetBuilders, dataDescriptor),
    fromFluxorElement: (): ReUiPlanComponentBuilder<C, any, RT> =>
      CreateReUiPlanComponent<C, any, RT>(returnTo, undefined, componentBuilders, containedElementSetBuilders, dataDescriptor)
  };
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
    usingFluxor<RDDT2 extends FluxorData<any>>(dataDescriptor: RDDT2, binding?: ReComponentReBinder<C, RDDT2>): ReUiPlanBuilderElementsOptions<CNTX<BSDDTOf<C>, RSDDTOf<C>, RDDT2, RDDT2, TDDTOf<C>>>
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
  showingItem: ElementBuilderQuartet<C, ReUiPlanElementSetBuilder<C, RT>>

  usingFluxor: <LDDT2 extends FluxorData<any>>(_dataDescriptor: LDDT2, binding?: ReComponentReBinder<C, LDDT2>) => ReUiPlanElementSetBuilder<CNTX<BSDDTOf<C>, RSDDTOf<C>, RDDTOf<C>, LDDT2, TDDTOf<C>>, RT>
 
  withSharedProps: () => ReUiPlanSharedPropsBuilder<C, ReUiPlanElementSetBuilder<C, RT>>

  endSet: RT

  build: <BS>(buildSettings: BS) => { components: ReUiPlanElementSet, sharedProps: ReUiPlanElement[] }
  end: () => RT
}

export interface ReUiPlanDecoratorSetBuilder<C extends CNTX, RT> extends ReBuilderBase<RT> {
  showing: ElementBuilderQuartet<C, ReUiPlanDecoratorSetBuilder<C, RT>>

  endDecoratorSet: RT

  build: <BS>(buildSettings: BS) => { components: ReUiPlanElementSet }
  end: () => RT
}


// ============================================================================
// ReUiPlanComponentBuilder - builds individual components
// Uses recursive type wrapping for proper stack unwinding
// ============================================================================

export interface ReUiPlanComponentBuilder<C extends CNTX, T extends ComponentWrapper<any>, RT> extends ReBuilderBase<RT> {
  usingFluxor: <LDDT2 extends FluxorData<any>>(_dataDescriptor: LDDT2, binding?: ReComponentReBinder<C, LDDT2>) => ComponentBuilderWithExt<CNTX<BSDDTOf<C>, RSDDTOf<C>, RDDTOf<C>, LDDT2, TDDTOf<C>>, T, RT>
  withHideWhenRule: (hidden: boolean | ReUiPlanExpressionProp<ContextOf<C>>) => ComponentBuilderWithExt<C, T, RT>
  hide: () => ComponentBuilderWithExt<C, T, RT>
  withDisableWhenRule: (disabled: boolean | ReUiPlanExpressionProp<ContextOf<C>>) => ComponentBuilderWithExt<C, T, RT>
  disable: () => ComponentBuilderWithExt<C, T, RT>
  withErrorCondition: (error: boolean | ReUiPlanExpressionProp<ContextOf<C>>) => ComponentBuilderWithExt<C, T, RT>
  withHelperText: (helperText: string | ReUiPlanExpressionProp<ContextOf<C>>) => ComponentBuilderWithExt<C, T, RT>
  withLabel: (label: string | ReUiPlanExpressionProp<ContextOf<C>>) => ComponentBuilderWithExt<C, T, RT>
  withLabelPosition: (labelPosition: 'top' | 'start' | 'end' | 'bottom' | ReUiPlanExpressionProp<ContextOf<C>>) => ComponentBuilderWithExt<C, T, RT>
  withDisplayMode: (displayMode: 'editing' | 'editable' | 'readonly' | ReUiPlanExpressionProp<ContextOf<C>>) => ComponentBuilderWithExt<C, T, RT>
  withoutCollectionExpansion: (isSingleChildForArrays: boolean) => ComponentBuilderWithExt<C, T, RT>
  withDecorators: () => ReUiPlanDecoratorSetBuilder<C, ComponentBuilderWithExt<C, T, RT>>
  withValueBinding: (binding: ReComponentBinder<DataOf<RDDTOf<C>>, DataOf<LDDTOf<C>>>) => ComponentBuilderWithExt<C, T, RT>
  withExtraBinding: (boundPropName: string, binding: ReComponentBinder<DataOf<RDDTOf<C>>, DataOf<LDDTOf<C>>>) => ComponentBuilderWithExt<C, T, RT>
  basedOnElementBuilder: (builder: ReUiPlanComponentBuilder<any, any, any>) => ComponentBuilderWithExt<C, T, RT>
  basedOnElement: (element: ReUiPlanElement) => ComponentBuilderWithExt<C, T, RT>
  // none: () => ComponentBuilderWithExt<C, T, RT>
  withComponentProps: (props: PropsOf<T>) => ComponentBuilderWithExt<C, T, RT>
  // For setting temporary variables in context
  withTempVar: <K extends string, V>(key: K, value: V) => ComponentBuilderWithExt<C, T, RT>
  build: <BS>(buildSettings: BS) => ReUiPlanElement
  endElement: RT
  end: () => RT
}

export interface ReUiPlanSharedPropsBuilder<C extends CNTX, RT> extends ReBuilderBase<RT> {
  usingFluxor: <LDDT2 extends FluxorData<any>>(_dataDescriptor: LDDT2, binding?: ReComponentReBinder<C, LDDT2>) => ReUiPlanSharedPropsBuilder<CNTX<BSDDTOf<C>, RSDDTOf<C>, RDDTOf<C>, LDDT2, TDDTOf<C>>, RT>
  withLabelPosition: (labelPosition: 'top' | 'start' | 'end' | 'bottom' | ReUiPlanExpressionProp<ContextOf<C>>) => ReUiPlanSharedPropsBuilder<C, RT>
  withDisplayMode: (displayMode: 'editing' | 'editable' | 'readonly' | ReUiPlanExpressionProp<ContextOf<C>>) => ReUiPlanSharedPropsBuilder<C, RT>
  withDecorators: () => ReUiPlanDecoratorSetBuilder<C, ReUiPlanSharedPropsBuilder<C, RT>>
  withComponentProps: <P>(props: P) => ReUiPlanSharedPropsBuilder<C, RT>

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
      usingFluxor: function <RDDT2 extends FluxorData<any>>(newDataDescriptor: RDDT2, binding?:  ReComponentReBinder<C, RDDT2>): ReUiPlanBuilderElementsOptions<CNTX<BSDDTOf<C>, RSDDTOf<C>, RDDT2, RDDT2, TDDTOf<C>>> {
        // Return options with the new context type - the builder cast is safe because 
        // we're just changing the type parameter, and the actual object is the same
        return getWithElementsOptions<CNTX<BSDDTOf<C>, RSDDTOf<C>, RDDT2, RDDT2, TDDTOf<C>>>(
          builder as unknown as ReUiPlanBuilder<CNTX<BSDDTOf<C>, RSDDTOf<C>, RDDT2, RDDT2, TDDTOf<C>>>, 
          newDataDescriptor
        );
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
  let componentBuilders: ReUiPlanComponentBuilder<any, any, any>[] = []
  let innerTypedElementBuilder: ReUiPlanElementSetBuilder<any, any> | undefined= undefined
  let sharedProps: ReUiPlanSharedPropsBuilder<any, any>[] = []

  const builder: ReUiPlanElementSetBuilder<C, RT> = {
    usingFluxor: function <LDDT2 extends FluxorData<any>>(innerDataDescriptor: LDDT2, binding?:  ReComponentReBinder<C, LDDT2>) {
      const newBuilder = CreateReUiPlanElementSet<CNTX<BSDDTOf<C>, RSDDTOf<C>, RDDTOf<C>, LDDT2, TDDTOf<C>>,  RT>(returnTo, elementSetBuilders, innerDataDescriptor);
      innerTypedElementBuilder = newBuilder
      return newBuilder
    },
    // Use the reusable quartet abstraction
    showingItem: {} as ElementBuilderQuartet<C, ReUiPlanElementSetBuilder<C, RT>>,
  
    withSharedProps: () => ({} as ReUiPlanSharedPropsBuilder<C, ReUiPlanElementSetBuilder<C, RT>>),
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
      if (innerTypedElementBuilder) {
        const innerElements = innerTypedElementBuilder.build(buildSettings);
        components.push(...innerElements.components);
        sharedPropsElements.push(...innerElements.sharedProps);
      }
      return { components: components as ReUiPlanElementSet, sharedProps: sharedPropsElements };
    },
    end: function () {
      return returnTo;
    }
  }

  builder.withSharedProps = () => CreateReUiSharedProps<C, ReUiPlanElementSetBuilder<C, RT>>(builder, componentBuilders.length, sharedProps, undefined, dataDescriptor);

  // Instantiate the quartet with proper return reference
  builder.showingItem = createElementBuilderQuartet<C, ReUiPlanElementSetBuilder<C, RT>>(
    builder,
    componentBuilders,
    undefined,
    dataDescriptor
  );

  elementSetBuilders.push(builder);

  return builder;
}


export function CreateReUiPlanDecoratorSet<C extends CNTX, RT>(
  returnTo: RT,
  decoratorSetBuilders: ReUiPlanDecoratorSetBuilder<any, any>[],
  dataDescriptor?: FluxorData<any>
): ReUiPlanDecoratorSetBuilder<C, RT> {
  let components: ReUiPlanElementSet = []
  let componentBuilders: ReUiPlanComponentBuilder<any, any, any>[] = []


  const builder: ReUiPlanDecoratorSetBuilder<C, RT> = {
    // Use the reusable quartet abstraction
    showing: {} as ElementBuilderQuartet<C, ReUiPlanDecoratorSetBuilder<C, RT>>,

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

  // Instantiate the quartet with proper return reference
  const containedElementSetBuilders: ReUiPlanElementSetBuilder<any, any>[] = [];
  builder.showing = createElementBuilderQuartet<C, ReUiPlanDecoratorSetBuilder<C, RT>>(
    builder,
    componentBuilders,
    containedElementSetBuilders,
    dataDescriptor
  );

  decoratorSetBuilders.push(builder);

  return builder;
}

export function CreateReUiPlanComponent<C extends CNTX, T extends ComponentWrapper<any>, RT>(
  returnTo: RT,
  componentWrapper?: T,
  set?: ReUiPlanComponentBuilder<any, any, any>[],
  childBuilders?: ReUiPlanElementSetBuilder<any, any>[],
  dataDescriptor?: FluxorData<any>
): ComponentBuilderWithExt<C, T, RT> {
  const reUiPlanComponent: ReUiPlanElement = {
    isReUIPlanElement: true,
    hidden: false,
    disabled: false,
    error: false,
    helperText: undefined,
    label: undefined,
    labelPosition: undefined,
    displayMode: undefined,
    decorators: [],
    componentName: componentWrapper?.displayName,
    binding: undefined,
    extraBindings: {},
    children: undefined,
    buildSettings: undefined,
    dataDescriptor: dataDescriptor
  } as ReUiPlanElement
  let innerTypedComponentBuilder: ReUiPlanComponentBuilder<any, any, any> | undefined = undefined;
  const decoratorSetBuilders: ReUiPlanDecoratorSetBuilder<any, any>[] = [];
  const basedOn: (ReUiPlanComponentBuilder<any, any, any> | ReUiPlanElement)[] = [];

  // Create the base builder first, then merge in extensions
  const builder: ComponentBuilderWithExt<C, T, RT> = {
    usingFluxor: function <LDDT2 extends FluxorData<any>>(innerDataDescriptor: LDDT2, binding?: ReComponentReBinder<C, LDDT2>) {
      const newBuilder = CreateReUiPlanComponent<CNTX<BSDDTOf<C>, RSDDTOf<C>, RDDTOf<C>, LDDT2, TDDTOf<C>>, T, RT>(returnTo, componentWrapper, set, childBuilders, innerDataDescriptor);
      innerTypedComponentBuilder = newBuilder
      return newBuilder
    },

    withHideWhenRule: function (hidden: boolean | ReUiPlanExpressionProp<ContextOf<C>>): ComponentBuilderWithExt<C, T, RT> {
      reUiPlanComponent.hidden = hidden;
      return builder;
    },
    hide: function (): ComponentBuilderWithExt<C, T, RT> {
      reUiPlanComponent.hidden = true;
      return builder;
    },
    disable: function (): ComponentBuilderWithExt<C, T, RT> {
      reUiPlanComponent.disabled = true;
      return builder;
    },
    withDisableWhenRule: function (disabled: boolean | ReUiPlanExpressionProp<ContextOf<C>>): ComponentBuilderWithExt<C, T, RT> {
      reUiPlanComponent.disabled = disabled;
      return builder;
    },
    withErrorCondition: function (error: boolean | ReUiPlanExpressionProp<ContextOf<C>>): ComponentBuilderWithExt<C, T, RT> {
      reUiPlanComponent.error = error;
      return builder;
    },
    withHelperText: function (helperText: string | ReUiPlanExpressionProp<ContextOf<C>>): ComponentBuilderWithExt<C, T, RT> {
      reUiPlanComponent.helperText = helperText;
      return builder;
    },
    withLabel: function (label: string | ReUiPlanExpressionProp<ContextOf<C>>): ComponentBuilderWithExt<C, T, RT> {
      reUiPlanComponent.label = label;
      return builder;
    },
    withLabelPosition: function (labelPosition: 'top' | 'start' | 'end' | 'bottom' | ReUiPlanExpressionProp<ContextOf<C>>): ComponentBuilderWithExt<C, T, RT> {
      reUiPlanComponent.labelPosition = labelPosition;
      return builder;
    },
    withDisplayMode: function (displayMode: 'editing' | 'editable' | 'readonly' | ReUiPlanExpressionProp<ContextOf<C>>): ComponentBuilderWithExt<C, T, RT> {
      reUiPlanComponent.displayMode = displayMode;
      return builder;
    },
    withoutCollectionExpansion: function (useSingleChildForArrays: boolean): ComponentBuilderWithExt<C, T, RT> {
      reUiPlanComponent.useSingleChildForArrays = useSingleChildForArrays;
      return builder;
    },
    withDecorators: () => {
      return CreateReUiPlanDecoratorSet<C, ReUiPlanComponentBuilder<C, T, RT>>(builder, decoratorSetBuilders, dataDescriptor);
      // decoratorSetBuilders.push(decoratorsetBuilder)
      // return decoratorsetBuilder;
    },

    withValueBinding: function (binding: ReComponentBinder<DataOf<RDDTOf<C>>, DataOf<LDDTOf<C>>>): ComponentBuilderWithExt<C, T, RT> {
      reUiPlanComponent.binding = binding;
      return builder;
    },
    withExtraBinding: function (boundPropName: string, binding: ReComponentBinder<DataOf<RDDTOf<C>>, DataOf<LDDTOf<C>>>): ComponentBuilderWithExt<C, T, RT> {
      if (!reUiPlanComponent.extraBindings) {
        reUiPlanComponent.extraBindings = {};
      }
      reUiPlanComponent.extraBindings[boundPropName] = binding;
      return builder;
    },
    basedOnElementBuilder: function (basebuilder: ReUiPlanComponentBuilder<any, any, any>): ComponentBuilderWithExt<C, T, RT> {
      basedOn.push(basebuilder);
      return builder;
    },
    basedOnElement: function (element: ReUiPlanElement): ComponentBuilderWithExt<C, T, RT> {
      basedOn.push(element);
      return builder;
    },
   
    withComponentProps: function (props: PropsOf<T>): ComponentBuilderWithExt<C, T, RT>{
      reUiPlanComponent.componentProps = props;
      return builder;
    },
    withTempVar: function <K extends string, V>(_key: K, _value: V): ComponentBuilderWithExt<C, T, RT> {
      // This would set a temp var in context at runtime
      // For now, just return builder - actual implementation would store in context
      return builder;
    },
    build: function <BS>(buildSettings: BS) {
      const builtComponent = { buildSettings } as ReUiPlanElement
      for (const bb of basedOn) {
        if (Object.keys(bb).includes('build')) {
          const baseElement = (bb as any).build(buildSettings);
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
      if (innerTypedComponentBuilder) {
        Object.assign(builtComponent, ReUiPlanElementToReComponentProps(innerTypedComponentBuilder.build(buildSettings)));
      }

      if (builder._buildExtension) {
        builder._buildExtension(buildSettings, builtComponent);
      }

      return builtComponent;
    },
    endElement: returnTo,
    end: function () {
      return returnTo;
    }
  } as ComponentBuilderWithExt<C, T, RT>;

  // If the component has an extension factory, call it and merge into builder
  // Pass dataDescriptor so TypeScript can infer TData from the actual value
  if (componentWrapper?.extensionFactory && dataDescriptor) {
    const extension = componentWrapper.extensionFactory<C, RT, typeof builder, typeof dataDescriptor>(returnTo, builder, dataDescriptor, {} as C);
    Object.assign(builder, extension);
  }

  if (set) {
    set.push(builder);
  }

  return builder;
}

export function CreateReUiSharedProps<C extends CNTX, RT>(
  returnTo: RT,
  fromComponentIndex: number,
  set?: ReUiPlanSharedPropsBuilder<any, any>[],
  childBuilders?: ReUiPlanElementSetBuilder<any, any>[],
  dataDescriptor?: FluxorData<any>
): ReUiPlanSharedPropsBuilder<C, RT> {
  const reUiPlanComponent: ReUiPlanElement = {
    isReUIPlanElement: true,
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
  let innerTypedComponentBuilders: ReUiPlanSharedPropsBuilder<any, any> | undefined = undefined;
  const basedOn: (ReUiPlanSharedPropsBuilder<any, any> | ReUiPlanElement)[] = [];
  const decoratorSetBuilders: ReUiPlanDecoratorSetBuilder<any, any>[] = [];

  const builder: ReUiPlanSharedPropsBuilder<C, RT> = {
    usingFluxor: function <LDDT2 extends FluxorData<any>>(innerDataDescriptor: LDDT2, binding?:  ReComponentReBinder<C, LDDT2>) {
      const newBuilder = CreateReUiSharedProps<CNTX<BSDDTOf<C>, RSDDTOf<C>, RDDTOf<C>, LDDT2, TDDTOf<C>>, RT>(returnTo, fromComponentIndex, set, childBuilders, innerDataDescriptor);
      innerTypedComponentBuilders = newBuilder
      return newBuilder
    },


    withLabelPosition: function (labelPosition: 'top' | 'start' | 'end' | 'bottom' | ReUiPlanExpressionProp<ContextOf<C>>): ReUiPlanSharedPropsBuilder<C, RT> {
      reUiPlanComponent.labelPosition = labelPosition;
      reUiPlanComponent.isUsed = true
      return builder;
    },
    withDisplayMode: function (displayMode: 'editing' | 'editable' | 'readonly' | ReUiPlanExpressionProp<ContextOf<C>>): ReUiPlanSharedPropsBuilder<C, RT> {
      reUiPlanComponent.displayMode = displayMode;
      reUiPlanComponent.isUsed = true
      return builder;
    },
    withDecorators: () => {
      return CreateReUiPlanDecoratorSet<C, ReUiPlanSharedPropsBuilder<C, RT>>(builder, decoratorSetBuilders, dataDescriptor);
      // decoratorSetBuilders.push(decoratorsetBuilder)
      // return decoratorsetBuilder;
    },
    withComponentProps: function <CP extends ComponentWrapper<any>>(props: PropsOf<CP>): ReUiPlanSharedPropsBuilder<C, RT> {
      reUiPlanComponent.componentProps = { ...(reUiPlanComponent.componentProps ?? {}), ...props };
      reUiPlanComponent.isUsed = true
      return builder;
    },

    build: function <BS>(buildSettings: BS) {
      const builtComponent = { buildSettings, isReUIPlanElement: true } as ReUiPlanElement
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
    isReUIPlanElement: element.isReUIPlanElement
  } as ReUiPlanElement;
}
