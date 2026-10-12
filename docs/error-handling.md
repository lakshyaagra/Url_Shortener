# Error Handling in Express.js — URL Shortener Notes

## 1. What is Error Handling?

Error handling means deciding what the application should do when something goes wrong.

Examples:

- User sends invalid input
- User is not authenticated
- URL does not exist
- User tries to update another user's URL
- Database operation fails
- Unexpected programming/runtime error occurs

A production API should:

1. Detect the error
2. Stop the normal request flow
3. Decide the correct HTTP status
4. Return a safe, consistent response
5. Log useful details on the server
6. Avoid leaking internal implementation details to the client

---

## 2. Why Error Handling Matters

Without proper error handling, an API can:

- crash unexpectedly
- return inconsistent responses
- expose database/internal errors
- duplicate `try/catch` logic everywhere
- become difficult to maintain

Bad pattern:

```js
try {
  // controller logic
} catch (error) {
  return res.status(500).json({
    success: false,
    message: "Something went wrong",
  });
}
```

If every controller does this, the same logic gets repeated across the project.

Better:

```text
Controller
    ↓
throw / next(error)
    ↓
Central Error Middleware
    ↓
HTTP Response
```

---

# 3. Error Categories

## A. Validation Errors

The client sent invalid input.

Examples:

```json
{
  "originalUrl": "hello"
}
```

or:

```json
{
  "password": "123"
}
```

Usually:

```text
400 Bad Request
```

These are handled by validation middleware.

---

## B. Authentication Errors

The client has not successfully authenticated.

Examples:

- Missing JWT
- Invalid JWT
- Expired JWT

Usually:

```text
401 Unauthorized
```

Handled by:

```text
auth.middleware.js
```

---

## C. Authorization / Ownership Errors

The user is authenticated but does not have permission to access a resource.

In our URL shortener, ownership is enforced by the service:

```js
where({
  shortCode,
  userId,
});
```

If no matching URL is found, we return:

```text
404 Not Found
```

For this project, we intentionally avoid revealing whether another user's resource exists.

---

## D. Resource Not Found

The requested resource does not exist.

Example:

```text
GET /api/v1/urls/doesnotexist
```

Response:

```text
404 Not Found
```

```json
{
  "success": false,
  "message": "Short URL not found"
}
```

---

## E. Resource Gone

The resource existed but can no longer be used.

Our redirect endpoint uses:

```text
410 Gone
```

for:

- inactive short URLs
- expired short URLs

Example:

```json
{
  "success": false,
  "message": "Short URL has expired"
}
```

---

## F. Conflict Errors

The request is valid, but it conflicts with existing data.

Example:

```text
Registering an already-used email
```

Response:

```text
409 Conflict
```

Our service creates:

```js
const error = new Error("Email already registered");
error.code = "EMAIL_ALREADY_EXISTS";

throw error;
```

The central error middleware converts that into:

```json
{
  "success": false,
  "message": "Email is already registered"
}
```

---

## G. Unexpected Server Errors

Something happened that the application did not explicitly expect.

Examples:

- Database connection failure
- Runtime bug
- Unexpected library error

Return:

```text
500 Internal Server Error
```

Client should receive something safe:

```json
{
  "success": false,
  "message": "Internal server error"
}
```

Do NOT send database stack traces or internal implementation details to the client.

---

# 4. HTTP Status Codes We Use

| Status | Meaning               | Example                   |
| ------ | --------------------- | ------------------------- |
| 200    | Success               | GET/update/delete success |
| 201    | Created               | URL/user created          |
| 400    | Bad Request           | Invalid input             |
| 401    | Unauthorized          | Missing/invalid JWT       |
| 404    | Not Found             | URL/route doesn't exist   |
| 409    | Conflict              | Duplicate email           |
| 410    | Gone                  | Expired/inactive URL      |
| 500    | Internal Server Error | Unexpected server failure |

---

# 5. Validation Middleware vs Error Middleware

These two are different.

## Validation Middleware

Question it answers:

> "Is the incoming request valid?"

Example:

```text
POST /urls
       ↓
validateCreateUrl
       ↓
Invalid URL?
       ↓
400 response
```

It normally does NOT throw an application error.

It directly returns:

```js
return res.status(400).json(...);
```

---

## Error Middleware

Question it answers:

