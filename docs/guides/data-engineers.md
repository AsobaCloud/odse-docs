---
title: "Data Engineer Integration Guide"
layout: default
---

# Data Engineer Integration Guide

This guide shows how ODS-E fits into a typical energy data pipeline — from SCADA export to analytics-ready Parquet. It's written for data engineers who need to ingest heterogeneous solar production data from multiple OEMs and normalize it for downstream analytics.

## Where ODS-E Fits

```
┌─────────────┐     ┌─────────────┐     ┌───────────┐     ┌──────────┐     ┌──────────────┐
│  SCADA /     │     │  Extract    │     │  ODS-E    │     │  Store   │     │  Analytics   │
│  OEM Portal  │────▶│  (CSV/JSON) │────▶│  Pipeline │────▶│  (Lake)  │────▶│  (BI / ML)   │
│              │     │             │     │           │     │          │     │              │
│ FusionSolar  │     │ Scheduled   │     │ Transform │     │ Parquet  │     │ PowerBI      │
│ Enlighten    │     │ API pulls   │     │ Validate  │     │ S3/GCS   │     │ Jupyter      │
│ SolarEdge    │     │ FTP drops   │     │ Enrich    │     │ BigQuery │     │ dbt          │
└─────────────┘     └─────────────┘     └───────────┘     └──────────┘     └──────────────┘
```

ODS-E handles the middle step: normalizing raw OEM data into a single schema, validating it, and writing it to storage. Everything before (extraction) and after (analytics) stays in your existing stack.

## Step 1: Read and Transform

Each OEM uses different column names, units, and timestamp formats. ODS-E normalizes all of them.

```python
from pathlib import Path
from odse import transform

# Process a directory of OEM exports
data_dir = Path("/data/incoming/2026-02-09/")

# Each file might come from a different OEM
huawei_rows = transform(data_dir / "site_alpha.csv", source="huawei", asset_id="SITE-ALPHA")
enphase_rows = transform(data_dir / "site_beta.json", source="enphase", asset_id="SITE-BETA", expected_devices=12)

# All rows now have the same schema: timestamp, kWh, error_type, ...
```

For OEMs not in the built-in list, use the generic CSV mapper:

```python
rows = transform(data_dir / "scada_export.csv", source="csv", mapping={
    "timestamp": "Timestamp",
    "kWh": "ActiveEnergy_kWh",
    "asset_id": "SiteTag",
    "extra": {"kVAr": "ReactivePower_kVAr"},
})
```

See the [Python SDK Reference](/docs/reference/python-sdk) for all `transform()` parameters.

## Step 2: Validate

Run schema validation to catch malformed records before they enter your data lake.

```python
from odse import validate_batch

result = validate_batch(huawei_rows)
if result.invalid > 0:
    for idx, error in result.errors:
        print(f"  Row {idx}: {error.code} — {error.message}")
    raise RuntimeError(f"{result.invalid} invalid records")
```

For physical plausibility checks, add semantic validation:

```python
result = validate_batch(huawei_rows, level="semantic", capacity_kw=10.0)
for idx, warning in result.errors:
    print(f"  Row {idx}: {warning.message}")
```

## Step 3: Enrich (Optional)

If records need market context (settlement metadata, tariff info), inject it before writing:

```python
from odse import enrich

enriched = enrich(huawei_rows, {
    "seller_party_id": "nersa:gen:SOLARPK-001",
    "settlement_type": "bilateral",
    "tariff_currency": "ZAR",
})
```

## Step 4: Write to Storage

### Partitioned Parquet (Recommended)

```python
from odse import to_parquet

all_rows = huawei_rows + enphase_rows
to_parquet(all_rows, "/data/lake/energy/", partition_by=["asset_id", "year", "month", "day"])
```

This creates a Hive-partitioned directory structure:

```
/data/lake/energy/
├── asset_id=SITE-ALPHA/year=2026/month=02/day=09/part-00000.parquet
└── asset_id=SITE-BETA/year=2026/month=02/day=09/part-00000.parquet
```

Compatible with Spark, BigQuery external tables, AWS Athena, DuckDB, and pandas.

### JSONL (For Traceability)

```python
from odse import to_json

to_json(all_rows, "/data/archive/2026-02-09.jsonl")
```

### CSV (For Legacy Systems)

```python
from odse import to_csv

to_csv(all_rows, "/data/export/2026-02-09.csv")
```

## Complete Batch Pipeline

Here's a full pipeline that processes a directory of mixed-OEM exports:

