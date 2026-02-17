---
title: "Cape Town Market Use Case"
layout: default
---

# Cape Town Market Use Case

This use case describes how a Cape Town trading ecosystem can use ODS-E as shared settlement and interoperability infrastructure.

## Participants

- IPP or embedded generator
- licensed trader or aggregator
- municipal or utility network operator
- off-taker portfolio (commercial or industrial sites)

## Operating Problem

Without a shared contract, each participant maintains separate data mappings for:

- interval energy values
- tariff period interpretation
- network charge allocation
- party identity and contract references

This increases settlement cycle time, error rates, and dispute risk.

## ODS-E Pattern

1. Source telemetry is normalized to ODS-E `energy-timeseries`.
2. Settlement context fields identify each transacting party.
3. Tariff fields classify each interval for TOU and network charging.
4. Asset topology fields map site records to municipality and feeder context.
5. Reconciliation and billing use the same canonical IDs across systems.

## Example Record

```json
{
  "timestamp": "2026-02-17T12:00:00+02:00",
  "kWh": 124.6,
  "error_type": "normal",
  "direction": "generation",
  "seller_party_id": "za-nersa:trader:ETANA-001",
  "buyer_party_id": "za-city-capetown:offtaker:SITE-9921",
  "network_operator_id": "za-eskom:network_operator:WC-01",
  "settlement_period_start": "2026-02-17T12:00:00+02:00",
  "settlement_period_end": "2026-02-17T12:30:00+02:00",
  "loss_factor": 0.03,
  "tariff_schedule_id": "za-city-capetown:cpt:LT-MD-2026:v1",
  "tariff_period": "standard",
  "tariff_currency": "ZAR",
  "energy_charge_component": 358.22,
  "network_charge_component": 62.91
}
```

## Expected Outcomes

- lower reconciliation overhead per settlement cycle
- clearer audit trail for billing and disputes
- faster onboarding of additional participants
- shared data foundation for policy-facing reporting and LLM assistants

## Related Docs

- [Trading Integration Overview](/docs/trading-integration/overview)
- [User-Managed ID Registries](/docs/trading-integration/user-managed-id-registries)
