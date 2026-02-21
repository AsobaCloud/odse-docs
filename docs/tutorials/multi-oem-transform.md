---
title: "Multi-OEM Transform Tutorial"
layout: default
parent: "Build"
nav_order: 2
---

# Multi-OEM Transform Tutorial

This tutorial walks through transforming solar production data from three different inverter OEMs into normalized ODS-E records, validating each, and comparing the output. This is the core of what ODS-E does — normalize heterogeneous energy data.

## What You'll Learn

1. How different OEMs structure their data differently
2. How ODS-E normalizes all of them to one schema
3. How to validate multi-OEM output
4. How to add a generic CSV source as a 4th input

## Prerequisites

```bash
pip install odse
git clone https://github.com/AsobaCloud/odse.git
cd odse
```

## Step 1: Meet the Data

The `examples/data/` directory contains 24-hour synthetic fixtures for three OEMs. Each represents the same scenario — a solar site producing power during the day — but the data format is completely different.

### Huawei FusionSolar

```
timestamp,power,inverter_state,run_state
2026-02-09 12:00:00,7.86,512,1
2026-02-09 12:05:00,7.61,512,1
```

- Timestamps: naive datetime strings
- Power: instantaneous kW
- Error state: numeric codes (512 = normal, 513 = warning)
- Energy: not provided (must be computed from power × interval)

### Enphase Enlighten

```
end_at,wh_del,devices_reporting
1739059200,436.2,12
1739059500,433.8,12
```

- Timestamps: Unix epoch (seconds)
- Energy: watt-hours delivered
- Status: inferred from `devices_reporting` vs expected count

### SolarEdge Monitoring

```
date,totalActivePower,inverterMode,operationMode,apparentPower,reactivePower,cosPhi
2026-02-09 12:00:00+02:00,9832.1,MPPT,1,10284.3,3095.4,0.956
```

- Timestamps: some with timezone offset, some without (a real data quality issue!)
- Power: watts (not kW)
- Rich electrical data: apparent power, reactive power, power factor

**Three different column names, three different units, three different timestamp formats, three different error representations.**

## Step 2: Transform Each Source (Python SDK)

```python
from odse import transform

# Huawei: CSV with power in kW, 5-minute intervals
huawei = transform(
    "examples/data/huawei_fusionsolar_24h.csv",
    source="huawei",
    asset_id="SITE-HW"
)

# Enphase: CSV with epoch timestamps and watt-hours
enphase = transform(
    "examples/data/enphase_enlighten_24h.csv",
    source="enphase",
    expected_devices=12,
    asset_id="SITE-EN"
)

# SolarEdge: CSV with watts and mixed timezone formats
solaredge = transform(
    "examples/data/solaredge_monitoring_24h.csv",
    source="solaredge",
    asset_id="SITE-SE"
)

print(f"Huawei:    {len(huawei)} records")
print(f"Enphase:   {len(enphase)} records")
print(f"SolarEdge: {len(solaredge)} records")
```

**Expected output:**
```
Huawei:    264 records
Enphase:   288 records
SolarEdge: 288 records
```

Huawei has 264 (not 288) because the fixture includes a 2-hour telemetry gap — those rows are simply missing from the CSV.

## Step 3: Compare Normalized Output

Despite wildly different input formats, all three produce records with the same structure:

```python
# Print first daytime record from each
for name, rows in [("Huawei", huawei), ("Enphase", enphase), ("SolarEdge", solaredge)]:
    # Find first record with non-zero production
    for r in rows:
        if r["kWh"] > 0:
            print(f"\n{name}:")
            print(f"  timestamp:  {r['timestamp']}")
            print(f"  kWh:        {r['kWh']:.3f}")
            print(f"  error_type: {r['error_type']}")
            print(f"  asset_id:   {r.get('asset_id', 'n/a')}")
            break
```

