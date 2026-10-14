// One place that talks to the backend. Every page uses api(), so token
// handling, error messages, 401 handling and the "server is waking up"
// notice are written exactly once.

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

const TOKEN_KEY = 'token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// The auth context registers a function here that logs the user out.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

// A request that takes longer than this is probably a cold start on free hosting.
// The SlowNotice component registers a listener here to show a banner.
const SLOW_AFTER_MS = 4000;
let slowListener = () => {};
let slowCount = 0;
export const setSlowListener = (fn) => {
  slowListener = fn;
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// The public short link for a code (the redirect endpoint of the API).
export const shortUrlFor = (shortCode) => `${API_URL}/api/v1/urls/${shortCode}`;

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  const token = getToken();

  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch only throws when no response arrived at all (server down, offline, CORS blocked).
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Some responses (for example a plain-text 429) are not JSON.
  }

  if (!response.ok) {
    // A 401 on a logged-in request means the token expired or is invalid.
    // (A failed login is also a 401, but that request has auth: false, so it is ignored here.)
    if (response.status === 401 && auth && token) onUnauthorized();

    const message =
      response.status === 429
        ? 'Too many requests. Please wait a moment and try again.'
        : payload?.message || `Request failed (${response.status})`;

    throw new ApiError(message, response.status);
  }

  return payload;
}

export async function api(path, options) {
  let slow = false;

  const timer = setTimeout(() => {
    slow = true;
    slowCount += 1;
    slowListener(true);
  }, SLOW_AFTER_MS);

  try {
    return await request(path, options);
  } finally {
    clearTimeout(timer);
    if (slow) {
      slowCount -= 1;
      if (slowCount === 0) slowListener(false);
    }
  }
}