import { ComponentType, ReactNode, useState } from 'react';
import { useEngineComponentsContext } from '../contexts/ReComponentsContext.js';
import FormHelperText from '@mui/material/FormHelperText';
import FormControlLabel from '@mui/material/FormControlLabel';
import { ReComponentCommonProps, ReComponentSystemProps } from './ReComponentProps';
import { makeStyles } from 'tss-react/mui';
import { Theme } from '@mui/material/styles';
import { RePubSubMsg } from '../data/ReEnginePubSub.js';
import { ReSubscriptionHandler } from './RePubSubHook.js';
import { ReUiPlanDisplayMode, CNTX } from '../UiPlan/ReUiPlan.js';
import { ReNullExtension } from '../UiPlan/ReUiPlanBuilder.js';
import { FluxorData } from '../fluxor/fluxorData.js';

const useStyles = makeStyles()((theme: Theme) => ({
  label: {
    color: theme.palette.text.primary,
  },
  lineHeight: {
    lineHeight: theme.spacing(3),
  },
}));

interface WrapperProps {
  wrapperProps: ReComponentSystemProps;
  rootData?: any;
  localData?: any;
  children?: ReactNode;
}

export default function ReComponentWrapper({ wrapperProps, rootData, localData, children }: WrapperProps) {
  const { classes } = useStyles()
  const { value, record, setMetadataMode, setter, getter, notes, componentCallbackHandler } = wrapperProps
  const { getComponentInstantiator } = useEngineComponentsContext()

  const [ dataValue, setDataValue ] = useState(value);
  const [redrawToggle, setRedrawToggle] = useState(false);

  function triggerRedraw() {
    setDataValue(getter ? getter() : value);
    setRedrawToggle(!redrawToggle);
  }

  if (componentCallbackHandler && componentCallbackHandler.dataChangeCallback) {
    componentCallbackHandler.dataChangeCallback = (_msg: RePubSubMsg) => {
      triggerRedraw();
    }
  }

  const shadowsProps = { ...wrapperProps.options }
  if (wrapperProps.options?.propertyDescriptor) {
    for (const [key, val] of Object.entries(wrapperProps.options.propertyDescriptor)) {
      if (!(key in shadowsProps) || shadowsProps[key] === undefined) {
        (shadowsProps as any)[key] = val;
      }
    }
  }


  function updateModelData(_newValue: any) {
    if (setter) {
      setter(_newValue);
    }
  };

  for (const [key, val] of Object.entries(shadowsProps || {})) {
    if (val && typeof val === 'object'
      && (val.executionPlan || val.executionPlan == '') && val.expression
      && typeof val.expression === 'function') {

      let proxySubId: any = undefined;

      // Collect metadata about function properties
      const functionPropsMetaData: Array<{
        path: string,
        propertyKey: string | number | symbol,
        subscriptionHandler: ReSubscriptionHandler,
        //       setter: (newValue: any) => void
      }> = []

      if (setMetadataMode && localData.___isProxy) {
        setMetadataMode(false);
        const subscribe = localData.___proxyPubSub.subscriptionHandler.subscribeToPubSub;
        // Subscribe to proxy fetches to collect metadata
        proxySubId = subscribe({
          callback: (msg: RePubSubMsg) => {
            functionPropsMetaData.push({
              path: msg.path, propertyKey: msg.propertyKey,
              subscriptionHandler: msg.subscriptionHandler
            });
          }, msgTypeFilter: (msg: RePubSubMsg) => msg.messageType === 'dataFetch'
        });
      }

      // when we get the binding value, messages will let us know what properties were accessed
      const expVal = val.expression({
        rootData: rootData,
        localData: localData,
        localIsCollection: Array.isArray(localData),
        attributeName: key,
        collectionIndexerId: wrapperProps?.options?.collectionIndexerId,
      })

      // Unsubscribe from proxy fetches
      for (const metaData of functionPropsMetaData) {
        // TODO: we should use a subscription hook that will clean up on unmount
        metaData.subscriptionHandler.subscribeToPubSub({
          callback: (_msg: RePubSubMsg) => {
            triggerRedraw();
          },
          msgTypeFilter: (msg: RePubSubMsg) => msg.messageType === 'dataChange'
        });
      }
      if (proxySubId) {
        const unsubscribe = localData.___proxyPubSub.subscriptionHandler.unsubscribeFromPubSub;
        unsubscribe(proxySubId);
      }

      // Set the evaluated value
      (shadowsProps as any)[key] = expVal;
    } else {
      (shadowsProps as any)[key] = val;
    }
  }

  const instantiatorProps = getComponentInstantiator(shadowsProps?.componentName ?? 'none', shadowsProps?.displayMode) // this will throw an error if the component is not registered
  if (!children || Array.isArray(children) && children.length === 0) children = undefined

  if (typeof (instantiatorProps?.instantiator) != 'function') {
    console.log(`Component ${shadowsProps?.componentName} as no valid instantiator`)
    console.log(instantiatorProps)
    console.log(wrapperProps)
    return null
  }

  function onChangeHandler(newValue: any) {
    // For controlled components, we would handle the change here
    // but in this engine, we expect bindings to handle data updates
    console.log(`onChange event received with value:`, newValue);
    updateModelData(newValue);
  }

  const component = instantiatorProps.instantiator(
    {
      ...shadowsProps,
      events: {
        onChange: onChangeHandler
      },
      reEngineElementFactory: wrapperProps?.reEngineElementFactory,
      notes: notes,
      value: dataValue,
      record: record,
      children: children
    }
  )
  if (component === null) {
    console.log(`instatiator returned a null component`)
    return null
  }
  if (component === undefined) {
    console.log(`instatiator returned an undefined component`)
    return null
  }
  if (typeof component === 'object') {
    if (instantiatorProps.options?.isManagedForm) {
      return (
        <>
          <FormHelperText>{shadowsProps?.helperText as string}</FormHelperText>
          <FormControlLabel className={classes.label}
            control={component} labelPlacement="start" label={shadowsProps?.label as string} />
        </>
      )
    } else {
      return (
        <>
          {component}
        </>
      )
    }
  }

  console.log(`instatiator returned a non renderable component`)
  console.log(component)
  return null
}

