// @ts-ignore
import * as native from '../js/index.js';
import { 
  NativeFp, NativeFpStr, 
  NativeDim, NativeDimSet, 
  NativeCcy, NativeCcySet 
} from './typing';

export const fp = native.fp as NativeFp;
export const fpStr = native.fpStr as NativeFpStr;
export const dim = native.dim as NativeDim;
export const dimSet = native.dimSet as NativeDimSet;
export const ccy = native.ccy as NativeCcy;
export const ccySet = native.ccySet as NativeCcySet;

export { createStrategy, StrategyBuilder } from './strategies/strategyBuilder';

export type {
  FpStr,
  CcyStr,
  DistributionStrategy,
  RoundingStrategy,
  DimensionAmount,
  DimensionMultiplier,
  CurrencyMultiplier,
  NativeFp,
  NativeFpStr,
  NativeDim,
  NativeDimSet,
  NativeCcy,
  NativeCcySet
} from './typing';

export type {
  MathConfig,
  DecimalMath,
  CurrencyMath,
  StrategyFactory
} from './strategies/strategyBuilder';
