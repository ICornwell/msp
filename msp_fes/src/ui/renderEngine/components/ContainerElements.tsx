import { CNTX, CreateReUiPlanComponent, CreateReUiPlanElementSet, FluentExtension, FluentSimple, FluentSubBuilder, ReExtensionBuilder, ReUiPlanComponentBuilder, ReUiPlanElementSetBuilder } from "../UiPlan/ReUiPlanBuilder.js";
import { ReUiPlanElement } from "../UiPlan/ReUiPlan.js";
import { FluxorData } from "../fluxor/fluxorData.js";

export type SimplifiedReUiPlanComponentBuilder<C extends CNTX, RT> = ReUiPlanComponentBuilder<C, any, RT>;

export interface SingleItemContainerExtension<C extends CNTX, RT = any> extends ReExtensionBuilder<RT> {
  containingSingle():  FluentSubBuilder<SimplifiedReUiPlanComponentBuilder<C, FluentSimple>>;
};

export type {ReUiPlanElementSetBuilder};

// C = CNTX type, RT = return-to type
// The generator will substitute the actual C when creating ExtensionOf
export interface ElementSetContainerExtension<C extends CNTX, RT> extends ReExtensionBuilder<RT> {
  containingElementSet(): FluentSubBuilder<ReUiPlanElementSetBuilder<C, RT>>;
};

export function extendWithSingleItemContainer<C extends CNTX, RT>(returnTo: RT): SingleItemContainerExtension<C, RT> {
  const containedBuilders: ReUiPlanComponentBuilder<any, any, any>[] = [];
  const extension: FluentExtension = {
    containingSingle: ():FluentSubBuilder<ReUiPlanComponentBuilder<C, any, FluentSimple>> => (CreateReUiPlanComponent<C, any, RT>(returnTo,
    'SingleItemContainer', containedBuilders) as unknown as FluentSubBuilder<SimplifiedReUiPlanComponentBuilder<C, FluentSimple>>),
    _buildExtension: (buildConfig: any, extendedElement: ReUiPlanElement) => {
      containedBuilders.forEach(componentBuilder => {
        const containedElement = componentBuilder.build(buildConfig)
        extendedElement.children = [{ componentName: containedElement.componentName, options: { ...containedElement, ...containedElement.componentProps }, containing: containedElement.children }];
      })
    }
  };


  return extension as  SingleItemContainerExtension<C, RT>;
}

export function extendWithElementSetContainer<C extends CNTX, RT, BLD>(
  _returnTo: RT,
  builder: BLD,
  _contextPlaceHolder: C
): ElementSetContainerExtension<C, RT> {
  const containedBuilders: ReUiPlanElementSetBuilder<any, any>[] = [];
  const extension: FluentExtension = {
    containingElementSet: (): FluentSubBuilder<ReUiPlanElementSetBuilder<C, FluentSimple>> => (
      CreateReUiPlanElementSet(builder, containedBuilders) as unknown as FluentSubBuilder<ReUiPlanElementSetBuilder<C, FluentSimple>>
    ),
    _buildExtension: (buildConfig: any, extendedElement: ReUiPlanElement) => {
      if (!extendedElement.children) extendedElement.children = [];
      if (!extendedElement.sharedProps) extendedElement.sharedProps = [];
      containedBuilders.forEach(setBuilder => {
        const { components, sharedProps } = setBuilder.build(buildConfig)
        if (extendedElement.children) extendedElement.children.push(...components);
        if (extendedElement.sharedProps) extendedElement.sharedProps.push(...sharedProps);
      });
    }
  };

  return extension as ElementSetContainerExtension<C, RT>;
}