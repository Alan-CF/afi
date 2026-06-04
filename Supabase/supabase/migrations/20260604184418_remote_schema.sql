


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "statistics_demo";


ALTER SCHEMA "statistics_demo" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";






CREATE TYPE "public"."conversation_role" AS ENUM (
    'user',
    'assistant',
    'system'
);


ALTER TYPE "public"."conversation_role" OWNER TO "postgres";


COMMENT ON TYPE "public"."conversation_role" IS 'the role of the entity that created the message';



CREATE TYPE "public"."fanatic_game_categories" AS ENUM (
    'who',
    'where',
    'what'
);


ALTER TYPE "public"."fanatic_game_categories" OWNER TO "postgres";


CREATE TYPE "public"."shoping_cart_status" AS ENUM (
    'active',
    'completed'
);


ALTER TYPE "public"."shoping_cart_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_item_to_cart"("p_profile_id" "uuid", "p_priced_product_id" integer, "p_product_details" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_cart_id INT;
BEGIN
    SELECT id
    INTO v_cart_id
    FROM shopping_carts
    WHERE cart_status = 'active'
      AND profile_id = p_profile_id;

    IF v_cart_id IS NULL THEN
        INSERT INTO shopping_carts (profile_id, cart_status)
        VALUES (p_profile_id, 'active')
        RETURNING id INTO v_cart_id;
    END IF;

    INSERT INTO shopping_cart_items (cart_id, priced_product_id, product_details)
    VALUES (v_cart_id, p_priced_product_id, p_product_details);
END;
$$;


ALTER FUNCTION "public"."add_item_to_cart"("p_profile_id" "uuid", "p_priced_product_id" integer, "p_product_details" "jsonb") OWNER TO "postgres";


CREATE PROCEDURE "public"."assign_fanatic_coins"(IN "p_game_id" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_profile_id UUID;
  v_answer_id INT;
  v_awarded_points INT;
  v_points_coins_rate FLOAT;
BEGIN

  FOR v_profile_id, v_answer_id, v_awarded_points IN
    SELECT profile_id, answer_id, max_points
    FROM fanatic_game_results
    WHERE game_id = p_game_id
  LOOP
    UPDATE profiles 
    SET fanatic_coins = fanatic_coins + v_awarded_points
    WHERE id = v_profile_id;

    INSERT INTO coin_earnings_log 
      (profile_id, description, earned_coins)
    VALUES
      (
        v_profile_id,
        'Earned in fanatic game. game_id:  ' || p_game_id,
        v_awarded_points
      );

    INSERT INTO notifications
    (profile_id, title, body)
    VALUES
    (
      v_profile_id, 'Fanatic game scored!', 
      'The results from the last Fanatic game have been scored. You earned ' || 
        TO_CHAR(v_awarded_points, 'FM999,999,999') || 
        ' coins. Congrats!'
    );
  END LOOP;
END;
$$;


ALTER PROCEDURE "public"."assign_fanatic_coins"(IN "p_game_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."award_points"("p_profile_id" "uuid", "p_event_key" "text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_points int;
BEGIN
  SELECT points INTO v_points FROM public.point_events WHERE key = p_event_key;
  IF v_points IS NULL THEN RETURN 0; END IF;

  INSERT INTO public.point_logs (profile_id, event_key, points)
  VALUES (p_profile_id, p_event_key, v_points);

  UPDATE public.profiles
  SET fanatic_coins = fanatic_coins + v_points
  WHERE id = p_profile_id;

  RETURN v_points;
END;
$$;


ALTER FUNCTION "public"."award_points"("p_profile_id" "uuid", "p_event_key" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "username" character varying NOT NULL,
    "fanatic_coins" bigint DEFAULT '0'::bigint NOT NULL,
    "id" "uuid" NOT NULL,
    "avatar_url" "text",
    "caption" "text",
    "name" "text",
    "streak" integer DEFAULT 0,
    "last_login" "date",
    "e_coins" bigint DEFAULT 0 NOT NULL,
    "selected_frame_id" "text",
    "role" "text" DEFAULT 'user'::"text" NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."fanatic_coins" IS 'coins earned from playing the fanatic minigame';



COMMENT ON COLUMN "public"."profiles"."caption" IS '200 character bio for users to highlight their personality or purpose using short quotes, emojis, and phrases.';



CREATE OR REPLACE FUNCTION "public"."create_profile"("p_user_id" "uuid") RETURNS "public"."profiles"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_generated_user TEXT;
    v_name TEXT;
    v_picture TEXT;
    v_profile profiles;
BEGIN
    v_generated_user := 'user_' || SUBSTR(MD5(p_user_id::TEXT), 1, 8);

    SELECT
        raw_user_meta_data ->> 'name',
        raw_user_meta_data ->> 'picture'
    INTO
        v_name,
        v_picture
    FROM auth.users
    WHERE id = p_user_id;

    INSERT INTO public.profiles (id, username, name, avatar_url)
    VALUES (
        p_user_id,
        v_generated_user,
        v_name,
        v_picture
    )
    RETURNING * INTO v_profile;

    RETURN v_profile;
END;
$$;


ALTER FUNCTION "public"."create_profile"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_shoot_challenge"() RETURNS TABLE("challenge_id" "uuid", "challenge_code" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_code text;
  v_challenge_id uuid;
begin
  loop
    v_code := generate_shoot_challenge_code();

    exit when not exists (
      select 1 from shoot_challenges where code = v_code
    );
  end loop;

  insert into shoot_challenges (code, host_profile_id, status)
  values (v_code, auth.uid(), 'waiting')
  returning id into v_challenge_id;

  insert into shoot_challenge_players (challenge_id, profile_id, status)
  values (v_challenge_id, auth.uid(), 'joined');

  return query
  select v_challenge_id, v_code;
end;
$$;


ALTER FUNCTION "public"."create_shoot_challenge"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."custom_access_token_hook"("event" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
declare
  claims jsonb;
  user_role text;
begin
  select role into user_role
  from public.profiles
  where id = (event->>'userId')::uuid;

  claims := event->'claims';

  if user_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  else
    claims := jsonb_set(claims, '{user_role}', 'null');
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;


ALTER FUNCTION "public"."custom_access_token_hook"("event" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fan_event_going_count"("p_event_id" bigint) RETURNS integer
    LANGUAGE "sql" STABLE
    AS $$
  select count(*)::int from public.fan_event_attendees
  where fan_event_id = p_event_id and status = 'going';
$$;


ALTER FUNCTION "public"."fan_event_going_count"("p_event_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fanatic_active_game_id"() RETURNS TABLE("active_game_id" integer)
    LANGUAGE "sql"
    AS $$
SELECT 
  id
  FROM fanatic_games 
  WHERE NOW() BETWEEN start_date AND end_date
$$;


ALTER FUNCTION "public"."fanatic_active_game_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fanatic_best_try"("pprofileid" "uuid") RETURNS TABLE("best_score" numeric, "highest_similarity" numeric)
    LANGUAGE "sql"
    AS $$
SELECT 
  max(awarded_points) AS most_points,
  max(similarity_score) AS best_similarity
FROM fanatic_answers 
WHERE 
  game_id = (select active_game_id from fanatic_active_game_id()) and 
  profile_id = pProfileId;
$$;


ALTER FUNCTION "public"."fanatic_best_try"("pprofileid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fanatic_days_elapsed"() RETURNS TABLE("days_elapsed" integer)
    LANGUAGE "sql"
    AS $$
SELECT 
  DATE_PART('day', NOW() - start_date) AS days_elapsed
FROM fanatic_games 
WHERE NOW() BETWEEN start_date AND end_date
$$;


ALTER FUNCTION "public"."fanatic_days_elapsed"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fanatic_get_current_game"() RETURNS TABLE("game_category" "public"."fanatic_game_categories", "sort_order" integer, "riddle" "text")
    LANGUAGE "sql"
    AS $$
WITH current_game AS (
    SELECT 
        id AS current_game_id,
        game_category,
        DATE_PART('day', NOW() - start_date) AS days_elapsed
    FROM fanatic_games 
    WHERE NOW() BETWEEN start_date AND end_date
),
config AS (
    SELECT value::int AS days_per_riddle
    FROM fanatic_game_config 
    WHERE key = 'days_between_riddles'
),
riddle_number AS (
    SELECT 
        (days_elapsed / days_per_riddle) AS current_riddle
    FROM current_game, config
)
SELECT 
    game_category,
    sort_order, 
    riddle
FROM fanatic_riddles, current_game, riddle_number
WHERE game_id = current_game_id 
AND sort_order <= current_riddle;
$$;


ALTER FUNCTION "public"."fanatic_get_current_game"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fanatic_next_riddle_date"() RETURNS timestamp with time zone
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  vStartDate          TIMESTAMPTZ;
  vDaysElapsed        INT;
  vDaysBetweenRiddles INT;
  vTotalRiddles       INT;
  vCurrentRiddleIndex INT;
BEGIN
  SELECT start_date, DATE_PART('day', NOW() - start_date)::INT
  INTO vStartDate, vDaysElapsed
  FROM fanatic_games
  WHERE NOW() BETWEEN start_date AND end_date;

  -- No active game
  IF vStartDate IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT value::INT
  INTO vDaysBetweenRiddles
  FROM fanatic_game_config
  WHERE key = 'days_between_riddles';

  SELECT COUNT(*)
  INTO vTotalRiddles
  FROM fanatic_riddles fr
  JOIN fanatic_games fg ON fg.id = fr.game_id
  WHERE NOW() BETWEEN fg.start_date AND fg.end_date;

  vCurrentRiddleIndex := vDaysElapsed / vDaysBetweenRiddles;

  -- Game has run out of riddles
  IF vCurrentRiddleIndex >= vTotalRiddles THEN
    RETURN NULL;
  END IF;

  RETURN vStartDate + ((vCurrentRiddleIndex + 1) * vDaysBetweenRiddles) * INTERVAL '1 day';
END;
$$;


ALTER FUNCTION "public"."fanatic_next_riddle_date"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fanatic_remaining_game_tries"("pprofileid" "uuid") RETURNS TABLE("remaining_tries_game" integer, "remaining_tries_today" integer, "next_attempt_date" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$DECLARE
  vTriesPerUserPerGame INT;
  vTriesPerUserPerDay  INT;
  vActiveGameId        INT;
  vRemainingGameTries  INT;
  vRemainingTriesToday INT;
  vNextAttemptDate     TIMESTAMPTZ;
  vOldestWindowAnswer  TIMESTAMPTZ;
BEGIN

  SELECT active_game_id
  INTO vActiveGameId
  FROM fanatic_active_game_id();

  IF vActiveGameId IS NULL THEN
    RAISE EXCEPTION 'No active games.';
  END IF;

  -- Load play limits from config
  SELECT value::int INTO vTriesPerUserPerGame
  FROM fanatic_game_config WHERE key = 'tries_per_user_per_game';

  SELECT value::int INTO vTriesPerUserPerDay
  FROM fanatic_game_config WHERE key = 'tries_per_user_per_day';

  -- Remaining tries for the game
  SELECT GREATEST(vTriesPerUserPerGame - COUNT(*), 0)
  INTO vRemainingGameTries
  FROM fanatic_answers
  WHERE profile_id = pProfileId
    AND game_id = vActiveGameId;

  -- Remaining tries within the 24-hour rolling window
  SELECT GREATEST(vTriesPerUserPerDay - COUNT(*), 0)
  INTO vRemainingTriesToday
  FROM fanatic_answers
  WHERE profile_id = pProfileId
    AND game_id = vActiveGameId
    AND created_at >= NOW() - INTERVAL '24 hours';

  -- Determine when the user can play next
  IF vRemainingGameTries = 0 THEN
    -- User has exhausted all tries for this game, no further attempts allowed
    vRemainingTriesToday := 0;
    vNextAttemptDate     := NULL;

  ELSIF vRemainingTriesToday = 0 THEN
    -- Daily window exhausted. Find the oldest answer in the current 24h window.
    -- The next slot opens exactly 24h after that oldest answer falls out of the window.
    SELECT MIN(created_at)
    INTO vOldestWindowAnswer
    FROM (
      SELECT created_at
      FROM fanatic_answers
      WHERE profile_id = pProfileId
        AND game_id = vActiveGameId
        AND created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY created_at ASC
      LIMIT vTriesPerUserPerDay          -- only consider the tries that filled the quota
    ) sub;

    vNextAttemptDate := vOldestWindowAnswer + INTERVAL '24 hours';

  ELSE
    -- User still has tries available, can play immediately
    vNextAttemptDate := NULL;

  END IF;

  RETURN QUERY SELECT vRemainingGameTries, vRemainingTriesToday, vNextAttemptDate;
END;$$;


ALTER FUNCTION "public"."fanatic_remaining_game_tries"("pprofileid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fanatic_time_next_game_date"() RETURNS TABLE("next_game" timestamp with time zone, "active_game" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_active_game_id INT;
  v_next_game_date TIMESTAMPTZ;
BEGIN

  -- Check if there is an active game
  SELECT fag.active_game_id
  INTO v_active_game_id
  FROM fanatic_active_game_id() fag
  LIMIT 1;

  IF v_active_game_id IS NOT NULL THEN
    RETURN QUERY SELECT NULL::TIMESTAMPTZ, TRUE;
    RETURN;
  END IF; 

  -- Get next upcoming game
  SELECT fg.start_date 
  INTO v_next_game_date
  FROM fanatic_games fg
  WHERE fg.end_date >= now() 
  ORDER BY fg.start_date ASC
  LIMIT 1;

  RETURN QUERY SELECT v_next_game_date, FALSE;
END;
$$;


ALTER FUNCTION "public"."fanatic_time_next_game_date"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_shoot_challenge_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;

  return result;
end;
$$;


ALTER FUNCTION "public"."generate_shoot_challenge_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_cart"("p_profile_id" "uuid") RETURNS TABLE("id" integer, "product_name" "text", "product_description" "text", "is_active" boolean, "price" numeric, "discount" numeric, "product_details" "jsonb", "image_url" "text")
    LANGUAGE "sql" STABLE
    AS $$
  SELECT 
    ci.id, 
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
$$;


ALTER FUNCTION "public"."get_cart"("p_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_cart_item"("p_profile_id" "uuid", "p_cart_item_id" integer) RETURNS TABLE("id" integer, "product_name" "text", "product_description" "text", "is_active" boolean, "price" numeric, "discount" numeric, "product_details" "jsonb", "image_url" "text")
    LANGUAGE "sql" STABLE
    AS $$
  SELECT 
    ci.id, 
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
  AND ci.id = p_cart_item_id
  AND cart_status = 'active';
$$;


ALTER FUNCTION "public"."get_cart_item"("p_profile_id" "uuid", "p_cart_item_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_detailed_priced_product"("p_id" integer) RETURNS TABLE("id" integer, "name" "text", "description" "text", "main_image_url" "text", "secondary_images_url" "text", "image_priority" integer, "product_details" "jsonb", "price" numeric, "discount" numeric)
    LANGUAGE "sql"
    AS $$
  SELECT
    pp.id,
    pc.name,
    pc.description,
    pc.image_url          AS main_image_url,
    pi.image_url          AS secondary_images_url,
    pi.priority           AS image_priority,
    pc.product_details,
    pp.price,
    pp.discount
  FROM product_catalog pc
  JOIN product_pricing pp ON pp.product_id = pc.id
  LEFT JOIN secondary_product_images pi ON pc.id = pi.product_id
  WHERE pp.id = p_id
    AND pc.is_active = true;
$$;


ALTER FUNCTION "public"."get_detailed_priced_product"("p_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_priced_products"("p_search_query" character varying, "p_filters" "jsonb") RETURNS TABLE("id" bigint, "name" character varying, "description" "text", "price" double precision, "discount" double precision, "is_active" boolean, "image_url" "text", "meta_data" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (pp.product_id)
    pp.id,
    pc.name,
    pc.description,
    pp.price,
    pp.discount,
    pc.is_active,
    pc.image_url,
    pc.meta_data
  FROM product_pricing pp
  JOIN product_catalog pc ON pc.id = pp.product_id
  WHERE
    pc.is_active = true
    AND (
      p_search_query IS NULL
      OR p_search_query = ''
      OR pc.name ILIKE '%' || p_search_query || '%'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM jsonb_each(p_filters) AS f(key, value)
      WHERE
        value->>'name' IS NOT NULL
        AND (
          pc.meta_data->key->>'name'
          IS DISTINCT FROM value->>'name'
        )
    )
  ORDER BY pp.product_id, pp.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_priced_products"("p_search_query" character varying, "p_filters" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_priced_products_by_id"("p_ids" integer[]) RETURNS TABLE("id" integer, "name" "text", "description" "text", "price" numeric, "discount" numeric, "is_active" boolean, "image_url" "text", "product_details" "jsonb", "meta_data" "jsonb")
    LANGUAGE "sql"
    AS $$
  SELECT
    pp.id,
    pc.name,
    pc.description,
    pp.price,
    pp.discount,
    pc.is_active,
    pc.image_url,
    pc.product_details,
    pc.meta_data
  FROM product_pricing pp
  JOIN product_catalog pc ON pc.id = pp.product_id
  WHERE pp.id = ANY(p_ids)
    AND pc.is_active = true;
$$;


ALTER FUNCTION "public"."get_priced_products_by_id"("p_ids" integer[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_product_filters"() RETURNS "jsonb"
    LANGUAGE "sql"
    AS $$ 
SELECT json_object_agg(key, values) AS filters
FROM (
  SELECT
    key,
    json_agg(DISTINCT value->>'name') AS values
  FROM product_catalog,
    jsonb_each(meta_data) AS kv(key, value)
  WHERE value->>'name' IS NOT NULL
  GROUP BY key
) subq;
$$;


ALTER FUNCTION "public"."get_product_filters"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_shoot_your_shot_friends_ranking"() RETURNS TABLE("profile_id" "uuid", "name" "text", "username" "text", "avatar_url" "text", "avg_score" numeric, "avg_success_rate" numeric, "games_played" bigint)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  with my_friends as (
    select
      case
        when requester_profile_id = auth.uid() then receiver_profile_id
        else requester_profile_id
      end as friend_id
    from friendships
    where status = 'accepted'
      and (
        requester_profile_id = auth.uid()
        or receiver_profile_id = auth.uid()
      )
  ),
  allowed_profiles as (
    select auth.uid() as profile_id
    union
    select friend_id as profile_id
    from my_friends
  )
  select
    p.id as profile_id,
    p.name,
    p.username,
    p.avatar_url,
    round(avg(g.score)::numeric, 2) as avg_score,
    round(avg(g.success_rate)::numeric, 2) as avg_success_rate,
    count(g.id) as games_played
  from shoot_your_shot_games g
  join profiles p
    on p.id = g.profile_id
  join allowed_profiles ap
    on ap.profile_id = p.id
  group by p.id, p.name, p.username, p.avatar_url
  order by avg_score desc, avg_success_rate desc, games_played desc
  limit 5;
$$;


ALTER FUNCTION "public"."get_shoot_your_shot_friends_ranking"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_shop_categories"() RETURNS SETOF "jsonb"
    LANGUAGE "sql"
    AS $$
  SELECT distinct meta_data -> 'category' AS categories
  FROM product_catalog
  WHERE meta_data -> 'category' IS NOT NULL;
$$;


ALTER FUNCTION "public"."get_shop_categories"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_shop_collections"() RETURNS SETOF "jsonb"
    LANGUAGE "sql"
    AS $$
  SELECT distinct meta_data -> 'collection' AS collections
  FROM product_catalog
  WHERE meta_data -> 'collection' IS NOT NULL;
$$;


ALTER FUNCTION "public"."get_shop_collections"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_shop_players"() RETURNS SETOF "jsonb"
    LANGUAGE "sql"
    AS $$
  SELECT DISTINCT meta_data -> 'player'
  FROM product_catalog
  WHERE meta_data -> 'player' IS NOT NULL;
$$;


ALTER FUNCTION "public"."get_shop_players"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_top_products"("query_embedding" "extensions"."vector", "top_n" integer) RETURNS TABLE("id" integer, "name" character varying, "description" "text", "is_active" boolean, "image_url" "text", "product_details" "jsonb", "price" numeric, "discount" numeric)
    LANGUAGE "sql"
    AS $$
  SELECT 
    latest_price.id,
    p.name,
    p.description,
    p.is_active,
    p.image_url,
    p.product_details,
    latest_price.price,
    latest_price.discount
  FROM product_catalog p
  JOIN (
    -- Get only the most recent price per product
    SELECT DISTINCT ON (product_id)
      id,
      product_id,
      price,
      discount
    FROM product_pricing
    ORDER BY product_id, created_at DESC
  ) AS latest_price ON p.id = latest_price.product_id
  WHERE p.is_active = true
  ORDER BY p.product_embedding <=> query_embedding
  LIMIT top_n;
$$;


ALTER FUNCTION "public"."get_top_products"("query_embedding" "extensions"."vector", "top_n" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    new.id,
    split_part(new.email, '@', 1)
  );
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_invited_to_room"("target_room_id" bigint) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.room_members rm
    where rm.room_id = target_room_id
      and rm.profile_id = auth.uid()
      and rm.status = 'pending'
  );
$$;


ALTER FUNCTION "public"."is_invited_to_room"("target_room_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_member_of_room"("target_room_id" bigint) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.room_members rm
    where rm.room_id = target_room_id
      and rm.profile_id = auth.uid()
      and rm.status = 'accepted'
  );
$$;


ALTER FUNCTION "public"."is_member_of_room"("target_room_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_owner_of_room"("target_room_id" bigint) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.rooms r
    where r.id = target_room_id
      and r.owner_profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.room_members rm
    where rm.room_id = target_room_id
      and rm.profile_id = auth.uid()
      and rm.role = 'owner'
      and rm.status = 'accepted'
  );
$$;


ALTER FUNCTION "public"."is_owner_of_room"("target_room_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."join_shoot_challenge"("p_code" "text") RETURNS TABLE("out_challenge_id" "uuid", "out_challenge_code" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_challenge_id uuid;
  v_challenge_code text;
  v_challenge_status text;
begin
  select sc.id, sc.code, sc.status
  into v_challenge_id, v_challenge_code, v_challenge_status
  from shoot_challenges sc
  where upper(sc.code) = upper(trim(p_code))
  limit 1;

  if v_challenge_id is null then
    raise exception 'Challenge not found';
  end if;

  if v_challenge_status <> 'waiting' then
    raise exception 'This challenge already started';
  end if;

  insert into shoot_challenge_players (
    challenge_id,
    profile_id,
    status
  )
  values (
    v_challenge_id,
    auth.uid(),
    'joined'
  )
  on conflict (challenge_id, profile_id) do nothing;

  return query
  select v_challenge_id, v_challenge_code;
end;
$$;


ALTER FUNCTION "public"."join_shoot_challenge"("p_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."purchase_frame"("p_frame_id" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_profile_id uuid := auth.uid();
  v_price      bigint;
  v_balance    bigint;
begin
  if v_profile_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select price into v_price
  from public.frames
  where id = p_frame_id and is_active = true;

  if v_price is null then
    raise exception 'frame_not_found' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.owned_frames
    where profile_id = v_profile_id and frame_id = p_frame_id
  ) then
    raise exception 'already_owned' using errcode = '23505';
  end if;

  -- Atomic conditional debit. If e_coins < price, no row matches -> v_balance stays null.
  update public.profiles
  set e_coins = e_coins - v_price
  where id = v_profile_id and e_coins >= v_price
  returning e_coins into v_balance;

  if v_balance is null then
    raise exception 'insufficient_balance' using errcode = 'P0001';
  end if;

  insert into public.owned_frames (profile_id, frame_id)
  values (v_profile_id, p_frame_id)
  on conflict do nothing;

  return jsonb_build_object(
    'e_coins',   v_balance,
    'frame_id',  p_frame_id
  );
end;
$$;


ALTER FUNCTION "public"."purchase_frame"("p_frame_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_item_from_active_cart"("p_profile_id" "uuid", "p_cart_item_id" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_cart_id INT;
BEGIN
    -- find the active cart
    SELECT id
    INTO v_cart_id
    FROM shopping_carts
    WHERE cart_status = 'active'
      AND profile_id = p_profile_id;

    IF v_cart_id IS NULL THEN
        RAISE EXCEPTION 'No active cart found for profile %', p_profile_id;
    END IF;


    -- subquery to ensure we only delete a single row 
    DELETE FROM shopping_cart_items
    WHERE id = p_cart_item_id;

    IF NOT FOUND THEN
        RAISE NOTICE 'Item % not found in cart %', p_priced_product_id, v_cart_id;
    END IF;
END;
$$;


ALTER FUNCTION "public"."remove_item_from_active_cart"("p_profile_id" "uuid", "p_cart_item_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_room_match"("target_room_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if not public.is_owner_of_room(target_room_id) then
    raise exception 'not_room_owner' using errcode = '42501';
  end if;

  update public.rooms
  set match_hidden = true
  where id = target_room_id;

  delete from public.room_messages
  where room_id = target_room_id
    and content like '[[prediction]] %';
end;
$$;


ALTER FUNCTION "public"."remove_room_match"("target_room_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."select_frame"("p_frame_id" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_profile_id uuid := auth.uid();
begin
  if v_profile_id is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_frame_id is not null and not exists (
    select 1 from public.owned_frames
    where profile_id = v_profile_id and frame_id = p_frame_id
  ) then
    raise exception 'frame_not_owned' using errcode = 'P0002';
  end if;

  update public.profiles
  set selected_frame_id = p_frame_id
  where id = v_profile_id;
end;
$$;


ALTER FUNCTION "public"."select_frame"("p_frame_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_quiz_attempt"("p_quiz_id" integer, "p_answers" "jsonb") RETURNS TABLE("result_id" integer, "title" "text", "subtitle" "text", "description" "text", "image_url" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_profile_id uuid;
  v_latest_attempt record;
  v_attempt_id int;
  v_winning_result_id int;
  v_now timestamptz := now();
  v_available_again_at timestamptz := now() + interval '7 days';
  v_answer_count int;
  v_question_count int;
BEGIN
  -- 1. usuario autenticado
  v_profile_id := auth.uid();

  if v_profile_id is null THEN
    raise exception 'You must be logged in to submit the quiz.';
  END if;

  -- 2. validar que el quiz exista y esté activo
  if not exists (
    SELECT 1
    FROM quizzes q
    WHERE q.id = p_quiz_id
      and q.is_active = true
  ) THEN
    raise exception 'Quiz not found or inactive.';
  END if;

  -- 3. revisar cooldown
  SELECT qa.id, qa.available_again_at
  INTO v_latest_attempt
  FROM quiz_attempts qa
  WHERE qa.profile_id = v_profile_id
    AND qa.quiz_id = p_quiz_id
    AND qa.status = 'completed'
  ORDER BY qa.completed_at DESC
  LIMIT 1;

  if v_latest_attempt.available_again_at is not null
     AND v_latest_attempt.available_again_at > v_now THEN
    raise exception 'This quiz is still on cooldown.';
  END if;

  -- 4. contar respuestas recibidas
  SELECT count(*)
  INTO v_answer_count
  FROM jsonb_to_recordset(p_answers) AS x(question_id int, option_id int);

  if v_answer_count = 0 THEN
    raise exception 'No answers were provided.';
  END if;

  -- 5. contar preguntas del quiz
  SELECT count(*)
  INTO v_question_count
  FROM quiz_questions qq
  WHERE qq.quiz_id = p_quiz_id;

  if v_question_count = 0 THEN
    raise exception 'This quiz has no questions configured.';
  END if;

  -- 6. validar que contestaron todas las preguntas exactamente una vez
  if v_answer_count <> v_question_count THEN
    raise exception 'You must answer all questions exactly once.';
  END if;

  -- 7. validar que cada respuesta pertenezca al quiz correcto
  if exists (
    SELECT 1
    FROM jsonb_to_recordset(p_answers) AS x(question_id int, option_id int)
    LEFT JOIN quiz_questions qq
      ON qq.id = x.question_id
    LEFT JOIN quiz_options qo
      ON qo.id = x.option_id
     AND qo.question_id = qq.id
    WHERE qq.quiz_id <> p_quiz_id
       OR qq.id is null
       OR qo.id is null
  ) THEN
    raise exception 'One or more answers are invalid for this quiz.';
  END if;

  -- 8. validar que no se repita una pregunta
  if exists (
    SELECT x.question_id
    FROM jsonb_to_recordset(p_answers) AS x(question_id int, option_id int)
    GROUP BY x.question_id
    HAVING count(*) > 1
  ) THEN
    raise exception 'Duplicate question answers are not allowed.';
  END if;

  -- 9. crear intento
  INSERT INTO quiz_attempts (
    profile_id,
    quiz_id,
    status,
    started_at,
    created_at
  )
  VALUES (
    v_profile_id,
    p_quiz_id,
    'in_progress',
    v_now,
    v_now
  )
  RETURNING id INTO v_attempt_id;

  -- 10. guardar respuestas
  INSERT INTO quiz_attempt_answers (
    attempt_id,
    question_id,
    option_id,
    created_at
  )
  SELECT
    v_attempt_id,
    x.question_id,
    x.option_id,
    v_now
  FROM jsonb_to_recordset(p_answers) AS x(question_id int, option_id int);

  -- 11. calcular resultado ganador
  SELECT qr.id
  INTO v_winning_result_id
  FROM (
    SELECT
      orm.result_id,
      SUM(coalesce(orm.weight, 1)) AS total_score
    FROM jsonb_to_recordset(p_answers) AS x(question_id int, option_id int)
    JOIN option_result_map orm
      ON orm.option_id = x.option_id
    GROUP BY orm.result_id
  ) scores
  JOIN quiz_results qr
    ON qr.id = scores.result_id
  WHERE qr.quiz_id = p_quiz_id
  ORDER BY scores.total_score desc, qr.priority desc, qr.id asc
  LIMIT 1;

  if v_winning_result_id is null THEN
    raise exception 'Could not determine a result for this quiz.';
  END if;

  -- 12. actualizar intento
  UPDATE quiz_attempts
  SET
    result_id = v_winning_result_id,
    status = 'completed',
    completed_at = v_now,
    available_again_at = v_available_again_at
  WHERE id = v_attempt_id;

  -- 13. devolver resultado final
  RETURN query
  SELECT
    qr.id,
    qr.title,
    qr.subtitle,
    qr.description,
    qr.image_url
  FROM quiz_results qr
  WHERE qr.id = v_winning_result_id;
END;
$$;


ALTER FUNCTION "public"."submit_quiz_attempt"("p_quiz_id" integer, "p_answers" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_fanatic_cron"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  v_job_name TEXT;
  v_cron_expr TEXT;
BEGIN
  -- Handle DELETE: remove the cronjob
  IF TG_OP = 'DELETE' THEN
    v_job_name := 'end_date_job_' || OLD.id;
    BEGIN
      PERFORM cron.unschedule(v_job_name);
    EXCEPTION WHEN others THEN
      NULL;
    END;
    RETURN OLD;
  END IF;

  -- Handle UPDATE: remove the old cronjob before rescheduling
  IF TG_OP = 'UPDATE' THEN
    v_job_name := 'end_date_job_' || OLD.id;
    BEGIN
      PERFORM cron.unschedule(v_job_name);
    EXCEPTION WHEN others THEN
      NULL;
    END;
  END IF;

  -- Handle INSERT and UPDATE: schedule the cronjob
  v_job_name := 'end_date_job_' || NEW.id;
  v_cron_expr := to_char(NEW.end_date, 'MI HH24 DD MM') || ' *';

  PERFORM cron.schedule(
    v_job_name,
    v_cron_expr,
    format(
      $sql$
        CALL assign_fanatic_coins(%L);
        SELECT cron.unschedule(%L);
      $sql$,
      NEW.id,
      v_job_name
    )
  );

  RETURN NEW;
END;
$_$;


ALTER FUNCTION "public"."trigger_fanatic_cron"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_generate_fanatic_embedding"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://upktcnvztyldwzapbuqq.supabase.co/functions/v1/question-embedding-generator'::text,
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id,
        'answer', NEW.answer
      )
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_generate_fanatic_embedding"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_generate_product_embedding"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://upktcnvztyldwzapbuqq.supabase.co/functions/v1/product-embedding-generator'::text,
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id,
        'product', jsonb_build_object(
          'name', NEW.name,
          'description', NEW.description,
          'details', NEW.product_details
        )::text
      )
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_generate_product_embedding"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_sync_ecoins"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.fanatic_coins > coalesce(old.fanatic_coins, 0) then
    new.e_coins := coalesce(old.e_coins, 0) + (new.fanatic_coins - coalesce(old.fanatic_coins, 0));
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."trigger_sync_ecoins"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_cart_item_details"("p_profile_id" "uuid", "p_cart_item_id" integer, "p_product_details" "jsonb") RETURNS "void"
    LANGUAGE "sql"
    AS $$
UPDATE 
shopping_cart_items 
SET product_details = p_product_details
WHERE id = p_cart_item_id AND
cart_id = (
  select id 
  from shopping_carts 
  where cart_status = 'active'
  and profile_id = profile_id
);
$$;


ALTER FUNCTION "public"."update_cart_item_details"("p_profile_id" "uuid", "p_cart_item_id" integer, "p_product_details" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_login_streak"("user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  last_date date;
  today date := (NOW() AT TIME ZONE 'America/Monterrey')::date;
  new_streak int;
BEGIN
  SELECT last_login INTO last_date FROM public.profiles WHERE id = user_id;

  IF last_date IS NULL OR last_date < today - INTERVAL '1 day' THEN
    -- Streak roto
    IF last_date IS NOT NULL AND last_date < today - INTERVAL '7 days' THEN
      PERFORM public.award_points(user_id, 'return_after_break');
    ELSE
      -- Primer login ever
      PERFORM public.award_points(user_id, 'daily_login');
    END IF;
    UPDATE public.profiles SET streak = 1, last_login = today WHERE id = user_id;

  ELSIF last_date = today - INTERVAL '1 day' THEN
    UPDATE public.profiles SET streak = streak + 1, last_login = today WHERE id = user_id;
    SELECT streak INTO new_streak FROM public.profiles WHERE id = user_id;

    -- Streak milestones reemplazan daily_login
    IF new_streak = 3 THEN
      PERFORM public.award_points(user_id, 'streak_3');
    ELSIF new_streak = 7 THEN
      PERFORM public.award_points(user_id, 'streak_7');
    ELSIF new_streak = 25 THEN
      PERFORM public.award_points(user_id, 'streak_25');
    ELSIF new_streak = 50 THEN
      PERFORM public.award_points(user_id, 'streak_50');
    ELSE
      PERFORM public.award_points(user_id, 'daily_login');
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION "public"."update_login_streak"("user_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coin_earnings_log" (
    "id" bigint NOT NULL,
    "profile_id" "uuid",
    "description" "text",
    "earned_coins" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."coin_earnings_log" OWNER TO "postgres";


ALTER TABLE "public"."coin_earnings_log" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."coin_earnings_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."domain_scans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "base_domain" "text" NOT NULL,
    "last_run_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."domain_scans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."domain_variants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scan_id" "uuid" NOT NULL,
    "variant_domain" "text" NOT NULL,
    "fuzzer" "text" DEFAULT ''::"text" NOT NULL,
    "dns_a" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "dns_aaaa" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "dns_ns" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "dns_mx" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_registered" boolean DEFAULT false NOT NULL,
    "first_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_dns_check_at" timestamp with time zone
);


ALTER TABLE "public"."domain_variants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fan_event_attendees" (
    "id" bigint NOT NULL,
    "fan_event_id" bigint NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'interested'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "fan_event_attendees_status_check" CHECK (("status" = ANY (ARRAY['going'::"text", 'interested'::"text", 'declined'::"text"])))
);


ALTER TABLE "public"."fan_event_attendees" OWNER TO "postgres";


ALTER TABLE "public"."fan_event_attendees" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."fan_event_attendees_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."fan_event_images" (
    "id" bigint NOT NULL,
    "fan_event_id" bigint NOT NULL,
    "image_url" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."fan_event_images" OWNER TO "postgres";


ALTER TABLE "public"."fan_event_images" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."fan_event_images_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."fan_events" (
    "id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "image_url" "text",
    "start_at" timestamp with time zone NOT NULL,
    "end_at" timestamp with time zone,
    "venue" "text",
    "city" "text",
    "country" "text" DEFAULT 'US'::"text" NOT NULL,
    "organizer_profile_id" "uuid" NOT NULL,
    "capacity" integer,
    "is_public" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "main_image_path" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "host_bio" "text"
);


ALTER TABLE "public"."fan_events" OWNER TO "postgres";


ALTER TABLE "public"."fan_events" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."fan_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."fanatic_answers" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "answer" "text",
    "game_id" bigint,
    "awarded_points" bigint,
    "similarity_score" double precision,
    "is_correct" boolean,
    "profile_id" "uuid"
);


ALTER TABLE "public"."fanatic_answers" OWNER TO "postgres";


COMMENT ON COLUMN "public"."fanatic_answers"."game_id" IS 'the game which the riddle is linked to';



COMMENT ON COLUMN "public"."fanatic_answers"."similarity_score" IS 'how similar was the answer to the correct one';



COMMENT ON COLUMN "public"."fanatic_answers"."is_correct" IS 'was the answers similarity higher than the minimum threashold defined in the game config table.';



ALTER TABLE "public"."fanatic_answers" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."fanatic_answers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."fanatic_game_config" (
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."fanatic_game_config" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."fanatic_game_results" WITH ("security_invoker"='on') AS
 SELECT DISTINCT ON ("profile_id") "game_id",
    "profile_id",
    "id" AS "answer_id",
    "awarded_points" AS "max_points"
   FROM "public"."fanatic_answers"
  WHERE ("game_id" = 1)
  ORDER BY "profile_id", "awarded_points" DESC;


ALTER VIEW "public"."fanatic_game_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fanatic_games" (
    "id" bigint NOT NULL,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone NOT NULL,
    "answer" "text" NOT NULL,
    "answer_embedding" "extensions"."vector"(1024),
    "game_category" "public"."fanatic_game_categories"
);


ALTER TABLE "public"."fanatic_games" OWNER TO "postgres";


ALTER TABLE "public"."fanatic_games" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."fanatic_games_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."fanatic_riddles" (
    "id" bigint NOT NULL,
    "game_id" bigint,
    "riddle" "text",
    "sort_order" smallint
);


ALTER TABLE "public"."fanatic_riddles" OWNER TO "postgres";


ALTER TABLE "public"."fanatic_riddles" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."fanatic_riddles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."frames" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "image_path" "text" NOT NULL,
    "price" bigint NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "frames_price_check" CHECK (("price" >= 0))
);


ALTER TABLE "public"."frames" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."friendships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "requester_profile_id" "uuid" NOT NULL,
    "receiver_profile_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "friendships_no_self_invite" CHECK (("requester_profile_id" <> "receiver_profile_id")),
    CONSTRAINT "friendships_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'declined'::"text"])))
);

ALTER TABLE ONLY "public"."friendships" REPLICA IDENTITY FULL;


ALTER TABLE "public"."friendships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."legacy_moments" (
    "id" bigint NOT NULL,
    "year_id" bigint NOT NULL,
    "year" integer NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text",
    "description" "text" NOT NULL,
    "image_url" "text" NOT NULL,
    "cta_label" "text" DEFAULT 'View moment'::"text",
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."legacy_moments" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."legacy_moments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."legacy_moments_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."legacy_moments_id_seq" OWNED BY "public"."legacy_moments"."id";



CREATE TABLE IF NOT EXISTS "public"."legacy_players" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "jersey_number" "text",
    "bio" "text" NOT NULL,
    "image_url" "text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."legacy_players" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."legacy_players_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."legacy_players_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."legacy_players_id_seq" OWNED BY "public"."legacy_players"."id";



CREATE TABLE IF NOT EXISTS "public"."legacy_year_players" (
    "year_id" bigint NOT NULL,
    "player_id" bigint NOT NULL,
    "highlight_text" "text",
    "display_order" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."legacy_year_players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."legacy_years" (
    "id" bigint NOT NULL,
    "year" integer NOT NULL,
    "label" "text" NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text" NOT NULL,
    "description" "text" NOT NULL,
    "image_url" "text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."legacy_years" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."legacy_years_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."legacy_years_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."legacy_years_id_seq" OWNED BY "public"."legacy_years"."id";



CREATE TABLE IF NOT EXISTS "public"."news_article_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "original_url" "text" NOT NULL,
    "title" "text",
    "description" "text",
    "image_url" "text",
    "source" "text",
    "published_at" timestamp with time zone,
    "body" "text",
    "body_paragraphs" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "provider" "text" DEFAULT 'apify'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."news_article_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" bigint NOT NULL,
    "profile_id" "uuid",
    "title" character varying NOT NULL,
    "body" "text",
    "read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'notifs from diferent sources to be shown to users.';



ALTER TABLE "public"."notifications" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."notifications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."option_result_map" (
    "id" integer NOT NULL,
    "option_id" integer NOT NULL,
    "result_id" integer NOT NULL,
    "weight" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_option_result_map_weight" CHECK (("weight" > 0))
);


ALTER TABLE "public"."option_result_map" OWNER TO "postgres";


ALTER TABLE "public"."option_result_map" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."option_result_map_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."owned_frames" (
    "profile_id" "uuid" NOT NULL,
    "frame_id" "text" NOT NULL,
    "purchased_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."owned_frames" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."point_events" (
    "id" integer NOT NULL,
    "key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "description" "text",
    "points" integer NOT NULL
);


ALTER TABLE "public"."point_events" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."point_events_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."point_events_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."point_events_id_seq" OWNED BY "public"."point_events"."id";



CREATE TABLE IF NOT EXISTS "public"."point_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid",
    "event_key" "text",
    "points" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."point_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_catalog" (
    "id" bigint NOT NULL,
    "name" character varying,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "image_url" "text",
    "product_embedding" "extensions"."vector",
    "product_details" "jsonb",
    "meta_data" "jsonb"
);


ALTER TABLE "public"."product_catalog" OWNER TO "postgres";


COMMENT ON TABLE "public"."product_catalog" IS 'products sold at the afi store';



COMMENT ON COLUMN "public"."product_catalog"."product_details" IS 'The description of the product. It is not meant for categorizing.';



COMMENT ON COLUMN "public"."product_catalog"."meta_data" IS 'json properties that shoud not cause a re-embedding, for example, collection image change.';



ALTER TABLE "public"."product_catalog" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."product_catalog_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."secondary_product_images" (
    "id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "image_url" "text",
    "priority" smallint NOT NULL,
    CONSTRAINT "secondary_product_images_priority_check" CHECK (("priority" > 1))
);


ALTER TABLE "public"."secondary_product_images" OWNER TO "postgres";


ALTER TABLE "public"."secondary_product_images" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."product_images_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."product_pricing" (
    "id" bigint NOT NULL,
    "product_id" bigint,
    "price" double precision,
    "discount" double precision,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "product_pricing_discount_check" CHECK ((("discount" >= (0)::double precision) AND ("discount" < (1)::double precision))),
    CONSTRAINT "product_pricing_price_check" CHECK (("price" > (0)::double precision))
);


ALTER TABLE "public"."product_pricing" OWNER TO "postgres";


COMMENT ON TABLE "public"."product_pricing" IS 'historical of all product prices.';



ALTER TABLE "public"."product_pricing" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."product_pricing_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."quiz_attempt_answers" (
    "id" integer NOT NULL,
    "attempt_id" integer NOT NULL,
    "question_id" integer NOT NULL,
    "option_id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."quiz_attempt_answers" OWNER TO "postgres";


ALTER TABLE "public"."quiz_attempt_answers" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."quiz_attempt_answers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."quiz_attempts" (
    "id" integer NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "quiz_id" integer NOT NULL,
    "result_id" integer,
    "status" "text" DEFAULT 'in_progress'::"text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "available_again_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_quiz_attempts_status" CHECK (("status" = ANY (ARRAY['in_progress'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."quiz_attempts" OWNER TO "postgres";


ALTER TABLE "public"."quiz_attempts" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."quiz_attempts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."quiz_options" (
    "id" integer NOT NULL,
    "question_id" integer NOT NULL,
    "option_text" "text" NOT NULL,
    "image_url" "text",
    "option_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_quiz_options_order" CHECK (("option_order" > 0))
);


ALTER TABLE "public"."quiz_options" OWNER TO "postgres";


ALTER TABLE "public"."quiz_options" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."quiz_options_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."quiz_questions" (
    "id" integer NOT NULL,
    "quiz_id" integer NOT NULL,
    "question_text" "text" NOT NULL,
    "question_order" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_quiz_questions_order" CHECK (("question_order" > 0))
);


ALTER TABLE "public"."quiz_questions" OWNER TO "postgres";


ALTER TABLE "public"."quiz_questions" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."quiz_questions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."quiz_results" (
    "id" integer NOT NULL,
    "quiz_id" integer NOT NULL,
    "title" "text" NOT NULL,
    "subtitle" "text",
    "description" "text" NOT NULL,
    "image_url" "text",
    "priority" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."quiz_results" OWNER TO "postgres";


ALTER TABLE "public"."quiz_results" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."quiz_results_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."quizzes" (
    "id" integer NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "image_url" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."quizzes" OWNER TO "postgres";


ALTER TABLE "public"."quizzes" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."quizzes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."room_members" (
    "id" bigint NOT NULL,
    "room_id" bigint NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'accepted'::"text" NOT NULL,
    CONSTRAINT "room_members_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'member'::"text"]))),
    CONSTRAINT "room_members_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text"])))
);


ALTER TABLE "public"."room_members" OWNER TO "postgres";


COMMENT ON TABLE "public"."room_members" IS 'Membership of profiles inside rooms';



COMMENT ON COLUMN "public"."room_members"."status" IS 'pending = invited but not yet joined; accepted = active member';



ALTER TABLE "public"."room_members" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."room_members_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."room_messages" (
    "id" bigint NOT NULL,
    "room_id" bigint NOT NULL,
    "sender_profile_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "room_messages_content_check" CHECK (("length"(TRIM(BOTH FROM "content")) > 0))
);


ALTER TABLE "public"."room_messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."room_messages" IS 'Messages sent inside a room';



ALTER TABLE "public"."room_messages" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."room_messages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."rooms" (
    "id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "owner_profile_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'live'::"text" NOT NULL,
    "accent" "text" DEFAULT '#1D4ED8'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    "match_hidden" boolean DEFAULT false NOT NULL,
    CONSTRAINT "rooms_status_check" CHECK (("status" = ANY (ARRAY['live'::"text", 'offline'::"text"])))
);


ALTER TABLE "public"."rooms" OWNER TO "postgres";


COMMENT ON TABLE "public"."rooms" IS 'Private fan rooms';



ALTER TABLE "public"."rooms" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."rooms_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."shoot_challenge_players" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "challenge_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "score" integer,
    "total_shots" integer,
    "success_rate" numeric(5,2),
    "status" "text" DEFAULT 'joined'::"text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "finished_at" timestamp with time zone,
    CONSTRAINT "shoot_challenge_players_status_check" CHECK (("status" = ANY (ARRAY['joined'::"text", 'playing'::"text", 'finished'::"text", 'disconnected'::"text"])))
);


ALTER TABLE "public"."shoot_challenge_players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shoot_challenges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "host_profile_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'waiting'::"text" NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "shoot_challenges_status_check" CHECK (("status" = ANY (ARRAY['waiting'::"text", 'playing'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."shoot_challenges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shoot_your_shot_games" (
    "id" bigint NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "score" integer DEFAULT 0 NOT NULL,
    "total_shots" integer DEFAULT 0 NOT NULL,
    "success_rate" numeric(5,2) DEFAULT 0 NOT NULL,
    "duration_seconds" integer DEFAULT 60 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shoot_your_shot_games" OWNER TO "postgres";


ALTER TABLE "public"."shoot_your_shot_games" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."shoot_your_shot_games_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "public"."shoot_your_shot_global_ranking" AS
 SELECT "p"."id" AS "profile_id",
    "p"."name",
    "p"."username",
    "p"."avatar_url",
    "round"("avg"("g"."score"), 2) AS "avg_score",
    "round"("avg"("g"."success_rate"), 2) AS "avg_success_rate",
    "count"("g"."id") AS "games_played"
   FROM ("public"."shoot_your_shot_games" "g"
     JOIN "public"."profiles" "p" ON (("p"."id" = "g"."profile_id")))
  GROUP BY "p"."id", "p"."name", "p"."username", "p"."avatar_url"
  ORDER BY ("round"("avg"("g"."score"), 2)) DESC, ("round"("avg"("g"."success_rate"), 2)) DESC, ("count"("g"."id")) DESC
 LIMIT 5;


ALTER VIEW "public"."shoot_your_shot_global_ranking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shopping_cart_items" (
    "id" bigint NOT NULL,
    "cart_id" bigint,
    "priced_product_id" bigint,
    "product_details" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."shopping_cart_items" OWNER TO "postgres";


COMMENT ON COLUMN "public"."shopping_cart_items"."product_details" IS 'specifications of the selected product';



ALTER TABLE "public"."shopping_cart_items" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."shopping_cart_items_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."shopping_carts" (
    "id" bigint NOT NULL,
    "profile_id" "uuid",
    "cart_status" "public"."shoping_cart_status"
);


ALTER TABLE "public"."shopping_carts" OWNER TO "postgres";


COMMENT ON TABLE "public"."shopping_carts" IS 'carts created by profiles.';



ALTER TABLE "public"."shopping_carts" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."shopping_carts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."thunder_conversations" (
    "id" bigint NOT NULL,
    "profile_id" "uuid",
    "content" "text",
    "role" "public"."conversation_role",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."thunder_conversations" OWNER TO "postgres";


ALTER TABLE "public"."thunder_conversations" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."thunder_conversations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "statistics_demo"."games" (
    "id" integer NOT NULL,
    "game_date" "date" NOT NULL,
    "opponent" "text" NOT NULL,
    "is_home" boolean NOT NULL,
    "warriors_score" integer,
    "opponent_score" integer,
    "status" "text" NOT NULL
);


ALTER TABLE "statistics_demo"."games" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "statistics_demo"."games_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "statistics_demo"."games_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "statistics_demo"."games_id_seq" OWNED BY "statistics_demo"."games"."id";



CREATE TABLE IF NOT EXISTS "statistics_demo"."player_stats" (
    "id" integer NOT NULL,
    "player_id" integer,
    "pts" numeric(4,1),
    "reb" numeric(4,1),
    "ast" numeric(4,1),
    "games_played" integer
);


ALTER TABLE "statistics_demo"."player_stats" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "statistics_demo"."player_stats_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "statistics_demo"."player_stats_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "statistics_demo"."player_stats_id_seq" OWNED BY "statistics_demo"."player_stats"."id";



CREATE TABLE IF NOT EXISTS "statistics_demo"."players" (
    "id" integer NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "position" "text",
    "jersey_number" integer
);


ALTER TABLE "statistics_demo"."players" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "statistics_demo"."players_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "statistics_demo"."players_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "statistics_demo"."players_id_seq" OWNED BY "statistics_demo"."players"."id";



CREATE TABLE IF NOT EXISTS "statistics_demo"."standings" (
    "id" integer NOT NULL,
    "team_name" "text" NOT NULL,
    "division" "text" NOT NULL,
    "wins" integer NOT NULL,
    "losses" integer NOT NULL,
    "conference" "text" NOT NULL
);


ALTER TABLE "statistics_demo"."standings" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "statistics_demo"."standings_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "statistics_demo"."standings_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "statistics_demo"."standings_id_seq" OWNED BY "statistics_demo"."standings"."id";



ALTER TABLE ONLY "public"."legacy_moments" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."legacy_moments_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."legacy_players" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."legacy_players_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."legacy_years" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."legacy_years_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."point_events" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."point_events_id_seq"'::"regclass");



ALTER TABLE ONLY "statistics_demo"."games" ALTER COLUMN "id" SET DEFAULT "nextval"('"statistics_demo"."games_id_seq"'::"regclass");



ALTER TABLE ONLY "statistics_demo"."player_stats" ALTER COLUMN "id" SET DEFAULT "nextval"('"statistics_demo"."player_stats_id_seq"'::"regclass");



ALTER TABLE ONLY "statistics_demo"."players" ALTER COLUMN "id" SET DEFAULT "nextval"('"statistics_demo"."players_id_seq"'::"regclass");



ALTER TABLE ONLY "statistics_demo"."standings" ALTER COLUMN "id" SET DEFAULT "nextval"('"statistics_demo"."standings_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."coin_earnings_log"
    ADD CONSTRAINT "coin_earnings_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."domain_scans"
    ADD CONSTRAINT "domain_scans_base_domain_key" UNIQUE ("base_domain");



ALTER TABLE ONLY "public"."domain_scans"
    ADD CONSTRAINT "domain_scans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."domain_variants"
    ADD CONSTRAINT "domain_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fan_event_attendees"
    ADD CONSTRAINT "fan_event_attendees_fan_event_id_profile_id_key" UNIQUE ("fan_event_id", "profile_id");



ALTER TABLE ONLY "public"."fan_event_attendees"
    ADD CONSTRAINT "fan_event_attendees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fan_event_images"
    ADD CONSTRAINT "fan_event_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fan_events"
    ADD CONSTRAINT "fan_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fanatic_answers"
    ADD CONSTRAINT "fanatic_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fanatic_game_config"
    ADD CONSTRAINT "fanatic_game_config_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."fanatic_games"
    ADD CONSTRAINT "fanatic_games_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fanatic_riddles"
    ADD CONSTRAINT "fanatic_riddles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."frames"
    ADD CONSTRAINT "frames_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legacy_moments"
    ADD CONSTRAINT "legacy_moments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legacy_players"
    ADD CONSTRAINT "legacy_players_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."legacy_players"
    ADD CONSTRAINT "legacy_players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legacy_year_players"
    ADD CONSTRAINT "legacy_year_players_pkey" PRIMARY KEY ("year_id", "player_id");



ALTER TABLE ONLY "public"."legacy_years"
    ADD CONSTRAINT "legacy_years_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legacy_years"
    ADD CONSTRAINT "legacy_years_year_key" UNIQUE ("year");



ALTER TABLE ONLY "public"."news_article_cache"
    ADD CONSTRAINT "news_article_cache_original_url_key" UNIQUE ("original_url");



ALTER TABLE ONLY "public"."news_article_cache"
    ADD CONSTRAINT "news_article_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."option_result_map"
    ADD CONSTRAINT "option_result_map_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."owned_frames"
    ADD CONSTRAINT "owned_frames_pkey" PRIMARY KEY ("profile_id", "frame_id");



ALTER TABLE ONLY "public"."point_events"
    ADD CONSTRAINT "point_events_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."point_events"
    ADD CONSTRAINT "point_events_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."point_logs"
    ADD CONSTRAINT "point_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_catalog"
    ADD CONSTRAINT "product_catalog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."secondary_product_images"
    ADD CONSTRAINT "product_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_pricing"
    ADD CONSTRAINT "product_pricing_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_attempt_answers"
    ADD CONSTRAINT "quiz_attempt_answers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_options"
    ADD CONSTRAINT "quiz_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_results"
    ADD CONSTRAINT "quiz_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."room_members"
    ADD CONSTRAINT "room_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."room_members"
    ADD CONSTRAINT "room_members_room_id_profile_id_key" UNIQUE ("room_id", "profile_id");



ALTER TABLE ONLY "public"."room_messages"
    ADD CONSTRAINT "room_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shoot_challenge_players"
    ADD CONSTRAINT "shoot_challenge_players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shoot_challenge_players"
    ADD CONSTRAINT "shoot_challenge_players_unique" UNIQUE ("challenge_id", "profile_id");



ALTER TABLE ONLY "public"."shoot_challenges"
    ADD CONSTRAINT "shoot_challenges_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."shoot_challenges"
    ADD CONSTRAINT "shoot_challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shoot_your_shot_games"
    ADD CONSTRAINT "shoot_your_shot_games_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopping_cart_items"
    ADD CONSTRAINT "shopping_cart_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shopping_carts"
    ADD CONSTRAINT "shopping_carts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."thunder_conversations"
    ADD CONSTRAINT "thunder_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fanatic_riddles"
    ADD CONSTRAINT "unique_game_riddle_order" UNIQUE ("game_id", "sort_order");



ALTER TABLE ONLY "public"."domain_variants"
    ADD CONSTRAINT "uq_domain_variants" UNIQUE ("scan_id", "variant_domain");



ALTER TABLE ONLY "public"."option_result_map"
    ADD CONSTRAINT "uq_option_result_map_unique" UNIQUE ("option_id", "result_id");



ALTER TABLE ONLY "public"."quiz_attempt_answers"
    ADD CONSTRAINT "uq_quiz_attempt_answers_attempt_question" UNIQUE ("attempt_id", "question_id");



ALTER TABLE ONLY "public"."quiz_options"
    ADD CONSTRAINT "uq_quiz_options_order" UNIQUE ("question_id", "option_order");



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "uq_quiz_questions_order" UNIQUE ("quiz_id", "question_order");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");



ALTER TABLE ONLY "statistics_demo"."games"
    ADD CONSTRAINT "games_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "statistics_demo"."player_stats"
    ADD CONSTRAINT "player_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "statistics_demo"."players"
    ADD CONSTRAINT "players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "statistics_demo"."standings"
    ADD CONSTRAINT "standings_pkey" PRIMARY KEY ("id");



CREATE INDEX "fan_event_attendees_created_at_idx" ON "public"."fan_event_attendees" USING "btree" ("created_at");



CREATE INDEX "fan_event_attendees_event_idx" ON "public"."fan_event_attendees" USING "btree" ("fan_event_id");



CREATE INDEX "fan_event_attendees_event_profile_idx" ON "public"."fan_event_attendees" USING "btree" ("fan_event_id", "profile_id");



CREATE INDEX "fan_event_attendees_profile_idx" ON "public"."fan_event_attendees" USING "btree" ("profile_id");



CREATE INDEX "fan_event_images_event_id_idx" ON "public"."fan_event_images" USING "btree" ("fan_event_id");



CREATE INDEX "fan_event_images_event_sort_idx" ON "public"."fan_event_images" USING "btree" ("fan_event_id", "sort_order");



CREATE UNIQUE INDEX "fan_event_images_event_sort_unique_idx" ON "public"."fan_event_images" USING "btree" ("fan_event_id", "sort_order");



CREATE INDEX "fan_events_organizer_idx" ON "public"."fan_events" USING "btree" ("organizer_profile_id");



CREATE INDEX "fan_events_public_start_idx" ON "public"."fan_events" USING "btree" ("is_public", "start_at");



CREATE INDEX "fan_events_start_at_idx" ON "public"."fan_events" USING "btree" ("start_at");



CREATE INDEX "fanatic_answers_created_at_idx" ON "public"."fanatic_answers" USING "btree" ("created_at");



CREATE INDEX "fanatic_answers_game_id_created_at_idx" ON "public"."fanatic_answers" USING "btree" ("game_id", "created_at");



CREATE INDEX "fanatic_answers_profile_id_created_at_idx" ON "public"."fanatic_answers" USING "btree" ("profile_id", "created_at");



CREATE INDEX "friendships_receiver_idx" ON "public"."friendships" USING "btree" ("receiver_profile_id");



CREATE INDEX "friendships_requester_idx" ON "public"."friendships" USING "btree" ("requester_profile_id");



CREATE INDEX "friendships_status_idx" ON "public"."friendships" USING "btree" ("status");



CREATE UNIQUE INDEX "friendships_unique_active_pair" ON "public"."friendships" USING "btree" (LEAST(("requester_profile_id")::"text", ("receiver_profile_id")::"text"), GREATEST(("requester_profile_id")::"text", ("receiver_profile_id")::"text")) WHERE ("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text"]));



CREATE INDEX "idx_domain_scans_base_domain" ON "public"."domain_scans" USING "btree" ("base_domain");



CREATE INDEX "idx_domain_variants_registered" ON "public"."domain_variants" USING "btree" ("scan_id", "is_registered");



CREATE INDEX "idx_domain_variants_scan_id" ON "public"."domain_variants" USING "btree" ("scan_id");



CREATE INDEX "idx_legacy_moments_year_id" ON "public"."legacy_moments" USING "btree" ("year_id");



CREATE INDEX "idx_legacy_year_players_player_id" ON "public"."legacy_year_players" USING "btree" ("player_id");



CREATE INDEX "idx_legacy_year_players_year_id" ON "public"."legacy_year_players" USING "btree" ("year_id");



CREATE INDEX "idx_option_result_map_option_id" ON "public"."option_result_map" USING "btree" ("option_id");



CREATE INDEX "idx_option_result_map_result_id" ON "public"."option_result_map" USING "btree" ("result_id");



CREATE INDEX "idx_quiz_attempt_answers_attempt_id" ON "public"."quiz_attempt_answers" USING "btree" ("attempt_id");



CREATE INDEX "idx_quiz_attempt_answers_option_id" ON "public"."quiz_attempt_answers" USING "btree" ("option_id");



CREATE INDEX "idx_quiz_attempt_answers_question_id" ON "public"."quiz_attempt_answers" USING "btree" ("question_id");



CREATE INDEX "idx_quiz_attempts_available_again_at" ON "public"."quiz_attempts" USING "btree" ("available_again_at");



CREATE INDEX "idx_quiz_attempts_profile_id" ON "public"."quiz_attempts" USING "btree" ("profile_id");



CREATE INDEX "idx_quiz_attempts_quiz_id" ON "public"."quiz_attempts" USING "btree" ("quiz_id");



CREATE INDEX "idx_quiz_options_question_id" ON "public"."quiz_options" USING "btree" ("question_id");



CREATE INDEX "idx_quiz_questions_quiz_id" ON "public"."quiz_questions" USING "btree" ("quiz_id");



CREATE INDEX "idx_quiz_results_quiz_id" ON "public"."quiz_results" USING "btree" ("quiz_id");



CREATE INDEX "news_article_cache_original_url_idx" ON "public"."news_article_cache" USING "btree" ("original_url");



CREATE INDEX "news_article_cache_updated_at_idx" ON "public"."news_article_cache" USING "btree" ("updated_at" DESC);



CREATE INDEX "owned_frames_profile_id_idx" ON "public"."owned_frames" USING "btree" ("profile_id");



CREATE INDEX "profiles_username_trgm_idx" ON "public"."profiles" USING "gin" ("username" "public"."gin_trgm_ops");



CREATE INDEX "room_members_profile_id_idx" ON "public"."room_members" USING "btree" ("profile_id");



CREATE INDEX "room_members_room_id_idx" ON "public"."room_members" USING "btree" ("room_id");



CREATE INDEX "room_members_status_idx" ON "public"."room_members" USING "btree" ("status");



CREATE INDEX "room_messages_created_at_idx" ON "public"."room_messages" USING "btree" ("created_at");



CREATE INDEX "room_messages_room_id_created_at_idx" ON "public"."room_messages" USING "btree" ("room_id", "created_at" DESC);



CREATE INDEX "room_messages_sender_profile_id_idx" ON "public"."room_messages" USING "btree" ("sender_profile_id");



CREATE INDEX "rooms_owner_profile_id_idx" ON "public"."rooms" USING "btree" ("owner_profile_id");



CREATE INDEX "rooms_status_idx" ON "public"."rooms" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "fan_events_set_updated_at" BEFORE UPDATE ON "public"."fan_events" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "friendships_set_updated_at" BEFORE UPDATE ON "public"."friendships" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "on_fanatic_answer_change" AFTER INSERT OR UPDATE OF "answer" ON "public"."fanatic_games" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_generate_fanatic_embedding"();



CREATE OR REPLACE TRIGGER "on_product_change" AFTER INSERT OR UPDATE OF "name", "description", "product_details" ON "public"."product_catalog" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_generate_product_embedding"();



CREATE OR REPLACE TRIGGER "trg_schedule_fanatic_end_date" AFTER INSERT OR DELETE OR UPDATE OF "end_date" ON "public"."fanatic_games" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_fanatic_cron"();



CREATE OR REPLACE TRIGGER "trg_sync_ecoins" BEFORE UPDATE OF "fanatic_coins" ON "public"."profiles" FOR EACH ROW WHEN (("new"."fanatic_coins" IS DISTINCT FROM "old"."fanatic_coins")) EXECUTE FUNCTION "public"."trigger_sync_ecoins"();



ALTER TABLE ONLY "public"."coin_earnings_log"
    ADD CONSTRAINT "coin_earnings_log_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."domain_variants"
    ADD CONSTRAINT "domain_variants_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "public"."domain_scans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fan_event_attendees"
    ADD CONSTRAINT "fan_event_attendees_fan_event_id_fkey" FOREIGN KEY ("fan_event_id") REFERENCES "public"."fan_events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fan_event_attendees"
    ADD CONSTRAINT "fan_event_attendees_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fan_event_images"
    ADD CONSTRAINT "fan_event_images_fan_event_id_fkey" FOREIGN KEY ("fan_event_id") REFERENCES "public"."fan_events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fan_events"
    ADD CONSTRAINT "fan_events_organizer_profile_id_fkey" FOREIGN KEY ("organizer_profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fanatic_answers"
    ADD CONSTRAINT "fanatic_answers_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."fanatic_games"("id");



ALTER TABLE ONLY "public"."fanatic_answers"
    ADD CONSTRAINT "fanatic_answers_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."fanatic_riddles"
    ADD CONSTRAINT "fanatic_riddles_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."fanatic_games"("id");



ALTER TABLE ONLY "public"."option_result_map"
    ADD CONSTRAINT "fk_option_result_map_option" FOREIGN KEY ("option_id") REFERENCES "public"."quiz_options"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."option_result_map"
    ADD CONSTRAINT "fk_option_result_map_result" FOREIGN KEY ("result_id") REFERENCES "public"."quiz_results"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_attempt_answers"
    ADD CONSTRAINT "fk_quiz_attempt_answers_attempt" FOREIGN KEY ("attempt_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_attempt_answers"
    ADD CONSTRAINT "fk_quiz_attempt_answers_option" FOREIGN KEY ("option_id") REFERENCES "public"."quiz_options"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_attempt_answers"
    ADD CONSTRAINT "fk_quiz_attempt_answers_question" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "fk_quiz_attempts_quiz" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "fk_quiz_attempts_result" FOREIGN KEY ("result_id") REFERENCES "public"."quiz_results"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."quiz_options"
    ADD CONSTRAINT "fk_quiz_options_question" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "fk_quiz_questions_quiz" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_results"
    ADD CONSTRAINT "fk_quiz_results_quiz" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_receiver_profile_id_fkey" FOREIGN KEY ("receiver_profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_requester_profile_id_fkey" FOREIGN KEY ("requester_profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."legacy_moments"
    ADD CONSTRAINT "legacy_moments_year_id_fkey" FOREIGN KEY ("year_id") REFERENCES "public"."legacy_years"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."legacy_year_players"
    ADD CONSTRAINT "legacy_year_players_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."legacy_players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."legacy_year_players"
    ADD CONSTRAINT "legacy_year_players_year_id_fkey" FOREIGN KEY ("year_id") REFERENCES "public"."legacy_years"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."owned_frames"
    ADD CONSTRAINT "owned_frames_frame_id_fkey" FOREIGN KEY ("frame_id") REFERENCES "public"."frames"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."owned_frames"
    ADD CONSTRAINT "owned_frames_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."point_logs"
    ADD CONSTRAINT "point_logs_event_key_fkey" FOREIGN KEY ("event_key") REFERENCES "public"."point_events"("key");



ALTER TABLE ONLY "public"."point_logs"
    ADD CONSTRAINT "point_logs_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."secondary_product_images"
    ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product_catalog"("id");



ALTER TABLE ONLY "public"."product_pricing"
    ADD CONSTRAINT "product_pricing_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."product_catalog"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_selected_frame_id_fkey" FOREIGN KEY ("selected_frame_id") REFERENCES "public"."frames"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."quiz_attempts"
    ADD CONSTRAINT "quiz_attempts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_members"
    ADD CONSTRAINT "room_members_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_members"
    ADD CONSTRAINT "room_members_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_messages"
    ADD CONSTRAINT "room_messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_messages"
    ADD CONSTRAINT "room_messages_sender_profile_id_fkey" FOREIGN KEY ("sender_profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_owner_profile_id_fkey" FOREIGN KEY ("owner_profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shoot_challenge_players"
    ADD CONSTRAINT "shoot_challenge_players_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."shoot_challenges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shoot_challenge_players"
    ADD CONSTRAINT "shoot_challenge_players_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shoot_challenges"
    ADD CONSTRAINT "shoot_challenges_host_profile_id_fkey" FOREIGN KEY ("host_profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shoot_your_shot_games"
    ADD CONSTRAINT "shoot_your_shot_games_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shopping_cart_items"
    ADD CONSTRAINT "shopping_cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."shopping_carts"("id");



ALTER TABLE ONLY "public"."shopping_cart_items"
    ADD CONSTRAINT "shopping_cart_items_priced_product_id_fkey" FOREIGN KEY ("priced_product_id") REFERENCES "public"."product_pricing"("id");



ALTER TABLE ONLY "public"."shopping_carts"
    ADD CONSTRAINT "shopping_carts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."thunder_conversations"
    ADD CONSTRAINT "thunder_conversations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "statistics_demo"."player_stats"
    ADD CONSTRAINT "player_stats_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "statistics_demo"."players"("id");



CREATE POLICY "Admins can delete product_catalog" ON "public"."product_catalog" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can delete product_pricing" ON "public"."product_pricing" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can insert product_catalog" ON "public"."product_catalog" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can insert product_pricing" ON "public"."product_pricing" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update product_catalog" ON "public"."product_catalog" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update product_pricing" ON "public"."product_pricing" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "Anyone can read point events" ON "public"."point_events" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view challenge players" ON "public"."shoot_challenge_players" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view quiz options" ON "public"."quiz_options" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view quiz questions" ON "public"."quiz_questions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view quiz results" ON "public"."quiz_results" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view waiting challenges" ON "public"."shoot_challenges" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable delete for users based on user_id" ON "public"."notifications" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "profile_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "profile_id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."shopping_cart_items" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = ( SELECT "shopping_carts"."profile_id"
   FROM "public"."shopping_carts"
  WHERE ("shopping_carts"."id" = "shopping_cart_items"."cart_id"))));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."fanatic_answers" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users, thier own data only" ON "public"."shopping_carts" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "profile_id"));



CREATE POLICY "Enable insert for users based on user_id" ON "public"."profiles" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Enable insert for users based on user_id" ON "public"."shopping_cart_items" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = ( SELECT "shopping_carts"."profile_id"
   FROM "public"."shopping_carts"
  WHERE ("shopping_carts"."id" = "shopping_cart_items"."cart_id"))));



CREATE POLICY "Enable insert for users based on user_id" ON "public"."thunder_conversations" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "profile_id"));



CREATE POLICY "Enable read access for all users" ON "public"."fanatic_game_config" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."fanatic_games" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."fanatic_riddles" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."product_catalog" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."product_pricing" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."secondary_product_images" FOR SELECT USING (true);



CREATE POLICY "Enable users to view their own data only" ON "public"."fanatic_answers" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "profile_id"));



CREATE POLICY "Enable users to view their own data only" ON "public"."notifications" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "profile_id"));



CREATE POLICY "Enable users to view their own data only" ON "public"."shopping_cart_items" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = ( SELECT "shopping_carts"."profile_id"
   FROM "public"."shopping_carts"
  WHERE ("shopping_carts"."id" = "shopping_cart_items"."cart_id"))));



