-- Add payment tracking columns to orders table
ALTER TABLE orders ADD COLUMN amount_received numeric(10,2);
ALTER TABLE orders ADD COLUMN change_amount numeric(10,2);
ALTER TABLE orders ADD COLUMN change_given boolean NOT NULL DEFAULT true;
