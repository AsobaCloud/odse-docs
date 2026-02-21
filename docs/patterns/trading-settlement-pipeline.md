---
title: "Trading Settlement Pipeline"
layout: default
parent: "Patterns"
nav_order: 2
---

# Trading Settlement Pipeline

Transform OEM data, enrich with market context, and validate against a conformance profile.

## When to Use

You need records that carry settlement metadata (party IDs, tariff context, contract references) for bilateral trading, wheeling, SAWEM, or municipal reconciliation.

## Pipeline

```
Raw OEM data ──► transform() ──► enrich(context) ──► validate(profile=...) ──► settlement system
```

## Complete Code

```python
from odse import transform, enrich, validate

# 1. Transform OEM data
rows = transform("huawei_export.csv", source="huawei")

# 2. Enrich with bilateral settlement context
context = {
    "seller_party_id": "nersa:gen:SOLARPK-001",
    "buyer_party_id": "nersa:offtaker:MUN042",
    "settlement_period_start": "2026-02-18T14:00:00+02:00",
    "settlement_period_end": "2026-02-18T14:30:00+02:00",
    "contract_reference": "PPA-SOLARPK-MUN042-2025-003",
    "settlement_type": "bilateral",
}
enriched = enrich(rows, context)

# 3. Validate against the bilateral conformance profile
for record in enriched:
    result = validate(record, profile="bilateral")
    print(record["timestamp"], result.is_valid)
```

### Multi-Site with Different Profiles

```python
from odse import transform, enrich, validate_batch, to_parquet

sites = {
    "SITE-A": {
        "file": "site_a.csv", "source": "huawei",
        "context": {
            "seller_party_id": "nersa:gen:A",
            "buyer_party_id": "nersa:offtaker:MUN042",
            "settlement_type": "bilateral",
            "contract_reference": "PPA-A-001",
        },
        "profile": "bilateral",
    },
    "SITE-B": {
        "file": "site_b.csv", "source": "solarman",
        "context": {
            "seller_party_id": "nersa:gen:B",
            "balance_responsible_party_id": "nersa:brp:BRP-01",
            "settlement_type": "sawem_day_ahead",
            "forecast_kWh": 320.0,
        },
        "profile": "sawem_brp",
    },
}

all_records = []
for site_id, cfg in sites.items():
    rows = transform(cfg["file"], source=cfg["source"], asset_id=site_id)
    rows = enrich(rows, cfg["context"])
    result = validate_batch(rows, profile=cfg["profile"])
    print(f"{site_id}: {result.summary}")
    all_records.extend(rows)

to_parquet(all_records, "output/settlement/", partition_by=["asset_id", "year", "month"])
```

### Available Profiles

| Profile | Use Case | Key Required Fields |
|---------|----------|-------------------|
| `bilateral` | PPA / bilateral trades | seller, buyer, settlement window, contract ref |
| `wheeling` | Wheeled energy across networks | bilateral fields + network operator, injection/offtake points |
| `sawem_brp` | Wholesale market (SAWEM) | seller, BRP, forecast, settlement type |
| `municipal_recon` | Municipal reconciliation | buyer, billing period, billed kWh, billing status |

## What to Read Next

- [Post-Transform Enrichment](/docs/trading-integration/enrichment) — Full enrichment API and field groups
- [Conformance Profiles](/docs/validation/conformance-profiles) — Profile field requirements and error codes
- [Cape Town Market Use Case](/docs/trading-integration/cape-town-market-use-case) — Real-world trading example
