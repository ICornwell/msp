import { ReUiPlan, ReUiPlanElement, ReUiPlanElementSet, ReUiPlanExpressionProp } from './ReUiPlan'
import type { FluxorProps } from '../fluxor/fluxorProps'
import { defaultDisplayMap } from '../fluxor/defaultDisplayMap'

export type ReUiPlanBuilder = {
  schemas?: string[]
  displayTypeMap?: [string, string][]
  rules?: string[]
  Fluxors?: FluxorProps[]
  mainPlanElementSet?: ReUiPlanElementSetBuilder
  description?: string
  withSchema: (schemas: string[]) => ReUiPlanBuilder
  withDisplayTypeMap: (map: [string, string][]) => ReUiPlanBuilder
  withRules: (rules: string[]) => ReUiPlanBuilder
  withFluxorSet: (Fluxors: FluxorProps[]) => ReUiPlanBuilder
  withMainPlanElementSet: (mainPlanElementSet: ReUiPlanElementSetBuilder) => ReUiPlanBuilder
  withDescription: (description: string) => ReUiPlanBuilder
  build: () => ReUiPlan
}

export function CreateReUiPlan(name: string, version: string = 'default'): ReUiPlanBuilder {
  return {
    withSchema: function (schemas: string[]) {
      this.schemas = schemas;
      return this;
    },
    withDisplayTypeMap: function (map: [string, string][]) {
      this.displayTypeMap = map;
      return this;
    }
    , withRules: function (rules: string[]) {
      this.rules = rules;
      return this;
    }
    , withFluxorSet: function (Fluxors: FluxorProps[]) {
      this.Fluxors = Fluxors;
      return this;
    }
    , withMainPlanElementSet: function (mainPlanElementSet: ReUiPlanElementSetBuilder) {
      this.mainPlanElementSet = mainPlanElementSet;
      return this;
    }
    , withDescription: function (description: string) {
      this.description = description;
      return this;
    }
    , build: function () {
      return {
        id: name,
        name: name,
        description: this.description,
        version: version,
        schemas: this.schemas,
        displayTypeMap: this.displayTypeMap ?? defaultDisplayMap,
        rules: this.rules,
        Fluxors: this.Fluxors,
        mainPlanElementSet: this.mainPlanElementSet ? this.mainPlanElementSet.build() : undefined
      } as ReUiPlan
    }
  }
}


export type ReUiPlanElementBuilder = {
  componentName: string,
  options: ReUiPlanComponentBuilder,
  build: () => ReUiPlanElement
}

export type ReUiPlanElementSetBuilder = {
  components?: ReUiPlanElementSet
  showFixedComponent: (componentName: string, options: ReUiPlanComponentBuilder) => ReUiPlanElementSetBuilder
  showFluxorComponent: (options: ReUiPlanComponentBuilder, fluxorProps?: FluxorProps) => ReUiPlanElementSetBuilder
  showContainerComponent: (containerName: string, options: ReUiPlanComponentBuilder) => ReUiPlanElementSetBuilder

  build: () => ReUiPlanElementSet
}

export function CreateReUiPlanElement(): ReUiPlanElementSetBuilder {
  return {
    showFixedComponent: function (componentName: string, options: ReUiPlanComponentBuilder) {
      if (!this.components) {
        this.components = [];
      }
      this.components.push({ componentName, options: options.build() });
      return this;
    }
    , showFluxorComponent: function (options: ReUiPlanComponentBuilder) {
      if (!this.components) {
        this.components = [];
      }
      this.components.push({ componentName: undefined, options: options.build() });
      return this;
    },
    showContainerComponent: function (componentName: string, options: ReUiPlanComponentBuilder) {
      if (!this.components) {
        this.components = [];
      }
      this.components.push({ componentName, options: options.build() });
      return this;
    },
    build: function () {
      return (this.components) as ReUiPlanElementSet
    }
  }
}

export type ReUiPlanComponentBuilder = {
  name?: string
  hidden?: boolean | ReUiPlanExpressionProp;
  disabled?: boolean | ReUiPlanExpressionProp;
  error?: boolean | ReUiPlanExpressionProp;
  helperText?: string | ReUiPlanExpressionProp;
  label?: string | ReUiPlanExpressionProp;
  decorators?: any[];
  binding?: string;
  hideWhen: (hidden: boolean | ReUiPlanExpressionProp) => ReUiPlanComponentBuilder
  hide: () => ReUiPlanComponentBuilder
  disableWhen: (disabled: boolean | ReUiPlanExpressionProp) => ReUiPlanComponentBuilder
  disable: () => ReUiPlanComponentBuilder
  setError: (error: boolean | ReUiPlanExpressionProp) => ReUiPlanComponentBuilder
  setHelperText: (helperText: string | ReUiPlanExpressionProp) => ReUiPlanComponentBuilder
  setLabel: (label: string | ReUiPlanExpressionProp) => ReUiPlanComponentBuilder
  addDecorators: (decorators: any[]) => ReUiPlanComponentBuilder
  withBinding: (binding: string) => ReUiPlanComponentBuilder
  build: () => ReUiPlanElement
}


export function CreateReUiPlanComponent(name?: string): ReUiPlanComponentBuilder {
  return {
    name: name,
    hideWhen: function (hidden: boolean | ReUiPlanExpressionProp) {
      this.hidden = hidden;
      return this;
    }
    , hide: function () {
      this.hidden = true;
      return this;
    }
    , disable: function () {
      this.disabled = true;
      return this;
    }
    , disableWhen: function (disabled: boolean | ReUiPlanExpressionProp) {
      this.disabled = disabled;
      return this;
    }
    , setError: function (error: boolean | ReUiPlanExpressionProp) {
      this.error = error;
      return this;
    }
    , setHelperText: function (helperText: string | ReUiPlanExpressionProp) {
      this.helperText = helperText;
      return this;
    }
    , setLabel: function (label: string | ReUiPlanExpressionProp) {
      this.label = label;
      return this;
    }
    , addDecorators: function (decorators: any[]) {
      this.decorators = decorators;
      return this;
    }
    , withBinding: function (binding: string) {
      this.binding = binding;
      return this;
    }
    , build: function () {
      return {
        hidden: this.hidden,
        disabled: this.disabled,
        error: this.error,
        helperText: this.helperText,
        label: this.label,
        decorators: this.decorators,
        binding: this.binding
      } as ReUiPlanElement
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
    decorators: element.decorators,
    componentName: element.componentName
  } as ReUiPlanElement
}   