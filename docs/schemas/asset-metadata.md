---
title: "Asset Metadata"
layout: default
parent: "Reference"
nav_order: 3
---

# Asset Metadata Schema

The asset-metadata schema adds context required for segmentation, benchmarking, compliance analytics, and site-level diagnostics.

## Scope

Asset metadata is typically lower frequency than timeseries data. It describes what the asset is, where it is, and how it should be interpreted.

## Common Metadata Domains

| Domain | Example Fields | Why It Matters |
|---|---|---|
| Identity | `asset_id`, `site_id`, `source_system` | Joinability and lineage |
| Asset taxonomy | `asset_type`, `capacity_kw` | Semantic checks and aggregation |
| Location | `country`, `state`, `county`, `lat`, `lon` | Regional policy and climate context |
| Building context | `building_type`, `floor_area_sqm`, `vintage`, `climate_zone` | ComStock/ResStock alignment |
| Ownership/operations | `owner`, `operator`, `commissioned_date` | Reporting and accountability |

## Building Object (Integration-Oriented)

For benchmark workflows, populate building fields consistently:

- `building_type`
- `climate_zone`
- `vintage`
- `floor_area_sqm`
- `state`
- `county`

These fields are used in the [ComStock/ResStock Guide](/docs/building-integration/comstock-resstock).

## Example Asset Metadata Record

```json
{
  "asset_id": "asset-001",
  "asset_type": "solar_pv",
  "capacity_kw": 500,
  "site_id": "site-a",
  "building": {
    "building_type": "small_office",
    "climate_zone": "3C",
    "vintage": "2004_to_2007",
    "floor_area_sqm": 3200,
    "state": "CA",
    "county": "Alameda"
  }
}
```

## Location Extensions

The `location` object supports additional context for municipal topology and grid connection:

### Municipal / Grid Topology

| Field | Type | Notes |
|---|---|---|
| `country_code` | string | ISO 3166-1 alpha-2 (e.g., `ZA`) |
| `municipality_id` | string | Canonical ID (`za.province.municipality`) |
| `municipality_name` | string | Human-readable name |
| `distribution_zone` | string | Distribution or tariff zone |
| `feeder_id` | string | Distribution feeder identifier |
| `voltage_level` | enum | `LV`, `MV`, `HV`, `EHV` |
| `meter_id` | string | Utility or municipal meter identifier |
| `connection_point_id` | string | Canonical connection point identifier |
| `licensed_service_area` | string | Licensed service area code |

### Grid Capacity / Connection Status

| Field | Type | Notes |
|---|---|---|
| `connection_status` | enum | `applied`, `pre_feasibility`, `reserved`, `allocated`, `connected`, `decommissioned` |
| `allocated_capacity_kw` | number >= 0 | Grid capacity allocated (may differ from nameplate) |
| `connection_agreement_ref` | string | Connection or use-of-system agreement reference |
| `grid_access_queue_date` | string (date) | Date entered the capacity allocation queue |
| `gcar_milestone` | enum | `pre_feasibility`, `capacity_reservation`, `capacity_allocation` |

See [Grid Capacity / Connection Status](/docs/schemas/grid-capacity) for GCAR context and usage details.

### Example with Location Extensions

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
  "asset_type": "solar_pv"
}
```

## Related Docs

- [Energy Timeseries](/docs/schemas/energy-timeseries)
- [Grid Capacity / Connection Status](/docs/schemas/grid-capacity)
- [Building Integration Overview](/docs/building-integration/overview)
- [Back to Schema Overview](/docs/schemas/overview)
