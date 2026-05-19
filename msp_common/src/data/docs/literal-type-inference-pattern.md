# Literal Type Inference Pattern for Fluent Builders

## Overview

A TypeScript pattern that enables fluent builders to generate both runtime artifacts (JSON-serializable objects) AND compile-time types from a single fluent chain definition, with zero runtime overhead and no code generation.

## Core Problem Solved

**Traditional approaches require duplication:**
```typescript
// Approach 1: Define type manually, then build runtime object
type ViewData = { account: AccountData; person: PersonData };
const view = buildView(/* ... */);

// Approach 2: Codegen from schema
// schema.json → generated types.ts + runtime validation

// Approach 3: Runtime validation libraries (zod, yup)
const schema = z.object({ /* runtime + types, but bundle cost */ });
```

**This pattern provides:**
- Single source of truth (fluent chain)
- Automatic type generation
- Zero runtime cost (types erased)
- No code generation step
- Production-safe (minifier-friendly)

## The Breakthrough Technique

### Key Insight: Literal Type Inference on Generic Parameters

TypeScript can infer **literal types** (not just general types) for generic parameters:

```typescript
withSubElement<SubEName extends string, IC extends TrueFalse>(
  name: SubEName,          // Infers as "person", not string
  schema: Schema<any>,
  isCollection: IC         // Infers as false, not boolean
)
```

When called:
```typescript
.withSubElement("person", personSchema, false)
```

TypeScript infers:
- `SubEName = "person"` (literal type)
- `IC = false` (literal type)

These literals can then be used in **type-level computations**:
- Conditional types: `IC extends true ? T[] : T`
- Mapped types: `{[K in SubEName]: DataType}`
- Property key generation: Uses the string literal as an actual property name

## Core Pattern Components

### 1. CNTX (Context) Wrapper

```typescript
type CNTX<B, D> = B & { data: D };
```

**Purpose:** Carries both the builder interface (`B`) and the accumulated data type (`D`) through the fluent chain.

**The `data` property:**
- Only exists in the type system (phantom property)
- Never accessed at runtime
- Used to extract the final inferred type: `typeof result.data`

### 2. JOIN Utility

```typescript
type JOIN<A, B> = { [K in keyof (A & B)]: (A & B)[K] };
```

**Purpose:** Flattens intersection types (`A & B`) into clean object types.

**Example:**
```typescript
type Ugly = {a: number} & {b: string};     // Intersection
type Clean = JOIN<{a: number}, {b: string}>; // {a: number; b: string}
```

**Benefit:** Better IntelliSense tooltips, removes duplicate keys.

### 3. ReType - Recursive Context Reconstruction

```typescript
type ReType<T extends CNTX<any, any>, NewDataForCNTX, EName> = 
  EName extends string | number | symbol
    ? T extends CNTX<infer B, infer CurrentD>
      ? B extends ViewElementBuilder<infer ParentDT, infer ParentEName, infer InnerRT>
        ? ParentEName extends string | number | symbol
          ? CNTX<
              ViewElementBuilder<
                JOIN<ParentDT, {[K in EName]: NewDataForCNTX}>,
                ParentEName,
                ReType<InnerRT, JOIN<ParentDT, {[K in EName]: NewDataForCNTX}>, ParentEName>
              >,
              NewDataForCNTX
            >
          : T
        : CNTX<B, NewDataForCNTX>
      : T
    : T;
```

**Purpose:** When going deeper (adding a sub-element), reconstructs the parent's return type to include the new child.

**How it works:**
1. Extract parent's data type (`ParentDT`), element name (`ParentEName`), and return context (`InnerRT`)
2. Create new parent data type: `JOIN<ParentDT, {[K in EName]: NewDataForCNTX}>`
3. Recursively update the grandparent context
4. Return updated context with new child included

**Result:** Calling `.end()` returns to a parent that knows about all children added at that level.

### 4. Conditional Type Helpers

```typescript
type MakeArray<T, IC extends TrueFalse> = IC extends true ? T[] : T;

type CreateObjProp<N, O, IC extends TrueFalse> = 
  IC extends true ? {[K in N]: O[]} : {[K in N]: O};
```

**Purpose:** Use the boolean literal to conditionally create array or single types.

## Implementation: ViewBuilder4

### Interface Structure

