# Contracts: Supabase Realtime Channels

**Branch**: `001-pos-inventory-mvp`  
**Date**: 2026-04-20

The queue screen uses Supabase Realtime to receive live order updates without
polling. One channel is used per client session.

---

## Channel: `orders-queue`

**Subscribed by**: Queue page (`app/(dashboard)/queue/page.tsx`)  
**Table**: `orders`  
**Events**: `INSERT`, `UPDATE`  
**Filter**: `status=eq.placed` (initial subscription shows only placed orders)

**Client setup**:
```ts
supabase
  .channel('orders-queue')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'orders',
  }, (payload) => {
    // INSERT: add new order to queue
    // UPDATE: if status → 'completed', remove from queue
  })
  .subscribe()
```

**Behavior**:
- On `INSERT` with `status = 'placed'`: add the new order card to the queue list
- On `UPDATE` with `status = 'completed'`: remove the order card from the queue list
- No other status transitions exist in MVP

**Cleanup**: Channel MUST be unsubscribed when the queue page unmounts.

---

## Supabase Edge Function: `low-stock-alert`

**Trigger**: Supabase Database Webhook on `UPDATE` of `ingredients` table  
**Function file**: `supabase/functions/low-stock-alert/index.ts`

**Payload received** (from Supabase webhook):
```json
{
  "type": "UPDATE",
  "table": "ingredients",
  "record": {
    "id": "<uuid>",
    "name": "<string>",
    "stock_qty": "<number>",
    "low_stock_threshold": "<number | null>"
  },
  "old_record": {
    "stock_qty": "<previous_number>"
  }
}
```

**Logic**:
1. Check if `record.low_stock_threshold` is not null
2. Check if `record.stock_qty <= record.low_stock_threshold`
3. If both: call SendGrid API to send an email to the configured operator address

**SendGrid email**:
- **To**: `OPERATOR_EMAIL` (environment variable)
- **Subject**: `Low Stock Alert: {ingredient_name}`
- **Body**: `{ingredient_name} is low. Current stock: {stock_qty} {unit}. Threshold: {low_stock_threshold}.`

**Environment variables required**:
- `SENDGRID_API_KEY`
- `OPERATOR_EMAIL`
- `SENDGRID_FROM_EMAIL`
