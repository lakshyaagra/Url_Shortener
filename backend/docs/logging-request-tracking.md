Day 13 --- Logging & Request Tracking

## Why logging matters

Logging helps answer: - Which request happened? - When did it happen? - Which endpoint was called? - What status code was returned? - How long did it take? - If it failed, what error occurred? - Can we correlate a user's reported failure with server logs?

console.log() is fine for quick development, but production-oriented applications benefit from consistent, structured logs.

## Request ID Middleware

File: src/middleware/request-id.middleware.js

import crypto from 'node:crypto';

export function requestIdMiddleware(req, res, next) { 
    const requestId = crypto.randomUUID();

    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    next(); 
}

What it does

Every request receives a unique identifier.

Incoming request
      ↓
crypto.randomUUID()
      ↓
Unique request ID
      ↓
req.requestId
      +
X-Request-ID response header

req.requestId lets downstream middleware/controllers/error handling access the same identifier. The response header lets the client see it.

Why **UUID**?

crypto.randomUUID() gives us a practical unique identifier without maintaining a global counter or adding a dependency.

## Request Logger Middleware

File: src/middleware/request-logger.middleware.js

export function requestLoggerMiddleware(req, res, next) { 
    const startTime = process.hrtime.bigint();

    res.on('finish', () => {
    const endTime = process.hrtime.bigint();

    const durationMs =
    Number(endTime - startTime) / 1_000_000;

    console.log(
            **JSON**.stringify({
            type: 'request',
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: Number(durationMs.toFixed(2)),
        })
    );
});

next(); }

Request lifecycle

Request arrives
      ↓
startTime recorded
      ↓
next()
      ↓
Express processes request
      ↓
Controller / Service / DB
      ↓
Response
      ↓
finish event
      ↓
endTime recorded
      ↓
duration calculated
      ↓
structured log

Why res.on('finish')?

We want the final **HTTP** status code and total processing time. Logging before the request finishes would not reliably give us the final result.

Why process.hrtime.bigint()?

It gives a high-resolution elapsed-time measurement. We subtract start from end and convert nanoseconds to milliseconds.

Example:

**GET** /health → **200** → 2.41ms **POST** /api/v1/urls → **201** → 17.84ms

## Why structured JSON logs?

Instead of:

**GET** /health **200**

we generate something like:

{
    *type*: *request*,
    *requestId*: *abc-**123***,
    *method*: *GET*,
    *path*: */health*,
    *statusCode*: **200**,
    *durationMs*: 2.41
}

Machines can easily parse structured fields. Later, logs can be searched and filtered by status, request ID, duration, endpoint, and so on.

## Error logging

The centralized error middleware should include request context:

console.error(
    **JSON**.stringify({
        type: 'error',
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        errorName: err.name,
        errorCode: err.code,
        message: err.message,
        stack: err.stack,
    })
);

The server can keep detailed diagnostics while the client receives a safe response.

For an unexpected error:

{
    *success*: false,
    *message*: *Internal server error*
}

Do not expose stack traces, internal paths, database details, or secrets to normal **API** clients.

## Never log sensitive information

Never blindly do:

console.log(req.body);

A login body may contain:

{
    *email*: *[user@example.com](mailto:user@example.com)*,
    *password*: *secret*
}

Also avoid logging all headers because they may contain:

Authorization: Bearer <**JWT**>

Never log: - passwords - password hashes - JWTs - **JWT** secrets - database URLs - **API** keys - other credentials

Logs should themselves be treated as sensitive operational data.

## Middleware ordering

Our application flow is approximately:

Request ↓ Request ID ↓ ### Request Logger ↓ Helmet ↓ **CORS** ↓ **JSON** body limit ↓ Rate limiter ↓ Routes ↓ Validation / Authentication ↓ Controller ↓ Service ↓ Database ↓ Response ↓ Request log

Putting the request ID near the beginning ensures downstream code and error handling can use it.

## Morgan

What is Morgan?

Morgan is a lightweight **HTTP**/access request logger commonly used with Express.

It can produce logs conceptually like:

**POST** /api/v1/auth/login **401** 42 ms

It is excellent when you want quick conventional **HTTP** request logging.

Can we use Morgan?

Yes. Absolutely.

Morgan is not a bad choice for this project.

Why are we not using it?

Initially its about studying the mechanism rather than hiding it behind a package.

We want to understand: - middleware execution - request lifecycle - request IDs - response finish - duration measurement - structured logging - error correlation - sensitive-data concerns

After understanding those concepts, using Morgan becomes a deliberate choice rather than a copy-paste dependency.

## Winston

Winston is a general-purpose Node.js logging library.

It provides features such as: - log levels - formatting - transports - multiple output destinations - console/file logging - structured logging - configurable logging behavior

Conceptually:

Application
    ↓
    Winston
    ├── Console
    ├── File
    └── Other transport

It is more than an Express access logger.

10. Pino

Pino is another Node.js logging library, strongly oriented toward high-performance structured logging.

Conceptually:

Application
    ↓
    Pino
    ↓
Structured **JSON** logs

It supports log levels and structured logging and is commonly chosen when efficient logging is important.

## Winston vs Pino

Very broadly:

                        Winston                    Pino

General application     Excellent                  Excellent logging
Structured logs         Yes                        Yes
Log levels              Yes                        Yes
Multiple                Strong                     Available through outputs/transports                                         ecosystem/configuration
Performance focus       Good                       Very strong
**JSON** logging        Yes                        Excellent
Style                   Flexible/general-purpose   Performance-oriented

Neither is automatically the correct choice.

## Why are we not using Winston/Pino yet?

Reason 1 --- Learning

We first want to understand what logging actually does.

Reason 2 --- Project scope

This is currently a single Express application. A dedicated logging abstraction is not mandatory yet.

Reason 3 --- We can revisit later

Once deployment and production concerns arrive, we can decide whether a dedicated logger is worthwhile.

## Logging architecture

    Request
    │
    ▼
    Request ID
    │
    ▼
    Request Logger
    │
    ▼
    Express
    │
    ┌──────┴──────┐
    ▼             ▼
    Success        Error
    │             │
    ▼             ▼
    Response    Error Middleware
    │             │
    └──────┬──────┘
           ▼
    Structured Log

## Interview answers

Why request IDs?
To correlate an individual request across middleware, application logs, and error logs.

Why structured logs?
They are machine-readable and easier to search, filter, aggregate, and analyze.

Why not log request bodies?
They may contain passwords, tokens, personal information, or other sensitive data.

Morgan vs Winston?
Morgan is primarily an **HTTP**/access logger for Express. Winston is a general-purpose application logging library.

Morgan vs Pino?
Morgan focuses on **HTTP** request logging. Pino is a general structured application logger with a strong performance focus.

Why not immediately use a logging library?
Understanding the request lifecycle and logging fundamentals first makes the abstraction meaningful and avoids unnecessary dependencies.

Why not return stack traces?
They can expose internal implementation details and should remain server-side.

## Day 13 checklist

Request ID generated

X-Request-ID response header

**HTTP** method logged

Request path logged

Final status code logged

Request duration logged

Structured **JSON** logs

Error logs include request ID

No passwords/tokens/secrets in logs

Safe **500** responses

**404** logging verified

Validation failure logging verified

Unexpected error behavior verified