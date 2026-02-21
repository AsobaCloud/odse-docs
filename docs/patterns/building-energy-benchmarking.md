---
title: "Building Energy Benchmarking"
layout: default
parent: "Patterns"
nav_order: 3
---

# Building Energy Benchmarking

Join ODS-E energy data to NREL ComStock/ResStock benchmarks for EUI analysis.

## When to Use

You have building-level consumption data and want to compare energy use intensity (EUI) against national benchmarks by building type, climate zone, and vintage.

## Pipeline

```
ODS-E timeseries ──► aggregate by asset ──► join asset metadata ──► join ComStock cohort ──► EUI ratio
```

## Complete Code (SQL)

Assumes three tables: `odse_timeseries`, `odse_assets`, and `comstock`.

```sql
-- Step 1: Aggregate actual consumption from ODS-E timeseries
WITH actual AS (
    SELECT
        t.asset_id,
        SUM(t.kwh)                           AS annual_kwh,
        a.building_type,
        a.climate_zone,
        a.vintage,
        a.floor_area_sqm,
        a.state
    FROM odse_timeseries  t
    JOIN odse_assets       a ON a.asset_id = t.asset_id
    WHERE t.direction    = 'consumption'
      AND t.fuel_type    = 'electricity'
      AND t.timestamp   >= '2025-01-01'
      AND t.timestamp    < '2026-01-01'
    GROUP BY t.asset_id, a.building_type, a.climate_zone,
             a.vintage, a.floor_area_sqm, a.state
),

-- Step 2: Find the ComStock median EUI for matching building cohort
benchmark AS (
    SELECT
        "in.comstock_building_type"           AS building_type,
        "in.ashrae_iecc_climate_zone_2006"    AS climate_zone,
        "in.vintage"                          AS vintage,
        "in.state_abbreviation"               AS state,
        PERCENTILE_CONT(0.5) WITHIN GROUP (
            ORDER BY "out.site_energy_intensity_kbtu_per_sqft"
        )                                     AS median_eui_kbtu_sqft
    FROM comstock
    GROUP BY 1, 2, 3, 4
)

-- Step 3: Compare actual vs benchmark
SELECT
    ac.asset_id,
    ac.annual_kwh,
    ac.floor_area_sqm,
    (ac.annual_kwh * 3.412)
        / (ac.floor_area_sqm * 10.7639)      AS actual_eui_kbtu_sqft,
    bm.median_eui_kbtu_sqft,
    ROUND(
        ((ac.annual_kwh * 3.412) / (ac.floor_area_sqm * 10.7639))
        / NULLIF(bm.median_eui_kbtu_sqft, 0),
        2
    )                                         AS eui_ratio
FROM actual    ac
JOIN benchmark bm
  ON  ac.building_type = bm.building_type
  AND ac.climate_zone  = bm.climate_zone
  AND ac.vintage       = bm.vintage
  AND ac.state         = bm.state;
```

### Reading the Result

| `eui_ratio` | Interpretation |
|-------------|---------------|
| `< 1.0` | Building uses less energy than its ComStock benchmark (better than median) |
| `> 1.0` | Building uses more energy (candidate for efficiency intervention) |

### ODS-E to ComStock Field Mapping

| ODS-E Field | ComStock Column | Notes |
|---|---|---|
| `building.building_type` | `in.comstock_building_type` | 22-value enum covers both |
| `building.climate_zone` | `in.ashrae_iecc_climate_zone_2006` | ASHRAE/IECC zone string |
| `building.vintage` | `in.vintage` | Building age / code era |
| `building.floor_area_sqm` | `in.floor_area` | ODS-E stores metric; ComStock uses sqft (multiply by 10.7639) |
| `building.state` | `in.state_abbreviation` | Postal code |

## What to Read Next

- [ComStock/ResStock Guide](/docs/building-integration/comstock-resstock) — Full field mapping and data source links
- [Asset Metadata Schema](/docs/schemas/asset-metadata) — Building context fields
- [Schema Reference](/docs/schemas/overview) — All field definitions
