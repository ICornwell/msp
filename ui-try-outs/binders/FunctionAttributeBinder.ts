import { ReComponentAttributeBinder } from '../../msp_fes/src/ui/renderEngine/components/ReComponentProps';
import { resolvePath } from '../../msp_fes/src/ui/renderEngine/data/pathResolver';

export type FunctionAttributeBinderProps = {
  recordFetchingFunction: (data: any) => any;
  sourceIsCollection?: boolean;
  dataAttributeName: string;
  schemaName?: string;
  sourceType?: 'Absolute' | 'Relative' | 'None';
}

export function FunctionAttributeBinder(props: FunctionAttributeBinderProps): ReComponentAttributeBinder {
  const binderProps = { 
    sourcePath: props.recordFetchingFunction,
    sourceIsCollection: false,
    sourceType: props.sourceType || 'Absolute',
    schema: props.schemaName,
    attributeName: props.dataAttributeName
  } as ReComponentAttributeBinder
  return {
    ...binderProps,
    getRecord: (allData: any, localData: any) => {
      const record = resolvePath(binderProps.sourceType === 'Absolute' ? allData : localData, binderProps.sourcePath);
      return record;
    },
    getAttributeValue: (record: any) => {
      const value = resolvePath(record, binderProps.attributeName);
      return value;
    }
  } as any as ReComponentAttributeBinder;
};
