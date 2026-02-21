---
title: "Upgrade Scenario Modeling"
layout: default
parent: "Patterns"
nav_order: 7
---

# Upgrade Scenario Modeling

Model what happens to energy consumption and emissions if you retrofit buildings with heat pumps, insulation, or other efficiency measures — before committing to implementation.

## When to Use

You want to show a municipality or portfolio manager the projected impact of specific building interventions. For example: "What happens to Fulton County's residential heating emissions if we retrofit pre-1980 homes with cold climate heat pumps?"

## Pipeline

```
Download baseline + upgrade file for target state
    → join on building_id
    → calculate: baseline_value - upgrade_value = savings
    → filter to target county / building cohort
    → aggregate savings by category
```

## Prerequisites

Download Georgia ResStock baseline **and** the upgrade file you want to evaluate, per the [Accessing the Data](/docs/building-integration/accessing-the-data) guide.

## How Upgrades Work in the Data

Both ResStock and ComStock publish the same set of buildings simulated twice: once as-is (baseline, `upgrade=0`) and once with a specific measure applied (e.g., `upgrade=4`). To calculate savings, you subtract the upgrade result from the baseline for each building.

The `upgrade_dictionary.tsv` file maps upgrade numbers to descriptions:

```bash
# Download the upgrade dictionary
aws s3 cp --no-sign-request \
  "s3://oedi-data-lake/nrel-pds-building-stock/end-use-load-profiles-for-us-building-stock/2024/resstock_tmy3_release_2/upgrade_dictionary.tsv" \
  ./upgrade_dictionary.tsv
```

### Key ResStock Upgrades for Municipal Planning

| Upgrade | Name | What It Does |
|---------|------|-------------|
| 4 | Cold Climate Air-Source Heat Pump | Replaces existing heating with ASHP |
| 5 | Dual Fuel Heat Pump | Heat pump with gas backup |
| 9 | Heat Pump Water Heater | Replaces conventional water heater |
| 11 | Air Sealing | Reduces infiltration |
| 12 | Attic Floor Insulation | Adds/upgrades attic insulation |
| 14 | Air Sealing + Drill-and-Fill Wall Insulation | Combined envelope upgrade |
| 17 | ENERGY STAR Windows | Window replacement |

### Key ComStock Upgrades

| Measure ID | Name | What It Does |
|------------|------|-------------|
| `hvac_0005` | Heat Pump RTU | Replaces rooftop units with heat pumps |
| `env_0001` | Exterior Wall Insulation | Commercial wall insulation |
| `env_0005` | Window Replacement | Commercial window upgrade |
| `ltg_0001` | LED Lighting | Full LED conversion |
| `pkg_0003` | Comprehensive Package | Insulation + windows + LED + heat pumps |

## Complete Code

### Step 1: Load baseline and upgrade data

```python
import pandas as pd

# Load baseline (upgrade=0) and heat pump upgrade (upgrade=4)
baseline = pd.read_csv("georgia_resstock_baseline.csv", low_memory=False)
upgrade4 = pd.read_csv("georgia_resstock_upgrade04.csv", low_memory=False)

# Filter to Fulton County (Atlanta)
baseline_fulton = baseline[baseline["in.county"] == "G1312100"].copy()
upgrade4_fulton = upgrade4[upgrade4["in.county"] == "G1312100"].copy()

print(f"Fulton County buildings: {len(baseline_fulton):,}")
```

### Step 2: Check applicability

Not every building can receive every upgrade. The `applicability` column tells you which buildings were actually modified:

```python
applicable = upgrade4_fulton[upgrade4_fulton["applicability"] == True]
print(f"Buildings where heat pump applies: {len(applicable):,}")
print(f"Applicability rate: {len(applicable)/len(upgrade4_fulton):.1%}")
```

### Step 3: Calculate emissions savings

```python
emissions_col = "out.emissions.co2e.lrmer_mid_case_15.all_fuels.total.lb"

# Join baseline and upgrade on building_id
merged = baseline_fulton[["bldg_id", emissions_col, "weight",
                          "in.geometry_building_type_recs", "in.vintage"]].merge(
    upgrade4_fulton[["bldg_id", emissions_col, "applicability"]],
    on="bldg_id",
    suffixes=("_baseline", "_upgrade")
)

# Calculate per-building savings (positive = reduction)
merged["savings_lb"] = merged[f"{emissions_col}_baseline"] - merged[f"{emissions_col}_upgrade"]
merged["weighted_savings_lb"] = merged["savings_lb"] * merged["weight"]
merged["weighted_baseline_lb"] = merged[f"{emissions_col}_baseline"] * merged["weight"]

total_baseline = merged["weighted_baseline_lb"].sum()
total_savings = merged["weighted_savings_lb"].sum()

print(f"\nFulton County residential emissions impact of heat pump retrofit:")
print(f"  Baseline: {total_baseline / 2_204.6:,.0f} metric tons CO₂")
print(f"  Savings:  {total_savings / 2_204.6:,.0f} metric tons CO₂")
print(f"  Reduction: {total_savings / total_baseline:.1%}")
```

### Step 4: Break down savings by building vintage

```python
by_vintage = (merged.groupby("in.vintage")
              .agg(baseline_tons=("weighted_baseline_lb", "sum"),
                   savings_tons=("weighted_savings_lb", "sum"))
              .sort_index())

by_vintage = by_vintage / 2_204.6  # Convert to metric tons

print(f"\nSavings by construction era:")
print(f"{'Vintage':<20} {'Baseline':>12} {'Savings':>12} {'Reduction':>10}")
print("-" * 56)
for vintage, row in by_vintage.iterrows():
    pct = row["savings_tons"] / row["baseline_tons"] if row["baseline_tons"] > 0 else 0
    print(f"{vintage:<20} {row['baseline_tons']:>12,.0f} {row['savings_tons']:>12,.0f} {pct:>9.1%}")
```

### Step 5: Compare multiple upgrades

To evaluate which intervention delivers the most impact, repeat for multiple upgrade files:

```python
upgrades_to_compare = {
    "Heat Pump": "georgia_resstock_upgrade04.csv",
    "Air Sealing + Insulation": "georgia_resstock_upgrade14.csv",
    "HP Water Heater": "georgia_resstock_upgrade09.csv",
}

results = {}
for name, filepath in upgrades_to_compare.items():
    ug = pd.read_csv(filepath, low_memory=False)
    ug_fulton = ug[ug["in.county"] == "G1312100"]

    merged = baseline_fulton[["bldg_id", emissions_col, "weight"]].merge(
        ug_fulton[["bldg_id", emissions_col]], on="bldg_id", suffixes=("_b", "_u"))

    savings = ((merged[f"{emissions_col}_b"] - merged[f"{emissions_col}_u"])
               * merged["weight"]).sum()
    results[name] = savings / 2_204.6

print(f"\nUpgrade comparison (Fulton County, metric tons CO₂ saved):")
for name, tons in sorted(results.items(), key=lambda x: -x[1]):
    print(f"  {name:<30} {tons:>10,.0f}")
```

## What to Read Next

- [Municipal Emissions Attribution](/docs/patterns/municipal-emissions-attribution) — understand the baseline before modeling upgrades
- [Cross-City Benchmarking](/docs/patterns/cross-city-benchmarking) — compare upgrade potential across cities
- [Accessing the Data](/docs/building-integration/accessing-the-data) — download instructions for baseline + upgrade files
