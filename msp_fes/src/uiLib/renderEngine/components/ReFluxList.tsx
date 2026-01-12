import React from 'react';
import { ReComponentCommonProps, ReComponentSystemProps } from './ReComponentProps.js';
import { createContainerComponent } from './ReComponentWrapper.js';

export type ReFluxListProps = {
  hidden?: boolean;
  children?: React.ReactNode;
};

export default function ReFluxList({ hidden, children }: ReFluxListProps & ReComponentCommonProps & ReComponentSystemProps) {
  return hidden ? null :
    (<div className="re-group">
      {children}
    </div>)
}

export const ReFluxListComponent = createContainerComponent<ReFluxListProps>(ReFluxList, 'ReFluxList');