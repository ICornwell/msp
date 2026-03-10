import { FluxorData } from '../../../renderEngine/fluxor/fluxorData.js';
import { AggregationType } from '../table.js';

// ============================================
// Layer Pricing - Pivoted view
// Layers as columns (1-12), pricing fields as rows
// ============================================

// A single pricing field that applies across layers
export interface PricingField {
  fieldId: string;
  fieldName: string;
  category: 'structure' | 'premium' | 'commission' | 'tax' | 'technical';
  dataType: 'money' | 'percentage' | 'number';
  // Values per layer - sparse, not all layers have all fields
  layerValues: Record<number, number | null>;
  // Aggregation across layers
  total?: number;
  weightedAvg?: number;
}

// Layer structure info (column headers)
export interface Layer {
  layerNumber: number;
  layerName: string;
  attachment: number;
  limit: number;
  participation: number;  // percentage
}

// Type alias for FluxorData wrapper
export type PricingFieldFluxorData = FluxorData<PricingField>;
export type LayerFluxorData = FluxorData<Layer>;

// Aggregation metadata for pricing fields
export const pricingFieldAggregationMeta: Partial<Record<keyof PricingField, AggregationType>> = {
  fieldId: AggregationType.None,
  fieldName: AggregationType.None,
  category: AggregationType.None,
  dataType: AggregationType.None,
  total: AggregationType.Sum,
  weightedAvg: AggregationType.None,  // already averaged
};

// Display labels
export const pricingFieldLabels: Partial<Record<keyof PricingField, string>> = {
  fieldId: 'Field ID',
  fieldName: 'Field',
  category: 'Category',
  dataType: 'Type',
  total: 'Total',
  weightedAvg: 'Wtd Avg',
};

// Test layers (5 layers)
export const testLayers: Layer[] = [
  { layerNumber: 1, layerName: 'Primary', attachment: 0, limit: 5_000_000, participation: 100 },
  { layerNumber: 2, layerName: '1st Excess', attachment: 5_000_000, limit: 10_000_000, participation: 50 },
  { layerNumber: 3, layerName: '2nd Excess', attachment: 15_000_000, limit: 25_000_000, participation: 25 },
  { layerNumber: 4, layerName: '3rd Excess', attachment: 40_000_000, limit: 50_000_000, participation: 15 },
  { layerNumber: 5, layerName: 'Top Layer', attachment: 90_000_000, limit: 100_000_000, participation: 10 },
];

