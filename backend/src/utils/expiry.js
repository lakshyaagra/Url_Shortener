// expiresAt reaches this code in two shapes:
//   - a Temporal.PlainDateTime, when the link was just read from PostgreSQL
//   - an ISO string such as "2026-10-14T10:00:00", when it came back from the Redis cache
// Both are UTC wall-clock time (the column is a timestamp without time zone),
// so parse either shape the same way and compare against the current UTC time.
export function isExpired(expiresAt) {
  if (!expiresAt) return false;
 
  const expires = Temporal.PlainDateTime.from(expiresAt.toString());
  const now = Temporal.Now.plainDateTimeISO('UTC');
 
  return Temporal.PlainDateTime.compare(expires, now) <= 0;
}