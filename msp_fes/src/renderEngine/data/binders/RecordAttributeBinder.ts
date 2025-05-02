import { ReComponentAttributeBinder } from '../../components/ReComponentProps';
import { resolvePath } from '../pathResolver';

export type RecordAttributeBinderProps = {
  recordPropertyPath: string;
  dataAttributeName: string;
  schemaName?: string;
  sourceType?: 'Absolute' | 'Relative' | 'None';
}

export function RecordAttributeBinder(props: RecordAttributeBinderProps): ReComponentAttributeBinder {
  return {
    sourcePath: props.recordPropertyPath,
    sourceIsCollection: false,
    sourceType: props.sourceType || 'Absolute',
    schema: props.schemaName ?? props.recordPropertyPath,
    attributeName: props.dataAttributeName,
    getRecord: (allData: any, localData: any) => {
      const record = resolvePath(props.sourceType === 'Absolute' ? allData : localData, props.recordPropertyPath);
      return record;
    },
    getAttributeValue: (record: any) => {
      const value = resolvePath(record, props.dataAttributeName);
      return value;
    }
  } as ReComponentAttributeBinder;
};