---
title: "pvlib Integration"
layout: default
parent: "Build"
nav_order: 2
---

# pvlib-python Integration

Bridge ODS-E normalized telemetry directly into `pvlib-python`-compliant DataFrame structures for photovoltaic simulation, cell temperature estimation, and Performance Ratio (PR) calculations.

The `odse.adapters.pvlib` module implements a zero-drift, bidirectional adapter aligned with `pvlib.iotools` conventions:
- **`odse_to_pvlib()`**: Ingests ODS-E telemetry and returns a two-element tuple `(data: pd.DataFrame, metadata: dict)`.
- **`pvlib_to_odse()`**: Exports simulated or post-processed pvlib DataFrames back into standard ODS-E JSON dictionary payloads.

---

## Installation

Install ODS-E with the optional `pvlib` extra:

```bash
pip install "odse[pvlib]"
```

This installs `pvlib>=0.10.0` and `pandas>=1.5.0`. The core `odse` package remains lightweight and importable without heavy scientific dependencies.

---

## Python API Walkthrough

### 1. Ingest ODS-E Telemetry to pvlib DataFrame

`odse_to_pvlib()` accepts a file path (`str` or `Path`), a raw JSON/JSONL string, or an in-memory dictionary/list:

```python
from odse.adapters.pvlib import odse_to_pvlib

# Ingest from file (JSON or JSONL)
df, metadata = odse_to_pvlib("examples/data/solar_plant_telemetry.json")

print(metadata)
# {'site_id': 'solarpark-01', 'capacity_kw': 5000.0}

print(df.head())
```

The resulting DataFrame is indexed with a chronologically sorted **UTC `DatetimeIndex`** and standardized column names (`p_mp`, `poa_global`, `temp_air`, etc.).

### 2. Run Scientific Calculations with pvlib

Use standard `pvlib` physics models directly on the converted DataFrame:

```python
import pvlib

# Calculate cell temperature from Plane-of-Array irradiance and ambient temperature
cell_temp = pvlib.temperature.pvsyst_cell(
    poa_global=df["poa_global"],
    temp_air=df["temp_air"],
    wind_speed=df.get("wind_speed", 1.0)
)

df["temp_cell"] = cell_temp
```

### 3. Export Back to ODS-E Payload

Export the simulated results back into canonical ODS-E interchange JSON for data lake storage, downstream APIs, or dispatch:

```python
from odse.adapters.pvlib import pvlib_to_odse

odse_payload = pvlib_to_odse(
    df,
    site_id="solarpark-01",
    metadata=metadata
)

# Returns standard ODS-E dict with 'metadata' and 'telemetry' array
print(f"Exported {len(odse_payload['telemetry'])} records with schema version {odse_payload['metadata']['schema_version']}")
```

---

## CLI Usage

ODS-E includes a top-level `to-pvlib` CLI subcommand (also aliased as `pvlib`):

```bash
# Convert ODS-E JSON/JSONL to CSV with pvlib column headers
odse to-pvlib --input telemetry.json --output pvlib_dataset.csv --format csv

# Convert JSONL stream from stdin, dropping inverter fault/offline rows
cat stream.jsonl | odse to-pvlib -i - --drop-invalid --format json > clean_pvlib.json

# Alternatively invoke via the Python module entry point
python -m odse.adapters.pvlib telemetry.json -o pvlib_data.csv -f csv
```

### CLI Arguments

| Argument | Description | Default |
|---|---|---|
| `-i, --input` | Input ODS-E JSON/JSONL file path, or `-` for stdin | *(required)* |
| `-o, --output` | Output file path | `stdout` |
| `-f, --format` | Output format: `json`, `csv`, or `parquet` | `json` |
| `--no-map-variables` | Disable renaming ODS-E keys to pvlib column names | `False` |
| `--drop-invalid` | Drop rows where `error_type` is `fault` or `offline` | `False` |

---

## Canonical Field Mapping Matrix

Incoming ODS-E fields are mapped to standard `pvlib` columns according to the following strict matrix:

| ODS-E Canonical Key | Target `pvlib` Column Name | Unit / Type | Description |
|---|---|---|---|
| `active_power_kW` | `p_mp` | kW (float) | AC Active Power Output |
| `kWh` | `ac_energy` | kWh (float) | Cumulative AC Energy |
| `poa_irradiance` | `poa_global` | W/m² (float) | Plane-of-Array Irradiance |
| `ghi` | `ghi` | W/m² (float) | Global Horizontal Irradiance |
| `dni` | `dni` | W/m² (float) | Direct Normal Irradiance |
| `dhi` | `dhi` | W/m² (float) | Diffuse Horizontal Irradiance |
| `ambient_temperature_c` | `temp_air` | °C (float) | Ambient Temperature |
| `module_temperature_c` | `temp_cell` | °C (float) | Module / Cell Temperature |
| `wind_speed_ms` | `wind_speed` | m/s (float) | Wind Speed |
| `dc_voltage_v` | `v_dc` | V (float) | Array DC Voltage |
| `dc_current_a` | `i_dc` | A (float) | Array DC Current |