// Test pricing fields
export const testPricingFields: PricingField[] = [
  // Structure
  { fieldId: 'attachment', fieldName: 'Attachment Point', category: 'structure', dataType: 'money',
    layerValues: { 1: 0, 2: 5_000_000, 3: 15_000_000, 4: 40_000_000, 5: 90_000_000 } },
  { fieldId: 'limit', fieldName: 'Layer Limit', category: 'structure', dataType: 'money',
    layerValues: { 1: 5_000_000, 2: 10_000_000, 3: 25_000_000, 4: 50_000_000, 5: 100_000_000 } },
  { fieldId: 'participation', fieldName: 'Participation %', category: 'structure', dataType: 'percentage',
    layerValues: { 1: 100, 2: 50, 3: 25, 4: 15, 5: 10 } },
  
  // Premium components
  { fieldId: 'grossPremium', fieldName: 'Gross Premium', category: 'premium', dataType: 'money',
    layerValues: { 1: 125_000, 2: 85_000, 3: 62_000, 4: 45_000, 5: 28_000 },
    total: 345_000 },
  { fieldId: 'rateOnLine', fieldName: 'Rate on Line', category: 'premium', dataType: 'percentage',
    layerValues: { 1: 2.5, 2: 0.85, 3: 0.248, 4: 0.09, 5: 0.028 },
    weightedAvg: 0.72 },
  { fieldId: 'expectedLoss', fieldName: 'Expected Loss', category: 'premium', dataType: 'money',
    layerValues: { 1: 75_000, 2: 42_500, 3: 24_800, 4: 13_500, 5: 5_600 },
    total: 161_400 },
  { fieldId: 'lossRatio', fieldName: 'Expected Loss Ratio', category: 'premium', dataType: 'percentage',
    layerValues: { 1: 60, 2: 50, 3: 40, 4: 30, 5: 20 },
    weightedAvg: 46.8 },
  { fieldId: 'technicalPremium', fieldName: 'Technical Premium', category: 'technical', dataType: 'money',
    layerValues: { 1: 112_500, 2: 72_250, 3: 49_600, 4: 33_750, 5: 19_600 },
    total: 287_700 },
  { fieldId: 'technicalRatio', fieldName: 'Technical Ratio', category: 'technical', dataType: 'percentage',
    layerValues: { 1: 90, 2: 85, 3: 80, 4: 75, 5: 70 },
    weightedAvg: 83.4 },
  
  // Commission
  { fieldId: 'brokerComm', fieldName: 'Broker Commission', category: 'commission', dataType: 'percentage',
    layerValues: { 1: 15, 2: 12.5, 3: 10, 4: 7.5, 5: 5 },
    weightedAvg: 11.2 },
  { fieldId: 'brokerCommAmt', fieldName: 'Broker Commission $', category: 'commission', dataType: 'money',
    layerValues: { 1: 18_750, 2: 10_625, 3: 6_200, 4: 3_375, 5: 1_400 },
    total: 40_350 },
  { fieldId: 'cedingComm', fieldName: 'Ceding Commission', category: 'commission', dataType: 'percentage',
    layerValues: { 1: 25, 2: 22.5, 3: 20, 4: 17.5, 5: 15 },
    weightedAvg: 21.4 },
  { fieldId: 'cedingCommAmt', fieldName: 'Ceding Commission $', category: 'commission', dataType: 'money',
    layerValues: { 1: 31_250, 2: 19_125, 3: 12_400, 4: 7_875, 5: 4_200 },
    total: 74_850 },
  { fieldId: 'overriderComm', fieldName: 'Overrider', category: 'commission', dataType: 'percentage',
    layerValues: { 1: 2, 2: 2, 3: 1.5, 4: 1, 5: 0.5 },
    weightedAvg: 1.6 },
  { fieldId: 'overriderAmt', fieldName: 'Overrider $', category: 'commission', dataType: 'money',
    layerValues: { 1: 2_500, 2: 1_700, 3: 930, 4: 450, 5: 140 },
    total: 5_720 },
  
  // Tax
  { fieldId: 'premiumTax', fieldName: 'Premium Tax', category: 'tax', dataType: 'percentage',
    layerValues: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 } },
  { fieldId: 'premiumTaxAmt', fieldName: 'Premium Tax $', category: 'tax', dataType: 'money',
    layerValues: { 1: 3_750, 2: 2_550, 3: 1_860, 4: 1_350, 5: 840 },
    total: 10_350 },
  { fieldId: 'stampDuty', fieldName: 'Stamp Duty', category: 'tax', dataType: 'money',
    layerValues: { 1: 625, 2: 425, 3: 310, 4: 225, 5: 140 },
    total: 1_725 },
  
  // Technical
  { fieldId: 'netPremium', fieldName: 'Net Premium', category: 'technical', dataType: 'money',
    layerValues: { 1: 68_125, 2: 50_575, 3: 40_300, 4: 31_725, 5: 21_280 },
    total: 212_005 },
  { fieldId: 'profitMargin', fieldName: 'Profit Margin', category: 'technical', dataType: 'percentage',
    layerValues: { 1: 8, 2: 12, 3: 18, 4: 25, 5: 35 },
    weightedAvg: 15.2 },
  { fieldId: 'catLoad', fieldName: 'Cat Load', category: 'technical', dataType: 'percentage',
    layerValues: { 1: 5, 2: 8, 3: 12, 4: 15, 5: 20 },
    weightedAvg: 9.8 },
  { fieldId: 'catLoadAmt', fieldName: 'Cat Load $', category: 'technical', dataType: 'money',
    layerValues: { 1: 6_250, 2: 6_800, 3: 7_440, 4: 6_750, 5: 5_600 },
    total: 32_840 },
  { fieldId: 'reinstatement', fieldName: 'Reinstatement Premium', category: 'technical', dataType: 'percentage',
    layerValues: { 1: 100, 2: 100, 3: 50, 4: 25, 5: null } },
  { fieldId: 'reinstatementAmt', fieldName: 'Reinstatement Premium $', category: 'technical', dataType: 'money',
    layerValues: { 1: 125_000, 2: 85_000, 3: 31_000, 4: 11_250, 5: null },
    total: 252_250 },
];

// For dynamic column generation from layers
export interface LayerPricingContext {
  layers: Layer[];
  pricingFields: PricingField[];
}

export const testLayerPricingContext: LayerPricingContext = {
  layers: testLayers,
  pricingFields: testPricingFields,
};