CREATE POLICY "Enable users to view their own data only" ON "public"."shopping_carts" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "profile_id"));



CREATE POLICY "Enable users to view their own data only" ON "public"."thunder_conversations" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "profile_id"));



CREATE POLICY "Host can update own challenge" ON "public"."shoot_challenges" FOR UPDATE TO "authenticated" USING (("host_profile_id" = "auth"."uid"())) WITH CHECK (("host_profile_id" = "auth"."uid"()));



CREATE POLICY "Legacy moments are readable by everyone" ON "public"."legacy_moments" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Legacy players are readable by everyone" ON "public"."legacy_players" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Legacy year players are readable by everyone" ON "public"."legacy_year_players" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Legacy years are readable by everyone" ON "public"."legacy_years" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Profiles can view their own quiz attempts" ON "public"."quiz_attempts" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can create challenges" ON "public"."shoot_challenges" FOR INSERT TO "authenticated" WITH CHECK (("host_profile_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own shoot games" ON "public"."shoot_your_shot_games" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can join challenges" ON "public"."shoot_challenge_players" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can update own challenge result" ON "public"."shoot_challenge_players" FOR UPDATE TO "authenticated" USING (("profile_id" = "auth"."uid"())) WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can view answers from their own attempts" ON "public"."quiz_attempt_answers" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."quiz_attempts" "qa"
  WHERE (("qa"."id" = "quiz_attempt_answers"."attempt_id") AND ("qa"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Users can view quizzes" ON "public"."quizzes" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Users can view shoot games" ON "public"."shoot_your_shot_games" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view their own logs" ON "public"."point_logs" FOR SELECT USING (("auth"."uid"() = "profile_id"));



ALTER TABLE "public"."coin_earnings_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."domain_scans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."domain_variants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fan_event_attendees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fan_event_attendees authenticated link access" ON "public"."fan_event_attendees" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "fan_event_attendees public event read" ON "public"."fan_event_attendees" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."fan_events"
  WHERE (("fan_events"."id" = "fan_event_attendees"."fan_event_id") AND ("fan_events"."is_public" = true)))));



