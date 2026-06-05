-- =========================================================
-- HU57 follow-up: expose product_id from get_cart so the
-- checkout / PURCHASE_STARTED audit log can list each product
-- with its catalog number.
-- Return signature changes => drop + recreate.
-- =========================================================

drop function if exists public.get_cart(uuid);

create or replace function public.get_cart(p_profile_id uuid)
 returns table(
   id integer,
   product_id bigint,
   product_name text,
   product_description text,
   is_active boolean,
   price numeric,
   discount numeric,
   product_details jsonb,
   image_url text
 )
 language sql
 stable
as $function$
  SELECT
    ci.id,
    pc.id           AS product_id,
    pc.name         AS product_name,
    pc.description  AS product_description,
    pc.is_active,
    pp.price,
    pp.discount,
    ci.product_details,
    image_url
  FROM shopping_cart_items ci
  JOIN shopping_carts c       ON c.id  = ci.cart_id
  LEFT JOIN product_pricing pp ON pp.id = ci.priced_product_id
  JOIN product_catalog pc      ON pc.id = pp.product_id
  WHERE c.profile_id = p_profile_id
  AND cart_status = 'active';
$function$
;

grant execute on function public.get_cart(uuid) to anon, authenticated, service_role;
