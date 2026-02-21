---
title: "Tariff Unbundling"
layout: default
parent: "Trading Integration"
nav_order: 3
---

# Tariff Component Granularity

NERSA has separated Eskom's generation, transmission, and distribution charges for the first time under MYPD6. ODS-E provides granular unbundled tariff component fields to carry this structure at the interval level.

## Context

The SAETA "Policy to Power" report describes the need for cost-reflective, unbundled tariffs that distinguish fixed from variable costs and make non-bypassable charges transparent (Action 2). The Electricity Pricing Policy revision aims to align regulated pricing with a competitive market. Tariffs rose 937% between 2007 and 2024.

## Timeseries Fields

| Field | Type | Description |
|-------|------|-------------|
| `generation_charge_component` | number >= 0 | Unbundled generation charge for this interval |
| `transmission_charge_component` | number >= 0 | Transmission use-of-system charge |
| `distribution_charge_component` | number >= 0 | Distribution network charge |
| `ancillary_service_charge_component` | number >= 0 | Ancillary services levy (frequency control, reserves) |
| `non_bypassable_charge_component` | number >= 0 | Non-bypassable charges (cross-subsidies, FBE contributions) |
| `environmental_levy_component` | number >= 0 | Environmental or carbon levy |

## Relationship to Existing Fields

The existing `energy_charge_component` and `network_charge_component` from the market context extensions represent a two-part split. These new fields provide a finer decomposition:

- `energy_charge_component` ≈ `generation_charge_component` + `ancillary_service_charge_component`
- `network_charge_component` ≈ `transmission_charge_component` + `distribution_charge_component`
- `non_bypassable_charge_component` and `environmental_levy_component` are additional line items

Implementers may use either the two-part split or the granular decomposition. If both are present, the granular fields take precedence.

## Example

```json
{
  "timestamp": "2026-02-17T08:00:00+02:00",
  "kWh": 250.0,
  "error_type": "normal",
  "direction": "consumption",
  "tariff_schedule_id": "za-eskom:national:TOU-2026:v3",
  "tariff_period": "peak",
  "tariff_currency": "ZAR",
  "generation_charge_component": 425.00,
  "transmission_charge_component": 87.50,
  "distribution_charge_component": 112.75,
  "ancillary_service_charge_component": 18.25,
  "non_bypassable_charge_component": 32.50,
  "environmental_levy_component": 9.75
}
```

## Related Docs

- [Trading Integration Overview](/docs/trading-integration/overview)
- [Cape Town Market Use Case](/docs/trading-integration/cape-town-market-use-case)
- [Energy Timeseries Schema](/docs/schemas/energy-timeseries)
