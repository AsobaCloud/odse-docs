---
title: "User-Managed ID Registries"
layout: default
parent: "Trading Integration"
nav_order: 8
---

# User-Managed ID Registries

ODS-E does not require a single central registry service. It requires canonical ID formats and deterministic namespace rules.

## Registry Model

Each ecosystem participant can maintain its own registry while staying interoperable:

- regulator or market-operator registry for licensed entities
- utility or municipal registry for service areas and network IDs
- trader registry for counterparty and contract aliases

ODS-E compatibility is preserved when IDs follow canonical patterns and are exchanged with source authority metadata.

## Canonical ID Patterns

- Party ID: `<authority>:<type>:<id>`
- Tariff ID: `<authority>:<municipality>:<code>:v<version>`
- Municipality ID: `za.<province>.<municipality>`

## Post-Hoc Utility Onboarding

A utility can join after market operations have already started:

1. Publish utility namespace and authority prefix.
2. Map legacy identifiers to canonical ODS-E IDs.
3. Start emitting ODS-E-compatible records for new intervals.
4. Backfill historical data progressively using mapping tables.
5. Exchange mapping manifests with counterparties for auditability.

This allows phased onboarding without forcing a hard cutover across all participants.

## Practical Governance Guidance

- version registry snapshots and publish change logs
- never reassign previously issued IDs
- allow aliases, but enforce one canonical ID per entity in settlement
- include effective dates for tariff and topology changes

## Related Docs

- [Trading Integration Overview](/docs/trading-integration/overview)
- [Cape Town Market Use Case](/docs/trading-integration/cape-town-market-use-case)
- [LLM Integration Overview](/docs/llm-integration/overview)
