---
title: "Supported OEMs"
layout: default
parent: "Build"
nav_order: 7
---

# Supported OEMs

ODS-E currently ships transform support for the following OEM ecosystems.

| OEM | Typical Input | Notes |
|---|---|---|
| Huawei FusionSolar | CSV/API export | Common in utility/commercial PV fleets |
| Enphase Envoy | JSON API payload | Microinverter-heavy portfolios |
| Solarman Logger | CSV/API export | Logger-centric deployments |
| SolarEdge | CSV/API export | Site-level telemetry and status streams |
| Fronius | CSV/API export | Inverter/device-level export formats |
| Switch Energy | API/flat export | Integration depends on deployment profile |
| SMA | API/flat export | Structured status and production feeds |
| FIMER Aurora Vision | API export | Legacy/modern payload variants may differ |
| SolisCloud | API export | Cloud telemetry with OEM-specific status mappings |
| SolaX Cloud | API export | Requires vendor-specific field mapping |

## Compatibility Notes

- Input schema quality varies by OEM and account configuration.
- Historical exports may differ from live API responses.
- Some connectors may require additional mapping for edge deployments.

## Recommended Rollout Sequence

1. Start with one OEM and validate output.
2. Add second/third OEMs using the same downstream contract.
3. Track transform regressions when OEM providers change their APIs.

## Related Docs

- [Transforms Overview](/docs/transforms/overview)
- [Schema Validation](/docs/validation/schema-validation)
- [Get Started](/docs/get-started)
