export type FpStr = string; // format: "VALUE: Pdp" (e.g., "10.00: 2dp")
export type CcyStr = string; // format: "CCY: VALUE: Pdp" (e.g., "GBP: 10.00: 2dp")
export type DistributionStrategy = 'LoadFirst' | 'LoadLast' | 'KeepSeparate';
export type RoundingStrategy = 'Bankers' | 'Up' | 'Down' | 'HalfUp' | 'HalfDown' | 'ExactOrCrash';

export interface DimensionAmount {
    dimension: string;
    amount: FpStr | string;
}

export interface DimensionMultiplier {
    amount: FpStr | string;
    multiplier: FpStr | string;
}

export interface CurrencyMultiplier {
    amount: CcyStr | string;
    multiplier: FpStr | string;
}

export interface NativeFp {
    add(a: string, aPrec: number, b: string, bPrec: number): string;
    subtract(a: string, aPrec: number, b: string, bPrec: number): string;
    multiply(a: string, aPrec: number, b: string, bPrec: number): string;
    divide(a: string, aPrec: number, b: string, bPrec: number): string;
    divideInto(amount: string, prec: number, parts: number, strategy: DistributionStrategy): { remainder: string, parts: string[] };
}

export interface NativeFpStr {
    add(a: FpStr, b: FpStr): FpStr;
    subtract(a: FpStr, b: FpStr): FpStr;
    multiply(a: FpStr, b: FpStr): FpStr;
    divide(a: FpStr, b: FpStr): FpStr;
    divideInto(amount: FpStr, parts: number, strategy: DistributionStrategy): FpStr[];
}

export interface NativeDim {
    strictAdd(a: DimensionAmount, b: DimensionAmount): DimensionAmount;
    strictSubtract(a: DimensionAmount, b: DimensionAmount): DimensionAmount;
    multiply(a: DimensionAmount, multiplierStr: FpStr): DimensionAmount;
    divideRounded(a: DimensionAmount, divisorStr: FpStr, strategy: RoundingStrategy): DimensionAmount;
    percentageOfRounded(a: DimensionAmount, pctStr: FpStr, strategy: RoundingStrategy): DimensionAmount;
    divideInto(a: DimensionAmount, parts: number, strategy: DistributionStrategy): DimensionAmount[];
    strictSumOver(items: DimensionAmount[]): DimensionAmount;
    strictSumOverProducts(items: DimensionMultiplier[]): DimensionAmount;
}

export interface NativeDimSet {
    sumDimensions(items: DimensionAmount[]): DimensionAmount[];
    add(items: DimensionAmount[], b: DimensionAmount): DimensionAmount[];
    subtract(items: DimensionAmount[], b: DimensionAmount): DimensionAmount[];
    multiply(items: DimensionAmount[], multiplierStr: FpStr): DimensionAmount[];
    divideRounded(items: DimensionAmount[], divisorStr: FpStr, strategy: RoundingStrategy): DimensionAmount[];
    percentageOfRounded(items: DimensionAmount[], pctStr: FpStr, strategy: RoundingStrategy): DimensionAmount[];
    divideInto(items: DimensionAmount[], parts: number, strategy: DistributionStrategy): Array<DimensionAmount[]>;
    strictSumOver(arraysOfItems: Array<DimensionAmount[]>): DimensionAmount[];
    strictSumOverProducts(items: Array<{ amount: DimensionAmount[], multiplier: FpStr }>): DimensionAmount[];
}

export interface NativeCcy {
    strictAdd(a: CcyStr, b: CcyStr): CcyStr;
    strictSubtract(a: CcyStr, b: CcyStr): CcyStr;
    multiply(a: CcyStr, multiplierStr: FpStr): CcyStr;
    divideRounded(a: CcyStr, divisorStr: FpStr, strategy: RoundingStrategy): CcyStr;
    percentageOfRounded(a: CcyStr, pctStr: FpStr, strategy: RoundingStrategy): CcyStr;
    divideInto(a: CcyStr, parts: number, strategy: DistributionStrategy): CcyStr[];
    strictSumOver(items: CcyStr[]): CcyStr;
    strictSumOverProducts(items: CurrencyMultiplier[]): CcyStr;
}

export interface NativeCcySet {
    add(items: CcyStr[], b: CcyStr): CcyStr[];
    subtract(items: CcyStr[], b: CcyStr): CcyStr[];
    multiply(items: CcyStr[], multiplierStr: FpStr): CcyStr[];
    divideRounded(items: CcyStr[], divisorStr: FpStr, strategy: RoundingStrategy): CcyStr[];
    percentageOfRounded(items: CcyStr[], pctStr: FpStr, strategy: RoundingStrategy): CcyStr[];
    divideInto(items: CcyStr[], parts: number, strategy: DistributionStrategy): Array<CcyStr[]>;
    strictSumOver(arraysOfItems: Array<CcyStr[]>): CcyStr[];
    strictSumOverProducts(items: Array<{ amount: CcyStr[], multiplier: FpStr }>): CcyStr[];
}
