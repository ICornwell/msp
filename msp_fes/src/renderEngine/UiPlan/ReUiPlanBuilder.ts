import { ReUiPlan, ReUiPlanElement, ReUiPlanElementSet, ReUiPlanExpressionProp } from './ReUiPlan'
import type { FluxorProps } from '../fluxor/fluxorProps'
import { defaultDisplayMap } from '../fluxor/defaultDisplayMap'
import { ReComponentAttributeBinder, ReComponentBinder, ReComponentRecordBinder } from '../components/ReComponentProps'

export type ReUiPlanBuilder = {
  withSchema: (schemas: string[]) => ReUiPlanBuilder
  withDisplayTypeMap: (map: [string, string][]) => ReUiPlanBuilder
  withRules: (rules: string[]) => ReUiPlanBuilder
  withFluxorSet: (Fluxors: FluxorProps[]) => ReUiPlanBuilder
  withMainPlanElementSet: (mainPlanElementSet: ReUiPlanElementSetBuilder) => ReUiPlanBuilder
  withDescription: (description: string) => ReUiPlanBuilder
  build: () => ReUiPlan
}

export function CreateReUiPlan(name: string, version?: string): ReUiPlanBuilder {
  const reUiPlan = {
    id: name,
    name: name,
    description: '',
    version: version ?? 'default',
    schemas: undefined,
    displayTypeMap: defaultDisplayMap,
    rules: [],
    fluxors: [],
    mainPlanElementSet:  undefined
  } as ReUiPlan
  return {
    withSchema: function (schemas: string[]) {
      reUiPlan.schemas = schemas;
      return this;
    },
    withDisplayTypeMap: function (map: [string, string][]) {
      reUiPlan.displayTypeMap = map;
      return this;
    }
    , withRules: function (rules: string[]) {
      reUiPlan.rules = rules;
      return this;
    }
    , withFluxorSet: function (Fluxors: FluxorProps[]) {
      reUiPlan.fluxors = Fluxors;
      return this;
    }
    , withMainPlanElementSet: function (mainPlanElementSet: ReUiPlanElementSetBuilder) {
      reUiPlan.mainPlanElementSet = mainPlanElementSet.build();
      return this;
    }
    , withDescription: function (description: string) {
      reUiPlan.description = description;
      return this;
    }
    , build: function () {
      return reUiPlan
    }
  }
}


export type ReUiPlanElementBuilder = {
  
  build: () => ReUiPlanElement
}

export type ReUiPlanElementSetBuilder = {
 
  showFixedComponent: (componentName: string, options: ReUiPlanComponentBuilder<ReComponentAttributeBinder>) => ReUiPlanElementSetBuilder
  showFluxorComponent: (options: ReUiPlanComponentBuilder<ReComponentAttributeBinder>, fluxorProps?: FluxorProps) => ReUiPlanElementSetBuilder
  showContainerComponent: (containerName: string, options: ReUiPlanComponentBuilder<ReComponentRecordBinder>) => ReUiPlanElementSetBuilder

  build: () => ReUiPlanElementSet
}

export function CreateReUiPlanElement(): ReUiPlanElementSetBuilder {
  let components: ReUiPlanElementSet = []
  return {
    showFixedComponent: function (componentName: string, options: ReUiPlanComponentBuilder<ReComponentAttributeBinder>) {
      if (!components) {
        components = [];
      }
      components.push({ componentName, options: options.build() });
      return this;
    },
    showFluxorComponent: function (options: ReUiPlanComponentBuilder<ReComponentAttributeBinder>) {
      if (!components) {
        components = [];
      }
      components.push({ componentName: undefined, options: options.build() });
      return this;
    },
    showContainerComponent: function (componentName: string, options: ReUiPlanComponentBuilder<ReComponentRecordBinder>) {
      if (!components) {
        components = [];
      }
      components.push({ componentName, options: options.build() });
      return this;
    },
    build: function () {
      return (components) as ReUiPlanElementSet
    }
  }
}

export type ReUiPlanComponentBuilder<T> = {
  hideWhen: (hidden: boolean | ReUiPlanExpressionProp) => ReUiPlanComponentBuilder<T>
  hide: () => ReUiPlanComponentBuilder<T>
  disableWhen: (disabled: boolean | ReUiPlanExpressionProp) => ReUiPlanComponentBuilder<T>
  disable: () => ReUiPlanComponentBuilder<T>
  setError: (error: boolean | ReUiPlanExpressionProp) => ReUiPlanComponentBuilder<T>
  setHelperText: (helperText: string | ReUiPlanExpressionProp) => ReUiPlanComponentBuilder<T>
  setLabel: (label: string | ReUiPlanExpressionProp) => ReUiPlanComponentBuilder<T>
  setUseSingleChildForArrays: (isSingleChildForArrays: boolean) => ReUiPlanComponentBuilder<T>
  addDecorators: (decorators: any[]) => ReUiPlanComponentBuilder<T>
  withValueBinding: (binding: ReComponentBinder) => ReUiPlanComponentBuilder<T>
  withExtraBinding: (boundPropName: string, binding: ReComponentBinder) => ReUiPlanComponentBuilder<T>
  build: () => ReUiPlanElement
}


export function CreateReUiPlanComponent<T>(name?: string): ReUiPlanComponentBuilder<T> {
  const reUiPlanComponent: ReUiPlanElement = {
    hidden: false,
    disabled: false,
    error: false,
    helperText: undefined,
    label: undefined,
    decorators: [],
    componentName: name,
    binding: undefined,
    extraBindings: {},
  } as ReUiPlanElement
  return {
    hideWhen: function (hidden: boolean | ReUiPlanExpressionProp) {
      reUiPlanComponent.hidden = hidden;
      return this;
    }
    , hide: function () {
      reUiPlanComponent.hidden = true;
      return this;
    }
    , disable: function () {
      reUiPlanComponent.disabled = true;
      return this;
    }
    , disableWhen: function (disabled: boolean | ReUiPlanExpressionProp) {
      reUiPlanComponent.disabled = disabled;
      return this;
    }
    , setError: function (error: boolean | ReUiPlanExpressionProp) {
      reUiPlanComponent.error = error;
      return this;
    }
    , setHelperText: function (helperText: string | ReUiPlanExpressionProp) {
      reUiPlanComponent.helperText = helperText;
      return this;
    }
    , setLabel: function (label: string | ReUiPlanExpressionProp) {
      reUiPlanComponent.label = label;
      return this;
    }
    , setUseSingleChildForArrays: function (useSingleChildForArrays: boolean) {
      reUiPlanComponent.useSingleChildForArrays = useSingleChildForArrays;
      return this;
    }
    , addDecorators: function (decorators: any[]) {
      reUiPlanComponent.decorators = decorators;
      return this;
    }
    , withValueBinding: function (binding: ReComponentBinder) {
      reUiPlanComponent.binding = binding;
      return this;
    }
    , withExtraBinding: function (boundPropName: string, binding: ReComponentBinder) {
      if (!reUiPlanComponent.extraBindings) {
        reUiPlanComponent.extraBindings = {};
      }
      reUiPlanComponent.extraBindings[boundPropName] = binding;
      return this;
    }
    , build: function () {
      return reUiPlanComponent
    }
  }
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
    componentName: element.componentName
  } as ReUiPlanElement
}   