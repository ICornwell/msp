import { ReComponentProps } from "../components/ReComponentProps"

export type ReUiPlan = {
  id: string
  name: string
  description: string
  version: string
  schemas?: string[]
  rules?: string[]
  fluxors?: string[]
  mainPlanElement?: string[]
}

export type ReUiPlanExpressionProp = { executionPlan: any, expression: string | Function }

export type ReUiPlanElement = {
  hidden?: boolean | ReUiPlanExpressionProp;
  disabled?: boolean | ReUiPlanExpressionProp;
  error?: boolean | ReUiPlanExpressionProp;
  helperText?: string | ReUiPlanExpressionProp;
  label?: string | ReUiPlanExpressionProp;
  decorators?: any[];
  componentName?: string;
 
} 