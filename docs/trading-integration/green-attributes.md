---
title: "Green Attribute / Certificate Tracking"
layout: default
---

# Green Attribute / Certificate Tracking

Access to lower-carbon electricity through wheeling is becoming a commercial and compliance necessity. ODS-E provides fields to reference renewable energy certificates and carbon intensity at the interval level, without replacing certificate registries.

## Context

The SAETA "Policy to Power" report highlights EU CBAM, carbon tax, carbon budgets, and NDC targets as drivers for verifiable clean-energy provenance. Traders offer "green power with renewable tradable attributes" and the report mentions "tradable electricity tokens" as a virtual wheeling concept. Energy-intensive exporters need verifiable provenance for CBAM compliance (Actions 7, 8).

## Timeseries Fields

| Field | Type | Description |
|-------|------|-------------|
| `renewable_attribute_id` | string | Certificate or credit identifier (e.g., I-REC tracking number) |
| `certificate_standard` | enum: `i_rec`, `rego`, `go`, `rec`, `tigr`, `other` | Certificate scheme under which the attribute is issued |
| `verification_status` | enum: `pending`, `issued`, `retired`, `cancelled` | Lifecycle status of the renewable attribute |
| `carbon_intensity_gCO2_per_kWh` | number >= 0 | Carbon intensity of the generation source in grams CO2e per kWh |

## Usage Notes

- ODS-E carries attribute references; it does not act as a registry. Issuance, tracking, retirement, and verification remain with the certificate registry (e.g., I-REC, Evident).
- `certificate_standard` values:
  - `i_rec` -- International REC Standard (dominant in South Africa)
  - `rego` -- Renewable Energy Guarantees of Origin (UK)
  - `go` -- Guarantees of Origin (EU)
  - `rec` -- Renewable Energy Certificates (US)
  - `tigr` -- Tradable Instruments for Global Renewables (APX/Evident)
  - `other` -- any other scheme
- `verification_status` tracks the lifecycle: `pending` (generation recorded), `issued` (certificate issued), `retired` (claimed by consumer), `cancelled` (voided or expired).
- `carbon_intensity_gCO2_per_kWh` enables CBAM-relevant calculations. For solar PV this is typically 0 (operational) or a lifecycle value (20-50 gCO2/kWh). The accounting methodology should be documented by the implementer.

## Example

```json
{
  "timestamp": "2026-02-17T11:00:00+02:00",
  "kWh": 156.8,
  "error_type": "normal",
  "direction": "generation",
  "seller_party_id": "za-nersa:generator:NCAPE-SOLAR-12",
  "renewable_attribute_id": "ZA-IREC-2026-0041822",
  "certificate_standard": "i_rec",
  "verification_status": "issued",
  "carbon_intensity_gCO2_per_kWh": 0
}
```

## Related Docs

- [Trading Integration Overview](/docs/trading-integration/overview)
- [Energy Timeseries Schema](/docs/schemas/energy-timeseries)
