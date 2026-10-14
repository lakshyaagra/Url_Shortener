import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Logo from './components/Logo.jsx';
import SlowNotice from './components/SlowNotice.jsx';
import Analytics from './pages/Analytics.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Home from './pages/Home.jsx';

const textLink = 'hidden text-sm text-zinc-400 transition hover:text-white sm:block';
const navButton = 'btn-primary px-4 py-2 text-sm';

// Floating glass navbar, shown on every page.
//   logged in                        -> My links, avatar, Log out
//   logged out, has an account       -> Log in (primary), Register
//   logged out, no account yet       -> Register (primary), Log in
function Navbar() {
  const { user, token, hasAccount, logout } = useAuth();
  const navigate = useNavigate();
  const initial = (user?.name || '?').trim().charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-20 px-4 pt-4">
      <div className="glass mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-2.5">
        <Link to="/" aria-label="Linkly home"><Logo /></Link>
        
        <div className="flex items-center gap-3">
          {token ? (
            <>
              <Link to="/dashboard" className="btn-ghost">My links</Link>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-accent/15 text-sm font-semibold text-accent ring-1 ring-accent/30"
                title={user?.name}>
                {initial}
              </span>
              <button onClick={() => { logout(); navigate('/'); }} className="btn-ghost">Log out</button>
            </>
          ) : hasAccount ? (
            <>
              <Link to="/register" className={textLink}>Register</Link>
              <Link to="/login" className={navButton}>Log in</Link>
            </>
          ) : (
            <>
              <Link to="/login" className={textLink}>Log in</Link>
              <Link to="/register" className={navButton}>Register</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// Pages that need an account send logged-out visitors to /login.
function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

// Logged-in users have no business on /login or /register.
function GuestRoute({ children }) {
  const { token } = useAuth();
  return token ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  // Keying the wrapper by path remounts it on every navigation, which replays the fade-in.
  const location = useLocation();

  return (
    <>
      <SlowNotice />
      <Navbar />
      <div key={location.pathname} className="page-enter">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/links/:shortCode" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/login" element={<GuestRoute><AuthPage mode="login" /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><AuthPage mode="register" /></GuestRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
    </>
  );
}