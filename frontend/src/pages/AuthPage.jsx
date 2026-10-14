import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

// One form for both /login and /register. After success the token is set,
// and the router's GuestRoute redirects to the dashboard.
export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isRegister) {
        await register(form.name.trim(), form.email.trim(), form.password);
      } else {
        await login(form.email.trim(), form.password);
      }
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  const label = 'mb-1.5 block text-sm font-medium text-zinc-300';

  return (
    <main className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mt-2 text-sm text-zinc-400">Shrink the Link. Amplify the Impact.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass space-y-4 p-6 sm:p-8">
        {isRegister && (
          <div>
            <label className={label} htmlFor="name">Name</label>
            <input id="name" className="field" value={form.name} onChange={update('name')}
              required minLength={2} maxLength={100} autoComplete="name" />
          </div>
        )}

        <div>
          <label className={label} htmlFor="email">Email</label>
          <input id="email" type="email" className="field" value={form.email}
            onChange={update('email')} required autoComplete="email" />
        </div>

        <div>
          <label className={label} htmlFor="password">Password</label>
          <input id="password" type="password" className="field" value={form.password}
            onChange={update('password')} required minLength={isRegister ? 8 : undefined}
            autoComplete={isRegister ? 'new-password' : 'current-password'} />
          {isRegister && <p className="mt-1.5 text-xs text-zinc-500">At least 8 characters.</p>}
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-300 ring-1 ring-inset ring-red-400/20">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Please wait...' : isRegister ? 'Create account' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        {isRegister ? (
          <>Already have an account? <Link className="font-medium text-accent hover:underline" to="/login">Log in</Link></>
        ) : (
          <>New to Linkly? <Link className="font-medium text-accent hover:underline" to="/register">Create an account</Link></>
        )}
      </p>
    </main>
  );
}