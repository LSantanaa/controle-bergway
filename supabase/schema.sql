create extension if not exists pgcrypto;

create type public.user_role as enum ('admin', 'collaborator');
create type public.barrel_status as enum ('available', 'out');
create type public.movement_type as enum ('checkout', 'checkin');

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role public.user_role not null default 'collaborator',
  is_active boolean not null default false,
  created_at timestamptz not null default timezone('America/Sao_Paulo', now()),
  updated_at timestamptz not null default timezone('America/Sao_Paulo', now())
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trade_name text,
  contact_name text,
  phone text,
  city text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('America/Sao_Paulo', now()),
  updated_at timestamptz not null default timezone('America/Sao_Paulo', now())
);

create table if not exists public.barrels (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  capacity_liters integer not null check (capacity_liters > 0),
  status public.barrel_status not null default 'available',
  notes text,
  is_active boolean not null default true,
  current_customer_id uuid references public.customers (id),
  created_at timestamptz not null default timezone('America/Sao_Paulo', now()),
  updated_at timestamptz not null default timezone('America/Sao_Paulo', now())
);

create table if not exists public.movements (
  id uuid primary key default gen_random_uuid(),
  barrel_id uuid not null references public.barrels (id),
  barrel_code text not null,
  customer_id uuid references public.customers (id),
  movement_type public.movement_type not null,
  notes text,
  performed_by uuid not null references public.profiles (id),
  occurred_at timestamptz not null default timezone('America/Sao_Paulo', now())
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('America/Sao_Paulo', now());
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute procedure public.touch_updated_at();

drop trigger if exists customers_touch_updated_at on public.customers;
create trigger customers_touch_updated_at
before update on public.customers
for each row execute procedure public.touch_updated_at();

drop trigger if exists barrels_touch_updated_at on public.barrels;
create trigger barrels_touch_updated_at
before update on public.barrels
for each row execute procedure public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.current_app_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_app_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_active from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.register_barrel_movement(
  p_barrel_code text,
  p_movement_type public.movement_type,
  p_customer_id uuid default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_barrel public.barrels;
  v_customer public.customers;
  v_movement_id uuid;
  v_role public.user_role;
  v_active boolean;
  v_customer_for_log uuid;
begin
  select role, is_active
    into v_role, v_active
  from public.profiles
  where id = auth.uid();

  if auth.uid() is null then
    raise exception 'Usuario nao autenticado';
  end if;

  if coalesce(v_active, false) is false then
    raise exception 'Usuario sem acesso liberado';
  end if;

  if v_role not in ('admin', 'collaborator') then
    raise exception 'Usuario sem permissao para movimentar barris';
  end if;

  select *
    into v_barrel
  from public.barrels
  where lower(code) = lower(trim(p_barrel_code))
    and is_active = true;

  if not found then
    raise exception 'Barril nao encontrado';
  end if;

  if p_movement_type = 'checkout' then
    if v_barrel.status <> 'available' then
      raise exception 'Barril ja esta fora da cervejaria';
    end if;

    if p_customer_id is null then
      raise exception 'Cliente obrigatorio para saida';
    end if;

    select *
      into v_customer
    from public.customers
    where id = p_customer_id
      and is_active = true;

    if not found then
      raise exception 'Cliente nao encontrado ou inativo';
    end if;

    update public.barrels
       set status = 'out',
           current_customer_id = v_customer.id
     where id = v_barrel.id;

    v_customer_for_log := v_customer.id;
  else
    if v_barrel.status <> 'out' then
      raise exception 'Barril ja esta em estoque';
    end if;

    v_customer_for_log := v_barrel.current_customer_id;

    update public.barrels
       set status = 'available',
           current_customer_id = null
     where id = v_barrel.id;
  end if;

  insert into public.movements (
    barrel_id,
    barrel_code,
    customer_id,
    movement_type,
    notes,
    performed_by
  )
  values (
    v_barrel.id,
    v_barrel.code,
    v_customer_for_log,
    p_movement_type,
    nullif(trim(p_notes), ''),
    auth.uid()
  )
  returning id into v_movement_id;

  return v_movement_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.barrels enable row level security;
alter table public.movements enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
using (auth.uid() = id or public.current_app_role() = 'admin');

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
using (auth.uid() = id or public.current_app_role() = 'admin')
with check (auth.uid() = id or public.current_app_role() = 'admin');

drop policy if exists "customers_select_active_users" on public.customers;
create policy "customers_select_active_users"
on public.customers for select
using (auth.role() = 'authenticated' and public.current_app_active());

drop policy if exists "customers_admin_insert" on public.customers;
create policy "customers_admin_insert"
on public.customers for insert
with check (public.current_app_role() = 'admin' and public.current_app_active());

drop policy if exists "customers_admin_update" on public.customers;
create policy "customers_admin_update"
on public.customers for update
using (public.current_app_role() = 'admin' and public.current_app_active())
with check (public.current_app_role() = 'admin' and public.current_app_active());

drop policy if exists "customers_admin_delete" on public.customers;
create policy "customers_admin_delete"
on public.customers for delete
using (public.current_app_role() = 'admin' and public.current_app_active());

drop policy if exists "barrels_select_active_users" on public.barrels;
create policy "barrels_select_active_users"
on public.barrels for select
using (auth.role() = 'authenticated' and public.current_app_active());

drop policy if exists "barrels_admin_insert" on public.barrels;
create policy "barrels_admin_insert"
on public.barrels for insert
with check (public.current_app_role() = 'admin' and public.current_app_active());

drop policy if exists "barrels_admin_update" on public.barrels;
create policy "barrels_admin_update"
on public.barrels for update
using (public.current_app_role() = 'admin' and public.current_app_active())
with check (public.current_app_role() = 'admin' and public.current_app_active());

drop policy if exists "barrels_admin_delete" on public.barrels;
create policy "barrels_admin_delete"
on public.barrels for delete
using (public.current_app_role() = 'admin' and public.current_app_active());

drop policy if exists "movements_select_active_users" on public.movements;
create policy "movements_select_active_users"
on public.movements for select
using (auth.role() = 'authenticated' and public.current_app_active());

grant execute on function public.current_app_role() to authenticated;
grant execute on function public.current_app_active() to authenticated;
grant execute on function public.register_barrel_movement(text, public.movement_type, uuid, text) to authenticated;

create index if not exists idx_barrels_code on public.barrels (code);
create index if not exists idx_barrels_status on public.barrels (status);
create index if not exists idx_movements_occurred_at on public.movements (occurred_at desc);
create index if not exists idx_movements_barrel_code on public.movements (barrel_code);

-- O primeiro admin pode ser criado manualmente em Authentication > Users.
-- Depois disso, os proximos usuarios podem ser criados pelo proprio sistema
-- usando a chave secreta apenas no servidor Next.js.
--
-- Depois de criar seu primeiro usuario em Authentication > Users, rode:
-- update public.profiles
--    set role = 'admin', is_active = true
--  where email = 'seu-email@cervejaria.com';
