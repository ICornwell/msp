import { ReComponentAttributeBinder } from '../../components/ReComponentProps';

export type FunctionAttributeBinderProps = {
  recordFetchingFunction: string;
  dataAtributeName: string;
  schemaName?: string;
  sourceType?: 'Absolute' | 'Relative' | 'None';
 }

export function functionAttributeBinder(props: FunctionAttributeBinderProps): ReComponentAttributeBinder {
  return {
    sourcePath: props.recordFetchingFunction,
    sourceIsCollection: false,
    sourceType: props.sourceType || 'Absolute',
    schema: props.schemaName,
    attributeName: props.dataAtributeName,
  };
}