CREATE POLICY "fan_event_attendees self delete" ON "public"."fan_event_attendees" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "fan_event_attendees self update" ON "public"."fan_event_attendees" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "profile_id")) WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "fan_event_attendees self write" ON "public"."fan_event_attendees" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "fan_event_attendees_select_admin" ON "public"."fan_event_attendees" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



ALTER TABLE "public"."fan_event_images" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fan_event_images authenticated link access" ON "public"."fan_event_images" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "fan_event_images organizer delete" ON "public"."fan_event_images" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."fan_events"
  WHERE (("fan_events"."id" = "fan_event_images"."fan_event_id") AND ("fan_events"."organizer_profile_id" = "auth"."uid"())))));



CREATE POLICY "fan_event_images organizer insert" ON "public"."fan_event_images" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."fan_events"
  WHERE (("fan_events"."id" = "fan_event_images"."fan_event_id") AND ("fan_events"."organizer_profile_id" = "auth"."uid"())))));



CREATE POLICY "fan_event_images organizer update" ON "public"."fan_event_images" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."fan_events"
  WHERE (("fan_events"."id" = "fan_event_images"."fan_event_id") AND ("fan_events"."organizer_profile_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."fan_events"
  WHERE (("fan_events"."id" = "fan_event_images"."fan_event_id") AND ("fan_events"."organizer_profile_id" = "auth"."uid"())))));



