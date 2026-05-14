# SchoolBlock

A full-stack school network filter platform. Continuously updated blocklist of gaming sites, proxies, and distraction domains — with an owner dashboard, school partner portal, audit tool, and auto-detection scheduler.

## Stack

- **Frontend**: Vite + React 18, react-router-dom v6
- **Backend**: Node.js + Express, better-sqlite3 (SQLite)
- **Auth**: JWT — separate `type:'owner'` and `type:'school'` tokens
- **Theme**: Editorial Trust design — Fraunces + Newsreader + IBM Plex Mono, accent `#7a2518`

## Project structure

```
schoolblock/
├── backend/
│   ├── schema.sql          # Full DB schema + seed data
│   ├── src/
│   │   ├── index.js        # Express app entry
│   │   ├── db.js           # better-sqlite3 init
│   │   ├── scheduler.js    # Auto-detection (every 2h)
│   │   ├── detection.js    # Domain probing + scoring
│   │   └── routes/
│   │       ├── owner.js    # Owner CRUD dashboard
│   │       ├── school.js   # School dashboard API
│   │       ├── schoolAuth.js
│   │       ├── audit.js    # Audit session + script gen
│   │       ├── list.js     # Public blocklist endpoints
│   │       ├── submit.js   # Public domain submissions
│   │       └── signup.js   # School signup requests
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/     # Nav, Masthead, Hero, etc.
│   │   ├── pages/
│   │   │   ├── owner/      # OwnerDashboard, Queue, Schools, Domains…
│   │   │   └── school/     # SchoolDashboard, Audit, Users, Downloads…
│   │   ├── hooks/
│   │   │   └── useVerificationSlider.js
│   │   └── lib/auth.js
│   └── package.json
└── nginx.conf
```

## Quick start

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env — set JWT_SECRET
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies `/api` to `http://localhost:3001`.

## Features

- **Public site** — Verification gate (swipe slider), live blocklist with filtering, changelog, download formats, domain submission
- **Owner dashboard** — Fast-track & normal review queues, school signup approvals, domain management, bulk import, keyword tuning, detection log, settings
- **School dashboard** — Overview stats, team user management, guided audit tool, audit history, blocklist downloads, domain submission
- **Audit tool** — Generates browser console script, bookmarklet, or curl script; submits results and produces a scored report card (A–F)
- **Auto-detection** — Scheduler probes generated candidate domains every 2h, scores them with keyword + pattern matching, routes to fasttrack/pending queue
- **Download formats** — JSON, plain text, CSV, hosts file

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/list/current` | Full JSON blocklist |
| GET | `/api/list/current.txt` | Plain text (one per line) |
| GET | `/api/list/current.csv` | CSV with category column |
| GET | `/api/list/current.hosts` | hosts file format |
| POST | `/api/submit` | Submit a domain for review |
| POST | `/api/signup` | School signup request |
| GET | `/api/audit/start` | Generate audit script |
| POST | `/api/audit/result` | Submit audit results |
| GET | `/api/audit/result/:token` | Fetch scorecard |
| POST | `/api/owner/login` | Owner auth |
| POST | `/api/school/login` | School user auth |

## Production deployment

See `nginx.conf` for a reference Nginx config with SSL, gzip, rate limiting, and API proxy.

Set environment variables in `backend/.env`:
```
PORT=3001
DB_PATH=./data/schoolblock.db
JWT_SECRET=<long-random-string>
CORS_ORIGIN=https://your-domain.com
```
