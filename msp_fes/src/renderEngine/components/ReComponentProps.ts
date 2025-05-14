import { ReactNode } from "react";
import { ReUiPlanElement } from "../UiPlan/ReUiPlan";

export type ReComponentProps = {
  hidden?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  label?: string;
  decorators?: any[];
  componentName?: string;
  dataSource?: any;
}

export type ReComponentWrapperProps = { 
  options?: ReUiPlanElement, 
  children?: ReactNode, 
  value?: any, 
  record?: any 
}

export type ReComponentDataFunctionContext = {
  allData: any
  localData: any
  localIsCollection: boolean
  attributeName: string;
  collectionIndexerId?: string;
  tags?: string[];
}

export type DataSourcePathType = 'Absolute' | 'Relative' | 'None' | 'Ui';

export type ReComponentAttributeBinder = {
  attributeName: string;
} & ReComponentRecordBinder

export type ReComponentRecordBinder = {
  sourceType: DataSourcePathType;
  recordPropertyPath?: string;
  recordFetchingFunction?: (context: any) => any;
  valueAccessFunction?: (context: any) => any;
}