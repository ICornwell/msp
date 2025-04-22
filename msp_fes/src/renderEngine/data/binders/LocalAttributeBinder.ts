import { ReComponentAttributeBinder } from '../../components/ReComponentProps';

export type LocalAttributeBinderProps = {
  dataAtributeName: string;
  schemaName?: string;
  sourceType?: 'Absolute' | 'Relative' | 'None';
 }

export function localAttributeBinder(props: LocalAttributeBinderProps): ReComponentAttributeBinder {
  return {
    sourcePath: '.',
    sourceIsCollection: false,
    sourceType: 'Relative',
    schema: props.schemaName ?? '.',
    attributeName: props.dataAtributeName,
  };
}