---
title: "ERP Enrichment Schemas"
layout: default
parent: "ERP Integration"
nav_order: 6
---

# ERP Enrichment Schemas

The ERP enrichment schemas bridge operational data from ERP/EAM systems (work orders, inventory, procurement) and SCADA alarm analytics into ODS-E. Together, these seven schemas give O&M teams a unified view of equipment identity, maintenance history, spare parts availability, failure patterns, and alarm escalation — the data foundation for maintenance event triage and predictive workflows.

## Architecture

The seven schemas form a tightly coupled system linked by three shared keys: `equipment_id`, `part_id`, and `failure_code`.

```
                          ┌─────────────────────┐
                          │  Equipment ID Map    │
                          │  (identity linchpin) │
                          └──────────┬──────────┘
                                     │ equipment_id
                    ┌────────────────┼────────────────┐
                    │                │                 │
                    ▼                ▼                 ▼
        ┌───────────────┐  ┌─────────────────┐  ┌──────────────────────┐
        │  Equipment     │  │  Maintenance    │  │  Alarm Frequency     │
        │  Register      │  │  History        │  │  Profile             │
        │                │  │                 │  │  (derived)           │
        └───────────────┘  └────────┬────────┘  └──────────────────────┘
                                    │
                           failure_code    part_id
                           ┌────────┴────────┐
                           │                 │
                           ▼                 ▼
                ┌───────────────┐  ┌───────────────┐
                │  Failure      │  │  Spare Parts  │
                │  Taxonomy     │  │               │
                └───────────────┘  └───────┬───────┘
                                           │ part_id
                                           ▼
                                   ┌───────────────┐
                                   │  Procurement  │
                                   │  Context      │
                                   └───────────────┘
```

## Equipment ID Map

The identity linchpin. Maps a canonical ODS-E `equipment_id` to its native identifiers across ERP, SCADA, and monitoring systems. Every other enrichment schema references equipment through this canonical ID.

**Schema type:** `array` (each item is one equipment entry)

### Required Fields (per item)

| Field | Type | Constraint | Purpose |
|---|---|---|---|
| `equipment_id` | string | — | Canonical ODS-E equipment identifier used across all enrichment schemas |
| `sources` | array | minItems: 1 | List of source system identifiers for this equipment |

### Source Object Fields (required)

| Field | Type | Constraint | Purpose |
|---|---|---|---|
| `system` | string | — | Source system name (e.g., `ifs-cloud`, `sma-monitoring`, `soliscloud`) |
| `type` | enum | `erp`, `scada`, `monitoring` | Category of the source system |
| `native_id` | string | — | Identifier of this equipment in the source system |

### Example

```json
[
  {
    "equipment_id": "KRG-INV-001",
    "sources": [
      { "system": "ifs-cloud", "type": "erp", "native_id": "EQ-10045" },
      { "system": "sma-monitoring", "type": "monitoring", "native_id": "SMA-9801234" },
      { "system": "site-scada", "type": "scada", "native_id": "INV-001-SCADA" }
    ]
  }
]
```

## Equipment Register

Equipment hierarchy and technical attributes for a single piece of site equipment, sourced from ERP/EAM systems.

### Required Fields

| Field | Type | Constraint | Purpose |
|---|---|---|---|
| `equipment_id` | string | — | Canonical ODS-E equipment identifier |
| `site_id` | string | — | Identifier of the site where this equipment is installed |
| `equipment_type` | enum | 9-value enum | Standardized equipment type within the site hierarchy |

**`equipment_type` values:** `site`, `array`, `inverter`, `combiner`, `string`, `module`, `transformer`, `tracker`, `meter`

### Optional Fields

