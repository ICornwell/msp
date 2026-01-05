import { FluxorData } from '../../../renderEngine/fluxor/fluxorData';
import { AggregationType } from '../table';
export interface PricingField {
    fieldId: string;
    fieldName: string;
    category: 'structure' | 'premium' | 'commission' | 'tax' | 'technical';
    dataType: 'money' | 'percentage' | 'number';
    layerValues: Record<number, number | null>;
    total?: number;
    weightedAvg?: number;
}
export interface Layer {
    layerNumber: number;
    layerName: string;
    attachment: number;
    limit: number;
    participation: number;
}
export type PricingFieldFluxorData = FluxorData<PricingField>;
export type LayerFluxorData = FluxorData<Layer>;
export declare const pricingFieldAggregationMeta: Partial<Record<keyof PricingField, AggregationType>>;
export declare const pricingFieldLabels: Partial<Record<keyof PricingField, string>>;
export declare const testLayers: Layer[];
export declare const testPricingFields: PricingField[];
export interface LayerPricingContext {
    layers: Layer[];
    pricingFields: PricingField[];
}
export declare const testLayerPricingContext: LayerPricingContext;
