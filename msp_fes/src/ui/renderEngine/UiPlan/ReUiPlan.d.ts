import { ReComponentBinder } from "../components/ReComponentProps";
import { FluxorData } from "../fluxor/fluxorData";
import { FluxorProps } from "../fluxor/fluxorProps";
export interface CNTX<BSDDT = any, RSDDT = any, RDDT extends FluxorData<any> = FluxorData<any>, LDDT extends FluxorData<any> = FluxorData<any>, TDDT = any> {
    _bddt?: BSDDT;
    _rsddt?: RSDDT;
    _rddt?: RDDT;
    _lddt?: LDDT;
    _tddt?: TDDT;
}
export type BSDDTOf<C extends CNTX> = C extends CNTX<infer BS, any, any, any, any> ? BS : never;
export type RSDDTOf<C extends CNTX> = C extends CNTX<any, infer RS, any, any, any> ? RS : never;
export type RDDTOf<C extends CNTX> = C extends CNTX<any, any, infer R, any, any> ? R : never;
export type LDDTOf<C extends CNTX> = C extends CNTX<any, any, any, infer L, any> ? L : never;
export type TDDTOf<C extends CNTX> = C extends CNTX<any, any, any, any, infer T> ? T : never;
export type ContextOf<C extends CNTX> = {
    buildSettings: BSDDTOf<C>;
    renderSettings: RSDDTOf<C>;
    rootData: RDDTOf<C>;
    localData: LDDTOf<C>;
    temporaryData: TDDTOf<C>;
};
export type WithLDDT<C extends CNTX, NewLDDT extends FluxorData<any>> = CNTX<BSDDTOf<C>, RSDDTOf<C>, RDDTOf<C>, NewLDDT, TDDTOf<C>>;
export type WithTDDT<C extends CNTX, NewTDDT> = CNTX<BSDDTOf<C>, RSDDTOf<C>, RDDTOf<C>, LDDTOf<C>, NewTDDT>;
export type ReUiPlanExpressionPropExecutionPlan = 'OnBuild' | 'OnRender' | 'OnSourceChangeEvent' | 'OnPropChangeEvent';
export type ReUiPlan = {
    id: string;
    name: string;
    description: string;
    version: string;
    rules?: string[];
    fluxors?: FluxorProps<any>[];
    displayTypeMap?: [string, string][];
    mainPlanElementSet?: ReUiPlanElementSet;
    buildSettings?: any;
    dataDescriptor?: FluxorData<any>;
    sharedProps?: ReUiPlanElementShareableProps[];
};
export type ReUiPlanExpressionProp<C> = {
    executionPlan: any;
    expression: string | ((context: C) => any);
};
export type ReUiPlanElementSetMember = {
    componentName?: string;
    options: ReUiPlanElement;
    containing?: ReUiPlanElementSet;
};
export type ReUiPlanElementSet = ReUiPlanElementSetMember[];
export type ReUiPlanDisplayMode = 'editing' | 'editable' | 'readonly';
export type ReUiPlanElementShareableProps = {
    labelPosition?: 'top' | 'start' | 'end' | 'bottom' | ReUiPlanExpressionProp<any>;
    displayMode?: ReUiPlanDisplayMode | ReUiPlanExpressionProp<any>;
    componentProps?: any;
    fromComponentIndex?: number;
    decorators?: any[];
};
export type ReUiPlanElementCommmonProps = {
    hidden?: boolean | ReUiPlanExpressionProp<any>;
    disabled?: boolean | ReUiPlanExpressionProp<any>;
    error?: boolean | ReUiPlanExpressionProp<any>;
    helperText?: string | ReUiPlanExpressionProp<any>;
    label?: string | ReUiPlanExpressionProp<any>;
    binding?: ReComponentBinder<any, any>;
    extraBindings?: Record<string, ReComponentBinder<any, any>>;
    useSingleChildForArrays?: boolean;
    testId?: string;
    children?: ReUiPlanElementSet;
} & ReUiPlanElementShareableProps;
export type ReUiPlanElement = {
    isReUIPlanElement: true;
    isUsed?: boolean;
    componentName?: string;
    componentProps?: any;
    buildSettings: any;
    sharedProps?: ReUiPlanElementShareableProps[];
    dataDescriptor?: FluxorData<any>;
    collectionIndexerId?: string;
    attributeName?: string;
    propertyDescriptor?: any;
} & ReUiPlanElementCommmonProps;
export type ReBinding = {};
