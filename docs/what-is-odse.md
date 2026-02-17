---
title: "What is ODS-E?"
layout: default
---

# What is ODS-E?

ODS-E (Open Data Schema for Energy) is an open standard for normalizing distributed energy data across OEM platforms.

It gives operators, integrators, and utilities a shared data model so telemetry from Huawei, Enphase, Solarman, and other systems can be transformed into one consistent schema for analysis, validation, and reporting.

## Why It Exists

Energy data is fragmented across vendor-specific APIs, file formats, and error taxonomies.

ODS-E removes that fragmentation by defining:

- A common JSON schema for energy records
- A normalized error taxonomy for cross-OEM fault interpretation
- A transform layer to convert OEM-native payloads into ODS-E records

<img src="/assets/images/ods-e-pipeline-v4.svg" alt="ODS-E pipeline overview" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin: 20px 0;">

## Core Building Blocks

## 1. Schema

A minimal, machine-validatable record format with required fields such as timestamp, energy, and error classification.

```json
{
  "timestamp": "2026-02-05T14:00:00Z",
  "kWh": 847.5,
  "error_type": "normal",
  "PF": 0.98
}
```

## 2. Transforms

Declarative mappings that convert OEM exports and APIs into ODS-E-compliant records.

## 3. Validation

Schema and semantic checks that ensure records are structurally valid and operationally meaningful.

## Who Uses ODS-E

- IPP operators managing multi-site, multi-OEM portfolios
- ESCO and O&M teams building standardized monitoring pipelines
- Utilities ingesting DER production data for forecasting and dispatch
- Analysts, insurers, and finance teams requiring comparable energy datasets

## What You Can Do Next

- Read [Getting Started](/docs/get-started) to install and run your first transform
- Explore [Schema Reference](/docs/schemas/overview) for field-level definitions
- Check [Supported OEMs](/docs/transforms/supported-oems) for current transform coverage
- Review [Validation](/docs/validation/overview) for schema and semantic checks
