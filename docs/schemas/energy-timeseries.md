---
title: "Energy Timeseries"
layout: default
parent: "Reference"
nav_order: 2
---

# Energy Timeseries Schema

The energy-timeseries schema represents interval energy records in a standardized form that can be compared across OEMs.

## Required Fields

| Field | Type | Constraint | Purpose |
|---|---|---|---|
| `timestamp` | string (ISO 8601) | UTC or timezone-explicit | Unambiguous event time |
| `kWh` | number | See `direction` rules | Interval energy value |
| `error_type` | enum | `normal`, `warning`, `critical`, `fault`, `offline`, `standby`, `unknown` | Normalized operational state |

## Optional Fields

| Field | Type | Notes |
|---|---|---|
| `direction` | enum | `generation` (default), `consumption`, `net` |
| `fuel_type` | enum | Example: `electricity` |
| `end_use` | enum | Building end-use tag (for analytics/benchmarking) |
| `kVArh` | number | Reactive energy, if available |
| `kVA` | number | Apparent power, if available |
| `PF` | number | Power factor |
| `error_code` | string | OEM-native error code for diagnostics |

## Settlement Context Fields

| Field | Type | Notes |
|---|---|---|
| `seller_party_id` | string | Canonical seller ID (`authority:type:id`) |
| `buyer_party_id` | string | Canonical buyer ID (`authority:type:id`) |
| `network_operator_id` | string | Canonical network operator ID (`authority:type:id`) |
| `wheeling_agent_id` | string | Canonical wheeling/intermediary ID (`authority:type:id`) |
| `settlement_period_start` | string (date-time) | Settlement period start |
| `settlement_period_end` | string (date-time) | Settlement period end |
| `loss_factor` | number >= 0 | Applied loss factor (e.g., 0.03 for 3%) |
| `contract_reference` | string | Contract or schedule reference (PPA, bilateral deal) |

## Tariff Fields

| Field | Type | Notes |
|---|---|---|
| `tariff_schedule_id` | string | Canonical tariff ID (`authority:municipality:code:vN`) |
| `tariff_period` | enum | `peak`, `standard`, `off_peak`, `critical_peak` |
| `tariff_currency` | string | ISO 4217 currency code (e.g., `ZAR`) |
| `tariff_version_effective_at` | string (date-time) | When the tariff version became effective |
| `energy_charge_component` | number >= 0 | Energy charge amount (two-part split) |
| `network_charge_component` | number >= 0 | Network charge amount (two-part split) |
| `generation_charge_component` | number >= 0 | Unbundled generation charge |
| `transmission_charge_component` | number >= 0 | Transmission use-of-system charge |
| `distribution_charge_component` | number >= 0 | Distribution network charge |
| `ancillary_service_charge_component` | number >= 0 | Ancillary services levy |
| `non_bypassable_charge_component` | number >= 0 | Non-bypassable charges (cross-subsidies, FBE) |
| `environmental_levy_component` | number >= 0 | Environmental or carbon levy |

See [Tariff Component Granularity](/docs/trading-integration/tariff-unbundling) for the relationship between two-part and unbundled fields.

## Wheeling Fields

| Field | Type | Notes |
|---|---|---|
| `wheeling_type` | enum | `traditional`, `virtual`, `portfolio` |
| `injection_point_id` | string | Grid injection point for the wheeling path |
| `offtake_point_id` | string | Grid offtake point for the wheeling path |
| `wheeling_status` | enum | `provisional`, `confirmed`, `reconciled`, `disputed` |
| `wheeling_path_id` | string | Reference to a registered wheeling path |

See [Wheeling Transaction Envelope](/docs/trading-integration/wheeling-extensions) for usage details.

## Curtailment Fields

| Field | Type | Notes |
|---|---|---|
| `curtailment_flag` | boolean | Whether generation was curtailed |
| `curtailment_type` | enum | `congestion`, `frequency`, `voltage`, `instruction`, `other` |
| `curtailed_kWh` | number >= 0 | Estimated generation lost to curtailment |
| `curtailment_instruction_id` | string | System operator dispatch instruction reference |

See [Curtailment Event Tracking](/docs/trading-integration/curtailment-tracking) for usage details.

## BRP / Imbalance Fields

| Field | Type | Notes |
|---|---|---|
| `balance_responsible_party_id` | string | BRP ID (`authority:type:id`) |
| `forecast_kWh` | number | Nominated/scheduled volume |
| `settlement_type` | enum | `bilateral`, `sawem_day_ahead`, `sawem_intra_day`, `balancing`, `ancillary` |
| `imbalance_kWh` | number | Forecast minus actual (may be negative) |

See [BRP / Imbalance Settlement](/docs/trading-integration/brp-imbalance-settlement) for usage details.

## Municipal Reconciliation Fields

| Field | Type | Notes |
|---|---|---|
| `billing_period` | string | Billing cycle reference (e.g., `2026-02`) |
| `billed_kWh` | number >= 0 | Billed quantity (may differ from metered kWh) |
| `billing_status` | enum | `metered`, `estimated`, `adjusted`, `disputed` |
| `daa_reference` | string | Distribution Agency Agreement reference |

See [Municipal Reconciliation](/docs/trading-integration/municipal-reconciliation) for usage details.

## Green Attribute Fields

| Field | Type | Notes |
|---|---|---|
| `renewable_attribute_id` | string | Certificate or credit ID (e.g., I-REC number) |
| `certificate_standard` | enum | `i_rec`, `rego`, `go`, `rec`, `tigr`, `other` |
| `verification_status` | enum | `pending`, `issued`, `retired`, `cancelled` |
| `carbon_intensity_gCO2_per_kWh` | number >= 0 | Carbon intensity in gCO2e/kWh |

See [Green Attribute / Certificate Tracking](/docs/trading-integration/green-attributes) for usage details.

## Direction Semantics

- `generation`: `kWh >= 0`
- `consumption`: `kWh >= 0`
- `net`: `kWh` may be negative

## Example Records

### Generation

```json
{
  "timestamp": "2026-02-05T14:00:00Z",
  "kWh": 8.4,
  "error_type": "normal",
  "direction": "generation"
}
```

### Consumption

```json
{
  "timestamp": "2026-02-05T14:00:00Z",
  "kWh": 12.1,
  "error_type": "normal",
  "direction": "consumption",
  "end_use": "cooling",
  "fuel_type": "electricity"
}
```

### Net Metering

```json
{
  "timestamp": "2026-02-05T14:00:00Z",
  "kWh": -1.7,
  "error_type": "normal",
  "direction": "net"
}
```

## Validation Notes

Use schema validation to catch structural/type violations, then semantic validation for physical plausibility checks.

- [Schema Validation](/docs/validation/schema-validation)
- [Semantic Validation](/docs/validation/semantic-validation)
- [Back to Schema Overview](/docs/schemas/overview)
