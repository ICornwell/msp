import { FluxorData } from '../../../renderEngine/fluxor/fluxorData';
import { AggregationType } from '../table';

// ============================================
// Vehicle List - With rating factors
// Can be shown flat (100 rows) or rolled up by type/use
// ============================================

export type VehicleType = 'car' | 'van' | 'truck' | 'motorcycle' | 'bus';
export type VehicleUse = 'private' | 'business' | 'commercial' | 'fleet';

export interface RatingFactor {
  factorId: string;
  factorName: string;
  baseRate: number;
  modifier: number;  // editable
  appliedRate: number;  // baseRate * modifier
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
  
  // Rating factors - editable modifiers
  ratingFactors: {
    ageOfVehicle: RatingFactor;
    driverAge: RatingFactor;
    location: RatingFactor;
    claimsHistory: RatingFactor;
    mileage: RatingFactor;
    securityFeatures: RatingFactor;
  };
  
  // Computed
  totalModifier: number;  // product of all modifiers
  adjustedPremium: number;  // basePremium * totalModifier
}

// Rollup row for type/use grouping
export interface VehicleRollup {
  type: VehicleType;
  use: VehicleUse;
  vehicleCount: number;
  totalValue: number;
  totalBasePremium: number;
  avgModifier: number;
  totalAdjustedPremium: number;
  
  // Aggregated rating factors - for bulk editing
  ratingFactors: {
    ageOfVehicle: { avgModifier: number; canBulkEdit: boolean };
    driverAge: { avgModifier: number; canBulkEdit: boolean };
    location: { avgModifier: number; canBulkEdit: boolean };
    claimsHistory: { avgModifier: number; canBulkEdit: boolean };
    mileage: { avgModifier: number; canBulkEdit: boolean };
    securityFeatures: { avgModifier: number; canBulkEdit: boolean };
  };
}

// Type aliases for FluxorData wrappers
export type VehicleFluxorData = FluxorData<Vehicle>;
export type VehicleRollupFluxorData = FluxorData<VehicleRollup>;

// Aggregation metadata for flat vehicle view
export const vehicleAggregationMeta: Partial<Record<keyof Vehicle, AggregationType>> = {
  vehicleId: AggregationType.None,
  registration: AggregationType.Count,
  type: AggregationType.None,
  use: AggregationType.None,
  make: AggregationType.None,
  model: AggregationType.None,
  year: AggregationType.None,
  value: AggregationType.Sum,
  basePremium: AggregationType.Sum,
  totalModifier: AggregationType.Average,
  adjustedPremium: AggregationType.Sum,
};

// Display labels for flat vehicle view
export const vehicleLabels: Partial<Record<keyof Vehicle, string>> = {
  vehicleId: 'ID',
  registration: 'Registration',
  type: 'Type',
  use: 'Use',
  make: 'Make',
  model: 'Model',
  year: 'Year',
  value: 'Value',
  basePremium: 'Base Premium',
  totalModifier: 'Total Modifier',
  adjustedPremium: 'Adjusted Premium',
};

// Aggregation metadata for rollup view
export const vehicleRollupAggregationMeta: Partial<Record<keyof VehicleRollup, AggregationType>> = {
  type: AggregationType.None,
  use: AggregationType.None,
  vehicleCount: AggregationType.Sum,
  totalValue: AggregationType.Sum,
  totalBasePremium: AggregationType.Sum,
  avgModifier: AggregationType.Average,
  totalAdjustedPremium: AggregationType.Sum,
};

// Display labels for rollup view
export const vehicleRollupLabels: Partial<Record<keyof VehicleRollup, string>> = {
  type: 'Type',
  use: 'Use',
  vehicleCount: 'Count',
  totalValue: 'Total Value',
  totalBasePremium: 'Total Base Premium',
  avgModifier: 'Avg Modifier',
  totalAdjustedPremium: 'Total Adjusted Premium',
};

// Rating factor definitions
const ratingFactorDefs = {
  ageOfVehicle: { factorId: 'ageOfVehicle', factorName: 'Age of Vehicle' },
  driverAge: { factorId: 'driverAge', factorName: 'Driver Age' },
  location: { factorId: 'location', factorName: 'Location Risk' },
  claimsHistory: { factorId: 'claimsHistory', factorName: 'Claims History' },
  mileage: { factorId: 'mileage', factorName: 'Annual Mileage' },
  securityFeatures: { factorId: 'securityFeatures', factorName: 'Security Features' },
};

