# AFI – Stay Golden, Stay Connected 🟡🔵

### A Lumina Consulting Project

![AFI](https://github.com/user-attachments/assets/e16e97ab-c08b-4e30-a692-6344831f1a62)

**AFI (Active Fan Interaction)** is a full-stack fan engagement platform built for Golden State Warriors fans. The app combines community interaction, fan games, rewards, events, news, rooms, profiles, and an admin dashboard that helps monitor platform activity.

It transforms passive sports consumption into an interactive, community-driven digital experience designed to keep fans engaged all year long — both during the season and the off-season.

> AFI is an independent academic project. It is **not** officially affiliated with or endorsed by the Golden State Warriors or the NBA.

---

## 📌 Project Status

🟢 **Final Sprint (Sprint 4) — feature-complete build.**

The application has moved well beyond the original planning phase. The frontend, the Supabase backend (database, edge functions, realtime), authentication, the core games, the shop/economy, and the admin analytics dashboard are all implemented and integrated.

---

## ✨ Key Features

- **Authentication** — Google OAuth via Supabase Auth, with role-based access (`user` / `admin`).
- **User profiles** — username, display name, avatar, caption, equippable profile frames, coin balances and login streaks.
- **Friends & social** — friend requests, friend invites, and public profile pages.
- **News** — Warriors news feed and article detail pages, sourced through Supabase Edge Functions.
- **Events** — create, edit and browse fan events and games, including previous games and previous fan events, with attendance.
- **Rooms** — community rooms with realtime chat, join requests and room invitations.
- **Statistics & Legacy** — team statistics and a "Legacy" section featuring historic players and years.
- **Leaderboard / Ranking** — competitive ranking across the fan community.
- **Games**
  - **Fanatic** — weekly guessing game scored with semantic-embedding AI (Voyage AI `voyage-3`).
  - **Quizzes** — fan quizzes with scored attempts.
  - **Shoot Your Shot** — an AR / gesture-based basketball shooting mini-game (Three.js + React Three Fiber).
- **Shop & eShop** — product catalog, product detail pages, shopping cart, and a cosmetic eShop (e.g. profile frames).
- **Coin economy** — fanatic coins / e-coins, point events and a personal point-log history.
- **Thunder AI assistant** — an LLM-powered shopping assistant (Supabase Edge Function).
- **Admin dashboard** — admin-only analytics with engagement KPIs, activity charts, per-game performance, a users table and CSV export.
- **Realtime presence** — live online-user presence via Supabase Realtime.

---

## 🚀 Final Sprint Highlights

The final sprint focused on closing the loop on analytics and admin tooling:

- **Admin analytics dashboard (HU68)** with an engagement-overview KPI section, activity time-series charts and an "all games" performance view.
- **Admin-only route protection** (`RequireAdmin`) backed by a `role` flag on the `profiles` table — non-admins are redirected.
- **Date-range filtering** and adjustable granularity across the dashboard metrics.
- **Game analytics** across the three app games — Fanatic, Quizzes and Shoot Your Shot.
- **Users table** with role, plays, coins, streak and activity data, plus **CSV export**.
- **Realtime online-user presence** surfaced through a global presence provider.
- **Responsive admin UI** for desktop and mobile.
- New Supabase migrations and edge-function support for admin metrics, shop audit logs and product/question embeddings.

---

## 🛠️ Tech Stack

| Area                 | Technology                                                               |
| -------------------- | ------------------------------------------------------------------------ |
| Frontend framework   | React 19 + TypeScript                                                    |
| Build tool           | Vite 7                                                                   |
| Routing              | React Router v7                                                          |
| Styling              | Tailwind CSS v4                                                          |
| Charts               | Recharts                                                                 |
| 3D / AR              | Three.js + React Three Fiber (`@react-three/fiber`, `@react-three/drei`) |
| UI / icons           | Lucide React, Heroicons, Embla Carousel, React Countdown                 |
| Backend platform     | Supabase (PostgreSQL)                                                    |
| Auth                 | Supabase Auth (Google OAuth)                                             |
| Realtime             | Supabase Realtime (presence, chat)                                       |
| Serverless           | Supabase Edge Functions (Deno)                                           |
| AI / embeddings      | Voyage AI (`voyage-3`) + LLM provider for the Thunder assistant          |
| External data        | World News API / Apify (news ingestion), ESPN article fetch              |
| Testing              | Playwright                                                               |
| Linting / formatting | ESLint + Prettier                                                        |
| Deployment           | Vercel (frontend), Supabase Cloud (backend)                              |

---

## 📂 Project Structure

```text
afi/
├── README.md
├── docs/                     # Project documentation
├── React/                    # Frontend application (Vite + React + TS)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── vercel.json           # SPA rewrite config for Vercel
│   ├── playwright.config.ts
│   ├── .env.example          # Frontend env var template
│   ├── public/
│   ├── tests/                # Playwright end-to-end tests
│   └── src/
│       ├── pages/            # Route-level pages (Home, Games, Shop, Rooms, Admin, …)
│       ├── components/       # UI, layout and admin components
│       ├── hooks/            # Data-fetching and feature hooks
│       ├── lib/              # API clients, Supabase client, auth helpers
│       ├── services/         # Supporting services (e.g. news scraper)
│       ├── constants/ data/ frames/
│       └── App.tsx           # Route definitions
└── Supabase/
    └── supabase/
        ├── config.toml
        ├── seed.sql
        ├── migrations/       # PostgreSQL schema migrations
        └── functions/        # Deno edge functions
            ├── fanatic/                      # Fanatic answer scoring
            ├── thunder/                      # Thunder AI shop assistant
            ├── warriors-news/                # News ingestion
            ├── news-article/                 # Article fetch/parse
            ├── question-embedding-generator/ # Voyage embeddings (answers)
            └── product-embedding-generator/  # Voyage embeddings (products)
```

> **Note:** The frontend lives in `React/`, so all `npm` commands below are run from inside that folder.

---

## ✅ Prerequisites

- **Node.js** 20+ and **npm** (the toolchain is built against current Vite 7 / React 19 versions).
- A **Supabase** project (cloud) or a local Supabase stack via the [Supabase CLI](https://supabase.com/docs/guides/cli).
- A **Google OAuth** provider configured in Supabase Auth.
- (Optional) [Deno](https://deno.com/) and the Supabase CLI to run or deploy the edge functions locally.

---

## 🔐 Environment Variables

A template is provided in `React/.env.example`. Copy it to `React/.env` and fill in your own values. **Never commit real secrets, anon keys, service-role keys or private URLs.**

### Frontend (`React/.env`)

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Thunder AI assistant edge function endpoint
VITE_THUNDERAI_URL=your_thunder_function_url

# News scraper edge function endpoint
VITE_NEWS_SCRAPER_URL=your_news_scraper_function_url
```

### Playwright tests (`React/.env`)

```env
ENV_URL=http://localhost:5173
TEST_USER_EMAIL=your_test_user_email
TEST_USER_PASSWORD=your_test_user_password
CI=false
```

### Supabase Edge Functions (server-side secrets)

These are configured as **Supabase secrets / function environment variables**, not in the frontend `.env`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI / embeddings
VOYAGE_API_KEY=your_voyage_api_key
LLM_API_KEY=your_llm_api_key

# News ingestion
WORLDNEWS_API_KEY=your_worldnews_api_key
APIFY_TOKEN=your_apify_token
APIFY_ACTOR_ID=your_apify_actor_id
```

> Keep all of the above as placeholders in version control. Manage real values through Supabase secrets, Vercel environment variables and your local untracked `.env` files.

---

## 📥 Installation

```bash
# Clone the repository
git clone <your_repository_url>
cd afi/React

# Install dependencies
npm install

# Create your local environment file
cp .env.example .env   # then edit .env with your own values
```

---

## ▶️ Running Locally

From the `React/` directory:

```bash
npm run dev
```

The app starts on Vite's dev server (default `http://localhost:5173`). It expects a reachable Supabase backend and valid environment variables.

### Available scripts

| Script    | Command           | Description                                    |
| --------- | ----------------- | ---------------------------------------------- |
| `dev`     | `npm run dev`     | Start the Vite development server              |
| `build`   | `npm run build`   | Type-check (`tsc -b`) and build for production |
| `preview` | `npm run preview` | Serve the production build locally             |
| `lint`    | `npm run lint`    | Run ESLint over the project                    |

---

## 🗄️ Supabase Setup

AFI uses Supabase for the database, authentication, realtime and edge functions.

1. **Create a Supabase project** (or start a local stack with `supabase start`).
2. **Configure authentication** — enable the **Google** provider in Supabase Auth. The app redirects back to the site origin after sign-in.
3. **Apply the database schema** — run the migrations in `Supabase/supabase/migrations/` (see below) and optionally load `Supabase/supabase/seed.sql`.
4. **Set the server-side secrets** listed above for the edge functions.
5. **Deploy the edge functions** in `Supabase/supabase/functions/` (`fanatic`, `thunder`, `warriors-news`, `news-article`, `question-embedding-generator`, `product-embedding-generator`).
6. **Copy your project URL, anon key and function URLs** into `React/.env`.

### Database migrations

The schema is defined as ordered SQL migrations under `Supabase/supabase/migrations/`. They cover core tables such as `profiles`, the Fanatic game tables, quizzes, rooms, events, the shop/economy and the admin metrics, plus shop audit logs. Apply them with the Supabase CLI from inside `Supabase/`:

```bash
# Local stack
supabase start
supabase db reset          # applies migrations + seed.sql to the local database

# Remote project
supabase db push           # applies migrations to the linked remote project
```

> Run Supabase CLI commands yourself against your own project — this README does not bundle any live database credentials.

---

## 🏗️ Build

From the `React/` directory:

```bash
npm run build
```

This runs the TypeScript project build (`tsc -b`) and produces an optimized static bundle in `React/dist/`. You can preview it locally with:

```bash
npm run preview
```

---

## ☁️ Deployment

### Frontend — Vercel

The frontend is a static Vite SPA and deploys cleanly to Vercel:

- **Root directory:** `React/`
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Routing:** `React/vercel.json` provides a catch-all rewrite to `index.html` so client-side routes resolve correctly on refresh/deep-link.
- **Environment variables:** set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_THUNDERAI_URL` and `VITE_NEWS_SCRAPER_URL` in the Vercel project settings.

### Backend — Supabase Cloud

- Apply migrations to the linked Supabase project (`supabase db push`).
- Deploy edge functions (`supabase functions deploy <name>`).
- Configure all server-side secrets (Voyage, LLM, World News / Apify, service-role key) in the Supabase dashboard.
- Add your deployed frontend origin to the allowed redirect URLs for Google OAuth.

---

## 🛡️ Admin Access

The admin dashboard lives at `/admin` and is protected by the `RequireAdmin` guard:

- Unauthenticated users are redirected to `/login`.
- Authenticated users **without** `role = 'admin'` on their `profiles` row are redirected to the home page.
- Authenticated **admins** see the analytics dashboard (engagement KPIs, activity charts, per-game performance, users table and CSV export).

To grant access, set the `role` column to `admin` for the relevant user in the `profiles` table.

---

## 🧪 Testing / Validation

End-to-end tests are written with **Playwright** and live in `React/tests/` (shop, eShop, profile, leaderboard and quiz flows, among others), configured in `React/playwright.config.ts`.

```bash
cd React

# Install browsers once
npx playwright install

# Run the test suite (builds + previews the app on port 4173 automatically)
npx playwright test

# Open the HTML report
npx playwright show-report
```

Tests require a reachable Supabase backend and the `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` credentials in `React/.env`.

You can also validate the build and lint locally:

```bash
npm run build   # type-check + production build
npm run lint    # ESLint
```

---

## 🩺 Troubleshooting

- **Blank screen / Supabase errors on load** — confirm `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in `React/.env` and that the dev server was restarted after editing it.
- **Google sign-in fails or doesn't redirect** — ensure the Google provider is enabled in Supabase Auth and your local/deployed origin is in the allowed redirect URLs.
- **404 on a route after refresh in production** — verify the SPA rewrite in `React/vercel.json` (or the equivalent on your host) is in place.
- **Thunder assistant / news not loading** — check that `VITE_THUNDERAI_URL` and `VITE_NEWS_SCRAPER_URL` point to deployed edge functions and that their server-side secrets are configured.
- **Fanatic / embedding features failing** — confirm `VOYAGE_API_KEY` is set on the relevant Supabase edge functions.
- **Playwright tests can't authenticate** — confirm the test user exists and `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` are correct.

---

## ⚠️ Known Limitations

- Real-time third-party sports data (live scores/events) depends on the availability and quotas of the configured external APIs.
- AI-powered features (Fanatic semantic scoring, Thunder assistant) require valid third-party API keys and incur provider usage limits.
- The platform is an academic project and is not officially affiliated with the Golden State Warriors or the NBA.

---

## 👨‍💻 Team – Lumina Consulting

- Alan Canales
- Emily Castillo
- Daniela Cuéllar
- José Sánchez
- Carolina Ortega

---

## 🌟 Vision

AFI aims to redefine fan engagement by turning sports spectators into **active digital participants**, combining gamification, storytelling, and real-time interaction.

More than a platform.
A digital fan identity.
