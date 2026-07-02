# Phase 1 API Documentation

## FixedDecimal - Foundation Layer

The `FixedDecimal` type provides bulletproof decimal arithmetic for financial applications.

### Features

- **Precision**: Support for 0-18 decimal places
- **Range**: Uses i128 internally for maximum range
- **Safety**: Overflow/underflow protection with proper error handling
- **Deterministic**: Consistent results across platforms

### JavaScript API

#### `createFixedDecimal(value, precision)`
Creates a new FixedDecimal from a string value.

```javascript
const fp = require('./index.js');

// Create a decimal with 2 decimal places
const price = fp.createFixedDecimal('19.99', 2);
console.log(price); // "19.99"

// Create a high precision decimal
const pi = fp.createFixedDecimal('3.141592653589793', 15);
console.log(pi); // "3.141592653589793"
```

#### `add(value1, precision1, value2, precision2)`
Adds two FixedDecimals (must have same precision).

```javascript
const sum = fp.add('100.25', 2, '50.75', 2);
console.log(sum); // "151.00"
```

#### `subtract(value1, precision1, value2, precision2)`
Subtracts two FixedDecimals (must have same precision).

```javascript
const diff = fp.subtract('100.25', 2, '50.75', 2);
console.log(diff); // "49.50"
```

#### `multiply(value1, precision1, value2, precision2)`
Multiplies two FixedDecimals.

```javascript
const product = fp.multiply('19.99', 2, '3', 0);
console.log(product); // "59.97"
```

#### `divide(value1, precision1, value2, precision2)`
Divides two FixedDecimals.

```javascript
const quotient = fp.divide('100.00', 2, '4.00', 2);
console.log(quotient); // "25.00"
```

### Error Handling

All operations return errors for invalid conditions:

- **Precision mismatch**: Operations on decimals with different precisions
- **Division by zero**: Attempting to divide by zero
- **Invalid precision**: Precision outside 0-18 range  
- **Parse errors**: Malformed decimal strings
- **Overflow/underflow**: Arithmetic results outside i128 range

### Financial Use Cases

#### Currency Calculations
```javascript
// Calculate total with tax
const subtotal = fp.createFixedDecimal('99.99', 2);
const taxRate = fp.createFixedDecimal('0.08', 2); // 8%
const tax = fp.multiply('99.99', 2, '0.08', 2);
const total = fp.add('99.99', 2, tax, 2);
```

#### Interest Calculations  
```javascript
// Simple interest: Principal × Rate
const principal = fp.createFixedDecimal('1000.00', 2);
const rate = fp.createFixedDecimal('0.05', 4); // 5% annually
const interest = fp.multiply('1000.00', 2, '0.05', 4);
```

#### Precision-Critical Operations
```javascript
// High-precision scientific calculations
const measurement = fp.createFixedDecimal('1.234567890123456789', 18);
const calibration = fp.createFixedDecimal('0.999999999999999999', 18);
const adjusted = fp.multiply(measurement, calibration);
```

## Implementation Status

✅ **Phase 1 Complete:**
- ✅ FixedDecimal type with basic arithmetic
- ✅ String format parser/serializer
- ✅ Comprehensive test suite (Rust + JavaScript)
- ✅ Error handling for edge cases
- ✅ JavaScript API via Neon bindings

🚀 **Ready for Phase 2:**
- Currency awareness (`FinancialDecimal`)
- Custom string format parsing (`'value;FP:precision;CCY:currency'`)
- Conversion history tracking
