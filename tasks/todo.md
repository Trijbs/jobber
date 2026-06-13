# Jobber — Part-Time Job Research System

## Status: Building

## User Decisions
- Supabase: New project (`kngqskquemxsggakiwsa`)
- Adzuna API: key `99a16a7638393dd8113ed504ee54e8f1`, app ID `11485c59`
- UI: Soft light theme (warm off-white, muted sage green accents)
- Werkzoeken: Included from day one
- Notifications: Manual check on custom HTML page
- Testing: Local first (`vercel dev`)

## Implementation Checklist

### Phase 1: Foundation
- [x] Initialize project (package.json, vercel.json, .env)
- [x] Install dependencies (@supabase/supabase-js, cheerio)
- [x] Create Supabase schema (scripts/setup-db.sql)
- [x] Build Supabase client (lib/supabase.js)
- [x] Build Adzuna API client (lib/adzuna.js)
- [x] Build Werkzoeken scraper (lib/werkzoeken.js)
- [x] Build job scoring logic (lib/scorer.js)

### Phase 2: API Layer
- [x] Build GET /api/jobs endpoint
- [x] Build POST/DELETE /api/decide endpoint
- [x] Build GET/PUT /api/preferences endpoint
- [x] Build /api/cron/scrape endpoint (orchestrator)

### Phase 3: Frontend
- [x] Build index.html
- [x] Build styles.css (soft light theme)
- [x] Build api.js (API client)
- [x] Build cards.js (card rendering)
- [x] Build swipe.js (touch/mouse/keyboard gestures)
- [x] Build app.js (main logic, views)

### Phase 4: Agent Manifests
- [x] 01-scraper.json
- [x] 02-filter.json
- [x] 03-presenter.json
- [x] orchestrator.json

### Phase 5: Setup & Test
- [ ] Run Supabase schema setup (SQL Editor)
- [ ] Test with `vercel dev`
- [ ] Verify Adzuna API works
- [ ] Verify Werkzoeken scraping works
- [ ] Test swipe UI end-to-end

## Project Structure
```
jobber/
├── api/
│   ├── cron/scrape.js
│   ├── jobs.js
│   ├── decide.js
│   └── preferences.js
├── agents/
│   ├── 01-scraper.json
│   ├── 02-filter.json
│   └── 03-presenter.json
├── lib/
│   ├── adzuna.js
│   ├── werkzoeken.js
│   ├── supabase.js
│   └── scorer.js
├── public/
│   ├── index.html
│   ├── css/styles.css
│   └── js/{api,cards,swipe,app}.js
├── config/orchestrator.json
├── scripts/{setup-db.sql,setup-db.js}
├── package.json
├── vercel.json
└── .env
```
