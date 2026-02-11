# Iowa Startups Source

A lightweight public directory of startup credits, perks, and Iowa ecosystem programs.
Backed by Notion (as the CMS) so you can ship without adding new infrastructure.

## Why Notion-backed first?
- You already have the dataset in Notion
- You can update instantly without redeploys
- It’s perfect for v0/v1 of an ecosystem resource

## Setup

### 1) Install
```bash
npm i
npm run dev
```

### 2) Create Notion integration
- Notion → Settings → Connections → Develop or manage integrations
- Create integration, copy secret

### 3) Share the databases to the integration
- Your Programs database
- Your Suggestions database (create a second DB with fields listed below)

### 4) Set env vars
Copy `.env.example` to `.env.local` and fill in:

- `NOTION_TOKEN`
- `NOTION_PROGRAMS_DB_ID`
- `NOTION_SUGGESTIONS_DB_ID`

### Suggestions DB fields (recommended)
Create a Notion DB called “Iowa Startups Source — Suggestions” with:
- Title (title property, named: **Title**)
- Program ID (rich text)
- Notes (rich text)
- Email (rich text)
- Status (select: Pending, Approved, Rejected)

## Deploy (Netlify)
- Connect repo to Netlify
- Set build command: `npm run build`
- Add the Netlify Next.js plugin (already in netlify.toml)
- Add env vars in Netlify UI (same as .env.local)

## Roadmap
- v1: Notion-backed directory + suggestions
- v2: Add automated source monitoring (hash diff) + admin review queue
- v3: Publish “Iowa Credits Pack” + curated stacks for AI/health/insurance/edtech

Built by Ikwe.ai
