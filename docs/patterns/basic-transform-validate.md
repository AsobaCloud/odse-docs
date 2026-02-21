---
title: "Basic: Transform + Validate"
layout: default
parent: "Patterns"
nav_order: 1
---

# Basic: Transform + Validate

The simplest ODS-E pipeline. Transform one OEM file and validate the output.

## When to Use

You have raw OEM data (CSV or JSON) and want normalized, validated energy records.

## Pipeline

```
Raw OEM data ──► transform(source=...) ──► validate() ──► storage / analytics
```

## Complete Code

```python
from odse import transform, validate_batch, to_json

# 1. Transform OEM data to ODS-E records
rows = transform("huawei_export.csv", source="huawei", asset_id="SITE-001")

# 2. Validate all records
result = validate_batch(rows)
print(result.summary)  # "264/264 valid (schema)"

# 3. Write to storage
to_json(rows, "output/site_001.jsonl")
```

### With Semantic Validation

Add physical plausibility checks by passing the system capacity:

```python
result = validate_batch(rows, level="semantic", capacity_kw=10.0)
if result.invalid > 0:
    for idx, error in result.errors:
        print(f"Row {idx}: {error.message}")
```

### CLI Version

```bash
odse transform --source huawei \
  --input huawei_export.csv \
  --asset-id SITE-001 \
  -o output/site_001.json

odse validate --input output/site_001.json
```

## What to Read Next

- [Multi-OEM Transform Tutorial](/docs/tutorials/multi-oem-transform) — Transform multiple OEMs and compare output
- [Bring Your Own Data](/docs/tutorials/bring-your-own-data) — Generic CSV mapper for non-OEM sources
- [Trading Settlement Pipeline](/docs/patterns/trading-settlement-pipeline) — Add market context before validation
