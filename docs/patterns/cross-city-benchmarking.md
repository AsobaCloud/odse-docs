---
title: "Cross-City Benchmarking"
layout: default
parent: "Patterns"
nav_order: 8
---

# Cross-City Benchmarking

Compare energy and emissions profiles across cities using consistent methodology and the same underlying dataset.

## When to Use

You need apples-to-apples comparisons between geographies — Atlanta vs Houston vs Charlotte — using the same simulation methodology, weather models, and building stock characterization. This eliminates the problem of comparing numbers collected with different standards, different reporting years, and different definitions.

## Pipeline

```
Download ResStock/ComStock baseline for each target state
    → filter to target counties
    → weight and aggregate per county
    → normalize (per dwelling, per sqft, or per capita)
    → side-by-side comparison
```

## Prerequisites

Download ResStock baseline data for each state you want to compare, per the [Accessing the Data](/docs/building-integration/accessing-the-data) guide.

## Geographic Identifiers

ResStock uses NHGIS GISJOIN codes for counties. Here are the codes for common metro areas:

| City | County | State | GISJOIN Code |
|------|--------|-------|-------------|
| Atlanta | Fulton County | GA | `G1312100` |
| Houston | Harris County | TX | `G4820100` |
| Charlotte | Mecklenburg County | NC | `G3711900` |
| Miami | Miami-Dade County | FL | `G1208600` |
| Nashville | Davidson County | TN | `G4703700` |
| New Orleans | Orleans Parish | LA | `G2207100` |
| Birmingham | Jefferson County | AL | `G0107300` |
| Jacksonville | Duval County | FL | `G1203100` |

To find other GISJOIN codes: the format is `G` + 2-digit state FIPS (zero-padded) + 5-digit county FIPS (zero-padded with trailing zero). Example: Fulton County, GA = FIPS 13121 → `G1312100`.

## Complete Code

### Step 1: Load data for multiple states

```python
import pandas as pd

# Download these first — see "Accessing the Data" guide
states = {
    "GA": "georgia_resstock_baseline.csv",
    "TX": "texas_resstock_baseline.csv",
    "NC": "north_carolina_resstock_baseline.csv",
}

dfs = {}
for state, filepath in states.items():
    dfs[state] = pd.read_csv(filepath, low_memory=False)
    print(f"{state}: {len(dfs[state]):,} buildings loaded")

# Combine into one dataframe
df = pd.concat(dfs.values(), ignore_index=True)
```

### Step 2: Filter to target counties

```python
cities = {
    "Atlanta":   "G1312100",  # Fulton County, GA
    "Houston":   "G4820100",  # Harris County, TX
    "Charlotte": "G3711900",  # Mecklenburg County, NC
}

city_data = {}
for city, gisjoin in cities.items():
    city_df = df[df["in.county"] == gisjoin].copy()
    city_data[city] = city_df
    print(f"{city}: {len(city_df):,} building models")
```

### Step 3: Compare total emissions

```python
emissions_col = "out.emissions.co2e.lrmer_mid_case_15.all_fuels.total.lb"
energy_col = "out.site_energy.total.energy_consumption.kwh"

print(f"\n{'City':<12} {'Total CO₂ (tons)':>18} {'Total Energy (GWh)':>20} {'Dwellings':>12}")
print("-" * 64)

for city, cdf in city_data.items():
    total_co2_tons = (cdf[emissions_col] * cdf["weight"]).sum() / 2_204.6
    total_energy_gwh = (cdf[energy_col] * cdf["weight"]).sum() / 1_000_000
    total_dwellings = cdf["weight"].sum()

    print(f"{city:<12} {total_co2_tons:>18,.0f} {total_energy_gwh:>20,.1f} {total_dwellings:>12,.0f}")
```

### Step 4: Normalize for fair comparison

Raw totals are misleading because cities have different population sizes. Normalize per dwelling:

```python
print(f"\n{'City':<12} {'CO₂/dwelling (tons)':>20} {'kWh/dwelling':>14} {'Dwellings':>12}")
print("-" * 60)

for city, cdf in city_data.items():
    total_co2 = (cdf[emissions_col] * cdf["weight"]).sum() / 2_204.6
    total_energy = (cdf[energy_col] * cdf["weight"]).sum()
    total_dwellings = cdf["weight"].sum()

    print(f"{city:<12} {total_co2/total_dwellings:>20,.2f} "
          f"{total_energy/total_dwellings:>14,.0f} {total_dwellings:>12,.0f}")
```

