---
title: "OpenOA Integration"
layout: default
parent: "Build"
nav_order: 3
---

# OpenOA Integration

Bridge ODS-E normalized telemetry directly into NREL's OpenOA (Open Operational Assessment) scientific framework for wind plant operational analysis, annual energy production (AEP) estimation, wake loss analysis, and electrical loss calculations.

The `odse.adapters.openoa` module provides a zero-drift, bidirectional adapter aligned with OpenOA conventions:
- **`odse_to_openoa()`**: Ingests ODS-E telemetry payloads and produces UTC-indexed pandas DataFrames (`scada`, `tower`, `meter`) or an OpenOA `PlantData` object.
- **`openoa_to_odse()`**: Exports analyzed or simulated OpenOA DataFrames back into standard ODS-E JSON dictionary payloads with sanitized null values.

---

## Installation

Install ODS-E with the optional `openoa` extra:

```bash
pip install "odse[openoa]"
```

This installs `openoa>=2.0.0` and `pandas>=1.5.0`. The core `odse` package remains lightweight and importable without scientific dependencies.

---

## Python API Walkthrough

### 1. Ingest ODS-E Telemetry to OpenOA DataFrames

`odse_to_openoa()` accepts a file path (`str` or `Path`), a raw JSON/JSONL string, or an in-memory dictionary/list:

```python
from odse.adapters.openoa import odse_to_openoa

# Ingest SCADA telemetry from file
result = odse_to_openoa("wind_telemetry.json", table_type="scada", return_plantdata=False)

df_scada = result["scada"]
metadata = result["metadata"]

print(metadata)
# {'site_id': 'windfarm-alpha', 'turbines': 12}

print(df_scada.head())
```

The resulting DataFrame is indexed with a chronologically sorted **UTC `DatetimeIndex`** and standardized column names (`WMET_HorWdSpd`, `pitch_angle`, `rotor_rpm`, `generator_rpm`, etc.).

### 2. Multi-Table Assembly

When assembling an entire wind plant dataset across SCADA, met tower, and revenue meter:

```python
from odse.adapters.openoa import odse_to_openoa

# Ingest multi-table dictionary payload
plant_tables = odse_to_openoa({
    "scada": scada_payload,
    "tower": met_mast_payload,
    "meter": grid_meter_payload,
}, return_plantdata=False)

df_scada = plant_tables["scada"]
df_tower = plant_tables["tower"]
df_meter = plant_tables["meter"]
```

### 3. Export Back to Canonical ODS-E

Export simulated or filtered DataFrames back to standard ODS-E JSON dictionary payloads:

```python
from odse.adapters.openoa import openoa_to_odse
import json

# Export DataFrame to ODS-E payload
odse_payload = openoa_to_odse(df_scada, asset_id="WTG01", metadata={"plant": "windfarm-alpha"})

# Save to disk
with open("export_openoa_odse.json", "w") as f:
    json.dump(odse_payload, f, indent=2)
```

---

## CLI Usage

ODS-E provides first-class CLI commands for operational workflows:

```bash
# Convert ODS-E telemetry to OpenOA table format
odse to-openoa wind_scada.json --table scada --output openoa_scada.json

# Using alias
odse openoa wind_scada.json --table scada --output openoa_scada.json
```

---

## Canonical Field Mapping

### SCADA Table Mapping

| ODS-E Canonical Key | OpenOA SCADA Column Name | Unit / Type | Description |
|---|---|---|---|
| `timestamp` | `time` / DatetimeIndex | UTC datetime | Telemetry timestamp (UTC) |
| `asset_id` | `asset_id` | string | Turbine identifier (e.g. `WTG01`) |
| `active_power_kW` | `WMET_HorWdSpd` / `wtg_power` | kW (float) | Turbine Active Power |
| `wind_speed_ms` | `WMET_HorWdSpd` / `wtg_windspeed` | m/s (float) | Nacelle Wind Speed |
| `wind_direction_deg` | `WMET_HorWdDir` / `wtg_winddirection` | degrees (float) | Wind Direction |
| `pitch_angle_deg` | `pitch_angle` | degrees (float) | Blade Pitch Angle |
| `generator_rpm` | `generator_rpm` | RPM (float) | Generator Rotational Speed |
| `rotor_rpm` | `rotor_rpm` | RPM (float) | Rotor Rotational Speed |
| `ambient_temperature_c` | `temp_air` | °C (float) | Ambient Temperature |
| `nacelle_position_deg` | `nacelle_position` | degrees (float) | Nacelle Yaw Orientation |

### Met Tower Table Mapping

| ODS-E Canonical Key | OpenOA Tower Column Name | Unit / Type | Description |
|---|---|---|---|
| `timestamp` | `time` / DatetimeIndex | UTC datetime | Measurement timestamp (UTC) |
| `wind_speed_ms` | `WMET_HorWdSpd` | m/s (float) | Met Mast Wind Speed |
| `wind_direction_deg` | `WMET_HorWdDir` | degrees (float) | Met Mast Wind Direction |
| `ambient_temperature_c` | `temp_air` | °C (float) | Air Temperature |
| `surface_pressure_pa` | `pressure` | Pa (float) | Atmospheric Pressure |

### Revenue Meter Table Mapping

