import React from 'react';
import { createExtendedComponent } from './ReComponentWrapper.js';
import { ReComponentCommonProps, ReComponentSystemProps } from './ReComponentProps';
import { ElementSetContainerExtension, extendWithElementSetContainer } from './ContainerElements';
import { CNTX } from '../../renderEngine/UiPlan/ReUiPlanBuilder.js';

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

export const ReGroupComponent = createExtendedComponent<ReGroupProps, ElementSetContainerExtension<CNTX, any>>(
  ReGroup, 
  'ReGroup',
  extendWithElementSetContainer
);