CREATE POLICY "fan_event_images public read" ON "public"."fan_event_images" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."fan_events"
  WHERE (("fan_events"."id" = "fan_event_images"."fan_event_id") AND ("fan_events"."is_public" = true)))));



ALTER TABLE "public"."fan_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fan_events authenticated link access" ON "public"."fan_events" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "fan_events organizer delete" ON "public"."fan_events" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "organizer_profile_id"));



CREATE POLICY "fan_events organizer insert" ON "public"."fan_events" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "organizer_profile_id"));



CREATE POLICY "fan_events organizer update" ON "public"."fan_events" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "organizer_profile_id")) WITH CHECK (("auth"."uid"() = "organizer_profile_id"));



CREATE POLICY "fan_events public read" ON "public"."fan_events" FOR SELECT TO "authenticated", "anon" USING (("is_public" = true));



ALTER TABLE "public"."fanatic_answers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fanatic_answers_select_admin" ON "public"."fanatic_answers" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



ALTER TABLE "public"."fanatic_game_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fanatic_games" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fanatic_games_select_admin" ON "public"."fanatic_games" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



ALTER TABLE "public"."fanatic_riddles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."frames" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "frames_read_all" ON "public"."frames" FOR SELECT USING (("is_active" = true));



ALTER TABLE "public"."friendships" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "friendships_delete_as_participant" ON "public"."friendships" FOR DELETE USING ((("auth"."uid"() = "requester_profile_id") OR ("auth"."uid"() = "receiver_profile_id")));



