<!--
  Sync Impact Report
  Version change: (template) → 1.0.0
  Modified principles: N/A (initial ratification)
  Added sections: Core Purpose, Non-Negotiable Principles (×5),
    MVP Scope Boundaries, Data Integrity Rules, UX Rules, Evolution Rule, Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md: Constitution Check gates → ✅ updated
    - .specify/templates/spec-template.md: Scope alignment → ✅ no structural changes required
    - .specify/templates/tasks-template.md: Task categories → ✅ no new principle-driven types required
  Follow-up TODOs: none
-->

# Candy/Shake POS System Constitution

## Core Purpose

This system exists to:

- Prevent missed/forgotten orders
- Track inventory accurately
- Provide exact daily profit visibility

This system is NOT a full enterprise POS. All decisions MUST be evaluated against
this purpose. Any feature that does not serve at least one of these goals MUST be
rejected or deferred.

## Core Principles

### I. Speed First

Creating an order MUST take fewer than 5 seconds. The UI MUST require minimal
thinking. Fewer clicks is always preferred over more features. Every design
decision that adds steps to the order creation flow MUST be rejected unless it
provably prevents a more significant error.

### II. Simplicity Over Completeness

Only essential features are included in MVP. Discounts, refunds, and complex
multi-step workflows are excluded from v1. Any proposed feature MUST justify its
inclusion by directly serving the Core Purpose — not by completeness alone.

### III. Accuracy in Inventory & Profit

Inventory MUST be deducted only on order completion — never on placement or
preparation start. Ingredient-based costing MUST be computed consistently across
all order types. Batch preparation MUST correctly deduct ingredients at the batch
level. No approximations in cost or inventory logging are acceptable.

### IV. Human-Error Tolerant

Orders MUST be editable after completion. Manual stock adjustments MUST be
available at all times. The system MUST NOT block any core operation (order
creation, completion, stock adjustment) due to data inconsistencies. Operators
are humans; the system MUST accommodate mistakes gracefully.

### V. Single-Device Optimized

The system is designed for one tablet operated by one person fulfilling both
cashier and preparation roles. Features MUST NOT require multi-device
coordination. No functionality may depend on real-time multi-user sync in MVP.

## MVP Scope Boundaries

### Included in v1

- POS (order creation)
- Queue management (placed → completed states)
- Inventory (ingredients + prepared stock)
- Batch preparation with ingredient deduction
- Reporting (revenue, cost, profit)
- Low stock alerts (email)

### Excluded from v1

- Offline support
- Multi-payment types
- Discounts / refunds
- Multi-device sync optimization
- Supplier management

Any feature in the Excluded list MUST NOT be designed, implemented, or partially
built during MVP. Scope creep violations MUST be flagged immediately.

## Data Integrity Rules

- Orders are the source of truth for revenue.
- Inventory logs are the source of truth for cost.
- All mutations MUST be logged — no silent state changes are permitted.
- Every inventory deduction MUST be traceable to an order or a manual adjustment.

## UX Rules

- All primary actions MUST be visible without scrolling.
- Buttons MUST be large and tap-friendly (designed for tablet touch).
- The system MUST always show current state — no hidden steps or pending
  ambiguities.

## Evolution Rule

Future features MUST satisfy all three conditions before acceptance:

1. MUST NOT slow down the POS order creation flow.
2. MUST NOT increase the number of taps required for any core action.
3. MUST NOT break inventory accuracy.

If a proposed feature cannot satisfy all three conditions, it MUST be rejected or
delayed until it can.

## Governance

- This constitution supersedes all other practices, preferences, or prior
  conventions for this project.
- Any amendment MUST be reflected in this document with an incremented version
  and updated `Last Amended` date.
- Amendments follow semantic versioning:
  - MAJOR: removal or redefinition of an existing principle.
  - MINOR: addition of a new principle or section.
  - PATCH: wording clarification, typo fix, non-semantic refinement.
- All feature specs, plans, and tasks MUST be validated against this constitution
  before work begins.
- The plan-template.md Constitution Check gate uses the principles defined here
  as compliance criteria.

**Version**: 1.0.0 | **Ratified**: 2026-04-20 | **Last Amended**: 2026-04-20
