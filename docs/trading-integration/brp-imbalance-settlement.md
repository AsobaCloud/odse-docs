---
title: "BRP / Imbalance Settlement"
layout: default
---

# BRP / Imbalance Settlement

The South African Wholesale Electricity Market (SAWEM) introduces Balance Responsible Parties (BRPs) who must forecast supply and demand and settle imbalances. ODS-E provides fields to carry BRP context, forecasts, and imbalance calculations at the interval level.

## Context

The SAETA "Policy to Power" report describes the SAWEM structure: all generators >= 10MW are automatically BRPs. The Market Operator manages the Day-Ahead Market, Intra-Day Market, and Balancing Market. Market participants submit hourly bids (MW and price) and are settled against actual delivery. Imbalance costs incentivize forecast accuracy (Action 9).

## Timeseries Fields

| Field | Type | Description |
|-------|------|-------------|
| `balance_responsible_party_id` | string (party ID pattern) | The BRP assigned for this connection point and interval |
| `forecast_kWh` | number | Nominated/scheduled volume for this interval |
| `settlement_type` | enum: `bilateral`, `sawem_day_ahead`, `sawem_intra_day`, `balancing`, `ancillary` | Market segment for settlement |
| `imbalance_kWh` | number | Difference between forecast and actual (positive = over-delivery, negative = under-delivery) |

## Usage Notes

- `balance_responsible_party_id` follows the canonical party ID pattern (`authority:type:id`). Example: `za-nersa:brp:ETANA-BRP-01`.
- `forecast_kWh` represents the nominated or scheduled volume the BRP committed to for this interval, as submitted to the Market Operator.
- `imbalance_kWh` = `kWh` - `forecast_kWh`. It can be positive (over-delivery/under-consumption) or negative (under-delivery/over-consumption).
- `settlement_type` identifies which market segment governs settlement:
  - `bilateral` -- settled under bilateral contract outside the SAWEM
  - `sawem_day_ahead` -- settled via the Day-Ahead Market
  - `sawem_intra_day` -- settled via the Intra-Day Market
  - `balancing` -- settled via the Balancing Market (residual imbalances)
  - `ancillary` -- ancillary services (reserves, frequency control)

## Example

```json
{
  "timestamp": "2026-02-17T15:00:00+02:00",
  "kWh": 312.5,
  "error_type": "normal",
  "direction": "generation",
  "balance_responsible_party_id": "za-nersa:brp:ETANA-BRP-01",
  "forecast_kWh": 320.0,
  "settlement_type": "sawem_day_ahead",
  "imbalance_kWh": -7.5,
  "settlement_period_start": "2026-02-17T15:00:00+02:00",
  "settlement_period_end": "2026-02-17T15:30:00+02:00"
}
```

## Related Docs

- [Trading Integration Overview](/docs/trading-integration/overview)
- [Energy Timeseries Schema](/docs/schemas/energy-timeseries)
