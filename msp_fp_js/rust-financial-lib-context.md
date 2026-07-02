# Rust Financial Library - Development Context

## Project Overview

Building a Rust-based fixed-point decimal library for financial applications with:
- **Neon bindings** for Node.js integration
- **WebAssembly compilation** for browser support
- **Custom string format** for portable financial data with currency awareness
- **Conversion history tracking** for audit trails

## Core Philosophy

- **Bulletproof math first** - Build on solid integer-based decimal arithmetic
- **Currency isolation** - Operations only work within same currency unless explicitly converted
- **Explicit conversions** - No automatic currency mixing without conversion tables
- **Portable format** - Self-documenting string representation that works everywhere
- **Test-driven development** - Comprehensive testing for financial precision
- **Simple, not complex** - Useful and clear, avoid high-complexity DSL

## String Format Specification

```
'value;FP:precision;CCY:currency[;CF:rate:precision:from_currency:date]*'
```

### Examples:
- Basic: `'123.23;FP:2;CCY:USD'`
- With conversion history: `'123.23;FP:2;CCY:USD;CF:100.0023:4:USD:2025-03-02'`
- Multiple conversions: Semicolon-separated CF entries for audit trail

### Design Goals:
- **Self-documenting**: Precision and currency embedded
- **Portable**: Works as string in any persistence system
- **Immutable audit trail**: Conversion history preserved
- **Middleware-friendly**: Flows through systems without data loss

## Architecture Layers

### 1. Foundation Layer (`FixedDecimal`)
```rust
struct FixedDecimal {
    value: i128,           // Internal integer representation
    precision: u8,         // Number of decimal places (0-18)
}
```
- Pure mathematical operations
- No currency awareness
- Overflow/underflow protection
- Deterministic rounding

### 2. Currency Layer (`FinancialDecimal`)
```rust
struct FinancialDecimal {
    decimal: FixedDecimal,
    currency: String,      // ISO 4217 code (USD, GBP, EUR, etc.)
    conversions: Vec<ConversionRecord>, // Optional history
}
```
- Currency-aware operations
- String format parsing/serialization
- Conversion history tracking

### 3. Context Layer (`OperatorContext`)
```rust
struct OperatorContext {
    precision: u8,
    base_currency: String,
    conversion_rates: HashMap<String, FinancialDecimal>,
}
```
- Smart defaults and heuristics
- Currency conversion tables
- Operation configuration

## Operator Behavior Rules

### Same Currency Operations
```rust
// Works normally
'100.00;FP:2;CCY:USD' + '50.00;FP:2;CCY:USD' = '150.00;FP:2;CCY:USD'
```

### Mixed Currency Operations (No Context)
```rust
// Returns grouped results
sum(['100.00;FP:2;CCY:USD', '100.00;FP:2;CCY:GBP', '100.00;FP:2;CCY:EUR'])
// Returns: {USD: ['100.00;FP:2;CCY:USD'], GBP: ['100.00;FP:2;CCY:GBP'], EUR: ['100.00;FP:2;CCY:EUR']}
```

### Mixed Currency Operations (With Context)
```javascript
const opCtx = jsfp.createContext({
    precision: 4,
    conversions: { 
        base: 'GBP', 
        rates: {'USD': '121.45;FP:2', 'EUR': '110.432;FP:4'}
    }
});
// Converts everything to base currency or provides converted groupings
```

## Technical Requirements

### Rust Dependencies
- **Core**: `fpdec` crate for decimal arithmetic foundation
- **Neon**: For Node.js native bindings
- **Wasm**: WebAssembly compilation support
- **Serde**: For serialization support
- **ISO 4217**: Currency code validation

### JavaScript/TypeScript API
```javascript
// Basic usage
const fp = require('rust-financial-lib');
const decimal = fp.parse('123.45;FP:2;CCY:USD');
const result = fp.add(decimal, '67.89;FP:2;CCY:USD');

// Context-based operations
const ctx = fp.createContext({...config});
const results = ctx.sum([...values]);
```

### Performance Goals
- Faster than pure JavaScript decimal libraries
- Memory efficient string parsing
- Minimal allocation for common operations
- Benchmark against `decimal.js` and similar libraries

## Development Phases

### Phase 1: Core Rust Library
- [ ] `FixedDecimal` type with basic arithmetic
- [ ] String format parser/serializer
- [ ] Comprehensive test suite
- [ ] Error handling for edge cases
- [ ] Benchmarking framework

### Phase 2: Currency Features
- [ ] `FinancialDecimal` with currency awareness
- [ ] Conversion history tracking
- [ ] ISO 4217 currency validation
- [ ] Mixed-currency operation grouping

### Phase 3: Context & Operators
- [ ] `OperatorContext` for smart operations
- [ ] Currency conversion with rate tables
- [ ] Advanced mathematical operations
- [ ] Configurable precision handling

### Phase 4: Bindings & Distribution
- [ ] Neon bindings for Node.js
- [ ] WebAssembly compilation
- [ ] TypeScript definitions
- [ ] npm package with dual targets

## Test Strategy

### Unit Tests
- All arithmetic operations with edge cases
- String parsing for malformed inputs
- Currency validation
- Precision handling across operations
- Overflow/underflow scenarios

### Integration Tests
- Cross-platform consistency (Node.js vs Browser)
- Performance benchmarks
- Real-world financial calculations
- Currency conversion accuracy

### Property-Based Testing
- Arithmetic properties (associativity, commutativity)
- Round-trip string parsing
- Precision preservation

## Error Handling

### Parse Errors
- Malformed string format
- Invalid currency codes
- Precision out of bounds
- Invalid decimal values

### Arithmetic Errors
- Overflow/underflow conditions
- Division by zero
- Incompatible currency operations
- Precision conflicts

### Context Errors
- Missing conversion rates
- Circular currency references
- Invalid base currency

## Security Considerations

- Input validation for all string parsing
- Integer overflow protection
- No unsafe code in public API
- Deterministic behavior (no randomness)
- Memory safety through Rust guarantees

## Documentation Requirements

- API reference with examples
- Migration guide from existing decimal libraries
- Best practices for financial calculations
- Performance characteristics
- Browser compatibility matrix

## Future Considerations

- Support for cryptocurrency precision
- Integration with popular accounting frameworks
- Real-time exchange rate fetching
- Advanced financial calculations (compound interest, etc.)
- Localization for different decimal separators
- Database-specific optimizations