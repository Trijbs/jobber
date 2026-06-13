<div align="center">

# 📦 Jobber

**Part-time job research agent for Hoogeveen, Netherlands**

An autonomous system that scrapes Dutch job boards daily, scores listings by your preferences, and presents them in a Tinder-style swipe interface for quick review.

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000?logo=vercel&logoColor=white)](https://vercel.com)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

---

## What it does

Jobber searches **Adzuna** (250k+ NL jobs) and **Werkzoeken.nl** for part-time positions in Hoogeveen, filters them by your preferences (hourly rate, remote/hybrid, availability), and lets you swipe through results — save the good ones, dismiss the rest.

```
┌─────────────────────────────────────┐
│  📦 Pakketbezorger                  │
│  PostNL — Hoogeveen                 │
│                                     │
│  €12.50/uur  •  16-24 uur/pw       │
│  🏠 Hybrid  •  📅 Flex              │
│                                     │
│  "Bezorg pakketten in de regio..."  │
│                                     │
│     ❌ Afwijzen    ✅ Opslaan       │
│        ← Swipe      Swipe →        │
├─────────────────────────────────────┤
│  🃏 Nieuw (12)  ✅ Opgeslagen (3)  │
└─────────────────────────────────────┘
```

## Features

| | Feature | Description |
|---|---------|-------------|
| 🃏 | **Tinder-style swipe** | Swipe left to dismiss, right to save. Touch, mouse, and keyboard support |
| 🔄 | **Daily auto-scrape** | Vercel Cron runs at 06:00 CET. Manual trigger button also available |
| 🔍 | **Multi-source search** | Adzuna API + Werkzoeken.nl scraping, deduplicated automatically |
| 📊 | **Smart scoring** | Jobs scored by salary, location, remote option, hours, and keyword relevance |
| ⚙️ | **Configurable filters** | Search terms, radius, min hourly rate, exclude keywords — all adjustable in UI |
| ↩️ | **Undo support** | Mistake? Shake or tap undo to revert the last swipe |

## Architecture

```
                    ┌─────────────────┐
                    │   Vercel Cron   │
                    │  (daily 06:00)  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  /api/cron/     │
                    │    scrape       │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
   ┌────────▼────────┐ ┌────▼─────┐  ┌───────▼───────┐
   │  Adzuna API     │ │Werkzoeken│  │  Preferences  │
   │  (250k+ NL jobs)│ │  .nl     │  │  (Supabase)   │
   └────────┬────────┘ └────┬─────┘  └───────┬───────┘
            │                │                │
            └────────┬───────┘                │
                     │                        │
            ┌────────▼────────────────────────▼───┐
            │         JobFilterAgent              │
            │  Score • Deduplicate • Apply prefs  │
            └────────────────┬────────────────────┘
                             │
            ┌────────────────▼────────────────────┐
            │       JobPresenterAgent             │
            │  Format cards → Store in Supabase   │
            └────────────────┬────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Supabase DB   │
                    │  jobs / prefs   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Swipe Frontend │
                    │  (HTML/CSS/JS)  │
                    └─────────────────┘
```

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Vanilla HTML / CSS / JS | Zero build step, lightweight, fast |
| **Backend** | Node.js (Vercel Serverless) | Same platform as deployment |
| **Database** | Supabase (PostgreSQL) | Free tier, REST API, real-time ready |
| **Primary API** | Adzuna | Aggregates 250k+ NL jobs, free tier, official API |
| **Secondary** | Werkzoeken.nl | NL-specific, 245k jobs, HTML scraping via Cheerio |
| **Scheduling** | Vercel Cron | Built-in, no external service needed |

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/Trijbs/jobber.git
cd jobber
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
```

Fill in your values:

| Variable | Where to get it |
|----------|----------------|
| `SUPABASE_URL` | [Supabase Dashboard](https://supabase.com/dashboard) → Project → Settings → API |
| `SUPABASE_ANON_KEY` | Same page → `anon` `public` key |
| `ADZUNA_APP_ID` | [Adzuna Developer](https://developer.adzuna.com/signup) (free) |
| `ADZUNA_API_KEY` | Same page |

### 3. Set up database

Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new) and run:

```sql
-- Schema
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  source_id TEXT,
  source_url TEXT,
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  description TEXT,
  salary_min DECIMAL(10,2),
  salary_max DECIMAL(10,2),
  salary_per TEXT DEFAULT 'hour',
  hours_per_week DECIMAL(5,2),
  contract_type TEXT,
  remote_option TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  requirements TEXT[] DEFAULT '{}',
  flexibility_notes TEXT,
  score INTEGER DEFAULT 0,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(source, source_id)
);

CREATE TABLE IF NOT EXISTS job_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('saved', 'dismissed', 'applied')),
  decided_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_jobs" ON jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_decisions" ON job_decisions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_preferences" ON preferences FOR ALL USING (true) WITH CHECK (true);

