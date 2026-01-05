import { defaultDisplayMap } from '../fluxor/defaultDisplayMap';
// Helper to create a minimal builder for prebuilt elements
// All methods are no-ops that return self, satisfying the interface without doing work
function createPrebuiltElementBuilder(element, returnTo) {
    const builder = {
        build: () => element,
        end: () => returnTo,
        endElement: returnTo
    };
    // All configuration methods are no-ops - element is already built
    const noOp = () => builder;
    builder.usingFluxor = noOp;
    builder.withHideWhenRule = noOp;
    builder.hide = noOp;
    builder.disable = noOp;
    builder.withDisableWhenRule = noOp;
    builder.withErrorCondition = noOp;
    builder.withHelperText = noOp;
    builder.withLabel = noOp;
    builder.withLabelPosition = noOp;
    builder.withDisplayMode = noOp;
    builder.withoutCollectionExpansion = noOp;
    builder.withDecorators = () => ({});
    builder.withValueBinding = noOp;
    builder.withExtraBinding = noOp;
    builder.basedOnElementBuilder = noOp;
    builder.basedOnElement = noOp;
    builder.withComponentProps = noOp;
    builder.withTempVar = noOp;
    return builder;
}
// Factory to create the quartet - encapsulates the pattern
export function createElementBuilderQuartet(returnTo, componentBuilders, containedElementSetBuilders, dataDescriptor) {
    return {
        fromElementBuilder: (componentBuilder) => {
            componentBuilders.push(componentBuilder);
            return returnTo;
        },
        fromElementObject: (element) => {
            componentBuilders.push(createPrebuiltElementBuilder(element, returnTo));
            return returnTo;
        },
        fromComponentElement: (component) => CreateReUiPlanComponent(returnTo, component, componentBuilders, containedElementSetBuilders, dataDescriptor),
        fromFluxorElement: () => CreateReUiPlanComponent(returnTo, undefined, componentBuilders, containedElementSetBuilders, dataDescriptor)
    };
}
// ============================================================================
// Factory Functions
// ============================================================================
export function CreateReUiPlan(name, version) {
    const reUiPlan = {
        id: name,
        name: name,
        description: '',
        version: version ?? 'default',
        displayTypeMap: defaultDisplayMap,
        rules: [],
        fluxors: [],
        mainPlanElementSet: [],
        sharedProps: [],
        buildSettings: undefined,
        dataDescriptor: undefined
    };
    let mainPlainElementSetBuilders = [];
    function getWithElementsOptions(returnTo, dataDescriptor) {
        return {
            fromElementSetBuilder: function (elementSetBuilder) {
                mainPlainElementSetBuilders.push(elementSetBuilder);
                return returnTo;
            },
            fromElementSetObject: function (set) {
                if (!reUiPlan.mainPlanElementSet) {
                    reUiPlan.mainPlanElementSet = [];
                }
                reUiPlan.mainPlanElementSet.push(...set);
                return returnTo;
            },
            fromInlineElementSet: CreateReUiPlanElementSet(returnTo, mainPlainElementSetBuilders, dataDescriptor)
        };
    }
    const builder = {
        withElementSet: {
            usingFluxor: function (newDataDescriptor, binding) {
                // Return options with the new context type - the builder cast is safe because 
                // we're just changing the type parameter, and the actual object is the same
                return getWithElementsOptions(builder, newDataDescriptor);
            },
            ...(getWithElementsOptions({}))
        },
        withDisplayTypeMap: function (map) {
            reUiPlan.displayTypeMap = map;
            return builder;
        },
        withRules: function (rules) {
            reUiPlan.rules = rules;
            return builder;
        },
        withFluxorSet: function (Fluxors) {
            reUiPlan.fluxors = Fluxors;
            return builder;
        },
        withDescription: function (description) {
            reUiPlan.description = description;
            return builder;
        },
        BuildUiPlan: function (buildSettings) {
            for (const esb of mainPlainElementSetBuilders) {
                const elements = esb.build(buildSettings);
                if (!reUiPlan.mainPlanElementSet) {
                    reUiPlan.mainPlanElementSet = [];
                }
                reUiPlan.mainPlanElementSet.push(...elements.components);
                reUiPlan.sharedProps?.push(...((elements.sharedProps ?? []).filter(sp => sp && sp.isUsed)));
            }
            reUiPlan.buildSettings = buildSettings;
            return reUiPlan;
        },
        build: function (_buildSettings) { console.log('Use BuildUiPlan instead of build'); return reUiPlan; },
        end: function () {
            return undefined;
        }
    };
    // Patch up circular reference
    Object.assign(builder.withElementSet, getWithElementsOptions(builder));
    return builder;
}
export function CreateReUiPlanElementSet(returnTo, elementSetBuilders, dataDescriptor) {
    let components = [];
    let componentBuilders = [];
    let innerTypedElementBuilder = undefined;
    let sharedProps = [];
    const builder = {
        usingFluxor: function (innerDataDescriptor, binding) {
            const newBuilder = CreateReUiPlanElementSet(returnTo, elementSetBuilders, innerDataDescriptor);
            innerTypedElementBuilder = newBuilder;
            return newBuilder;
        },
        // Use the reusable quartet abstraction
        showingItem: {},
        withSharedProps: () => ({}),
        endSet: returnTo,
        build: function (buildSettings) {
            for (const cb of componentBuilders) {
                const element = cb.build(buildSettings);
                components.push({ componentName: element.componentName, options: { ...element, ...element.componentProps }, containing: element.children });
            }
            const sharedPropsElements = [];
            for (const spb of sharedProps) {
                const spElement = spb.build(buildSettings);
                sharedPropsElements.push(spElement);
            }
            if (innerTypedElementBuilder) {
                const innerElements = innerTypedElementBuilder.build(buildSettings);
                components.push(...innerElements.components);
                sharedPropsElements.push(...innerElements.sharedProps);
            }
            return { components: components, sharedProps: sharedPropsElements };
        },
        end: function () {
            return returnTo;
        }
    };
    builder.withSharedProps = () => CreateReUiSharedProps(builder, componentBuilders.length, sharedProps, undefined, dataDescriptor);
    // Instantiate the quartet with proper return reference
    builder.showingItem = createElementBuilderQuartet(builder, componentBuilders, undefined, dataDescriptor);
    elementSetBuilders.push(builder);
    return builder;
}
export function CreateReUiPlanDecoratorSet(returnTo, decoratorSetBuilders, dataDescriptor) {
    let components = [];
    let componentBuilders = [];
    const builder = {
        // Use the reusable quartet abstraction
        showing: {},
        endDecoratorSet: returnTo,
        build: function (buildSettings) {
            for (const cb of componentBuilders) {
                const element = cb.build(buildSettings);
                components.push({ componentName: element.componentName, options: { ...element, ...element.componentProps }, containing: element.children });
            }
            return { components: components };
        },
        end: function () {
            return returnTo;
        }
    };
    // Instantiate the quartet with proper return reference
    const containedElementSetBuilders = [];
    builder.showing = createElementBuilderQuartet(builder, componentBuilders, containedElementSetBuilders, dataDescriptor);
    decoratorSetBuilders.push(builder);
    return builder;
}
export function CreateReUiPlanComponent(returnTo, componentWrapper, set, childBuilders, dataDescriptor) {
    const reUiPlanComponent = {
        isReUIPlanElement: true,
        hidden: false,
        disabled: false,
        error: false,
        helperText: undefined,
        label: undefined,
        labelPosition: undefined,
        displayMode: undefined,
        decorators: [],
        componentName: componentWrapper?.displayName,
        binding: undefined,
        extraBindings: {},
        children: undefined,
        buildSettings: undefined,
        dataDescriptor: dataDescriptor
    };
    let innerTypedComponentBuilder = undefined;
    const decoratorSetBuilders = [];
    const basedOn = [];
    // Create the base builder first, then merge in extensions
    const builder = {
        usingFluxor: function (innerDataDescriptor, binding) {
            const newBuilder = CreateReUiPlanComponent(returnTo, componentWrapper, set, childBuilders, innerDataDescriptor);
            innerTypedComponentBuilder = newBuilder;
            return newBuilder;
        },
        withHideWhenRule: function (hidden) {
            reUiPlanComponent.hidden = hidden;
            return builder;
        },
        hide: function () {
            reUiPlanComponent.hidden = true;
            return builder;
        },
        disable: function () {
            reUiPlanComponent.disabled = true;
            return builder;
        },
        withDisableWhenRule: function (disabled) {
            reUiPlanComponent.disabled = disabled;
            return builder;
        },
        withErrorCondition: function (error) {
            reUiPlanComponent.error = error;
            return builder;
        },
        withHelperText: function (helperText) {
            reUiPlanComponent.helperText = helperText;
            return builder;
        },
        withLabel: function (label) {
            reUiPlanComponent.label = label;
            return builder;
        },
        withLabelPosition: function (labelPosition) {
            reUiPlanComponent.labelPosition = labelPosition;
            return builder;
        },
        withDisplayMode: function (displayMode) {
            reUiPlanComponent.displayMode = displayMode;
            return builder;
        },
        withoutCollectionExpansion: function (useSingleChildForArrays) {
            reUiPlanComponent.useSingleChildForArrays = useSingleChildForArrays;
            return builder;
        },
        withDecorators: () => {
            return CreateReUiPlanDecoratorSet(builder, decoratorSetBuilders, dataDescriptor);
            // decoratorSetBuilders.push(decoratorsetBuilder)
            // return decoratorsetBuilder;
        },
        withValueBinding: function (binding) {
            reUiPlanComponent.binding = binding;
            return builder;
        },
        withExtraBinding: function (boundPropName, binding) {
            if (!reUiPlanComponent.extraBindings) {
                reUiPlanComponent.extraBindings = {};
            }
            reUiPlanComponent.extraBindings[boundPropName] = binding;
            return builder;
        },
        basedOnElementBuilder: function (basebuilder) {
            basedOn.push(basebuilder);
            return builder;
        },
        basedOnElement: function (element) {
            basedOn.push(element);
            return builder;
        },
        withComponentProps: function (props) {
            reUiPlanComponent.componentProps = props;
            return builder;
        },
        withTempVar: function (_key, _value) {
            // This would set a temp var in context at runtime
            // For now, just return builder - actual implementation would store in context
            return builder;
        },
        build: function (buildSettings) {
            const builtComponent = { buildSettings };
            for (const bb of basedOn) {
                if (Object.keys(bb).includes('build')) {
                    const baseElement = bb.build(buildSettings);
                    Object.assign(builtComponent, ReUiPlanElementToReComponentProps(baseElement));
                }
                else {
                    Object.assign(builtComponent, ReUiPlanElementToReComponentProps(bb));
                }
            }
            if (childBuilders && childBuilders.length > 0) {
                const childElements = [];
                const sharedPropsElements = [];
                for (const cb of childBuilders) {
                    const built = cb.build(buildSettings);
                    childElements.push(...built.components);
                    sharedPropsElements.push(...(built.sharedProps.filter(sp => sp.isUsed)));
                }
                reUiPlanComponent.children = childElements;
                reUiPlanComponent.sharedProps = sharedPropsElements;
            }
            reUiPlanComponent.decorators = decoratorSetBuilders.flatMap(dsBuilder => {
                const dsBuilt = dsBuilder.build(buildSettings);
                return dsBuilt.components.map(c => ReUiPlanElementToReComponentProps(c.options));
            });
            Object.assign(builtComponent, ReUiPlanElementToReComponentProps(reUiPlanComponent));
            if (innerTypedComponentBuilder) {
                Object.assign(builtComponent, ReUiPlanElementToReComponentProps(innerTypedComponentBuilder.build(buildSettings)));
            }
            if (builder._buildExtension) {
                builder._buildExtension(buildSettings, builtComponent);
            }
            return builtComponent;
        },
        endElement: returnTo,
        end: function () {
            return returnTo;
        }
    };
    // If the component has an extension factory, call it and merge into builder
    // Pass dataDescriptor so TypeScript can infer TData from the actual value
    if (componentWrapper?.extensionFactory && dataDescriptor) {
        const extension = componentWrapper.extensionFactory(returnTo, builder, dataDescriptor, {});
        Object.assign(builder, extension);
    }
    if (set) {
        set.push(builder);
    }
    return builder;
}
export function CreateReUiSharedProps(returnTo, fromComponentIndex, set, childBuilders, dataDescriptor) {
    const reUiPlanComponent = {
        isReUIPlanElement: true,
        hidden: false,
        disabled: false,
        error: false,
        helperText: undefined,
        label: undefined,
        labelPosition: undefined,
        displayMode: undefined,
        decorators: [],
        componentName: undefined,
        binding: undefined,
        extraBindings: {},
        children: undefined,
        buildSettings: undefined,
        dataDescriptor: dataDescriptor
    };
    let innerTypedComponentBuilders = undefined;
    const basedOn = [];
    const decoratorSetBuilders = [];
    const builder = {
        usingFluxor: function (innerDataDescriptor, binding) {
            const newBuilder = CreateReUiSharedProps(returnTo, fromComponentIndex, set, childBuilders, innerDataDescriptor);
            innerTypedComponentBuilders = newBuilder;
            return newBuilder;
        },
        withLabelPosition: function (labelPosition) {
            reUiPlanComponent.labelPosition = labelPosition;
            reUiPlanComponent.isUsed = true;
            return builder;
        },
        withDisplayMode: function (displayMode) {
            reUiPlanComponent.displayMode = displayMode;
            reUiPlanComponent.isUsed = true;
            return builder;
        },
        withDecorators: () => {
            return CreateReUiPlanDecoratorSet(builder, decoratorSetBuilders, dataDescriptor);
            // decoratorSetBuilders.push(decoratorsetBuilder)
            // return decoratorsetBuilder;
        },
        withComponentProps: function (props) {
            reUiPlanComponent.componentProps = { ...(reUiPlanComponent.componentProps ?? {}), ...props };
            reUiPlanComponent.isUsed = true;
            return builder;
        },
        build: function (buildSettings) {
            const builtComponent = { buildSettings, isReUIPlanElement: true };
            for (const bb of basedOn) {
                if (Object.keys(bb).includes('build')) {
                    const baseElement = bb.build();
                    Object.assign(builtComponent, ReUiPlanElementToReComponentProps(baseElement));
                }
                else {
                    Object.assign(builtComponent, ReUiPlanElementToReComponentProps(bb));
                }
            }
            if (childBuilders && childBuilders.length > 0) {
                const childElements = [];
                const sharedPropsElements = [];
                for (const cb of childBuilders) {
                    const built = cb.build(buildSettings);
                    childElements.push(...built.components);
                    sharedPropsElements.push(...(built.sharedProps.filter(sp => sp.isUsed)));
                }
                reUiPlanComponent.children = childElements;
                reUiPlanComponent.sharedProps = sharedPropsElements;
            }
            reUiPlanComponent.decorators = decoratorSetBuilders.flatMap(dsBuilder => {
                const dsBuilt = dsBuilder.build(buildSettings);
                return dsBuilt.components.map(c => ReUiPlanElementToReComponentProps(c.options));
            });
            Object.assign(builtComponent, ReUiPlanElementToReComponentProps(reUiPlanComponent));
            if (innerTypedComponentBuilders) {
                Object.assign(builtComponent, ReUiPlanElementToReComponentProps(innerTypedComponentBuilders.build(buildSettings)));
            }
            builtComponent.fromComponentIndex = fromComponentIndex;
            return builtComponent;
        },
        endSharedProps: returnTo,
        end: function () {
            return returnTo;
        }
    };
    if (set) {
        set.push(builder);
    }
    return builder;
}
export function ReUiPlanElementToReComponentProps(element) {
    return {
        hidden: element.hidden,
        disabled: element.disabled,
        error: element.error,
        helperText: element.helperText,
        label: element.label,
        binding: element.binding,
        extraBindings: element.extraBindings,
        useSingleChildForArrays: element.useSingleChildForArrays,
        decorators: element.decorators,
        componentName: element.componentName,
        componentProps: element.componentProps,
        dataDescriptor: element.dataDescriptor,
        children: element.children,
        sharedProps: element.sharedProps,
        buildSettings: element.buildSettings,
        displayMode: element.displayMode,
        labelPosition: element.labelPosition,
        fromComponentIndex: element.fromComponentIndex,
        isUsed: element.isUsed,
        isReUIPlanElement: element.isReUIPlanElement
    };
}
//# sourceMappingURL=ReUiPlanBuilder.js.map