// ============================================
// Seeded Random Number Generator
// ============================================
// Simple mulberry32 PRNG - deterministic results from seed
function createSeededRandom(seed: number) {
  let state = seed;
  
  return {
    // Returns 0-1 (like Math.random())
    next(): number {
      state |= 0;
      state = state + 0x6D2B79F5 | 0;
      let t = Math.imul(state ^ state >>> 15, 1 | state);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    },
    
    // Returns integer from 0 to max-1
    nextInt(max: number): number {
      return Math.floor(this.next() * max);
    },
    
    // Returns item from array
    pick<T>(arr: T[]): T {
      return arr[this.nextInt(arr.length)];
    },
    
    // Reset to original seed
    reset(newSeed?: number) {
      state = newSeed ?? seed;
    }
  };
}

// Default seed for reproducible test data
const DEFAULT_SEED = 42;
const rng = createSeededRandom(DEFAULT_SEED);

// Helper to create vehicle with rating factors
function createVehicle(
  id: number,
  reg: string,
  type: VehicleType,
  use: VehicleUse,
  make: string,
  model: string,
  year: number,
  value: number,
  basePremium: number,
  factors: [number, number, number, number, number, number]  // modifiers for each factor
): Vehicle {
  const ratingFactors = {
    ageOfVehicle: { ...ratingFactorDefs.ageOfVehicle, baseRate: 1.0, modifier: factors[0], appliedRate: factors[0] },
    driverAge: { ...ratingFactorDefs.driverAge, baseRate: 1.0, modifier: factors[1], appliedRate: factors[1] },
    location: { ...ratingFactorDefs.location, baseRate: 1.0, modifier: factors[2], appliedRate: factors[2] },
    claimsHistory: { ...ratingFactorDefs.claimsHistory, baseRate: 1.0, modifier: factors[3], appliedRate: factors[3] },
    mileage: { ...ratingFactorDefs.mileage, baseRate: 1.0, modifier: factors[4], appliedRate: factors[4] },
    securityFeatures: { ...ratingFactorDefs.securityFeatures, baseRate: 1.0, modifier: factors[5], appliedRate: factors[5] },
  };
  
  const totalModifier = factors.reduce((acc, f) => acc * f, 1);
  
  return {
    vehicleId: `VEH-${String(id).padStart(3, '0')}`,
    registration: reg,
    type,
    use,
    make,
    model,
    year,
    value,
    basePremium,
    ratingFactors,
    totalModifier,
    adjustedPremium: basePremium * totalModifier,
  };
}

// Generate 100 test vehicles
const makes = ['Toyota', 'Ford', 'BMW', 'Mercedes', 'Honda', 'Volvo', 'Audi', 'VW'];
const carModels = ['Camry', 'Focus', '3 Series', 'C-Class', 'Civic', 'S60', 'A4', 'Golf'];
const vanModels = ['HiAce', 'Transit', 'Sprinter', 'Sprinter', 'N-Van', 'V90', 'Q5', 'Transporter'];
const truckModels = ['Hilux', 'F-150', 'X5', 'GLE', 'Ridgeline', 'XC90', 'Q7', 'Touareg'];

function randomModifier(base: number, variance: number): number {
  return Math.round((base + (rng.next() - 0.5) * variance) * 100) / 100;
}