CREATE POLICY "friendships_insert_as_requester" ON "public"."friendships" FOR INSERT WITH CHECK (("auth"."uid"() = "requester_profile_id"));



CREATE POLICY "friendships_select" ON "public"."friendships" FOR SELECT USING ((("auth"."uid"() = "requester_profile_id") OR ("auth"."uid"() = "receiver_profile_id") OR ("status" = 'accepted'::"text")));



CREATE POLICY "friendships_update_as_receiver" ON "public"."friendships" FOR UPDATE USING (("auth"."uid"() = "receiver_profile_id")) WITH CHECK (("auth"."uid"() = "receiver_profile_id"));



ALTER TABLE "public"."legacy_moments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."legacy_players" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."legacy_year_players" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."legacy_years" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."news_article_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "news_article_cache anon read" ON "public"."news_article_cache" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."option_result_map" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."owned_frames" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "owned_frames_select_self" ON "public"."owned_frames" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "profile_id"));



ALTER TABLE "public"."point_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."point_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_catalog" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_pricing" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_public_read" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "profiles_select" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."quiz_attempt_answers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quiz_attempts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "quiz_attempts_select_admin" ON "public"."quiz_attempts" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



ALTER TABLE "public"."quiz_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quiz_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quiz_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quizzes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."room_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "room_members_delete_self" ON "public"."room_members" FOR DELETE TO "authenticated" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "room_members_insert" ON "public"."room_members" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_owner_of_room"("room_id") AND (("role" = 'member'::"text") OR (("role" = 'owner'::"text") AND ("profile_id" = "auth"."uid"())))));



