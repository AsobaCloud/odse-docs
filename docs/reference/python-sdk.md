---
title: "Python SDK Reference"
layout: default
---

# Python SDK Reference

Complete API reference for the `odse` Python package. Install with `pip install odse`.

```python
import odse
print(odse.__version__)  # "0.4.0"
```

## Transform

### `transform(data, source, asset_id=None, timezone=None, **kwargs)`

Transform OEM data to ODS-E records.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `data` | `str` or `Path` | required | File path or raw data string (CSV or JSON) |
| `source` | `str` | required | OEM source identifier (see table below) |
| `asset_id` | `str` | `None` | Asset identifier to include in each record |
| `timezone` | `str` | `None` | Timezone offset (e.g., `"+02:00"`) for naive timestamps |
| `**kwargs` | | | Source-specific arguments (see below) |

**Returns:** `List[Dict[str, Any]]` — list of ODS-E records.

**Raises:** `ValueError` if `source` is not recognized.

**Supported sources:**

| Source | Aliases | Input Format | Source-Specific kwargs |
|--------|---------|-------------|----------------------|
| Huawei FusionSolar | `huawei` | CSV | `interval_minutes` (default: 5) |
| Enphase Enlighten | `enphase` | JSON | `expected_devices` (int) |
| Solarman | `solarman` | CSV | `interval_minutes` |
| Switch | `switch` | CSV | |
| SolaX Cloud | `solaxcloud`, `solax` | JSON | |
| Fimer/Aurora Vision | `fimer`, `auroravision` | JSON | |
| SolarEdge | `solaredge` | JSON | `interval_minutes` |
| Fronius | `fronius` | JSON | |
| SMA | `sma` | JSON | `interval_minutes` |
| Solis | `solis`, `soliscloud` | JSON | `interval_minutes` |
| Generic CSV | `csv`, `generic` | CSV | `mapping` (required), `default_error_type`, `interval_minutes` |

**Example:**

```python
from odse import transform

# OEM-specific
rows = transform("huawei_export.csv", source="huawei", asset_id="SITE-001")

# Generic CSV with column mapping
rows = transform("scada.csv", source="csv", mapping={
    "timestamp": "Timestamp",
    "kWh": "Energy_kWh",
    "asset_id": "SiteTag",
})
```

### `transform_stream(data, source, **kwargs)`

Streaming variant of `transform()`. Yields records one at a time for memory-bounded processing of large files.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `data` | `str` or `Path` | required | File path or raw data string |
| `source` | `str` | required | OEM source identifier |
| `**kwargs` | | | Same as `transform()` |

**Yields:** `Dict[str, Any]` — one ODS-E record at a time.

**Example:**

```python
from odse import transform_stream

for record in transform_stream("large_export.csv", source="huawei"):
    process(record)
```

### Generic CSV `mapping` Format

The `mapping` argument for `source="csv"` can be a dict or a path to a JSON/YAML file:

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `timestamp` | `str` | yes | CSV column name containing timestamps |
| `kWh` | `str` | no | CSV column for energy (if absent, computed from `kW`) |
| `kW` | `str` | no | CSV column for power (used to compute kWh if kWh absent) |
| `error_type` | `str` | no | CSV column for device status |
| `error_code` | `str` | no | CSV column for error/status code |
| `asset_id` | `str` | no | CSV column for asset identifier |
| `extra` | `dict` | no | Map of `{odse_field: csv_column}` for additional numeric fields |

---

## Validate

### `validate(data, level="schema", capacity_kw=None, latitude=None, longitude=None, profile=None)`

Validate a single ODS-E record.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `data` | `dict`, `str`, or `Path` | required | ODS-E record (dict), JSON string, or file path |
| `level` | `str` | `"schema"` | Validation level: `"schema"` or `"semantic"` |
| `capacity_kw` | `float` | `None` | System capacity in kW (for semantic checks) |
| `latitude` | `float` | `None` | Site latitude (for geographic checks) |
| `longitude` | `float` | `None` | Site longitude |
| `profile` | `str` | `None` | Conformance profile name |

**Returns:** `ValidationResult`

```python
@dataclass
class ValidationResult:
    is_valid: bool
    errors: List[ValidationError]
    warnings: List[ValidationError]
    level: str

@dataclass
class ValidationError:
    path: str       # JSONPath, e.g., "$.timestamp"
    message: str    # Human-readable description
    code: str       # Machine-readable code (see below)
```

**Error codes:**

| Code | Meaning |
|------|---------|
| `REQUIRED_FIELD_MISSING` | A required field is absent |
| `TYPE_MISMATCH` | Field has wrong type |
| `ENUM_MISMATCH` | Value not in allowed enum |
| `OUT_OF_BOUNDS` | Numeric value outside valid range |
| `PATTERN_MISMATCH` | String doesn't match required pattern |
| `EXCEEDS_PHYSICAL_MAXIMUM` | kWh exceeds what capacity allows (semantic, warning) |
| `PROFILE_FIELD_MISSING` | Profile-required field is absent |
| `PROFILE_VALUE_MISMATCH` | Field value doesn't match profile constraint |
| `UNKNOWN_PROFILE` | Requested profile doesn't exist |

**Example:**

```python
from odse import validate

result = validate({
    "timestamp": "2026-02-09T14:00:00Z",
    "kWh": 5.0,
    "error_type": "normal",
})
print(result.is_valid)  # True
```

### `validate_file(file_path, level="schema", **kwargs)`

Validate a JSON file containing an ODS-E record.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `file_path` | `str` or `Path` | required | Path to JSON file |
| `level` | `str` | `"schema"` | Validation level |
| `**kwargs` | | | Same as `validate()` |

**Returns:** `ValidationResult`

### `validate_batch(records, level="schema", profile=None, **kwargs)`

