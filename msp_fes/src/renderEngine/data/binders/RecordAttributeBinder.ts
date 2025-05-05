import { ReComponentAttributeBinder } from '../../components/ReComponentProps';
import { resolvePath } from '../pathResolver';

export type RecordAttributeBinderProps = {
  recordPropertyPath: string;
  dataAttributeName?: string | boolean | number;
  schemaName?: string;
  sourceType?: 'Absolute' | 'Relative' | 'None';
}

export function RecordAttributeBinder(props: RecordAttributeBinderProps): ReComponentAttributeBinder {
  const binderProps= {
    sourcePath: props.recordPropertyPath,
    sourceIsCollection: false,
    sourceType: props.sourceType || 'Absolute',
    schema: props.schemaName ?? props.recordPropertyPath,
    attributeName: props.dataAttributeName, 
  } as ReComponentAttributeBinder;
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
  } as ReComponentAttributeBinder;
};