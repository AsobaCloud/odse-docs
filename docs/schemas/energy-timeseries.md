---
title: "Energy Timeseries Schema"
layout: default
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
| `kVAh` | number | Apparent energy, if available |
| `PF` | number | Power factor |
| `error_code_original` | string/number | OEM-native code for diagnostics |

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
