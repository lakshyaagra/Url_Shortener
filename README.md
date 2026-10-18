# Linkly API (URL Shortener backend)

[![CI/CD](https://github.com/lakshyaagra/Url_Shortener/actions/workflows/ci.yml/badge.svg)](https://github.com/lakshyaagra/Url_Shortener/actions/workflows/ci.yml)

The backend of [Linkly](../README.md): JWT authentication, per-user link management, click analytics, Redis caching, Docker, automated tests and a CI/CD pipeline that deploys to Render.

Live API: https://url-shortener-latest-dgdp.onrender.com (health check: https://url-shortener-latest-dgdp.onrender.com/health)

Hosted on Render's free tier, so the first request after a quiet period can take about a minute while the service wakes up.

## Features

- Register and log in (bcrypt password hashing, JWT)
- Create, list, update and delete your own short links; ownership is enforced on every query
- Public link creation without an account (10 per hour per IP); these links belong to a reserved account, so nobody can edit, delete or list them
- Public redirect with expiry and active/inactive handling (410 Gone for expired or deactivated links)
- Click analytics per link: total clicks, clicks per day, recent clicks (paginated) and a referrer breakdown
- Pagination, filtering and sorting on the link list, with a click count per link
- Redis cache for redirects and Redis-backed rate limiting, with automatic fallback to PostgreSQL if Redis is unavailable
- Structured JSON logs with a request ID on every request and response (`X-Request-ID`)
- Automated integration tests that run on every push and pull request

## Architecture

```text
               +----------------------------------------------+
               | Client: React frontend, Postman or browser   |
               +----------------------------------------------+
                                       | HTTPS + JSON
                                       v
  +------------------------------------------------------------------------+
  | Render web service: Docker container, Node.js 24                       |
  |                                                                        |
  | Express API                                                            |
  |   Middleware, in order:                                                |
  |     request ID > logger > Helmet > CORS > 10 kb JSON limit             |
  |     > rate limiters > JWT auth > request validation                    |
  |                                                                        |
  |   Routes > Controllers > Services > Prisma database layer              |
  +------------------------------------------------------------------------+
                    | cache + rate limit counters         | SQL queries
                    v                                     v
    +--------------------------------+      +------------------------------+
    | Redis 8                        |      | PostgreSQL 17 (Prisma)       |
    | - redirect cache (10 min)      |      | - users                      |
    | - redirect rate limiter        |      | - urls                       |
    +--------------------------------+      | - clicks                     |
                                            +------------------------------+
```

### How a redirect works

`GET /api/v1/urls/:shortCode`

1. The Redis rate limiter allows 60 requests per minute per IP; beyond that the API returns 429.
2. The code is looked up in Redis. On a miss, the link is read from PostgreSQL and cached for 10 minutes.
3. A missing link returns 404. An inactive or expired link returns 410.
4. The click (IP address, user agent, referrer) is recorded in PostgreSQL.
5. The API answers 302 with the original URL.

If Redis is unavailable, steps 1 and 2 are skipped and the link is read straight from PostgreSQL.

## Tech stack

| Area | Technology |
|---|---|
| Runtime | Node.js 24, Express |
| Database | PostgreSQL 17, Prisma 8 (release candidate) |
| Cache | Redis 8 |
| Security | Helmet, CORS, bcrypt, JWT, request validation, rate limiting |
| Containers | Docker, Docker Compose |
| CI/CD | GitHub Actions, GitHub Container Registry, Render |
| Testing | Node test runner, Supertest (real PostgreSQL) |

## API

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | No | Create an account |
| POST | `/api/v1/auth/login` | No | Log in and receive a JWT |
| POST | `/api/v1/urls/public` | No | Create a short link without an account (10 per hour per IP); cannot be edited |
| GET | `/api/v1/urls` | Yes | List your links with click counts (`page`, `limit`, `isActive`, `sortBy`, `order`) |
| POST | `/api/v1/urls` | Yes | Create a short link in your account |
| PATCH | `/api/v1/urls/:shortCode` | Yes | Update the destination, set an expiry, or change the active flag |
| DELETE | `/api/v1/urls/:shortCode` | Yes | Delete a link |
| GET | `/api/v1/urls/:shortCode/analytics` | Yes | Click analytics for one link |
| GET | `/api/v1/urls/:shortCode` | No | Redirect (302) to the original URL |
| GET | `/health` | No | Health check; includes the deployed commit SHA |

## Run it locally

Requires Docker. Run these from the `backend/` folder.

```bash
cp .env.example .env.docker      # then fill in the values
docker compose --env-file .env.docker up -d --build
docker compose --env-file .env.docker exec api sh -c 'npx prisma db init --db "$DATABASE_URL" --yes'   # fresh database only
curl http://localhost:3000/health
```

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Docker Compose builds its own from the `POSTGRES_*` values) |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | At least 32 characters |
| `JWT_EXPIRES_IN` | For example `1h` |
| `BCRYPT_SALT_ROUNDS` | For example `12` |
| `FRONTEND_URL` | The one browser origin allowed by CORS |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Read by `compose.yaml` for the PostgreSQL container |
| `PORT` | 3000 locally; injected by the host in production |

## Automated testing

Tests use Node's built-in test runner and Supertest. They run the real application against a real PostgreSQL database, with no mocked database.

| Area | What is checked |
|---|---|
| Authentication | Registration, invalid email rejected, duplicate email rejected, login, wrong credentials rejected |
| Links | Create a link, invalid URL rejected, unauthenticated access blocked, list a user's links, link stored in PostgreSQL |
| Redirect | Known code redirects with 302, unknown code returns 404 |
| Rate limiting | The general rate limiter returns 429 after the limit |
| Health | `/health` returns 200 |

The automated tests run without a Redis connection, so they exercise the PostgreSQL fallback path. The Redis cache, its invalidation and the Redis rate limiter are verified with a Postman collection run against the deployed service.

Run the tests locally with PostgreSQL available. Create a `.env.test` file with the variables above, and point `DATABASE_URL` at a dedicated test database, never at data you care about:

```bash
npm ci
npm test
```

In CI, every push and pull request starts PostgreSQL 17 and Redis 8 as service containers, creates the schema with Prisma, and runs the same `npm test`. A failing test blocks deployment.

## Design decisions

- **Short codes.** Six random alphanumeric characters generated with `crypto.randomInt`. The database `UNIQUE` constraint is the real guarantee (two concurrent requests can pass an application-level check); the service checks for collisions and retries.
- **Cache-aside with Redis.** Redirect lookups are cached for 10 minutes. Every write goes to PostgreSQL first and then deletes the cache entry, so changes apply immediately and a concurrent redirect cannot re-cache stale data.
- **Graceful degradation.** The cache and the Redis rate limiter check that Redis is ready. If it is not, requests are served from PostgreSQL instead of failing.
- **Layered rate limiting.** 100 requests per 15 minutes in general, 10 per 15 minutes on login and register, a Redis-backed 60 per minute per IP on redirects, and 10 per hour per IP on public link creation.
- **Ownership by query.** Updates and deletes query by short code and authenticated user together, so another user's link looks like "not found".
- **Anonymous links.** Public links belong to a reserved account nobody can log into, so they cannot be edited, deleted or listed by anyone.
- **Timestamps.** Columns are `timestamp without time zone` holding UTC wall-clock time, which the ORM reads and writes as `Temporal.PlainDateTime`, so expiry checks compare against the current UTC time.
- **Indexes chosen from the queries.** A unique index on `short_code`, `(user_id, created_at)` for listing and `(url_id, clicked_at)` for analytics.

### Measured effect of an index

Local PostgreSQL, 200,000 URLs and 500,000 clicks of synthetic data, measured with `EXPLAIN ANALYZE`:

| Query | Without index | With index |
|---|---|---|
| Latest 10 clicks of one URL | about 108 ms (sequential scan and sort) | about 0.05 ms |
| Redirect lookup by short code | not measured | about 0.3 ms |

## CI/CD

The workflow lives in `.github/workflows/ci.yml` at the repository root and runs for changes under `backend/`.

```text
                        +----------------------------+
                        | Push to main               |
                        +----------------------------+
                                       |
                  +--------------------+-------------------+
                  v                                        v
 +--------------------------------+       +--------------------------------+
 | test                           |       | docker                         |
 | PostgreSQL 17 + Redis 8        |       | build image                    |
 | service containers             |       | smoke test: /health            |
 | npm test                       |       | push to GHCR (tag = SHA)       |
 +--------------------------------+       +--------------------------------+
                  |                                        |
                  +--------------------+-------------------+
                                       v
                +--------------------------------------------+
                | deploy (needs: test and docker)            |
                | Render deploy hook, image tag = SHA        |
                +--------------------------------------------+
                                       v
                +--------------------------------------------+
                | verify                                     |
                | poll /health until the commit SHA matches  |
                +--------------------------------------------+
```

- Pull requests run the tests and the Docker build, and never deploy.
- The image is built once, smoke-tested, and pushed with the commit SHA as its tag. That exact image is what runs in production.
- Deployment needs both CI jobs to pass and only happens for pushes to `main`.
- After deploying, the pipeline waits until `/health` reports the new commit, so a deploy only counts as finished when the new version is actually live.
- Rolling back means redeploying an earlier image tag.
- CI uses throwaway credentials. Production secrets exist only in Render; GitHub holds only the deploy hook.

## Project structure

```text
backend/
  src/
    app.js            Express app and middleware order
    server.js         Startup: anonymous account, Redis connection, then listen
    config/           Environment validation, Redis client
    routes/           Route definitions
    controllers/      HTTP layer
    services/         Business logic, cache, rate limit and anonymous-account services
    middleware/       Auth, validation, logging, rate limits, errors
    prisma/           Database contract and client
    utils/            Short codes, async handler, expiry check
    tests/            Integration tests
  migrations/         Prisma migrations
  compose.yaml        API, PostgreSQL and Redis for local development
  Dockerfile
  .github/workflows/ci.yml   CI/CD pipeline
```
