# Type-Safe Declarative View Builder

## Overview

The declarative view builder now provides **compile-time type safety** for configuring sub-elements, similar to how the Schema builder constrains property names with `withProperty<K extends keyof D>(key: K, ...)`.

## Key Features

### 1. Type-Safe Sub-Element Names

The `withNamedSubElement` method now uses a generic constraint to ensure only valid child element names are accepted:

```typescript
withNamedSubElement: <K extends keyof ChildrenFromDef<CURRENT_DEF>>(
  name: K,
  config?: { queryObjectId?: string; relationFromParent?: string; }
) => ElementBuilder<...>
```

This means:
- ✅ TypeScript will autocomplete valid child names
- ✅ Invalid child names cause compile-time errors
- ✅ Deep nesting maintains type information at each level

### 2. Unwinding Type Stack

The builder uses a **generic type stack** that unwinds as you navigate through the hierarchy:

```typescript
// Root level
RootElementBuilder<ROOT, RE, CURRENT_DEF>
  → Can configure sub-elements or endElement() to return to ViewBuilder2

// Nested levels  
ElementBuilder<ROOT, RE, CURRENT_DEF, PARENT_BUILDER>
  → CURRENT_DEF: The definition of this element (schema + children)
  → PARENT_BUILDER: The builder to return to when endElement() is called
```

Each level knows:
- What element it's configuring (schema + children structure)
- What valid child element names exist (type-safe!)
- What builder to return to when `endElement()` is called

### 3. Pattern

```typescript
const view = view2<ROOT>('view-name')
  .withVersion('1.0')
  .withConfigSet('main')
  .withRootKey('id')
  .withRootElement('root', 'r', definition)
    // TypeScript knows valid children from 'definition'
    .withNamedSubElement('child1', { queryObjectId: 'c1' })
      .withNamedSubElement('grandchild', { queryObjectId: 'gc' })
      .endElement()  // back to child1
    .endElement()  // back to root
    .withNamedSubElement('child2', { queryObjectId: 'c2' })
    .endElement()  // back to root
  .endElement()  // back to view builder
  .buildView();
```

## Type Safety Examples

### Valid Usage

```typescript
const viewDef = {
  schema: accountSchema,
  children: {
    person: personSchema,
    order: [{
      schema: orderSchema,
      children: {
        item: [itemSchema]
      }
    }]
  }
};

// ✅ TypeScript enforces valid names
view2('test')
  .withRootElement('account', 'acc', viewDef)
    .withNamedSubElement('person', ...)  // ✅ 'person' is valid
    .endElement()
    .withNamedSubElement('order', ...)   // ✅ 'order' is valid
      .withNamedSubElement('item', ...)  // ✅ 'item' is valid (child of order)
      .endElement()
    .endElement()
  .endElement()
  .buildView();
```

### Invalid Usage (Compile Errors)

```typescript
// ❌ Error: Argument of type '"customer"' is not assignable to parameter of type '"person" | "order"'
.withNamedSubElement('customer', ...)  // 'customer' doesn't exist

// ❌ Error: Argument of type '"product"' is not assignable to parameter of type '"item"'
.withNamedSubElement('order', ...)
  .withNamedSubElement('product', ...)  // order only has 'item' as a child
```

## Implementation Details

### Generic Parameters

- **ROOT**: The root data type
- **RE**: The root element type (ViewElement or ViewElementCollection)
- **CURRENT_DEF**: The ViewElementDef for the current element being configured
- **PARENT_BUILDER**: The builder to return to when endElement() is called

### Builder Hierarchy

```
ViewBuilder2<ROOT, RE>
  └─ withRootElement() → RootElementBuilder<ROOT, RE, DEF>
       ├─ withNamedSubElement('child1') → ElementBuilder<ROOT, RE, CHILD1_DEF, RootElementBuilder>
       │    └─ withNamedSubElement('grandchild') → ElementBuilder<ROOT, RE, GC_DEF, ElementBuilder<..., CHILD1_DEF, ...>>
       │         └─ endElement() → returns ElementBuilder for child1
       ├─ endElement() → returns ViewBuilder2
       └─ buildView() → returns View<RE>
```

### Runtime Helpers

The implementation includes runtime helpers to extract children from definitions:

```typescript
function getChildrenFromDef(def: ViewElementDef<any>): ViewChildren {
  // Handles all ViewElementDef forms:
  // - Schema (no children)
  // - { schema, children }
  // - Schema[] (collection, no children)
  // - [{ schema, children }] (collection with children)
}
```

## Testing

All tests pass with full type safety:
- ✅ Basic structure building
- ✅ Nested sub-element configuration  
- ✅ Type-safe name constraints
- ✅ Deep nesting (4+ levels)
- ✅ No compilation errors

See:
- [viewBuilder2.test.ts](../selfTests/viewBuilder2.test.ts)
- [viewBuilder2TypeSafety.test.ts](../selfTests/viewBuilder2TypeSafety.test.ts)
- [typeSafetyDemo.ts](./typeSafetyDemo.ts)