CREATE POLICY "room_members_select" ON "public"."room_members" FOR SELECT TO "authenticated" USING ((("profile_id" = "auth"."uid"()) OR "public"."is_member_of_room"("room_id") OR "public"."is_invited_to_room"("room_id")));



CREATE POLICY "room_members_update_self" ON "public"."room_members" FOR UPDATE TO "authenticated" USING (("profile_id" = "auth"."uid"())) WITH CHECK (("profile_id" = "auth"."uid"()));



ALTER TABLE "public"."room_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "room_messages_insert" ON "public"."room_messages" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_member_of_room"("room_id") AND ("sender_profile_id" = "auth"."uid"())));



CREATE POLICY "room_messages_select" ON "public"."room_messages" FOR SELECT TO "authenticated" USING ("public"."is_member_of_room"("room_id"));



CREATE POLICY "room_messages_select_admin" ON "public"."room_messages" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



ALTER TABLE "public"."rooms" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rooms_insert" ON "public"."rooms" FOR INSERT TO "authenticated" WITH CHECK ((("owner_profile_id" = "auth"."uid"()) AND ("status" = ANY (ARRAY['live'::"text", 'offline'::"text"]))));



CREATE POLICY "rooms_select" ON "public"."rooms" FOR SELECT TO "authenticated" USING ((("owner_profile_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."room_members" "rm"
  WHERE (("rm"."room_id" = "rooms"."id") AND ("rm"."profile_id" = "auth"."uid"()))))));



