import { FpStr, DistributionStrategy, RoundingStrategy } from '../typing';

export interface MathConfig {
  name: string;
  precision: number;
  rounding: RoundingStrategy;
  distribution: DistributionStrategy;
}

export interface DecimalMath {
  valueOf(): FpStr;
  toString(): FpStr;
  add(other: FpStr | DecimalMath): DecimalMath;
  subtract(other: FpStr | DecimalMath): DecimalMath;
  multiplyBy(other: FpStr | DecimalMath): DecimalMath;
  divideBy(other: FpStr | DecimalMath): DecimalMath;
  divideInto(parts: number): DecimalMath[];
}

export interface CurrencyMath {
  valueOf(): FpStr;
  toString(): FpStr;
  add(other: FpStr | CurrencyMath): CurrencyMath;
  subtract(other: FpStr | CurrencyMath): CurrencyMath;
  multiplyBy(scalar: FpStr | DecimalMath): CurrencyMath;
  divideRounded(other: FpStr | DecimalMath): CurrencyMath;
  percentageOfRounded(pct: FpStr | DecimalMath): CurrencyMath;
  divideInto(parts: number): CurrencyMath[];
}

export interface StrategyFactory {
    getConfig(): MathConfig;
    fpTypes(): { dec: (val: FpStr) => DecimalMath, ccy: (val: FpStr) => CurrencyMath }
}

export class StrategyBuilder {
  private config: MathConfig;

  constructor(name: string) {
    this.config = {
      name,
      precision: 2,
      rounding: 'Bankers',
      distribution: 'LoadLast'
    };
  }

  withPrecision(p: number) {
    this.config.precision = p;
    return this;
  }

  withRounding(r: RoundingStrategy) {
    this.config.rounding = r;
    return this;
  }

  withInstallmentDistribution(d: DistributionStrategy) {
    this.config.distribution = d;
    return this;
  }

  build(): StrategyFactory {
    return require('../../js/strategy').createStrategy(this.config.name)
      .withPrecision(this.config.precision)
      .withRounding(this.config.rounding)
      .withInstallmentDistribution(this.config.distribution)
      .build();
  }
}

export function createStrategy(name: string) {
  return new StrategyBuilder(name);
}