function generateVehicles(count: number, seed?: number): Vehicle[] {
  // Reset RNG for reproducible results
  rng.reset(seed ?? DEFAULT_SEED);
  
  const vehicles: Vehicle[] = [];
  const types: VehicleType[] = ['car', 'car', 'car', 'van', 'van', 'truck', 'motorcycle', 'bus'];
  const uses: VehicleUse[] = ['private', 'private', 'business', 'commercial', 'fleet'];
  
  for (let i = 1; i <= count; i++) {
    const type = rng.pick(types);
    const use = rng.pick(uses);
    const makeIdx = rng.nextInt(makes.length);
    const make = makes[makeIdx];
    const model = type === 'car' ? carModels[makeIdx] 
                : type === 'van' ? vanModels[makeIdx]
                : type === 'truck' ? truckModels[makeIdx]
                : type === 'motorcycle' ? 'Bike'
                : 'Coach';
    const year = 2015 + rng.nextInt(10);
    const value = type === 'car' ? 15000 + rng.next() * 45000
                : type === 'van' ? 20000 + rng.next() * 30000
                : type === 'truck' ? 35000 + rng.next() * 65000
                : type === 'motorcycle' ? 5000 + rng.next() * 20000
                : 80000 + rng.next() * 120000;
    const basePremium = value * (type === 'motorcycle' ? 0.08 : type === 'bus' ? 0.03 : 0.05);
    
    // Generate registration (UK style)
    const regLetters = 'ABCDEFGHJKLMNPRSTVWXY';
    const reg = `${regLetters[rng.nextInt(regLetters.length)]}${regLetters[rng.nextInt(regLetters.length)]}${String(rng.nextInt(100)).padStart(2, '0')} ${regLetters[rng.nextInt(regLetters.length)]}${regLetters[rng.nextInt(regLetters.length)]}${regLetters[rng.nextInt(regLetters.length)]}`;
    
    // Rating factor modifiers
    const ageOfVehicle = randomModifier(year < 2018 ? 1.15 : year < 2022 ? 1.0 : 0.95, 0.2);
    const driverAge = randomModifier(use === 'private' ? 1.0 : 0.9, 0.3);
    const location = randomModifier(1.0, 0.4);
    const claimsHistory = randomModifier(1.0, 0.5);
    const mileage = randomModifier(use === 'commercial' || use === 'fleet' ? 1.2 : 1.0, 0.3);
    const securityFeatures = randomModifier(year >= 2020 ? 0.9 : 1.0, 0.15);
    
    vehicles.push(createVehicle(
      i, reg, type, use, make, model, year,
      Math.round(value),
      Math.round(basePremium),
      [ageOfVehicle, driverAge, location, claimsHistory, mileage, securityFeatures]
    ));
  }
  
  return vehicles;
}

// Export factory for custom generation with different seeds/counts
export { createSeededRandom, generateVehicles, DEFAULT_SEED };

// Default test data (seed 42, 100 vehicles)
export const vehicleTestData: Vehicle[] = generateVehicles(100);

// Generate rollup from flat data
export function generateRollup(vehicles: Vehicle[]): VehicleRollup[] {
  const groups = new Map<string, Vehicle[]>();
  
  vehicles.forEach(v => {
    const key = `${v.type}|${v.use}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(v);
  });
  
  return Array.from(groups.entries()).map(([key, vList]) => {
    const [type, use] = key.split('|') as [VehicleType, VehicleUse];
    
    const avgFactor = (factorKey: keyof Vehicle['ratingFactors']) =>
      vList.reduce((sum, v) => sum + v.ratingFactors[factorKey].modifier, 0) / vList.length;
    
    // Check if all vehicles have same modifier (can bulk edit without confusion)
    const canBulkEdit = (factorKey: keyof Vehicle['ratingFactors']) => {
      const first = vList[0].ratingFactors[factorKey].modifier;
      return vList.every(v => Math.abs(v.ratingFactors[factorKey].modifier - first) < 0.01);
    };
    
    return {
      type,
      use,
      vehicleCount: vList.length,
      totalValue: vList.reduce((sum, v) => sum + v.value, 0),
      totalBasePremium: vList.reduce((sum, v) => sum + v.basePremium, 0),
      avgModifier: vList.reduce((sum, v) => sum + v.totalModifier, 0) / vList.length,
      totalAdjustedPremium: vList.reduce((sum, v) => sum + v.adjustedPremium, 0),
      ratingFactors: {
        ageOfVehicle: { avgModifier: avgFactor('ageOfVehicle'), canBulkEdit: canBulkEdit('ageOfVehicle') },
        driverAge: { avgModifier: avgFactor('driverAge'), canBulkEdit: canBulkEdit('driverAge') },
        location: { avgModifier: avgFactor('location'), canBulkEdit: canBulkEdit('location') },
        claimsHistory: { avgModifier: avgFactor('claimsHistory'), canBulkEdit: canBulkEdit('claimsHistory') },
        mileage: { avgModifier: avgFactor('mileage'), canBulkEdit: canBulkEdit('mileage') },
        securityFeatures: { avgModifier: avgFactor('securityFeatures'), canBulkEdit: canBulkEdit('securityFeatures') },
      },
    };
  });
}

export const vehicleRollupTestData: VehicleRollup[] = generateRollup(vehicleTestData);
