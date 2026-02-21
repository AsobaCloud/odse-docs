---
title: "Grid Capacity"
layout: default
parent: "Reference"
nav_order: 4
---

# Grid Capacity / Connection Status

Grid access is the binding constraint on new generation in South Africa. ODS-E provides asset-metadata fields to track the grid connection lifecycle, allocated capacity, and GCAR milestones.

## Context

The SAETA "Policy to Power" report describes the GCAR framework introducing 3 milestones (pre-feasibility, capacity reservation, capacity allocation) to structure the queue and prevent speculative lock-up. The NTCSA must add 14,500km of new lines and 210 transformers by 2034. Non-discriminatory grid access is foundational to the SAWEM (Actions 5, 8).

## Asset Metadata Fields (under `location`)

| Field | Type | Description |
|-------|------|-------------|
| `connection_status` | enum: `applied`, `pre_feasibility`, `reserved`, `allocated`, `connected`, `decommissioned` | Current status in the grid connection lifecycle |
| `allocated_capacity_kw` | number >= 0 | Grid capacity allocated to this asset |
| `connection_agreement_ref` | string | Connection or use-of-system agreement reference |
| `grid_access_queue_date` | string (date) | Date the asset entered the capacity allocation queue |
| `gcar_milestone` | enum: `pre_feasibility`, `capacity_reservation`, `capacity_allocation` | Current GCAR milestone achieved |

## Usage Notes

- `connection_status` tracks the full lifecycle:
  - `applied` -- application submitted, not yet assessed
  - `pre_feasibility` -- pre-feasibility study completed (GCAR milestone 1)
  - `reserved` -- capacity reserved pending construction readiness (GCAR milestone 2)
  - `allocated` -- capacity formally allocated (GCAR milestone 3)
  - `connected` -- physically connected and energized
  - `decommissioned` -- disconnected from the grid
- `gcar_milestone` specifically tracks the NERSA GCAR framework. It may overlap with `connection_status` but provides the regulatory-specific reference.
- `allocated_capacity_kw` may differ from `capacity_kw` (nameplate) if the grid allocation is constrained below nameplate rating.
- `grid_access_queue_date` establishes priority under the "first ready, first served" principle.

## Example

```json
{
  "asset_id": "NCAPE-SOLAR-GEN-12",
  "location": {
    "latitude": -31.42,
    "longitude": 19.08,
    "timezone": "Africa/Johannesburg",
    "country_code": "ZA",
    "municipality_id": "za.nc.hantam",
    "voltage_level": "MV",
    "connection_point_id": "ESKOM-TX-KLEINZEE-33KV-F04",
    "connection_status": "allocated",
    "allocated_capacity_kw": 75000,
    "connection_agreement_ref": "COSA-NTCSA-2025-NCape-0172",
    "grid_access_queue_date": "2024-06-15",
    "gcar_milestone": "capacity_allocation"
  },
  "capacity_kw": 80000,
  "oem": "LONGi",
  "asset_type": "solar_pv",
  "commissioning_date": "2026-09-01"
}
```

## Related Docs

- [Asset Metadata Schema](/docs/schemas/asset-metadata)
- [Schema Reference Overview](/docs/schemas/overview)
- [Trading Integration Overview](/docs/trading-integration/overview)
