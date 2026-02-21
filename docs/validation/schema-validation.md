---
title: "Schema Validation"
layout: default
parent: "Reference"
nav_order: 7
---

# Schema Validation

Schema validation enforces structural correctness for ODS-E records before they are used in analytics or reporting.

## What Schema Validation Checks

- Required fields are present (`timestamp`, `kWh`, `error_type`)
- Field types are valid (number/string/enum)
- Enum values are allowed (for `error_type`, `direction`, etc.)
- Basic bounds/format constraints are respected

## Example

```python
from odse import validate

result = validate({
    "timestamp": "2026-02-09T14:00:00Z",
    "kWh": 847.5,
    "error_type": "normal"
})

print(result.is_valid)
print(result.errors)
```

## Typical Failure Categories

| Category | Example |
|---|---|
| Missing required field | `error_type` absent |
| Type mismatch | `kWh` provided as non-numeric string |
| Enum violation | `error_type: "degraded"` (unsupported) |
| Format error | non-ISO timestamp |

## Recommended Pipeline Position

Run schema validation immediately after transform and before persistence, aggregation, or model ingestion.

## Related Docs

- [Semantic Validation](/docs/validation/semantic-validation)
- [Validation Overview](/docs/validation/overview)
- [Back to Validation Overview](/docs/validation/overview)
