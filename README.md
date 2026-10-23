# Event Manager

A four-step requirement posting flow for GoPratle. Built with Next.js, Express, and MongoDB through Mongoose.

## Run locally

Use Node.js 22 or newer and npm.

```sh
npm ci
```

Copy `backend/.env.example` to `backend/.env`, and `frontend/.env.example` to `frontend/.env.local`. Set `DATABASE_URL` to a local MongoDB or Atlas connection string. Environment files are ignored by Git.

```sh
npm run dev
```

The frontend runs at `http://localhost:3000` and the API at `http://localhost:4000`. The API connects to MongoDB before accepting requests. `MONGODB_DB_NAME` defaults to `event-manager`, overriding the database name in the connection string.

## Structure

```text
frontend/src/
  app/                 Page, layout, and styles
  components/          Wizard and individual steps
  lib/                 Form types, validation helpers, API client
backend/src/
  models/              Mongoose requirement discriminators
  routes/              Submission endpoint
  app.ts               Express middleware and routes
  server.ts            Database connection and server startup
backend/test/          API tests against a temporary MongoDB instance
shared/src/            Zod schemas, field options, and payload types
```

The small shared package keeps browser and server validation consistent. Its compiled output is built before either application.

## Flow and assumptions

1. **Event basics:** name, event type, date or date range, location, optional venue, and category.
2. **Requirements:** planning services and guests; performer type and headcount; or crew roles with a count for each.
3. **Budget and details:** total budget in INR, optional notes, and performance duration/equipment or crew shift duration where applicable.
4. **Review and post:** editable summary followed by a saved requirement ID.

Each post belongs to one category. Changing category clears its service fields while preserving event and budget information. Back navigation preserves inputs. Form data stays in memory until the page reloads; it is only saved to MongoDB on submission.

Dates are calendar strings (`YYYY-MM-DD`) to avoid timezone shifts. A single-day event has matching start/end dates. Past dates are allowed because the brief does not specify a restriction. Budgets represent the total category requirement, not a per-person rate. There is no payment or vendor matching flow.

## API

`GET /api/health` returns `200` when MongoDB is connected, otherwise `503`.

`POST /api/requirements` accepts JSON with a UUID v4 `Idempotency-Key` header. Example payload:

```json
{
  "category": "performer",
  "event": {
    "name": "Annual company celebration",
    "type": "Corporate event",
    "startDate": "2027-12-12",
    "endDate": "2027-12-12",
    "location": "Bengaluru",
    "venue": "Garden Hall"
  },
  "details": {
    "performerType": "Live band",
    "performerCount": 4,
    "durationMinutes": 90,
    "equipment": "Provided at venue"
  },
  "budget": { "min": 20000, "max": 40000, "currency": "INR" },
  "notes": "An acoustic set during dinner."
}
```

A successful request returns `201`:

```json
{
  "message": "Requirement posted successfully.",
  "requirement": {
    "id": "<MongoDB document ID>",
    "category": "performer",
    "createdAt": "<ISO timestamp>"
  }
}
```

Validation errors return `422` with `errors: [{ field, message }]`. Missing/invalid keys and malformed JSON return `400`, conflicting retries `409`, oversized bodies `413`, rate limiting `429`, and database failures `503`.

Mongoose discriminators store the three category schemas in one `requirements` collection, with a category/creation-time index. A unique request key prevents duplicate records from concurrent clicks or network retries. The same key and payload return the original ID with `200`; changed data requires a new key. There is no public endpoint exposing saved submissions.

## Checks

```sh
npm run typecheck
npm test
npm run build
```

API tests use `mongodb-memory-server`, which downloads a MongoDB binary on first run. Tests never use the configured Atlas connection. They cover all three category saves, invalid dates and budgets, category mismatches, crew counts, retry conflicts/concurrency, malformed requests, CORS, and rate limiting.

For a browser walkthrough, submit one requirement per category. Also try an empty step, a reversed date range, switching categories, editing from review, and submitting while the API is stopped. A failed request should preserve entered values and allow retry.

## Deployment

**Backend on Render:** use the repository root as the service root. Set the build command to `npm ci && npm run build -w shared && npm run build -w backend` and the start command to `npm run start -w backend`. Set the health check to `/api/health`.

Set `DATABASE_URL`, `MONGODB_DB_NAME=event-manager`, `CLIENT_ORIGIN=https://your-frontend-domain`, `NODE_ENV=production`, and `TRUST_PROXY=1`. Render supplies `PORT`. Configure Atlas network access for the backend host. Multiple approved frontend origins can be comma-separated in `CLIENT_ORIGIN`.

**Frontend on Vercel:** select `frontend` as the root directory and enable access to source files outside the root. Use `cd .. && npm ci` as the install command and `cd .. && npm run build -w shared && npm run build -w frontend` as the build command. Keep the Next.js output directory default. Set `NEXT_PUBLIC_API_URL` to the deployed Express origin before building. Redeploy after changing it.

Finally, update backend CORS with the actual frontend URL and submit a requirement through that URL. Database credentials belong only on the backend.

## Scope and next steps

Authentication, account ownership, saved drafts, uploads, notifications, and editing after submission are outside this assignment. Before opening this as a public service, add account-based access, abuse controls beyond IP rate limiting, and monitoring. Useful product additions would be draft recovery and a dashboard for managing posted requirements.

For the 5–7 minute recording, spend roughly two minutes on the flow and category branches, two on the frontend/shared schemas and Express/Mongoose implementation, one on the network response and corresponding MongoDB document, and the remaining time on tests, assumptions, and improvements.
