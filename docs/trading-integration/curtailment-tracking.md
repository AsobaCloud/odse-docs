---
title: "Curtailment Tracking"
layout: default
parent: "Trading Integration"
nav_order: 4
---

# Curtailment Event Tracking

Curtailment is a material risk for IPPs and traders. ODS-E provides fields to track curtailment events, their causes, and estimated lost generation at the interval level.

## Context

The SAETA "Policy to Power" report notes that the GCAR congestion curtailment mechanism (capped at 4%) is active in the Western and Eastern Cape. Over 100 curtailment events were recorded this financial year, up from fewer than 30 the prior year. IPPs are compensated through existing ancillary-services frameworks, with recoverable costs capped under MYPD6 (Actions 5, 8).

## Timeseries Fields

| Field | Type | Description |
|-------|------|-------------|
| `curtailment_flag` | boolean | Whether generation was curtailed during this interval |
| `curtailment_type` | enum: `congestion`, `frequency`, `voltage`, `instruction`, `other` | Reason for curtailment |
| `curtailed_kWh` | number >= 0 | Estimated generation lost to curtailment during this interval |
| `curtailment_instruction_id` | string | Reference to the system operator dispatch instruction |

## Usage Notes

- `curtailed_kWh` represents estimated lost production, not metered output. It is typically derived from forecasted or rated output minus actual metered generation.
- `curtailment_type` values:
  - `congestion` -- network capacity constraint (the GCAR mechanism)
  - `frequency` -- system frequency management
  - `voltage` -- local voltage regulation
  - `instruction` -- direct system operator dispatch instruction
  - `other` -- any other cause
- When `curtailment_flag` is `true`, the `kWh` field reflects actual metered output (reduced), while `curtailed_kWh` reflects the estimated shortfall.

## Example

```json
{
  "timestamp": "2026-02-17T12:30:00+02:00",
  "kWh": 62.1,
  "error_type": "normal",
  "direction": "generation",
  "curtailment_flag": true,
  "curtailment_type": "congestion",
  "curtailed_kWh": 41.4,
  "curtailment_instruction_id": "NTCSA-GCAR-2026-02-17-0034"
}
```

## Related Docs

- [Trading Integration Overview](/docs/trading-integration/overview)
- [Energy Timeseries Schema](/docs/schemas/energy-timeseries)
