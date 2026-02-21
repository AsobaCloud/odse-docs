---
title: "LLM RAG with ODS-E Metadata"
layout: default
parent: "Patterns"
nav_order: 4
---

# LLM RAG with ODS-E Metadata

Use ODS-E metadata fields to scope retrieval in a RAG pipeline, preventing cross-municipality leakage and hallucination.

## When to Use

You're building an LLM assistant that answers questions about energy policy, SSEG applications, tariffs, or settlement — and the answers depend on municipality, role, and regulatory context.

## Pipeline

```
Policy PDFs ──► chunk + attach ODS-E metadata ──► retrieve(filtered by municipality) ──► LLM + citations
```

## Metadata Contract

For each indexed chunk, store these ODS-E fields:

```json
{
  "municipality_id": "za.wc.city_of_cape_town",
  "municipality_name": "City of Cape Town",
  "role_scope": "applicant",
  "tariff_schedule_id": "za-city-capetown:cpt:LT-MD-2026:v1",
  "seller_party_id": "za-nersa:trader:ETANA-001",
  "network_operator_id": "za-eskom:network_operator:WC-01",
  "distribution_zone": "WC-BELLVILLE",
  "voltage_level": "MV",
  "source": "cct-sseg-bylaw-2025",
  "section": "4.2.1",
  "effective_date": "2025-07-01"
}
```

## Retrieval Flow

```python
def retrieve(question, municipality_id, role, tariff_id=None):
    # 1. Strict municipality match first
    filters = {"municipality_id": municipality_id}

    # 2. Role-compatible chunks
    filters["role_scope"] = {"$in": [role, "both"]}

    # 3. Tariff/topology constraints if present
    if tariff_id:
        filters["tariff_schedule_id"] = tariff_id

    # 4. Query vector store
    chunks = vector_store.query(question, filters=filters, top_k=5)

    # 5. Backfill with national chunks if insufficient
    if len(chunks) < 3:
        national = vector_store.query(
            question,
            filters={"municipality_id": "za.national"},
            top_k=3
        )
        chunks.extend(national)

    return chunks
```

## Example API Request

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

## Answer Structure

Enforce this response format:

1. Direct answer for the selected municipality
2. Conditions/limits (capacity, inverter, process step, tariff implications)
3. Exact source citations (document + section)
4. Concrete next step in the application process
5. If municipality rule is missing, clearly label fallback as national guidance

## Why ODS-E Improves Reliability

- **Canonical IDs** remove ambiguity between similarly named entities
- **Tariff and settlement keys** constrain generation to the right commercial context
- **Municipality and topology keys** prevent cross-municipality leakage
- **Structured metadata** supports deterministic filtering before the model generates text

## What to Read Next

- [South Africa SSEG RAG Example](/docs/llm-integration/south-africa-sseg-rag-example) — Full implementation walkthrough
- [LLM Integration Overview](/docs/llm-integration) — Why structured context matters for energy LLM apps
- [Asset Metadata Schema](/docs/schemas/asset-metadata) — Municipality and topology fields
