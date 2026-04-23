-- Add indexes for efficient reporting queries on completed orders
create index if not exists orders_completed_at_status_idx
  on public.orders (completed_at, status)
  where status = 'completed';

create index if not exists order_items_product_id_idx
  on public.order_items (product_id);