Validate a list of records and return aggregate results.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `records` | `List[dict]` | required | List of ODS-E records |
| `level` | `str` | `"schema"` | Validation level |
| `profile` | `str` | `None` | Conformance profile |
| `**kwargs` | | | Additional args passed to `validate()` |

**Returns:** `BatchValidationResult`

```python
@dataclass
class BatchValidationResult:
    total: int                              # Total records validated
    valid: int                              # Records that passed
    invalid: int                            # Records that failed
    errors: List[Tuple[int, ValidationError]]  # (record_index, error) pairs
    summary: str                            # Human-readable summary string
```

**Example:**

```python
from odse import validate_batch

result = validate_batch(records, level="semantic", capacity_kw=10.0)
print(result.summary)  # "3/3 valid (schema)"
```

### `PROFILES`

Dictionary of available conformance profiles. Keys are profile names, values are dicts with `required_fields` and `field_constraints`.

```python
from odse import PROFILES

print(list(PROFILES.keys()))
# ['bilateral', 'wheeling', 'sawem_brp', 'municipal_recon']
```

---

## Enrich

### `enrich(rows, context=None, *, override=False)`

Inject market context metadata into ODS-E records.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `rows` | `List[Dict]` | required | ODS-E records from `transform()` |
| `context` | `dict` or `None` | `None` | Metadata key-value pairs to inject |
| `override` | `bool` (keyword-only) | `False` | If `True`, context values overwrite existing fields |

**Returns:** `List[Dict]` — the same list, modified in place.

**Behavior:**
- `override=False` (default): existing fields in each record are preserved.
- `override=True`: context values overwrite existing fields.
- `None` or `{}` context: returns rows unchanged (no-op).

**Example:**

```python
from odse import transform, enrich

rows = transform("data.csv", source="huawei")
enriched = enrich(rows, {
    "seller_party_id": "nersa:gen:SOLARPK-001",
    "settlement_type": "bilateral",
    "tariff_currency": "ZAR",
})
```

---

## Output

### `to_json(records, output_path)`

Write records as newline-delimited JSON (JSONL).

| Parameter | Type | Description |
|-----------|------|-------------|
| `records` | `Iterable[dict]` | ODS-E records |
| `output_path` | `str` | File path (parent dirs created automatically) |

### `to_csv(records, output_path)`

Write records as CSV with ODS-E field names as headers.

| Parameter | Type | Description |
|-----------|------|-------------|
| `records` | `Iterable[dict]` | ODS-E records |
| `output_path` | `str` | File path |

### `to_parquet(records, output_path, partition_by=None, mode="overwrite")`

Write partitioned Parquet files. Requires `pip install odse[parquet]` (pyarrow + pandas).

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `records` | `Iterable[dict]` | required | ODS-E records |
| `output_path` | `str` | required | Output directory path |
| `partition_by` | `List[str]` | `None` | Fields to partition by (e.g., `["asset_id", "year", "month"]`) |
| `mode` | `str` | `"overwrite"` | `"overwrite"` or `"append"` |

Automatically derives `year`, `month`, `day`, `hour` fields from `timestamp` for partitioning.

**Example:**

```python
from odse import to_parquet

to_parquet(records, "output/lake/", partition_by=["asset_id", "year", "month", "day"])
# Creates: output/lake/asset_id=SITE-001/year=2026/month=02/day=09/part-00000.parquet
```

### `to_dataframe(records)`

Convert records to a pandas DataFrame with canonical dtypes. Requires `pip install odse[dataframe]`.

| Parameter | Type | Description |
|-----------|------|-------------|
| `records` | `Iterable[dict]` | ODS-E records |

**Returns:** `pandas.DataFrame` with `timestamp` as `datetime64[ns, UTC]` and `kWh` as `float64`.

---

## CLI

The `odse` command-line tool is installed with `pip install odse`.

### `odse transform`

```
odse transform --source SOURCE --input FILE [options]
```

| Flag | Short | Required | Description |
|------|-------|----------|-------------|
| `--source` | `-s` | yes | OEM source identifier |
| `--input` | `-i` | yes | Input file path |
| `--output` | `-o` | no | Output file path (default: stdout) |
| `--format` | `-f` | no | Output format: `json` (default), `csv`, `parquet` |
| `--column-map` | | no | Inline column mapping for `generic_csv` (e.g., `timestamp=Ts,kWh=Energy`) |
| `--asset-id` | | no | Asset identifier |
| `--timezone` | | no | Timezone offset (e.g., `+02:00`) |
| `--interval-minutes` | | no | Interval in minutes for kW→kWh conversion (default: 5) |

### `odse validate`

```
odse validate --input FILE [options]
```

| Flag | Short | Required | Description |
|------|-------|----------|-------------|
| `--input` | `-i` | yes | Input JSON file with ODS-E records |
| `--level` | `-l` | no | `schema` (default) or `semantic` |
| `--profile` | `-p` | no | Conformance profile name |
| `--capacity-kw` | | no | System capacity in kW |
| `--latitude` | | no | Site latitude |
| `--longitude` | | no | Site longitude |

**Output:** JSON report to stdout with `total`, `passed`, `failed`, `errors`, `warnings`.

**Exit code:** 0 if all records pass, 1 if any fail.

### `odse version`

Print the installed ODS-E version.

### `odse --version`

Print version in `odse X.Y.Z` format.

---

## Related Docs

- [Architecture & Core Concepts](/docs/concepts/architecture) — Mental model and data flow
- [Get Started](/docs/get-started) — 5-minute quickstart
- [CLI Walkthrough](/docs/guides/cli-walkthrough) — Every CLI command with examples
- [Schema Reference](/docs/schemas/energy-timeseries) — Field-level definitions
