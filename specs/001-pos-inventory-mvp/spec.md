# Feature Specification: POS & Inventory System (MVP)

**Feature Branch**: `001-pos-inventory-mvp`  
**Created**: 2026-04-20  
**Status**: Draft  
**Input**: User description: "POS & Inventory System MVP — order creation, queue, inventory, batch prep, reporting, alerts, auth"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Place and Complete an Order (Priority: P1)

A staff member opens the POS screen, sees all products as large tap buttons, taps
to add items to the current order, reviews the order summary with total price, and
places the order. The order enters the queue. The same operator later marks the
order as completed, which deducts inventory and records revenue.

**Why this priority**: This is the single most critical flow. Without it, no
revenue is captured, no inventory is tracked, and the business cannot operate.
Every other feature depends on orders existing.

**Independent Test**: Can be fully tested by creating one product with a recipe,
placing an order for it, and completing the order — then verifying inventory was
deducted and revenue was recorded. Delivers the full end-to-end transaction loop.

**Acceptance Scenarios**:

1. **Given** the POS screen is open, **When** the staff taps a product button,
   **Then** the item is added to the current order and the order summary updates
   with the item and new total.
2. **Given** an order has at least one item, **When** the staff taps "Place Order",
   **Then** the order appears in the queue with status `placed` and a creation
   timestamp.
3. **Given** an order is in the queue with status `placed`, **When** the staff taps
   "Complete Order", **Then** the order status changes to `completed`, inventory is
   deducted (from prepared stock or ingredients per recipe), revenue is recorded,
   and inventory changes are logged.
4. **Given** the staff taps "Cancel Order" before placing, **When** confirmed,
   **Then** the current order is cleared and no order is recorded.

---

### User Story 2 - Manage Order Queue (Priority: P2)

A staff member views the live order queue, sees all placed orders with their items
and elapsed time, and marks each as completed when fulfilled.

**Why this priority**: Without the queue, the operator has no way to track
open orders, causing orders to be missed — the primary problem this system solves.

**Independent Test**: Can be tested by placing multiple orders and confirming they
appear instantly in the queue with correct items and timestamps. Completing one
order verifies queue state transitions.

**Acceptance Scenarios**:

1. **Given** an order is placed, **When** the queue screen is viewed, **Then** the
   order appears immediately with its items and time elapsed since creation.
2. **Given** multiple orders are in the queue, **When** one is completed, **Then**
   it is removed from the active queue view and marked `completed`.
3. **Given** an order in the queue, **When** the staff taps "Edit Order", **Then**
   the order items can be modified and the order is re-saved with the same status.

---

### User Story 3 - Track and Adjust Inventory (Priority: P3)

A staff member views current ingredient stock levels, sees which are low-stock
(highlighted), and makes manual adjustments to correct discrepancies.

**Why this priority**: Inventory accuracy is a core purpose of the system. Without
this, cost tracking is unreliable and restocking cannot be managed.

**Independent Test**: Can be tested by viewing the ingredient list, manually
adjusting a quantity, and confirming the change is reflected and logged.

**Acceptance Scenarios**:

1. **Given** the inventory screen is open, **When** viewing ingredients, **Then**
   each ingredient shows current stock quantity and its low-stock threshold.
2. **Given** an ingredient's stock is at or below its threshold, **When** viewing
   the list, **Then** that ingredient is visually highlighted as low stock.
3. **Given** a manual stock adjustment is submitted, **When** saved, **Then** the
   stock quantity updates and the adjustment is recorded in inventory logs.

---

### User Story 4 - Prepare a Batch (Priority: P4)

A staff member selects a product and a quantity to batch-prepare. The system
deducts the required ingredients based on the product recipe and increases the
product's prepared stock accordingly.

**Why this priority**: Products with prepared stock require this flow before they
can be sold. Without it, sales of such products cannot deduct prepared stock.

**Independent Test**: Can be tested by executing one batch for a product with a
defined recipe, then verifying ingredient quantities decreased and prepared stock
increased by the correct amounts.

**Acceptance Scenarios**:

1. **Given** a product with a defined recipe, **When** a batch of N units is
   prepared, **Then** each ingredient is deducted by (recipe quantity × N) and the
   product's prepared stock increases by N.
2. **Given** ingredient stock falls below zero after a batch, **When** the batch
   is saved, **Then** the batch completes, inventory reflects the negative value,
   and a flag is recorded (operation is NOT blocked).
3. **Given** a batch is executed, **When** completed, **Then** all ingredient
   deductions are logged in the inventory log with a reference to the batch event.

---

### User Story 5 - View Profit Reports (Priority: P5)

A staff member or admin opens the reports screen, selects a time filter (daily,
weekly, monthly), and sees total revenue, total cost, and total profit for the
period.

**Why this priority**: Daily profit visibility is a stated core purpose. Without
reporting, operators cannot verify whether the business is profitable.

**Independent Test**: Can be tested by placing and completing several orders, then
viewing the daily report and confirming revenue, cost, and profit match the
expected totals based on the completed orders and logged inventory costs.

