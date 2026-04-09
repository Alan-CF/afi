alter table "public"."product_catalog" add column "meta_data" jsonb;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_shop_categories()
 RETURNS SETOF jsonb
 LANGUAGE sql
AS $function$
  SELECT distinct meta_data -> 'category' AS categories
  FROM product_catalog
  WHERE meta_data -> 'category' IS NOT NULL;
$function$
;

CREATE OR REPLACE FUNCTION public.get_shop_collections()
 RETURNS SETOF jsonb
 LANGUAGE sql
AS $function$
  SELECT distinct meta_data -> 'collection' AS collections
  FROM product_catalog
  WHERE meta_data -> 'collection' IS NOT NULL;
$function$
;

CREATE OR REPLACE FUNCTION public.get_shop_players()
 RETURNS SETOF jsonb
 LANGUAGE sql
AS $function$
  SELECT DISTINCT meta_data -> 'player'
  FROM product_catalog
  WHERE meta_data -> 'player' IS NOT NULL;
$function$
;


