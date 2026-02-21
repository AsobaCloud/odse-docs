---
title: "Architecture & Core Concepts"
layout: default
---

# Architecture & Core Concepts

This page explains how ODS-E works and where it fits in your data pipeline. Read [What is ODS-E?](/docs/what-is-odse) first for the high-level overview.

## Data Flow

Every ODS-E pipeline follows the same pattern:

```
┌──────────────┐     ┌───────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Raw Source   │────▶│ Transform │────▶│ Validate  │────▶│  Enrich  │────▶│  Output  │
│ (CSV / JSON)  │     │           │     │           │     │          │     │          │
│               │     │ source=   │     │ level=    │     │ context= │     │ format=  │
│ Huawei CSV    │     │ "huawei"  │     │ "schema"  │     │ {seller,  │     │ parquet  │
│ Enphase JSON  │     │ "enphase" │     │ "semantic"│     │  tariff,  │     │ csv      │
│ SCADA export  │     │ "csv"     │     │ profile=  │     │  topo}   │     │ json     │
│               │     │           │     │ "bilateral│     │          │     │          │
└──────────────┘     └───────────┘     └──────────┘     └──────────┘     └──────────┘
                          │                  │                │                │
                     ODS-E Records      ValidationResult  Same Records     File/Stream
                     (list of dicts)    (is_valid, errors) (enriched)
```

Each stage is independent and composable. You can skip enrichment if you don't need market context, or skip output if you're feeding records directly into your own analytics.

## Core Concepts

### Record

The fundamental data unit. An ODS-E record is a Python dictionary with three required fields:

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | ISO 8601 string | When the measurement was taken |
| `kWh` | float | Energy for the interval |
| `error_type` | enum string | Device status: `normal`, `warning`, `critical`, `fault`, `offline`, `standby`, `unknown` |

Records may include dozens of optional fields (power, reactive power, settlement context, tariff data, etc.) depending on the use case. See the [Schema Reference](/docs/schemas/energy-timeseries) for the full list.

### Transform

A transform converts OEM-specific data into ODS-E records. Each OEM has its own column names, units, timestamp formats, and error codes. The transform layer normalizes all of that.

```python
from odse import transform

# Each OEM has a named transform
rows = transform("huawei_export.csv", source="huawei")
rows = transform(enphase_json, source="enphase", expected_devices=10)

# Or use the generic CSV mapper for any source
rows = transform("scada_export.csv", source="csv", mapping={
    "timestamp": "Timestamp",
    "kWh": "Energy_kWh",
    "asset_id": "SiteTag",
})
```

ODS-E ships with transforms for 10 OEMs (Huawei, Enphase, Solarman, SolarEdge, Fronius, SMA, Solis, SolaX, Fimer, Switch) plus a generic CSV mapper for arbitrary sources.

See [Supported OEMs](/docs/transforms/supported-oems) for the full matrix.

### Validation

Validation checks that records conform to the ODS-E schema. There are three layers, each catching different problems:

| Level | What It Checks | Example Catch |
|-------|---------------|---------------|
| **Schema** | Required fields, types, enums, bounds | Missing `timestamp`, `kWh` is a string, `error_type` is `"bad"` |
| **Semantic** | Physical plausibility, cross-field consistency | 500 kWh from a 10 kW system in 5 minutes |
| **Profile** | Required fields for a specific trading context | Bilateral trade missing `seller_party_id` |

```python
from odse import validate

# Schema validation (default)
result = validate(record)

# Semantic validation with capacity context
result = validate(record, level="semantic", capacity_kw=10.0)

# Profile validation for SA bilateral trading
result = validate(record, profile="bilateral")
```

See [Validation Overview](/docs/validation/overview) for details on each level.

### Conformance Profiles

A conformance profile is a named set of required fields for a specific trading or regulatory context. Profiles sit on top of schema validation — they enforce that records carry the metadata needed for a particular market process.

