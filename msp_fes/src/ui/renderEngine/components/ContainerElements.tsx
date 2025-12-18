import { CNTX, CreateReUiPlanComponent, CreateReUiPlanElementSet, ReExtensionBuilder, ReUiPlanComponentBuilder, ReUiPlanElementSetBuilder } from "../UiPlan/ReUiPlanBuilder";
import { ReUiPlanElement } from "../UiPlan/ReUiPlan";
import { FluxorData } from "../fluxor/fluxorData";


export interface SingleItemContainerExtension<C extends CNTX, RT = any>  extends ReExtensionBuilder<RT>  {
  containingSingle:  ReUiPlanComponentBuilder<C, any, RT>;
};

// C = CNTX type, RT = return-to type
// The generator will substitute the actual C when creating ExtensionOf
export interface ElementSetContainerExtension<C extends CNTX, RT> extends ReExtensionBuilder<RT> {
  containingElementSet: () => ReUiPlanElementSetBuilder<C, RT & ElementSetContainerExtension<C, RT>>;
};

export function extendWithSingleItemContainer<C extends CNTX, RT>(returnTo: RT): SingleItemContainerExtension<C, RT> {
  const containedBuilders: ReUiPlanComponentBuilder<any, any, any>[] = [];
  const extension = { 
    containingSingle: {} as ReUiPlanComponentBuilder<C, any, RT>,
     _buildExtension: (buildConfig: any, extendedElement: ReUiPlanElement) => {
      containedBuilders.forEach(componentBuilder => {
        const containedElement = componentBuilder.build(buildConfig)
        extendedElement.children = [ { componentName: containedElement.componentName, options: { ...containedElement, ...containedElement.componentProps }, containing: containedElement.children } ];
      })
     }
  };

extension.containingSingle = CreateReUiPlanComponent<any, any, RT>(returnTo,
   'SingleItemContainer', containedBuilders);

  return extension;
}

export function extendWithElementSetContainer<C extends CNTX<any, any, FluxorData<any>, FluxorData<any>, any>,RT, TData extends FluxorData<any>>(returnTo: RT, dataDescriptor: TData, _contextPlaceHolder: C): ElementSetContainerExtension<C, RT> {
  const containedBuilders: ReUiPlanElementSetBuilder<any, any>[] = [];
  const extension: ElementSetContainerExtension<C, RT> = {
    containingElementSet: () => CreateReUiPlanElementSet<C, RT & ElementSetContainerExtension<C, RT>>(returnTo as RT & ElementSetContainerExtension<C, RT>, containedBuilders, dataDescriptor),
    _buildExtension: (buildConfig: any, extendedElement: ReUiPlanElement) => {
      if (!extendedElement.children) extendedElement.children = [];
      if (!extendedElement.sharedProps) extendedElement.sharedProps = [];
      containedBuilders.forEach(setBuilder => {
        const {components, sharedProps} = setBuilder.build(buildConfig)
        if (extendedElement.children) extendedElement.children.push(...components);
        if (extendedElement.sharedProps) extendedElement.sharedProps.push(...sharedProps);
      });
    }
  };

  return extension;
}