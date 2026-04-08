alter table "public"."fanatic_games" alter column "end_date" set not null;

set check_function_bodies = off;

CREATE OR REPLACE PROCEDURE public.assign_fanatic_coins(IN p_game_id integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $procedure$
DECLARE
  v_profile_id UUID;
  v_answer_id INT;
  v_awarded_points INT;
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
        'Earned in fanatic game:' || p_game_id,
        v_awarded_points
      );
  END LOOP;
END;
$procedure$
;

create or replace view "public"."fanatic_game_results" as  SELECT DISTINCT ON (profile_id) game_id,
    profile_id,
    id AS answer_id,
    awarded_points AS max_points
   FROM public.fanatic_answers
  WHERE (game_id = 1)
  ORDER BY profile_id, awarded_points DESC;


CREATE OR REPLACE FUNCTION public.fanatic_time_next_game_date()
 RETURNS TABLE(next_game timestamp with time zone, active_game boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_fanatic_cron()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_job_name TEXT;
  v_cron_expr TEXT;
BEGIN
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
$function$
;

CREATE TRIGGER trg_schedule_fanatic_end_date AFTER INSERT ON public.fanatic_games FOR EACH ROW EXECUTE FUNCTION public.trigger_fanatic_cron();


