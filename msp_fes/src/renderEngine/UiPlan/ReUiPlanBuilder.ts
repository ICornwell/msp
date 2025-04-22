import {ReUiPlan, ReUiPlanElement, ReUiPlanExpressionProp} from './ReUiPlan'

export type ReUiPlanBuilder = {
  schemas?: string[]
  rules?: string[]
  Fluxors?: string[]
  mainPlanElement?: ReUiPlanElementBuilder
  description?: string
  withSchema: (schemas: string[]) => ReUiPlanBuilder
  withRules: (rules: string[]) => ReUiPlanBuilder
  withFluxorSet: (Fluxors: string[]) => ReUiPlanBuilder
  withMainPlanElement: (mainPlanElement: ReUiPlanElementBuilder) => ReUiPlanBuilder
  withDescription: (description: string) => ReUiPlanBuilder
  build: () => ReUiPlan
}

export function CreateReUiPlan(name: string, version: string = 'default') : ReUiPlanBuilder {
  return {
    withSchema: function (schemas: string[]) {
      this.schemas = schemas;
      return this;
    }
    , withRules: function (rules: string[]) {
      this.rules = rules;
      return this;
    }
    , withFluxorSet: function (Fluxors: string[]) {
      this.Fluxors = Fluxors;
      return this;
    }
    , withMainPlanElement: function (mainPlanElement: ReUiPlanElementBuilder) {
      this.mainPlanElement = mainPlanElement;
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
        rules: this.rules,
        Fluxors: this.Fluxors,
        mainPlanElement: this.mainPlanElement ? this.mainPlanElement.build() : undefined
      } as ReUiPlan
    }
  }
}

export type ReUiPlanElementBuilder = {
  componentName?: string
  options?: ReUiPlanComponentBuilder
  showFixedComponent: (componentName: string, options: ReUiPlanComponentBuilder) => ReUiPlanElementBuilder
  showFluxorComponent: (options: ReUiPlanComponentBuilder) => ReUiPlanElementBuilder
  showContainerComponent: (containerName: string, options: ReUiPlanComponentBuilder) => ReUiPlanElementBuilder
  
  build: () => ReUiPlanElement
}

export function CreateReUiPlanElement(name?: string): ReUiPlanElementBuilder {
  return {
    showFixedComponent: function (componentName: string, options: ReUiPlanComponentBuilder) {
      this.componentName = componentName;
      this.options = options;
      return this;
    }
    , showFluxorComponent: function (options: ReUiPlanComponentBuilder) {
      this.options = options;
      return this;
    },
    showContainerComponent: function (componentName: string, options: ReUiPlanComponentBuilder) {
      this.componentName = componentName;
      this.options = options;
      return this;
    },
    build: function () {
      return {
        id: name,
        componentName: this.componentName
      } as ReUiPlanElement
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