```typescript
export interface ViewElementBuilder<
  DT,                              // Data Type for this element
  EName extends string | symbol,   // Element Name (literal)
  RT extends CNTX<any, any>        // Return Type (parent context)
> {
  withRelation: (relation: string) => CNTX<ViewElementBuilder<DT, EName, RT>, DT>;
  
  withSubElement: <
    SubEName extends string, 
    S extends Schema<any, any>, 
    IC extends TrueFalse
  >(
    name: SubEName,
    schema: S,
    isCollection: IC
  ) => NEXC<
    ViewElementBuilder<
      MakeArray<PropertiesOf<S>, IC>,
      SubEName,
      CURC<
        ViewElementBuilder<
          JOIN<DT, CreateObjProp<SubEName, PropertiesOf<S>, IC>>,
          EName,
          ReType<RT, JOIN<DT, CreateObjProp<SubEName, PropertiesOf<S>, IC>>, EName>
        >,
        JOIN<DT, CreateObjProp<SubEName, PropertiesOf<S>, IC>>
      >
    >,
    MakeArray<PropertiesOf<S>, IC>
  >;
  
  end: () => RT;
  build: () => ViewElement<any, any> | ViewElementCollection<any, any>;
}
```

### Type Flow Example

```typescript
const view = view4('test')
  .withRootElement(accountSchema, false)
    .withSubElement("person", personSchema, false)
      .withRelation('belongsTo')
    .end()
    .withSubElement("order", orderSchema, true)
    .end()
  .end();

type ViewData = typeof view.data;
// Result: {
//   accountNumber?: string;
//   name?: string;
//   person: { firstName?: string; lastName?: string };
//   order: Array<{ orderId?: string; total?: number }>;
// }
```

**Type accumulation:**
1. Start: `{}`
2. Add person: `JOIN<AccountData, {person: PersonData}>` → `{...AccountData, person: PersonData}`
3. Add order: `JOIN<..., {order: OrderData[]}>` → `{...AccountData, person: PersonData, order: OrderData[]}`
4. `.end()` returns to root with accumulated type

### Runtime Implementation

```typescript
function createViewElementBuilder<DT, EName, RT>(
  returnTo: BuilderOf<RT>,
  elementName: string,
  queryObjectId: string,
  schema: Schema<any, any>,
  isCollection: boolean,
  elementBuilders: Array<any>
): CNTX<ViewElementBuilder<DT, EName, RT>, DT> {
  
  const element = {
    object: elementName,
    queryObjectId: queryObjectId,
    schema: schema.vid,
    isCollection: isCollection,
    // ... other runtime properties
  };

  const builder: ViewElementBuilder<DT, EName, RT> = {
    withSubElement: function<...>(name, schema, isCollection) {
      // Recursively create child builder
      return createViewElementBuilder(...);
    },
    end: function() {
      return returnTo; // Return to parent
    },
    build: function() {
      // Build runtime View object
      return element;
    }
  };

  // Wrap builder with CNTX
  const builderContext: CNTX<...> = {
    ...builder,
    data: {} as DT  // Phantom property
  };

  return builderContext;
}
```

**Key runtime aspects:**
- Standard method chaining
- No type introspection
- No dynamic property access
- Explicit string literals passed as arguments
- Minifier-safe

## Working Example (test.ts - Simplified Pattern)

The technique was first proven in `tests/src/fluent/test.ts`:

```typescript
type CNTX<B,D> = B & {data: D}
type JOIN<A, B> = { [K in keyof (A & B)]: (A & B)[K] }

interface test<DT, CEN, RT extends CNTX<any, any>> {
  deep<IEN, DT2>(obj: DT2): NEXC<
    test<
      InnerTypeOf<IEN, DT2>, 
      IEN, 
      CURC<
        test<JOIN<DT, DT2>, CEN, ReType<RT, JOIN<DT, DT2>, CEN>>, 
        JOIN<DT, DT2>
      >
    >, 
    InnerTypeOf<IEN, DT2>
  >;
  end(): RT;
}

const result = createTest<{n:number}, "root", CNTX<string, {n:number}>>('test', {n: 42})
  .deep<'inner1',{inner1:{m: number}}>({inner1: {m: 43}})
    .deep<'inner1_1', {inner1_1:{p: number}}>({inner1_1: {p: 44}})
    .end()
  .end()
  .end();

const data = result.data;
// Type: {n:number} & {inner1: {m:number} & {inner1_1: {p:number}}}
```

## Application: ViewBuilder4

Applied to real-world use case:

```typescript
const viewContext = view4('account-orders')
  .withVersion('1.0')
  .withRootKey('accountNumber')
  .withRootElement(accountSchema, false)
    .withSubElement("person", personSchema, false)
      .withRelation('belongsTo')
    .end()
    .withSubElement("order", orderSchema, true)
      .withRelation('hasOrder')
      .withSubElement("orderItem", orderItemSchema, true)
        .withRelation('hasItem')
      .end()
    .end()
  .end();

// Runtime: Serializable View object for query building
const view = viewContext.buildView();

// Compile-time: Full TypeScript type
type ViewData = typeof viewContext.data;

// Usage: Type-safe data matching the view structure
const data: ViewData = {
  accountNumber: "ACC001",
  name: "Test",
  person: {
    firstName: "John",
    lastName: "Doe"
  },
  order: [{
    orderId: "ORD001",
    total: 100.50,
    orderItem: [{
      orderItemId: "ITEM001",
      price: 25.00,
      units: 4
    }]
  }]
};
```

