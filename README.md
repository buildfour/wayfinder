# Wayfinder

Turn any how-to doc, SOP, or knowledge-base article into a cinematic, step-by-step guided tour.

Wayfinder reads your source material, extracts a goal-aware path with branching and checkpoints, and walks users through it one step at a time — with stuck help, progress tracking, and shareable publish links.

**Live stack:** Next.js · Cloudflare D1 · Gemini · Render (free tier)

---

## Features

- **Goal-first tour generation** — paste a URL or upload PDF/DOCX/Markdown, state your goal, get a playable tour
- **AI agent distillation** — Reader → Distiller → Ordering → Quality → Pedagogy → Fidelity ops agents
- **Winnie** — global chat assistant on every page; storyboard reorder suggestions + issue flags
- **Voice-guided tours** — Gradium TTS narrates each step (toggle in player or Settings)
- **Branching paths** — macOS / Windows variants where the source calls for it
- **Storyboard editor** — drag-reorder film frames, edit copy, add steps before publishing
- **Tour player** — stuck help, checkpoint gates, source passages, completion finale
- **Accounts** — register/login, tours and progress sync when signed in
- **Publish & share** — public lobby URL, embed snippet, QR code, Open Graph metadata

---

## Quick start (local)

```bash
git clone https://github.com/buildfour/wayfinder.git
cd wayfinder
cp .env.example .env.local
npm install
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Required environment variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | SQLite for local dev (`file:.data/wayfinder.db`) |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) — uses `gemini-3.5-flash` by default |
| `CF_ACCOUNT_ID` | Cloudflare account ID (production D1) |
| `CF_D1_DATABASE_ID` | D1 database UUID (production) |
| `CLOUDFLARE_API_TOKEN` | Token with D1 Edit permission |

Without `GEMINI_API_KEY`, extraction falls back to rule-based heuristics.

---

## Production deployment

**Live:** [https://wayfinder-9qzr.onrender.com](https://wayfinder-9qzr.onrender.com)

| Component | Provider |
| --- | --- |
| Web app + API | [Render](https://render.com) (free web service) |
| Database | [Cloudflare D1](https://developers.cloudflare.com/d1/) |
| AI extraction | [Gemini API](https://ai.google.dev/gemini-api/docs) |

```bash
npm run setup:d1      # provision D1 + run migrations
npm run deploy:render # deploy to Render (requires Render API key in .env)
```

Or connect the GitHub repo in Render Dashboard → **New Blueprint** using `render.yaml`.

Set `NEXT_PUBLIC_APP_URL` to your Render URL after the first deploy.

---

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Landing |
| `/dashboard` | Tour library (orbital orrery) |
| `/new` → `/new/goal` → `/new/processing` → `/new/preview` | Creation flow |
| `/tour/[id]` | Published lobby + share |
| `/tour/[id]/play` | Tour player |
| `/tour/[id]/embed` | Iframe embed |
| `/settings` | Account & preferences |
| `/login`, `/register` | Auth |

---

## API

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/ingest/url` | POST | Fetch and parse a URL |
| `/api/ingest/upload` | POST | Parse PDF, DOCX, Markdown, TXT |
| `/api/extract` | POST | Agent pipeline: distill source → tour steps |
| `/api/winnie/chat` | POST | Winnie global assistant (Gemini) |
| `/api/voice/speak` | POST | Gradium TTS narration |
| `/api/agents/reorder` | POST | Winnie: 3 order suggestions + reorder issue flags |
| `/api/tours/[id]` | GET/PUT | Published tour store |
| `/api/user/tours` | GET/POST | Authenticated tour library |
| `/api/auth/*` | * | NextAuth credentials |

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` | Production build |
| `npm run db:migrate` | Prisma migrate (local SQLite) |
| `npm run setup:d1` | Provision Cloudflare D1 |
| `npm run deploy:render` | Deploy to Render via API |

---

## License

MIT — [buildfour/wayfinder](https://github.com/buildfour/wayfinder)
