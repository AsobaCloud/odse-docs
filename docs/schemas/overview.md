---
title: "Schema Overview"
layout: default
parent: "Reference"
nav_order: 1
---

# Schema Reference Overview

ODS-E defines a minimal, interoperable contract for energy asset data exchange.

The schema is split into three complementary surfaces:

- `energy-timeseries`: operational records for generation, consumption, and net flows
- `asset-metadata`: context for assets, sites, and building characteristics
- `erp-enrichment`: maintenance history, spare parts inventory, procurement context, failure taxonomy, and alarm frequency analytics sourced from ERP/EAM and SCADA systems

## Design Principles

- Keep required fields small and stable
- Normalize the highest-friction OEM differences (timestamps, energy semantics, error states)
- Preserve optional room for richer domain context without breaking interoperability

## How to Read the Spec

1. Start with [Energy Timeseries](/docs/schemas/energy-timeseries) for record-level requirements.
2. Add [Asset Metadata](/docs/schemas/asset-metadata) for benchmarking, segmentation, and integration use cases.
3. See [Grid Capacity / Connection Status](/docs/schemas/grid-capacity) for GCAR and grid access lifecycle fields.
4. Use [Inverter API Access](/docs/schemas/inverter-api-access) to operationalize OEM onboarding and transform verification.
5. Add [ERP Enrichment Schemas](/docs/schemas/erp-enrichment) for maintenance, inventory, procurement, and alarm frequency analytics.
6. Run [Schema Validation](/docs/validation/schema-validation) before using records in analytics.

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
- [ERP Enrichment Schemas](/docs/schemas/erp-enrichment)
