import { ReactNode } from "react";
import { ReUiPlanElement } from "../UiPlan/ReUiPlan";

export type ReComponentCommonProps = {
  hidden?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  label?: string;
  labelPosition?: 'top' | 'start' | 'end' | 'bottom';
  decorators?: any[];
  componentName?: string;
  dataSource?: any;
  testId?: string;
  displayMode?: 'editing' | 'editable' | 'readonly';
}


export type ReComponentSystemProps = { 
  options?: ReUiPlanElement, 
  elementIndex?: number,
  
  setMetadataMode?: (mode: boolean) => void,
  children?: ReactNode, 
   value?: any, 
  record?: any,
  setter?: (newValue: any) => void,
  events?: {
    onChange?: (value: any) => void;
  }
}

export type ReComponentDataFunctionContext<RDDT, LDDT> = {
  rootData: RDDT
  localData: LDDT
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
  sourcePath: string;
  recordPropertyPath?: string;
  recordFetchingFunction?: (context: any) => any;
  valueAccessFunction?: (context: any) => any;
}

export type ReComponentBinder<RDDT, LDDT> = string | ((context: ReComponentDataFunctionContext<RDDT, LDDT>) => any) ;