import { JSX } from 'preact'
import { DeepProxy } from 'proxy-deep'
import { ReUiPlan, ReUiPlanElementSet, ReUiPlanElement } from '../UiPlan/ReUiPlan'; // Adjust the path './types' to the correct location of ReUiPlan
import { ReProvider, useReContext } from '../contexts/ReEngineContext';
import ReComponentWrapper from './ReComponentWrapper';
import { ReBinder } from '../data/binders';
import FormControl from '@mui/material/FormControl';
import { FluxorProps } from '../fluxor/fluxorProps';

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

export function ReEngine(props: ReEngineProps) {
  const { rules } = useReContext();

  function getReceiver(type: string, path: any, key: PropertyKey, value: any) {
    console.log(`Receiver ${type} at path: ${JSON.stringify(path)}, key: ${String(key)}, value: ${JSON.stringify(value)}`);
  }

  const sourceData = new DeepProxy(props.sourceData, {
    get(target, key, receiver) {
      const val = Reflect.get(target, key, receiver);

      if (typeof val === 'object' && val !== null) {
        const objVal = this.nest(val)
        getReceiver('obj access', this.path, key, objVal)
        return {
          path: this.path,
          key: key,
          value: objVal
        }
      } else {
        getReceiver('val access', this.path, key, val)
        return {
          path: this.path,
          key: key,
          value: val
        }
      }
    }
  });
  return (
    <ReProvider>
      {recursiveRender({
        uiPlan: props.UiPlan,
        uiPlanElementSet: props.UiPlan.mainPlanElementSet,
        sourceData: sourceData,
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
      const componentOptions = { ...options } as ReUiPlanElement;

      if (componentOptions.hidden) {
        continue; // Skip rendering if hidden
      }
      let record: any = {}
      let value: any = undefined

      const binding = (componentOptions.binding as any) as ReBinder
      if (binding) {
        // Handle binding logic here
        try {
          record = binding.getRecord(sourceData, parentData);
        } catch (error) {
          record = { __bindingError: { message: 'Record binding threw error', error: error } }
          console.error(`Error in binding: ${error}`);
        }
        if (record) {
          try {
            value = binding.getAttributeValue(record.value);
          } catch (error) {
            record = { __bindingError: { message: 'Value binding threw error', error: error } }
            console.error(`Error in binding: ${error}`);
          }
        }
      }
      if (value?.path) {
        const { schema, attribute } = getSchemaAndAttributeDefinition(value);
        updateComponentOptions(componentOptions, schema, attribute);
      }
     
      let elementComponent = (<></>)
      if (!componentOptions.componentName) {
        // Handle the case where componentName is not provided
        componentOptions.componentName = componentName;
      }
      if (componentOptions.children) {
        const childElementProps: ReEngineElementProps = {
          uiPlan,
          uiPlanElementSet: componentOptions.children,
          sourceData,
          parentElementProps: elementProps,
          parentData: {},
          depth: depth + 1
        }

        const childElements = componentOptions.useSingleChildForArrays
          ? (<>
            {(Array.isArray(record) ? record : [record]).map((childRecord) =>
              recursiveRender({ ...childElementProps, parentData: childRecord }))}
          </>)
          : recursiveRender({ ...childElementProps, parentData: record })

        elementComponent = (
          <ReComponentWrapper
            props={{ options: { ...componentOptions }, value, record }} >
            {childElements}
          </ReComponentWrapper>
        )
      } else {
        elementComponent = (
          <ReComponentWrapper props={{ options: { ...componentOptions }, value, record }} />
        );
      }
      if (componentOptions.decorators) {
        for (const decorator of Array.isArray(componentOptions.decorators) ? componentOptions.decorators : [componentOptions.decorators]) {
          const decoratorOptions = typeof decorator === 'string' ? { componentName: decorator } : decorator;
          elementComponent = (
            <ReComponentWrapper props={{ options: { ...decoratorOptions }, value, record }} >
              {elementComponent}
            </ReComponentWrapper>)
        }
      }
      elementComponents.push(elementComponent)
    }

    return (
      <div className={`re-engine-element depth-${depth}`}>
        <FormControl variant="outlined" >
          {elementComponents}
        </FormControl>
      </div>)


    function getSchemaAndAttributeDefinition(value: any) {
      const schema = props.UiPlan.schemas?.[value.path[0]];
      const attribute = schema?.attributes?.find(attr => typeof (attr) !== 'string' && attr.attributeName === value.key);
      return { schema, attribute: attribute as FluxorProps };
    }

    function updateComponentOptions(componentOptions: ReUiPlanElement, schema: any, attribute: FluxorProps) {
      if (schema && attribute) {
        // order of preference for component options - maybe this should be a choice
        // 1. componentOptions
        // 2. attribute
        componentOptions.label = componentOptions.label || attribute.label;
        componentOptions.disabled = componentOptions.disabled || attribute.disabled;
        componentOptions.error = componentOptions.error || attribute.error;
        componentOptions.helperText = componentOptions.helperText || attribute.helperText;
        componentOptions.hidden = componentOptions.hidden || attribute.hidden;
        if (!componentOptions.componentName) {
          if (attribute.preferredDisplayType && props.UiPlan.displayTypeMap) {
            const displayType = props.UiPlan.displayTypeMap.find(([key]) => key === attribute.preferredDisplayType);
            if (displayType) {
              componentOptions.componentName = displayType[1]; // in the map there are tuples, [1] is the display component
            }
          } else if (attribute.preferredDisplayComponent) {
            componentOptions.componentName = attribute.preferredDisplayComponent;
          }
        }
      }
    }
  }
}
