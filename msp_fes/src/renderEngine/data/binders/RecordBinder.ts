import { ReComponentRecordBinder } from '../../components/ReComponentProps';
import {resolvePath} from '../pathResolver';

export type RecordBinderProps = {

  recordPropertyPath: string;
  schemaName?: string;
  sourceType?: 'Absolute' | 'Relative' | 'None';
 }

export function RecordBinder(props: RecordBinderProps): ReComponentRecordBinder {
  return {
    sourcePath: props.recordPropertyPath,
    sourceIsCollection: false,
    sourceType: props.sourceType || 'Absolute',
    schema: props.schemaName ?? props.recordPropertyPath,
    getRecord: (allData: any, localData: any) => {
      const record = resolvePath(props.sourceType === 'Absolute' ? allData : localData, props.recordPropertyPath);
      return record;
    },
    getAttributeValue: (_record: any) => {
      return undefined
    }
  } as ReComponentRecordBinder;
}