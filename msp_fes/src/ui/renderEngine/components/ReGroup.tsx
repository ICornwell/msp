import React from 'react';
import { createExtendedComponent } from './ReComponentWrapper';
import { ReComponentCommonProps, ReComponentSystemProps } from './ReComponentProps';
import { ElementSetContainerExtension, extendWithElementSetContainer } from './ContainerElements';

export type ReGroupProps = {
  hidden?: boolean;
  children?: React.ReactNode;
} ;

export default function ReGroup({ hidden, children }: ReGroupProps& ReComponentCommonProps & ReComponentSystemProps) {
  return hidden ? null :
    (<div className="re-group">
      {children}
    </div>)
}

export const ReGroupComponent = createExtendedComponent<ReGroupProps, ElementSetContainerExtension<any>>(
  ReGroup, 
  'ReGroup',
  (builder) => extendWithElementSetContainer(builder)
);