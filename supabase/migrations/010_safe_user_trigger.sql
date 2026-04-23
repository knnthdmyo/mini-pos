-- 010_safe_user_trigger.sql
-- Make the handle_new_user trigger exception-safe so a failed
-- public.users insert never blocks auth.users creation.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
exception when others then
  -- Log the error but don't block auth sign-up
  raise warning 'handle_new_user: % %', sqlerrm, sqlstate;
  return new;
end;
$$;
