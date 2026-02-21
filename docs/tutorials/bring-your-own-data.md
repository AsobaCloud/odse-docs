---
title: "Bring Your Own Data"
layout: default
---

# Bring Your Own Data

This tutorial walks through transforming your own CSV data into ODS-E records using the generic CSV mapper. If your data comes from a SCADA system, historian, or any source not in the [supported OEM list](/docs/transforms/supported-oems), this is the guide for you.

## What You'll Learn

1. How to inspect your CSV and identify the right columns
2. How to create a column mapping
3. How to transform, validate, and export your data
4. How to troubleshoot common issues

## Prerequisites

```bash
pip install odse
```

## Step 1: Inspect Your Data

Start by looking at the first few rows of your CSV. You need to identify:

- **Which column has timestamps** (required)
- **Which column has energy (kWh) or power (kW)** (at least one required)
- **Which column has asset/site identifiers** (optional but recommended)
- **Which column has device status** (optional)

For example, say your CSV looks like this:

```
Reading_Time,Site_Name,Active_Energy_Delivered,Reactive_Power,Device_Status
2026-02-09 00:00:00,CPT-SOLAR-01,0.0,0.0,OK
2026-02-09 00:05:00,CPT-SOLAR-01,0.0,0.0,OK
2026-02-09 06:00:00,CPT-SOLAR-01,0.42,0.05,OK
2026-02-09 12:00:00,CPT-SOLAR-01,4.83,0.31,OK
2026-02-09 15:00:00,CPT-SOLAR-01,2.15,0.18,WARN
```

Here:
- `Reading_Time` → timestamp
- `Active_Energy_Delivered` → kWh
- `Site_Name` → asset_id
- `Device_Status` → error_type
- `Reactive_Power` → extra field

## Step 2: Create a Column Mapping

### Option A: Inline Dict (Python)

```python
mapping = {
    "timestamp": "Reading_Time",
    "kWh": "Active_Energy_Delivered",
    "asset_id": "Site_Name",
    "error_type": "Device_Status",
    "extra": {
        "kVAr": "Reactive_Power",
    },
}
```

### Option B: YAML File (Python or CLI)

Create a file called `my_mapping.yaml`:

```yaml
timestamp: Reading_Time
kWh: Active_Energy_Delivered
asset_id: Site_Name
error_type: Device_Status
extra:
  kVAr: Reactive_Power
```

### Option C: Inline String (CLI Only)

```
timestamp=Reading_Time,kWh=Active_Energy_Delivered,asset_id=Site_Name
```

### Mapping Reference

| ODS-E Field | Your Column | Required | Notes |
|-------------|-------------|----------|-------|
| `timestamp` | Column with datetime or epoch | **yes** | ISO 8601, epoch seconds, or common datetime formats |
| `kWh` | Column with energy in kWh | no* | If absent, computed from `kW` |
| `kW` | Column with power in kW | no* | Used to compute kWh if `kWh` is absent |
| `error_type` | Column with device status | no | Values mapped to ODS-E error taxonomy |
| `error_code` | Column with error/status code | no | Passed through as-is |
| `asset_id` | Column with site/device ID | no | Recommended for multi-site data |
| `extra` | Dict of additional numeric fields | no | Preserved as extra columns |

*At least one of `kWh` or `kW` should be mapped.

## Step 3: Transform

### Python SDK

```python
from odse import transform

rows = transform(
    "my_data.csv",
    source="csv",
    mapping=mapping,  # or "my_mapping.yaml"
)

print(f"Transformed {len(rows)} records")
print(rows[0])
```

**Expected output:**

```python
{'timestamp': '2026-02-09T00:00:00Z', 'kWh': 0.0, 'error_type': 'normal', 'asset_id': 'CPT-SOLAR-01', 'kVAr': 0.0}
```

### CLI

```bash
# With inline mapping
odse transform --source generic_csv \
  --input my_data.csv \
  --column-map "timestamp=Reading_Time,kWh=Active_Energy_Delivered,asset_id=Site_Name" \
  -o output.json

# With YAML mapping file (pass via --column-map)
odse transform --source generic_csv \
  --input my_data.csv \
  --column-map "timestamp=Reading_Time,kWh=Active_Energy_Delivered" \
  -o output.json
```

## Step 4: Validate

```python
from odse import validate_batch

result = validate_batch(rows)
print(result.summary)
```

If validation fails, the error messages tell you exactly what's wrong:

```python
if result.invalid > 0:
    for idx, error in result.errors:
        print(f"Row {idx}: [{error.code}] {error.message}")
```

Common validation errors and their fixes:

