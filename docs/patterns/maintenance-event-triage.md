---
title: "Maintenance Event Triage"
layout: default
parent: "Patterns"
nav_order: 9
---

# Maintenance Event Triage

How to combine ODS-E ERP enrichment schemas to make dispatch decisions when a SCADA alarm fires. This pattern walks through a complete triage workflow — from alarm frequency check to spare parts verification — using inline data you can copy-paste and run.

## When to Use

You're an O&M team responding to SCADA alarms on a solar portfolio. Instead of dispatching a technician for every alarm, you want to prioritize based on:

- **Is the alarm accelerating?** (alarm frequency profile)
- **Has this happened before?** (maintenance history + failure taxonomy)
- **Do we have the parts?** (spare parts + procurement context)

This pattern uses five of the seven ERP enrichment schemas to answer these questions in sequence and produce a dispatch recommendation.

## Pipeline

```
SCADA Alarm Fires
    │
    ▼
┌─────────────────────────────────┐
│  Step 1: Alarm Frequency Check  │
│  alarm-frequency-profile.json   │
│                                 │
│  → Is escalation_rate > 1.0?    │
│  → How many times in 7/30/90d?  │
└─────────────────┬───────────────┘
                  │
                  ▼
┌─────────────────────────────────┐
│  Step 2: History Lookup         │
│  maintenance-history.json       │
│  failure-taxonomy.json          │
│                                 │
│  → Prior work orders?           │
│  → Recurrence rate?             │
│  → Typical MTTR and cost?       │
└─────────────────┬───────────────┘
                  │
                  ▼
┌─────────────────────────────────┐
│  Step 3: Parts Check            │
│  spare-parts.json               │
│  procurement-context.json       │
│                                 │
│  → Parts in stock?              │
│  → Open PO with ETA?            │
└─────────────────┬───────────────┘
                  │
                  ▼
┌─────────────────────────────────┐
│  Step 4: Decision               │
│                                 │
│  Escalating × Recurring × Parts │
│  → DISPATCH / SCHEDULE / DEFER  │
└─────────────────────────────────┘
```

## The Scenario

**Kariega Solar Farm** — a 10 MW ground-mount installation in Eastern Cape, South Africa — runs SMA string inverters monitored through a site SCADA system. At 08:30 this morning, inverter `KRG-INV-002` triggered a `GRID_FAULT_UV` alarm (grid undervoltage fault).

Your O&M control room needs to decide: dispatch a technician now, schedule for the next maintenance window, or defer and monitor?

## Complete Code

### Step 1: Query Alarm Frequency Profile

