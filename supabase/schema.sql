create extension if not exists "pgcrypto";

create table if not exists public.stores (
  id text primary key,
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('staff', 'manager', 'admin')) default 'staff',
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  id text primary key,
  store_id text not null references public.stores(id) on delete cascade,
  category text not null check (category in ('drink', 'alcohol', 'cooking', 'hall')),
  name text not null,
  unit text not null,
  quantity integer not null default 0 check (quantity >= 0),
  minimum_quantity integer not null default 0 check (minimum_quantity >= 0),
  status text not null check (status in ('normal', 'low', 'empty', 'unknown')),
  updated_at timestamptz not null default now(),
  updated_by text not null default 'system',
  updated_by_name text not null default '시스템'
);

create table if not exists public.inventory_logs (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores(id) on delete cascade,
  item_id text not null references public.items(id) on delete cascade,
  item_name text not null,
  category text not null,
  before_quantity integer not null,
  after_quantity integer not null,
  unit text not null,
  memo text,
  updated_by text not null,
  updated_by_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_closings (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores(id) on delete cascade,
  date date not null,
  items jsonb not null,
  completed_by text not null,
  completed_by_name text not null,
  completed_at timestamptz not null default now(),
  memo text
);

create table if not exists public.app_users (
  id text primary key,
  store_id text not null references public.stores(id) on delete cascade,
  name text not null,
  code text not null unique,
  role text not null check (role in ('staff', 'manager', 'admin', 'developer')) default 'staff',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores(id) on delete cascade,
  zone text not null check (zone in ('middle', 'yard')),
  name text not null,
  party_size integer not null check (party_size > 0),
  phone text not null,
  status text not null check (status in ('reserved', 'arrived', 'no_show', 'canceled')) default 'reserved',
  memo text,
  sort_order bigint not null default extract(epoch from now()) * 1000,
  created_by_name text not null default '직원',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.table_memos (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores(id) on delete cascade,
  area text not null check (area in ('indoor', 'middle', 'yard', 'custom')),
  table_no text not null,
  orders jsonb not null default '[]'::jsonb,
  note text,
  status text not null check (status in ('open', 'closed')) default 'open',
  updated_by_name text not null default '직원',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sold_out_menus (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores(id) on delete cascade,
  menu_name text not null,
  reason text,
  active boolean not null default true,
  created_by_name text not null default '직원',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id text primary key,
  store_id text not null references public.stores(id) on delete cascade,
  category text not null check (category in ('main', 'fried', 'meal', 'side', 'drink', 'alcohol')),
  name text not null,
  price integer not null default 0 check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.today_bookings (
  id uuid primary key default gen_random_uuid(),
  store_id text not null references public.stores(id) on delete cascade,
  title text not null,
  party_size integer not null check (party_size > 0),
  menu text not null,
  time text not null,
  tables jsonb not null default '[]'::jsonb,
  status text not null check (status in ('scheduled', 'seated', 'completed', 'canceled')) default 'scheduled',
  memo text,
  created_by_name text not null default '직원',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stores enable row level security;
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.inventory_logs enable row level security;
alter table public.daily_closings enable row level security;
alter table public.app_users enable row level security;
alter table public.reservations enable row level security;
alter table public.table_memos enable row level security;
alter table public.sold_out_menus enable row level security;
alter table public.menu_items enable row level security;
alter table public.today_bookings enable row level security;

drop policy if exists "authenticated can read stores" on public.stores;
create policy "authenticated can read stores"
on public.stores for select
to authenticated
using (true);

drop policy if exists "anon can read stores" on public.stores;
create policy "anon can read stores"
on public.stores for select
to anon
using (true);

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "authenticated can read items" on public.items;
create policy "authenticated can read items"
on public.items for select
to authenticated
using (true);

drop policy if exists "anon can read items" on public.items;
create policy "anon can read items"
on public.items for select
to anon
using (true);

drop policy if exists "authenticated can seed items" on public.items;
create policy "authenticated can seed items"
on public.items for insert
to authenticated
with check (true);

drop policy if exists "anon can seed items" on public.items;
create policy "anon can seed items"
on public.items for insert
to anon
with check (true);

drop policy if exists "authenticated can update items" on public.items;
create policy "authenticated can update items"
on public.items for update
to authenticated
using (true)
with check (true);

drop policy if exists "anon can update items" on public.items;
create policy "anon can update items"
on public.items for update
to anon
using (true)
with check (true);

drop policy if exists "authenticated can read logs" on public.inventory_logs;
create policy "authenticated can read logs"
on public.inventory_logs for select
to authenticated
using (true);

drop policy if exists "anon can read logs" on public.inventory_logs;
create policy "anon can read logs"
on public.inventory_logs for select
to anon
using (true);

drop policy if exists "authenticated can insert logs" on public.inventory_logs;
create policy "authenticated can insert logs"
on public.inventory_logs for insert
to authenticated
with check (true);

drop policy if exists "anon can insert logs" on public.inventory_logs;
create policy "anon can insert logs"
on public.inventory_logs for insert
to anon
with check (true);

drop policy if exists "authenticated can read closings" on public.daily_closings;
create policy "authenticated can read closings"
on public.daily_closings for select
to authenticated
using (true);

drop policy if exists "anon can read closings" on public.daily_closings;
create policy "anon can read closings"
on public.daily_closings for select
to anon
using (true);

drop policy if exists "authenticated can insert closings" on public.daily_closings;
create policy "authenticated can insert closings"
on public.daily_closings for insert
to authenticated
with check (true);

drop policy if exists "anon can insert closings" on public.daily_closings;
create policy "anon can insert closings"
on public.daily_closings for insert
to anon
with check (true);

drop policy if exists "anon can manage app users" on public.app_users;
create policy "anon can manage app users"
on public.app_users for all
to anon
using (true)
with check (true);

drop policy if exists "anon can manage reservations" on public.reservations;
create policy "anon can manage reservations"
on public.reservations for all
to anon
using (true)
with check (true);

drop policy if exists "anon can manage table memos" on public.table_memos;
create policy "anon can manage table memos"
on public.table_memos for all
to anon
using (true)
with check (true);

drop policy if exists "anon can manage sold out menus" on public.sold_out_menus;
create policy "anon can manage sold out menus"
on public.sold_out_menus for all
to anon
using (true)
with check (true);

drop policy if exists "anon can manage menu items" on public.menu_items;
create policy "anon can manage menu items"
on public.menu_items for all
to anon
using (true)
with check (true);

drop policy if exists "anon can manage today bookings" on public.today_bookings;
create policy "anon can manage today bookings"
on public.today_bookings for all
to anon
using (true)
with check (true);

create or replace function public.login_with_staff_code(p_store_id text, p_code text)
returns table (
  id text,
  name text,
  role text,
  created_at timestamptz
)
language sql
security definer
as $$
  select app_users.id, app_users.name, app_users.role, app_users.created_at
  from public.app_users
  where app_users.store_id = p_store_id
    and app_users.code = p_code
    and app_users.active = true
  limit 1
$$;

create or replace function public.inventory_status(q integer, min_q integer)
returns text
language sql
immutable
as $$
  select case
    when q <= 0 then 'empty'
    when q <= min_q then 'low'
    else 'normal'
  end
$$;

create or replace function public.update_item_quantity(
  p_item_id text,
  p_after_quantity integer,
  p_unit text,
  p_memo text,
  p_updated_by text,
  p_updated_by_name text
)
returns void
language plpgsql
security definer
as $$
declare
  locked_item public.items%rowtype;
begin
  select * into locked_item
  from public.items
  where id = p_item_id
  for update;

  if not found then
    raise exception 'item % not found', p_item_id;
  end if;

  update public.items
  set quantity = greatest(0, p_after_quantity),
      unit = coalesce(nullif(p_unit, ''), unit),
      status = public.inventory_status(greatest(0, p_after_quantity), minimum_quantity),
      updated_at = now(),
      updated_by = p_updated_by,
      updated_by_name = p_updated_by_name
  where id = p_item_id;

  insert into public.inventory_logs (
    store_id, item_id, item_name, category, before_quantity, after_quantity, unit, memo, updated_by, updated_by_name
  )
  values (
    locked_item.store_id, locked_item.id, locked_item.name, locked_item.category,
    locked_item.quantity, greatest(0, p_after_quantity), coalesce(nullif(p_unit, ''), locked_item.unit), p_memo, p_updated_by, p_updated_by_name
  );
end;
$$;

insert into public.stores (id, name, invite_code)
values ('demo-store', '88포차', 'HALL88')
on conflict (id) do nothing;

insert into public.app_users (id, store_id, name, code, role)
values ('developer-park', 'demo-store', '박찬웅', 'PARK-88-DEV', 'developer')
on conflict (id) do update
set name = excluded.name,
    code = excluded.code,
    role = excluded.role,
    active = true;

do $$
begin
  alter publication supabase_realtime add table public.items;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.inventory_logs;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.daily_closings;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.app_users;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.reservations;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.table_memos;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.sold_out_menus;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.menu_items;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.today_bookings;
exception when duplicate_object then null;
end $$;
