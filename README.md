# Human or AI? — Quiz (React + Netlify + Neon)

A fast, single‑screen quiz where players guess whether a 3‑sentence passage is from a **real book** (public‑domain/verified) or **AI‑generated**. Includes sign‑up/sign‑in (Netlify Identity), persistent scores and sessions, leaderboards, admin passage marking, and a seeding plan for AI passages.

## Stack
- **Frontend:** React + Vite (TypeScript), per‑category CSS tokens
- **Serverless:** Netlify Functions (TypeScript) using `@neondatabase/serverless`
- **Auth:** Netlify Identity (GoTrue)
- **DB:** Neon Postgres
- **CI/CD:** GitHub Actions + Netlify

## Quick start
1. **Neon:** Create DB, copy connection string (with `sslmode=require`).  
2. **Apply schema:** `psql "$DATABASE_URL" -f db/schema.sql && psql "$DATABASE_URL" -f db/categories_seed.sql`  
3. **Netlify site:** Connect repo → set env var `DATABASE_URL`.  
4. **Identity:** Enable Netlify Identity; allow sign‑ups; set your user role `admin` to use admin APIs.  
5. **Local dev:**  
   ```bash
   npm i
   npm run dev
   ```
6. **Deploy:** Push to `main` → Netlify auto‑builds. Or use Netlify CLI with AUTH TOKEN + SITE ID.

## Admin
- `/.netlify/functions/admin/create-passage` (POST) — add passage (AI or human).  
- `/.netlify/functions/admin/mark-passage` (POST) — flip AI/Human and/or set verified.  
> Requires Netlify Identity role `admin`.

## Seeding AI Passages
Use the prompt in `db/seed_prompts/ai_seed_prompt.txt` to generate 5,000 AI passages. Load via `\copy` as shown in the `db_migrate.yml` or `db/load_seed.sh`.  
**Human passages must be public‑domain or licensed.**

## Notes
- `next-question` never reveals `source_type` until after `submit-guess`.
- Scores persist for signed‑in users; guests can try but not persist (the UI encourages sign‑in).
- Keep human excerpts short (3 sentences) and anonymized to avoid giveaways.