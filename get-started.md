---
title: "Get Started with ODS-E"
layout: default
---

# Get Started with ODS-E

This guide walks you through installing the ODS-E library, transforming OEM data into standardized records, and validating both generation and consumption data. It takes about **5 minutes**.

## Your Goal

By the end of this guide, you will have:
1. Installed the `odse` Python package
2. Transformed raw OEM data into ODS-E records
3. Validated a generation record
4. Validated a consumption record with end-use tagging

## Step 1: Install

```bash
pip install odse
```

Or install from source for the latest development version:

```bash
git clone https://github.com/AsobaCloud/odse.git
cd odse
pip install -e src/python
```

## Step 2: Transform OEM Data

ODS-E includes transform functions for 10 OEMs. Each takes raw data (CSV or JSON) and returns standardized ODS-E records.

### Huawei CSV Example

```python
from odse import transform

csv_data = """timestamp,power,inverter_state,run_state
2026-02-09 12:00:00,5000,512,1
2026-02-09 12:05:00,4800,512,1
"""

rows = transform(csv_data, source="huawei")
for row in rows:
    print(row)
```

**Expected output:**

```json
{
  "timestamp": "2026-02-09T12:00:00Z",
  "kWh": 416.67,
  "error_type": "normal",
  "error_code": "512"
}
```

### Other OEMs

The same `transform()` function works for all supported OEMs:

```python
# Enphase JSON API response
rows = transform(enphase_json, source="enphase", expected_devices=10)

# SolaX Cloud realtime payload
rows = transform(solax_json, source="solaxcloud")

# Solarman logger CSV
rows = transform(solarman_csv, source="solarman")
```

See the [Supported OEMs](/transforms/supported-oems) page for the full list.

## Step 3: Validate a Generation Record

Every ODS-E record must pass schema validation. The `validate()` function checks required fields, types, enums, and bounds.

```python
from odse import validate

result = validate({
    "timestamp": "2026-02-09T14:00:00Z",
    "kWh": 847.5,
    "error_type": "normal",
    "PF": 0.98
})

print(result.is_valid)   # True
print(result.errors)     # []
```

Records without a `direction` field default to `"generation"` — all existing solar transforms produce valid records without changes.

### Semantic Validation

For deeper checks (physical bounds, state consistency), pass `level="semantic"` and the asset's capacity:

```python
result = validate(
    {"timestamp": "2026-02-09T14:00:00Z", "kWh": 500.0, "error_type": "normal"},
    level="semantic",
    capacity_kw=10.0
)

print(result.is_valid)    # True
print(result.warnings)    # [kWh exceeds physical maximum for 10kW capacity]
```

## Step 4: Validate Consumption Data

ODS-E now supports consumption and net metering. Use the `direction`, `end_use`, and `fuel_type` fields:

```python
result = validate({
    "timestamp": "2026-02-09T14:00:00Z",
    "kWh": 12.3,
    "error_type": "normal",
    "direction": "consumption",
    "end_use": "cooling",
    "fuel_type": "electricity"
})

print(result.is_valid)  # True
```

### Net Metering (Negative kWh)

For net metering, `kWh` can be negative (net export):

```python
result = validate({
    "timestamp": "2026-02-09T14:00:00Z",
    "kWh": -3.2,
    "error_type": "normal",
    "direction": "net"
})

print(result.is_valid)  # True
```

### Direction Values

| Direction | kWh Constraint | Use Case |
|-----------|---------------|----------|
| `generation` (default) | Must be >= 0 | Solar, wind, CHP output |
| `consumption` | Must be >= 0 | Grid meters, sub-meters, HVAC |
| `net` | May be negative | Net meters, bidirectional flows |

### End-Use Categories

The `end_use` field supports 16 categories aligned with NREL ComStock/ResStock:

`cooling`, `heating`, `fans`, `pumps`, `water_systems`, `interior_lighting`, `exterior_lighting`, `interior_equipment`, `refrigeration`, `cooking`, `laundry`, `ev_charging`, `pv_generation`, `battery_storage`, `whole_building`, `other`

## Step 5: Run the Test Suite

Verify everything works:

```bash
cd odse/src/python
python -m pytest tests/ -v
```

You should see all tests pass, including the new consumption and net metering validation tests.

## Next Steps

You now know how to transform, validate, and work with both generation and consumption data. Explore further:

- **[Schema Reference](/schemas/overview)** — Full field definitions for energy-timeseries and asset-metadata
- **[Transforms](/transforms/supported-oems)** — Support matrix for all 10 OEMs
- **[Building Integration](/building-integration/comstock-resstock)** — Join ODS-E data to NREL benchmarks for EUI analysis
- **[Validation](/validation/overview)** — Schema and semantic validation details
- **[Contributing](https://github.com/AsobaCloud/odse/blob/main/CONTRIBUTING.md)** — Add OEM transforms and improve the spec
