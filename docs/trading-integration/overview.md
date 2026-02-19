---
title: "Trading Integration Overview"
layout: default
---

# Trading Integration Overview

Trading integration in ODS-E focuses on one core problem: multiple market actors can only settle, bill, and scale participation if they exchange data with a shared contract.

## Context

In South Africa's transition to a multi-participant electricity market, utilities, municipalities, traders, and private generators are active at the same time but do not consistently operate with a shared machine-readable data layer.

Common friction points:

- municipal and utility process differences across jurisdictions
- inconsistent wheeling and billing reconciliation practices
- party identity ambiguity across bilateral contracts
- tariff version drift between documents and operations

## What ODS-E Adds

ODS-E provides a neutral interoperability layer for:

- interval energy records (`energy-timeseries`)
- settlement party context (`seller_party_id`, `buyer_party_id`, `network_operator_id`)
- tariff context (`tariff_schedule_id`, `tariff_period`, version-effective timestamps)
- municipal/grid topology (`municipality_id`, feeder, zone, voltage metadata)

## Market Reform Extensions

Aligned with the SAETA "Policy to Power" report (February 2026), ODS-E adds optional fields for 7 reform areas:

- [Wheeling Transaction Envelope](/docs/trading-integration/wheeling-extensions) -- traditional, virtual, and portfolio wheeling with reconciliation status
- [Tariff Component Granularity](/docs/trading-integration/tariff-unbundling) -- unbundled generation, transmission, distribution, and ancillary charges
- [Curtailment Event Tracking](/docs/trading-integration/curtailment-tracking) -- curtailment flags, causes, lost generation, and dispatch instruction references
- [BRP / Imbalance Settlement](/docs/trading-integration/brp-imbalance-settlement) -- BRP context, forecasts, and imbalance calculations for the SAWEM
- [Municipal Reconciliation](/docs/trading-integration/municipal-reconciliation) -- billing cycles, metered vs. billed quantities, and DAA references
- [Green Attribute / Certificate Tracking](/docs/trading-integration/green-attributes) -- I-REC and other certificate references with carbon intensity
- [Grid Capacity / Connection Status](/docs/schemas/grid-capacity) -- GCAR milestones and grid access lifecycle (asset-metadata fields)

All extensions are additive and optional. Existing valid payloads remain valid.

## Runtime Helpers

- [Post-Transform Enrichment](/docs/trading-integration/enrichment) -- inject settlement, tariff, and topology context into transformed rows
- [Conformance Profile Validation](/docs/validation/conformance-profiles) -- enforce required-field sets per trading context (bilateral, wheeling, SAWEM, municipal)

## Why It Matters

With a common data contract:

1. Traders can settle faster with fewer disputes.
2. Utilities can onboard counterparties without custom data pipelines.
3. Municipal processes can standardize reconciliation even when commercial models differ.
4. LLM and analytics applications can return scoped, auditable answers.

## Related Docs

- [Cape Town Market Use Case](/docs/trading-integration/cape-town-market-use-case)
- [User-Managed ID Registries](/docs/trading-integration/user-managed-id-registries)
- [Energy Timeseries Schema](/docs/schemas/energy-timeseries)
- [Asset Metadata Schema](/docs/schemas/asset-metadata)