| Error Code | Message | Fix |
|------------|---------|-----|
| `REQUIRED_FIELD_MISSING` | `timestamp is required` | Map the timestamp column in your mapping |
| `TYPE_MISMATCH` | `kWh must be a number` | Check your CSV — is the energy column numeric? |
| `ENUM_MISMATCH` | `error_type must be one of...` | Your status values need mapping (see Step 5) |

## Step 5: Handle Error Type Mapping

ODS-E uses a fixed error taxonomy: `normal`, `warning`, `critical`, `fault`, `offline`, `standby`, `unknown`.

If your data uses different status values (like `OK`, `WARN`, `FAULT`), the generic mapper attempts automatic mapping. If that doesn't work, you have two options:

### Option A: Pre-process Your CSV

Map status values before transforming:

```python
import csv
from io import StringIO

STATUS_MAP = {
    "OK": "normal",
    "WARN": "warning",
    "FAULT": "fault",
    "OFF": "offline",
}

# Read CSV and remap status
with open("my_data.csv") as f:
    reader = csv.DictReader(f)
    rows_raw = list(reader)

for row in rows_raw:
    row["Device_Status"] = STATUS_MAP.get(row["Device_Status"], "unknown")

# Write to string for transform
output = StringIO()
writer = csv.DictWriter(output, fieldnames=rows_raw[0].keys())
writer.writeheader()
writer.writerows(rows_raw)

rows = transform(output.getvalue(), source="csv", mapping=mapping)
```

### Option B: Use default_error_type

If your data doesn't have a status column, set a default:

```python
rows = transform("my_data.csv", source="csv",
    mapping={"timestamp": "Reading_Time", "kWh": "Active_Energy_Delivered"},
    default_error_type="normal"
)
```

## Step 6: Export

### JSON

```python
from odse import to_json

to_json(rows, "output/my_site.jsonl")
```

### CSV

```python
from odse import to_csv

to_csv(rows, "output/my_site.csv")
```

### Parquet

```python
from odse import to_parquet

to_parquet(rows, "output/my_site/", partition_by=["asset_id", "year", "month", "day"])
```

## Troubleshooting

### "Generic CSV transformer requires a 'mapping' argument"

You used `source="csv"` but didn't provide a `mapping`. Add the mapping dict or YAML path.

### Timestamps parse as wrong timezone

If your timestamps are local time (no timezone info), specify the timezone:

```python
rows = transform("my_data.csv", source="csv",
    mapping=mapping,
    timezone="+02:00"  # South Africa Standard Time
)
```

### Energy values are in Wh, not kWh

If your CSV has watt-hours instead of kilowatt-hours, divide in the mapping step or pre-process:

```python
# Pre-process: convert Wh to kWh
import pandas as pd

df = pd.read_csv("my_data.csv")
df["Energy_kWh"] = df["Energy_Wh"] / 1000
df.to_csv("my_data_kwh.csv", index=False)

rows = transform("my_data_kwh.csv", source="csv", mapping={
    "timestamp": "Reading_Time",
    "kWh": "Energy_kWh",
})
```

### Only have power (kW), not energy (kWh)

Map the `kW` column instead. ODS-E computes kWh from power × interval:

```python
rows = transform("my_data.csv", source="csv", mapping={
    "timestamp": "Reading_Time",
    "kW": "Power_kW",
}, interval_minutes=5)
```

### Multiple sites in one CSV

If your CSV has data from multiple sites in an `asset_id` column, map it:

```python
rows = transform("multi_site.csv", source="csv", mapping={
    "timestamp": "Timestamp",
    "kWh": "Energy",
    "asset_id": "Site_ID",
})

# Records will have different asset_id values
sites = set(r["asset_id"] for r in rows)
print(f"Found {len(sites)} sites: {sites}")
```

## Full Example

Putting it all together with the sample data:

```python
from odse import transform, validate_batch, to_parquet

# Transform using the shipped example data
rows = transform(
    "examples/data/generic_historian_7d.csv",
    source="csv",
    mapping="examples/data/generic_mapping.yaml",
)

# Validate
result = validate_batch(rows)
print(result.summary)  # "2016/2016 valid (schema)"

# Export
to_parquet(rows, "output/historian/", partition_by=["asset_id", "year", "month", "day"])
print(f"Exported {len(rows)} records to Parquet")
```

## Related Docs

- [Python SDK Reference](/docs/reference/python-sdk) — Full `transform()` API with generic CSV mapping format
- [CLI Walkthrough](/docs/guides/cli-walkthrough) — Generic CSV via CLI with `--column-map`
- [Multi-OEM Transform Tutorial](/docs/tutorials/multi-oem-transform) — Compare multiple OEMs side-by-side
- [Data Engineer Integration Guide](/docs/guides/data-engineers) — Pipeline patterns for ETL teams
- [Supported OEMs](/docs/transforms/supported-oems) — Check if your OEM has a built-in transform
