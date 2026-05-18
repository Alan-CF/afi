create schema if not exists "statistics_demo";

create extension if not exists "pg_trgm" with schema "public";

create sequence "public"."legacy_moments_id_seq";

create sequence "public"."legacy_players_id_seq";

create sequence "public"."legacy_years_id_seq";

create sequence "public"."point_events_id_seq";

create sequence "statistics_demo"."games_id_seq";

create sequence "statistics_demo"."player_stats_id_seq";

create sequence "statistics_demo"."players_id_seq";

create sequence "statistics_demo"."standings_id_seq";

drop trigger if exists "trg_delete_expired_conversations" on "public"."thunder_conversations";

drop policy "fan_event_attendees self update" on "public"."fan_event_attendees";

drop policy "fan_events organizer update" on "public"."fan_events";

drop policy "friendships_insert_own_request" on "public"."friendships";

drop policy "friendships_select_own" on "public"."friendships";

drop policy "friendships_update_participants" on "public"."friendships";

drop policy "Enable read access for all users" on "public"."profiles";

drop policy "room_members_delete_owner_only" on "public"."room_members";

drop policy "room_members_insert_owner_only" on "public"."room_members";

drop policy "room_members_select_if_same_room" on "public"."room_members";

drop policy "room_messages_insert_if_member_and_sender_is_self" on "public"."room_messages";

drop policy "room_messages_select_if_member" on "public"."room_messages";

drop policy "rooms_delete_owner_only" on "public"."rooms";

drop policy "rooms_insert_owner_only" on "public"."rooms";

drop policy "rooms_select_if_member" on "public"."rooms";

drop policy "rooms_update_owner_only" on "public"."rooms";

drop policy "Enable read access for all users" on "public"."shopping_cart_items";

alter table "public"."friendships" drop constraint "friendships_addressee_id_fkey";

alter table "public"."friendships" drop constraint "friendships_no_self";

alter table "public"."friendships" drop constraint "friendships_requester_id_fkey";

alter table "public"."friendships" drop constraint "friendships_status_check";

drop function if exists "public"."trigger_delete_expired_conversations"();

drop index if exists "public"."fan_event_attendees_event_idx";

drop index if exists "public"."fan_event_attendees_profile_idx";

drop index if exists "public"."fan_events_organizer_idx";

drop index if exists "public"."fan_events_start_at_idx";

drop index if exists "public"."friendships_addressee_idx";

drop index if exists "public"."friendships_unique_pair_idx";