```python
from pathlib import Path
from odse import transform, validate_batch, enrich, to_parquet

# Configuration
SITES = {
    "SITE-ALPHA": {"source": "huawei", "seller": "nersa:gen:ALPHA"},
    "SITE-BETA":  {"source": "enphase", "seller": "nersa:gen:BETA", "expected_devices": 12},
    "SITE-GAMMA": {"source": "solaredge", "seller": "nersa:gen:GAMMA"},
}

data_dir = Path("/data/incoming/2026-02-09/")
all_records = []

for site_id, cfg in SITES.items():
    # Find the file for this site
    files = list(data_dir.glob(f"{site_id}.*"))
    if not files:
        print(f"SKIP {site_id}: no file found")
        continue

    # Transform
    kwargs = {k: v for k, v in cfg.items() if k not in ("source", "seller")}
    rows = transform(files[0], source=cfg["source"], asset_id=site_id, **kwargs)

    # Validate
    result = validate_batch(rows, level="semantic", capacity_kw=10.0)
    print(f"{site_id}: {result.summary}")
    if result.invalid > 0:
        print(f"  WARNING: {result.invalid} invalid records skipped")
        rows = [r for i, r in enumerate(rows) if i not in {idx for idx, _ in result.errors}]

    # Enrich
    rows = enrich(rows, {
        "seller_party_id": cfg["seller"],
        "settlement_type": "bilateral",
    })

    all_records.extend(rows)

# Write to lake
to_parquet(all_records, "/data/lake/energy/", partition_by=["asset_id", "year", "month", "day"])
print(f"Wrote {len(all_records)} records to Parquet")
```

## Streaming Large Files

For files too large to fit in memory, use `transform_stream()`:

```python
from odse import transform_stream, validate, to_json
import json

with open("/data/output/large_site.jsonl", "w") as f:
    for record in transform_stream("/data/incoming/large_export.csv", source="huawei"):
        result = validate(record)
        if result.is_valid:
            f.write(json.dumps(record) + "\n")
```

## CLI for Cron Jobs

The CLI works well in shell scripts and cron jobs:

```bash
#!/bin/bash
set -e

DATE=$(date +%Y-%m-%d)
INPUT_DIR="/data/incoming/$DATE"
OUTPUT_DIR="/data/lake/energy"

# Transform each source
odse transform --source huawei \
  --input "$INPUT_DIR/site_alpha.csv" \
  --asset-id SITE-ALPHA \
  --format parquet \
  -o "$OUTPUT_DIR/"

odse transform --source enphase \
  --input "$INPUT_DIR/site_beta.json" \
  --asset-id SITE-BETA \
  --format parquet \
  -o "$OUTPUT_DIR/"

# Validate
odse validate --input "$OUTPUT_DIR/site_alpha.json" --level semantic --capacity-kw 10
odse validate --input "$OUTPUT_DIR/site_beta.json" --level semantic --capacity-kw 10
```

See the [CLI Walkthrough](/docs/guides/cli-walkthrough) for all commands and flags.

## Common Patterns

### Incremental Processing

Track the last-processed timestamp to avoid reprocessing:

```python
import json
from pathlib import Path

state_file = Path("/data/state/last_run.json")

# Load state
if state_file.exists():
    state = json.loads(state_file.read_text())
    last_ts = state.get("last_timestamp")
else:
    last_ts = None

# Transform new data
rows = transform("new_export.csv", source="huawei", asset_id="SITE-001")

# Filter to only new records
if last_ts:
    rows = [r for r in rows if r["timestamp"] > last_ts]

if rows:
    to_parquet(rows, "/data/lake/energy/", partition_by=["asset_id", "year", "month"])
    # Save state
    state_file.parent.mkdir(parents=True, exist_ok=True)
    state_file.write_text(json.dumps({"last_timestamp": rows[-1]["timestamp"]}))
    print(f"Wrote {len(rows)} new records")
```

### Multi-Format Ingest

When sites deliver data in different formats:

```python
SOURCE_MAP = {
    ".csv": "huawei",     # Huawei exports as CSV
    ".json": "enphase",   # Enphase API returns JSON
}

for file in data_dir.iterdir():
    source = SOURCE_MAP.get(file.suffix)
    if source:
        rows = transform(file, source=source, asset_id=file.stem)
```

## Related Docs

- [Architecture & Core Concepts](/docs/concepts/architecture) — Data flow and pipeline patterns
- [Python SDK Reference](/docs/reference/python-sdk) — Full API documentation
- [CLI Walkthrough](/docs/guides/cli-walkthrough) — Every CLI command with examples
- [Multi-OEM Transform Tutorial](/docs/tutorials/multi-oem-transform) — Side-by-side OEM comparison
- [Bring Your Own Data](/docs/tutorials/bring-your-own-data) — Use your own CSV files
