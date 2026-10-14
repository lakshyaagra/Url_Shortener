# URL Shortener

A full-stack URL shortener: a production-style REST API (Express, PostgreSQL, Redis) with a React dashboard. Users sign up, create short links, manage them, and see click analytics.

- **Live app:** <your-frontend-url>
- **Live API health check:** https://url-shortener-latest-dgdp.onrender.com/health
- **API documentation, design decisions and test notes:** [backend/README.md](backend/README.md)

The free hosting tier sleeps when idle, so the first request after a quiet period can take up to a minute.

## What it does

- Register and log in (JWT authentication, bcrypt password hashing)
- Create, edit, activate/deactivate, expire and delete short links (each user can only touch their own)
- Public redirect endpoint that records every click
- Per-link analytics: total clicks, clicks per day, referrers, recent clicks

## Repository layout

```
backend/    Express API, Prisma 8 + PostgreSQL, Redis cache and rate limiting, Docker, tests
frontend/   React + Vite + Tailwind dashboard
.github/    CI/CD: tests, Docker build and smoke test, deploy, production verification
```

## How it fits together

```
Browser (React)  ->  Express API  ->  Redis (cache-aside for redirects)
                                  ->  PostgreSQL (source of truth)
```

- Redirects check Redis first and fall back to PostgreSQL, so a Redis outage only makes the app slower.
- Every write invalidates the cache after the database write succeeds.
- A push to `main` that changes the backend runs the tests, builds and smoke-tests the Docker image, deploys it, and then verifies that `/health` reports the deployed commit.

## Run it locally

Backend (needs Docker): see [backend/README.md](backend/README.md) for the environment file, then:

```bash
cd backend
docker compose --env-file .env.docker up --build
```

Frontend:

```bash
cd frontend
cp .env.example .env     # VITE_API_URL=http://localhost:3000
npm install
npm run dev              # http://localhost:5173
```

## Decisions worth knowing

- JWT is kept in `localStorage` for simplicity. An httpOnly cookie would reduce XSS exposure but needs backend changes.
- No frontend data library: a small `useFetch` hook and reload-after-change are enough at this size.
- Deliberately not included: Kubernetes, message queues, microservices. The workload does not need them.