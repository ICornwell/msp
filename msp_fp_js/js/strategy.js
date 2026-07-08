const { fpStr, ccy: nativeCcy, dim: nativeDim } = require('./index.js');

function createStrategy(name) {
  let config = {
    name,
    precision: 2,
    rounding: 'Bankers',
    distribution: 'LoadLast'
  };

  const builder = {
    withPrecision: (p) => { config.precision = p; return builder; },
    withRounding: (r) => { config.rounding = r; return builder; },
    withInstallmentDistribution: (d) => { config.distribution = d; return builder; },
    build: () => {
      return {
        getConfig: () => ({ ...config }),
        fpTypes: () => {
          // Internal helper to extract the string value from wrapped objects
          const unwrap = (val) => val && typeof val.valueOf === 'function' ? val.valueOf() : val;
          // Internal helper to separate Currency Symbol from Number String
          const stripCcy = (valStr) => {
              const parts = valStr.split(':');
              if (parts.length > 2) {
                  return { prefix: parts[0] + ':', numStr: parts.slice(1).join(':').trim() }
              }
              return { prefix: '', numStr: valStr };
          };

          // Standard fixed-point decimal
          const dec = (initialValue) => {
            const valStr = unwrap(initialValue);
            return {
              valueOf: () => valStr,
              toString: () => valStr,
              add: (other) => dec(fpStr.add(valStr, unwrap(other))),
              subtract: (other) => dec(fpStr.subtract(valStr, unwrap(other))),
              multiplyBy: (other) => dec(fpStr.multiply(valStr, unwrap(other))),
              divideBy: (other) => dec(fpStr.divide(valStr, unwrap(other))),
              divideInto: (parts) => fpStr.divideInto(valStr, parts, config.distribution).map(dec)
            };
          };

          // Currency string wrapper
          const ccy = (initialValue) => {
            const valStr = unwrap(initialValue);
            return {
              valueOf: () => valStr,
              toString: () => valStr,
              add: (other) => ccy(nativeCcy.strictAdd(valStr, unwrap(other))),
              subtract: (other) => ccy(nativeCcy.strictSubtract(valStr, unwrap(other))),
              multiplyBy: (other) => ccy(nativeCcy.multiply(valStr, unwrap(other))),
              divideRounded: (other) => ccy(nativeCcy.divideRounded(valStr, unwrap(other))),
              percentageOfRounded: (pct) => ccy(nativeCcy.percentageOfRounded(valStr, unwrap(pct))),
              divideInto: (parts) => nativeCcy.divideInto(valStr, parts, config.distribution).map(ccy)
            };
          };

          return { ccy, dec };
        }
      };
    }
  };

  return builder;
}

module.exports = { createStrategy };