**Expected output:**
```
Huawei:
  timestamp:  2026-02-09T05:30:00Z
  kWh:        0.019
  error_type: normal
  asset_id:   SITE-HW

Enphase:
  timestamp:  2026-02-09T06:00:00Z
  kWh:        0.002
  error_type: normal
  asset_id:   SITE-EN

SolarEdge:
  timestamp:  2026-02-09T05:30:00+02:00
  kWh:        0.033
  error_type: normal
  asset_id:   SITE-SE
```

Same fields. Same types. Same semantics. Different sources, one schema.

## Step 4: Validate All Records

```python
from odse import validate_batch

for name, rows in [("Huawei", huawei), ("Enphase", enphase), ("SolarEdge", solaredge)]:
    result = validate_batch(rows)
    print(f"{name}: {result.summary}")
```

**Expected output:**
```
Huawei: 264/264 valid (schema)
Enphase: 288/288 valid (schema)
SolarEdge: 288/288 valid (schema)
```

All records pass schema validation — the transforms guarantee well-formed output.

## Step 5: Same Thing, from the CLI

```bash
# Transform each OEM
odse transform --source huawei --input examples/data/huawei_fusionsolar_24h.csv \
  --asset-id SITE-HW -o /tmp/huawei.json

odse transform --source enphase --input examples/data/enphase_enlighten_24h.csv \
  --asset-id SITE-EN -o /tmp/enphase.json

odse transform --source solaredge --input examples/data/solaredge_monitoring_24h.csv \
  --asset-id SITE-SE -o /tmp/solaredge.json

# Validate each
odse validate --input /tmp/huawei.json
odse validate --input /tmp/enphase.json
odse validate --input /tmp/solaredge.json
```

## Step 6: Add a 4th Source with Generic CSV

The `examples/data/generic_historian_7d.csv` uses non-standard column names that don't match any OEM. Use the generic CSV mapper:

```python
from odse import transform, validate_batch

rows = transform(
    "examples/data/generic_historian_7d.csv",
    source="csv",
    mapping={
        "timestamp": "Timestamp",
        "kWh": "ActiveEnergy_kWh",
        "asset_id": "SiteTag",
        "extra": {"kVAr": "ReactivePower_kVAr"},
    }
)

print(f"Generic historian: {len(rows)} records")
result = validate_batch(rows)
print(f"Validation: {result.summary}")
```

Or with the CLI using a YAML mapping file:

```bash
odse transform --source generic_csv \
  --input examples/data/generic_historian_7d.csv \
  --column-map "timestamp=Timestamp,kWh=ActiveEnergy_kWh,asset_id=SiteTag" \
  -o /tmp/historian.json

odse validate --input /tmp/historian.json
```

## Step 7: Combine and Export

Merge all sources into one partitioned Parquet output:

```python
from odse import to_parquet

all_records = huawei + enphase + solaredge
to_parquet(all_records, "output/multi_oem/", partition_by=["asset_id", "year", "month", "day"])
```

This creates one partitioned directory structure:

```
output/multi_oem/
├── asset_id=SITE-EN/year=2026/month=02/day=09/part-00000.parquet
├── asset_id=SITE-HW/year=2026/month=02/day=09/part-00000.parquet
└── asset_id=SITE-SE/year=2026/month=02/day=09/part-00000.parquet
```

## What You've Learned

- Three OEMs, three completely different formats → one ODS-E schema
- Transforms handle column mapping, unit conversion, timestamp normalization, and error taxonomy
- The generic CSV mapper covers any source not built into ODS-E
- Validation works identically regardless of source
- Output to Parquet creates a clean data lake structure

## Related Docs

- [Supported OEMs](/docs/transforms/supported-oems) — Full transform matrix
- [Python SDK Reference](/docs/reference/python-sdk) — API documentation
- [CLI Walkthrough](/docs/guides/cli-walkthrough) — Every CLI command
- [Bring Your Own Data](/docs/tutorials/bring-your-own-data) — Use your own CSV
- [Architecture & Core Concepts](/docs/concepts/architecture) — Data flow overview