export type DisplayMode = ReUiPlanDisplayMode | 'all';
/**
 * Base component wrapper that includes both the component and its metadata
 */
export interface ComponentWrapper<P, E = ReNullExtension> {
  isComponentWrapper: true;
  // The actual React component
  component: ComponentType<P>;
  // Display name for debugging
  displayName: string;
  // Whether this component accepts children
  acceptsChildren: boolean;
  // Whether this component is a managed form component
  isManagedForm: boolean;
  // The type of props this component accepts
  __propType?: P; // Never used at runtime, only for type inference

  displayMode?: DisplayMode | DisplayMode[];
  extensions?: E;
  // Factory function to create runtime extension instance
  // dataDescriptor is generic to allow type inference from the actual value
  extensionFactory?: <C extends CNTX, RT, BLD>(returnTo: RT, builder: BLD, contextPlaceHolder: C) => E;
}

/**
 * Create a wrapper for a component that doesn't accept children
 */
export function createLeafComponent<P extends object>(
  component: ComponentType<P & ReComponentCommonProps & ReComponentSystemProps>,
  displayName?: string,
  isManagedForm?: boolean
): ComponentWrapper<P> {
  return {
    isComponentWrapper: true,
    component,
    displayName: displayName || component.displayName || component.name || 'UnnamedComponent',
    acceptsChildren: false,
    isManagedForm: isManagedForm || false,
    displayMode: 'all',
  };
}

export function createLeafReadOnlyComponent<P extends object>(
  component: ComponentType<P & ReComponentCommonProps & ReComponentSystemProps>,
  displayName?: string
): ComponentWrapper<P> {
  return {
    isComponentWrapper: true,
    component,
    displayName: displayName || component.displayName || component.name || 'UnnamedComponent',
    acceptsChildren: false,
    isManagedForm: false,
    displayMode: 'readonly',
  };
}

export function createLeafEditableComponent<P extends object>(
  component: ComponentType<P & ReComponentCommonProps & ReComponentSystemProps>,
  displayName?: string
): ComponentWrapper<P> {
  return {
    isComponentWrapper: true,
    component,
    displayName: displayName || component.displayName || component.name || 'UnnamedComponent',
    acceptsChildren: false,
    isManagedForm: false,
    displayMode: 'editable',
  };
}

/**
 * Create a wrapper for a component that accepts children
 */
export function createContainerComponent<P extends { children?: ReactNode }>(
  component: ComponentType<P>,
  displayName?: string
): ComponentWrapper<P> {
  return {
    isComponentWrapper: true,
    component,
    displayName: displayName || component.displayName || component.name || 'UnnamedContainer',
    acceptsChildren: true,
    isManagedForm: false,
    displayMode: 'all'
  };
}

export function createExtendedComponent<P extends Object, E>(
  component: ComponentType<P>,
  displayName?: string,
  extensionFactory?: <C extends CNTX, RT, BLD>(returnTo: RT, builder: BLD, _contextPlaceHolder: C) => E
): ComponentWrapper<P, E> {
  return {
    isComponentWrapper: true,
    component,
    displayName: displayName || component.displayName || component.name || 'UnnamedContainer',
    acceptsChildren: true,
    isManagedForm: false,
    displayMode: 'all',
    extensionFactory: extensionFactory as<C extends CNTX, RT, BLD>(returnTo: RT, builder: BLD, contextPlaceHolder: C) => E
  };
}