Check whether this alarm is accelerating. The alarm frequency profile is pre-computed from SCADA alarm logs — see the [alarm frequency computation spec](https://github.com/AsobaCloud/ona-protocol/blob/main/spec/alarm-frequency-computation.md) for how these numbers are derived.

```python
alarm_profile = {
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

escalating = alarm_profile["escalation_rate"] > 1.0
print(f"Alarm: {alarm_profile['alarm_code']} on {alarm_profile['equipment_id']}")
print(f"  7-day count:      {alarm_profile['count_7d']}")
print(f"  30-day count:     {alarm_profile['count_30d']}")
print(f"  Escalation rate:  {alarm_profile['escalation_rate']:.2f}")
print(f"  Escalating:       {'YES' if escalating else 'No'}")
```

**Output:**
```
Alarm: GRID_FAULT_UV on KRG-INV-002
  7-day count:      12
  30-day count:     18
  Escalation rate:  2.86
  Escalating:       YES
```

The escalation rate of 2.86 means this alarm is firing nearly 3x faster this week versus the 30-day baseline. This equipment needs attention.

### Step 2: Pull Maintenance History + Failure Taxonomy

Look up prior work orders on this equipment and the failure taxonomy for recurrence statistics.

```python
maintenance_history = [
    {
        "equipment_id": "KRG-INV-002",
        "work_order_id": "WO-2025-0891",
        "wo_type": "corrective",
        "wo_status": "closed",
        "reported_date": "2025-11-02T09:15:00Z",
        "completed_date": "2025-11-02T15:30:00Z",
        "downtime_hours": 6.25,
        "failure_code": "GRID_FAULT",
        "cause_code": "FUSE_BLOWN",
        "total_cost": 1250.00,
        "parts_consumed": [{"part_id": "SP-FUSE-60A", "qty": 2}]
    },
    {
        "equipment_id": "KRG-INV-002",
        "work_order_id": "WO-2026-0142",
        "wo_type": "corrective",
        "wo_status": "closed",
        "reported_date": "2026-01-15T08:30:00Z",
        "completed_date": "2026-01-15T14:45:00Z",
        "downtime_hours": 6.0,
        "failure_code": "GRID_FAULT",
        "cause_code": "FUSE_BLOWN",
        "total_cost": 1180.00,
        "parts_consumed": [{"part_id": "SP-FUSE-60A", "qty": 2}]
    }
]

failure_taxonomy = {
    "failure_code": "GRID_FAULT",
    "failure_description": "Grid voltage or frequency excursion causing inverter trip",
    "cause_code": "FUSE_BLOWN",
    "cause_description": "DC string fuse failure due to thermal cycling",
    "recurrence_rate": 0.35,
    "typical_mttr_hours": 4.5,
    "typical_cost": 1200.00
}

recurring = failure_taxonomy["recurrence_rate"] > 0.2
prior_wos = len(maintenance_history)

print(f"Prior work orders:   {prior_wos}")
print(f"Failure:             {failure_taxonomy['failure_description']}")
print(f"Root cause:          {failure_taxonomy['cause_description']}")
print(f"Recurrence rate:     {failure_taxonomy['recurrence_rate']:.0%}")
print(f"Recurring:           {'YES' if recurring else 'No'}")
print(f"Typical MTTR:        {failure_taxonomy['typical_mttr_hours']} hours")
print(f"Typical cost:        R {failure_taxonomy['typical_cost']:,.2f}")
```

**Output:**
```
Prior work orders:   2
Failure:             Grid voltage or frequency excursion causing inverter trip
Root cause:          DC string fuse failure due to thermal cycling
Recurrence rate:     35%
Recurring:           YES
Typical MTTR:        4.5 hours
Typical cost:        R 1,200.00
```

Two prior corrective work orders for the same failure mode, with 35% recurrence — this is a known, repeating problem.

### Step 3: Check Spare Parts + Procurement

Verify that the parts consumed in prior repairs are in stock before dispatching.

```python
spare_parts = {
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

procurement = {
    "part_id": "SP-FUSE-60A",
    "preferred_supplier": "Phoenix Contact SA",
    "avg_lead_time_days": 12,
    "avg_unit_cost": 17.80,
    "last_po_date": "2026-01-20",
    "open_po_qty": 50,
    "open_po_eta": "2026-02-10"
}

# Check if needed parts are available
needed_qty = 2  # based on prior WO consumption
parts_available = spare_parts["qty_available"] >= needed_qty

print(f"Part: {spare_parts['description']}")
print(f"  On hand:     {spare_parts['qty_on_hand']}")
print(f"  Reserved:    {spare_parts['qty_reserved']}")
print(f"  Available:   {spare_parts['qty_available']}")
print(f"  Needed:      {needed_qty}")
print(f"  In stock:    {'YES' if parts_available else 'NO'}")
print(f"  Open PO:     {procurement['open_po_qty']} units, ETA {procurement['open_po_eta']}")
```

**Output:**
```
Part: 60A DC string fuse, 1000V
  On hand:     24
  Reserved:    4
  Available:   20
  Needed:      2
  In stock:    YES
  Open PO:     50 units, ETA 2026-02-10
```

Parts are available. No supply chain blocker.

### Step 4: Combine Signals — Make the Decision

```python
decision_inputs = {
    "escalating": escalating,       # True — rate 2.86
    "recurring": recurring,         # True — 35% recurrence
    "parts_available": parts_available  # True — 20 available
}

# Decision matrix
if decision_inputs["escalating"] and decision_inputs["recurring"]:
    if decision_inputs["parts_available"]:
        action = "DISPATCH NOW"
        reason = "Escalating alarm with recurring failure pattern — parts in stock"
    else:
        action = "ORDER PARTS + SCHEDULE"
        reason = "Escalating alarm with recurring failure — waiting on parts"
elif decision_inputs["escalating"]:
    action = "SCHEDULE INSPECTION"
    reason = "Escalating alarm but no prior failure history — investigate first"
elif decision_inputs["recurring"]:
    action = "SCHEDULE MAINTENANCE"
    reason = "Known recurring failure but alarm rate is stable"
else:
    action = "MONITOR"
    reason = "Low alarm rate, no recurring failure pattern"

print(f"\n{'='*50}")
print(f"  DECISION: {action}")
print(f"  Reason:   {reason}")
print(f"{'='*50}")
print(f"\n  Equipment:    {alarm_profile['equipment_id']}")
print(f"  Alarm:        {alarm_profile['alarm_code']}")
print(f"  Est. MTTR:    {failure_taxonomy['typical_mttr_hours']} hours")
print(f"  Est. cost:    R {failure_taxonomy['typical_cost']:,.2f}")
print(f"  Parts needed: {needed_qty}x {spare_parts['description']}")
```

**Output:**
```
==================================================
  DECISION: DISPATCH NOW
  Reason:   Escalating alarm with recurring failure pattern — parts in stock
==================================================

  Equipment:    KRG-INV-002
  Alarm:        GRID_FAULT_UV
  Est. MTTR:    4.5 hours
  Est. cost:    R 1,200.00
  Parts needed: 2x 60A DC string fuse, 1000V
```

## Decision Matrix Reference

| Escalating? | Recurring? | Parts Available? | Action | Priority |
|---|---|---|---|---|
| Yes | Yes | Yes | **DISPATCH NOW** | Critical |
| Yes | Yes | No | **ORDER PARTS + SCHEDULE** | High |
| Yes | No | — | **SCHEDULE INSPECTION** | Medium |
| No | Yes | Yes | **SCHEDULE MAINTENANCE** | Medium |
| No | No | — | **MONITOR** | Low |

The matrix encodes a simple heuristic: escalating alarms with known failure patterns get immediate attention (if parts are available). Everything else can be scheduled or monitored. Production deployments should tune thresholds (e.g., `escalation_rate > 2.0` for critical sites, `> 1.5` for others) based on site-specific risk tolerance.

## What to Read Next

- [ERP Enrichment Schemas](/docs/schemas/erp-enrichment) — Full field reference for all seven schemas used in this pattern
- [Production Case Study: Multi-OEM Forecasting Pipeline](/docs/patterns/forecasting-pipeline-case-study) — Another ODS-E pipeline pattern in production
- [Schema Validation](/docs/validation/schema-validation) — Validate records before running triage logic
- [Basic: Transform + Validate](/docs/patterns/basic-transform-validate) — The simplest ODS-E pipeline pattern
