import { ReComponentRecordBinder } from '../../components/ReComponentProps';
import { resolvePath } from '../pathResolver';

export type FunctionRecordBinderProps = {
  recordFetchingFunction: (data: any) => any;
  sourceIsCollection?: boolean;
  schemaName?: string;
  sourceType?: 'Absolute' | 'Relative' | 'None';
}

export function FunctionRecordBinder(props: FunctionRecordBinderProps): ReComponentRecordBinder {
  return {
    sourcePath: props.recordFetchingFunction,
    sourceIsCollection: false,
    sourceType: props.sourceType || 'Absolute',
    schema: props.schemaName,
    getRecord: (allData: any, localData: any) => {
      const record = resolvePath(props.sourceType === 'Absolute' ? allData : localData, props.recordFetchingFunction);
      return record;
    },
    getAttributeValue: (_record: any) => {
      return undefined
    }
  } as ReComponentRecordBinder;
};
