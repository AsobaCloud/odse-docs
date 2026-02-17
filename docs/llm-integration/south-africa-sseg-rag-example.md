---
title: "South Africa SSEG RAG Example"
layout: default
---

# South Africa SSEG RAG Example

This example shows how to integrate ODS-E metadata with a municipality-aware RAG assistant for SSEG application support.

## Problem Setup

Target scenario:

- applicants and municipal officials ask policy and process questions on a shared platform
- each municipality has distinct requirements and tariff/process rules
- national policy context must still be available when local policy is silent

## Minimal Metadata Contract

For each indexed chunk, store:

- `municipality_id` (for example `za.wc.city_of_cape_town`)
- `municipality_name`
- `role_scope` (`applicant`, `official`, `both`)
- `tariff_schedule_id` (if relevant)
- `seller_party_id` / `buyer_party_id` / `network_operator_id` (for settlement and wheeling context)
- `distribution_zone`, `feeder_id`, `voltage_level` (when topology-specific guidance applies)
- `source`, `section`, `effective_date`

## Retrieval Flow

1. Accept request context:
   - user question
   - selected municipality
   - user role
2. Build retrieval filter:
   - strict municipality match first
   - role-compatible chunks
   - tariff/topology constraints if present
3. Backfill with national chunks only when municipality-specific content is insufficient.
4. Generate response with explicit citations and action-oriented next steps.

## API Shape (Example)

```json
{
  "message": "Can this customer export from a 150 kW system?",
  "municipality_id": "za.wc.city_of_cape_town",
  "role": "applicant",
  "tariff_schedule_id": "za-city-capetown:cpt:LT-MD-2026:v1",
  "party_context": {
    "seller_party_id": "za-nersa:trader:ETANA-001",
    "network_operator_id": "za-eskom:network_operator:WC-01"
  }
}
```

## Answer Policy

Enforce this response structure:

1. Direct answer for the selected municipality.
2. Conditions/limits (capacity, inverter, process step, tariff implications).
3. Exact source citations (document + section).
4. Concrete next step in the application process.
5. If municipality rule is missing, clearly label fallback as national guidance.

## Why ODS-E Improves LLM Reliability

- Canonical IDs remove ambiguity between similarly named entities.
- Tariff and settlement keys constrain generation to the right commercial context.
- Municipality and topology keys prevent cross-municipality leakage.
- Structured metadata supports deterministic filtering before the model generates text.

## Related Docs

- [LLM Integration Overview](/docs/llm-integration/overview)
- [Energy Timeseries Schema](/docs/schemas/energy-timeseries)
- [Asset Metadata Schema](/docs/schemas/asset-metadata)
