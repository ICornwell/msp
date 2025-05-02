import { ComponentChildren } from 'preact';
import { ReUiPlanElement } from '../UiPlan/ReUiPlan'
import { useEngineComponentsContext } from '../contexts/ReComponentsContext';


export default function ReComponentWrapper({ options, children }: { options: ReUiPlanElement, children?: ComponentChildren }) {

  const { getComponentInstantiator } = useEngineComponentsContext()

  const instatiator = getComponentInstantiator(options.componentName ?? 'none') // this will throw an error if the component is not registered

  const component = instatiator(options)
  if (component === null) {
    return null
  }
  if (typeof component === 'function') {
    const Component = component as any
    if (children) {
      return <Component {...options} >{children}</Component>
    } else {
      return <Component {...options} />
    }
  }
}