## Key Benefits

### 1. Single Source of Truth
- One fluent definition
- Generates both runtime config and compile-time types
- No manual synchronization

### 2. Zero Runtime Cost
- All type magic erased during compilation
- Output is simple JavaScript
- No validation overhead in production

### 3. Production Safe
- No reflection or dynamic property access
- Minifier/bundler friendly
- No decorator metadata dependencies

### 4. Developer Experience
- Full IntelliSense support
- Compile-time validation
- Readable, declarative syntax
- Self-documenting structure

### 5. Scalability
- Complexity isolated to 3-4 core modules
- Hundreds of usage sites remain simple
- Easy to read and understand at call sites

## Extension Points

### Adding New Conditional Flags

```typescript
// Example: Add "required" flag
type MakeOptional<T, Req extends TrueFalse> = 
  Req extends true ? T : Partial<T>;

withSubElement<..., Req extends TrueFalse>(
  name: SubEName,
  schema: S,
  isCollection: IC,
  required: Req
) => /* use MakeOptional<..., Req> in return type */
```

### Schema Builder Refactoring

Apply same pattern to schema builder:

```typescript
const schema = schemaBuilder()
  .withId('person', '1.0')
  .withProperty('firstName', { infoType: 'Text', ... })
  .withProperty('lastName', { infoType: 'Text', ... })
  .buildSchema();

type PersonData = typeof schema.data;
// Inferred: { firstName?: string; lastName?: string }
```

### Other Potential Applications

- API endpoint builders
- GraphQL query builders
- Form builders
- State management structure definitions
- Configuration systems
- ORM model definitions

## Important Gotchas

### 1. Type Complexity Limits
TypeScript has recursion depth limits (~50 levels). Very deep nesting may hit limits.

**Solution:** Keep hierarchies reasonable, or use `any` escape hatches at deep levels.

### 2. Generic Parameter Ordering
The order of generic parameters matters for type inference:

```typescript
// Good: Infers name literal first, then uses it
withSubElement<SubEName extends string, S, IC>(name: SubEName, ...)

// Bad: Can't use SubEName before it's defined
withSubElement<S, IC, SubEName extends string>(name: SubEName, ...)
```

### 3. Runtime vs Compile-Time
The `data` property only exists in types:

```typescript
const view = viewBuilder()...;
console.log(view.data); // undefined at runtime!
type ViewData = typeof view.data; // Type extracted at compile-time
```

### 4. Builder Context Extraction
Need runtime helper to extract builder from CNTX:

```typescript
function getBuilder<T>(context: CNTX<T, any>): T {
  const { data, ...builder } = context as any;
  return builder as T;
}
```

## Files

### Core Implementation
- `tests/src/fluent/viewBuilder4.ts` - ViewBuilder using the pattern
- `tests/src/fluent/test.ts` - Original proof of concept
- `tests/src/fluent/test4.ts` - ViewBuilder4 usage examples

### Supporting Types
- `tests/src/models/api/view.ts` - View/ViewElement types
- `tests/src/models/api/data.ts` - Schema/Property types

### Documentation
- `tests/DECLARATIVE_VIEW_BUILDER.md` - Earlier declarative approach
- `tests/IMPLEMENTATION_SUMMARY.md` - Product/Schema/View system overview

## Future Work

1. **Schema Builder Refactoring**: Apply CNTX pattern to remove upfront type requirement
2. **NPM Package**: Extract as standalone library `fluent-type-builders`
3. **Blog Post**: Document the literal type inference technique
4. **Additional Builders**: Apply pattern to other domain models
5. **Partial/Required Flags**: Add more conditional type flags for flexibility

## Comparison to Alternatives

| Approach | Runtime Cost | Type Safety | DX | Complexity |
|----------|-------------|-------------|-----|-----------|
| **This Pattern** | Zero | Full | Excellent | Isolated |
| Zod/Yup | High (validation) | Good | Good | Distributed |
| Decorators | Medium (metadata) | Good | Medium | Distributed |
| Codegen | Zero | Full | Medium | Build step |
| Manual Types | Zero | Full | Poor | Duplication |

## Summary

The Literal Type Inference Pattern enables **configuration-as-code** with:
- Single fluent definition
- Automatic type generation
- Zero runtime overhead
- Production-safe output
- Scalable complexity management

**Core innovation:** Using generic parameter literal type inference to bridge runtime values and compile-time type computations, enabling type-level DSLs that look like ordinary code.

This pattern represents a novel approach to solving the dual runtime/compile-time artifact problem in TypeScript, with practical applications in configuration systems, schema definitions, and hierarchical data structure builders.
