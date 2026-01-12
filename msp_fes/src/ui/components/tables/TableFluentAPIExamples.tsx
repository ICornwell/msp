/**
 * Table Fluent API Examples
 * 
 * This file demonstrates how the fluent table API would be used in practice.
 * These examples show the type-safe column definition syntax.
 */

import { 
  TableExtension, 
  ColumnBuilder, 
  AggregationType, 
  RangeStyle,
  CellRendererProps 
} from './table';
import { Vehicle } from './testData/vehicleList.js';
import { Task } from './testData/taskList.js';
import { testLayerPricingContext } from './testData/layerPricing.js';
import { FluxorData } from '../../renderEngine/fluxor/fluxorData.js';

// ============================================
// Example 1: Basic Vehicle Table
// ============================================

/**
 * Basic table with simple columns
 * 
 * In a ReUiPlan builder context:
 * 
 * .showingItem
 *   .fromComponentElement(TableComponent)
 *     .forDataType<Vehicle>()
 *     .withColumns()
 *       .column(s => s.registration).withHeader('Reg').pinned('left')
 *       .column(s => s.type).withHeader('Type').sortable()
 *       .column(s => s.make).withHeader('Make')
 *       .column(s => s.model).withHeader('Model')
 *       .column(s => s.value).withHeader('Value').withAggregation(AggregationType.Sum)
 *     .endColumns
 *   .end
 */
type VehicleBasicExample = void; // Placeholder for the example pattern

// ============================================
// Example 2: Vehicle Table with Custom Renderers
// ============================================

// Custom cell renderer for money values
const MoneyCell = ({ value }: CellRendererProps<FluxorData<Vehicle>, number>) => (
  <span>${value.toLocaleString()}</span>
);

// Custom cell renderer for rating modifiers (highlight deviations from 1.0)
const ModifierCell = ({ value }: CellRendererProps<FluxorData<Vehicle>, number>) => {
  const deviation = value - 1.0;
  const color = deviation > 0 ? 'red' : deviation < 0 ? 'green' : 'black';
  return <span style={{ color }}>{value.toFixed(2)}</span>;
};

/**
 * Table with custom renderers and aggregation
 * 
 * .showingItem
 *   .fromComponentElement(TableComponent)
 *     .forDataType<Vehicle>()
 *     .enableSorting()
 *     .withColumns()
 *       .column(s => s.registration)
 *         .withHeader('Registration')
 *         .pinned('left')
 *         .sortable()
 *       .column(s => s.type)
 *         .withHeader('Type')
 *         .sortable()
 *         .filterable()
 *       .column(s => s.value)
 *         .withHeader('Value')
 *         .withRenderer(MoneyCell)
 *         .withAggregation(AggregationType.Sum, 'Total Value')
 *         .sortable()
 *       .column(s => s.totalModifier)
 *         .withHeader('Total Modifier')
 *         .withRenderer(ModifierCell)
 *         .withAggregation(AggregationType.Average)
 *         .withRangeStyle(RangeStyle.RedToGreen)
 *       .column(s => s.adjustedPremium)
 *         .withHeader('Adjusted Premium')
 *         .withRenderer(MoneyCell)
 *         .withAggregation(AggregationType.Sum)
 *     .endColumns
 *   .end
 */
type VehicleWithRenderersExample = void;

// ============================================
// Example 3: Column Groups (Nested Headers)
// ============================================

/**
 * Column groups create multi-level headers
 * 
 * .showingItem
 *   .fromComponentElement(TableComponent)
 *     .forDataType<Vehicle>()
 *     .withColumns()
 *       .column(s => s.registration).pinned('left')
 *       .column(s => s.type)
 *       
 *       // Column group: Vehicle Info
 *       .columnGroup('vehicleInfo', 'Vehicle Details')
 *         .column(s => s.make).withHeader('Make')
 *         .column(s => s.model).withHeader('Model')
 *         .column(s => s.year).withHeader('Year')
 *         .column(s => s.value).withHeader('Value').withRenderer(MoneyCell)
 *       .endGroup
 *       
 *       // Column group: Premium Calculation
 *       .columnGroup('premium', 'Premium')
 *         .column(s => s.basePremium).withHeader('Base').withRenderer(MoneyCell)
 *         .column(s => s.totalModifier).withHeader('Modifier')
 *         .column(s => s.adjustedPremium).withHeader('Adjusted').withRenderer(MoneyCell)
 *       .endGroup
 *       
 *     .endColumns
 *   .end
 */
type ColumnGroupsExample = void;

// ============================================
// Example 4: Dynamic Columns with forEach
// ============================================

// Imagine we have a Program with Layers, and we want columns per layer
interface Program {
  programId: string;
  name: string;
  layers: Layer[];
}

interface Layer {
  layerId: string;
  layerName: string;
  limit: number;
}

interface LayerData {
  rowId: string;
  rowName: string;
  // Dynamic: one value per layer
  layerValues: Map<string, number>;
}

/**
 * Dynamic columns from data relationships
 * 
 * This creates a column for each layer in the program, where the columns
 * are determined at runtime based on the data.
 * 
 * .showingItem
 *   .fromComponentElement(TableComponent)
 *     .forDataType<LayerData>()
 *     .withColumns()
 *       .column(s => s.rowId).pinned('left')
 *       .column(s => s.rowName).withHeader('Row')
 *       
 *       // Dynamic columns - one per layer
 *       .forEach(
 *         ctx => ctx.root.program.layers,  // Source: array of layers from context
 *         (layer, index, builder) => {
 *           builder
 *             .computed(`layer-${layer.layerId}`, row => row.layerValues.get(layer.layerId))
 *             .withHeader(layer.layerName)
 *             .withRenderer(MoneyCell)
 *             .sortable()
 *         }
 *       )
 *       
 *     .endColumns
 *   .end
 */
