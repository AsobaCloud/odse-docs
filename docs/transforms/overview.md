---
title: "Transforms Overview"
layout: default
---

# Transforms Overview

Transforms convert OEM-native exports and API payloads into ODS-E-compliant records.

## Why Transforms Exist

OEM telemetry differs in:

- field names and units
- timestamp formats and timezone behavior
- error-state coding systems

ODS-E transforms normalize those differences into one contract.

## Transform Responsibilities

1. Map source fields to ODS-E fields.
2. Normalize timestamps to ISO 8601 timezone-explicit format.
3. Convert energy units where necessary.
4. Map OEM error codes to ODS-E `error_type`.
5. Preserve source-specific detail in optional fields like `error_code_original`.

## Typical Flow

```text
raw OEM payload -> transform(source=...) -> ODS-E records -> validate() -> downstream analytics
```

## Reference Usage

```python
from odse import transform

rows = transform("huawei_export.csv", source="huawei")
```

## Operational Guidance

- Validate transformed output before storage or analysis.
- Version transform logic when OEM APIs change.
- Maintain fixture-based tests for each OEM connector.

## Related Docs

- [Supported OEMs](/docs/transforms/supported-oems)
- [Validation Overview](/docs/validation/overview)
- [Get Started](/docs/get-started)
