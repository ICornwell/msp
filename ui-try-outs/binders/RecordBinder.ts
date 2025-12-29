import { ReComponentRecordBinder } from '../../components/ReComponentProps';
import {resolvePath} from '../pathResolver';

export type RecordBinderProps = {

  recordPropertyPath: string;
  schemaName?: string;
  sourceType?: 'Absolute' | 'Relative' | 'None';
 }

export function RecordBinder(props: RecordBinderProps): ReComponentRecordBinder {
  const binderProps = {
    sourcePath: props.recordPropertyPath,
    sourceIsCollection: false,
    sourceType: props.sourceType || 'Absolute',
    schema: props.schemaName ?? props.recordPropertyPath,
  } as ReComponentRecordBinder;
  return {
    ...binderProps,
    getRecord: (allData: any, localData: any) => {
      const record = resolvePath(binderProps.sourceType === 'Absolute' ? allData : localData, binderProps.sourcePath);
      return record;
    },
    getAttributeValue: (_record: any) => {
      return undefined
    }
  } as ReComponentRecordBinder;
}