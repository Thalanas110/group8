---
name: detect-variant-mapping-pattern
description: Identify React components that use typed variant-to-value mappings for styling or behavior
---

# Overview
Detect React components that structure styling or behavior around string literal union variants
and corresponding Record-based lookup mappings.

# Detection Rules
## Rule 1: Closed Variant Set
Look for a string literal union type used as a prop or function parameter.
Example:
```ts
export type Variant = "a" | "b" | "c";
```

## Rule 2: Variant to Value Mapping
Detect an object typed using `Record<Variant, T>` where object keys match the union members exactly.

## Rule 3: Resolver Function
Identify a function that takes the variant union and returns a value from the mapping.
Example:
```ts
function getStyle(v: Variant) {
  return styles[v];
}
```

## Rule 4: Composition at Render Site
Detect multiple resolver outputs composed at the render site.
Example:
```tsx
className={`${getA(x)} ${getB(y)}`}
```

# When to Trigger
Trigger when a component contains:
- at least one string literal union type definition, and
- at least one `Record<Union, T>` mapping using that union, and
- usage of the mapping within a resolver function that affects rendering.

# Output
Return:
- **Composable variant mapping detected**

Optional metadata:
- Variant axes found (e.g., `["type", "size", "dataType"]`)
- Mapping categories (e.g., class names, inline style keys)