### Step 5: Compare building stock composition

Understanding *why* cities differ is often more useful than the raw numbers:

```python
print("\nBuilding stock composition (% of dwellings by type):")
print(f"{'Type':<30}", end="")
for city in cities:
    print(f" {city:>12}", end="")
print()
print("-" * (30 + 13 * len(cities)))

all_types = sorted(df["in.geometry_building_type_recs"].unique())
for btype in all_types:
    print(f"{btype:<30}", end="")
    for city, cdf in city_data.items():
        type_weight = cdf[cdf["in.geometry_building_type_recs"] == btype]["weight"].sum()
        total_weight = cdf["weight"].sum()
        pct = type_weight / total_weight if total_weight > 0 else 0
        print(f" {pct:>11.1%}", end="")
    print()
```

### Step 6: Compare vintage distribution

```python
print("\nBuilding stock by construction era (% of dwellings):")
print(f"{'Vintage':<20}", end="")
for city in cities:
    print(f" {city:>12}", end="")
print()
print("-" * (20 + 13 * len(cities)))

for vintage in sorted(df["in.vintage"].unique()):
    print(f"{vintage:<20}", end="")
    for city, cdf in city_data.items():
        v_weight = cdf[cdf["in.vintage"] == vintage]["weight"].sum()
        total_weight = cdf["weight"].sum()
        pct = v_weight / total_weight if total_weight > 0 else 0
        print(f" {pct:>11.1%}", end="")
    print()
```

This reveals actionable differences — for example, if Atlanta has significantly more pre-1960 housing stock than Charlotte, envelope retrofits (insulation, air sealing) will have a proportionally larger impact there.

### Step 7: Compare upgrade potential across cities

Combine cross-city data with upgrade scenarios to rank where interventions matter most:

```python
# Load heat pump upgrade for each state (upgrade 04)
# (Download these the same way as baselines — see Accessing the Data guide)
upgrade_files = {
    "GA": "georgia_resstock_upgrade04.csv",
    "TX": "texas_resstock_upgrade04.csv",
    "NC": "north_carolina_resstock_upgrade04.csv",
}

print(f"\nHeat pump retrofit impact by city:")
print(f"{'City':<12} {'Baseline CO₂':>14} {'Post-Upgrade':>14} {'Savings':>14} {'Reduction':>10}")
print("-" * 66)

for city, gisjoin in cities.items():
    state = gisjoin[1:3]  # Extract state FIPS from GISJOIN
    state_abbr = {"13": "GA", "48": "TX", "37": "NC"}[state]

    baseline_city = city_data[city]
    upgrade_df = pd.read_csv(upgrade_files[state_abbr], low_memory=False)
    upgrade_city = upgrade_df[upgrade_df["in.county"] == gisjoin]

    merged = baseline_city[["bldg_id", emissions_col, "weight"]].merge(
        upgrade_city[["bldg_id", emissions_col]], on="bldg_id", suffixes=("_b", "_u"))

    base_tons = (merged[f"{emissions_col}_b"] * merged["weight"]).sum() / 2_204.6
    upgrade_tons = (merged[f"{emissions_col}_u"] * merged["weight"]).sum() / 2_204.6
    savings_tons = base_tons - upgrade_tons
    pct = savings_tons / base_tons if base_tons > 0 else 0

    print(f"{city:<12} {base_tons:>14,.0f} {upgrade_tons:>14,.0f} "
          f"{savings_tons:>14,.0f} {pct:>9.1%}")
```

## What to Read Next

- [Municipal Emissions Attribution](/docs/patterns/municipal-emissions-attribution) — deep dive into one city's emissions profile
- [Upgrade Scenario Modeling](/docs/patterns/upgrade-scenario-modeling) — detailed upgrade comparison within a single geography
- [ComStock & ResStock Guide](/docs/building-integration/comstock-resstock) — what the datasets are and how they connect to ODS-E
