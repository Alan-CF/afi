-- =========================================================
-- HU57 follow-up: PURCHASE_STARTED now comes from the explicit
-- "Checkout" button (front-end log_shop_action call), not from the
-- lazy creation of the shopping_carts row. Keep ORDER_COMPLETED on
-- the status -> 'completed' transition.
-- =========================================================

create or replace function public.trg_audit_cart_status()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor record;
begin
  -- Only react to a real checkout completion now.
  if tg_op = 'UPDATE'
     and new.cart_status = 'completed'
     and old.cart_status is distinct from 'completed' then

    select * into v_actor from public._shop_audit_actor();
    if v_actor.actor_id is null then
      return new;
    end if;

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

-- The INSERT trigger is no longer needed (PURCHASE_STARTED moved to checkout).
drop trigger if exists trg_audit_cart_status_ins on public.shopping_carts;