| Field | Type | Notes |
|---|---|---|
| `equipment_subtype` | string | Vendor-specific equipment subtype |
| `parent_equipment_id` | string | Canonical ID of the parent in the hierarchy (for cascade risk traversal) |
| `source_equipment_id` | string | Native identifier in the originating ERP or SCADA system |
| `manufacturer` | string | Equipment manufacturer name |
| `model` | string | Equipment model identifier |
| `serial_number` | string | Manufacturer serial number |
| `install_date` | string (date) | Date the equipment was installed (ISO 8601) |
| `warranty_expiry` | string (date) | Warranty expiration date (ISO 8601) |
| `design_capacity_kw` | number (>= 0) | Design or nameplate capacity in kilowatts |
| `cost_center` | string | Cost center or financial reporting unit |

### Example

```json
{
  "equipment_id": "KRG-INV-002",
  "site_id": "KARIEGA-SOLAR",
  "equipment_type": "inverter",
  "equipment_subtype": "string_inverter",
  "parent_equipment_id": "KRG-ARR-A",
  "source_equipment_id": "EQ-10046",
  "manufacturer": "SMA",
  "model": "Sunny Tripower 25000TL",
  "serial_number": "SMA-9801235",
  "install_date": "2023-06-15",
  "warranty_expiry": "2028-06-15",
  "design_capacity_kw": 25.0,
  "cost_center": "CC-KRG-SOLAR"
}
```

## Maintenance History

Work order record capturing corrective, preventive, or condition-based maintenance activity on a piece of equipment.

### Required Fields

| Field | Type | Constraint | Purpose |
|---|---|---|---|
| `equipment_id` | string | — | Canonical ODS-E equipment identifier |
| `work_order_id` | string | — | Unique work order identifier from the source ERP/EAM system |
| `wo_type` | enum | `corrective`, `preventive`, `condition_based` | Work order type classification |
| `wo_status` | enum | `open`, `in_progress`, `closed` | Current work order lifecycle status |
| `reported_date` | string (date-time) | ISO 8601 | Date and time the work order was reported |

### Optional Fields

| Field | Type | Notes |
|---|---|---|
| `completed_date` | string (date-time) | Date and time the work order was completed (ISO 8601) |
| `source_equipment_id` | string | Native identifier in the originating ERP or SCADA system |
| `downtime_hours` | number (>= 0) | Total equipment downtime attributed to this work order |
| `failure_code` | string | Failure code from the ERP failure taxonomy |
| `cause_code` | string | Root cause code from the ERP failure taxonomy |
| `total_cost` | number (>= 0) | Total cost including labor, parts, and services |
| `parts_consumed` | array | List of spare parts consumed (each item: `part_id` string, `qty` number) |

### Example

```json
{
  "equipment_id": "KRG-INV-002",
  "work_order_id": "WO-2026-0142",
  "wo_type": "corrective",
  "wo_status": "closed",
  "reported_date": "2026-01-15T08:30:00Z",
  "completed_date": "2026-01-15T14:45:00Z",
  "downtime_hours": 6.25,
  "failure_code": "GRID_FAULT",
  "cause_code": "FUSE_BLOWN",
  "total_cost": 1250.00,
  "parts_consumed": [
    { "part_id": "SP-FUSE-60A", "qty": 2 }
  ]
}
```

## Spare Parts

Spare part inventory record including stock levels, reorder thresholds, and equipment applicability.

### Required Fields

| Field | Type | Constraint | Purpose |
|---|---|---|---|
| `part_id` | string | — | Unique spare part identifier from the ERP/EAM inventory system |
| `qty_on_hand` | number (>= 0) | — | Current physical stock quantity |

### Optional Fields

| Field | Type | Notes |
|---|---|---|
| `description` | string | Human-readable part description |
| `equipment_types_served` | array of strings | List of equipment types this part is applicable to |
| `qty_reserved` | number (>= 0) | Quantity reserved for open work orders |
| `qty_available` | number (>= 0) | Quantity available for new work orders (on_hand minus reserved) |
| `reorder_point` | number (>= 0) | Stock level at which a purchase requisition should be triggered |
| `supplier_lead_time_days` | number (>= 0) | Typical supplier lead time in calendar days |
| `last_unit_cost` | number (>= 0) | Unit cost from the most recent purchase order |

