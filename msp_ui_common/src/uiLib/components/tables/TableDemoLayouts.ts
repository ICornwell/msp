/**
 * Table Demo Layouts
 * 
 * Three fully realized UiPlan layouts for the test datasets:
 * 1. Task List Table - Simple task queue
 * 2. Vehicle Fleet Table - With rating factors
 * 3. Layer Pricing Table - Pivoted view with dynamic columns
 * 
 * Drop these into your rendering UI to see the tables in action.
 */

import { Re } from '../../renderEngine/index.js'
import { FluxorData } from '../../renderEngine/fluxor/fluxorData.js'
import { TableComponent } from './table.js'
import { LabelFrameComponent } from '../containers/labelframe.js'

// Import test data types
import { Task, taskTestData } from './testData/taskList.js'
import { Vehicle, vehicleTestData } from './testData/vehicleList.js'
import { PricingField, testPricingFields, testLayers } from './testData/layerPricing.js'

// ============================================
// FluxorData Definitions for Test Data
// ============================================

export const taskFluxorData: FluxorData<Task> = {
  taskId: { dictionaryName: 'Task', attributeName: 'taskId', label: 'Task ID' },
  caseId: { dictionaryName: 'Task', attributeName: 'caseId', label: 'Case ID' },
  taskName: { dictionaryName: 'Task', attributeName: 'taskName', label: 'Task' },
  assignee: { dictionaryName: 'Task', attributeName: 'assignee', label: 'Assigned To' },
  createdDate: { dictionaryName: 'Task', attributeName: 'createdDate', label: 'Created' },
  dueDate: { dictionaryName: 'Task', attributeName: 'dueDate', label: 'Due Date' },
  priority: { dictionaryName: 'Task', attributeName: 'priority', label: 'Priority' },
  status: { dictionaryName: 'Task', attributeName: 'status', label: 'Status' },
  estimatedHours: { dictionaryName: 'Task', attributeName: 'estimatedHours', label: 'Est. Hours' },
  actualHours: { dictionaryName: 'Task', attributeName: 'actualHours', label: 'Actual Hours' },
  value: { dictionaryName: 'Task', attributeName: 'value', label: 'Value' },
};

export const vehicleFluxorData: FluxorData<Vehicle> = {
  vehicleId: { dictionaryName: 'Vehicle', attributeName: 'vehicleId', label: 'ID' },
  registration: { dictionaryName: 'Vehicle', attributeName: 'registration', label: 'Registration' },
  type: { dictionaryName: 'Vehicle', attributeName: 'type', label: 'Type' },
  use: { dictionaryName: 'Vehicle', attributeName: 'use', label: 'Use' },
  make: { dictionaryName: 'Vehicle', attributeName: 'make', label: 'Make' },
  model: { dictionaryName: 'Vehicle', attributeName: 'model', label: 'Model' },
  year: { dictionaryName: 'Vehicle', attributeName: 'year', label: 'Year' },
  value: { dictionaryName: 'Vehicle', attributeName: 'value', label: 'Value' },
  basePremium: { dictionaryName: 'Vehicle', attributeName: 'basePremium', label: 'Base Premium' },
  ratingFactors: { dictionaryName: 'Vehicle', attributeName: 'ratingFactors', label: 'Rating Factors', isComplex: true },
  totalModifier: { dictionaryName: 'Vehicle', attributeName: 'totalModifier', label: 'Total Modifier' },
  adjustedPremium: { dictionaryName: 'Vehicle', attributeName: 'adjustedPremium', label: 'Adjusted Premium' },
};

export const pricingFieldFluxorData: FluxorData<PricingField> = {
  fieldId: { dictionaryName: 'PricingField', attributeName: 'fieldId', label: 'Field ID' },
  fieldName: { dictionaryName: 'PricingField', attributeName: 'fieldName', label: 'Field' },
  category: { dictionaryName: 'PricingField', attributeName: 'category', label: 'Category' },
  dataType: { dictionaryName: 'PricingField', attributeName: 'dataType', label: 'Type' },
  layerValues: { dictionaryName: 'PricingField', attributeName: 'layerValues', label: 'Layer Values', isComplex: true },
  total: { dictionaryName: 'PricingField', attributeName: 'total', label: 'Total' },
  weightedAvg: { dictionaryName: 'PricingField', attributeName: 'weightedAvg', label: 'Wtd Avg' },
};

// ============================================
// Layout 1: Task List Table
// ============================================

export function TaskListLayout() {
  const taskListUiPlan = Re.makeUiPlan('TaskList', '1.0')
    .withElementSet
    .usingFluxor(taskFluxorData)
    .fromInlineElementSet
    
      .showingItem.fromComponentElement(TableComponent)
        .withLabel('Task Queue')
        .withDecorators()
          .showing.fromComponentElement(LabelFrameComponent)
            .withLabel('Work Queue - Tasks')
          .endElement
        .endDecoratorSet
        .withColumnsFromSchema()
      .endElement
      
    .endSet
    .BuildUiPlan();
    
  return taskListUiPlan;
}

// Export test data for the layout
export const taskListTestData = taskTestData;

// ============================================
// Layout 2: Vehicle Fleet Table
// ============================================

export function VehicleFleetLayout() {
  const vehicleFleetUiPlan = Re.makeUiPlan('VehicleFleet', '1.0')
    .withElementSet
    .usingFluxor(vehicleFluxorData)
    .fromInlineElementSet
    
      .showingItem.fromComponentElement(TableComponent)
        .withLabel('Vehicle Fleet')
        .withDecorators()
          .showing.fromComponentElement(LabelFrameComponent)
            .withLabel('Vehicle Fleet - Rating Analysis')
          .endElement
        .endDecoratorSet
        .withColumnsFromSchema()
      .endElement
      
    .endSet
    .BuildUiPlan();
    
  return vehicleFleetUiPlan;
}

// Export test data for the layout
export const vehicleFleetTestData = vehicleTestData;

// ============================================
// Layout 3: Layer Pricing Table (Pivoted)
// ============================================

export function LayerPricingLayout() {
  const layerPricingUiPlan = Re.makeUiPlan('LayerPricing', '1.0')
    .withElementSet
    .usingFluxor(pricingFieldFluxorData)
    .fromInlineElementSet
    
      .showingItem.fromComponentElement(TableComponent)
        .withLabel('Layer Pricing')
        .withDecorators()
          .showing.fromComponentElement(LabelFrameComponent)
            .withLabel('Program Pricing - Layer View')
          .endElement
        .endDecoratorSet
        .withColumnsFromSchema()
      .endElement
      
    .endSet
    .BuildUiPlan();
    
  return layerPricingUiPlan;
}

// Export test data for the layout
export const layerPricingTestData = testPricingFields;
export const layerPricingLayers = testLayers;

// ============================================
// Combined Export
// ============================================

export const TableDemoLayouts = {
  TaskList: {
    layout: TaskListLayout,
    testData: taskListTestData,
  },
  VehicleFleet: {
    layout: VehicleFleetLayout,
    testData: vehicleFleetTestData,
  },
  LayerPricing: {
    layout: LayerPricingLayout,
    testData: layerPricingTestData,
    layers: layerPricingLayers,
  },
};

export default TableDemoLayouts;
