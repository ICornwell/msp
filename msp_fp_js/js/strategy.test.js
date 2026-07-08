const { createStrategy } = require('./strategy.js');

describe('Fluent Functional Strategy API', () => {
  test('should build a strategy and allow fluent execution', () => {
    // 1. Initialize strategy
    const PremiumStrategy = createStrategy('Premium')
      .withPrecision(2)
      .withRounding('Bankers')
      .withInstallmentDistribution('LoadLast')
      .build();

    // 2. Extract types
    const { ccy, dec } = PremiumStrategy.fpTypes();

    // 3. Functional fluent pipeline
    // "GBP: 100.00: 2dp" + ("GBP: 50.00: 2dp" * 2) = "GBP: 200.00: 2dp"
    
    // Note: fpStr operations don't currently parse the currency prefix ("GBP: "). 
    // They expect pure scalar strings! Let's ensure the JS layer handles stripping the CCY for fpStr pass-through 
    // or we'll rewrite the `currency.rs` mapping to accept string multipliers.
    const result = ccy("GBP: 100.00: 2dp")
      .add(
        ccy("GBP: 50.00: 2dp").multiplyBy(dec("2.0: 1dp"))
      );

    expect(result.toString()).toBe("GBP: 200.00: 2dp");
  });
});