### Example

```json
{
  "part_id": "SP-FUSE-60A",
  "description": "60A DC string fuse, 1000V",
  "equipment_types_served": ["inverter", "combiner"],
  "qty_on_hand": 24,
  "qty_reserved": 4,
  "qty_available": 20,
  "reorder_point": 10,
  "supplier_lead_time_days": 14,
  "last_unit_cost": 18.50
}
```

## Procurement Context

Procurement and supply chain context for a spare part, including preferred supplier, lead times, and open purchase orders.

### Required Fields

| Field | Type | Constraint | Purpose |
|---|---|---|---|
| `part_id` | string | — | Spare part identifier matching the spare-parts schema |

### Optional Fields

| Field | Type | Notes |
|---|---|---|
| `preferred_supplier` | string | Name or identifier of the preferred supplier |
| `avg_lead_time_days` | number (>= 0) | Average supplier lead time in calendar days across recent orders |
| `avg_unit_cost` | number (>= 0) | Average unit cost across recent purchase orders |
| `last_po_date` | string (date) | Date of the most recent purchase order (ISO 8601) |
| `open_po_qty` | number (>= 0) | Total quantity on open (undelivered) purchase orders |
| `open_po_eta` | string (date) | Expected delivery date of the earliest open purchase order (ISO 8601) |

### Example

```json
{
  "part_id": "SP-FUSE-60A",
  "preferred_supplier": "Phoenix Contact SA",
  "avg_lead_time_days": 12,
  "avg_unit_cost": 17.80,
  "last_po_date": "2026-01-20",
  "open_po_qty": 50,
  "open_po_eta": "2026-02-10"
}
```

## Failure Taxonomy

Failure and root cause classification record from the ERP/EAM failure coding system, including historical repair statistics.

### Required Fields

| Field | Type | Constraint | Purpose |
|---|---|---|---|
| `failure_code` | string | — | Failure code identifier from the ERP failure taxonomy |
| `failure_description` | string | — | Human-readable description of the failure mode |

### Optional Fields

| Field | Type | Notes |
|---|---|---|
| `cause_code` | string | Root cause code associated with this failure |
| `cause_description` | string | Human-readable description of the root cause |
| `recurrence_rate` | number (0–1) | Historical probability of recurrence |
| `typical_mttr_hours` | number (>= 0) | Typical mean time to repair in hours |
| `typical_cost` | number (>= 0) | Typical repair cost for this failure mode |

### Example

```json
{
  "failure_code": "GRID_FAULT",
  "failure_description": "Grid voltage or frequency excursion causing inverter trip",
  "cause_code": "FUSE_BLOWN",
  "cause_description": "DC string fuse failure due to thermal cycling",
  "recurrence_rate": 0.35,
  "typical_mttr_hours": 4.5,
  "typical_cost": 1200.00
}
```

## Alarm Frequency Profile

