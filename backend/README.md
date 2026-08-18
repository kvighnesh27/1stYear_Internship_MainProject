# Aegis — OSINT Threat Intelligence Platform

Aegis is a full-stack OSINT (Open Source Intelligence) reconnaissance tool. A user submits a target — a domain, email, or keyword — and the system gathers data from public sources (search engines, news, certificate transparency logs, DNS), then runs it through a **dual-agent AI pipeline** to produce a structured threat report: an executive summary, threat actor exploitation analysis, and remediation recommendations.

Company accounts are restricted to scanning their own approved company domain; individual accounts can scan any valid target. All scans, sources, and AI reports are persisted per-user and available as history, with a one-click PDF export of the detailed report.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| Backend | Flask, Flask-JWT-Extended, Flask-SQLAlchemy, Flask-CORS, Flask-Limiter |
| Database | MySQL 8 |
| AI | Google Gemini (`google-genai` SDK) — dual-agent: a detailed analyst model and a summary/"sarcastic dashboard" model |
| OSINT sources | SerpApi (Google Search, News, Scholar, Maps, Jobs, YouTube, Play Store), crt.sh (certificate transparency), public DNS |
| PDF export | `jspdf`, generated client-side in the browser |

## Architecture

```
┌─────────────┐      JWT-authenticated REST      ┌──────────────┐      ┌───────────┐
│   Next.js   │ ───────────────────────────────► │    Flask     │ ───► │   MySQL   │
│  Frontend   │ ◄─────────────────────────────── │   Backend    │      └───────────┘
└─────────────┘                                  └──────┬───────┘
                                                         │
                                  ┌──────────────────────┼──────────────────────┐
                                  ▼                      ▼                      ▼
                            crt.sh / DNS            SerpApi (7 engines)    Gemini (2 agents)
                          (corporate domains      (search, news, jobs,    (detailed report +
                            only)                  maps, scholar, etc.)    sarcastic summary)
```

## Project Structure

```
.
├── app.py                     # Flask backend — all routes, OSINT pipeline, AI orchestration
├── models.py                  # SQLAlchemy models (User, ScanResult, FetchedSource, Review, AIReport)
├── schema.sql                 # MySQL DDL — run this to provision the database
├── .env.example                # Backend environment variable template
│
└── frontend/                  # Next.js application
    ├── app/
    │   ├── page.tsx            # Landing page
    │   ├── login/page.tsx
    │   ├── register/page.tsx
    │   └── dashboard/page.tsx  # Authenticated dashboard shell
    ├── components/
    │   ├── auth-form.tsx
    │   ├── dashboard/
    │   │   ├── scan-console.tsx              # Run scan
    │   │   ├── ai-analysis.tsx                # Dual-agent report + PDF export
    │   │   ├── infrastructure-visualization.tsx
    │   │   ├── source-explorer.tsx
    │   │   ├── history-center.tsx
    │   │   ├── admin-panel.tsx                # Approve/reject company accounts
    │   │   └── command-center.tsx
    │   └── ui/                  # Shared button/card/input primitives
    ├── lib/
    │   ├── api.ts               # Typed fetch client for the Flask API
    │   └── generate-report-pdf.ts  # Client-side PDF builder for the detailed report
    ├── store/
    │   └── auth-context.tsx     # Session/token/scan state
    └── .env.example             # Frontend environment variable template
```

## API Reference

All routes are prefixed and served from the Flask backend.

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Register a new individual or company account |
| `POST` | `/api/auth/login` | — | Log in, returns a JWT |
| `GET` | `/api/admin/pending-users` | Admin JWT | List company accounts awaiting approval |
| `POST` | `/api/admin/review-request` | Admin JWT | Approve or reject a pending company account |
| `GET` | `/api/v1/history` | JWT | List the authenticated user's past scans |
| `POST` | `/api/v1/scan` | JWT | Run a new OSINT scan and AI analysis (rate-limited) |

Company-role accounts always scan their own `company_name` on file (set at registration, locked until approved); the `target_input` field is ignored for them. Individual accounts supply `target_input` directly, which is classified as a domain, email, or keyword before the OSINT pipeline runs.

## Database Schema

The database is MySQL. Run `schema.sql` against your MySQL server to create it:

```bash
mysql -u root -p < schema.sql
```

This creates `osint_db_checking` with five tables: `users`, `scan_results`, `fetched_sources`, `ai_reports`, and `reviews`, with foreign keys cascading on delete. `models.py` mirrors this schema for SQLAlchemy and is the source of truth the Flask app actually uses at runtime — keep both in sync if you change one.

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- MySQL 8+
- A [Gemini API key](https://ai.google.dev/) (free tier available, with daily request limits)
- A [SerpApi key](https://serpapi.com/) for search/news/jobs/maps/scholar/YouTube/Play Store data

### Backend

```bash
# 1. Provision the database
mysql -u root -p < schema.sql

# 2. Install dependencies
pip install flask flask-sqlalchemy flask-jwt-extended flask-cors flask-limiter \
            google-genai requests python-dotenv mysqlclient

# 3. Configure environment
cp .env.example .env
# then fill in: DATABASE_URL, JWT_SECRET_KEY, GEMINI_API_KEY, SERPAPI_API_KEY

# 4. Run
python app.py
```

The backend listens on `http://localhost:5000` by default and accepts requests from `http://localhost:3000` (configured in the `CORS()` call in `app.py`).

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# set NEXT_PUBLIC_API_BASE_URL if the backend isn't on http://localhost:5000

npm run dev
```

The app runs at `http://localhost:3000`.

### Environment Variables

**Backend (`.env`)**

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLAlchemy MySQL connection string, e.g. `mysql://user:pass@localhost/osint_db_checking` |
| `JWT_SECRET_KEY` | Secret used to sign auth tokens — use a long random string |
| `GEMINI_API_KEY` | Google Gemini API key |
| `SERPAPI_API_KEY` | SerpApi key for the OSINT search engines |

**Frontend (`.env.local`)**

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the Flask backend (default `http://localhost:5000`) |

## How a Scan Works

1. The user submits a target (or, for company accounts, the approved company name is used automatically).
2. The target is sanitized and classified as a `corporate_domain`, `personal_email`, or generic keyword.
3. For domains, certificate transparency (`crt.sh`) and passive DNS are queried for infrastructure data.
4. Up to seven SerpApi engines run concurrently to gather public mentions, news, jobs, and listings.
5. The combined OSINT context is sent to two Gemini agents in parallel: one produces a detailed corporate threat report (executive summary, threat actor exploitation, remediation), the other produces a short, plain-language "sarcastic dashboard" summary.
6. Results are persisted (`ScanResult`, `FetchedSource`, `AIReport`) and returned to the frontend, which renders the dashboard, infrastructure map, source list, and AI report — with a PDF export of the detailed report available on demand.

External calls (SerpApi, crt.sh, Gemini) retry automatically on transient failures rather than failing a scan outright, since OSINT sources are not always reliable.

## Known Limitations

- **Gemini free tier** caps requests per day; once exhausted, the AI sections of a report fall back to a clear error message rather than a fabricated one. The report still includes all OSINT data gathered (sources, infrastructure) even if the AI summary is unavailable.
- **crt.sh** is a free public service and can be slow for high-traffic domains; the backend retries before giving up.
- The Flask development server (`app.run()`) is intended for local development. Use a production WSGI server (e.g. Gunicorn) and a managed MySQL instance before deploying.

## License

Add your license of choice here before publishing (e.g. MIT, Apache 2.0).