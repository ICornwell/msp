# Product, Schema, and View Builder Implementation

## Summary

Successfully implemented a complete fluent builder system for Products, Schemas, and Views with the following features:

## Components Created

### 1. **Schema Builder** (`src/fluent/schemaBuilder.ts`)
- Fluent API for defining typed schemas
- Support for schema inheritance
- Property definitions with dictionary references and info types
- Automatic type inference from data model types

### 2. **Enhanced View Builder** (`src/fluent/viewBuilder.ts`)
- Updated to support schema references
- Split into `ViewElement` (single) and `ViewElementCollection` (array)
- Type-safe context stack with CNTX<ROOT, PARENT, CURRENT>
- Methods: `withNamedSubElement`, `withNamedSubElementCollection`, `withRelation`

### 3. **Product Builder** (`src/fluent/productBuilder.ts`)
- Delta-based building with full snapshot output
- Product version inheritance (`inheritsFrom`)
- Automatic schema extraction from views
- Schema override capability
- Binds views and schemas to product/domain on build

### 4. **View Object Type Generator** (`src/models/api/viewObjectType.ts`)
- Compile-time type generation for view data objects
- Maps ViewElements to Schema types recursively
- Handles collections correctly (Array<T>)
- Type: `ViewObjectType<V extends View>`

## Key Design Decisions

### Type System Architecture
- **ViewElementBase**: Common properties for both element types
- **ViewElement**: Single item (`isCollection: false`)
- **ViewElementCollection**: Array (`isCollection: true`)
- **Schema**: Optional `domain` and `product` (bound when added to Product)

### Product Versioning Strategy
- **Builder**: Delta-based (express only differences)
- **Output**: Full snapshot (complete, flattened product)
- **Inheritance**: Copy parent's schemas/views, add new ones, apply overrides

### Recursive Type Safety
- Proper termination conditions (e.g., `Schema<D, undefined>`)
- No artificial depth limits
- Discriminated unions with explicit branches
- Natural recursion termination

## Usage Examples

### Define Schemas
```typescript
const personSchema = schema<{ name: string; age: number }>()
  .withFQId({ namespace: 'test', version: '1.0'})
  .withProperty('name', {
    dictionaryId: { id: 'dict-name', version: '1.0' },
    infoType: 'Text',
    defaultLabel: 'Name'
  })
  .buildSchema();
```

### Build Views
```typescript
const accountView = view('account-view')
  .withVersion('1.0')
  .withRootKey('accountNumber')
  .withRootElement('account', 'acc', accountSchema)
    .withNamedSubElement('person', 'per', personSchema)
      .withRelation('belongsTo')
    .endElement
    .withNamedSubElementCollection('order', 'ord', orderSchema)
      .withRelation('hasOrder')
    .endElement
  .endElement
  .buildView();
```

### Create Products
```typescript
const myProduct = product()
  .withName('Account Management')
  .withFQId({ namespace: 'test', version: '1.0.0'})
  .withDomain({ id: 'banking', version: '1.0' })
  .addView(accountView)  // Schemas automatically extracted
  .buildProduct();
```

### Product Version Inheritance
```typescript
const productV2 = product()
  .withFQId({ namespace: 'test', version: '2.0.0'})
  .inheritsFrom(productV1)  // Inherits all schemas and views
  .addView(newView)  // Add new views
  .overrideSchema(personSchemaV2)  // Override inherited schema
  .buildProduct();
```

### Generate View Data Types
```typescript
type AccountViewData = ViewObjectType<typeof accountView>;

// Results in:
// {
//   accountNumber?: string;
//   person: { name?: string; age?: number };
//   order: Array<{ orderId?: string }>;
// }
```

## Test Coverage

All tests passing (4 tests across 2 files):
- ✅ View builder structure validation
- ✅ Complete product building with schemas and views
- ✅ Product version inheritance
- ✅ ViewObjectType generation

## Files Modified/Created

### Modified
- `src/models/api/view.ts` - Added ViewElementBase, split types
- `src/models/api/data.ts` - Exported types, made Schema fields optional
- `src/fluent/viewBuilder.ts` - Added schema support, collections
- `src/testResources/views/accounts-people-orders-items-products.1.0.ts` - Updated to use schemas
- `src/selfTests/viewBuilder.test.ts` - Updated for new structure

### Created
- `src/fluent/schemaBuilder.ts` - Schema builder
- `src/fluent/productBuilder.ts` - Product builder
- `src/models/api/viewObjectType.ts` - Type generator
- `src/selfTests/productBuilder.test.ts` - Integration tests

## Future Enhancements

- Schema registry for automatic schema resolution in views
- Code generator to flatten product versions to full definitions
- Validation of schema references in views
- Schema migration tools for version upgrades
- Product manifest serialization/deserialization
