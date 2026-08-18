# Aegis OSINT Frontend

Next.js 15 frontend for the existing Flask + SQLAlchemy OSINT Threat Intelligence backend.

## Backend Contract Used

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/admin/pending-users`
- `POST /api/admin/review-request`
- `GET /api/v1/history`
- `POST /api/v1/scan`

No backend routes or database schema are modified. AI report, source intelligence, and infrastructure views use the real scan response fields returned by `/api/v1/scan`.

## Run

```bash
npm install
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Set `NEXT_PUBLIC_API_BASE_URL` if your Flask API is not running at `http://localhost:5000`.
