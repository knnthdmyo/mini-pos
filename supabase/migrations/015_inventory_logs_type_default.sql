-- 015_inventory_logs_type_default.sql
-- Add enum values our app needs to inventory_log_type.
-- NOTE: Setting the default must happen in a separate migration (016)
-- because Postgres requires a transaction commit after ADD VALUE.

alter type inventory_log_type add value if not exists 'order';
alter type inventory_log_type add value if not exists 'batch';
alter type inventory_log_type add value if not exists 'manual';


