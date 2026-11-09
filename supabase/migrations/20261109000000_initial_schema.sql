-- Khan House production schema (Supabase / Postgres).
-- Mirrors src/lib/types.ts. The demo build keeps the same data in the browser;
-- going live means pointing src/lib/store.ts actions at these tables.

create type public.staff_role as enum ('owner', 'manager', 'cashier', 'kitchen');
create type public.order_status as enum ('new', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled');
create type public.order_type as enum ('pickup', 'delivery');
create type public.order_source as enum ('website', 'doordash', 'walk-in', 'phone');
create type public.payment_method as enum ('card', 'cash');
create type public.payment_status as enum ('paid', 'unpaid', 'refunded');

-- Staff: one row per auth user who works at Khan House.
create table public.staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  role public.staff_role not null default 'cashier',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  last_login timestamptz
);

create table public.menu_items (
  id text primary key,
  name text not null,
  description text not null default '',
  price numeric(8, 2) not null check (price >= 0),
  category text not null check (category in ('mediterranean', 'hibachi', 'wraps', 'sides')),
  image text not null,
  tags text[] not null default '{}',
  available boolean not null default true,
  featured boolean not null default false,
  option_groups text[] not null default '{}',
  sort int not null default 0,
  updated_at timestamptz not null default now()
);

create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default ('KH-' || nextval('public.order_number_seq')),
  created_at timestamptz not null default now(),
  type public.order_type not null,
  source public.order_source not null default 'website',
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  address text,
  scheduled_for text,
  items jsonb not null,
  subtotal numeric(10, 2) not null,
  discount numeric(10, 2) not null default 0,
  delivery_fee numeric(10, 2) not null default 0,
  tax numeric(10, 2) not null default 0,
  tip numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  payment public.payment_method not null,
  payment_status public.payment_status not null default 'unpaid',
  square_payment_id text,
  status public.order_status not null default 'new',
  notes text not null default ''
);
create index orders_created_at_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status) where status not in ('completed', 'cancelled');

create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  status public.order_status not null,
  at timestamptz not null default now(),
  by text not null
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  category text not null,
  amount numeric(10, 2) not null check (amount >= 0),
  note text not null default '',
  created_by uuid references auth.users (id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text not null default '',
  type text not null check (type in ('General', 'Catering', 'Feedback', 'Order Issue')),
  message text not null,
  event_date date,
  guests int,
  read boolean not null default false
);

create table public.settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null
);

create table public.traffic_daily (
  day date primary key,
  visits int not null default 0,
  menu_views int not null default 0,
  carts int not null default 0,
  checkouts int not null default 0
);

-- Role helpers (security definer so policies don't recurse into staff's own RLS).
create schema if not exists private;
create or replace function private.staff_role() returns public.staff_role
language sql stable security definer set search_path = '' as $$
  select role from public.staff where user_id = (select auth.uid()) and active
$$;
create or replace function private.has_role(roles public.staff_role[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(private.staff_role() = any (roles), false)
$$;

-- Status history is written by a trigger so every change is logged, whichever screen made it.
create or replace function private.log_order_status() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_events (order_id, status, by)
    values (new.id, new.status, coalesce((select name from public.staff where user_id = (select auth.uid())), 'Customer'));
  end if;
  return new;
end $$;
create trigger orders_status_log after insert or update of status on public.orders
for each row execute function private.log_order_status();

alter table public.staff enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_events enable row level security;
alter table public.expenses enable row level security;
alter table public.messages enable row level security;
alter table public.settings enable row level security;
alter table public.traffic_daily enable row level security;

-- Public (anon) can read the menu and settings. Orders and messages are inserted
-- by server functions using the service-role key, never directly by the browser.
create policy "menu is public" on public.menu_items for select using (true);
create policy "settings are public" on public.settings for select using (true);

create policy "managers edit menu" on public.menu_items for all
  using (private.has_role('{owner,manager}')) with check (private.has_role('{owner,manager}'));
create policy "managers edit settings" on public.settings for update
  using (private.has_role('{owner,manager}')) with check (private.has_role('{owner,manager}'));

create policy "staff read orders" on public.orders for select using (private.has_role('{owner,manager,cashier,kitchen}'));
create policy "staff update orders" on public.orders for update
  using (private.has_role('{owner,manager,cashier,kitchen}')) with check (private.has_role('{owner,manager,cashier,kitchen}'));
create policy "staff read order events" on public.order_events for select using (private.has_role('{owner,manager,cashier,kitchen}'));

create policy "finance roles manage expenses" on public.expenses for all
  using (private.has_role('{owner,manager}')) with check (private.has_role('{owner,manager}'));
create policy "front of house reads messages" on public.messages for select using (private.has_role('{owner,manager,cashier}'));
create policy "front of house updates messages" on public.messages for update
  using (private.has_role('{owner,manager,cashier}')) with check (private.has_role('{owner,manager,cashier}'));
create policy "managers read traffic" on public.traffic_daily for select using (private.has_role('{owner,manager}'));

create policy "staff see own row; owners see all" on public.staff for select
  using (user_id = (select auth.uid()) or private.has_role('{owner}'));
create policy "owners manage staff" on public.staff for all
  using (private.has_role('{owner}')) with check (private.has_role('{owner}'));

-- Realtime for the live order board.
alter publication supabase_realtime add table public.orders;
