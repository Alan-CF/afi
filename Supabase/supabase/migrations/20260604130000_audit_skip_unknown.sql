-- =========================================================
-- HU57 follow-up: drop "Unknown" actor logs.
--   Rows without a resolved actor (actor_id is null) come from
--   system / service-role / seed operations and add no audit value.
--   * delete existing ones
--   * guard every logging path so they are never created again
-- =========================================================

-- 1) Purge existing Unknown rows -------------------------------------------
delete from public.shop_audit_logs where actor_id is null;

-- 2) Logger RPC: skip when there is no authenticated actor ------------------
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
  if v_actor.actor_id is null then
    return null; -- no real actor -> not worth logging
  end if;

  insert into public.shop_audit_logs (
    actor_id, actor_name, actor_email, actor_role,
    action_type, product_id, product_name, status, details, metadata
  ) values (
    v_actor.actor_id, coalesce(v_actor.actor_name, 'Unknown'), v_actor.actor_email,
    coalesce(v_actor.actor_role, 'USER'),
    p_action_type, p_product_id, p_product_name,
    coalesce(p_status, 'SUCCESS'), p_details, coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- 3) Cart item trigger ------------------------------------------------------
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
    v_action := 'ADD_TO_CART';    v_row := new;
  else
    v_action := 'REMOVE_FROM_CART'; v_row := old;
  end if;

  select * into v_actor from public._shop_audit_actor();
  if v_actor.actor_id is null then
    return v_row;
  end if;

  select pc.id, pc.name into v_pid, v_pname
  from public.product_pricing pp
  join public.product_catalog pc on pc.id = pp.product_id
  where pp.id = v_row.priced_product_id;

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

-- 4) Cart status trigger ----------------------------------------------------
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
  if v_actor.actor_id is null then
    return new;
  end if;

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

-- 5) Product catalog trigger ------------------------------------------------
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
  if v_actor.actor_id is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    v_action := 'PRODUCT_CREATED'; v_pid := new.id; v_pname := new.name;
  elsif tg_op = 'DELETE' then
    v_action := 'PRODUCT_DELETED'; v_pid := old.id; v_pname := old.name;
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
