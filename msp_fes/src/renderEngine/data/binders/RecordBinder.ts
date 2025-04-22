import { ReComponentRecordBinder } from '../../components/ReComponentProps';

export type RecordBinderProps = {

  recordPropertyPath: string;
  schemaName?: string;
  sourceType?: 'Absolute' | 'Relative' | 'None';
 }

export function recordAttributeBinder(props: RecordBinderProps): ReComponentRecordBinder {
  return {
    sourcePath: props.recordPropertyPath,
    sourceIsCollection: false,
    sourceType: props.sourceType || 'Absolute',
    schema: props.schemaName ?? props.recordPropertyPath,

  };
}