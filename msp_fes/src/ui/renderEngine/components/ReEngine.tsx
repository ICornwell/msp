import React from 'react'

import { ReUiPlan, ReUiPlanElementSet, ReUiPlanElement, ReUiPlanElementCommmonProps, ReUiPlanElementShareableProps, ReUiPlanElementSetMember } from '../UiPlan/ReUiPlan.js'; // Adjust the path './types' to the correct location of ReUiPlan
import { ReProvider } from '../contexts/ReEngineContext.js';
import ReComponentWrapper, { ComponentWrapper } from './ReComponentWrapper';

import { FluxorProps } from '../fluxor/fluxorProps';
import { getSourceDataProxy, Notes } from '../data/uiDataProxy.js';
import PubSub, { RePubSubMsg } from '../data/ReEnginePubSub'
import { resolvePath } from '../data/pathResolver.js';

import { ReSubscriptionHandler, useRePubSub } from './RePubSubHook.js';

export type ReEngineProps = {
  UiPlan: ReUiPlan,
  sourceData: any,
  renderSettings?: any,
}

export function mergeProps<S extends { [s: string]: any; }, T extends { [s: string]: any; }>(source: S, target: T, force: boolean = false): T {
  const newProps: T = { ...target };
  Object.entries(source).forEach(([key, value]) => {
    if (force || value !== undefined && (newProps as any)[key] === undefined) {
      (newProps as any)[key] = value;
    }
  })
  return newProps;
}

