import { BSDDTOf, CNTX, ContextOf, LDDTOf, RDDTOf, ReUiPlan, ReUiPlanElement, ReUiPlanElementSet, ReUiPlanExpressionProp, RSDDTOf, TDDTOf } from './ReUiPlan';
import type { FluxorProps } from '../fluxor/fluxorProps';
import { ReComponentBinder, ReComponentReBinder } from '../components/ReComponentProps';
import { ComponentWrapper } from '../components/ReComponentWrapper';
import { FluxorData } from '../fluxor/fluxorData';
import { ComponentBuilderWithExt } from './ReUiPlanBuilder.extensions.generated';
export type { CNTX, LDDTOf, RDDTOf, BSDDTOf, RSDDTOf, TDDTOf };
export type ContextAndRtOf<C extends CNTX, RT> = {
    __rt: () => RT;
    __c: () => C;
};
export type FluentSimple = {
    _fluentSimple: () => void;
};
export type FluentSubBuilder<SB> = {
    _fluentSubBuilder: () => SB;
};
export type FluentReturn = {};
export type FluentExtension = {};
export type PropsOf<T extends ComponentWrapper<any>> = T extends ComponentWrapper<infer P> ? P : never;
export type DataOf<D extends FluxorData<any>> = D extends FluxorData<infer T> ? T : never;
export type ReBuilder = {
    build: <BS>(buildSettings: BS, dataDescriptor: FluxorData<any>) => any;
};
export type ReExtensionBuilder<RT> = {
    _endExtension?: () => RT;
    _buildExtension?: <BS>(buildSettings: BS, extendedElement: any) => void;
};
export type ReNullExtension = {
    _buildExtension?: <BS>(buildSettings: BS, extendedElement: any) => void;
};
export type ElementBuilderQuartet<C extends CNTX, RT> = {
    fromElementBuilder: (builder: ReUiPlanComponentBuilder<any, any, any>) => RT;
    fromElementObject: (element: ReUiPlanElement) => RT;
    fromComponentElement: <T extends ComponentWrapper<any>>(component: T) => ComponentBuilderWithExt<C, T, RT>;
    fromFluxorElement: () => ReUiPlanComponentBuilder<C, any, RT>;
};
export declare function createElementBuilderQuartet<C extends CNTX, RT>(returnTo: RT, componentBuilders: ReUiPlanComponentBuilder<any, any, any>[], containedElementSetBuilders?: ReUiPlanElementSetBuilder<any, any>[], dataDescriptor?: FluxorData<any>): ElementBuilderQuartet<C, RT>;
export interface ReBuilderBase<T> {
    build: <BS>(buildSettings: BS) => any;
    end: () => T;
}
export interface ExtenderBase<T> {
    _none: () => T;
}
export type ReUiPlanBuilderElementsOptions<C extends CNTX> = {
    fromElementSetBuilder: (builder: ReUiPlanElementSetBuilder<C, ReUiPlanBuilder<C>>) => ReUiPlanBuilder<C>;
    fromElementSetObject: (set: ReUiPlanElementSet) => ReUiPlanBuilder<C>;
    fromInlineElementSet: ReUiPlanElementSetBuilder<C, ReUiPlanBuilder<C>>;
};
export interface ReUiPlanBuilder<C extends CNTX> extends ReBuilderBase<undefined> {
    withDisplayTypeMap: (map: [string, string][]) => ReUiPlanBuilder<C>;
    withRules: (rules: string[]) => ReUiPlanBuilder<C>;
    withFluxorSet: (Fluxors: FluxorProps<any>[]) => ReUiPlanBuilder<C>;
    withElementSet: {
        usingFluxor<RDDT2 extends FluxorData<any>>(dataDescriptor: RDDT2, binding?: ReComponentReBinder<C, RDDT2>): ReUiPlanBuilderElementsOptions<CNTX<BSDDTOf<C>, RSDDTOf<C>, RDDT2, RDDT2, TDDTOf<C>>>;
    } & ReUiPlanBuilderElementsOptions<C>;
    withDescription: (description: string) => ReUiPlanBuilder<C>;
    BuildUiPlan: <BS>(buildSettings?: BS) => ReUiPlan;
    end: () => undefined;
    build: <BS>(buildSettings: BS) => ReUiPlan;
}
export interface ReUiPlanElementSetBuilder<C extends CNTX, RT> extends ReBuilderBase<RT> {
    showingItem: ElementBuilderQuartet<C, ReUiPlanElementSetBuilder<C, RT>>;
    usingFluxor: <LDDT2 extends FluxorData<any>>(_dataDescriptor: LDDT2, binding?: ReComponentReBinder<C, LDDT2>) => ReUiPlanElementSetBuilder<CNTX<BSDDTOf<C>, RSDDTOf<C>, RDDTOf<C>, LDDT2, TDDTOf<C>>, RT>;
    withSharedProps: () => ReUiPlanSharedPropsBuilder<C, ReUiPlanElementSetBuilder<C, RT>>;
    endSet: RT;
    build: <BS>(buildSettings: BS) => {
        components: ReUiPlanElementSet;
        sharedProps: ReUiPlanElement[];
    };
    end: () => RT;
}
export interface ReUiPlanDecoratorSetBuilder<C extends CNTX, RT> extends ReBuilderBase<RT> {
    showing: ElementBuilderQuartet<C, ReUiPlanDecoratorSetBuilder<C, RT>>;
    endDecoratorSet: RT;
    build: <BS>(buildSettings: BS) => {
        components: ReUiPlanElementSet;
    };
    end: () => RT;
}
export interface ReUiPlanComponentBuilder<C extends CNTX, T extends ComponentWrapper<any>, RT> extends ReBuilderBase<RT> {
    usingFluxor: <LDDT2 extends FluxorData<any>>(_dataDescriptor: LDDT2, binding?: ReComponentReBinder<C, LDDT2>) => ComponentBuilderWithExt<CNTX<BSDDTOf<C>, RSDDTOf<C>, RDDTOf<C>, LDDT2, TDDTOf<C>>, T, RT>;
    withHideWhenRule: (hidden: boolean | ReUiPlanExpressionProp<ContextOf<C>>) => ComponentBuilderWithExt<C, T, RT>;
    hide: () => ComponentBuilderWithExt<C, T, RT>;
    withDisableWhenRule: (disabled: boolean | ReUiPlanExpressionProp<ContextOf<C>>) => ComponentBuilderWithExt<C, T, RT>;
    disable: () => ComponentBuilderWithExt<C, T, RT>;
    withErrorCondition: (error: boolean | ReUiPlanExpressionProp<ContextOf<C>>) => ComponentBuilderWithExt<C, T, RT>;
    withHelperText: (helperText: string | ReUiPlanExpressionProp<ContextOf<C>>) => ComponentBuilderWithExt<C, T, RT>;
    withLabel: (label: string | ReUiPlanExpressionProp<ContextOf<C>>) => ComponentBuilderWithExt<C, T, RT>;
    withLabelPosition: (labelPosition: 'top' | 'start' | 'end' | 'bottom' | ReUiPlanExpressionProp<ContextOf<C>>) => ComponentBuilderWithExt<C, T, RT>;
    withDisplayMode: (displayMode: 'editing' | 'editable' | 'readonly' | ReUiPlanExpressionProp<ContextOf<C>>) => ComponentBuilderWithExt<C, T, RT>;
    withoutCollectionExpansion: (isSingleChildForArrays: boolean) => ComponentBuilderWithExt<C, T, RT>;
    withDecorators: () => ReUiPlanDecoratorSetBuilder<C, ComponentBuilderWithExt<C, T, RT>>;
    withValueBinding: (binding: ReComponentBinder<DataOf<RDDTOf<C>>, DataOf<LDDTOf<C>>>) => ComponentBuilderWithExt<C, T, RT>;
    withExtraBinding: (boundPropName: string, binding: ReComponentBinder<DataOf<RDDTOf<C>>, DataOf<LDDTOf<C>>>) => ComponentBuilderWithExt<C, T, RT>;
    basedOnElementBuilder: (builder: ReUiPlanComponentBuilder<any, any, any>) => ComponentBuilderWithExt<C, T, RT>;
    basedOnElement: (element: ReUiPlanElement) => ComponentBuilderWithExt<C, T, RT>;
    withComponentProps: (props: PropsOf<T>) => ComponentBuilderWithExt<C, T, RT>;
    withTempVar: <K extends string, V>(key: K, value: V) => ComponentBuilderWithExt<C, T, RT>;
    build: <BS>(buildSettings: BS) => ReUiPlanElement;
    endElement: RT;
    end: () => RT;
}
export interface ReUiPlanSharedPropsBuilder<C extends CNTX, RT> extends ReBuilderBase<RT> {
    usingFluxor: <LDDT2 extends FluxorData<any>>(_dataDescriptor: LDDT2, binding?: ReComponentReBinder<C, LDDT2>) => ReUiPlanSharedPropsBuilder<CNTX<BSDDTOf<C>, RSDDTOf<C>, RDDTOf<C>, LDDT2, TDDTOf<C>>, RT>;
    withLabelPosition: (labelPosition: 'top' | 'start' | 'end' | 'bottom' | ReUiPlanExpressionProp<ContextOf<C>>) => ReUiPlanSharedPropsBuilder<C, RT>;
    withDisplayMode: (displayMode: 'editing' | 'editable' | 'readonly' | ReUiPlanExpressionProp<ContextOf<C>>) => ReUiPlanSharedPropsBuilder<C, RT>;
    withDecorators: () => ReUiPlanDecoratorSetBuilder<C, ReUiPlanSharedPropsBuilder<C, RT>>;
    withComponentProps: <P>(props: P) => ReUiPlanSharedPropsBuilder<C, RT>;
    build: <BS>(buildSettings: BS) => ReUiPlanElement;
    endSharedProps: RT;
    end: () => RT;
}
export declare function CreateReUiPlan<C extends CNTX = CNTX>(name: string, version?: string): ReUiPlanBuilder<C>;
export declare function CreateReUiPlanElementSet<C extends CNTX, RT>(returnTo: RT, elementSetBuilders: ReUiPlanElementSetBuilder<any, any>[], dataDescriptor?: FluxorData<any>): ReUiPlanElementSetBuilder<C, RT>;
export declare function CreateReUiPlanDecoratorSet<C extends CNTX, RT>(returnTo: RT, decoratorSetBuilders: ReUiPlanDecoratorSetBuilder<any, any>[], dataDescriptor?: FluxorData<any>): ReUiPlanDecoratorSetBuilder<C, RT>;
export declare function CreateReUiPlanComponent<C extends CNTX, T extends ComponentWrapper<any>, RT>(returnTo: RT, componentWrapper?: T, set?: ReUiPlanComponentBuilder<any, any, any>[], childBuilders?: ReUiPlanElementSetBuilder<any, any>[], dataDescriptor?: FluxorData<any>): ComponentBuilderWithExt<C, T, RT>;
export declare function CreateReUiSharedProps<C extends CNTX, RT>(returnTo: RT, fromComponentIndex: number, set?: ReUiPlanSharedPropsBuilder<any, any>[], childBuilders?: ReUiPlanElementSetBuilder<any, any>[], dataDescriptor?: FluxorData<any>): ReUiPlanSharedPropsBuilder<C, RT>;
export declare function ReUiPlanElementToReComponentProps(element: ReUiPlanElement): ReUiPlanElement;