| Profile | Context | Key Required Fields |
|---------|---------|-------------------|
| `bilateral` | SA bilateral PPA trade | seller/buyer party IDs, settlement period, contract reference |
| `wheeling` | SA virtual/physical wheeling | All bilateral fields + network operator, injection/offtake points |
| `sawem_brp` | SA wholesale market (SAWEM) | BRP ID, forecast kWh, settlement type |
| `municipal_recon` | SA municipal reconciliation | Buyer party ID, billing period, billed kWh, billing status |

See [Conformance Profiles](/docs/validation/conformance-profiles) for field-level details.

### Enrichment

Transforms produce bare telemetry — just `timestamp`, `kWh`, and `error_type`. Market-ready records need additional context: who sold the energy, what tariff applies, where the meter is on the network. The `enrich()` function injects this context.

```python
from odse import enrich

enriched = enrich(rows, {
    "seller_party_id": "nersa:gen:SOLARPK-001",
    "settlement_type": "bilateral",
    "tariff_period": "peak",
    "tariff_currency": "ZAR",
})
```

By default, existing fields in the record are preserved (source wins). Pass `override=True` to let context values take precedence.

See [Post-Transform Enrichment](/docs/trading-integration/enrichment) for the full field list.

### Output

The output module serializes ODS-E records to storage formats:

| Function | Format | Use Case |
|----------|--------|----------|
| `to_json(records, path)` | Newline-delimited JSON (JSONL) | Traceability, debugging |
| `to_csv(records, path)` | CSV | Spreadsheet import, legacy systems |
| `to_parquet(records, path, partition_by)` | Partitioned Parquet | Data lakes, analytics (S3, BigQuery) |
| `to_dataframe(records)` | pandas DataFrame | In-memory analysis, Jupyter notebooks |

```python
from odse import to_parquet

to_parquet(records, "output/cleaned/", partition_by=["asset_id", "year", "month", "day"])
# Creates: output/cleaned/asset_id=SITE-001/year=2026/month=02/day=09/part-00000.parquet
```

## Pipeline Patterns

### Single-Site Batch (Simplest)

Transform one file, validate, write output.

```python
from odse import transform, validate_batch, to_json

records = transform("site_data.csv", source="huawei", asset_id="SITE-001")
result = validate_batch(records)
print(result.summary)
to_json(records, "output/site_001.jsonl")
```

### Multi-Site with Enrichment

Loop over sites, enrich each with site-specific context, validate against a trading profile.

```python
from odse import transform, enrich, validate_batch, to_parquet

sites = {
    "SITE-A": {"file": "site_a.csv", "source": "huawei", "seller": "nersa:gen:A"},
    "SITE-B": {"file": "site_b.csv", "source": "solarman", "seller": "nersa:gen:B"},
}

all_records = []
for site_id, cfg in sites.items():
    rows = transform(cfg["file"], source=cfg["source"], asset_id=site_id)
    rows = enrich(rows, {
        "seller_party_id": cfg["seller"],
        "settlement_type": "bilateral",
    })
    result = validate_batch(rows, profile="bilateral")
    print(f"{site_id}: {result.summary}")
    all_records.extend(rows)

to_parquet(all_records, "output/portfolio/", partition_by=["asset_id", "year", "month"])
```

### CLI One-Liners

```bash
# Transform and write JSON
odse transform --source huawei --input site_data.csv -o output.json

# Validate a file
odse validate --input output.json --level semantic --capacity-kw 10
```

## Extension Points

- **Custom transforms:** Add a new OEM by implementing `BaseTransformer` in `transformer.py` and registering in `_get_transformer()`. See the [Add Your Own Transform](/docs/guides/add-transform) guide (coming soon).
- **Custom validation:** Add semantic checks by extending the validator.
- **Custom enrichment:** Pass any key-value pairs — unknown keys are passed through to records.
- **Custom output:** Use `to_dataframe()` to get a pandas DataFrame, then write to any format pandas supports.

## Related Docs

- [What is ODS-E?](/docs/what-is-odse) — High-level overview
- [Get Started](/docs/get-started) — 5-minute quickstart
- [Python SDK Reference](/docs/reference/python-sdk) — Full API documentation
- [Schema Reference](/docs/schemas/energy-timeseries) — Field-level definitions
