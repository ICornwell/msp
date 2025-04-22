export type ReComponentProps = {
  hidden?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  label?: string;
  decorators?: any[];
  componentName?: string;
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
  sourceIsCollection: boolean;
  sourcePath: string | Function;
  schema: any;
  eventPsuedonym?: string;
  collectionIndexerId?: string;
}