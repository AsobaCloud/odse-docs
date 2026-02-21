---
title: "Accessing the Data"
layout: default
parent: "Building Integration"
nav_order: 2
---

# Accessing ComStock & ResStock Data

This guide walks through the three ways to access the data, from easiest (browser) to most powerful (SQL queries). No account or payment is required for any method.

## Three Access Methods

| Method | Best For | Setup Required | Programmatic |
|--------|----------|---------------|-------------|
| **Web Data Viewer** | Exploring, generating charts | None | No |
| **S3 Download** | Loading into your database or pandas | AWS CLI (optional) | Yes |
| **AWS Athena** | SQL queries at scale without downloading | AWS account | Yes |

Start with the Web Data Viewer to explore, then use S3 Download when you're ready to integrate.

---

## Option A: Web Data Viewer (Start Here)

The fastest way to see what's in the data. No download, no setup.

- **ComStock**: [comstock.nrel.gov/dataviewer](https://comstock.nrel.gov/dataviewer)
- **ResStock**: [resstock.nrel.gov/dataviewer](https://resstock.nrel.gov/dataviewer)

### What you can do

1. Select a state (e.g., Georgia)
2. Filter by building type (e.g., Small Office, Single-Family Detached)
3. Choose an end use (e.g., HVAC, Lighting, Total)
4. View charts showing energy consumption breakdowns

### Limitations

- No emissions data (CO₂ columns are only in the raw files)
- No upgrade scenario comparisons
- Cannot export full datasets programmatically

The viewer is useful for getting oriented, but you'll need the raw files for emissions attribution, upgrade modeling, or any integration work.

---

## Option B: Download from S3 (Recommended for Integration)

The datasets are hosted on a public AWS S3 bucket. **No AWS account or credentials required.**

### Step 1: Understand the bucket structure

All data lives under:
```
s3://oedi-data-lake/nrel-pds-building-stock/end-use-load-profiles-for-us-building-stock/
```

You can browse this in your web browser: [OEDI S3 Browser](https://data.openei.org/s3_viewer?bucket=oedi-data-lake&prefix=nrel-pds-building-stock%2Fend-use-load-profiles-for-us-building-stock%2F)

### Step 2: Pick your dataset

The most recent releases:

| Dataset | Path |
|---------|------|
| ResStock 2024 Release 2 | `.../2024/resstock_tmy3_release_2/` |
| ComStock 2024 Release 2 | `.../2024/comstock_amy2018_release_2/` |

### Step 3: Download state-level data

You only need data for your target states. Each dataset has a `by_state/` folder.

**Using AWS CLI** (install from [aws.amazon.com/cli](https://aws.amazon.com/cli/)):

```bash
# Download Georgia ResStock baseline (annual results, ~50 MB CSV)
aws s3 cp --no-sign-request \
  "s3://oedi-data-lake/nrel-pds-building-stock/end-use-load-profiles-for-us-building-stock/2024/resstock_tmy3_release_2/metadata_and_annual_results/by_state/state=GA/csv/GA_baseline_metadata_and_annual_results.csv" \
  ./georgia_resstock_baseline.csv

# Download Georgia ComStock baseline
aws s3 cp --no-sign-request \
  "s3://oedi-data-lake/nrel-pds-building-stock/end-use-load-profiles-for-us-building-stock/2024/comstock_amy2018_release_2/metadata_and_annual_results/by_state/state=GA/csv/GA_baseline_metadata_and_annual_results.csv" \
  ./georgia_comstock_baseline.csv
```

**Without AWS CLI** — use the [S3 Browser](https://data.openei.org/s3_viewer?bucket=oedi-data-lake&prefix=nrel-pds-building-stock%2Fend-use-load-profiles-for-us-building-stock%2F2024%2F) and navigate to the CSV files to download directly.

### Step 4: Download upgrade scenarios (optional)

Upgrade files sit alongside the baseline in the same folder:

```bash
# Download ResStock upgrade 04 (cold climate heat pump) for Georgia
aws s3 cp --no-sign-request \
  "s3://oedi-data-lake/nrel-pds-building-stock/end-use-load-profiles-for-us-building-stock/2024/resstock_tmy3_release_2/metadata_and_annual_results/by_state/state=GA/csv/GA_upgrade04_metadata_and_annual_results.csv" \
  ./georgia_resstock_upgrade04.csv
```

To see what each upgrade number means, download the upgrade dictionary:

```bash
aws s3 cp --no-sign-request \
  "s3://oedi-data-lake/nrel-pds-building-stock/end-use-load-profiles-for-us-building-stock/2024/resstock_tmy3_release_2/upgrade_dictionary.tsv" \
  ./upgrade_dictionary.tsv
```

### Step 5: Download the data dictionary

This file tells you what every column means:

```bash
aws s3 cp --no-sign-request \
  "s3://oedi-data-lake/nrel-pds-building-stock/end-use-load-profiles-for-us-building-stock/2024/resstock_tmy3_release_2/data_dictionary.tsv" \
  ./data_dictionary.tsv
```

---

## Your First Look at the Data

Once you have the Georgia ResStock baseline CSV, open it in pandas (or Excel, though the file may be large):

```python
import pandas as pd

df = pd.read_csv("georgia_resstock_baseline.csv", low_memory=False)
print(f"Rows: {len(df):,}")
print(f"Columns: {len(df.columns):,}")
```

### Key columns to look at first

```python
# Building characteristics (inputs)
print(df[["in.state", "in.county", "in.geometry_building_type_recs",
          "in.vintage", "in.ashrae_iecc_climate_zone_2006"]].head(10))
```

| Column | Example Value | What It Means |
|--------|--------------|---------------|
| `in.state` | `GA` | State |
| `in.county` | `G1312100` | County (GISJOIN code — Fulton County, GA) |
| `in.geometry_building_type_recs` | `Single-Family Detached` | Building type |
| `in.vintage` | `1960s` | When the building was constructed |
| `in.ashrae_iecc_climate_zone_2006` | `3A` | Climate zone |

### Energy and emissions columns

```python
# Total energy consumption
print(df["out.site_energy.total.energy_consumption.kwh"].describe())

# CO₂ emissions (pounds, mid-case scenario)
print(df["out.emissions.co2e.lrmer_mid_case_15.all_fuels.total.lb"].describe())
```

### The weight column

Each row represents multiple real buildings. **Always multiply by weight when aggregating:**

```python
# Wrong — treats each model as one building
wrong_total = df["out.emissions.co2e.lrmer_mid_case_15.all_fuels.total.lb"].sum()

# Right — accounts for how many real buildings each model represents
right_total = (df["out.emissions.co2e.lrmer_mid_case_15.all_fuels.total.lb"]
               * df["weight"]).sum()

print(f"Weighted total CO₂: {right_total / 2_000:,.0f} tons")  # Convert lb to short tons
```

### Understanding the `in.` / `out.` convention

- **`in.*`** = inputs to the simulation (building characteristics, location, systems)
- **`out.*`** = outputs of the simulation (energy, emissions, costs)
- **`weight`** = how many real buildings this simulated building represents

---

## Option C: AWS Athena (For SQL Queries at Scale)

If you need to query the full national dataset without downloading it, AWS Athena lets you run SQL directly against the S3 files.

This requires an AWS account. Setup instructions: [NREL Athena Tutorial](https://github.com/openEDI/documentation/blob/main/NREL_Building_Stock/Query_ComStock_Athena.md)

There is also a Python library for programmatic Athena access: [BuildStockQuery](https://github.com/NREL/buildstock-query)

For most use cases, downloading state-level CSVs (Option B) is simpler and sufficient.

---

## What to Read Next

Now that you have the data, these patterns show you what to do with it:

- **[Municipal Emissions Attribution](/docs/patterns/municipal-emissions-attribution)** — break down county CO₂ by building type, vintage, and end use
- **[Upgrade Scenario Modeling](/docs/patterns/upgrade-scenario-modeling)** — model what-if retrofit scenarios
- **[Cross-City Benchmarking](/docs/patterns/cross-city-benchmarking)** — compare cities side-by-side
- **[Building Energy Benchmarking](/docs/patterns/building-energy-benchmarking)** — compare individual buildings against national cohorts
