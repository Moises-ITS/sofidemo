# SoFi It — demo

Snap a photo of something you want → the agent identifies it, prices it, and
builds a Vault savings plan.

## Run it

```bash
npm install
cp .env.example .env   # then paste your ANTHROPIC_API_KEY into .env

npm run dev:api        # terminal 1 — recognition server on :8787
npm run dev            # terminal 2 — app on http://localhost:5173
```

Camera works on http://localhost only (browsers treat it as a secure
context) — a LAN IP like `http://192.168.x.x:5173` will NOT get camera
access; that needs HTTPS (i.e. the Vercel deploy). The browser and the OS
both need to allow camera access for your browser.

## Deploy to Vercel

Import the repo at vercel.com (the Vite preset is auto-detected;
`api/recognize.js` becomes the serverless recognition endpoint). Then in
**Project → Settings → Environment Variables** add `ANTHROPIC_API_KEY`
(and/or `OPENAI_API_KEY`, plus optional `VISION_PROVIDER` / `SERPAPI_KEY`)
and redeploy. Without the env var, every snap falls back to the demo
product. Camera works on the deployed URL from any device — it's HTTPS.

## How recognition works

`src/screens/Capture.tsx` grabs a downscaled JPEG frame from the viewfinder
and POSTs it to `/api/recognize` (proxied to `server/api.mjs`). The server
asks a vision model to identify the product with **schema-constrained JSON
output** (`{label, emoji, search_query, price, price_low, price_high}`), so
the response always parses. Both providers are supported — Claude structured
outputs or OpenAI strict `json_schema` mode. Set `ANTHROPIC_API_KEY` and/or
`OPENAI_API_KEY`; `VISION_PROVIDER=claude|openai` picks when both are set
(default: claude).

Pricing has two modes:

- **Estimate** (default): Claude's price estimate, shown as "agent estimate".
- **Live prices**: set `SERPAPI_KEY` in `.env` (serpapi.com, free tier) and the
  server pulls real retailer listings from Google Shopping — best price,
  sticker price, and retailer count.

If the API call fails for any reason (no key, offline, timeout), the app falls
back to the canned espresso-machine demo, so the pitch flow never breaks.

`.env` is gitignored — never commit API keys.
