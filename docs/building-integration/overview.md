---
title: "Building Integration Overview"
layout: default
---

# Building Integration Overview

Building integration connects ODS-E operational telemetry to building analytics workflows, including benchmark comparisons and portfolio-level efficiency diagnostics.

## Integration Goal

Translate interval energy records into building-context insights without breaking source traceability.

## Core Inputs

- ODS-E energy-timeseries records
- ODS-E asset metadata (including building context)
- Benchmark datasets (for example ComStock/ResStock cohorts)

## Common Workflow

1. Normalize OEM telemetry into ODS-E.
2. Validate records (schema and semantic).
3. Join with building metadata and benchmark cohorts.
4. Compute performance indicators (EUI, variance, risk flags).
5. Feed results into reporting, planning, and intervention pipelines.

## Common Outputs

- EUI benchmark ratios by site
- Outlier identification by building cohort
- End-use oriented performance diagnostics
- Portfolio-level intervention ranking

## Related Docs

- [ComStock/ResStock Guide](/docs/building-integration/comstock-resstock)
- [Schema Reference Overview](/docs/schemas/overview)
- [Validation Overview](/docs/validation/overview)
