---
title: "Production Case Study: Multi-OEM Forecasting Pipeline"
layout: default
parent: "Patterns"
nav_order: 5
---

# Production Case Study: Multi-OEM Forecasting Pipeline

How the Ona Intelligence Layer uses ODS-E transforms to normalize data from four solar OEMs into a single schema consumed by LSTM forecasting models.

## Overview

The Ona Intelligence Layer is a solar forecasting platform that ingests production data from multiple inverter manufacturers (OEMs), each with different column names, error code conventions, and file formats. An ODS-E transform sits at the core of the pipeline: it normalizes every OEM format into a standardized `total_load.csv` that downstream ML training and inference services consume without any OEM-specific logic.

## The Problem

Solar portfolios rarely use a single inverter brand. A typical deployment includes a mix of Huawei string inverters, Enphase microinverters, Solarman monitoring gateways, and Telkom/Huawei Excel exports. Each produces data in a different schema:

| OEM | Raw Columns | Power Field | Error Reporting |
|-----|-------------|-------------|-----------------|
| **Huawei** | `timestamp, temperature, voltage, power, irradiance, wind_speed, inverter_state, run_state` | `power` (kW) | Numeric state codes (0, 256, 512, 768 ...) |
| **Enphase** | `timestamp, power, asset_id` | `power` (W) | Inferred from power output |
| **Solarman** | `Time, Solar Power（kW）, Consumption Power（kW）, Battery Power（kW）, Grid Power（kW）, ...` | `Solar Power（kW）` | Inferred from power values |
| **Telkom/Huawei** | `Start Time, Active power(kW), Daily energy(kWh), Cumulative energy(kWh), inverter_serial, source_file` | `Active power(kW)` | Inferred from power/energy values |

Without a normalization layer, every downstream service — training, inference, anomaly detection — would need to understand all four formats. That coupling breaks whenever a new OEM is added.

## Pipeline

```
OEM APIs / Uploads
    │
    ▼
historical/{client}/{customer}/{region}/{location}/{manufacturer}/raw.csv
    │
    │  S3 event trigger (s3:ObjectCreated:*)
    ▼
┌─────────────────────────────────┐
│  dataStandardizationService     │
│  (ODS-E Transform)              │
│                                 │
│  1. Detect OEM type             │
│  2. Normalize to standard schema│
│  3. Map error codes             │
│  4. Aggregate by timestamp      │
└─────────────────────────────────┘
    │
    ▼
total/{client}/{customer}/{region}/{location}/{manufacturer}/{serial}/total_load.csv
    │
    │  S3 event trigger
    ▼
┌─────────────────────────────────┐
│  globalTrainingService          │
│  (SageMaker Processing +       │
│   Training)                     │
│                                 │
│  1. Discover total_load.csv     │
│  2. Feature engineering (45+)   │
│  3. Train LSTM model            │
└─────────────────────────────────┘
    │
    ▼
forecastingApi (24-hour forecasts)
```

## Standardized Output Schema

The ODS-E transform produces records with these fields:

### Required Columns

| Column | Type | Description |
|--------|------|-------------|
| `timestamp` | ISO 8601 string | Timestamp of the reading |
| `kWh` | float | Active energy in kilowatt-hours |
| `error_type` | string | Categorical: `normal`, `warning`, `critical`, `fault`, `offline`, `standby`, `unknown` |
| `error_code` | string | Original OEM error code (preserved for reference) |

### Optional Columns

| Column | Type | Description |
|--------|------|-------------|
| `kVArh` | float | Reactive energy in kilovolt-ampere reactive hours |
| `kVA` | float | Apparent power in kilovolt-amperes |
| `PF` | float | Power factor (0–1) |

This maps directly to the [ODS-E energy-timeseries schema](/docs/schemas/energy-timeseries). The transform ensures every record — regardless of source OEM — conforms to these fields before reaching downstream services.

## Error Code Normalization

OEMs report device health in incompatible ways. The transform maps all of them to a single categorical taxonomy:

### Huawei (Numeric State Codes)

| Original Codes | Mapped `error_type` |
|----------------|---------------------|
| 0, 1, 2, 3, 256, 512, 1025, 1026, 1280, 1281, 1536, 1792, 2048, 2304, 40960, 49152 | `normal` |
| 513, 514, 772, 773, 774 | `warning` |
| 768, 770, 771, 45056 | `critical` |
| run_state == 0 | `offline` |

### Enphase (Power-Based Inference)

| Condition | Mapped `error_type` |
|-----------|---------------------|
| power_produced > 0 | `normal` |
| power_produced == 0 (daytime) | `offline` |
| power_produced == 0 (nighttime) | `standby` |

### Solarman & Telkom

Error types are inferred from power values and status columns where available, defaulting to `unknown` when no signal exists.

## Event-Driven Processing

The transform runs automatically — no manual invocation required:

1. Raw CSV lands in `historical/` S3 prefix (via OEM API collector or manual upload)
2. S3 event notification (`s3:ObjectCreated:*`) triggers the Lambda
3. Lambda detects OEM type, normalizes, and writes `total_load.csv` to `total/` prefix
4. A second S3 trigger can kick off training downstream

This means adding a new customer site is as simple as uploading their historical data to the right S3 path. The pipeline handles the rest.

## Downstream Consumption

The `globalTrainingService` discovers and consumes standardized data without any knowledge of the original OEM format. It operates on the `total/` prefix and applies quality filters:

- **Minimum records**: 1,000+ rows required
- **Minimum history**: 6+ months of data
- **Completeness**: 80%+ non-null values

Feature engineering runs on the standardized schema, creating 45+ features including time-based (hour, day-of-week, month as sin/cos), lag features (1h, 24h), rolling aggregates (6h mean), and weather integrations — all keyed off the `timestamp` and `kWh` columns that every OEM's data now shares.

The training pipeline produces LSTM models that power 24-hour-ahead forecasts. Customer-specific models train on that customer's standardized data; a generic baseline model trains on 23 public research sites (PVDAQ, UK PV, Canada PV) — all normalized through the same schema.

## Results

| Metric | Value |
|--------|-------|
| OEM formats supported | 4 (Huawei, Enphase, Solarman, Telkom) |
| Standardized output schema | 1 (`total_load.csv`) |
| Manual intervention | Zero (event-driven) |
| Processing time (data prep) | ~12 minutes for 1.5M records |
| Training time (LSTM) | ~2.8 hours (35 epochs, GPU) |
| Cost per training run | ~$1.50 (SageMaker on-demand) |
| Downstream OEM awareness | None — all services consume standardized records |

The key outcome: downstream services (training, inference, anomaly detection) are completely decoupled from OEM-specific formats. Adding a fifth OEM means writing one new normalizer function — zero changes to training or forecasting.

## What to Read Next

- [Basic: Transform + Validate](/docs/patterns/basic-transform-validate) — The simplest ODS-E pipeline pattern
- [Trading Settlement Pipeline](/docs/patterns/trading-settlement-pipeline) — Transform, enrich, and validate for energy trading
- [Supported OEMs](/docs/transforms/supported-oems) — Full list of ODS-E transform sources
- [Data Engineer Integration Guide](/docs/guides/data-engineers) — Embedding ODS-E in your own pipelines
