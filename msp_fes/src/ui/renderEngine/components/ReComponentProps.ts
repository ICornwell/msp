import { ReactNode } from "react";
import { CNTX, LDDTOf, RDDTOf, ReUiPlanElement } from "../UiPlan/ReUiPlan";
import { DataOf } from "../UiPlan/ReUiPlanBuilder";
import { FluxorData } from "../fluxor/fluxorData";
import type { Notes } from "../data/uiDataProxy";

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
  notes?: Notes,
  componentCallbackHandler?: {
    dataChangeCallback: (msg: any) => void;
  },
  setMetadataMode?: (mode: boolean) => void,
  children?: ReactNode, 
   value?: any, 
  record?: any,
  setter?: (newValue: any) => void,
  getter?: () => any,
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

export type ReComponentReBinder<C extends CNTX<any, any, FluxorData<any>, FluxorData<any>, any>, LDDT2 extends FluxorData<any>>
   = string | ((context: ReComponentDataFunctionContext<DataOf<RDDTOf<C>>, DataOf<LDDTOf<C>>>) => DataOf<LDDT2> | undefined) ;