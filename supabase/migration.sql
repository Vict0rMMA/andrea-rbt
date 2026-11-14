-- Andrea RBT: cloud save for study progress.
-- The table is locked with RLS (no policies), so the public key cannot read or write it directly.
-- The app only calls rbt_load / rbt_save, which check the name + PIN (stored as a bcrypt hash).

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.rbt_progress (
  profile text primary key,
  pin_hash text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  failed_attempts int not null default 0,
  locked_until timestamptz
);

alter table public.rbt_progress enable row level security;
revoke all on public.rbt_progress from anon, authenticated;

create or replace function public.rbt_check(p_profile text, p_pin text)
returns public.rbt_progress
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r public.rbt_progress;
begin
  select * into r from public.rbt_progress where profile = p_profile;
  if not found then
    return null;
  end if;
  if r.locked_until is not null and r.locked_until > now() then
    raise exception 'locked';
  end if;
  if r.pin_hash <> crypt(p_pin, r.pin_hash) then
    update public.rbt_progress
      set failed_attempts = failed_attempts + 1,
          locked_until = case when failed_attempts + 1 >= 10 then now() + interval '15 minutes' else null end
      where profile = p_profile;
    raise exception 'wrong_pin';
  end if;
  if r.failed_attempts > 0 then
    update public.rbt_progress set failed_attempts = 0, locked_until = null where profile = p_profile;
  end if;
  return r;
end;
$$;

create or replace function public.rbt_load(p_profile text, p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r public.rbt_progress;
begin
  r := public.rbt_check(lower(trim(p_profile)), p_pin);
  if r.profile is null then
    return null;
  end if;
  return jsonb_build_object('data', r.data, 'updated_at', r.updated_at);
end;
$$;

create or replace function public.rbt_save(p_profile text, p_pin text, p_data jsonb)
returns timestamptz
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r public.rbt_progress;
  v_profile text := lower(trim(p_profile));
begin
  if length(v_profile) < 2 or length(v_profile) > 40 then
    raise exception 'bad_profile';
  end if;
  if p_pin !~ '^[0-9]{4,8}$' then
    raise exception 'bad_pin';
  end if;
  if pg_column_size(p_data) > 2000000 then
    raise exception 'too_big';
  end if;
  r := public.rbt_check(v_profile, p_pin);
  if r.profile is null then
    insert into public.rbt_progress (profile, pin_hash, data)
      values (v_profile, crypt(p_pin, gen_salt('bf')), p_data);
  else
    update public.rbt_progress set data = p_data, updated_at = now() where profile = v_profile;
  end if;
  return now();
end;
$$;

revoke all on function public.rbt_check(text, text) from public, anon, authenticated;
grant execute on function public.rbt_load(text, text) to anon, authenticated;
grant execute on function public.rbt_save(text, text, jsonb) to anon, authenticated;