> "An error happened deeper in the application. How should Express convert it into a response?"

Example:

```text
Controller
   ↓
Service
   ↓
Error
   ↓
asyncHandler
   ↓
errorMiddleware
   ↓
HTTP response
```

---

# 6. Why Controllers Should Not Handle Every Error

Old pattern:

```js
export async function loginController(req, res) {
  try {
    ...
  } catch (error) {
    if (error.code === 'INVALID_CREDENTIALS') {
      return res.status(401).json(...);
    }

    return res.status(500).json(...);
  }
}
```

This works, but every controller starts accumulating:

```text
try/catch
if error.code...
if another error...
if another error...
500 response...
```

As the application grows, controllers become difficult to read.

---

# 7. Centralized Error Handling

Our target architecture is:

```text
Route
  ↓
Middleware
  ↓
Controller
  ↓
Service
  ↓
Error
  ↓
asyncHandler
  ↓
errorMiddleware
  ↓
Response
```

The controller focuses on:

- reading request data
- calling the service
- returning success responses

The error middleware focuses on:

- interpreting errors
- selecting status codes
- formatting error responses
- hiding sensitive details

---

# 8. Express Error Middleware

Normal middleware:

```js
(req, res, next);
```

Error middleware:

```js
(err, req, res, next);
```

The four parameters are important.

Example:

```js
export function errorMiddleware(err, req, res, next) {
  console.error(err);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}
```

Express recognizes this as error-handling middleware because of the four arguments.

---

# 9. `next(error)`

Express uses:

```js
next(error);
```

to tell the framework:

> "An error occurred. Skip normal middleware and go to error-handling middleware."

Example:

```js
export function controller(req, res, next) {
  try {
    // something fails
  } catch (error) {
    next(error);
  }
}
```

Then:

```text
next(error)
     ↓
errorMiddleware(err, req, res, next)
```

---

# 10. Why We Created `asyncHandler`

Async controllers can reject promises.

Instead of repeating:

```js
try {
  ...
} catch (error) {
  next(error);
}
```

we created:

```js
export function asyncHandler(controller) {
  return function wrappedController(req, res, next) {
    Promise.resolve(controller(req, res, next)).catch(next);
  };
}
```

Then routes can use:

```js
router.post("/login", validateLogin, asyncHandler(loginController));
```

The flow becomes:

```text
loginController()
       ↓
Promise rejection
       ↓
.catch(next)
       ↓
errorMiddleware
```

---

# 11. Custom Application Errors

Sometimes we want to deliberately create an error.

Example:

```js
const error = new Error("URL not found");
error.statusCode = 404;

throw error;
```

The central middleware reads:

```js
if (err.statusCode) {
  return res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
}
```

This separates:

```text
Creating the error
        ↓
Controller/service

Formatting the error
        ↓
Error middleware
```

---

# 12. Error Codes vs Status Codes

These are different concepts.

## HTTP status code

Communicates the result to the client:

```text
404
409
500
```

## Application error code

Helps our application identify a specific business condition:

```js
error.code = "EMAIL_ALREADY_EXISTS";
```

Example:

```text
EMAIL_ALREADY_EXISTS
        ↓
409 Conflict
```

Another:

```text
INVALID_CREDENTIALS
        ↓
401 Unauthorized
```

So:

```text
Application Error Code
        ↓
Central Error Middleware
        ↓
HTTP Status Code + Safe Message
```

---

# 13. Our Current Error Middleware

Conceptually:

```js
export function errorMiddleware(err, req, res, next) {
  console.error(err);

  if (err.code === "EMAIL_ALREADY_EXISTS") {
    return res.status(409).json({
      success: false,
      message: "Email is already registered",
    });
  }

  if (err.code === "INVALID_CREDENTIALS") {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  if (err.code === "NO_UPDATE_FIELDS") {
    return res.status(400).json({
      success: false,
      message: "No fields provided for update",
    });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}
```

---

# 14. Why Logging and Client Response Are Different

Server:

```js
console.error(err);
```

Client:

```json
{
  "success": false,
  "message": "Internal server error"
}
```

The server may need detailed information for debugging.

The client usually does NOT need:

- stack trace
- SQL query
- PostgreSQL error details
- filesystem paths
- internal library information

This is both a security and maintainability principle.

---

