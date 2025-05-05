import { ReComponentAttributeBinder } from '../../components/ReComponentProps';
import { resolvePath } from '../pathResolver';

export type LocalAttributeBinderProps = {
  dataAttributeName: string;
  schemaName?: string;
  sourceType?: 'Absolute' | 'Relative' | 'None';
}

export function LocalAttributeBinder(props: LocalAttributeBinderProps): ReComponentAttributeBinder {
  const binderProps= {
    sourcePath: '.',
    sourceIsCollection: false,
    sourceType: 'Relative',
    schema: props.schemaName ?? '.',
    attributeName: props.dataAttributeName,
  } as ReComponentAttributeBinder;
  
  return {
    ...binderProps,
    getRecord: (_allData: any, localData: any) => {
      return localData;
    },
    getAttributeValue: (record: any) => {
      const value = resolvePath(record, binderProps.attributeName);
      return value;
    }
  } as ReComponentAttributeBinder;
}