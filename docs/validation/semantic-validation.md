---
title: "Semantic Validation"
layout: default
---

# Semantic Validation

Semantic validation checks whether records are operationally plausible in context, even when they are structurally valid.

## Why Semantic Validation Matters

A record can satisfy JSON schema requirements and still be misleading or impossible in practice.

Examples:

- Energy values exceeding physical output limits for asset capacity
- State/error combinations that conflict with expected operating behavior
- Direction/value combinations that are unlikely for the configured asset

## Typical Inputs

Semantic checks often require context beyond a single record, such as:

- `capacity_kw`
- asset type
- recent operating history
- expected interval size

## Example

```python
from odse import validate

result = validate(
    {
        "timestamp": "2026-02-09T14:00:00Z",
        "kWh": 500.0,
        "error_type": "normal"
    },
    level="semantic",
    capacity_kw=10.0
)

print(result.is_valid)
print(result.warnings)
```

## Output Pattern

- `errors`: hard failures for clearly invalid conditions
- `warnings`: suspicious but potentially explainable conditions

## Practical Use

Use semantic validation as a decision-quality gate for forecasting, compliance outputs, and risk analytics.

## Related Docs

- [Schema Validation](/docs/validation/schema-validation)
- [Validation Overview](/docs/validation/overview)
- [Back to Validation Overview](/docs/validation/overview)
