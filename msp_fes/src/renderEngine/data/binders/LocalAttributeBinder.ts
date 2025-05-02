import { ReComponentAttributeBinder } from '../../components/ReComponentProps';
import { resolvePath } from '../pathResolver';

export type LocalAttributeBinderProps = {
  dataAttributeName: string;
  schemaName?: string;
  sourceType?: 'Absolute' | 'Relative' | 'None';
}

export function LocalAttributeBinder(props: LocalAttributeBinderProps): ReComponentAttributeBinder {
  return {
    sourcePath: '.',
    sourceIsCollection: false,
    sourceType: 'Relative',
    schema: props.schemaName ?? '.',
    attributeName: props.dataAttributeName,
    getRecord: (_allData: any, localData: any) => {
      return localData;
    },
    getAttributeValue: (record: any) => {
      const value = resolvePath(record, props.dataAttributeName);
      return value;
    }
  } as ReComponentAttributeBinder;
}