**Acceptance Scenarios**:

1. **Given** completed orders exist for today, **When** the daily report is viewed,
   **Then** revenue equals the sum of all completed order totals for the day.
2. **Given** inventory logs exist for today, **When** the daily report is viewed,
   **Then** cost equals the sum of all ingredient deductions for the day valued at
   cost-per-unit.
3. **Given** revenue and cost are computed, **When** the report is displayed,
   **Then** profit = revenue − cost is clearly shown alongside both components.
4. **Given** a weekly or monthly filter is selected, **When** the report loads,
   **Then** data is aggregated across all days in that window.

---

### User Story 6 - Receive Low Stock Alerts (Priority: P6)

When any ingredient's stock drops to or below its threshold, the system
automatically sends an email notification so the operator can restock.

**Why this priority**: Operators cannot watch stock levels continuously; automated
alerts prevent stockouts that would interrupt operations.

**Independent Test**: Can be tested by setting a low threshold on an ingredient,
completing an order that reduces its stock to the threshold, and confirming an
email is sent (inspectable via email provider logs or test inbox).

**Acceptance Scenarios**:

1. **Given** an ingredient's stock reaches or falls below its `low_stock_threshold`,
   **When** this change is saved, **Then** an email alert is sent via the configured
   email service.
2. **Given** a low stock alert was triggered, **When** viewing the ingredient list,
   **Then** the ingredient is still highlighted and the alert does NOT block any
   pending or future sales.

---

### User Story 7 - Authenticate and Access the System (Priority: P7)

A user (admin or staff) logs in with credentials before accessing any system
function. All roles have the same access in MVP.

**Why this priority**: Login prevents unauthorized access to the POS and financial
data. Role behavior is simplified for MVP.

**Independent Test**: Can be tested by attempting to access the POS without
logging in (should be blocked), then logging in and confirming full access.

**Acceptance Scenarios**:

1. **Given** a user is not logged in, **When** they attempt to access any screen,
   **Then** they are redirected to the login screen.
2. **Given** valid credentials are submitted, **When** login is confirmed, **Then**
   the user is granted access to all system screens.
3. **Given** invalid credentials are submitted, **When** login is attempted, **Then**
   an error is shown and access is denied.

---

### Edge Cases

- **Negative stock after order completion**: If completing an order drives
  ingredient stock negative, the completion MUST succeed. Negative stock is
  flagged in the inventory view but does NOT block the operation.
- **Empty order placement**: Tapping "Place Order" with no items in the cart MUST
  be prevented with a clear message. No order is created.
- **Order edit after completion**: A completed order MUST be editable. If items are
  changed post-completion, the inventory delta MUST be recomputed and logged.
- **Batch prep with partially insufficient stock**: If ingredient stock is
  insufficient for a full batch, the batch MUST still execute. Resulting negative
  stock is logged and flagged.
- **Multiple concurrent orders in queue**: The queue MUST correctly display all
  placed orders simultaneously ordered by creation time.
- **Low stock threshold not set**: If an ingredient has no threshold configured,
  no low-stock alert is triggered and no highlight is shown for that ingredient.

---

## Requirements _(mandatory)_

### Functional Requirements

**POS — Order Creation**

- **FR-001**: The system MUST display all available products as large, tap-friendly
  buttons on the POS screen.
- **FR-002**: Tapping a product button MUST add one unit of that product to the
  current order and update the order summary and total price immediately.
- **FR-003**: The POS screen MUST show the current order summary (items + quantities)
  and the running total price at all times while an order is being built.
- **FR-004**: The system MUST allow a staff member to place the current order,
  creating it in the queue with status `placed`.
- **FR-005**: The system MUST allow a staff member to cancel the current order,
  clearing all items without creating any order record.
- **FR-006**: The system MUST NOT allow placing an empty order (zero items).
- **FR-007**: Product prices MUST be fixed; no custom pricing or discounts are
  permitted in MVP.
- **FR-008**: Each order represents a single customer transaction; multi-customer
  splitting is not supported in MVP.

**Queue — Order Management**

- **FR-009**: All orders with status `placed` MUST appear in the queue immediately
  after being placed.
- **FR-010**: Each queue entry MUST display the order's items and the time elapsed
  since the order was created.
- **FR-011**: A staff member MUST be able to mark any queued order as `completed`.
- **FR-012**: A staff member MUST be able to edit any order (placed or completed)
  and save the updated items.

**Order Completion — Inventory & Revenue**

- **FR-013**: On order completion, the system MUST deduct inventory:
  - For products with prepared stock: deduct from prepared stock quantity.
  - For products without prepared stock: deduct ingredients per the product's recipe.
- **FR-014**: On order completion, revenue equal to the order total MUST be recorded.
- **FR-015**: All inventory deductions triggered by order completion MUST be logged
  in the inventory log with a reference to the order.
- **FR-016**: The order MUST be assigned a `completed_at` timestamp on completion.

**Inventory — Ingredient Tracking**

- **FR-017**: Each ingredient MUST track: current stock quantity, cost per unit,
  and a low-stock threshold.
