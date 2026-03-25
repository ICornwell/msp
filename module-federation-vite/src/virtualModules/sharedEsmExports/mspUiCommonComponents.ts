export function mspUiCommonComponentsExportCode(): string {
  return `
    const fallbackCandidates = typeof fallbackModule !== 'undefined' ? [
      fallbackModule,
      fallbackModule?.default,
    ] : [];

    const candidates = [
      moduleFactory,
      moduleFactory?.default,
      ...fallbackCandidates,
    ];

    const pick = (key) => {
      for (const candidate of candidates) {
        if (candidate && candidate[key] !== undefined) {
          return candidate[key];
        }
      }
      return undefined;
    };

    const sharedModule = pick('AppShell')
      ? candidates.find((c) => c && c.AppShell)
      : (moduleFactory?.default ?? moduleFactory);
    export default sharedModule;
    export const AggregationType = pick('AggregationType');
    export const AppMenu = pick('AppMenu');
    export const AppShell = pick('AppShell');
    export const Blade = pick('Blade');
    export const ColumnsComponent = pick('ColumnsComponent');
    export const CustomThemeProvider = pick('CustomThemeProvider');
    export const LabelFrameComponent = pick('LabelFrameComponent');
    export const LayerPricingLayout = pick('LayerPricingLayout');
    export const MainContent = pick('MainContent');
    export const PresetBooleanComponent = pick('PresetBooleanComponent');
    export const PresetDateComponent = pick('PresetDateComponent');
    export const PresetMoneyComponent = pick('PresetMoneyComponent');
    export const PresetNumberComponent = pick('PresetNumberComponent');
    export const PresetTextComponent = pick('PresetTextComponent');
    export const RangeStyle = pick('RangeStyle');
    export const ServiceDispatcher = pick('ServiceDispatcher');
    export const Sidebar = pick('Sidebar');
    export const TabStrip = pick('TabStrip');
    export const TableComponent = pick('TableComponent');
    export const TableDemoLayouts = pick('TableDemoLayouts');
    export const TaskListLayout = pick('TaskListLayout');
    export const TaskTableDemo = pick('TaskTableDemo');
    export const TopBar = pick('TopBar');
    export const UiEventMenuBridge = pick('UiEventMenuBridge');\n    export const UniversalInputComponent = pick('UniversalInputComponent');
    export const VehicleFleetLayout = pick('VehicleFleetLayout');
    export const VehicleTableDemo = pick('VehicleTableDemo');
    export const applyStrategySet = pick('applyStrategySet');
    export const buildStrategyKey = pick('buildStrategyKey');
    export const centerAlign = pick('centerAlign');
    export const commonStrategySets = pick('commonStrategySets');
    export const composeStrategies = pick('composeStrategies');
    export const createBooleanStrategy = pick('createBooleanStrategy');
    export const createDateStrategy = pick('createDateStrategy');
    export const createMoneyStrategy = pick('createMoneyStrategy');
    export const createNumberStrategy = pick('createNumberStrategy');
    export const createStrategyResolver = pick('createStrategyResolver');
    export const dateExpressionParser = pick('dateExpressionParser');
    export const defaultStrategyResolver = pick('defaultStrategyResolver');
    export const expressionParsers = pick('expressionParsers');
    export const extendWithTable = pick('extendWithTable');
    export const layerPricingLayers = pick('layerPricingLayers');
    export const layerPricingTestData = pick('layerPricingTestData');
    export const leftAlign = pick('leftAlign');
    export const mathExpressionParser = pick('mathExpressionParser');
    export const parseStrategyKey = pick('parseStrategyKey');
    export const percentageParser = pick('percentageParser');
    export const pricingFieldFluxorData = pick('pricingFieldFluxorData');
    export const rightAlign = pick('rightAlign');
    export const strategyRegistry = pick('strategyRegistry');
    export const taskFluxorData = pick('taskFluxorData');
    export const taskListTestData = pick('taskListTestData');
    export const textStrategy = pick('textStrategy');
    export const vehicleFleetTestData = pick('vehicleFleetTestData');
    export const vehicleFluxorData = pick('vehicleFluxorData');
  `;
}
