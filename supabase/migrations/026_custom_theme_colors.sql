-- Add custom theme color columns
alter table store_settings
  add column if not exists custom_primary text,
  add column if not exists custom_secondary text;

-- Update theme check constraint to include 'custom'
alter table store_settings drop constraint if exists store_settings_theme_check;
alter table store_settings add constraint store_settings_theme_check
  check (theme in ('light', 'dark', 'warm', 'floral', 'custom'));