-- Default preferences
INSERT INTO preferences (key, value) VALUES
  ('search_terms', '["bezorger", "chauffeur", "pakketbezorger", "postbezorger", "magazijn", "logistiek"]'::jsonb),
  ('location', '"hoogeveen"'::jsonb),
  ('radius_km', '15'::jsonb),
  ('min_hourly_rate', '6.00'::jsonb),
  ('remote_preference', '["remote", "hybrid"]'::jsonb),
  ('exclude_keywords', '["fulltime", "40 uur"]'::jsonb),
  ('availability', '{"weekdays_after": "15:00", "weekends": true, "evenings": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Trigger first scrape

Click the **🔄 Nu zoeken** button in the Filters tab, or:

```bash
curl -X POST http://localhost:3000/api/cron/scrape
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase anon public key |
| `ADZUNA_APP_ID` | ✅ | Adzuna application ID |
| `ADZUNA_API_KEY` | ✅ | Adzuna API key |
| `CRON_SECRET` | ❌ | Optional secret for cron endpoint auth |

## API Reference

### `GET /api/jobs`

Fetch jobs with optional filtering.

```
GET /api/jobs?decision=new&limit=50&offset=0
```

| Param | Default | Description |
|-------|---------|-------------|
| `decision` | `new` | `new`, `saved`, or `dismissed` |
| `limit` | `50` | Results per page |
| `offset` | `0` | Pagination offset |

### `POST /api/decide`

Save or dismiss a job.

```json
{ "job_id": "uuid", "decision": "saved" }
```

### `DELETE /api/decide`

Undo a decision.

```json
{ "job_id": "uuid" }
```

### `GET /api/preferences`

Returns all preferences as key-value pairs.

### `PUT /api/preferences`

Update a single preference.

```json
{ "key": "search_terms", "value": ["bezorger", "chauffeur"] }
```

### `POST /api/cron/scrape`

Trigger a manual scrape. Runs Adzuna + Werkzoeken for all search terms.

## Project Structure

```
jobber/
├── api/
│   ├── cron/
│   │   └── scrape.js          # Orchestrates daily scrape
│   ├── jobs.js                 # GET /api/jobs
│   ├── decide.js               # POST/DELETE /api/decide
│   └── preferences.js          # GET/PUT /api/preferences
├── agents/
│   ├── 01-scraper.json         # Scraper agent manifest
│   ├── 02-filter.json          # Filter agent manifest
│   └── 03-presenter.json       # Presenter agent manifest
├── lib/
│   ├── adzuna.js               # Adzuna API client
│   ├── werkzoeken.js           # Werkzoeken.nl scraper (Cheerio)
│   ├── supabase.js             # Supabase client + queries
│   └── scorer.js               # Job scoring logic
├── public/
│   ├── index.html              # Main UI
│   ├── css/styles.css          # Soft light theme
│   └── js/
│       ├── api.js              # API client
│       ├── app.js              # Main app logic
│       ├── cards.js            # Card rendering
│       └── swipe.js            # Touch/mouse/keyboard gestures
├── config/
│   └── orchestrator.json       # Agent orchestration config
├── scripts/
│   ├── setup-db.sql            # Database schema
│   └── setup-rls.sql           # RLS policies
├── dev-server.js               # Local dev server (no Vercel CLI needed)
├── package.json
├── vercel.json
└── .env
```

## Agent System

Jobber uses a 3-agent pipeline:

| Agent | File | Responsibility |
|-------|------|----------------|
| **JobScraperAgent** | `agents/01-scraper.json` | Fetch from Adzuna API + scrape Werkzoeken |
| **JobFilterAgent** | `agents/02-filter.json` | Score jobs, apply preferences, deduplicate |
| **JobPresenterAgent** | `agents/03-presenter.json` | Format for UI, store in Supabase |

### Scoring Rules

| Rule | Points |
|------|--------|
| Search term in title | +25 |
| Location is Hoogeveen | +20 |
| Salary above minimum | +20 |
| Part-time hours (8-32/wk) | +15 |
| Remote/hybrid match | +15 |
| Search term in description | +10 |
| Preferred tag match | +5 |
| Full-time penalty | -15 |
| Exclude keyword match | -30 |

## Database Schema

### `jobs`
Stores all scraped job listings. Deduplicated by `source + source_id`.

### `job_decisions`
Tracks user swipe decisions (saved / dismissed / applied). One per job.

### `preferences`
Key-value store for user configuration (search terms, filters, availability).

## Deployment

### Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com/new)
3. Add environment variables
4. Deploy — cron runs automatically at 06:00 CET

### Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Run the SQL from Quick Start step 3
3. Copy URL + anon key to `.env`

## Roadmap

### Phase 1 — ✅ Done
- Adzuna API integration
- Werkzoeken.nl scraping
- Tinder-style swipe UI
- Smart job scoring
- Configurable filters
- Daily cron automation
- Manual trigger

### Phase 2 — Next
- [ ] Push notifications for high-score jobs
- [ ] Export saved jobs (CSV / email digest)
- [ ] More sources (JoBBsquare, company career pages)
- [ ] Job detail modal with full description
- [ ] Dark mode toggle

### Phase 3 — Future
- [ ] Stats dashboard (trends, top companies, salary ranges)
- [ ] Multi-city support
- [ ] Application tracking
- [ ] Mobile PWA with offline support

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE) — use it however you want.
