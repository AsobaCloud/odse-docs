---
title: "ComStock & ResStock Guide"
layout: default
parent: "Building Integration"
nav_order: 1
---

# ComStock & ResStock: What They Are and Why They Matter

ComStock and ResStock are two free, public datasets maintained by the National Lab of the Rockies (formerly NREL) and funded by the U.S. Department of Energy. They model the entire U.S. building stock at high granularity — every commercial building type, every residential dwelling type, every county — using real building characteristics, weather data, and physics-based energy simulation engines (EnergyPlus/OpenStudio).

These are not survey datasets or self-reported numbers. They are bottom-up simulations of what buildings actually consume and emit, based on physical properties.

## ComStock vs ResStock

| | ComStock | ResStock |
|---|---|---|
| **Scope** | U.S. commercial building stock | U.S. residential housing stock |
| **Scale** | ~350,000 building models | ~550,000–2.2M dwelling unit models |
| **Resolution** | 15-minute intervals, county/PUMA level | 15-minute intervals, county/PUMA level |
| **Building types** | Office, retail, warehouse, school, hospital, restaurant, hotel, etc. | Single-family, multifamily, mobile home |
| **Key data** | Energy by end use, building type, vintage, HVAC, climate zone | Energy, carbon emissions, energy bills, energy burden by dwelling type |
| **Upgrade modeling** | 65+ efficiency measures (heat pumps, insulation, LED, PV) | 28+ upgrade packages (heat pumps, envelope, electrification, demand flexibility) |
| **Weather** | AMY 2018 + TMY3 | AMY 2018 + TMY3 |
| **Cost** | Free (U.S. DOE public dataset) | Free (U.S. DOE public dataset) |
| **Source** | [github.com/NREL/ComStock](https://github.com/NREL/ComStock) | [github.com/NREL/ResStock](https://github.com/NREL/ResStock) |

## What's Inside the Data

Each dataset contains one row per simulated building. Every row has hundreds of columns organized by prefix:

**`in.*` columns** — building characteristics (inputs to the simulation):
- `in.state`, `in.county` — geographic location
- `in.comstock_building_type` or `in.geometry_building_type_recs` — building type
- `in.vintage` — construction era (e.g., `1960s`, `2004_to_2007`)
- `in.ashrae_iecc_climate_zone_2006` — climate zone
- `in.sqft` or `in.geometry_floor_area` — floor area
- `in.hvac_system_type`, `in.heating_fuel` — mechanical systems

**`out.*` columns** — simulation results (energy, emissions, costs):
- `out.site_energy.total.energy_consumption.kwh` — total annual energy
- `out.electricity.total.energy_consumption.kwh` — electricity only
- `out.natural_gas.total.energy_consumption.kwh` — natural gas only
- `out.emissions.co2e.lrmer_mid_case_15.all_fuels.total.lb` — CO₂ equivalent emissions (pounds)
- `out.site_energy.hvac.energy_consumption.kwh` — HVAC energy only
- `out.site_energy.lighting.energy_consumption.kwh` — lighting only

**`weight` column** — each simulated building represents multiple real buildings. Always multiply by weight when aggregating to get real-world totals.

## How This Connects to ODS-E

ODS-E's asset-metadata schema includes building fields specifically designed for ComStock/ResStock compatibility:

| ODS-E Field | ComStock Column | ResStock Column |
|---|---|---|
| `building.building_type` | `in.comstock_building_type` | `in.geometry_building_type_recs` |
| `building.climate_zone` | `in.ashrae_iecc_climate_zone_2006` | `in.ashrae_iecc_climate_zone_2006` |
| `building.vintage` | `in.vintage` | `in.vintage` |
| `building.floor_area_sqm` | `in.floor_area` (convert sqft) | `in.geometry_floor_area` (convert sqft) |
| `building.state` | `in.state_abbreviation` | `in.state` |
| `building.county` | `in.county_name` | `in.county` |

This means ODS-E records can be joined directly to ComStock/ResStock cohorts for benchmarking, compliance, and gap analysis.

## What You Can Do With This

These datasets enable four capabilities that aggregate federal data cannot:

1. **[Attribute citywide emissions to building sectors](/docs/patterns/municipal-emissions-attribution)** — break down a county's total CO₂ by building type, vintage, and end use
2. **[Model intervention impacts before implementation](/docs/patterns/upgrade-scenario-modeling)** — show what happens to emissions if you retrofit buildings with heat pumps, insulation, or LED lighting
3. **[Benchmark across cities](/docs/patterns/cross-city-benchmarking)** — apples-to-apples comparisons (Atlanta vs Houston vs Charlotte) with consistent methodology
4. **[Benchmark individual buildings by EUI](/docs/patterns/building-energy-benchmarking)** — compare a specific building's energy use intensity against its national cohort

## Next Steps

- **[Accessing the Data](/docs/building-integration/accessing-the-data)** — step-by-step guide to downloading and exploring the datasets
- **[Building Energy Benchmarking](/docs/patterns/building-energy-benchmarking)** — EUI comparison pattern with SQL
- **[Asset Metadata Schema](/docs/schemas/asset-metadata)** — ODS-E building context fields

## Data Sources

- [ComStock datasets on OEDI](https://data.openei.org/submissions/4520)
- [ResStock datasets on OEDI](https://data.openei.org/submissions/4520)
- [ComStock Data Viewer](https://comstock.nrel.gov/dataviewer) (interactive, no download needed)
- [ResStock Data Viewer](https://resstock.nrel.gov/dataviewer) (interactive, no download needed)
- [NREL End Use Load Profiles](https://www.nrel.gov/buildings/end-use-load-profiles.html)