| ODS-E Canonical Key | OpenOA Meter Column Name | Unit / Type | Description |
|---|---|---|---|
| `timestamp` | `time` / DatetimeIndex | UTC datetime | Timestamp (UTC) |
| `active_power_kW` | `net_power` | kW (float) | Net Grid Active Power |
| `kWh` | `ac_energy` | kWh (float) | Cumulative Meter Energy |

---

## Edge Cases & Troubleshooting Guide

### Edge Case 1: Inverter / Turbine OEM Power Casing & Custom Naming
* **Symptom:** Columns like `active_power_kw` (lowercase `w`) or `Power_kW` remain unchanged in the DataFrame and are not recognized by OpenOA analysis routines.
* **Root Cause:**
  - ODS-E canonical specification strictly requires camelCase unit suffixes: `active_power_kW`, `wind_speed_ms`, `pitch_angle_deg`.
  - Unmapped columns are preserved without throwing errors (passthrough behavior) to prevent data loss.
* **Troubleshooting & Fix:**
  - Check your transform configuration (`transforms/*.yaml`). Ensure the target field is named `active_power_kW`.
  - Run `odse validate --input <file>` before adapter ingestion.

### Edge Case 2: Multi-Turbine `asset_id` Partitioning
* **Symptom:** In datasets containing multiple wind turbines, OpenOA analysis routines report duplicate timestamps or invalid index structure.
* **Root Cause:**
  - OpenOA expects either a composite index `(time, asset_id)` or an explicit `asset_id` column partitioned across turbine instances.
* **Troubleshooting & Fix:**
  - Always include `asset_id` (e.g. `"WTG01"`, `"WTG02"`) in ODS-E telemetry records when aggregating wind farm payloads.
  - When converting back via `openoa_to_odse(df, asset_id="WTG01")`, supply the `asset_id` parameter if the DataFrame index does not retain it.

### Edge Case 3: Negative Power vs. Curtailment
* **Symptom:** Inverters and turbines consume small amounts of power during calm or standstill periods (station service / heating), resulting in negative active power values (`active_power_kW < 0`), or zero power during grid curtailment events.
* **Root Cause:**
  - Standard physical sensor readings can record negative values (`-2.5 kW`). If an assessment pipeline assumes power $\ge 0$, calculations may raise mathematical or filtering errors.
* **Troubleshooting & Fix:**
  - Do not drop negative values blindly; negative power represents real auxiliary consumption.
  - For wind turbine power curve fitting, filter out negative power and curtailment flags in downstream OpenOA filters: `df[df["active_power_kW"] >= 0]`.

### Edge Case 4: Anemometer Yaw Offset and Wind Direction Wrapping
* **Symptom:** Wind direction values jump from $359^\circ$ to $0^\circ$, causing gradient anomalies or yaw alignment errors in OpenOA.
* **Root Cause:**
  - Compass wind directions wrap at $360^\circ$. Some OEM loggers output $-180^\circ$ to $+180^\circ$, while ODS-E standardizes on $0^\circ$ to $360^\circ$.
* **Troubleshooting & Fix:**
  - Ensure upstream normalization calculates modulo $360^\circ$: `(wind_direction_deg % 360)`.
  - When interpreting nacelle position relative to wind direction (yaw error), compute angular difference using circular subtraction:
    $$\text{yaw\_error} = (\text{wind\_dir} - \text{nacelle\_pos} + 180) \pmod{360} - 180$$

### Edge Case 5: Timezone Normalization and Offsets
* **Symptom:** Diurnal wind patterns are shifted by several hours in OpenOA assessments.
* **Root Cause:**
  - OEM SCADA files frequently record local plant time without ISO-8601 offset strings (e.g. `2026-06-01 12:00:00`).
* **Adapter Behavior:**
  - `odse_to_openoa()` strictly enforces UTC. Parsed timestamps are converted to UTC and indexed as a sorted `pd.DatetimeIndex`.
* **Troubleshooting & Fix:**
  - Provide ISO-8601 timestamps with explicit UTC offsets (`+02:00` or `Z`).
  - `openoa_to_odse()` serializes all timestamps back into standard UTC ISO format: `YYYY-MM-DDTHH:MM:SSZ`.

### Edge Case 6: Missing Mandatory `timestamp`
* **Symptom:** Function raises `KeyError: "ODS-E telemetry record is missing the mandatory 'timestamp' field."`
* **Root Cause:**
  - A row or batch in the telemetry payload has an empty or missing `timestamp` key.
* **Troubleshooting & Fix:**
  - Every ODS-E telemetry record must possess a valid `timestamp`. Use `odse validate --input <file>` to verify payload compliance.

### Edge Case 7: Non-Standard `NaN` Values in JSON Output
* **Symptom:** JSON export fails or outputs non-standard `NaN` / `Infinity` literals rejected by strict JSON parsers.
* **Root Cause:**
  - SCADA sensors frequently experience communication dropouts or periods of standstill, generating `NaN` values in pandas DataFrames.
* **Adapter Behavior:**
  - `openoa_to_odse()` replaces all `NaN` values with `None`, serializing cleanly to standard JSON `null`.
* **Troubleshooting & Fix:**
  - Downstream consumers can rely on `null` in JSON output. If non-null values are required, apply interpolation (`df.interpolate()`) before exporting.