CREATE POLICY "rooms_update" ON "public"."rooms" FOR UPDATE TO "authenticated" USING ("public"."is_owner_of_room"("id")) WITH CHECK ("public"."is_owner_of_room"("id"));



ALTER TABLE "public"."secondary_product_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shoot_challenge_players" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shoot_challenges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shoot_your_shot_games" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shoot_your_shot_games_select_admin" ON "public"."shoot_your_shot_games" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



ALTER TABLE "public"."shopping_cart_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shopping_carts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."thunder_conversations" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."friendships";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."point_logs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."room_members";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."rooms";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."shoot_challenge_players";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."shoot_challenges";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT USAGE ON SCHEMA "statistics_demo" TO "anon";
GRANT USAGE ON SCHEMA "statistics_demo" TO "authenticated";
















































GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";




















































































































































































































































































































































































































































































GRANT ALL ON FUNCTION "public"."add_item_to_cart"("p_profile_id" "uuid", "p_priced_product_id" integer, "p_product_details" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."add_item_to_cart"("p_profile_id" "uuid", "p_priced_product_id" integer, "p_product_details" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_item_to_cart"("p_profile_id" "uuid", "p_priced_product_id" integer, "p_product_details" "jsonb") TO "service_role";



GRANT ALL ON PROCEDURE "public"."assign_fanatic_coins"(IN "p_game_id" integer) TO "anon";
GRANT ALL ON PROCEDURE "public"."assign_fanatic_coins"(IN "p_game_id" integer) TO "authenticated";
GRANT ALL ON PROCEDURE "public"."assign_fanatic_coins"(IN "p_game_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."award_points"("p_profile_id" "uuid", "p_event_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."award_points"("p_profile_id" "uuid", "p_event_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."award_points"("p_profile_id" "uuid", "p_event_key" "text") TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_profile"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_profile"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_profile"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_shoot_challenge"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_shoot_challenge"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_shoot_challenge"() TO "service_role";



GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "service_role";
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "anon";



GRANT ALL ON FUNCTION "public"."fan_event_going_count"("p_event_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."fan_event_going_count"("p_event_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."fan_event_going_count"("p_event_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."fanatic_active_game_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."fanatic_active_game_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fanatic_active_game_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fanatic_best_try"("pprofileid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fanatic_best_try"("pprofileid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fanatic_best_try"("pprofileid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fanatic_days_elapsed"() TO "anon";
GRANT ALL ON FUNCTION "public"."fanatic_days_elapsed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fanatic_days_elapsed"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fanatic_get_current_game"() TO "anon";
GRANT ALL ON FUNCTION "public"."fanatic_get_current_game"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fanatic_get_current_game"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fanatic_next_riddle_date"() TO "anon";
GRANT ALL ON FUNCTION "public"."fanatic_next_riddle_date"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fanatic_next_riddle_date"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fanatic_remaining_game_tries"("pprofileid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."fanatic_remaining_game_tries"("pprofileid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."fanatic_remaining_game_tries"("pprofileid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."fanatic_time_next_game_date"() TO "anon";
GRANT ALL ON FUNCTION "public"."fanatic_time_next_game_date"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fanatic_time_next_game_date"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_shoot_challenge_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_shoot_challenge_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_shoot_challenge_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_cart"("p_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_cart"("p_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_cart"("p_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_cart_item"("p_profile_id" "uuid", "p_cart_item_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_cart_item"("p_profile_id" "uuid", "p_cart_item_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_cart_item"("p_profile_id" "uuid", "p_cart_item_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_detailed_priced_product"("p_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_detailed_priced_product"("p_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_detailed_priced_product"("p_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_priced_products"("p_search_query" character varying, "p_filters" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."get_priced_products"("p_search_query" character varying, "p_filters" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_priced_products"("p_search_query" character varying, "p_filters" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_priced_products_by_id"("p_ids" integer[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_priced_products_by_id"("p_ids" integer[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_priced_products_by_id"("p_ids" integer[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_product_filters"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_product_filters"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_product_filters"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_shoot_your_shot_friends_ranking"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_shoot_your_shot_friends_ranking"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_shoot_your_shot_friends_ranking"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_shop_categories"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_shop_categories"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_shop_categories"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_shop_collections"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_shop_collections"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_shop_collections"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_shop_players"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_shop_players"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_shop_players"() TO "service_role";






GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_invited_to_room"("target_room_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."is_invited_to_room"("target_room_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_invited_to_room"("target_room_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_member_of_room"("target_room_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."is_member_of_room"("target_room_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_member_of_room"("target_room_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_owner_of_room"("target_room_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."is_owner_of_room"("target_room_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_owner_of_room"("target_room_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."join_shoot_challenge"("p_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."join_shoot_challenge"("p_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."join_shoot_challenge"("p_code" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."purchase_frame"("p_frame_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."purchase_frame"("p_frame_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."purchase_frame"("p_frame_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."purchase_frame"("p_frame_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_item_from_active_cart"("p_profile_id" "uuid", "p_cart_item_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."remove_item_from_active_cart"("p_profile_id" "uuid", "p_cart_item_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_item_from_active_cart"("p_profile_id" "uuid", "p_cart_item_id" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."remove_room_match"("target_room_id" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."remove_room_match"("target_room_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."remove_room_match"("target_room_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_room_match"("target_room_id" bigint) TO "service_role";



REVOKE ALL ON FUNCTION "public"."select_frame"("p_frame_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."select_frame"("p_frame_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."select_frame"("p_frame_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."select_frame"("p_frame_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_quiz_attempt"("p_quiz_id" integer, "p_answers" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_quiz_attempt"("p_quiz_id" integer, "p_answers" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_quiz_attempt"("p_quiz_id" integer, "p_answers" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_fanatic_cron"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_fanatic_cron"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_fanatic_cron"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_generate_fanatic_embedding"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_generate_fanatic_embedding"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_generate_fanatic_embedding"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_generate_product_embedding"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_generate_product_embedding"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_generate_product_embedding"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_sync_ecoins"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_sync_ecoins"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_sync_ecoins"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_cart_item_details"("p_profile_id" "uuid", "p_cart_item_id" integer, "p_product_details" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_cart_item_details"("p_profile_id" "uuid", "p_cart_item_id" integer, "p_product_details" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_cart_item_details"("p_profile_id" "uuid", "p_cart_item_id" integer, "p_product_details" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_login_streak"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_login_streak"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_login_streak"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";




































GRANT ALL ON TABLE "public"."coin_earnings_log" TO "anon";
GRANT ALL ON TABLE "public"."coin_earnings_log" TO "authenticated";
GRANT ALL ON TABLE "public"."coin_earnings_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."coin_earnings_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."coin_earnings_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."coin_earnings_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."domain_scans" TO "anon";
GRANT ALL ON TABLE "public"."domain_scans" TO "authenticated";
GRANT ALL ON TABLE "public"."domain_scans" TO "service_role";



GRANT ALL ON TABLE "public"."domain_variants" TO "anon";
GRANT ALL ON TABLE "public"."domain_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."domain_variants" TO "service_role";



GRANT ALL ON TABLE "public"."fan_event_attendees" TO "anon";
GRANT ALL ON TABLE "public"."fan_event_attendees" TO "authenticated";
GRANT ALL ON TABLE "public"."fan_event_attendees" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fan_event_attendees_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fan_event_attendees_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fan_event_attendees_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."fan_event_images" TO "anon";
GRANT ALL ON TABLE "public"."fan_event_images" TO "authenticated";
GRANT ALL ON TABLE "public"."fan_event_images" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fan_event_images_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fan_event_images_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fan_event_images_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."fan_events" TO "anon";
GRANT ALL ON TABLE "public"."fan_events" TO "authenticated";
GRANT ALL ON TABLE "public"."fan_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fan_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fan_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fan_events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."fanatic_answers" TO "anon";
GRANT ALL ON TABLE "public"."fanatic_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."fanatic_answers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fanatic_answers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fanatic_answers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fanatic_answers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."fanatic_game_config" TO "anon";
GRANT ALL ON TABLE "public"."fanatic_game_config" TO "authenticated";
GRANT ALL ON TABLE "public"."fanatic_game_config" TO "service_role";



GRANT ALL ON TABLE "public"."fanatic_game_results" TO "anon";
GRANT ALL ON TABLE "public"."fanatic_game_results" TO "authenticated";
GRANT ALL ON TABLE "public"."fanatic_game_results" TO "service_role";



GRANT ALL ON TABLE "public"."fanatic_games" TO "anon";
GRANT ALL ON TABLE "public"."fanatic_games" TO "authenticated";
GRANT ALL ON TABLE "public"."fanatic_games" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fanatic_games_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fanatic_games_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fanatic_games_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."fanatic_riddles" TO "anon";
GRANT ALL ON TABLE "public"."fanatic_riddles" TO "authenticated";
GRANT ALL ON TABLE "public"."fanatic_riddles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."fanatic_riddles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."fanatic_riddles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."fanatic_riddles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."frames" TO "anon";
GRANT ALL ON TABLE "public"."frames" TO "authenticated";
GRANT ALL ON TABLE "public"."frames" TO "service_role";



GRANT ALL ON TABLE "public"."friendships" TO "anon";
GRANT ALL ON TABLE "public"."friendships" TO "authenticated";
GRANT ALL ON TABLE "public"."friendships" TO "service_role";



GRANT ALL ON TABLE "public"."legacy_moments" TO "anon";
GRANT ALL ON TABLE "public"."legacy_moments" TO "authenticated";
GRANT ALL ON TABLE "public"."legacy_moments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."legacy_moments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."legacy_moments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."legacy_moments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."legacy_players" TO "anon";
GRANT ALL ON TABLE "public"."legacy_players" TO "authenticated";
GRANT ALL ON TABLE "public"."legacy_players" TO "service_role";



GRANT ALL ON SEQUENCE "public"."legacy_players_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."legacy_players_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."legacy_players_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."legacy_year_players" TO "anon";
GRANT ALL ON TABLE "public"."legacy_year_players" TO "authenticated";
GRANT ALL ON TABLE "public"."legacy_year_players" TO "service_role";



GRANT ALL ON TABLE "public"."legacy_years" TO "anon";
GRANT ALL ON TABLE "public"."legacy_years" TO "authenticated";
GRANT ALL ON TABLE "public"."legacy_years" TO "service_role";



GRANT ALL ON SEQUENCE "public"."legacy_years_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."legacy_years_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."legacy_years_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."news_article_cache" TO "anon";
GRANT ALL ON TABLE "public"."news_article_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."news_article_cache" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notifications_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."option_result_map" TO "anon";
GRANT ALL ON TABLE "public"."option_result_map" TO "authenticated";
GRANT ALL ON TABLE "public"."option_result_map" TO "service_role";



GRANT ALL ON SEQUENCE "public"."option_result_map_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."option_result_map_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."option_result_map_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."owned_frames" TO "anon";
GRANT ALL ON TABLE "public"."owned_frames" TO "authenticated";
GRANT ALL ON TABLE "public"."owned_frames" TO "service_role";



GRANT ALL ON TABLE "public"."point_events" TO "anon";
GRANT ALL ON TABLE "public"."point_events" TO "authenticated";
GRANT ALL ON TABLE "public"."point_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."point_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."point_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."point_events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."point_logs" TO "anon";
GRANT ALL ON TABLE "public"."point_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."point_logs" TO "service_role";



GRANT ALL ON TABLE "public"."product_catalog" TO "anon";
GRANT ALL ON TABLE "public"."product_catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."product_catalog" TO "service_role";



GRANT ALL ON SEQUENCE "public"."product_catalog_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."product_catalog_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."product_catalog_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."secondary_product_images" TO "anon";
GRANT ALL ON TABLE "public"."secondary_product_images" TO "authenticated";
GRANT ALL ON TABLE "public"."secondary_product_images" TO "service_role";



GRANT ALL ON SEQUENCE "public"."product_images_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."product_images_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."product_images_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."product_pricing" TO "anon";
GRANT ALL ON TABLE "public"."product_pricing" TO "authenticated";
GRANT ALL ON TABLE "public"."product_pricing" TO "service_role";



GRANT ALL ON SEQUENCE "public"."product_pricing_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."product_pricing_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."product_pricing_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_attempt_answers" TO "anon";
GRANT ALL ON TABLE "public"."quiz_attempt_answers" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_attempt_answers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."quiz_attempt_answers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."quiz_attempt_answers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."quiz_attempt_answers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_attempts" TO "anon";
GRANT ALL ON TABLE "public"."quiz_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_attempts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."quiz_attempts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."quiz_attempts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."quiz_attempts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_options" TO "anon";
GRANT ALL ON TABLE "public"."quiz_options" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_options" TO "service_role";



GRANT ALL ON SEQUENCE "public"."quiz_options_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."quiz_options_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."quiz_options_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_questions" TO "anon";
GRANT ALL ON TABLE "public"."quiz_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_questions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."quiz_questions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."quiz_questions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."quiz_questions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_results" TO "anon";
GRANT ALL ON TABLE "public"."quiz_results" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_results" TO "service_role";



GRANT ALL ON SEQUENCE "public"."quiz_results_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."quiz_results_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."quiz_results_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."quizzes" TO "anon";
GRANT ALL ON TABLE "public"."quizzes" TO "authenticated";
GRANT ALL ON TABLE "public"."quizzes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."quizzes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."quizzes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."quizzes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."room_members" TO "anon";
GRANT ALL ON TABLE "public"."room_members" TO "authenticated";
GRANT ALL ON TABLE "public"."room_members" TO "service_role";



GRANT ALL ON SEQUENCE "public"."room_members_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."room_members_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."room_members_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."room_messages" TO "anon";
GRANT ALL ON TABLE "public"."room_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."room_messages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."room_messages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."room_messages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."room_messages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."rooms" TO "anon";
GRANT ALL ON TABLE "public"."rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."rooms" TO "service_role";



GRANT ALL ON SEQUENCE "public"."rooms_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."rooms_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."rooms_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."shoot_challenge_players" TO "anon";
GRANT ALL ON TABLE "public"."shoot_challenge_players" TO "authenticated";
GRANT ALL ON TABLE "public"."shoot_challenge_players" TO "service_role";



GRANT ALL ON TABLE "public"."shoot_challenges" TO "anon";
GRANT ALL ON TABLE "public"."shoot_challenges" TO "authenticated";
GRANT ALL ON TABLE "public"."shoot_challenges" TO "service_role";



GRANT ALL ON TABLE "public"."shoot_your_shot_games" TO "anon";
GRANT ALL ON TABLE "public"."shoot_your_shot_games" TO "authenticated";
GRANT ALL ON TABLE "public"."shoot_your_shot_games" TO "service_role";



GRANT ALL ON SEQUENCE "public"."shoot_your_shot_games_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."shoot_your_shot_games_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."shoot_your_shot_games_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."shoot_your_shot_global_ranking" TO "anon";
GRANT ALL ON TABLE "public"."shoot_your_shot_global_ranking" TO "authenticated";
GRANT ALL ON TABLE "public"."shoot_your_shot_global_ranking" TO "service_role";



GRANT ALL ON TABLE "public"."shopping_cart_items" TO "anon";
GRANT ALL ON TABLE "public"."shopping_cart_items" TO "authenticated";
GRANT ALL ON TABLE "public"."shopping_cart_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."shopping_cart_items_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."shopping_cart_items_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."shopping_cart_items_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."shopping_carts" TO "anon";
GRANT ALL ON TABLE "public"."shopping_carts" TO "authenticated";
GRANT ALL ON TABLE "public"."shopping_carts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."shopping_carts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."shopping_carts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."shopping_carts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."thunder_conversations" TO "anon";
GRANT ALL ON TABLE "public"."thunder_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."thunder_conversations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."thunder_conversations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."thunder_conversations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."thunder_conversations_id_seq" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "statistics_demo"."games" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "statistics_demo"."games" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "statistics_demo"."games" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "statistics_demo"."player_stats" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "statistics_demo"."player_stats" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "statistics_demo"."player_stats" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "statistics_demo"."players" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "statistics_demo"."players" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "statistics_demo"."players" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "statistics_demo"."standings" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "statistics_demo"."standings" TO "authenticated";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "statistics_demo"."standings" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop policy "fan_event_attendees public event read" on "public"."fan_event_attendees";

drop policy "fan_event_images public read" on "public"."fan_event_images";

drop policy "fan_events public read" on "public"."fan_events";

drop policy "Legacy moments are readable by everyone" on "public"."legacy_moments";

drop policy "Legacy players are readable by everyone" on "public"."legacy_players";

drop policy "Legacy year players are readable by everyone" on "public"."legacy_year_players";

drop policy "Legacy years are readable by everyone" on "public"."legacy_years";

drop policy "news_article_cache anon read" on "public"."news_article_cache";

drop policy "Users can view quizzes" on "public"."quizzes";


  create policy "fan_event_attendees public event read"
  on "public"."fan_event_attendees"
  as permissive
  for select
  to anon, authenticated
using ((EXISTS ( SELECT 1
   FROM public.fan_events
  WHERE ((fan_events.id = fan_event_attendees.fan_event_id) AND (fan_events.is_public = true)))));



  create policy "fan_event_images public read"
  on "public"."fan_event_images"
  as permissive
  for select
  to anon, authenticated
using ((EXISTS ( SELECT 1
   FROM public.fan_events
  WHERE ((fan_events.id = fan_event_images.fan_event_id) AND (fan_events.is_public = true)))));



  create policy "fan_events public read"
  on "public"."fan_events"
  as permissive
  for select
  to anon, authenticated
using ((is_public = true));



  create policy "Legacy moments are readable by everyone"
  on "public"."legacy_moments"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Legacy players are readable by everyone"
  on "public"."legacy_players"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Legacy year players are readable by everyone"
  on "public"."legacy_year_players"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Legacy years are readable by everyone"
  on "public"."legacy_years"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "news_article_cache anon read"
  on "public"."news_article_cache"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Users can view quizzes"
  on "public"."quizzes"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Admins can update product images"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'products'::text) AND ((auth.jwt() ->> 'user_role'::text) = 'admin'::text)));



  create policy "Admins can update products bucket"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'products'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))));



  create policy "Admins can upload product images"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'products'::text) AND ((auth.jwt() ->> 'user_role'::text) = 'admin'::text)));



  create policy "Admins can upload to products bucket"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'products'::text) AND (EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))));



  create policy "Anyone can view avatars"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Anyone can view event images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'event-images'::text));



  create policy "Public can read products bucket"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'products'::text));



  create policy "Users can delete their own event images"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'event-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can update their own avatar"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can update their own event images"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'event-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can upload their own avatar"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can upload their own event images"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'event-images'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