- **FR-018**: The system MUST allow manual adjustment of any ingredient's stock
  quantity at any time.
- **FR-019**: All manual stock adjustments MUST be logged in the inventory log.
- **FR-020**: Ingredients at or below their low-stock threshold MUST be visually
  highlighted in the inventory view.
- **FR-021**: The system MUST NOT block any operation due to negative or zero stock.

**Prepared Stock**

- **FR-022**: Products flagged as having prepared stock MUST track a separate
  prepared stock quantity.
- **FR-023**: When a product with prepared stock is sold (order completed), the
  system MUST deduct from prepared stock rather than from raw ingredients.

**Batch Preparation**

- **FR-024**: A staff member MUST be able to initiate a batch preparation by
  selecting a product and specifying a quantity.
- **FR-025**: On batch execution, the system MUST deduct each required ingredient
  by (recipe quantity × batch quantity).
- **FR-026**: On batch execution, the system MUST increase the product's prepared
  stock by the batch quantity.
- **FR-027**: All ingredient deductions from batch preparation MUST be logged in
  the inventory log with a reference to the batch event.

**Reporting**

- **FR-028**: The system MUST provide a reports view showing revenue, cost, and
  profit for a selected period.
- **FR-029**: The reports view MUST support three time filters: daily, weekly,
  monthly.
- **FR-030**: Revenue in reports MUST be derived from completed orders within the
  selected period.
- **FR-031**: Cost in reports MUST be derived from inventory logs (ingredient
  deductions valued at cost-per-unit) within the selected period.
- **FR-032**: Profit MUST be displayed as revenue minus cost.

**Low Stock Alerts**

- **FR-033**: When any ingredient's stock reaches or falls below its threshold,
  the system MUST send an email notification.
- **FR-034**: Low stock alerts MUST NOT block any sale, batch preparation, or
  manual adjustment.

**Authentication**

- **FR-035**: All system screens MUST require a logged-in session; unauthenticated
  access MUST redirect to login.
- **FR-036**: Login MUST use a username and password combination.
- **FR-037**: Both `admin` and `staff` roles exist, but both roles have identical
  access to all features in MVP.

**Error Handling**

- **FR-038**: Completed orders MUST remain editable; changes MUST trigger inventory
  recomputation and logging.
- **FR-039**: Negative stock quantities MUST be permitted and flagged but MUST NOT
  block any operation.

---

### Key Entities

- **Product**: A sellable item. Has a name, price, and a flag indicating whether
  it uses prepared stock. May have a recipe (list of ingredients + quantities).
- **Order**: A customer transaction. Contains one or more order lines (product +
  quantity), a status (`placed` or `completed`), a creation timestamp, and an
  optional `completed_at` timestamp.
- **Order Line**: A single product and quantity within an order.
- **Ingredient**: A raw material. Tracks current stock quantity, cost per unit,
  and a low-stock threshold.
- **Recipe**: Defines how much of each ingredient is required to produce one unit
  of a product. Belongs to a product.
- **Prepared Stock**: The quantity of a product pre-made and ready to sell.
  Associated with a product that has `has_prepared_stock = true`.
- **Inventory Log**: An immutable record of every stock change — deduction or
  addition — with the source (order completion, batch preparation, manual
  adjustment) and timestamp.
- **Batch Preparation**: A logged event that records: product, quantity produced,
  ingredients deducted, and timestamp.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A staff member can create and place a new order in under 5 seconds
  from opening the POS screen (tapping products + placing) for a typical 1–3 item
  order.
- **SC-002**: All placed orders appear in the queue within 1 second of being placed,
  with no manual refresh required.
- **SC-003**: Completing an order records revenue and all inventory deductions with
  zero silent failures — all mutations are verifiable in the inventory log.
- **SC-004**: Daily profit report matches calculated revenue minus cost with 100%
  accuracy based on orders and inventory logs for the day.
- **SC-005**: A low-stock email is sent within a reasonable time (not real-time
  blocking) whenever an ingredient crosses its threshold.
- **SC-006**: No core operation (order placement, order completion, batch
  preparation, manual stock adjustment) is ever blocked by the system, regardless
  of stock levels.
- **SC-007**: All primary actions (place order, complete order, adjust stock,
  run report) are reachable from the main navigation without scrolling.

---

## Assumptions

- The system is operated by a single user on one tablet at a time; no multi-device
  concurrency needs to be handled in MVP.
- Internet connectivity is assumed to be available; offline support is excluded
  from MVP.
- Email delivery for low-stock alerts uses an external email service (e.g.,
  SendGrid); the service account will be configured by the operator.
- A product's price is set at the time of product creation and does not change
  mid-order.
- All batch deductions assume a recipe exists for the product; batch prep cannot
  be initiated for a product with no recipe.
- Currency is single and fixed per deployment; no multi-currency support is needed.
- The `admin` and `staff` distinction is stored for future role-based access but
  has no behavioral difference in MVP.
- Negative stock is a valid operational state (e.g., after correcting a batch
  error); the system allows it but surfaces it visually.
