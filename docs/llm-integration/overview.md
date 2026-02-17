---
title: "LLM Integration Overview"
layout: default
---

# LLM Integration Overview

ODS-E gives LLM applications a stable, machine-readable substrate for retrieval and reasoning. Instead of prompting against ad hoc PDFs and inconsistent OEM exports, a RAG stack can index canonical ODS-E records and policy metadata.

## Why This Matters

In South Africa's current transition to a multi-participant electricity market, the practical bottleneck is not only policy intent. It is operational interoperability:

- utilities and municipalities run different process rules and data formats
- traders and wheeling participants reconcile energy and billing through fragmented workflows
- applicants and officials must interpret long policy documents under time pressure

An LLM assistant without structured context will hallucinate or over-generalize. ODS-E narrows the problem:

- standard interval records for energy and status
- canonical settlement and tariff context fields
- municipality and grid-topology metadata for scoped retrieval

This lets assistants return municipality-specific, role-aware answers with citations and clear next steps.

## Reference Pattern

Use this baseline:

1. Ingest municipality and national policy PDFs into a chunked corpus.
2. Attach ODS-E metadata keys per chunk (municipality, tariff schedule, party context, topology).
3. Retrieve with structured filters before generation.
4. Require citation-aware output templates for applicant and official roles.

## Implementation Example

- [South Africa SSEG Assistant (RAG + ODS-E metadata)](/docs/llm-integration/south-africa-sseg-rag-example)

## Related Docs

- [Schema Reference Overview](/docs/schemas/overview)
- [Energy Timeseries Schema](/docs/schemas/energy-timeseries)
- [Asset Metadata Schema](/docs/schemas/asset-metadata)