*Note: Any unmapped OEM or custom columns (e.g. `soc`, `soh`, `string_current`) pass through into the DataFrame unchanged.*

---

## Edge Cases & Troubleshooting Guide

When bridging real-world SCADA logger data into scientific modeling tools like `pvlib`, small differences in equipment nomenclature and logging frequencies can cause pipeline errors. Here are the common edge cases and how to troubleshoot them:

### 1. Missing `p_mp` in pvlib Models (Energy vs. Instantaneous Power)
* **Symptom**: `pvlib.ModelChain` or inverter efficiency routines fail with `KeyError: 'p_mp'`.
* **Root Cause**: Many SCADA loggers only export 5-minute cumulative energy (`kWh`), not instantaneous power (`kW`). ODS-E strictly maps `kWh` $\rightarrow$ `ac_energy` and `active_power_kW` $\rightarrow$ `p_mp`. The adapter does not guess values.
* **Troubleshooting**: If your logger only provides `kWh`, calculate active power prior to running pvlib:
  $$\text{active\_power\_kW} = \frac{\text{kWh}}{\text{interval\_hours}}$$
  *(e.g., for a 5-minute interval: `active_power_kW = kWh * 12.0`)*.

### 2. OEM Casing & Non-Standard Key Passthrough
* **Symptom**: Columns such as `active_power_kw` (lowercase `w`) or `active_power` (in Watts) remain in the DataFrame and are not converted to `p_mp`.
* **Root Cause**: ODS-E canonical specification strictly defines unit-suffixed camelCase keys (`active_power_kW`, `dc_voltage_v`, `dc_current_a`). To prevent data loss, unmapped keys pass through unchanged.
* **Troubleshooting**: Check your transform pipeline (`transforms/*.yaml`) to ensure upstream output fields match the canonical ODS-E key `active_power_kW`.

### 3. Plane-of-Array (`poa_irradiance`) vs. Horizontal Irradiance (`ghi`)
* **Symptom**: A pvlib function expecting `poa_global` fails because only `ghi` exists, or vice-versa.
* **Root Cause**: Commercial rooftop sites often only have horizontal pyranometers (`ghi`), whereas utility-scale solar farms mount pyranometers in plane with the array (`poa_irradiance`).
* **Troubleshooting**: If your site data only has `ghi`, run pvlib's transposition algorithms (`pvlib.irradiance.get_total_irradiance`) using site coordinates, tilt, and azimuth to compute `poa_global` before invoking cell temperature or PR models.

### 4. Timezone Offsets and UTC Normalization
* **Symptom**: Solar elevation calculations are inverted or shifted (e.g., peak solar noon occurring at night).
* **Root Cause**: Inconsistent timezone offsets in OEM CSVs (e.g., local daylight saving time or untagged offsets).
* **Adapter Guarantee**: `odse_to_pvlib()` enforces UTC alignment. All ISO-8601 strings (e.g. `+02:00`, `-05:00`, `Z`) are converted to a sorted UTC `pd.DatetimeIndex`. When exported back via `pvlib_to_odse()`, timestamps are written as standard UTC ISO-8601 strings with a `Z` suffix.

### 5. Missing Mandatory `timestamp`
* **Symptom**: `KeyError: "ODS-E telemetry record is missing the mandatory 'timestamp' field."`
* **Root Cause**: An ingested row or batch has a null or missing timestamp key.
* **Troubleshooting**: Run `odse validate --input <file>` to find and remove malformed records.

### 6. Nighttime `NaN` Sanitization
* **Symptom**: JSON export fails or outputs non-standard `NaN` tokens.
* **Root Cause**: Solar sensor timeseries naturally contain `NaN` during nighttime intervals.
* **Adapter Guarantee**: `pvlib_to_odse()` automatically sanitizes `NaN` values to `None`, producing compliant JSON `null` values.

### 7. Unnamed DatetimeIndexes in Custom DataFrames
* **Symptom**: Custom scripts fail with `KeyError: 'timestamp'` when resetting index.
* **Root Cause**: DataFrames created via `pd.date_range()` default to `df.index.name = None`.
* **Adapter Guarantee**: `pvlib_to_odse()` safely extracts timestamps without assuming index names.

---

## Agent & MCP Server Integration

AI coding agents and automation workflows can invoke pvlib transformation directly via the official npm package [`@asobacloud/odse-mcp`](https://www.npmjs.com/package/@asobacloud/odse-mcp):

```json
{
  "mcpServers": {
    "odse": {
      "command": "npx",
      "args": ["-y", "@asobacloud/odse-mcp"]
    }
  }
}
```

See [MCP Server Overview](/docs/mcp) and [Using with AI Agents](/docs/mcp/using-with-ai-agents) for complete configuration instructions.
