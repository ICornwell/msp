import { FluxorData } from "../../renderEngine/fluxor/fluxorData";
export type Vehicle = {
    registration: string;
    type: string;
    make: string;
    model: string;
    year: number;
    value: number;
    basePremium: number;
    totalModifier: number;
    adjustedPremium: number;
};
export declare const vehicleFluxorData: FluxorData<Vehicle>;
export declare const sampleVehicles: Vehicle[];
