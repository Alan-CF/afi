-- =========================================================
-- HU57 – Shop Audit Logs
--   Chronological log of commercial actions inside the ESHOP.
--   * shop_audit_logs table (immutable snapshots of actor/product)
--   * admin-only RLS read access (CA07)
--   * SECURITY DEFINER logger + triggers that auto-capture:
--       - cart add / remove        (shopping_cart_items)
--       - purchase started / order completed (shopping_carts)
--       - product create/edit/delete/enable/disable (product_catalog)
-- =========================================================

-- 1) Table -----------------------------------------------------------------
create table if not exists public.shop_audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.profiles(id) on delete set null,
  actor_name  text,
  actor_email text,
  actor_role  text not null default 'USER' check (actor_role in ('USER', 'ADMIN')),
  action_type text not null check (action_type in (
    'ADD_TO_CART', 'REMOVE_FROM_CART', 'PURCHASE_STARTED', 'PURCHASE_CANCELED',
    'ORDER_COMPLETED', 'PRODUCT_ENABLED', 'PRODUCT_DISABLED',
    'PRODUCT_CREATED', 'PRODUCT_EDITED', 'PRODUCT_DELETED'
  )),
  product_id   bigint,
  product_name text,
  status       text not null default 'SUCCESS' check (status in ('SUCCESS', 'FAILED', 'PENDING', 'CANCELED')),
  details      text,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists shop_audit_logs_created_at_idx  on public.shop_audit_logs (created_at desc);
create index if not exists shop_audit_logs_action_type_idx on public.shop_audit_logs (action_type);
create index if not exists shop_audit_logs_actor_id_idx    on public.shop_audit_logs (actor_id);
create index if not exists shop_audit_logs_actor_role_idx  on public.shop_audit_logs (actor_role);

alter table public.shop_audit_logs enable row level security;

-- CA07: only admins can read the logs.
drop policy if exists "shop_audit_logs_admin_read" on public.shop_audit_logs;
create policy "shop_audit_logs_admin_read"
  on public.shop_audit_logs
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- No client insert/update/delete policy: all writes go through the
-- SECURITY DEFINER logger / triggers below, keeping the log tamper-proof.
grant select on table public.shop_audit_logs to authenticated, service_role;

-- 2) Actor resolver --------------------------------------------------------
-- Snapshots the current auth.uid()'s identity at write time so historical
-- rows stay accurate even if the profile is later renamed or deleted.
create or replace function public._shop_audit_actor()
returns table (actor_id uuid, actor_name text, actor_email text, actor_role text)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    p.id,
    coalesce(p.name, p.username),
    u.email,
    case when p.role = 'admin' then 'ADMIN' else 'USER' end
  from public.profiles p
  left join auth.users u on u.id = p.id
  where p.id = auth.uid();
$$;

