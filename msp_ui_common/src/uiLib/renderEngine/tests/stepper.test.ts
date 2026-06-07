import { ExtensionOf } from '../UiPlan/ReUiPlanBuilder.extensions.generated.js';
import { StepperExtension } from '../../components/containers/stepper.js';
import { ComponentWrapper } from '../components/ReComponentWrapper.js';

type ext = ExtensionOf<any, ComponentWrapper<any, StepperExtension<any, any>>, any, any>;

//const se: StepperExtension<any, any> = {} as any;

const x: ext = {} as ext

x.withPage('this').withDescription('as')


