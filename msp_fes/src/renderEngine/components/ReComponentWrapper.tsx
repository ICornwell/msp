import React, { ReactNode } from 'react';
import { ReUiPlanElement } from '../UiPlan/ReUiPlan'
import { useEngineComponentsContext } from '../contexts/ReComponentsContext';
import FormHelperText from '@mui/material/FormHelperText';
import FormControlLabel from '@mui/material/FormControlLabel';
import { ReComponentWrapperProps } from './ReComponentProps';
import { makeStyles } from 'tss-react/mui';
import { Theme } from '@mui/material/styles';


const useStyles = makeStyles()(( theme: Theme ) => ({
  label: {
    color: theme.palette.text.primary,
  }
}));

interface WrapperProps {
  props: ReComponentWrapperProps;
  children?: ReactNode;
}

export default function ReComponentWrapper({ props, children }: WrapperProps) {
  const { classes } = useStyles()
  const { value, record } = props
  const { getComponentInstantiator } = useEngineComponentsContext()

  const instantiatorProps = getComponentInstantiator(props.options?.componentName ?? 'none') // this will throw an error if the component is not registered
  if (!children || Array.isArray(children) && children.length === 0) children = undefined

  if (typeof (instantiatorProps?.instantiator) != 'function') {
    console.log(`Component ${props.options?.componentName} as no valid instantiator`)
    console.log(instantiatorProps)
    console.log(props)
    return null
  }

  const component = instantiatorProps.instantiator(
    {
      ...props.options,
      value: value?.value,
      record: record?.value,
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
          <FormHelperText>{props?.options?.helperText}</FormHelperText>
          <FormControlLabel className={classes.label}
            control={component} labelPlacement="start" label={props?.options?.label} />
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