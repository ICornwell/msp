import { ReComponentRecordBinder } from '../../components/ReComponentProps';
import { resolvePath } from '../pathResolver';

export type FunctionRecordBinderProps = {
  recordFetchingFunction: (data: any) => any;
  sourceIsCollection?: boolean;
  schemaName?: string;
  sourceType?: 'Absolute' | 'Relative' | 'None';
}

export function FunctionRecordBinder(props: FunctionRecordBinderProps): ReComponentRecordBinder {
  const binder = {
    sourcePath: props.recordFetchingFunction,
    sourceIsCollection: false,
    sourceType: props.sourceType || 'Absolute',
    schema: props.schemaName
  } as ReComponentRecordBinder
  return {
    ...binder,
    getRecord: (allData: any, localData: any) => {
      const record = resolvePath(binder.sourceType === 'Absolute' ? allData : localData, binder.sourcePath);
      return record;
    },
    getAttributeValue: (_record: any) => {
      return undefined
    }
  } as ReComponentRecordBinder;
};
