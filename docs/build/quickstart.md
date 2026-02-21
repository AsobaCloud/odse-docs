---
title: "Quickstart"
layout: default
parent: "Build"
nav_order: 1
---

# Quickstart

Install ODS-E, transform one OEM file, and validate the output. Takes about **2 minutes**.

## Step 1: Install

```bash
pip install odse
```

## Step 2: Transform OEM Data

Transform a Huawei FusionSolar CSV into standardized ODS-E records:

```python
from odse import transform

csv_data = """timestamp,power,inverter_state,run_state
2026-02-09 12:00:00,5000,512,1
2026-02-09 12:05:00,4800,512,1
"""

rows = transform(csv_data, source="huawei")
print(rows[0])
```

**Output:**

```json
{
  "timestamp": "2026-02-09T12:00:00Z",
  "kWh": 416.67,
  "error_type": "normal",
  "error_code": "512"
}
```

The same `transform()` function works for all [10 supported OEMs](/docs/transforms/supported-oems):

```python
rows = transform(enphase_json, source="enphase", expected_devices=10)
rows = transform(solaredge_csv, source="solaredge")
rows = transform(solarman_csv, source="solarman")
```

## Step 3: Validate

Check that the transformed records conform to the ODS-E schema:

```python
from odse import validate

result = validate({
    "timestamp": "2026-02-09T14:00:00Z",
    "kWh": 847.5,
    "error_type": "normal"
})

print(result.is_valid)   # True
print(result.errors)     # []
```

You now have normalized, validated energy data from an OEM source.

## What's Next

You've completed the basic transform-validate pipeline. From here:

- **[Multi-OEM Transform Tutorial](/docs/tutorials/multi-oem-transform)** — Transform 3 OEMs side-by-side and compare output
- **[Bring Your Own Data](/docs/tutorials/bring-your-own-data)** — Use the generic CSV mapper for any non-OEM source
- **[Patterns](/docs/patterns/basic-transform-validate)** — Copy-paste pipeline recipes for common workflows
- **[Data Engineer Integration Guide](/docs/guides/data-engineers)** — Full ETL pipeline from SCADA to data lake
- **[Trading Settlement Pipeline](/docs/patterns/trading-settlement-pipeline)** — Add market context and validate against conformance profiles
