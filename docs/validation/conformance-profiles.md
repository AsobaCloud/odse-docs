---
title: "Conformance Profile Validation"
layout: default
---

# Conformance Profile Validation

Conformance profiles enforce required-field sets for specific SA trading contexts. They are a validator-level concept layered on top of the schema -- the schema itself is unchanged.

## What Conformance Profiles Do

The `energy-timeseries` schema has ~50 properties but only 3 are required (`timestamp`, `kWh`, `error_type`). All trading fields are optional. Profiles close this gap by making minimum field sets machine-checkable per operating context.

## Available Profiles

| Profile | Use Case | Required Fields |
|---------|----------|-----------------|
| `bilateral` | PPA / bilateral trades | seller, buyer, settlement window, contract ref, settlement type |
| `wheeling` | Wheeled energy across networks | all bilateral fields + network operator, wheeling type/status, injection/offtake points, loss factor |
| `sawem_brp` | Wholesale market (SAWEM) settlement | seller, BRP, settlement type (SAWEM values only), forecast, settlement window |
| `municipal_recon` | Municipal billing / reconciliation | buyer, billing period, billed kWh, billing status |

## Example

Pass the `profile` parameter to `validate()`:

```python
from odse import validate

record = {
    "timestamp": "2026-02-18T14:00:00+02:00",
    "kWh": 87.3,
    "error_type": "normal",
    "seller_party_id": "nersa:gen:SOLARPK-001",
    "buyer_party_id": "nersa:offtaker:MUN042",
    "settlement_period_start": "2026-02-18T14:00:00+02:00",
    "settlement_period_end": "2026-02-18T14:30:00+02:00",
    "contract_reference": "PPA-SOLARPK-MUN042-2025-003",
    "settlement_type": "bilateral",
}

result = validate(record, profile="bilateral")
print(result.is_valid)  # True
```

If a required field is missing:

```python
del record["contract_reference"]
result = validate(record, profile="bilateral")
print(result.is_valid)   # False
print(result.errors[0].code)  # PROFILE_FIELD_MISSING
```

## Error Codes

| Code | Meaning |
|------|---------|
| `UNKNOWN_PROFILE` | The profile name is not one of the 4 defined profiles |
| `PROFILE_FIELD_MISSING` | A field required by the profile is not present in the record |
| `PROFILE_VALUE_MISMATCH` | A field is present but its value violates the profile's value constraint |

## Value Constraints

Some profiles constrain specific field values:

- **`bilateral`** and **`wheeling`**: `settlement_type` must be `"bilateral"`
- **`sawem_brp`**: `settlement_type` must be one of `"sawem_day_ahead"`, `"sawem_intra_day"`, `"balancing"`, `"ancillary"`

## Validation Gating

Profile validation runs **after** schema validation passes. If schema validation produces errors (e.g. missing `timestamp`), profile validation is skipped entirely. When no profile is specified, validation behaves exactly as before.

## Introspection

The `PROFILES` dict is exported for programmatic access:

```python
from odse import PROFILES

print(list(PROFILES.keys()))
# ['bilateral', 'wheeling', 'sawem_brp', 'municipal_recon']

print(PROFILES["bilateral"]["required_fields"])
# ['seller_party_id', 'buyer_party_id', 'settlement_period_start', ...]
```

## Related Docs

- [Validation Overview](/docs/validation/overview)
- [Schema Validation](/docs/validation/schema-validation)
- [Semantic Validation](/docs/validation/semantic-validation)
- [Trading Integration Overview](/docs/trading-integration/overview)
