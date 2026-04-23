-- Add 'floral' to the theme check constraint on store_settings
alter table store_settings drop constraint if exists store_settings_theme_check;
alter table store_settings add constraint store_settings_theme_check
  check (theme in ('light', 'dark', 'warm', 'floral'));
