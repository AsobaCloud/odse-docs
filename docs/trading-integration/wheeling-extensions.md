---
title: "Wheeling Transaction Envelope"
layout: default
---

# Wheeling Transaction Envelope

Three wheeling models are active in South Africa: traditional (physical delivery on a single network), virtual (financial settlement across networks), and portfolio (multi-to-multi under a single arrangement). ODS-E provides a standard envelope for all three.

## Context

The SAETA "Policy to Power" report identifies fragmented data exchange, manual reconciliation, and inconsistent treatment across networks as barriers to scaling wheeling (Actions 7, 8). It calls for "standardised and automated reconciliation and billing" and "modern digital systems for data exchange, energy accounting and financial settlement."

These fields complement the existing `wheeling_agent_id`, `seller_party_id`, and `buyer_party_id` from the [market context extensions](https://github.com/AsobaCloud/odse/blob/main/spec/market-context.md).

## Timeseries Fields

| Field | Type | Description |
|-------|------|-------------|
| `wheeling_type` | enum: `traditional`, `virtual`, `portfolio` | Wheeling model for this transaction |
| `injection_point_id` | string | Grid injection point identifier for the wheeling path |
| `offtake_point_id` | string | Grid offtake point identifier for the wheeling path |
| `wheeling_status` | enum: `provisional`, `confirmed`, `reconciled`, `disputed` | Reconciliation status of this wheeling record |
| `wheeling_path_id` | string | Reference to a registered wheeling path or schedule |

## Usage Notes

- `injection_point_id` and `offtake_point_id` use free-form strings because point naming conventions vary across Eskom, municipal, and cross-border networks. Implementers should document their naming convention.
- For virtual wheeling, the injection and offtake points represent financial settlement boundaries, not physical electron flow.
- `wheeling_status` tracks the lifecycle of a wheeling record through reconciliation. Records typically move from `provisional` (initial meter read) to `confirmed` (validated against counter-party) to `reconciled` (financially settled).

## Example

```json
{
  "timestamp": "2026-02-17T14:00:00+02:00",
  "kWh": 87.3,
  "error_type": "normal",
  "direction": "generation",
  "seller_party_id": "za-nersa:trader:ENPOWER-001",
  "buyer_party_id": "za-city-capetown:offtaker:METRO-4401",
  "wheeling_agent_id": "za-nersa:trader:ENPOWER-001",
  "network_operator_id": "za-eskom:network_operator:WC-01",
  "wheeling_type": "virtual",
  "injection_point_id": "NCAPE-SOLAR-GEN-12",
  "offtake_point_id": "CCT-DIST-MV-BELLVILLE-03",
  "wheeling_status": "confirmed",
  "wheeling_path_id": "WP-2026-ENPOWER-CCT-003",
  "loss_factor": 0.032,
  "contract_reference": "PPA-ENPOWER-CCT-2025-017"
}
```

## Related Docs

- [Trading Integration Overview](/docs/trading-integration/overview)
- [Cape Town Market Use Case](/docs/trading-integration/cape-town-market-use-case)
- [User-Managed ID Registries](/docs/trading-integration/user-managed-id-registries)
- [Energy Timeseries Schema](/docs/schemas/energy-timeseries)
