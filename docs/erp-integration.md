---
title: "ERP Integration"
layout: default
nav_order: 8
has_children: true
---

# ERP Integration

ERP integration connects ODS-E operational telemetry to enterprise resource planning and enterprise asset management (ERP/EAM) workflows, enabling maintenance triage, inventory optimization, and equipment risk scoring from a unified data model.

## Integration Goal

Bridge ERP work orders, spare parts inventory, failure taxonomies, and SCADA alarm analytics into ODS-E enrichment schemas — without losing traceability to source systems.

## Core Inputs

- ODS-E equipment identity mappings (canonical ID to ERP/SCADA/monitoring native IDs)
- ERP/EAM extracts: equipment register, maintenance history, spare parts, procurement context, failure taxonomy
- SCADA alarm logs (for derived alarm frequency profiles)

## Common Workflow

1. Extract equipment and maintenance records from ERP/EAM (e.g., IFS Cloud OData projections).
2. Map native equipment identifiers to canonical ODS-E `equipment_id` via the Equipment ID Map.
3. Validate extracted records against ODS-E enrichment JSON schemas.
4. Compute alarm frequency profiles by joining SCADA alarm logs with maintenance history.
5. Run maintenance event triage: combine alarm escalation, failure recurrence, and parts availability to produce dispatch decisions.

## Common Outputs

- Dispatch recommendations (dispatch now, schedule, defer, monitor)
- Inventory alerts (reorder triggers, lead-time warnings)
- Equipment risk scores (combining alarm escalation, failure recurrence, and downtime history)

## Related Docs

- [ERP Enrichment Schemas](/docs/schemas/erp-enrichment) — Full field reference for all seven enrichment schemas
- [Maintenance Event Triage](/docs/patterns/maintenance-event-triage) — Pattern for O&M dispatch decisions using enrichment data
- [Schema Reference Overview](/docs/schemas/overview) — Design principles and how to read the spec
- [Validation Overview](/docs/validation/overview) — Structural and semantic validation