drop index if exists "public"."friendships_requester_idx";


  create table "public"."domain_scans" (
    "id" uuid not null default gen_random_uuid(),
    "base_domain" text not null,
    "last_run_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."domain_scans" enable row level security;


  create table "public"."domain_variants" (
    "id" uuid not null default gen_random_uuid(),
    "scan_id" uuid not null,
    "variant_domain" text not null,
    "fuzzer" text not null default ''::text,
    "dns_a" jsonb not null default '[]'::jsonb,
    "dns_aaaa" jsonb not null default '[]'::jsonb,
    "dns_ns" jsonb not null default '[]'::jsonb,
    "dns_mx" jsonb not null default '[]'::jsonb,
    "is_registered" boolean not null default false,
    "first_seen_at" timestamp with time zone not null default now(),
    "last_seen_at" timestamp with time zone not null default now(),
    "last_dns_check_at" timestamp with time zone
      );


alter table "public"."domain_variants" enable row level security;


  create table "public"."frames" (
    "id" text not null,
    "name" text not null,
    "image_path" text not null,
    "price" bigint not null,
    "sort_order" integer not null default 0,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."frames" enable row level security;


  create table "public"."legacy_moments" (
    "id" bigint not null default nextval('public.legacy_moments_id_seq'::regclass),
    "year_id" bigint not null,
    "year" integer not null,
    "title" text not null,
    "subtitle" text,
    "description" text not null,
    "image_url" text not null,
    "cta_label" text default 'View moment'::text,
    "display_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."legacy_moments" enable row level security;


  create table "public"."legacy_players" (
    "id" bigint not null default nextval('public.legacy_players_id_seq'::regclass),
    "name" text not null,
    "role" text not null,
    "jersey_number" text,
    "bio" text not null,
    "image_url" text not null,
    "display_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."legacy_players" enable row level security;


  create table "public"."legacy_year_players" (
    "year_id" bigint not null,
    "player_id" bigint not null,
    "highlight_text" text,
    "display_order" integer not null default 0
      );


alter table "public"."legacy_year_players" enable row level security;


  create table "public"."legacy_years" (
    "id" bigint not null default nextval('public.legacy_years_id_seq'::regclass),
    "year" integer not null,
    "label" text not null,
    "title" text not null,
    "subtitle" text not null,
    "description" text not null,
    "image_url" text not null,
    "display_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."legacy_years" enable row level security;


  create table "public"."option_result_map" (
    "id" integer generated always as identity not null,
    "option_id" integer not null,
    "result_id" integer not null,
    "weight" integer not null default 1,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."option_result_map" enable row level security;


  create table "public"."owned_frames" (
    "profile_id" uuid not null,
    "frame_id" text not null,
    "purchased_at" timestamp with time zone not null default now()
      );


alter table "public"."owned_frames" enable row level security;


  create table "public"."point_events" (
    "id" integer not null default nextval('public.point_events_id_seq'::regclass),
    "key" text not null,
    "label" text not null,
    "description" text,
    "points" integer not null
      );


alter table "public"."point_events" enable row level security;


  create table "public"."point_logs" (
    "id" uuid not null default gen_random_uuid(),
    "profile_id" uuid,
    "event_key" text,
    "points" integer not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."point_logs" enable row level security;


  create table "public"."quiz_attempt_answers" (
    "id" integer generated always as identity not null,
    "attempt_id" integer not null,
    "question_id" integer not null,
    "option_id" integer not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."quiz_attempt_answers" enable row level security;


  create table "public"."quiz_attempts" (
    "id" integer generated always as identity not null,
    "profile_id" uuid not null,
    "quiz_id" integer not null,
    "result_id" integer,
    "status" text not null default 'in_progress'::text,
    "started_at" timestamp with time zone not null default now(),
    "completed_at" timestamp with time zone,
    "available_again_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."quiz_attempts" enable row level security;


  create table "public"."quiz_options" (
    "id" integer generated always as identity not null,
    "question_id" integer not null,
    "option_text" text not null,
    "image_url" text,
    "option_order" integer not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."quiz_options" enable row level security;


  create table "public"."quiz_questions" (
    "id" integer generated always as identity not null,
    "quiz_id" integer not null,
    "question_text" text not null,
    "question_order" integer not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."quiz_questions" enable row level security;


  create table "public"."quiz_results" (
    "id" integer generated always as identity not null,
    "quiz_id" integer not null,
    "title" text not null,
    "subtitle" text,
    "description" text not null,
    "image_url" text,
    "priority" integer not null default 0,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."quiz_results" enable row level security;


  create table "public"."quizzes" (
    "id" integer generated always as identity not null,
    "title" text not null,
    "description" text not null,
    "image_url" text,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."quizzes" enable row level security;


  create table "public"."secondary_product_images" (
    "id" bigint generated by default as identity not null,
    "product_id" bigint not null,
    "image_url" text,
    "priority" smallint not null
      );


alter table "public"."secondary_product_images" enable row level security;


  create table "statistics_demo"."games" (
    "id" integer not null default nextval('statistics_demo.games_id_seq'::regclass),
    "game_date" date not null,
    "opponent" text not null,
    "is_home" boolean not null,
    "warriors_score" integer,
    "opponent_score" integer,
    "status" text not null
      );



  create table "statistics_demo"."player_stats" (
    "id" integer not null default nextval('statistics_demo.player_stats_id_seq'::regclass),
    "player_id" integer,
    "pts" numeric(4,1),
    "reb" numeric(4,1),
    "ast" numeric(4,1),
    "games_played" integer
      );



  create table "statistics_demo"."players" (
    "id" integer not null default nextval('statistics_demo.players_id_seq'::regclass),
    "first_name" text not null,
    "last_name" text not null,
    "position" text,
    "jersey_number" integer
      );



  create table "statistics_demo"."standings" (
    "id" integer not null default nextval('statistics_demo.standings_id_seq'::regclass),
    "team_name" text not null,
    "division" text not null,
    "wins" integer not null,
    "losses" integer not null,
    "conference" text not null
      );


alter table "public"."friendships" drop column "addressee_id";

alter table "public"."friendships" drop column "requester_id";

alter table "public"."friendships" drop column "responded_at";

alter table "public"."friendships" add column "receiver_profile_id" uuid not null;

alter table "public"."friendships" add column "requester_profile_id" uuid not null;

alter table "public"."friendships" add column "updated_at" timestamp with time zone not null default now();

alter table "public"."friendships" alter column "id" drop identity if exists;

alter table "public"."friendships" alter column "id" set data type uuid using gen_random_uuid();

alter table "public"."friendships" alter column "id" set default gen_random_uuid();

alter table "public"."friendships" alter column "status" set default 'pending'::text;

alter table "public"."product_catalog" drop column "stock";

alter table "public"."profiles" add column "caption" text;

alter table "public"."profiles" add column "e_coins" bigint not null default 0;

alter table "public"."profiles" add column "last_login" date;

alter table "public"."profiles" add column "name" text;

alter table "public"."profiles" add column "selected_frame_id" text;

alter table "public"."profiles" add column "streak" integer default 0;

alter table "public"."shopping_cart_items" add column "product_details" jsonb not null default '{}'::jsonb;

alter sequence "public"."legacy_moments_id_seq" owned by "public"."legacy_moments"."id";

alter sequence "public"."legacy_players_id_seq" owned by "public"."legacy_players"."id";

alter sequence "public"."legacy_years_id_seq" owned by "public"."legacy_years"."id";

alter sequence "public"."point_events_id_seq" owned by "public"."point_events"."id";

alter sequence "statistics_demo"."games_id_seq" owned by "statistics_demo"."games"."id";

alter sequence "statistics_demo"."player_stats_id_seq" owned by "statistics_demo"."player_stats"."id";

alter sequence "statistics_demo"."players_id_seq" owned by "statistics_demo"."players"."id";

alter sequence "statistics_demo"."standings_id_seq" owned by "statistics_demo"."standings"."id";

CREATE UNIQUE INDEX domain_scans_base_domain_key ON public.domain_scans USING btree (base_domain);

CREATE UNIQUE INDEX domain_scans_pkey ON public.domain_scans USING btree (id);

CREATE UNIQUE INDEX domain_variants_pkey ON public.domain_variants USING btree (id);

CREATE UNIQUE INDEX frames_pkey ON public.frames USING btree (id);

CREATE INDEX friendships_receiver_idx ON public.friendships USING btree (receiver_profile_id);

CREATE INDEX friendships_status_idx ON public.friendships USING btree (status);

CREATE UNIQUE INDEX friendships_unique_active_pair ON public.friendships USING btree (LEAST((requester_profile_id)::text, (receiver_profile_id)::text), GREATEST((requester_profile_id)::text, (receiver_profile_id)::text)) WHERE (status = ANY (ARRAY['pending'::text, 'accepted'::text]));

CREATE INDEX idx_domain_scans_base_domain ON public.domain_scans USING btree (base_domain);

CREATE INDEX idx_domain_variants_registered ON public.domain_variants USING btree (scan_id, is_registered);

CREATE INDEX idx_domain_variants_scan_id ON public.domain_variants USING btree (scan_id);

CREATE INDEX idx_legacy_moments_year_id ON public.legacy_moments USING btree (year_id);

CREATE INDEX idx_legacy_year_players_player_id ON public.legacy_year_players USING btree (player_id);

CREATE INDEX idx_legacy_year_players_year_id ON public.legacy_year_players USING btree (year_id);

CREATE INDEX idx_option_result_map_option_id ON public.option_result_map USING btree (option_id);

CREATE INDEX idx_option_result_map_result_id ON public.option_result_map USING btree (result_id);

CREATE INDEX idx_quiz_attempt_answers_attempt_id ON public.quiz_attempt_answers USING btree (attempt_id);

CREATE INDEX idx_quiz_attempt_answers_option_id ON public.quiz_attempt_answers USING btree (option_id);

CREATE INDEX idx_quiz_attempt_answers_question_id ON public.quiz_attempt_answers USING btree (question_id);

CREATE INDEX idx_quiz_attempts_available_again_at ON public.quiz_attempts USING btree (available_again_at);

CREATE INDEX idx_quiz_attempts_profile_id ON public.quiz_attempts USING btree (profile_id);

CREATE INDEX idx_quiz_attempts_quiz_id ON public.quiz_attempts USING btree (quiz_id);

CREATE INDEX idx_quiz_options_question_id ON public.quiz_options USING btree (question_id);

CREATE INDEX idx_quiz_questions_quiz_id ON public.quiz_questions USING btree (quiz_id);

CREATE INDEX idx_quiz_results_quiz_id ON public.quiz_results USING btree (quiz_id);

CREATE UNIQUE INDEX legacy_moments_pkey ON public.legacy_moments USING btree (id);

CREATE UNIQUE INDEX legacy_players_name_key ON public.legacy_players USING btree (name);

CREATE UNIQUE INDEX legacy_players_pkey ON public.legacy_players USING btree (id);

CREATE UNIQUE INDEX legacy_year_players_pkey ON public.legacy_year_players USING btree (year_id, player_id);

CREATE UNIQUE INDEX legacy_years_pkey ON public.legacy_years USING btree (id);

CREATE UNIQUE INDEX legacy_years_year_key ON public.legacy_years USING btree (year);

CREATE UNIQUE INDEX option_result_map_pkey ON public.option_result_map USING btree (id);

CREATE UNIQUE INDEX owned_frames_pkey ON public.owned_frames USING btree (profile_id, frame_id);

CREATE INDEX owned_frames_profile_id_idx ON public.owned_frames USING btree (profile_id);

CREATE UNIQUE INDEX point_events_key_key ON public.point_events USING btree (key);

CREATE UNIQUE INDEX point_events_pkey ON public.point_events USING btree (key);

CREATE UNIQUE INDEX point_logs_pkey ON public.point_logs USING btree (id);

CREATE UNIQUE INDEX product_images_pkey ON public.secondary_product_images USING btree (id);

CREATE INDEX profiles_username_trgm_idx ON public.profiles USING gin (username public.gin_trgm_ops);

CREATE UNIQUE INDEX quiz_attempt_answers_pkey ON public.quiz_attempt_answers USING btree (id);

CREATE UNIQUE INDEX quiz_attempts_pkey ON public.quiz_attempts USING btree (id);

CREATE UNIQUE INDEX quiz_options_pkey ON public.quiz_options USING btree (id);

CREATE UNIQUE INDEX quiz_questions_pkey ON public.quiz_questions USING btree (id);

CREATE UNIQUE INDEX quiz_results_pkey ON public.quiz_results USING btree (id);

CREATE UNIQUE INDEX quizzes_pkey ON public.quizzes USING btree (id);

CREATE UNIQUE INDEX uq_domain_variants ON public.domain_variants USING btree (scan_id, variant_domain);

CREATE UNIQUE INDEX uq_option_result_map_unique ON public.option_result_map USING btree (option_id, result_id);

CREATE UNIQUE INDEX uq_quiz_attempt_answers_attempt_question ON public.quiz_attempt_answers USING btree (attempt_id, question_id);

CREATE UNIQUE INDEX uq_quiz_options_order ON public.quiz_options USING btree (question_id, option_order);

CREATE UNIQUE INDEX uq_quiz_questions_order ON public.quiz_questions USING btree (quiz_id, question_order);

CREATE UNIQUE INDEX games_pkey ON statistics_demo.games USING btree (id);

CREATE UNIQUE INDEX player_stats_pkey ON statistics_demo.player_stats USING btree (id);

CREATE UNIQUE INDEX players_pkey ON statistics_demo.players USING btree (id);

CREATE UNIQUE INDEX standings_pkey ON statistics_demo.standings USING btree (id);

CREATE INDEX friendships_requester_idx ON public.friendships USING btree (requester_profile_id);

alter table "public"."domain_scans" add constraint "domain_scans_pkey" PRIMARY KEY using index "domain_scans_pkey";

alter table "public"."domain_variants" add constraint "domain_variants_pkey" PRIMARY KEY using index "domain_variants_pkey";

alter table "public"."frames" add constraint "frames_pkey" PRIMARY KEY using index "frames_pkey";

alter table "public"."legacy_moments" add constraint "legacy_moments_pkey" PRIMARY KEY using index "legacy_moments_pkey";

alter table "public"."legacy_players" add constraint "legacy_players_pkey" PRIMARY KEY using index "legacy_players_pkey";

alter table "public"."legacy_year_players" add constraint "legacy_year_players_pkey" PRIMARY KEY using index "legacy_year_players_pkey";

alter table "public"."legacy_years" add constraint "legacy_years_pkey" PRIMARY KEY using index "legacy_years_pkey";

alter table "public"."option_result_map" add constraint "option_result_map_pkey" PRIMARY KEY using index "option_result_map_pkey";

alter table "public"."owned_frames" add constraint "owned_frames_pkey" PRIMARY KEY using index "owned_frames_pkey";

alter table "public"."point_events" add constraint "point_events_pkey" PRIMARY KEY using index "point_events_pkey";

alter table "public"."point_logs" add constraint "point_logs_pkey" PRIMARY KEY using index "point_logs_pkey";

alter table "public"."quiz_attempt_answers" add constraint "quiz_attempt_answers_pkey" PRIMARY KEY using index "quiz_attempt_answers_pkey";

alter table "public"."quiz_attempts" add constraint "quiz_attempts_pkey" PRIMARY KEY using index "quiz_attempts_pkey";

alter table "public"."quiz_options" add constraint "quiz_options_pkey" PRIMARY KEY using index "quiz_options_pkey";

alter table "public"."quiz_questions" add constraint "quiz_questions_pkey" PRIMARY KEY using index "quiz_questions_pkey";

alter table "public"."quiz_results" add constraint "quiz_results_pkey" PRIMARY KEY using index "quiz_results_pkey";

alter table "public"."quizzes" add constraint "quizzes_pkey" PRIMARY KEY using index "quizzes_pkey";

alter table "public"."secondary_product_images" add constraint "product_images_pkey" PRIMARY KEY using index "product_images_pkey";

alter table "statistics_demo"."games" add constraint "games_pkey" PRIMARY KEY using index "games_pkey";

alter table "statistics_demo"."player_stats" add constraint "player_stats_pkey" PRIMARY KEY using index "player_stats_pkey";

alter table "statistics_demo"."players" add constraint "players_pkey" PRIMARY KEY using index "players_pkey";

alter table "statistics_demo"."standings" add constraint "standings_pkey" PRIMARY KEY using index "standings_pkey";

alter table "public"."domain_scans" add constraint "domain_scans_base_domain_key" UNIQUE using index "domain_scans_base_domain_key";

alter table "public"."domain_variants" add constraint "domain_variants_scan_id_fkey" FOREIGN KEY (scan_id) REFERENCES public.domain_scans(id) ON DELETE CASCADE not valid;

alter table "public"."domain_variants" validate constraint "domain_variants_scan_id_fkey";

alter table "public"."domain_variants" add constraint "uq_domain_variants" UNIQUE using index "uq_domain_variants";

alter table "public"."frames" add constraint "frames_price_check" CHECK ((price >= 0)) not valid;

alter table "public"."frames" validate constraint "frames_price_check";

alter table "public"."friendships" add constraint "friendships_no_self_invite" CHECK ((requester_profile_id <> receiver_profile_id)) not valid;

alter table "public"."friendships" validate constraint "friendships_no_self_invite";

alter table "public"."friendships" add constraint "friendships_receiver_profile_id_fkey" FOREIGN KEY (receiver_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."friendships" validate constraint "friendships_receiver_profile_id_fkey";

alter table "public"."friendships" add constraint "friendships_requester_profile_id_fkey" FOREIGN KEY (requester_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."friendships" validate constraint "friendships_requester_profile_id_fkey";

alter table "public"."legacy_moments" add constraint "legacy_moments_year_id_fkey" FOREIGN KEY (year_id) REFERENCES public.legacy_years(id) ON DELETE CASCADE not valid;

alter table "public"."legacy_moments" validate constraint "legacy_moments_year_id_fkey";

alter table "public"."legacy_players" add constraint "legacy_players_name_key" UNIQUE using index "legacy_players_name_key";

alter table "public"."legacy_year_players" add constraint "legacy_year_players_player_id_fkey" FOREIGN KEY (player_id) REFERENCES public.legacy_players(id) ON DELETE CASCADE not valid;

alter table "public"."legacy_year_players" validate constraint "legacy_year_players_player_id_fkey";

alter table "public"."legacy_year_players" add constraint "legacy_year_players_year_id_fkey" FOREIGN KEY (year_id) REFERENCES public.legacy_years(id) ON DELETE CASCADE not valid;

alter table "public"."legacy_year_players" validate constraint "legacy_year_players_year_id_fkey";

alter table "public"."legacy_years" add constraint "legacy_years_year_key" UNIQUE using index "legacy_years_year_key";

alter table "public"."option_result_map" add constraint "chk_option_result_map_weight" CHECK ((weight > 0)) not valid;

alter table "public"."option_result_map" validate constraint "chk_option_result_map_weight";

alter table "public"."option_result_map" add constraint "fk_option_result_map_option" FOREIGN KEY (option_id) REFERENCES public.quiz_options(id) ON DELETE CASCADE not valid;

alter table "public"."option_result_map" validate constraint "fk_option_result_map_option";

alter table "public"."option_result_map" add constraint "fk_option_result_map_result" FOREIGN KEY (result_id) REFERENCES public.quiz_results(id) ON DELETE CASCADE not valid;

alter table "public"."option_result_map" validate constraint "fk_option_result_map_result";

alter table "public"."option_result_map" add constraint "uq_option_result_map_unique" UNIQUE using index "uq_option_result_map_unique";

alter table "public"."owned_frames" add constraint "owned_frames_frame_id_fkey" FOREIGN KEY (frame_id) REFERENCES public.frames(id) ON DELETE CASCADE not valid;

alter table "public"."owned_frames" validate constraint "owned_frames_frame_id_fkey";

alter table "public"."owned_frames" add constraint "owned_frames_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."owned_frames" validate constraint "owned_frames_profile_id_fkey";

alter table "public"."point_events" add constraint "point_events_key_key" UNIQUE using index "point_events_key_key";

alter table "public"."point_logs" add constraint "point_logs_event_key_fkey" FOREIGN KEY (event_key) REFERENCES public.point_events(key) not valid;

alter table "public"."point_logs" validate constraint "point_logs_event_key_fkey";

alter table "public"."point_logs" add constraint "point_logs_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."point_logs" validate constraint "point_logs_profile_id_fkey";

alter table "public"."profiles" add constraint "profiles_selected_frame_id_fkey" FOREIGN KEY (selected_frame_id) REFERENCES public.frames(id) ON DELETE SET NULL not valid;

alter table "public"."profiles" validate constraint "profiles_selected_frame_id_fkey";

alter table "public"."quiz_attempt_answers" add constraint "fk_quiz_attempt_answers_attempt" FOREIGN KEY (attempt_id) REFERENCES public.quiz_attempts(id) ON DELETE CASCADE not valid;

alter table "public"."quiz_attempt_answers" validate constraint "fk_quiz_attempt_answers_attempt";

alter table "public"."quiz_attempt_answers" add constraint "fk_quiz_attempt_answers_option" FOREIGN KEY (option_id) REFERENCES public.quiz_options(id) ON DELETE CASCADE not valid;

alter table "public"."quiz_attempt_answers" validate constraint "fk_quiz_attempt_answers_option";

alter table "public"."quiz_attempt_answers" add constraint "fk_quiz_attempt_answers_question" FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id) ON DELETE CASCADE not valid;

alter table "public"."quiz_attempt_answers" validate constraint "fk_quiz_attempt_answers_question";

alter table "public"."quiz_attempt_answers" add constraint "uq_quiz_attempt_answers_attempt_question" UNIQUE using index "uq_quiz_attempt_answers_attempt_question";

alter table "public"."quiz_attempts" add constraint "chk_quiz_attempts_status" CHECK ((status = ANY (ARRAY['in_progress'::text, 'completed'::text]))) not valid;

alter table "public"."quiz_attempts" validate constraint "chk_quiz_attempts_status";

alter table "public"."quiz_attempts" add constraint "fk_quiz_attempts_quiz" FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE not valid;

alter table "public"."quiz_attempts" validate constraint "fk_quiz_attempts_quiz";

alter table "public"."quiz_attempts" add constraint "fk_quiz_attempts_result" FOREIGN KEY (result_id) REFERENCES public.quiz_results(id) ON DELETE SET NULL not valid;

alter table "public"."quiz_attempts" validate constraint "fk_quiz_attempts_result";

alter table "public"."quiz_attempts" add constraint "quiz_attempts_profile_id_fkey" FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."quiz_attempts" validate constraint "quiz_attempts_profile_id_fkey";

alter table "public"."quiz_options" add constraint "chk_quiz_options_order" CHECK ((option_order > 0)) not valid;

alter table "public"."quiz_options" validate constraint "chk_quiz_options_order";

alter table "public"."quiz_options" add constraint "fk_quiz_options_question" FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id) ON DELETE CASCADE not valid;

alter table "public"."quiz_options" validate constraint "fk_quiz_options_question";

alter table "public"."quiz_options" add constraint "uq_quiz_options_order" UNIQUE using index "uq_quiz_options_order";

alter table "public"."quiz_questions" add constraint "chk_quiz_questions_order" CHECK ((question_order > 0)) not valid;

alter table "public"."quiz_questions" validate constraint "chk_quiz_questions_order";

alter table "public"."quiz_questions" add constraint "fk_quiz_questions_quiz" FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE not valid;

alter table "public"."quiz_questions" validate constraint "fk_quiz_questions_quiz";

alter table "public"."quiz_questions" add constraint "uq_quiz_questions_order" UNIQUE using index "uq_quiz_questions_order";

alter table "public"."quiz_results" add constraint "fk_quiz_results_quiz" FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE not valid;

alter table "public"."quiz_results" validate constraint "fk_quiz_results_quiz";

alter table "public"."secondary_product_images" add constraint "product_images_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.product_catalog(id) not valid;

alter table "public"."secondary_product_images" validate constraint "product_images_product_id_fkey";

alter table "public"."secondary_product_images" add constraint "secondary_product_images_priority_check" CHECK ((priority > 1)) not valid;

alter table "public"."secondary_product_images" validate constraint "secondary_product_images_priority_check";

alter table "statistics_demo"."player_stats" add constraint "player_stats_player_id_fkey" FOREIGN KEY (player_id) REFERENCES statistics_demo.players(id) not valid;

alter table "statistics_demo"."player_stats" validate constraint "player_stats_player_id_fkey";

alter table "public"."friendships" add constraint "friendships_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text]))) not valid;

alter table "public"."friendships" validate constraint "friendships_status_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_item_to_cart(p_profile_id uuid, p_priced_product_id integer, p_product_details jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.award_points(p_profile_id uuid, p_event_key text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_cart(p_profile_id uuid)
 RETURNS TABLE(id integer, product_name text, product_description text, is_active boolean, price numeric, discount numeric, product_details jsonb, image_url text)
 LANGUAGE sql
 STABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_cart_item(p_profile_id uuid, p_cart_item_id integer)
 RETURNS TABLE(id integer, product_name text, product_description text, is_active boolean, price numeric, discount numeric, product_details jsonb, image_url text)
 LANGUAGE sql
 STABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_detailed_priced_product(p_id integer)
 RETURNS TABLE(id integer, name text, description text, main_image_url text, secondary_images_url text, image_priority integer, product_details jsonb, price numeric, discount numeric)
 LANGUAGE sql
AS $function$
select
    pp.id,
    pc.name,
    pc.description,
    pc.image_url          as main_image_url,
    pi.image_url          as secondary_images_url,
    pi.priority           as image_priority,
    pc.product_details,
    pp.price,
    pp.discount
from
    product_catalog pc
    join product_pricing pp on pp.product_id = pc.id
    left join secondary_product_images pi on pc.id = pi.product_id
where pp.id = p_id;
$function$
;

CREATE OR REPLACE FUNCTION public.get_priced_products(p_search_query character varying, p_filters jsonb)
 RETURNS TABLE(id bigint, name character varying, description text, price double precision, discount double precision, is_active boolean, image_url text, meta_data jsonb)
 LANGUAGE plpgsql
AS $function$
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
    JOIN product_catalog pc 
        ON pc.id = pp.product_id
    WHERE
        -- Search condition
        (
            p_search_query IS NULL
            OR p_search_query = ''
            OR pc.name ILIKE '%' || p_search_query || '%'
        )
        -- Dynamic JSON filters
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_priced_products_by_id(p_ids integer[])
 RETURNS TABLE(id integer, name text, description text, price numeric, discount numeric, is_active boolean, stock integer, image_url text, product_details jsonb, meta_data jsonb)
 LANGUAGE sql
AS $function$
  SELECT
    pp.id,
    pc.name,
    pc.description,
    pp.price,
    pp.discount,
    pc.is_active,
    pc.stock,
    pc.image_url,
    pc.product_details,
    pc.meta_data
  FROM product_pricing pp
  JOIN product_catalog pc
    ON pc.id = pp.product_id
  WHERE pp.id = ANY(p_ids);
$function$
;

CREATE OR REPLACE FUNCTION public.get_product_filters()
 RETURNS jsonb
 LANGUAGE sql
AS $function$ 
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    new.id,
    split_part(new.email, '@', 1)
  );
  RETURN new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_member_of_room(target_room_id bigint)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.room_members rm
    where rm.room_id = target_room_id
      and rm.profile_id = auth.uid()
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_owner_of_room(target_room_id bigint)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.rooms r
    where r.id = target_room_id
      and r.owner_profile_id = auth.uid()
  );
$function$
;

CREATE OR REPLACE FUNCTION public.purchase_frame(p_frame_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.remove_item_from_active_cart(p_profile_id uuid, p_cart_item_id integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.select_frame(p_frame_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(p_quiz_id integer, p_answers jsonb)
 RETURNS TABLE(result_id integer, title text, subtitle text, description text, image_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_sync_ecoins()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.fanatic_coins > coalesce(old.fanatic_coins, 0) then
    new.e_coins := coalesce(old.e_coins, 0) + (new.fanatic_coins - coalesce(old.fanatic_coins, 0));
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_cart_item_details(p_profile_id uuid, p_cart_item_id integer, p_product_details jsonb)
 RETURNS void
 LANGUAGE sql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_login_streak(user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE PROCEDURE public.assign_fanatic_coins(IN p_game_id integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $procedure$
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
$procedure$
;

CREATE OR REPLACE FUNCTION public.fan_event_going_count(p_event_id bigint)
 RETURNS integer
 LANGUAGE sql
 STABLE
AS $function$
  select count(*)::int from public.fan_event_attendees
  where fan_event_id = p_event_id and status = 'going';
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_create_profile()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_generated_user TEXT;
BEGIN
    v_generated_user := 'user_' || SUBSTR(MD5(NEW.id::TEXT), 1, 8);

    INSERT INTO public.profiles (id, username, name)
    VALUES (
        NEW.id,
        v_generated_user,
        v_generated_user
    );
    
    RETURN NEW; 
END;
$function$
;

grant delete on table "public"."domain_scans" to "anon";

grant insert on table "public"."domain_scans" to "anon";

grant references on table "public"."domain_scans" to "anon";

grant select on table "public"."domain_scans" to "anon";

grant trigger on table "public"."domain_scans" to "anon";

grant truncate on table "public"."domain_scans" to "anon";

grant update on table "public"."domain_scans" to "anon";

grant delete on table "public"."domain_scans" to "authenticated";

grant insert on table "public"."domain_scans" to "authenticated";

grant references on table "public"."domain_scans" to "authenticated";

grant select on table "public"."domain_scans" to "authenticated";

grant trigger on table "public"."domain_scans" to "authenticated";

grant truncate on table "public"."domain_scans" to "authenticated";

grant update on table "public"."domain_scans" to "authenticated";

grant delete on table "public"."domain_scans" to "service_role";

grant insert on table "public"."domain_scans" to "service_role";

grant references on table "public"."domain_scans" to "service_role";

grant select on table "public"."domain_scans" to "service_role";

grant trigger on table "public"."domain_scans" to "service_role";

grant truncate on table "public"."domain_scans" to "service_role";

grant update on table "public"."domain_scans" to "service_role";

grant delete on table "public"."domain_variants" to "anon";

grant insert on table "public"."domain_variants" to "anon";

grant references on table "public"."domain_variants" to "anon";

grant select on table "public"."domain_variants" to "anon";

grant trigger on table "public"."domain_variants" to "anon";

grant truncate on table "public"."domain_variants" to "anon";

grant update on table "public"."domain_variants" to "anon";

grant delete on table "public"."domain_variants" to "authenticated";

grant insert on table "public"."domain_variants" to "authenticated";

grant references on table "public"."domain_variants" to "authenticated";

grant select on table "public"."domain_variants" to "authenticated";

grant trigger on table "public"."domain_variants" to "authenticated";

grant truncate on table "public"."domain_variants" to "authenticated";

grant update on table "public"."domain_variants" to "authenticated";

grant delete on table "public"."domain_variants" to "service_role";

grant insert on table "public"."domain_variants" to "service_role";

grant references on table "public"."domain_variants" to "service_role";

grant select on table "public"."domain_variants" to "service_role";

grant trigger on table "public"."domain_variants" to "service_role";

grant truncate on table "public"."domain_variants" to "service_role";

grant update on table "public"."domain_variants" to "service_role";

grant delete on table "public"."frames" to "anon";

grant insert on table "public"."frames" to "anon";

grant references on table "public"."frames" to "anon";

grant select on table "public"."frames" to "anon";

grant trigger on table "public"."frames" to "anon";

grant truncate on table "public"."frames" to "anon";

grant update on table "public"."frames" to "anon";

grant delete on table "public"."frames" to "authenticated";

grant insert on table "public"."frames" to "authenticated";

grant references on table "public"."frames" to "authenticated";

grant select on table "public"."frames" to "authenticated";

grant trigger on table "public"."frames" to "authenticated";

grant truncate on table "public"."frames" to "authenticated";

grant update on table "public"."frames" to "authenticated";

grant delete on table "public"."frames" to "service_role";

grant insert on table "public"."frames" to "service_role";

grant references on table "public"."frames" to "service_role";

grant select on table "public"."frames" to "service_role";

grant trigger on table "public"."frames" to "service_role";

grant truncate on table "public"."frames" to "service_role";

grant update on table "public"."frames" to "service_role";

grant delete on table "public"."legacy_moments" to "anon";

grant insert on table "public"."legacy_moments" to "anon";

grant references on table "public"."legacy_moments" to "anon";

grant select on table "public"."legacy_moments" to "anon";

grant trigger on table "public"."legacy_moments" to "anon";

grant truncate on table "public"."legacy_moments" to "anon";

grant update on table "public"."legacy_moments" to "anon";

grant delete on table "public"."legacy_moments" to "authenticated";

grant insert on table "public"."legacy_moments" to "authenticated";

grant references on table "public"."legacy_moments" to "authenticated";

grant select on table "public"."legacy_moments" to "authenticated";

grant trigger on table "public"."legacy_moments" to "authenticated";

grant truncate on table "public"."legacy_moments" to "authenticated";

grant update on table "public"."legacy_moments" to "authenticated";

grant delete on table "public"."legacy_moments" to "service_role";

grant insert on table "public"."legacy_moments" to "service_role";

grant references on table "public"."legacy_moments" to "service_role";

grant select on table "public"."legacy_moments" to "service_role";

grant trigger on table "public"."legacy_moments" to "service_role";

grant truncate on table "public"."legacy_moments" to "service_role";

grant update on table "public"."legacy_moments" to "service_role";

grant delete on table "public"."legacy_players" to "anon";

grant insert on table "public"."legacy_players" to "anon";

grant references on table "public"."legacy_players" to "anon";

grant select on table "public"."legacy_players" to "anon";

grant trigger on table "public"."legacy_players" to "anon";

grant truncate on table "public"."legacy_players" to "anon";

grant update on table "public"."legacy_players" to "anon";

grant delete on table "public"."legacy_players" to "authenticated";

grant insert on table "public"."legacy_players" to "authenticated";

grant references on table "public"."legacy_players" to "authenticated";

grant select on table "public"."legacy_players" to "authenticated";

grant trigger on table "public"."legacy_players" to "authenticated";

grant truncate on table "public"."legacy_players" to "authenticated";

grant update on table "public"."legacy_players" to "authenticated";

grant delete on table "public"."legacy_players" to "service_role";

grant insert on table "public"."legacy_players" to "service_role";

grant references on table "public"."legacy_players" to "service_role";

grant select on table "public"."legacy_players" to "service_role";

grant trigger on table "public"."legacy_players" to "service_role";

grant truncate on table "public"."legacy_players" to "service_role";

grant update on table "public"."legacy_players" to "service_role";

grant delete on table "public"."legacy_year_players" to "anon";

grant insert on table "public"."legacy_year_players" to "anon";

grant references on table "public"."legacy_year_players" to "anon";

grant select on table "public"."legacy_year_players" to "anon";

grant trigger on table "public"."legacy_year_players" to "anon";

grant truncate on table "public"."legacy_year_players" to "anon";

grant update on table "public"."legacy_year_players" to "anon";

grant delete on table "public"."legacy_year_players" to "authenticated";

grant insert on table "public"."legacy_year_players" to "authenticated";

grant references on table "public"."legacy_year_players" to "authenticated";

grant select on table "public"."legacy_year_players" to "authenticated";

grant trigger on table "public"."legacy_year_players" to "authenticated";

grant truncate on table "public"."legacy_year_players" to "authenticated";

grant update on table "public"."legacy_year_players" to "authenticated";

grant delete on table "public"."legacy_year_players" to "service_role";

grant insert on table "public"."legacy_year_players" to "service_role";

grant references on table "public"."legacy_year_players" to "service_role";

grant select on table "public"."legacy_year_players" to "service_role";

grant trigger on table "public"."legacy_year_players" to "service_role";

grant truncate on table "public"."legacy_year_players" to "service_role";

grant update on table "public"."legacy_year_players" to "service_role";

grant delete on table "public"."legacy_years" to "anon";

grant insert on table "public"."legacy_years" to "anon";

grant references on table "public"."legacy_years" to "anon";

grant select on table "public"."legacy_years" to "anon";

grant trigger on table "public"."legacy_years" to "anon";

grant truncate on table "public"."legacy_years" to "anon";

grant update on table "public"."legacy_years" to "anon";

grant delete on table "public"."legacy_years" to "authenticated";

grant insert on table "public"."legacy_years" to "authenticated";

grant references on table "public"."legacy_years" to "authenticated";

grant select on table "public"."legacy_years" to "authenticated";

grant trigger on table "public"."legacy_years" to "authenticated";

grant truncate on table "public"."legacy_years" to "authenticated";

grant update on table "public"."legacy_years" to "authenticated";

grant delete on table "public"."legacy_years" to "service_role";

grant insert on table "public"."legacy_years" to "service_role";

grant references on table "public"."legacy_years" to "service_role";

grant select on table "public"."legacy_years" to "service_role";

grant trigger on table "public"."legacy_years" to "service_role";

grant truncate on table "public"."legacy_years" to "service_role";

grant update on table "public"."legacy_years" to "service_role";

grant delete on table "public"."option_result_map" to "anon";

grant insert on table "public"."option_result_map" to "anon";

grant references on table "public"."option_result_map" to "anon";

grant select on table "public"."option_result_map" to "anon";

grant trigger on table "public"."option_result_map" to "anon";

grant truncate on table "public"."option_result_map" to "anon";

grant update on table "public"."option_result_map" to "anon";

grant delete on table "public"."option_result_map" to "authenticated";

grant insert on table "public"."option_result_map" to "authenticated";

grant references on table "public"."option_result_map" to "authenticated";

grant select on table "public"."option_result_map" to "authenticated";

grant trigger on table "public"."option_result_map" to "authenticated";

grant truncate on table "public"."option_result_map" to "authenticated";

grant update on table "public"."option_result_map" to "authenticated";

grant delete on table "public"."option_result_map" to "service_role";

grant insert on table "public"."option_result_map" to "service_role";

grant references on table "public"."option_result_map" to "service_role";

grant select on table "public"."option_result_map" to "service_role";

grant trigger on table "public"."option_result_map" to "service_role";

grant truncate on table "public"."option_result_map" to "service_role";

grant update on table "public"."option_result_map" to "service_role";

grant delete on table "public"."owned_frames" to "anon";

grant insert on table "public"."owned_frames" to "anon";

grant references on table "public"."owned_frames" to "anon";

grant select on table "public"."owned_frames" to "anon";

grant trigger on table "public"."owned_frames" to "anon";

grant truncate on table "public"."owned_frames" to "anon";

grant update on table "public"."owned_frames" to "anon";

grant delete on table "public"."owned_frames" to "authenticated";

grant insert on table "public"."owned_frames" to "authenticated";

grant references on table "public"."owned_frames" to "authenticated";

grant select on table "public"."owned_frames" to "authenticated";

grant trigger on table "public"."owned_frames" to "authenticated";

grant truncate on table "public"."owned_frames" to "authenticated";

grant update on table "public"."owned_frames" to "authenticated";

grant delete on table "public"."owned_frames" to "service_role";

grant insert on table "public"."owned_frames" to "service_role";

grant references on table "public"."owned_frames" to "service_role";

grant select on table "public"."owned_frames" to "service_role";

grant trigger on table "public"."owned_frames" to "service_role";

grant truncate on table "public"."owned_frames" to "service_role";

grant update on table "public"."owned_frames" to "service_role";

grant delete on table "public"."point_events" to "anon";

grant insert on table "public"."point_events" to "anon";

grant references on table "public"."point_events" to "anon";

grant select on table "public"."point_events" to "anon";

grant trigger on table "public"."point_events" to "anon";

grant truncate on table "public"."point_events" to "anon";

grant update on table "public"."point_events" to "anon";

grant delete on table "public"."point_events" to "authenticated";

grant insert on table "public"."point_events" to "authenticated";

grant references on table "public"."point_events" to "authenticated";

grant select on table "public"."point_events" to "authenticated";

grant trigger on table "public"."point_events" to "authenticated";

grant truncate on table "public"."point_events" to "authenticated";

grant update on table "public"."point_events" to "authenticated";

grant delete on table "public"."point_events" to "service_role";

grant insert on table "public"."point_events" to "service_role";

grant references on table "public"."point_events" to "service_role";

grant select on table "public"."point_events" to "service_role";

grant trigger on table "public"."point_events" to "service_role";

grant truncate on table "public"."point_events" to "service_role";

grant update on table "public"."point_events" to "service_role";

grant delete on table "public"."point_logs" to "anon";

grant insert on table "public"."point_logs" to "anon";

grant references on table "public"."point_logs" to "anon";

grant select on table "public"."point_logs" to "anon";

grant trigger on table "public"."point_logs" to "anon";

grant truncate on table "public"."point_logs" to "anon";

grant update on table "public"."point_logs" to "anon";

grant delete on table "public"."point_logs" to "authenticated";

grant insert on table "public"."point_logs" to "authenticated";

grant references on table "public"."point_logs" to "authenticated";

grant select on table "public"."point_logs" to "authenticated";

grant trigger on table "public"."point_logs" to "authenticated";

grant truncate on table "public"."point_logs" to "authenticated";

grant update on table "public"."point_logs" to "authenticated";

grant delete on table "public"."point_logs" to "service_role";

grant insert on table "public"."point_logs" to "service_role";

grant references on table "public"."point_logs" to "service_role";

grant select on table "public"."point_logs" to "service_role";

grant trigger on table "public"."point_logs" to "service_role";

grant truncate on table "public"."point_logs" to "service_role";

grant update on table "public"."point_logs" to "service_role";

grant delete on table "public"."quiz_attempt_answers" to "anon";

grant insert on table "public"."quiz_attempt_answers" to "anon";

grant references on table "public"."quiz_attempt_answers" to "anon";

grant select on table "public"."quiz_attempt_answers" to "anon";

grant trigger on table "public"."quiz_attempt_answers" to "anon";

grant truncate on table "public"."quiz_attempt_answers" to "anon";

grant update on table "public"."quiz_attempt_answers" to "anon";

grant delete on table "public"."quiz_attempt_answers" to "authenticated";

grant insert on table "public"."quiz_attempt_answers" to "authenticated";

grant references on table "public"."quiz_attempt_answers" to "authenticated";

grant select on table "public"."quiz_attempt_answers" to "authenticated";

grant trigger on table "public"."quiz_attempt_answers" to "authenticated";

grant truncate on table "public"."quiz_attempt_answers" to "authenticated";

grant update on table "public"."quiz_attempt_answers" to "authenticated";

grant delete on table "public"."quiz_attempt_answers" to "service_role";

grant insert on table "public"."quiz_attempt_answers" to "service_role";

grant references on table "public"."quiz_attempt_answers" to "service_role";

grant select on table "public"."quiz_attempt_answers" to "service_role";

grant trigger on table "public"."quiz_attempt_answers" to "service_role";

grant truncate on table "public"."quiz_attempt_answers" to "service_role";

grant update on table "public"."quiz_attempt_answers" to "service_role";

grant delete on table "public"."quiz_attempts" to "anon";

grant insert on table "public"."quiz_attempts" to "anon";

grant references on table "public"."quiz_attempts" to "anon";

grant select on table "public"."quiz_attempts" to "anon";

grant trigger on table "public"."quiz_attempts" to "anon";

grant truncate on table "public"."quiz_attempts" to "anon";

grant update on table "public"."quiz_attempts" to "anon";

grant delete on table "public"."quiz_attempts" to "authenticated";

grant insert on table "public"."quiz_attempts" to "authenticated";

grant references on table "public"."quiz_attempts" to "authenticated";

grant select on table "public"."quiz_attempts" to "authenticated";

grant trigger on table "public"."quiz_attempts" to "authenticated";

grant truncate on table "public"."quiz_attempts" to "authenticated";

grant update on table "public"."quiz_attempts" to "authenticated";

grant delete on table "public"."quiz_attempts" to "service_role";

grant insert on table "public"."quiz_attempts" to "service_role";

grant references on table "public"."quiz_attempts" to "service_role";

grant select on table "public"."quiz_attempts" to "service_role";

grant trigger on table "public"."quiz_attempts" to "service_role";

grant truncate on table "public"."quiz_attempts" to "service_role";

grant update on table "public"."quiz_attempts" to "service_role";

grant delete on table "public"."quiz_options" to "anon";

grant insert on table "public"."quiz_options" to "anon";

grant references on table "public"."quiz_options" to "anon";

grant select on table "public"."quiz_options" to "anon";

grant trigger on table "public"."quiz_options" to "anon";

grant truncate on table "public"."quiz_options" to "anon";

grant update on table "public"."quiz_options" to "anon";

grant delete on table "public"."quiz_options" to "authenticated";

grant insert on table "public"."quiz_options" to "authenticated";

grant references on table "public"."quiz_options" to "authenticated";

grant select on table "public"."quiz_options" to "authenticated";

grant trigger on table "public"."quiz_options" to "authenticated";

grant truncate on table "public"."quiz_options" to "authenticated";

grant update on table "public"."quiz_options" to "authenticated";

grant delete on table "public"."quiz_options" to "service_role";

grant insert on table "public"."quiz_options" to "service_role";

grant references on table "public"."quiz_options" to "service_role";

grant select on table "public"."quiz_options" to "service_role";

grant trigger on table "public"."quiz_options" to "service_role";

grant truncate on table "public"."quiz_options" to "service_role";

grant update on table "public"."quiz_options" to "service_role";

grant delete on table "public"."quiz_questions" to "anon";

grant insert on table "public"."quiz_questions" to "anon";

grant references on table "public"."quiz_questions" to "anon";

grant select on table "public"."quiz_questions" to "anon";

grant trigger on table "public"."quiz_questions" to "anon";

grant truncate on table "public"."quiz_questions" to "anon";

grant update on table "public"."quiz_questions" to "anon";

grant delete on table "public"."quiz_questions" to "authenticated";

grant insert on table "public"."quiz_questions" to "authenticated";

grant references on table "public"."quiz_questions" to "authenticated";

grant select on table "public"."quiz_questions" to "authenticated";

grant trigger on table "public"."quiz_questions" to "authenticated";

grant truncate on table "public"."quiz_questions" to "authenticated";

grant update on table "public"."quiz_questions" to "authenticated";

grant delete on table "public"."quiz_questions" to "service_role";

grant insert on table "public"."quiz_questions" to "service_role";

grant references on table "public"."quiz_questions" to "service_role";

grant select on table "public"."quiz_questions" to "service_role";

grant trigger on table "public"."quiz_questions" to "service_role";

grant truncate on table "public"."quiz_questions" to "service_role";

grant update on table "public"."quiz_questions" to "service_role";

grant delete on table "public"."quiz_results" to "anon";

grant insert on table "public"."quiz_results" to "anon";

grant references on table "public"."quiz_results" to "anon";

grant select on table "public"."quiz_results" to "anon";

grant trigger on table "public"."quiz_results" to "anon";

grant truncate on table "public"."quiz_results" to "anon";

grant update on table "public"."quiz_results" to "anon";

grant delete on table "public"."quiz_results" to "authenticated";

grant insert on table "public"."quiz_results" to "authenticated";

grant references on table "public"."quiz_results" to "authenticated";

grant select on table "public"."quiz_results" to "authenticated";

grant trigger on table "public"."quiz_results" to "authenticated";

grant truncate on table "public"."quiz_results" to "authenticated";

grant update on table "public"."quiz_results" to "authenticated";

grant delete on table "public"."quiz_results" to "service_role";

grant insert on table "public"."quiz_results" to "service_role";

grant references on table "public"."quiz_results" to "service_role";

grant select on table "public"."quiz_results" to "service_role";

grant trigger on table "public"."quiz_results" to "service_role";

grant truncate on table "public"."quiz_results" to "service_role";

grant update on table "public"."quiz_results" to "service_role";

grant delete on table "public"."quizzes" to "anon";

grant insert on table "public"."quizzes" to "anon";

grant references on table "public"."quizzes" to "anon";

grant select on table "public"."quizzes" to "anon";

grant trigger on table "public"."quizzes" to "anon";

grant truncate on table "public"."quizzes" to "anon";

grant update on table "public"."quizzes" to "anon";

grant delete on table "public"."quizzes" to "authenticated";

grant insert on table "public"."quizzes" to "authenticated";

grant references on table "public"."quizzes" to "authenticated";

grant select on table "public"."quizzes" to "authenticated";

grant trigger on table "public"."quizzes" to "authenticated";

grant truncate on table "public"."quizzes" to "authenticated";

grant update on table "public"."quizzes" to "authenticated";

grant delete on table "public"."quizzes" to "service_role";

grant insert on table "public"."quizzes" to "service_role";

grant references on table "public"."quizzes" to "service_role";

grant select on table "public"."quizzes" to "service_role";

grant trigger on table "public"."quizzes" to "service_role";

grant truncate on table "public"."quizzes" to "service_role";

grant update on table "public"."quizzes" to "service_role";

grant delete on table "public"."secondary_product_images" to "anon";

grant insert on table "public"."secondary_product_images" to "anon";

grant references on table "public"."secondary_product_images" to "anon";

grant select on table "public"."secondary_product_images" to "anon";

grant trigger on table "public"."secondary_product_images" to "anon";

grant truncate on table "public"."secondary_product_images" to "anon";

grant update on table "public"."secondary_product_images" to "anon";

grant delete on table "public"."secondary_product_images" to "authenticated";

grant insert on table "public"."secondary_product_images" to "authenticated";

grant references on table "public"."secondary_product_images" to "authenticated";

grant select on table "public"."secondary_product_images" to "authenticated";

grant trigger on table "public"."secondary_product_images" to "authenticated";

grant truncate on table "public"."secondary_product_images" to "authenticated";

grant update on table "public"."secondary_product_images" to "authenticated";

grant delete on table "public"."secondary_product_images" to "service_role";

grant insert on table "public"."secondary_product_images" to "service_role";

grant references on table "public"."secondary_product_images" to "service_role";

grant select on table "public"."secondary_product_images" to "service_role";

grant trigger on table "public"."secondary_product_images" to "service_role";

grant truncate on table "public"."secondary_product_images" to "service_role";

grant update on table "public"."secondary_product_images" to "service_role";

grant delete on table "statistics_demo"."games" to "anon";

grant insert on table "statistics_demo"."games" to "anon";

grant select on table "statistics_demo"."games" to "anon";

grant update on table "statistics_demo"."games" to "anon";

grant delete on table "statistics_demo"."games" to "authenticated";

grant insert on table "statistics_demo"."games" to "authenticated";

grant select on table "statistics_demo"."games" to "authenticated";

grant update on table "statistics_demo"."games" to "authenticated";

grant delete on table "statistics_demo"."games" to "service_role";

grant insert on table "statistics_demo"."games" to "service_role";

grant select on table "statistics_demo"."games" to "service_role";

grant update on table "statistics_demo"."games" to "service_role";

grant delete on table "statistics_demo"."player_stats" to "anon";

grant insert on table "statistics_demo"."player_stats" to "anon";

grant select on table "statistics_demo"."player_stats" to "anon";

grant update on table "statistics_demo"."player_stats" to "anon";

grant delete on table "statistics_demo"."player_stats" to "authenticated";

grant insert on table "statistics_demo"."player_stats" to "authenticated";

grant select on table "statistics_demo"."player_stats" to "authenticated";

grant update on table "statistics_demo"."player_stats" to "authenticated";

grant delete on table "statistics_demo"."player_stats" to "service_role";

grant insert on table "statistics_demo"."player_stats" to "service_role";

grant select on table "statistics_demo"."player_stats" to "service_role";

grant update on table "statistics_demo"."player_stats" to "service_role";

grant delete on table "statistics_demo"."players" to "anon";

grant insert on table "statistics_demo"."players" to "anon";

grant select on table "statistics_demo"."players" to "anon";

grant update on table "statistics_demo"."players" to "anon";

grant delete on table "statistics_demo"."players" to "authenticated";

grant insert on table "statistics_demo"."players" to "authenticated";

grant select on table "statistics_demo"."players" to "authenticated";

grant update on table "statistics_demo"."players" to "authenticated";

grant delete on table "statistics_demo"."players" to "service_role";

grant insert on table "statistics_demo"."players" to "service_role";

grant select on table "statistics_demo"."players" to "service_role";

grant update on table "statistics_demo"."players" to "service_role";

grant delete on table "statistics_demo"."standings" to "anon";

grant insert on table "statistics_demo"."standings" to "anon";

grant select on table "statistics_demo"."standings" to "anon";

grant update on table "statistics_demo"."standings" to "anon";

grant delete on table "statistics_demo"."standings" to "authenticated";

grant insert on table "statistics_demo"."standings" to "authenticated";

grant select on table "statistics_demo"."standings" to "authenticated";

grant update on table "statistics_demo"."standings" to "authenticated";

grant delete on table "statistics_demo"."standings" to "service_role";

grant insert on table "statistics_demo"."standings" to "service_role";

grant select on table "statistics_demo"."standings" to "service_role";

grant update on table "statistics_demo"."standings" to "service_role";


  create policy "frames_read_all"
  on "public"."frames"
  as permissive
  for select
  to public
using ((is_active = true));



  create policy "friendships_delete_as_participant"
  on "public"."friendships"
  as permissive
  for delete
  to public
using (((auth.uid() = requester_profile_id) OR (auth.uid() = receiver_profile_id)));



  create policy "friendships_insert_as_requester"
  on "public"."friendships"
  as permissive
  for insert
  to public
with check ((auth.uid() = requester_profile_id));



  create policy "friendships_select"
  on "public"."friendships"
  as permissive
  for select
  to public
using (((auth.uid() = requester_profile_id) OR (auth.uid() = receiver_profile_id) OR (status = 'accepted'::text)));



  create policy "friendships_update_as_receiver"
  on "public"."friendships"
  as permissive
  for update
  to public
using ((auth.uid() = receiver_profile_id))
with check ((auth.uid() = receiver_profile_id));



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



  create policy "owned_frames_select_self"
  on "public"."owned_frames"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = profile_id));



  create policy "Anyone can read point events"
  on "public"."point_events"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Users can view their own logs"
  on "public"."point_logs"
  as permissive
  for select
  to public
using ((auth.uid() = profile_id));



  create policy "Users can update their own profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id))
with check ((auth.uid() = id));



  create policy "profiles_public_read"
  on "public"."profiles"
  as permissive
  for select
  to public
using (true);



  create policy "profiles_select"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Users can view answers from their own attempts"
  on "public"."quiz_attempt_answers"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.quiz_attempts qa
  WHERE ((qa.id = quiz_attempt_answers.attempt_id) AND (qa.profile_id = auth.uid())))));



  create policy "Profiles can view their own quiz attempts"
  on "public"."quiz_attempts"
  as permissive
  for select
  to authenticated
using ((auth.uid() = profile_id));



  create policy "Authenticated users can view quiz options"
  on "public"."quiz_options"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Authenticated users can view quiz questions"
  on "public"."quiz_questions"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Authenticated users can view quiz results"
  on "public"."quiz_results"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Users can view quizzes"
  on "public"."quizzes"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "room_members_delete_self"
  on "public"."room_members"
  as permissive
  for delete
  to authenticated
using ((profile_id = auth.uid()));



  create policy "room_members_insert"
  on "public"."room_members"
  as permissive
  for insert
  to authenticated
with check ((public.is_owner_of_room(room_id) AND ((role = 'member'::text) OR ((role = 'owner'::text) AND (profile_id = auth.uid())))));



  create policy "room_members_select"
  on "public"."room_members"
  as permissive
  for select
  to authenticated
using (((profile_id = auth.uid()) OR public.is_member_of_room(room_id)));



  create policy "room_messages_insert"
  on "public"."room_messages"
  as permissive
  for insert
  to authenticated
with check ((public.is_member_of_room(room_id) AND (sender_profile_id = auth.uid())));



  create policy "room_messages_select"
  on "public"."room_messages"
  as permissive
  for select
  to authenticated
using (public.is_member_of_room(room_id));



  create policy "rooms_insert"
  on "public"."rooms"
  as permissive
  for insert
  to authenticated
with check (((owner_profile_id = auth.uid()) AND (status = ANY (ARRAY['live'::text, 'offline'::text]))));



  create policy "rooms_select"
  on "public"."rooms"
  as permissive
  for select
  to authenticated
using (((owner_profile_id = auth.uid()) OR public.is_member_of_room(id)));



  create policy "Enable read access for all users"
  on "public"."secondary_product_images"
  as permissive
  for select
  to public
using (true);



  create policy "Enable delete for users based on user_id"
  on "public"."shopping_cart_items"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = ( SELECT shopping_carts.profile_id
   FROM public.shopping_carts
  WHERE (shopping_carts.id = shopping_cart_items.cart_id))));



  create policy "Enable insert for users based on user_id"
  on "public"."shopping_cart_items"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = ( SELECT shopping_carts.profile_id
   FROM public.shopping_carts
  WHERE (shopping_carts.id = shopping_cart_items.cart_id))));



  create policy "Enable users to view their own data only"
  on "public"."shopping_cart_items"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = ( SELECT shopping_carts.profile_id
   FROM public.shopping_carts
  WHERE (shopping_carts.id = shopping_cart_items.cart_id))));



  create policy "Enable insert for authenticated users, thier own data only"
  on "public"."shopping_carts"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = profile_id));


CREATE TRIGGER friendships_set_updated_at BEFORE UPDATE ON public.friendships FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_sync_ecoins BEFORE UPDATE OF fanatic_coins ON public.profiles FOR EACH ROW WHEN ((new.fanatic_coins IS DISTINCT FROM old.fanatic_coins)) EXECUTE FUNCTION public.trigger_sync_ecoins();


  create policy "Anyone can view avatars"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Users can update their own avatar"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can upload their own avatar"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));


