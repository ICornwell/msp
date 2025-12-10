import { CreateReUiPlanComponent, CreateReUiPlanElementSet, ReExtensionBuilder, ReUiPlanComponentBuilder, ReUiPlanElementSetBuilder } from "../UiPlan/ReUiPlanBuilder";
import { ReUiPlanElement } from "../UiPlan/ReUiPlan";

export interface SingleItemContainerExtension<RT = any>  extends ReExtensionBuilder  {
  containingSingle:  ReUiPlanComponentBuilder<any, any, any, RT>;
};

// RT = return-to type. The 'any' for C will be substituted by ExtentionOf when used
export interface ElementSetContainerExtension<RT> extends ReExtensionBuilder {
  containingElementSet: () => ReUiPlanElementSetBuilder<any, RT & ElementSetContainerExtension<RT>>;
};

export function extendWithSingleItemContainer<RT>(returnTo: RT): SingleItemContainerExtension<RT> {
  const containedBuilders: ReUiPlanComponentBuilder<any, any,any, any>[] = [];
  const extension = { 
    containingSingle: {} as ReUiPlanComponentBuilder<any, any, any, RT>,
     _buildExtension: (buildConfig: any, extendedElement: ReUiPlanElement) => {
      containedBuilders.forEach(componentBuilder => {
        const containedElement = componentBuilder.build(buildConfig)
        extendedElement.children = [ { componentName: containedElement.componentName, options: { ...containedElement, ...containedElement.componentProps }, containing: containedElement.children } ];
      })
     }
  };

extension.containingSingle = CreateReUiPlanComponent<any, any, any, RT>(returnTo,
   'SingleItemContainer', containedBuilders);

  return extension;
}

export function extendWithElementSetContainer<RT>(returnTo: RT): ElementSetContainerExtension<RT> {
  const containedBuilders: ReUiPlanElementSetBuilder<any, any>[] = [];
  const extension: ElementSetContainerExtension<RT> = {
    containingElementSet: () => CreateReUiPlanElementSet<any, RT & ElementSetContainerExtension<RT>>(returnTo as RT & ElementSetContainerExtension<RT>, containedBuilders),
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