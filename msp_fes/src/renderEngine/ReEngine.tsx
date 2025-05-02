import { JSX } from 'preact'
import { ReUiPlan, ReUiPlanElementSet, ReUiPlanElement } from './UiPlan/ReUiPlan'; // Adjust the path './types' to the correct location of ReUiPlan
import { ReProvider, useReContext } from './contexts/ReEngineContext';
import ReComponentWrapper from './components/ReComponentWrapper';
import { ReBinder } from './data/binders';

export type ReEngineProps = {
  UiPlan: ReUiPlan,
  sourceData: any,
}

type ReEngineElementProps = {
  uiPlan: ReUiPlan,
  uiPlanElementSet: ReUiPlanElementSet,
  sourceData: any,
  parentElementProps?: ReEngineElementProps,
  parentData?: any,
  depth: number
}

export function ReEngine(_props: ReEngineProps) {
  const { rules } = useReContext();

  return (
    <ReProvider>
      {recursiveRender({
        uiPlan: _props.UiPlan,
        uiPlanElementSet: _props.UiPlan.mainPlanElementSet,
        sourceData: _props.sourceData,
        parentElementProps: undefined,
        parentData: undefined,
        depth: 0
      } as ReEngineElementProps)}

    </ReProvider>
  )


  function recursiveRender(elementProps: ReEngineElementProps): JSX.Element {
    const { uiPlan, uiPlanElementSet, sourceData, parentElementProps, parentData, depth } = elementProps;

    if (!uiPlanElementSet) {
      return <></>; // Return empty fragment if no elements to render
    }

    const elementComponents: JSX.Element[] = []
    for (const { componentName, options } of uiPlanElementSet) {

      if (options.hidden) {
        continue; // Skip rendering if hidden
      }
      let record: any = {}
      let value: any = undefined

      const binding = (options.binding as any) as ReBinder
      if (binding) {
        // Handle binding logic here
        record = binding.getRecord(sourceData, parentData);
        if (record) {
          value = binding.getAttributeValue(record);
        }
      }
      let elementComponent = (<></>)
      if (!options.componentName) {
        // Handle the case where componentName is not provided
        options.componentName = componentName;
      }
        if (options.children) {
          const childElementProps: ReEngineElementProps = {
            uiPlan,
            uiPlanElementSet: options.children,
            sourceData,
            parentElementProps: elementProps,
            parentData: {},
            depth: depth + 1
          }

          const childElements = options.useSingleChildForArrays
            ? (<>
              {(Array.isArray(record) ? record : [record]).map((childRecord) =>
                recursiveRender({ ...childElementProps, parentData: childRecord }))}
            </>)
            : recursiveRender({ ...childElementProps, parentData: record })

            elementComponent = (<ReComponentWrapper options={options} >{childElements}</ReComponentWrapper>)
        } else {
            elementComponent = (<ReComponentWrapper options={options} />);
        }
      if (options.decorators) {
        for (const decorator of Array.isArray(options.decorators) ? options.decorators : [options.decorators]) {
          const decoratorOptions = typeof decorator === 'string' ? {componentName: decorator} : decorator;
          elementComponent =  (<ReComponentWrapper options={decoratorOptions} >{elementComponent}</ReComponentWrapper>)
        }
      }
      elementComponents.push(elementComponent)
    }

    return (
      <div className={`re-engine-element depth-${depth}`}>
        {elementComponents}
      </div>)
  }
}
