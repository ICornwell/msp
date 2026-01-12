import { FluxorData } from "../../renderEngine/fluxor/fluxorData.js";
import { FluxorProps } from "../../renderEngine/fluxor/fluxorProps.js";

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

export const vehicleFluxorData: FluxorData<Vehicle> = {
  registration: {
    name: 'registration',
    label: 'Registration',
    dataType: 'string',
    editable: true
  } as FluxorProps<string>,
  type: {
    name: 'type',
    label: 'Type',
    dataType: 'string',
    editable: true
  } as FluxorProps<string>,
  make: {
    name: 'make',
    label: 'Make',
    dataType: 'string',
    editable: true
  } as FluxorProps<string>,
  model: {
    name: 'model',
    label: 'Model',
    dataType: 'string',
    editable: true
  } as FluxorProps<string>,
  year: {
    name: 'year',
    label: 'Year',
    dataType: 'number',
    editable: true
  } as FluxorProps<number>,
  value: {
    name: 'value',
    label: 'Value',
    dataType: 'number',
    editable: true
  } as FluxorProps<number>,
  basePremium: {
    name: 'basePremium',
    label: 'Base Premium',
    dataType: 'number',
    editable: true
  } as FluxorProps<number>,
  totalModifier: {
    name: 'totalModifier',
    label: 'Total Modifier',
    dataType: 'number',
    editable: true
  } as FluxorProps<number>,
  adjustedPremium: {
    name: 'adjustedPremium',
    label: 'Adjusted Premium',
    dataType: 'number',
    editable: true
  } as FluxorProps<number>,
};

export const sampleVehicles: Vehicle[] = [
  {
    registration: 'ABC123',
    type: 'Sedan',
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    value: 25000,
    basePremium: 1200,
    totalModifier: 0.9,
    adjustedPremium: 1080
  },
  {
    registration: 'XYZ789',
    type: 'SUV',
    make: 'Honda',
    model: 'CR-V',
    year: 2021,
    value: 32000,
    basePremium: 1500,
    totalModifier: 1.1,
    adjustedPremium: 1650
  },
  {
    registration: 'DEF456',
    type: 'Truck',
    make: 'Ford',
    model: 'F-150',
    year: 2019,
    value: 35000,
    basePremium: 1800,
    totalModifier: 1.2,
    adjustedPremium: 2160
  }
];
