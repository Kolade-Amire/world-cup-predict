# ⚽ Knockout Predictor

A small web app for running a World Cup knockout prediction challenge with friends.

- **Pick who qualifies** in each knockout match → **+3 points**
- **Name a player to score** in the match → **+5 points**
- Predictions **lock automatically at kickoff (WAT)** — the server rejects late picks, so nobody can cheat after a goal.
- **Live leaderboard**, updated as results come in.
- Login = **display name + 4-digit PIN** (no email needed).
- Covers the **48-team format**: Round of 32 → Round of 16 → Quarter-finals → Semi-finals → Third place → Final.

Stack: Next.js (App Router) · Prisma · PostgreSQL · Tailwind. Built to run on **Vercel (app) + Railway (Postgres)** free/hobby tiers.

---

## How fixtures get in

Two ways, and you can mix them:

1. **Auto-sync (recommended).** In `/admin`, click **“Sync fixtures from API”**. It pulls teams, kickoff times (UTC → shown in WAT), who advanced, **and team squads** from [football-data.org](https://www.football-data.org). Matches already kicked off simply show as locked.
2. **Manual.** Edit any match in `/admin` (teams, kickoff in WAT). Run `npm run db:seed` once to lay out an empty 48-team bracket to fill in by hand.

> Use **one** approach — if you'll auto-sync, don't also seed (the two create separate rows).
>
> **Goal scorers** are auto-filled from a second provider, **apifootball.com** (World Cup = `league_id 28`), because football-data.org's tier exposes squads but not scorer events. The **Sync** button fetches fixtures/squads (football-data) *and* goal scorers (apifootball), matching scorers onto matches by team + date. You can still enter/adjust scorers by hand in `/admin` — **manual entry wins**: once you save scorers for a match, auto-sync leaves it alone (clear them to hand control back). The scorer field (predicting *and* recording) is a **dropdown of the two teams' squads** with a free-text fallback; matching is token- and accent-insensitive (`Osimhen` = `Victor Osimhen` = `mbappe`).

If the free API tier doesn't cover this tournament, the manual flow runs the whole thing.

---

## Keeping results fresh (optional)

The kickoff **lock** is computed live on every page load and every save, so deadlines are always enforced regardless of the options below — these only control how fast *results* appear.

- **Vercel Cron** (`vercel.json`): hits `/api/cron/sync` daily (Hobby plan allows once/day).
- **GitHub Actions** (`.github/workflows/sync.yml`): hits the same endpoint every ~10 min on match days (free). Add repo secrets `APP_URL` (your Vercel URL) and `CRON_SECRET`.
- **Auto-refresh**: open phones re-fetch the page every 30s, so the leaderboard updates without a manual reload.

---

## Deploy it (≈15 minutes)

### 1. Push the code to GitHub
```bash
cd world-cup-predict
git init && git add -A && git commit -m "Knockout Predictor"
gh repo create world-cup-predict --private --source=. --push
```

### 2. Create the database on Railway
1. Railway → **New Project → Provision PostgreSQL**.
2. Postgres service → **Variables / Connect** → copy the **`DATABASE_URL`** (the `postgresql://…` string).

### 3. Get a football-data.org token
Register (free) at https://www.football-data.org/client/register and copy your API token.

### 4. Set up the schema (run once, from your machine)
Copy `.env.example` to `.env`, fill in `DATABASE_URL`, then:
```bash
npm install
npx prisma db push      # creates / updates the tables in Railway
# optional, only if NOT using API sync:
npm run db:seed         # lays out the empty 48-team bracket
```

### 5. Deploy on Vercel
1. Vercel → **Add New → Project** → import the repo (auto-detects Next.js).
2. Add **Environment Variables** (all environments):
   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | the Railway connection string |
   | `SESSION_SECRET` | long random string — `openssl rand -base64 32` |
   | `ADMIN_PASSWORD` | the password to manage fixtures/results |
   | `FOOTBALL_DATA_API_KEY` | your football-data.org token |
   | `APIFOOTBALL_API_KEY` | your apifootball.com key (auto goal scorers) |
   | `CRON_SECRET` | long random string — `openssl rand -base64 32` |
3. **Deploy.**

### 6. Go live
1. Visit `/admin`, enter `ADMIN_PASSWORD`, click **Sync fixtures from API** (or fill matches manually).
2. After each match, set the qualifier + add goal scorers in `/admin`.
3. Drop the link in the WhatsApp group. 🎉
4. (Optional) Add the GitHub Actions secrets for 10-min result refreshes during matches.

---

## Local development
```bash
cp .env.example .env     # fill in DATABASE_URL, SESSION_SECRET, ADMIN_PASSWORD, FOOTBALL_DATA_API_KEY, APIFOOTBALL_API_KEY
npm install
npx prisma db push
npm run dev              # http://localhost:3000
```

## Where things live
- Scoring values: `src/lib/scoring.ts` (`QUALIFY_POINTS = 3`, `SCORER_POINTS = 5`).
- Rounds / bracket order: `src/lib/rounds.ts`.
- API fetch + mapping: `src/lib/football-data.ts`; DB upsert: `src/lib/sync.ts`.
- Timezone is fixed **WAT (UTC+1)** in `src/lib/time.ts`.

## Notes
- Forgot a PIN? No self-serve reset — as admin, clear/replace that Player row in the database.
- `/admin` isn't linked in the nav; it's gated by `ADMIN_PASSWORD`.
