import { ReComponentBinder, ReComponentProps } from "../components/ReComponentProps"
import { FluxorProps } from "../fluxor/fluxorProps"

export type ReUiPlan = {
  id: string
  name: string
  description: string
  version: string
  schemas?: string[]
  rules?: string[]
  fluxors?: FluxorProps[]
  displayTypeMap?: [string, string][]
  mainPlanElementSet?: ReUiPlanElementSet
}

export type ReUiPlanExpressionProp = { executionPlan: any, expression: string | Function }

export type ReUiPlanElementSet = {componentName?: string, options: ReUiPlanElement}[]

export type ReUiPlanElement = {
  hidden?: boolean | ReUiPlanExpressionProp;
  disabled?: boolean | ReUiPlanExpressionProp;
  error?: boolean | ReUiPlanExpressionProp;
  helperText?: string | ReUiPlanExpressionProp;
  label?: string | ReUiPlanExpressionProp;
  decorators?: any[];
  componentName?: string;
  children?: ReUiPlanElementSet;
  binding?: ReComponentBinder;
  extraBindings?: Record<string, ReComponentBinder>;
  useSingleChildForArrays?: boolean;
} 

export type ReBinding = {}