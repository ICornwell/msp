import { FluxorData } from '../../../renderEngine/fluxor/fluxorData.js';
import { AggregationType } from '../table.js';
export type VehicleType = 'car' | 'van' | 'truck' | 'motorcycle' | 'bus';
export type VehicleUse = 'private' | 'business' | 'commercial' | 'fleet';
export interface RatingFactor {
    factorId: string;
    factorName: string;
    baseRate: number;
    modifier: number;
    appliedRate: number;
}
export interface Vehicle {
    vehicleId: string;
    registration: string;
    type: VehicleType;
    use: VehicleUse;
    make: string;
    model: string;
    year: number;
    value: number;
    basePremium: number;
    ratingFactors: {
        ageOfVehicle: RatingFactor;
        driverAge: RatingFactor;
        location: RatingFactor;
        claimsHistory: RatingFactor;
        mileage: RatingFactor;
        securityFeatures: RatingFactor;
    };
    totalModifier: number;
    adjustedPremium: number;
}
export interface VehicleRollup {
    type: VehicleType;
    use: VehicleUse;
    vehicleCount: number;
    totalValue: number;
    totalBasePremium: number;
    avgModifier: number;
    totalAdjustedPremium: number;
    ratingFactors: {
        ageOfVehicle: {
            avgModifier: number;
            canBulkEdit: boolean;
        };
        driverAge: {
            avgModifier: number;
            canBulkEdit: boolean;
        };
        location: {
            avgModifier: number;
            canBulkEdit: boolean;
        };
        claimsHistory: {
            avgModifier: number;
            canBulkEdit: boolean;
        };
        mileage: {
            avgModifier: number;
            canBulkEdit: boolean;
        };
        securityFeatures: {
            avgModifier: number;
            canBulkEdit: boolean;
        };
    };
}
export type VehicleFluxorData = FluxorData<Vehicle>;
export type VehicleRollupFluxorData = FluxorData<VehicleRollup>;
export declare const vehicleAggregationMeta: Partial<Record<keyof Vehicle, AggregationType>>;
export declare const vehicleLabels: Partial<Record<keyof Vehicle, string>>;
export declare const vehicleRollupAggregationMeta: Partial<Record<keyof VehicleRollup, AggregationType>>;
export declare const vehicleRollupLabels: Partial<Record<keyof VehicleRollup, string>>;
declare function createSeededRandom(seed: number): {
    next(): number;
    nextInt(max: number): number;
    pick<T>(arr: T[]): T;
    reset(newSeed?: number): void;
};
declare const DEFAULT_SEED = 42;
declare function generateVehicles(count: number, seed?: number): Vehicle[];
export { createSeededRandom, generateVehicles, DEFAULT_SEED };
export declare const vehicleTestData: Vehicle[];
export declare function generateRollup(vehicles: Vehicle[]): VehicleRollup[];
export declare const vehicleRollupTestData: VehicleRollup[];
