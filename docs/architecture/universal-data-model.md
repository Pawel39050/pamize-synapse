# PAMIZE Universal Data Model — design specification v0.1

This is a **design** — not a deployed database. A formal migration and isolated tenant policy are required before production.

## Groups and core entities

**Identity:** tenants, organizations, plants, organizational_units, users, memberships, roles.

**Sources:** source_systems, import_batches, source_records (with checksum), data_mappings, validation_results, data_quality_issues.

**Master:** customers, suppliers, products, product_categories, units_of_measure, exchange_rates, cost_centers, work_centers, equipment.

**Commercial:** sales_orders, sales_order_lines, sales_invoices, sales_invoice_lines, credit_notes, purchase_orders, purchase_order_lines, purchase_invoices.

**Accounting and working capital:** ledger_entries, cost_records, receivables, payables, payments, payment_allocations, inventory_balances, inventory_movements.

**Production:** bills_of_material, routings, production_orders, production_operations, equipment_events, downtime_events, changeover_events, quality_losses.

**Diagnosis:** surveys, survey_responses, diagnostic_runs, diagnostic_findings, evidence_links, calculation_runs, diagnostic_rules, scenarios.

**Transformation:** initiatives, approvals, KPI_definitions, KPI_observations, benefit_measurements, benefit_dependencies, audit_events.

## Cross-cutting columns
- `id` UUID; `tenant_id` UUID NOT NULL; `source_system_id` and `source_record_id` for sourced records.
- `effective_from`, `effective_to` for relevant changing business facts.
- `created_at`, `updated_at`; data time zone explicit; monetary currency ISO code.
- Monetary quantities as decimal, not binary float; dimensioned units and explicit FX rate date.
- `import_batch_id` provenance, `data_quality_status`, validation/reconciliation metadata.
- Tenant-prefixed composite FK/indexes and enforced row-level tenant checks **at the database**, not only in app.

## Key relationships
- one tenant → many org_units, customers, products, source systems, agent instances and diagnostic runs.
- one sales_invoice → many invoice_lines, credit_notes / payment allocations.
- one product → potentially many BOM entries, routing steps, sales/purchase lines.
- one production_order → operations/events/material issues; machine references a work center.
- one diagnostic_finding → many evidence_links and alternative scenarios.
- one initiative → many benefit_measurements with baseline and verification owner.
- one benefit dependency links overlapping initiatives to prevent double counting.

## Financial semantics
Contribution margin is a hierarchy of *defined*, non-overlapping attributable cost components. Keep separately:
- sales net of rebates and credit notes;
- relevant variable production/product costs;
- order/customer-specific fulfillment and logistics;
- economic cost of financing receivables;
- avoidable costs versus allocated fixed overhead.
No recommendation to drop a customer may rely solely on arbitrary fixed cost allocation.
DSO/DPO/DIO use period-aligned, consistent average balances and denominators, with explicitly defined VAT treatment.

## Import quality
1. Preserve raw source files outside the DB with hashes and restricted access.
2. Validate schema, type, UoM, currency, date, row counts and uniqueness.
3. Reconcile sales and ledger totals to controlling.
4. Publish normalized records only after accepted checks.
5. Mark assumptions and estimation uncertainty in each derived metric.

## Version milestones
MVP: tenants, source batches, customers, products, invoice lines, costs, receivables/payables, findings, evidence, initiatives.
Production wave: MES events, equipment, orders, losses and constraints.
