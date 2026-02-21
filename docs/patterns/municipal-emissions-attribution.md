---
title: "Municipal Emissions Attribution"
layout: default
parent: "Patterns"
nav_order: 6
---

# Municipal Emissions Attribution

Disaggregate citywide CO₂ into building sectors, types, vintages, and end uses using ResStock and ComStock emissions columns.

## When to Use

You have an aggregate emissions figure for a city or county and need to break it down into actionable categories: which building types are responsible, which construction eras, which end uses (HVAC vs lighting vs plug loads). This is the difference between "Atlanta emitted X tons of CO₂" and "pre-1980 single-family homes in Fulton County account for 34% of residential heating emissions."

## Pipeline

```
Download state ResStock/ComStock baseline
    → filter to target county
    → multiply emissions × weight
    → group by building_type / vintage / end_use
    → attribution breakdown
```

## Prerequisites

Download Georgia ResStock baseline data per the [Accessing the Data](/docs/building-integration/accessing-the-data) guide.

## Complete Code

### Step 1: Load and filter to your county

```python
import pandas as pd

df = pd.read_csv("georgia_resstock_baseline.csv", low_memory=False)

# Filter to Fulton County (Atlanta)
# ResStock uses GISJOIN codes — Fulton County, GA = G1312100
fulton = df[df["in.county"] == "G1312100"].copy()
print(f"Buildings in Fulton County: {len(fulton):,}")
```

### Step 2: Emissions by building type

```python
# CO₂ emissions column (pounds, LRMER mid-case 15-year scenario)
emissions_col = "out.emissions.co2e.lrmer_mid_case_15.all_fuels.total.lb"

# Always weight — each model represents multiple real buildings
fulton["weighted_co2_lb"] = fulton[emissions_col] * fulton["weight"]

by_type = (fulton.groupby("in.geometry_building_type_recs")["weighted_co2_lb"]
           .sum()
           .sort_values(ascending=False))

# Convert pounds to metric tons
by_type_tons = by_type / 2_204.6

total_tons = by_type_tons.sum()
print(f"\nFulton County residential CO₂ by building type:")
print(f"{'Building Type':<30} {'Metric Tons':>12} {'Share':>8}")
print("-" * 52)
for btype, tons in by_type_tons.items():
    print(f"{btype:<30} {tons:>12,.0f} {tons/total_tons:>7.1%}")
```

### Step 3: Emissions by vintage (construction era)

```python
by_vintage = (fulton.groupby("in.vintage")["weighted_co2_lb"]
              .sum()
              .sort_index())

by_vintage_tons = by_vintage / 2_204.6

print(f"\nFulton County residential CO₂ by construction era:")
print(f"{'Vintage':<20} {'Metric Tons':>12} {'Share':>8}")
print("-" * 42)
for vintage, tons in by_vintage_tons.items():
    print(f"{vintage:<20} {tons:>12,.0f} {tons/total_tons:>7.1%}")
```

### Step 4: Emissions by end use

ResStock provides emissions broken down by fuel and end use. To see which activities drive emissions:

```python
end_use_cols = [c for c in fulton.columns
                if c.startswith("out.emissions.co2e.lrmer_mid_case_15.")
                and c.endswith(".lb")
                and "all_fuels" not in c
                and ".total." in c]

end_use_data = {}
for col in end_use_cols:
    # Extract fuel type from column name
    parts = col.split(".")
    fuel = parts[4]  # e.g., "electricity", "natural_gas"
    weighted = (fulton[col] * fulton["weight"]).sum() / 2_204.6
    if weighted > 0:
        end_use_data[fuel] = weighted

print(f"\nFulton County residential CO₂ by fuel type:")
for fuel, tons in sorted(end_use_data.items(), key=lambda x: -x[1]):
    print(f"  {fuel:<20} {tons:>12,.0f} metric tons ({tons/total_tons:.1%})")
```

## Reading the Results

**What "LRMER Mid Case 15" means**: Long-Run Marginal Emissions Rate, mid-case grid decarbonization scenario, 15-year time horizon. This represents the emissions impact of changes in electricity demand, accounting for how the grid is expected to evolve. It's the recommended scenario for evaluating future interventions.

**Other available scenarios** (substitute in the column name):
- `lrmer_high_re_cost_15` — pessimistic grid decarbonization
- `lrmer_low_re_cost_15` — optimistic grid decarbonization
- `aer_mid_case_1` — average emissions rate (for carbon inventory/accounting, not intervention planning)

**Unit conversion**: ResStock reports in pounds (lb). Divide by 2,204.6 for metric tons, or by 2,000 for short tons.

## Adding Commercial Buildings

The code above uses ResStock (residential). To get the full picture, repeat with ComStock (commercial) data:

```python
com = pd.read_csv("georgia_comstock_baseline.csv", low_memory=False)

# ComStock uses a different county column format — check your data dictionary
# Filter, weight, and group the same way
```

Combine residential + commercial totals for a complete county-level attribution.

## What to Read Next

- [Upgrade Scenario Modeling](/docs/patterns/upgrade-scenario-modeling) — model what-if retrofit impacts on these emissions
- [Cross-City Benchmarking](/docs/patterns/cross-city-benchmarking) — compare this county's profile against other cities
- [Accessing the Data](/docs/building-integration/accessing-the-data) — download instructions
