# Contributing to Jobber

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/Trijbs/jobber.git
cd jobber
npm install
cp .env.example .env
# Fill in your Supabase and Adzuna credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

- `api/` — Vercel serverless functions (REST endpoints)
- `lib/` — Core logic (API clients, scoring, database)
- `public/` — Frontend (HTML, CSS, JS)
- `agents/` — Agent pipeline manifests
- `scripts/` — Database setup scripts

## Making Changes

1. Create a branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test locally with `npm run dev`
4. Commit with a clear message: `feat: add job detail modal`
5. Push and open a PR

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation only
- `style:` — Formatting, no code change
- `refactor:` — Code change that neither fixes nor adds
- `test:` — Adding tests
- `chore:` — Maintenance

## Adding a New Job Source

1. Create `lib/your-source.js` with a `searchJobs()` function
2. Return jobs in the same shape as `lib/adzuna.js` (see `normalizeJob`)
3. Add the source to `api/cron/scrape.js`
4. Update `agents/01-scraper.json`

## Code Style

- No TypeScript — vanilla JS with JSDoc where helpful
- No framework — vanilla HTML/CSS/JS for frontend
- Keep functions small and focused
- Handle errors explicitly

## Questions?

Open an issue or start a discussion.
