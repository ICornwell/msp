import { ReComponentAttributeBinder } from '../../components/ReComponentProps';

export type RecordAttributeBinderProps = {
  recordPropertyPath: string;
  dataAtributeName: string;
  schemaName?: string;
  sourceType?: 'Absolute' | 'Relative' | 'None';
 }

export function recordAttributeBinder(props: RecordAttributeBinderProps): ReComponentAttributeBinder {
  return {
    sourcePath: props.recordPropertyPath,
    sourceIsCollection: false,
    sourceType: props.sourceType || 'Absolute',
    schema: props.schemaName ?? props.recordPropertyPath,
    attributeName: props.dataAtributeName,
  };
}