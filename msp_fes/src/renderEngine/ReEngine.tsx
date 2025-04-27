import { JSX } from 'preact'
import { ReUiPlan, ReUiPlanElementSet } from './UiPlan/ReUiPlan'; // Adjust the path './types' to the correct location of ReUiPlan
import { ReProvider, useReContext } from './contexts/ReEngineContext';

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

export function ReEngine( _props: ReEngineProps) {
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
}

function recursiveRender(elementProps: ReEngineElementProps): JSX.Element {
  const { uiPlan, uiPlanElementSet, sourceData, parentElementProps, parentData, depth } = elementProps;
 
  const context = useReContext;
  const elementComponets: JSX.Element[] = []
  for (const {componentName, options} of uiPlanElementSet) {
    //const { hidden, disabled, error, helperText, label } = options;
    // const isHidden = typeof hidden === 'function' ? (hidden as ReUiPlanExpressionProp)() : hidden;
    // const isDisabled = typeof disabled === 'function' ? disabled() : disabled;
    // const isError = typeof error === 'function' ? error() : error;
    // const helperTextValue = typeof helperText === 'function' ? helperText() : helperText;
    // const labelValue = typeof label === 'function' ? label() : label;
    if (options.isHidden) {
      continue; // Skip rendering if hidden
    }

    // Render the component based on its type
    switch (componentName) {
      case 'NumberInput':
        return (
          <div key={componentName} style={{ marginLeft: `${depth * 20}px` }}>
            <label>{labelValue}</label>
            <input type="number" disabled={isDisabled} />
            {isError && <span style={{ color: 'red' }}>{helperTextValue}</span>}
          </div>
        );
      // Add more cases for different component types as needed
      default:
        return null; // Handle unknown component types
    }
  }
}
//   return (