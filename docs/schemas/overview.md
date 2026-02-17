---
title: "Schema Reference Overview"
layout: default
---

# Schema Reference Overview

ODS-E defines a minimal, interoperable contract for energy asset data exchange.

The schema is split into two complementary surfaces:

- `energy-timeseries`: operational records for generation, consumption, and net flows
- `asset-metadata`: context for assets, sites, and building characteristics

## Design Principles

- Keep required fields small and stable
- Normalize the highest-friction OEM differences (timestamps, energy semantics, error states)
- Preserve optional room for richer domain context without breaking interoperability

## How to Read the Spec

1. Start with [Energy Timeseries](/docs/schemas/energy-timeseries) for record-level requirements.
2. Add [Asset Metadata](/docs/schemas/asset-metadata) for benchmarking, segmentation, and integration use cases.
3. Use [Inverter API Access](/docs/schemas/inverter-api-access) to operationalize OEM onboarding and transform verification.
4. Run [Schema Validation](/docs/validation/schema-validation) before using records in analytics.

## Core Record Example

```json
{
  "timestamp": "2026-02-05T14:00:00Z",
  "kWh": 847.5,
  "error_type": "normal"
}
```

## Related Docs

- [Get Started](/docs/get-started)
- [Validation Overview](/docs/validation/overview)
- [Transforms Overview](/docs/transforms/overview)
- [Inverter API Access](/docs/schemas/inverter-api-access)