# 15. Error Middleware Ordering

Middleware order matters.

Our `app.js` should follow:

```text
express.json()
      ↓
routes
      ↓
notFoundMiddleware
      ↓
errorMiddleware
```

Example:

```js
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/urls", urlRoutes);

app.use(notFoundMiddleware);

app.use(errorMiddleware);
```

The error middleware should be at the end.

---

# 16. 404 Middleware vs 404 Application Error

These look similar but have different purposes.

## Unknown route

```text
GET /api/v1/abc
```

No route matches.

Handled by:

```js
notFoundMiddleware;
```

Response:

```json
{
  "success": false,
  "message": "Route not found"
}
```

---

## Existing route but missing resource

```text
GET /api/v1/urls/doesnotexist
```

The route exists, but the short URL doesn't.

Controller/service creates:

```js
error.statusCode = 404;
```

Then:

```text
errorMiddleware
```

returns:

```json
{
  "success": false,
  "message": "Short URL not found"
}
```

---

# 17. Request Flow Example — Login

Valid request:

```text
POST /api/v1/auth/login
        ↓
validateLogin
        ↓
loginController
        ↓
loginUser
        ↓
JWT created
        ↓
200 response
```

Wrong password:

```text
POST /login
        ↓
validateLogin
        ↓
loginController
        ↓
loginUser
        ↓
INVALID_CREDENTIALS
        ↓
throw error
        ↓
asyncHandler
        ↓
errorMiddleware
        ↓
401 response
```

---

# 18. Request Flow Example — Redirect

```text
GET /api/v1/urls/yt123
        ↓
redirectUrl
        ↓
getUrlByShortCode()
        ↓
URL found?
   ├── No → 404
   │
   └── Yes
         ↓
      isActive?
         ├── No → 410
         ↓
      expired?
         ├── Yes → 410
         ↓
      recordClick()
         ↓
      res.redirect()
```

This is a great example of business rules + error handling working together.

---

# 19. Golden Rules

Remember these:

### Rule 1

**Validate early.**

```text
Bad request → reject before service
```

### Rule 2

**Don't duplicate error handling everywhere.**

Use centralized error middleware.

### Rule 3

**Services can throw business errors.**

Example:

```js
error.code = "EMAIL_ALREADY_EXISTS";
throw error;
```

### Rule 4

**Controllers should stay thin.**

They coordinate the request/response flow.

### Rule 5

**Don't expose internal errors to clients.**

Log details server-side.

### Rule 6

**Use meaningful HTTP status codes.**

Don't return `200` for every situation.

### Rule 7

**Middleware order matters.**

Error middleware belongs at the end.

---

# 20.    Interview Questions

## Q1. Why use centralized error handling?

Because it prevents repetitive error-handling code in controllers and gives the API a consistent response format.

## Q2. How does Express recognize error middleware?

By its four-argument signature:

```js
(err, req, res, next);
```

## Q3. What does `next(error)` do?

It passes the error to Express's error-handling middleware.

## Q4. Why use `asyncHandler`?

It automatically catches rejected promises from async controllers and forwards them to `next(error)`.

## Q5. Why shouldn't we expose `err.stack` to clients?

Because it may reveal internal application details, file paths, database information, or implementation details.

## Q6. Difference between 404 and 410?

`404` means the requested resource isn't available/found.

`410` indicates the resource is known to be gone or no longer usable.

Our project uses `410` for inactive/expired short URLs.

## Q7. Why use application error codes?

They allow the application to distinguish specific business conditions independently of the HTTP status.

Example:

```text
EMAIL_ALREADY_EXISTS → 409
INVALID_CREDENTIALS → 401
```

---

# 21. Mental Model

If you remember only one diagram, remember this:

```text
                 REQUEST
                    ↓
                  ROUTE
                    ↓
              MIDDLEWARE
          ┌─────────┴─────────┐
          ↓                   ↓
       AUTH              VALIDATION
          └─────────┬─────────┘
                    ↓
                CONTROLLER
                    ↓
                 SERVICE
                    ↓
              DATABASE/ORM
                    ↓
                 RESULT
                    │
              ┌─────┴─────┐
              ↓           ↓
           Success       Error
              ↓           ↓
          Response    asyncHandler
                          ↓
                   errorMiddleware
                          ↓
                     Error Response
```