---
title: "CLI Walkthrough"
layout: default
parent: "Build"
nav_order: 5
---

# CLI Walkthrough

This guide walks through every `odse` CLI command with real examples using the sample data fixtures shipped in the repo.

## Prerequisites

```bash
pip install odse

# For Parquet output:
pip install odse[parquet]

# Get the sample data:
git clone https://github.com/AsobaCloud/odse.git
cd odse
```

All examples below assume you're in the repo root.

---

## Transform Commands

### Basic OEM Transform

Transform a Huawei FusionSolar CSV to ODS-E JSON:

```bash
odse transform --source huawei --input examples/data/huawei_fusionsolar_24h.csv
```

Output (to stdout):
```json
[
  {
    "timestamp": "2026-02-09T00:00:00Z",
    "kWh": 0.0,
    "error_type": "normal",
    "error_code": "512"
  },
  ...
]
```

### Save to File

```bash
odse transform --source huawei \
  --input examples/data/huawei_fusionsolar_24h.csv \
  -o output/huawei_normalized.json
```

### Set Asset ID and Timezone

```bash
odse transform --source huawei \
  --input examples/data/huawei_fusionsolar_24h.csv \
  --asset-id SITE-CPT-001 \
  --timezone +02:00 \
  -o output/huawei_sast.json
```

### Output as CSV

```bash
odse transform --source huawei \
  --input examples/data/huawei_fusionsolar_24h.csv \
  --format csv
```

Prints CSV with ODS-E field names as headers to stdout.

### Output as Parquet

```bash
odse transform --source huawei \
  --input examples/data/huawei_fusionsolar_24h.csv \
  --format parquet \
  -o output/huawei_parquet/
```

Requires `pip install odse[parquet]`.

### Generic CSV with Column Mapping

For data sources that aren't one of the 10 supported OEMs, use `--source generic_csv` with `--column-map`:

```bash
odse transform --source generic_csv \
  --input examples/data/generic_historian_7d.csv \
  --column-map "timestamp=Timestamp,kWh=ActiveEnergy_kWh,asset_id=SiteTag" \
  -o output/historian_normalized.json
```

The `--column-map` format is `odse_field=csv_column,odse_field=csv_column,...`. At minimum, `timestamp=` must be specified.

---

## Validate Commands

### Schema Validation

Validate ODS-E records at the default schema level:

```bash
odse validate --input output/huawei_normalized.json
```

Output:
```json
{
  "total": 264,
  "passed": 264,
  "failed": 0,
  "errors": [],
  "warnings": []
}
```

Exit code 0 means all records passed.

### Semantic Validation

Check physical plausibility with system capacity:

```bash
odse validate --input output/huawei_normalized.json \
  --level semantic \
  --capacity-kw 10
```

Semantic validation adds warnings for records where energy exceeds what the capacity allows.

### Profile Validation

Validate against a conformance profile (records must include the required market context fields):

```bash
odse validate --input output/enriched_bilateral.json \
  --profile bilateral
```

If records are missing required profile fields (e.g., `seller_party_id`), the report shows `PROFILE_FIELD_MISSING` errors and exits with code 1.

Available profiles: `bilateral`, `wheeling`, `sawem_brp`, `municipal_recon`.

---

## Version

```bash
odse version
# 0.4.0

odse --version
# odse 0.4.0
```

---

## Error Cases

### File Not Found

```bash
odse transform --source huawei --input nonexistent.csv
# Error: file not found: nonexistent.csv
# (exit code 1)
```

### Unknown Source

```bash
odse transform --source unknown_oem --input data.csv
# Error: transform failed: Unknown source 'unknown_oem'. Supported sources: [...]
# (exit code 1)
```

### Invalid JSON Input

```bash
echo "not json" > /tmp/bad.json
odse validate --input /tmp/bad.json
# Error: invalid JSON input: Expecting value: line 1 column 1 (char 0)
# (exit code 1)
```

### Missing Column Mapping

```bash
odse transform --source generic_csv --input data.csv
# Error: transform failed: Generic CSV transformer requires a 'mapping' argument.
# (exit code 1)
```

### Parquet Without Dependencies

```bash
odse transform --source huawei --input data.csv --format parquet -o out/
# Error: pandas is required for to_parquet(). Install with: pip install odse[parquet]
# (exit code 1)
```

---

## Piping Commands

Transform and validate in one pipeline:

```bash
# Transform to file, then validate
odse transform --source huawei \
  --input examples/data/huawei_fusionsolar_24h.csv \
  -o /tmp/records.json

odse validate --input /tmp/records.json --level semantic --capacity-kw 10
```

---

## Related Docs

- [Python SDK Reference](/docs/reference/python-sdk) — Full API documentation
- [Get Started](/docs/get-started) — 5-minute quickstart
- [Multi-OEM Transform Tutorial](/docs/tutorials/multi-oem-transform) — Side-by-side OEM comparison
- [Architecture & Core Concepts](/docs/concepts/architecture) — Data flow and concepts
