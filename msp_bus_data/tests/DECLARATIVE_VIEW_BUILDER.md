# Declarative View Builder (v2)

## Overview

A new declarative approach to defining view structures that solves the type inference problem.

## The Problem with Imperative Builders

The original builder pattern used imperative method chaining:
```typescript
.withRootElement('account', 'acc', accountSchema)
  .withNamedSubElement('person', 'per', personSchema).endElement
  .withNamedSubElementCollection('order', 'ord', orderSchema).endElement
```

This approach had fundamental TypeScript limitations:
- Types were determined at instance creation, not after the chain completed
- `endElement` returned to a builder typed before knowing its children
- Type information was lost when calling `.buildView()`

## The Declarative Solution

Define the entire structure upfront:
```typescript
const viewStructure = {
  schema: accountSchema,
  children: {
    person: personSchema,
    order: [orderSchema, {
      orderItem: [orderItemSchema, {
        product: productSchema
      }]
    }]
  }
};

const view = view2('account-people')
  .withRootElement('account', 'acc', viewStructure)
  .buildView();
```

## Structure Definition Format

- **Plain schema**: `personSchema` = single element, no children
- **Array with schema**: `[orderSchema]` = collection, no children
- **Array with schema and children**: `[orderSchema, { items: ... }]` = collection with children
- **Object with schema and children**: `{ schema: accountSchema, children: {...} }` = single element with children

## Type Generation

Two approaches:

### 1. ViewDataTypeFromDef (Recommended)
Extract types directly from the structure definition:
```typescript
type DataType = ViewDataTypeFromDef<typeof viewStructure>;
```

This provides **perfect type inference** because the entire structure is visible at compile time.

### 2. ViewObjectType2 (Work in Progress)
Extract types from the built View object:
```typescript
type DataType = ViewObjectType2<typeof view>;
```

Currently has limitations due to tuple-to-object conversion complexity.

## Benefits

1. **Full Type Safety**: TypeScript can infer the complete nested structure
2. **Declarative**: Structure matches conceptual model
3. **Consistent**: Similar to how Schema properties are defined
4. **Readable**: Entire structure visible in one place
5. **Maintainable**: Changes to structure are localized

## Comparison

### Old (Imperative)
```typescript
.withRootElement('account', 'acc', accountSchema)
  .withNamedSubElement('person', 'per', personSchema)
    .withRelation('belongsTo')
  .endElement
  .withNamedSubElementCollection('order', 'ord', orderSchema)
    // ... many more lines
  .endElement
.endElement
```

Type definition: Manual

### New (Declarative)
```typescript
.withRootElement('account', 'acc', {
  schema: accountSchema,
  children: {
    person: personSchema,
    order: [orderSchema, { orderItem: [...] }]
  }
})
```

Type definition: `ViewDataTypeFromDef<typeof structure>` - Automatic!

## Files

- `src/models/api/viewStructure.ts` - Type definitions for structure format
- `src/fluent/viewBuilder2.ts` - New declarative builder implementation
- `src/models/api/viewObjectType2.ts` - Type extraction utilities
- `src/selfTests/viewBuilder2.test.ts` - Tests demonstrating usage
- `src/testResources/views/accounts-people-orders-items-products-v2.ts` - Example

## Status

✅ Runtime implementation complete
✅ ViewDataTypeFromDef type extraction working
✅ All tests passing
⚠️ ViewObjectType2 needs refinement for perfect tuple preservation

## Next Steps

1. Fix ViewObjectType2 tuple-to-object conversion
2. Add relation specification to declarative format
3. Consider migrating old builder to use new approach internally
4. Code generator tool to create structure definitions from JSON
