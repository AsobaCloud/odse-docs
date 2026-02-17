---
title: "Asset Metadata Schema"
layout: default
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

## Related Docs

- [Energy Timeseries](/docs/schemas/energy-timeseries)
- [Building Integration Overview](/docs/building-integration/overview)
- [Back to Schema Overview](/docs/schemas/overview)
