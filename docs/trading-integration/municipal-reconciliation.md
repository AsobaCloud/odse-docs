---
title: "Municipal Reconciliation"
layout: default
parent: "Trading Integration"
nav_order: 6
---

# Municipal Reconciliation

Municipal distributors manage about 40% of South Africa's grid. ODS-E provides fields to track billing cycles, metered vs. billed quantities, data quality, and Distribution Agency Agreement (DAA) references at the interval level.

## Context

The SAETA "Policy to Power" report notes that municipal arrears to Eskom exceed R105bn. Distribution Agency Agreements are being deployed for 14 high-arrears municipalities, with Eskom acting as agent for billing, collections, and maintenance. Only 10 municipalities have adopted wheeling policies; only 7 have approved tariffs. The report emphasises "performance-based regulation, systematic benchmarking and credible consequence management" as critical to EDI reform (Action 6).

## Timeseries Fields

| Field | Type | Description |
|-------|------|-------------|
| `billing_period` | string | Billing cycle reference (e.g., `2026-02` for monthly, `2026-W07` for weekly) |
| `billed_kWh` | number >= 0 | Billed quantity for this interval (may differ from metered kWh) |
| `billing_status` | enum: `metered`, `estimated`, `adjusted`, `disputed` | Data quality/origin of the billed quantity |
| `daa_reference` | string | Distribution Agency Agreement reference, if under a DAA with Eskom Distribution |

## Usage Notes

- `billing_period` uses ISO 8601 partial date formats. Monthly: `2026-02`. Weekly: `2026-W07`. This is a grouping key, not a date range.
- `billed_kWh` may differ from the metered `kWh` for several reasons: estimated reads, loss adjustments, theft adjustments, or billing corrections.
- `billing_status` values:
  - `metered` -- directly from a validated meter read
  - `estimated` -- no meter read available; estimated from historical profile
  - `adjusted` -- metered but adjusted for losses, corrections, or audits
  - `disputed` -- under dispute between parties
- `daa_reference` is relevant for the 14+ municipalities where Eskom Distribution acts as agent under a DAA.

## Example

```json
{
  "timestamp": "2026-02-17T10:00:00+02:00",
  "kWh": 45.2,
  "error_type": "normal",
  "direction": "consumption",
  "buyer_party_id": "za-city-emfuleni:municipality:EMF",
  "network_operator_id": "za-eskom:distribution:GT-01",
  "billing_period": "2026-02",
  "billed_kWh": 44.8,
  "billing_status": "adjusted",
  "daa_reference": "DAA-ESKOM-EMFULENI-2025-001"
}
```

## Related Docs

- [Trading Integration Overview](/docs/trading-integration/overview)
- [Energy Timeseries Schema](/docs/schemas/energy-timeseries)