-- 3) Public logger RPC -----------------------------------------------------
-- Front-end escape hatch for actions that have no DB hook yet
-- (e.g. PURCHASE_CANCELED). Triggers below cover everything else.
create or replace function public.log_shop_action(
  p_action_type text,
  p_product_id  bigint  default null,
  p_product_name text   default null,
  p_status      text    default 'SUCCESS',
  p_details     text    default null,
  p_metadata    jsonb   default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor record;
  v_id    bigint;
begin
  select * into v_actor from public._shop_audit_actor();

  insert into public.shop_audit_logs (
    actor_id, actor_name, actor_email, actor_role,
    action_type, product_id, product_name, status, details, metadata
  ) values (
    v_actor.actor_id,
    coalesce(v_actor.actor_name, 'Unknown'),
    v_actor.actor_email,
    coalesce(v_actor.actor_role, 'USER'),
    p_action_type, p_product_id, p_product_name,
    coalesce(p_status, 'SUCCESS'), p_details, coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.log_shop_action(text, bigint, text, text, text, jsonb) from public;
grant execute on function public.log_shop_action(text, bigint, text, text, text, jsonb) to authenticated;

-- 4) Cart item trigger: ADD_TO_CART / REMOVE_FROM_CART (CA04) --------------
create or replace function public.trg_audit_cart_items()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor  record;
  v_row    record;
  v_action text;
  v_pid    bigint;
  v_pname  text;
begin
  if tg_op = 'INSERT' then
    v_action := 'ADD_TO_CART';
    v_row    := new;
  else
    v_action := 'REMOVE_FROM_CART';
    v_row    := old;
  end if;

  select pc.id, pc.name
    into v_pid, v_pname
  from public.product_pricing pp
  join public.product_catalog pc on pc.id = pp.product_id
  where pp.id = v_row.priced_product_id;

  select * into v_actor from public._shop_audit_actor();

  insert into public.shop_audit_logs (
    actor_id, actor_name, actor_email, actor_role,
    action_type, product_id, product_name, status, metadata
  ) values (
    v_actor.actor_id, coalesce(v_actor.actor_name, 'Unknown'), v_actor.actor_email,
    coalesce(v_actor.actor_role, 'USER'),
    v_action, v_pid, v_pname, 'SUCCESS',
    jsonb_build_object('cart_item_id', v_row.id, 'priced_product_id', v_row.priced_product_id)
  );

  return v_row;
end;
$$;

drop trigger if exists trg_audit_cart_item_ins on public.shopping_cart_items;
create trigger trg_audit_cart_item_ins
  after insert on public.shopping_cart_items
  for each row execute function public.trg_audit_cart_items();

drop trigger if exists trg_audit_cart_item_del on public.shopping_cart_items;
create trigger trg_audit_cart_item_del
  after delete on public.shopping_cart_items
  for each row execute function public.trg_audit_cart_items();

-- 5) Cart status trigger: PURCHASE_STARTED / ORDER_COMPLETED (CA04) --------
-- The shoping_cart_status enum is ('active','completed'). A new active cart
-- = purchase started; transition to 'completed' = order completed.
-- TODO: when a 'canceled' status is added to the enum, emit PURCHASE_CANCELED
--       here (status CANCELED) on the corresponding transition.
create or replace function public.trg_audit_cart_status()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor record;
begin
  select * into v_actor from public._shop_audit_actor();

  if tg_op = 'INSERT' then
    insert into public.shop_audit_logs (
      actor_id, actor_name, actor_email, actor_role,
      action_type, status, details, metadata
    ) values (
      v_actor.actor_id, coalesce(v_actor.actor_name, 'Unknown'), v_actor.actor_email,
      coalesce(v_actor.actor_role, 'USER'),
      'PURCHASE_STARTED', 'PENDING', 'Shopping cart opened',
      jsonb_build_object('cart_id', new.id)
    );

  elsif tg_op = 'UPDATE'
        and new.cart_status = 'completed'
        and old.cart_status is distinct from 'completed' then
    insert into public.shop_audit_logs (
      actor_id, actor_name, actor_email, actor_role,
      action_type, status, details, metadata
    ) values (
      v_actor.actor_id, coalesce(v_actor.actor_name, 'Unknown'), v_actor.actor_email,
      coalesce(v_actor.actor_role, 'USER'),
      'ORDER_COMPLETED', 'SUCCESS', 'Order completed',
      jsonb_build_object('cart_id', new.id)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_audit_cart_status_ins on public.shopping_carts;
create trigger trg_audit_cart_status_ins
  after insert on public.shopping_carts
  for each row execute function public.trg_audit_cart_status();

drop trigger if exists trg_audit_cart_status_upd on public.shopping_carts;
create trigger trg_audit_cart_status_upd
  after update of cart_status on public.shopping_carts
  for each row execute function public.trg_audit_cart_status();

-- 6) Product catalog trigger: admin product actions (CA05) -----------------
create or replace function public.trg_audit_product_catalog()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor  record;
  v_action text;
  v_pid    bigint;
  v_pname  text;
begin
  select * into v_actor from public._shop_audit_actor();

  if tg_op = 'INSERT' then
    v_action := 'PRODUCT_CREATED'; v_pid := new.id;  v_pname := new.name;
  elsif tg_op = 'DELETE' then
    v_action := 'PRODUCT_DELETED'; v_pid := old.id;  v_pname := old.name;
  else
    v_pid := new.id; v_pname := new.name;
    if new.is_active is distinct from old.is_active then
      v_action := case when new.is_active then 'PRODUCT_ENABLED' else 'PRODUCT_DISABLED' end;
    else
      v_action := 'PRODUCT_EDITED';
    end if;
  end if;

  insert into public.shop_audit_logs (
    actor_id, actor_name, actor_email, actor_role,
    action_type, product_id, product_name, status
  ) values (
    v_actor.actor_id, coalesce(v_actor.actor_name, 'Unknown'), v_actor.actor_email,
    coalesce(v_actor.actor_role, 'ADMIN'),
    v_action, v_pid, v_pname, 'SUCCESS'
  );

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_product_catalog_ins on public.product_catalog;
create trigger trg_audit_product_catalog_ins
  after insert on public.product_catalog
  for each row execute function public.trg_audit_product_catalog();

drop trigger if exists trg_audit_product_catalog_upd on public.product_catalog;
create trigger trg_audit_product_catalog_upd
  after update on public.product_catalog
  for each row execute function public.trg_audit_product_catalog();

drop trigger if exists trg_audit_product_catalog_del on public.product_catalog;
create trigger trg_audit_product_catalog_del
  after delete on public.product_catalog
  for each row execute function public.trg_audit_product_catalog();

comment on table public.shop_audit_logs is 'HU57: immutable audit trail of ESHOP commercial actions. Admin read-only; written via triggers + log_shop_action().';