type ReEngineElementSetProps = {
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
  parentElement?: ReUiPlanElement,
  parentSharedProps?: ReUiPlanElementShareableProps,
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
        parentElement: undefined,
        parentSharedProps: { labelPosition: 'start', displayMode: 'readonly' },
        depth: 0
      } as ReEngineElementSetProps)}

    </ReProvider>
  )


  function recursiveRender(elementProps: ReEngineElementSetProps): React.ReactElement | React.ReactElement[] {
    const { uiPlan, uiPlanElementSet, setMetadataMode, parentElement: parentElement, context, depth } = elementProps;
    const { rootData, localData } = context;

    if (!uiPlanElementSet) {
      return <></>; // Return empty fragment if no elements to render
    }

    const elementComponents: React.ReactElement[] = []
    //  for (const { componentName, options, containing } of uiPlanElementSet) {
    uiPlanElementSet.forEach(({ componentName, options, containing }, elementIndex) => {


      let sharedProps: ReUiPlanElementShareableProps = {}

      // find shared props for this element, if any
      if (parentElement && parentElement.sharedProps) {
        sharedProps = parentElement.sharedProps
          .sort((a, b) => (a.fromComponentIndex ?? 0) - (b.fromComponentIndex ?? 0))
          .reduce<ReUiPlanElementShareableProps>((acc, sp) => {
            if (sp.fromComponentIndex === undefined || sp.fromComponentIndex <= elementIndex) {
              // merge defined shared props
              acc = mergeProps(sp, acc, true);
            }
            return acc;
          }, {} as ReUiPlanElementShareableProps);
      }
      // merge parent's own given shared props if any not overridden by its own onward sharedProps
      if (elementProps.parentSharedProps) {
        sharedProps = mergeProps(elementProps.parentSharedProps, sharedProps);
      }

      // use shared props as a base, overridden by element options
      // multi-use options so cast to any
      const componentOptions = mergeProps(sharedProps, options || {}) as any;

      if (componentOptions.hidden) {
        return; // Skip rendering if hidden
      }
      let record: any = localData
      let value: any = localData
      let attributeName: string | number | symbol = ''
      let setter: (newValue: any) => void = () => { return; };
      let getter: (() => any) | undefined = undefined;
      let notes: Notes | undefined = undefined;

      const componentCallbackHandler = {
        dataChangeCallback: (_msg: RePubSubMsg) => {
          return;
        }
      }

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
            subscriptionHandler: ReSubscriptionHandler,
            notes?: Notes
          }> = []

          if (setMetadataMode && localData.___isProxy) {
            setMetadataMode(false);
            const subscribe = localData.___proxyPubSub.subscriptionHandler.subscribeToPubSub;
            // Subscribe to proxy fetches to collect metadata
            proxySubId = subscribe({
              callback: (msg: RePubSubMsg) => {
                functionPropsMetaData.push({
                  path: msg.path,
                  propertyKey: msg.propertyKey,
                  setter: msg.setter,
                  subscriptionHandler: msg.subscriptionHandler,
                  notes: msg.notes
                });
              }, msgTypeFilter: (msg: RePubSubMsg) => msg.messageType === 'dataFetch'
            });
          }

          // when we get the binding value, messages will let us know what properties were accessed
          getter = () => binding({
            rootData: rootData,
            localData: localData,
            localIsCollection: Array.isArray(localData),
            attributeName: '',
            collectionIndexerId: (componentOptions as any).collectionIndexerId,
          })

          const expVal = getter();

          // Unsubscribe from proxy fetches
          for (const metaData of functionPropsMetaData) {
            // redraw if anything changes

            const subscriptionHandler = createSubscriptionHandler(metaData.subscriptionHandler);
            subscriptionHandler.subscribeToPubSub({
              callback: (_msg: RePubSubMsg) => {
                componentCallbackHandler.dataChangeCallback(_msg);
              },
              msgTypeFilter: (msg: RePubSubMsg) => msg.messageType === 'dataChange'
            });
          }

          if (functionPropsMetaData.length === 1) {
            const metaData = functionPropsMetaData[0];
            setter = (newValue: any) => {
              metaData.setter(newValue);
            };
            notes = metaData.notes;
            attributeName = metaData.propertyKey.toString()
            componentOptions.attributeName = attributeName
            if (componentOptions.dataDescriptor && componentOptions.dataDescriptor?.[attributeName])
              componentOptions.propertyDescriptor = componentOptions.dataDescriptor[attributeName]
            else if (parentElement?.dataDescriptor && parentElement.dataDescriptor?.[attributeName])
              componentOptions.propertyDescriptor = parentElement.dataDescriptor[attributeName]
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

      const childElementProps: ReEngineElementSetProps = {
        uiPlan,
        uiPlanElementSet: containing ?? [],
        setMetadataMode,
        context: {
          rootData: rootData,
          buildSettings: props.UiPlan.buildSettings,
          renderSettings: context.renderSettings,

          localData: value,
          fluxorMetaData: context.fluxorMetaData,
          temporaryData: context.temporaryData
        },
        parentElement: componentOptions, // use any calculated options including shared props
        parentSharedProps: sharedProps,
        depth: depth + 1
      }
      // create a factory to pass down to children for creating their own elements
      let factory = (element: ReUiPlanElementSet | ReUiPlanElementSetMember | ReUiPlanElement, data: any) => {
        const elements: ReUiPlanElementSetMember[] = [];
        if (!Array.isArray(element)) {
          if (!(element as any).options) { // it isn't a set member, make it one
            const pe = element as ReUiPlanElement;
            element = {
              componentName: pe.componentName,
              options: { ...pe },
              containing: pe.children
            }
          }
          elements.push(element as ReUiPlanElementSetMember);
        } else {
          elements.push(...(element as unknown as ReUiPlanElementSet));
        }
        return recursiveRender({ ...childElementProps, uiPlanElementSet: elements, context: { ...childElementProps.context, localData: data } });
      };
      const systemProps = { reEngineElementFactory:factory, componentCallbackHandler, notes, setMetadataMode, value, record, getter, setter }

      if (containing) {
        childElementProps.uiPlanElementSet = containing;
        record = childElementProps.context.localData
        const childElements = componentOptions.useSingleChildForArrays
          ? (<>
            {(Array.isArray(record) ? record : [record]).map((childRecord, idx) =>
              recursiveRender({ ...childElementProps, context: { ...childElementProps.context, localData: childRecord } }))}
          </>)
          : recursiveRender({ ...childElementProps, context: { ...childElementProps.context, localData: record } });

        elementComponent = (
          <ReComponentWrapper
            key={elementIndex}
            wrapperProps={{ options: { ...componentOptions }, ...systemProps, record }}
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
            wrapperProps={{ options: { ...componentOptions }, ...systemProps, record }} />
        );
      }
      if (componentOptions.decorators) {
        for (const decorator of Array.isArray(componentOptions.decorators) ? componentOptions.decorators : [componentOptions.decorators]) {
          const decoratorOptions = typeof decorator === 'string' ? { componentName: decorator } : decorator;
          elementComponent = (
            <ReComponentWrapper
              rootData={rootData}
              localData={localData}
              wrapperProps={{ options: { ...decoratorOptions }, ...systemProps, record }} >
              {elementComponent}
            </ReComponentWrapper>)
        }
      }
      elementComponents.push(elementComponent)
    })

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