Derived alarm frequency analytics for a specific equipment-alarm pair, computed from SCADA alarm logs enriched with maintenance context. This schema is **not** extracted directly from any ERP — it is a derived computation. See the [alarm frequency computation spec](https://github.com/AsobaCloud/ona-protocol/blob/main/spec/alarm-frequency-computation.md) for the full algorithm.

### Required Fields

| Field | Type | Constraint | Purpose |
|---|---|---|---|
| `equipment_id` | string | — | Canonical ODS-E equipment identifier |
| `alarm_code` | string | — | SCADA or monitoring system alarm code |

### Optional Fields

| Field | Type | Notes |
|---|---|---|
| `source_equipment_id` | string | Native identifier in the originating SCADA or monitoring system |
| `count_7d` | integer (>= 0) | Alarm occurrences in the trailing 7-day window |
| `count_30d` | integer (>= 0) | Alarm occurrences in the trailing 30-day window |
| `count_90d` | integer (>= 0) | Alarm occurrences in the trailing 90-day window |
| `mean_time_between_alarms_hours` | number (>= 0) | Average time between consecutive occurrences in hours |
| `escalation_rate` | number (>= 0) | `count_7d / (count_30d / 4.286)` — values > 1.0 indicate accelerating frequency |
| `prior_wo_count_same_alarm` | integer (>= 0) | Historical work orders linked to this alarm code on this equipment |
| `prior_resolution` | enum | `closed_resolved`, `closed_deferred`, `recurring`, `none` |

### Example

```json
{
  "equipment_id": "KRG-INV-002",
  "alarm_code": "GRID_FAULT_UV",
  "source_equipment_id": "INV-002-SCADA",
  "count_7d": 12,
  "count_30d": 18,
  "count_90d": 25,
  "mean_time_between_alarms_hours": 86.4,
  "escalation_rate": 2.86,
  "prior_wo_count_same_alarm": 2,
  "prior_resolution": "recurring"
}
```

The `escalation_rate` of 2.86 means this alarm is firing nearly 3x faster in the last 7 days compared to the 30-day baseline — a strong signal for dispatch priority.

## IFS Cloud Reference Implementation

The first reference transform maps IFS Cloud OData projections to ODS-E enrichment schemas. See [`erp-transforms/ifs-cloud.yaml`](https://github.com/AsobaCloud/ona-protocol/blob/main/erp-transforms/ifs-cloud.yaml) for the full specification.

| Extraction | IFS Cloud Projection | Target Schema | Refresh Cadence |
|---|---|---|---|
| Equipment Register | `EquipmentObjectHandling.svc/EquipmentObjectSet` | `equipment-register.json` | Daily |
| Maintenance History | `ActiveWorkOrdersHandling.svc/WorkOrderSet` | `maintenance-history.json` | Every 4 hours |
| Spare Parts | `InventoryPartInStockHandling.svc/InventoryPartInStockSet` | `spare-parts.json` | Every 2 hours |
| Procurement Context | `PurchaseOrderHandling.svc/PurchaseOrderLineSet` | `procurement-context.json` | Daily |
| Failure Taxonomy | `FailureCodeHandling.svc/FailureCodeSet` | `failure-taxonomy.json` | Weekly |

The alarm frequency profile is **not** extracted from IFS — it is a derived computation that joins SCADA alarm logs with ERP maintenance history. The equipment ID map is maintained as a configuration artifact, not extracted.

## Cross-Schema Relationships

Three linking keys connect the seven schemas:

| Key | Links |
|---|---|
| `equipment_id` | Equipment ID Map ↔ Equipment Register ↔ Maintenance History ↔ Alarm Frequency Profile |
| `part_id` | Spare Parts ↔ Procurement Context ↔ Maintenance History (`parts_consumed`) |
| `failure_code` | Failure Taxonomy ↔ Maintenance History ↔ Alarm Frequency Profile (via alarm-to-failure mapping) |

### Common Query Patterns

1. **Alarm triage** — Start from an alarm frequency profile, join maintenance history on `equipment_id`, check failure taxonomy for recurrence rate, verify spare parts availability by `part_id`
2. **Inventory optimization** — Aggregate `parts_consumed` from maintenance history, compare against spare parts `qty_on_hand` and `reorder_point`, check procurement `open_po_eta` for incoming stock
3. **Equipment risk scoring** — Combine alarm `escalation_rate`, failure `recurrence_rate`, and maintenance `downtime_hours` per equipment to rank dispatch priority
4. **Cascade analysis** — Traverse `parent_equipment_id` in the equipment register to identify upstream/downstream equipment affected by a failure

## Related Docs

- [Schema Overview](/docs/schemas/overview) — Design principles and how to read the spec
- [Energy Timeseries](/docs/schemas/energy-timeseries) — Interval energy records
- [Asset Metadata](/docs/schemas/asset-metadata) — Site and equipment context
- [Maintenance Event Triage](/docs/patterns/maintenance-event-triage) — Pattern using these schemas for O&M decision-making
- [Schema Validation](/docs/validation/schema-validation) — Structural correctness checks
