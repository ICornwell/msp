import React from 'react';
import { createContainerComponent } from './ReComponentWrapper';
import { ReComponentCommonProps, ReComponentSystemProps } from './ReComponentProps';

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

export const ReGroupComponent = createContainerComponent<ReGroupProps>(ReGroup, 'ReGroup');