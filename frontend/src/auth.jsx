import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, clearToken, getToken, setToken, setUnauthorizedHandler } from './api.js';

const AuthContext = createContext(null);
const USER_KEY = 'user';
const ACCOUNT_KEY = 'hasAccount';

function loadStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());
  const [user, setUser] = useState(loadStoredUser());
  // Survives log out: tells the navbar this browser already has an account.
  const [hasAccount, setHasAccount] = useState(localStorage.getItem(ACCOUNT_KEY) === '1');

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem(USER_KEY);
    setTokenState(null);
    setUser(null);
  }, []);

  // Any 401 on an authenticated request logs the user out; the router then sends them to /login.
  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  async function login(email, password) {
    const body = await api('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });

    setToken(body.data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(body.data.user));
    setTokenState(body.data.token);
    setUser(body.data.user);
    localStorage.setItem(ACCOUNT_KEY, '1');
    setHasAccount(true);
  }

  async function register(name, email, password) {
    await api('/api/v1/auth/register', {
      method: 'POST',
      body: { name, email, password },
      auth: false,
    });
    await login(email, password);
  }

  return (
    <AuthContext.Provider value={{ token, user, hasAccount, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);