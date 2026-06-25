# 🔥 Fontinder

Hot-or-not / Tinder for embroidery fonts. People swipe right to **keep** a font
or left to **pass**, and a live leaderboard surfaces the best ones — the goal is
to crowd-pick the best **25 fonts** for the embroidery designer.

Built with Next.js (App Router) + Tailwind + Framer Motion, with vote tallies
stored in **Upstash Redis** (Vercel KV). Designed to deploy on Vercel.

---

## How it works

- Each Tajima font ships with a preview image (`*_fon.pcx` / `*_fon.jpg`). A
  Python script converts all of them to PNGs in `public/previews/` and writes a
  manifest to `lib/fonts.json` (268 fonts).
- The home page deals those previews as a swipeable card deck. Each swipe POSTs
  a `like`/`nope` to `/api/vote`.
- **One vote per font per device**: judged fonts are remembered in the browser's
  `localStorage`, so people don't re-vote the same font.
- The leaderboard ranks fonts by a **Wilson score** (a high like-rate only wins
  once it has enough votes — a single 100% vote won't top the chart).

## Local development

```bash
cd fontinder
npm install
npm run dev          # http://localhost:3000
```

Without Redis env vars, votes are stored in a local file (`.data/votes.json`)
so you can test the full flow offline.

### Regenerating previews

The previews are already committed. To rebuild them from the raw font archive:

```bash
npm run convert      # reads ../_extracted, writes public/previews + lib/fonts.json
```

(Requires Python 3 with Pillow: `pip3 install Pillow`.)

## Deploying to Vercel

1. Push this `fontinder/` folder to a Git repo and **import it into Vercel**
   (set the project root to `fontinder` if the repo has other folders).
2. In the Vercel dashboard: **Storage → Create Database → Upstash for Redis**,
   then **Connect** it to the project. Vercel injects `KV_REST_API_URL` and
   `KV_REST_API_TOKEN` automatically — the app uses Redis the moment they exist.
3. Redeploy. That's it.

For local testing against the real database, copy `.env.example` to `.env.local`
and paste the two values from the Vercel Storage tab.

## Getting the winning 25

The leaderboard page (`/leaderboard`) highlights the top 25 (the cut for the
designer). To pull the full ranking as JSON:

```bash
curl https://YOUR-DEPLOYMENT.vercel.app/api/leaderboard | jq '.board[:25]'
```

Each entry includes `name`, `slug`, `likes`, `nopes`, `pct`, and `score`. The
`slug`/`name` map back to the original `.fon` files in the Tajima archive.

## Project layout

```
fontinder/
├─ app/
│  ├─ page.tsx              # swipe deck page
│  ├─ leaderboard/page.tsx  # rankings + top-25 cut
│  └─ api/
│     ├─ vote/route.ts      # POST a like/nope
│     ├─ leaderboard/route.ts
│     └─ fonts/route.ts
├─ components/SwipeDeck.tsx  # the Tinder-style card stack
├─ lib/
│  ├─ store.ts              # Redis / file vote storage + scoring
│  └─ fonts.json            # generated manifest
├─ public/previews/         # generated PNG previews
└─ scripts/convert_previews.py
```
