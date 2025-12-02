import React from 'react'

import { ReUiPlan, ReUiPlanElementSet, ReUiPlanElement } from '../UiPlan/ReUiPlan'; // Adjust the path './types' to the correct location of ReUiPlan
import { ReProvider } from '../contexts/ReEngineContext';
import ReComponentWrapper from './ReComponentWrapper';

import { FluxorProps } from '../fluxor/fluxorProps';
import { getSourceDataProxy } from '../data/uiDataProxy';
import PubSub, { RePubSubMsg } from '../data/ReEnginePubSub'
import { resolvePath } from '../data/pathResolver';

import { ReSubscriptionHandler, useRePubSub } from './RePubSubHook';

export type ReEngineProps = {
  UiPlan: ReUiPlan,
  sourceData: any,
  renderSettings?: any,
}

type ReEngineElementProps = {
  uiPlan: ReUiPlan,
  uiPlanElementSet: ReUiPlanElementSet,
  setMetadataMode: (mode: boolean) => void,
  context: {
    buildSettings: any,
    renderSettings: any,
    rootData: any,
    localData: any,
    fluxorMetaData: any,
    temporaryData: any,
  },
  parentElementProps?: ReEngineElementProps,

  depth: number
}

export function ReEngine(props: ReEngineProps) {
  //const { rules } = useReContext();

  const pubsub = PubSub();

  const { sourceData, setMetadataMode } = getSourceDataProxy(props.sourceData, pubsub);

  const [redrawToggle, setRedrawToggle] = React.useState(false);

  const { createSubscriptionHandler } = useRePubSub()

  function triggerRedraw() {
    setRedrawToggle(!redrawToggle);
  }

  return (
    <ReProvider>
      {recursiveRender({
        uiPlan: props.UiPlan,
        uiPlanElementSet: props.UiPlan.mainPlanElementSet,
        setMetadataMode,
        context: {
          buildSettings: props.UiPlan.buildSettings,
          renderSettings: props.renderSettings,
          rootData: sourceData,
          localData: sourceData,
          fluxorMetaData: {},
          temporaryData: {}
        },
        parentElementProps: undefined,

        depth: 0
      } as ReEngineElementProps)}

    </ReProvider>
  )


  function recursiveRender(elementProps: ReEngineElementProps): React.ReactElement | React.ReactElement[] {
    const { uiPlan, uiPlanElementSet, setMetadataMode, context, depth } = elementProps;
    const { rootData, localData } = context;

    if (!uiPlanElementSet) {
      return <></>; // Return empty fragment if no elements to render
    }

    const elementComponents: React.ReactElement[] = []
    for (const { componentName, options, containing } of uiPlanElementSet) {
      const componentOptions = { ...options } as ReUiPlanElement;

      if (componentOptions.hidden) {
        continue; // Skip rendering if hidden
      }
      let record: any = localData
      let value: any = localData
      let attributeName: string | number | symbol = ''
      let setter: (newValue: any) => void = () => { return; };

      const binding = componentOptions.binding
      if (binding) {
        // Handle binding logic here
        if (typeof binding === 'function') {


          let proxySubId: any = undefined;

          // Collect metadata about function properties
          const functionPropsMetaData: Array<{
            path: string,
            propertyKey: string | number | symbol,
            setter: (newValue: any) => void,
            subscriptionHandler: ReSubscriptionHandler
          }> = []

          if (setMetadataMode && localData.___isProxy) {
            setMetadataMode(false);
            const subscribe = localData.___proxyPubSub.subscriptionHandler.subscribeToPubSub;
            // Subscribe to proxy fetches to collect metadata
            proxySubId = subscribe({callback: (msg: RePubSubMsg) => {
              functionPropsMetaData.push({
                path: msg.path,
                propertyKey: msg.propertyKey,
                setter: msg.setter,
                subscriptionHandler: msg.subscriptionHandler
              });
            }, msgTypeFilter: (msg: RePubSubMsg) => msg.messageType === 'dataFetch'});
          }

          // when we get the binding value, messages will let us know what properties were accessed
          const expVal = binding({
            rootData: rootData,
            localData: localData,
            localIsCollection: Array.isArray(localData),
            attributeName: '',
            collectionIndexerId: componentOptions.collectionIndexerId,
          })

          // Unsubscribe from proxy fetches
          for (const metaData of functionPropsMetaData) {
            // redraw if anything changes

            const subscriptionHandler = createSubscriptionHandler(metaData.subscriptionHandler);
            subscriptionHandler.subscribeToPubSub({
              callback: (_msg: RePubSubMsg) => {
                triggerRedraw();
              },
              msgTypeFilter: (msg: RePubSubMsg) => msg.messageType === 'dataChange'
            });
          }

          if (functionPropsMetaData.length === 1) {
            const metaData = functionPropsMetaData[0];
            setter = (newValue: any) => {
              metaData.setter(newValue);
            };
            attributeName = metaData.propertyKey.toString()
            componentOptions.attributeName = attributeName
            if (componentOptions.dataDescriptor && componentOptions.dataDescriptor?.[attributeName])
              componentOptions.propertyDescriptor = componentOptions.dataDescriptor[attributeName]
          }


          if (proxySubId) {
            const unsubscribe = localData.___proxyPubSub.subscriptionHandler.unsubscribeFromPubSub;
            unsubscribe(proxySubId);
          }

          // Set the evaluated value
          value = expVal;


        } else if (typeof binding === 'string') {
          value = resolvePath(binding, localData);
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
      if (containing) {
        const childElementProps: ReEngineElementProps = {
          uiPlan,
          uiPlanElementSet: containing,
          setMetadataMode,
          context: {
            rootData: rootData,
            buildSettings: props.UiPlan.buildSettings,
            renderSettings: context.renderSettings,

            localData: value,
            fluxorMetaData: context.fluxorMetaData,
            temporaryData: context.temporaryData
          },
          parentElementProps: elementProps,
          depth: depth + 1
        }
        record = childElementProps.context.localData
        const childElements = componentOptions.useSingleChildForArrays
          ? (<>
            {(Array.isArray(record) ? record : [record]).map((childRecord) =>
              recursiveRender({ ...childElementProps, context: { ...childElementProps.context, localData: childRecord } }))}
          </>)
          : recursiveRender({ ...childElementProps, context: { ...childElementProps.context, localData: record } })

        elementComponent = (
          <ReComponentWrapper
            wrapperProps={{ options: { ...componentOptions }, setMetadataMode, value, record, setter }}
            rootData={rootData}
            localData={localData}
          >
            {childElements}
          </ReComponentWrapper>
        )
      } else {
        elementComponent = (
          <ReComponentWrapper
            rootData={rootData}
            localData={localData}
            wrapperProps={{ options: { ...componentOptions }, setMetadataMode, value, record, setter }} />
        );
      }
      if (componentOptions.decorators) {
        for (const decorator of Array.isArray(componentOptions.decorators) ? componentOptions.decorators : [componentOptions.decorators]) {
          const decoratorOptions = typeof decorator === 'string' ? { componentName: decorator } : decorator;
          elementComponent = (
            <ReComponentWrapper
              rootData={rootData}
              localData={localData}
              wrapperProps={{ options: { ...decoratorOptions }, setMetadataMode, value, record, setter }} >
              {elementComponent}
            </ReComponentWrapper>)
        }
      }
      elementComponents.push(elementComponent)
    }

    return elementComponents
    /*  <div className={`re-engine-element depth-${depth}`}>
       <FormControl variant="outlined" >
         {elementComponents}
       </FormControl>
     </div>) */


    function getSchemaAndAttributeDefinition(_value: any) {
      //     const schema = props.UiPlan.schemas?.[value.path[0]];
      //     const attribute = schema?.attributes?.find(attr => typeof (attr) !== 'string' && attr.attributeName === value.key);
      return { schema: {}, attribute: {} as FluxorProps<any> };
    }

    function updateComponentOptions(componentOptions: ReUiPlanElement, schema: any, attribute: FluxorProps<any>) {
      if (schema && attribute) {
        // order of preference for component options - maybe this should be a choice
        // 1. componentOptions
        // 2. attribute
        componentOptions.label = componentOptions.label || attribute.label;
        componentOptions.disabled = componentOptions.disabled || attribute.disabled;
        componentOptions.error = componentOptions.error || attribute.error;
        componentOptions.helperText = componentOptions.helperText || attribute.helperText;
        componentOptions.hidden = componentOptions.hidden || attribute.hidden;
        componentOptions.testId = componentOptions.testId || attribute.dictionaryName;
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