type DynamicColumnsExample = void;

// ============================================
// Example 5: Computed Columns
// ============================================

/**
 * Computed columns derive values from row data
 * 
 * .showingItem
 *   .fromComponentElement(TableComponent)
 *     .forDataType<Vehicle>()
 *     .withColumns()
 *       .column(s => s.registration)
 *       .column(s => s.basePremium).withHeader('Base')
 *       .column(s => s.adjustedPremium).withHeader('Adjusted')
 *       
 *       // Computed column: difference
 *       .computed('premiumDiff', row => row.adjustedPremium - row.basePremium)
 *         .withHeader('Difference')
 *         .withRenderer(MoneyCell)
 *         .withRangeStyle(RangeStyle.GreenToRed)  // More diff = worse (costs)
 *       
 *       // Computed column: percentage change
 *       .computed('changePercent', row => 
 *         ((row.adjustedPremium - row.basePremium) / row.basePremium) * 100
 *       )
 *         .withHeader('% Change')
 *         .withCustomRangeStyle((value, min, max) => ({
 *           backgroundColor: value > 10 ? '#ffcdd2' : value < -10 ? '#c8e6c9' : 'transparent'
 *         }))
 *       
 *     .endColumns
 *   .end
 */
type ComputedColumnsExample = void;

// ============================================
// Example 6: Task Table with Filtering
// ============================================

// Filter UI component for priority dropdown
const PriorityFilter = () => <select>/* ... */</select>;

// Filter UI component for status dropdown  
const StatusFilter = () => <select>/* ... */</select>;

/**
 * Table with filtering configuration
 * 
 * .showingItem
 *   .fromComponentElement(TableComponent)
 *     .forDataType<Task>()
 *     .enableSorting()
 *     .enableFiltering()
 *     .withColumns()
 *       .column(s => s.taskId).pinned('left')
 *       .column(s => s.taskName).withHeader('Task').sortable()
 *       .column(s => s.priority)
 *         .withHeader('Priority')
 *         .filterable()
 *         .withFilterUI(PriorityFilter)
 *       .column(s => s.status)
 *         .withHeader('Status')
 *         .filterable()
 *         .withFilterUI(StatusFilter)
 *       .column(s => s.assignee).withHeader('Assignee').filterable()
 *       .column(s => s.dueDate).withHeader('Due Date').sortable()
 *     .endColumns
 *     
 *     // Additional filter configuration
 *     .withFiltering()
 *       .globalSearch(['taskName', 'assignee'])  // Global search these columns
 *       .forColumn(s => s.priority)
 *         .withUI(PriorityFilter)
 *       .forColumn(s => s.status)
 *         .withUI(StatusFilter)
 *     .endFiltering
 *     
 *   .end
 */
type FilteringExample = void;

// ============================================
// Example 7: Large Dataset with Virtualization
// ============================================

/**
 * Virtualized table for 100k+ rows
 * 
 * .showingItem
 *   .fromComponentElement(TableComponent)
 *     .forDataType<Vehicle>()
 *     .withVirtualization(35)  // 35px row height
 *     .enableSorting()
 *     .withColumns()
 *       .column(s => s.registration).pinned('left').withWidth(120)
 *       .column(s => s.type).withWidth(100)
 *       .column(s => s.make).withWidth(100)
 *       .column(s => s.model).withWidth(150)
 *       .column(s => s.value).withWidth(120).withRenderer(MoneyCell)
 *       // ... more columns
 *     .endColumns
 *   .end
 */
type VirtualizationExample = void;

// ============================================
// Example 8: Layer Pricing Pivoted Table
// ============================================

/**
 * Pivoted table showing layers as columns
 * 
 * Using our LayerPricing test data, we want:
 * - Row dimension: pricing fields (Technical Premium, Expected Loss, etc.)
 * - Column dimension: layers (Layer 1, Layer 2, etc.)
 * 
 * .showingItem
 *   .fromComponentElement(TableComponent)
 *     .forDataType<LayerPricing>()
 *     .withOrientation('rows-vertical')  // Pivoted view
 *     .withColumns()
 *       .column(s => s.fieldName).pinned('left').withHeader('Metric')
 *       .column(s => s.layer1Value).withHeader('Layer 1')
 *       .column(s => s.layer2Value).withHeader('Layer 2')
 *       .column(s => s.layer3Value).withHeader('Layer 3')
 *       .column(s => s.layer4Value).withHeader('Layer 4')
 *       .column(s => s.layer5Value).withHeader('Layer 5')
 *       .computed('total', row => 
 *         row.layer1Value + row.layer2Value + row.layer3Value + 
 *         row.layer4Value + row.layer5Value
 *       ).withHeader('Total')
 *     .endColumns
 *   .end
 */
type PivotedTableExample = void;

// ============================================
// Type Safety Demo
// ============================================

/**
 * The key benefit of the fluent API is TYPE SAFETY:
 * 
 * ✅ GOOD - Type-safe accessor:
 *    .column(s => s.registration)  // TypeScript knows 'registration' exists on Vehicle
 * 
 * ❌ BAD - This would be a compile error:
 *    .column(s => s.nonExistent)  // Error: Property 'nonExistent' does not exist on type 'Vehicle'
 * 
 * ✅ GOOD - Aggregation tied to column type:
 *    .column(s => s.value)
 *      .withAggregation(AggregationType.Sum)  // Valid: value is a number
 * 
 * The accessor `s => s.propertyName` pattern:
 * 1. Provides autocomplete in the IDE
 * 2. Catches typos at compile time
 * 3. Refactoring support (rename property updates all usages)
 * 4. Documents which properties are used in the table
 */

export { };  // Make this a module
