import type { ComponentWrapper } from '../components/ReComponentWrapper';
import type { CNTX, ReUiPlanComponentBuilder, ReBuilderBase, FluentSimple, FluentSubBuilder } from './ReUiPlanBuilder';
import { SingleItemContainerExtension, ElementSetContainerExtension } from '../components/ContainerElements.tsx';
import { TableExtension, ColumnBuilder, FilterBuilder, TableComponent } from '../../components/tables/table.tsx';
/**
 * Maps extension methods to properly substitute CNTX and RT types.
 * Handles: SingleItemContainerExtension, ElementSetContainerExtension, TableExtension
 */
export type ExtensionOf<C extends CNTX, T extends ComponentWrapper<any, any>, BLD = unknown, RT = any> = T extends ComponentWrapper<infer P, infer E> ? E extends object ? SingleItemContainerExtension<any, any> extends E ? {
    [K in keyof E]: E[K] extends ((...args: infer A) => infer R) ? R extends SingleItemContainerExtension<any, any> ? (...args: A) => SingleItemContainerExtension<C, BLD & ExtensionOf<C, T, BLD, RT>> : R extends ReBuilderBase<any> ? E[K] : (...args: A) => BLD & ExtensionOf<C, T, BLD, RT> : E[K];
} : ElementSetContainerExtension<any, any> extends E ? {
    [K in keyof E]: E[K] extends ((...args: infer A) => infer R) ? R extends ElementSetContainerExtension<any, any> ? (...args: A) => ElementSetContainerExtension<C, BLD & ExtensionOf<C, T, BLD, RT>> : R extends ReBuilderBase<any> ? E[K] : (...args: A) => BLD & ExtensionOf<C, T, BLD, RT> : E[K];
} : TableExtension<any, any> extends E ? {
    [K in keyof E]: E[K] extends ((...args: infer A) => infer R) ? R extends FluentSimple ? ((...args: A) => ReUiPlanComponentBuilder<C, T, RT> & TableExtension<C, RT>) : R extends FluentSubBuilder<infer BLD2> ? BLD2 extends ColumnBuilder<C, any> ? ((...args: A) => ColumnBuilder<C, ComponentBuilderWithExt<C, typeof TableComponent, RT>>) : BLD2 extends FilterBuilder<C, any> ? ((...args: A) => FilterBuilder<C, ComponentBuilderWithExt<C, typeof TableComponent, RT>>) : E[K] : E[K] : E[K];
} : E : E : T;
export type ReturnTypeOf<R> = R extends ReBuilderBase<any> ? (R extends ReBuilderBase<infer RT> ? RT : never) : never;
export type ComponentBuilderWithExt<C extends CNTX, T extends ComponentWrapper<any, any>, RT> = ReUiPlanComponentBuilder<C, T, RT> & ExtensionOf<C, T, ReUiPlanComponentBuilder<C, T, RT>, RT>;
