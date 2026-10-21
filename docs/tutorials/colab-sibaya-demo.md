---
title: "Colab Demo — Sibaya Distribution-Grid Study"
layout: default
parent: "Build"
nav_order: 4
---

# Colab Demo — Sibaya Distribution-Grid Study

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/AsobaCloud/odse/blob/main/colab/sibaya_colab_demo.ipynb)

Run a **real-world ODS-E workflow in Google Colab** with nothing but `pip install odse` —
no clone, no fixtures, no local environment.

## What the notebook covers

Using **real (anonymized) site data** from Sibaya — a 2.3 MW C&I PV plant in Durban, KZN
(7 Huawei string inverters, a billing meter, site aggregates) — the notebook walks through:

1. **Load** — 6 months of 5-min inverter telemetry (372k rows), hourly Durban weather, and
   the site's IEC 62056 (OBIS) billing-meter registers, all fetched from the
   [`odse` repo `colab/` kit](https://github.com/AsobaCloud/odse/tree/main/colab) via raw URLs.
2. **Transform** — raw telemetry mapped to canonical ODS-E records
   (`kW`, `voltage_ac`, `temperature`, `poa_irradiance`, `error_type`, `asset_id`).
3. **Validate** — `validate_batch` against the strict canonical vocabulary
   (SEP-049): every record passes, zero `UNKNOWN_FIELD` warnings.
4. **Classify faults** — Huawei FusionSolar `inverter_state` codes
   (513/514 grid over/under-voltage warnings vs 768/770/771 hardware faults)
   rolled up per inverter.
5. **Energy balance** — decode the OBIS cumulative registers
   (import/export) into the site's net-importing load profile.
6. **Cost impact** — join per-inverter shortfall to ZAR tariff rates.

## The kit

| Dataset | Window | Size |
|---|---|---|
| `sibaya_telemetry_6mo.csv.gz` | Mar–Sep 2026, 5-min | 372k rows |
| `durban_weather_6mo.csv.gz` | Mar–Sep 2026, hourly | 4,416 rows |
| `sibaya_meter_6mo.json` | IEC 62056 daily registers | 183 readings |
| Aggregates + tariffs | root cause, cost impact, energy balance, PR | — |

Full kit: [`odse/colab`](https://github.com/AsobaCloud/odse/tree/main/colab).

## Embedding the badge in your own docs

```markdown
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/AsobaCloud/odse/blob/main/colab/sibaya_colab_demo.ipynb)
```

The notebook needs no repo checkout — Colab installs `odse` from PyPI and fetches the
datasets over GitHub raw URLs.