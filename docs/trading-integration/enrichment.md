---
title: "Post-Transform Enrichment"
layout: default
---

# Post-Transform Enrichment

ODS-E transformers emit bare telemetry records (`timestamp`, `kWh`, `error_type`). Market-ready fields -- party IDs, tariff context, topology -- require a separate enrichment step. The `enrich()` function provides this as a composable post-transform operation.

## Context

The typical ODS-E pipeline is:

1. **Transform** -- convert OEM data to ODS-E records
2. **Enrich** -- inject settlement, tariff, and topology context
3. **Validate** -- check schema, profile, and semantic constraints

Enrichment bridges the gap between "transformer produces bare telemetry" and "validator expects market context fields for conformance profile checks."

## The `enrich()` Function

```python
from odse import enrich

enriched = enrich(rows, context, override=False)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `rows` | `list[dict]` | ODS-E records from `transform()` |
| `context` | `dict` or `None` | Metadata key-value pairs to inject into each row |
| `override` | `bool` (keyword-only) | `False` (default): source data wins. `True`: context wins. |

**Returns:** The same list of rows, enriched in place.

## Conflict Resolution

| Mode | Behaviour | Use Case |
|------|-----------|----------|
| `override=False` (default) | If a field already exists in the row, the context value is skipped | Preserving transformer-set fields like `error_type` or `asset_id` |
| `override=True` | Context values overwrite existing row fields | Correcting or standardizing fields across a batch |

## Recognized Field Groups

The enricher accepts any key, but these are the documented market-context fields:

**Settlement:**
`seller_party_id`, `buyer_party_id`, `network_operator_id`, `wheeling_agent_id`, `settlement_period_start`, `settlement_period_end`, `loss_factor`, `contract_reference`, `settlement_type`

**Tariff:**
`tariff_schedule_id`, `tariff_period`, `tariff_currency`, `tariff_version_effective_at`, `energy_charge_component`, `network_charge_component`

**Topology:**
`country_code`, `municipality_id`, `municipality_name`, `distribution_zone`, `feeder_id`, `voltage_level`, `meter_id`, `connection_point_id`, `licensed_service_area`

## Example: Transform + Enrich + Validate Pipeline

```python
from odse import transform, enrich, validate

# 1. Transform OEM data
rows = transform("huawei_export.csv", source="huawei")

# 2. Enrich with bilateral settlement context
context = {
    "seller_party_id": "nersa:gen:SOLARPK-001",
    "buyer_party_id": "nersa:offtaker:MUN042",
    "settlement_period_start": "2026-02-18T14:00:00+02:00",
    "settlement_period_end": "2026-02-18T14:30:00+02:00",
    "contract_reference": "PPA-SOLARPK-MUN042-2025-003",
    "settlement_type": "bilateral",
}
enriched = enrich(rows, context)

# 3. Validate against the bilateral conformance profile
for record in enriched:
    result = validate(record, profile="bilateral")
    print(record["timestamp"], result.is_valid)
```

## Edge Cases

- **Empty or `None` context:** Returns rows unchanged (no-op).
- **Empty rows:** Returns an empty list.
- **Unknown keys:** Passed through without filtering. Validation is the validator's job, not the enricher's.

## Related Docs

- [Trading Integration Overview](/docs/trading-integration/overview)
- [Conformance Profile Validation](/docs/validation/conformance-profiles)
- [Get Started](/docs/get-started)
- [Schema Validation](/docs/validation/schema-validation)
