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
import { FluxorData } from '../../renderEngine/fluxor/fluxorData.js';
import { Task } from './testData/taskList.js';
import { Vehicle } from './testData/vehicleList.js';
import { PricingField } from './testData/layerPricing.js';
export declare const taskFluxorData: FluxorData<Task>;
export declare const vehicleFluxorData: FluxorData<Vehicle>;
export declare const pricingFieldFluxorData: FluxorData<PricingField>;
export declare function TaskListLayout(): any;
export declare const taskListTestData: any;
export declare function VehicleFleetLayout(): any;
export declare const vehicleFleetTestData: any;
export declare function LayerPricingLayout(): any;
export declare const layerPricingTestData: any;
export declare const layerPricingLayers: any;
export declare const TableDemoLayouts: {
    TaskList: {
        layout: typeof TaskListLayout;
        testData: any;
    };
    VehicleFleet: {
        layout: typeof VehicleFleetLayout;
        testData: any;
    };
    LayerPricing: {
        layout: typeof LayerPricingLayout;
        testData: any;
        layers: any;
    };
};
export default TableDemoLayouts;
