import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, shortUrlFor } from '../api.js';
import { useAuth } from '../auth.jsx';
import Icon from '../components/Icons.jsx';

const features = [
  ['Instant redirects', 'Hot links are served from a Redis cache, so they open fast.'],
  ['Edit and expire', 'With an account you can change a destination, set an expiry or switch a link off.'],
  ['Click analytics', 'With an account you see total clicks, clicks per day and top referrers.'],
];

// Public landing page. Anyone can shorten a link here; accounts get editing and analytics.
export default function Home() {
  const { token } = useAuth();
  const [originalUrl, setOriginalUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate(event) {
    event.preventDefault();
    setError('');
    setResult(null);
    setCreating(true);

    try {
      // Logged-in users create links in their own account; visitors use the public endpoint.
      const body = await api(token ? '/api/v1/urls' : '/api/v1/urls/public', {
        method: 'POST',
        body: { originalUrl: originalUrl.trim() },
        auth: Boolean(token),
      });
      setResult(body.data);
      setOriginalUrl('');
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; the link is still visible to select manually.
    }
  }

  const shortUrl = result ? shortUrlFor(result.shortCode) : '';

  return (
    <main className="mx-auto max-w-4xl space-y-10 px-4 py-10">
      <section className="glass relative overflow-hidden p-6 sm:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <h1 className="relative text-4xl font-extrabold sm:text-6xl">
          Shrink the Link.<br />
          <span className="text-accent">Amplify the Impact.</span>
        </h1>
        <p className="relative mt-4 max-w-xl text-lg text-zinc-400">
          Paste a long URL and get a clean short link in a second. No account needed.
        </p>

        <form onSubmit={handleCreate} className="relative mt-8 flex flex-col gap-3 sm:flex-row">
          <input type="url" required value={originalUrl} onChange={(e) => setOriginalUrl(e.target.value)}
            placeholder="https://example.com/a/very/long/link" className="field flex-1 text-base" />
          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? 'Creating...' : <>Create Link <span aria-hidden="true">&rarr;</span></>}
          </button>
        </form>

        {error && (
          <p role="alert" className="relative mt-3 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-300 ring-1 ring-inset ring-red-400/20">
            {error}
          </p>
        )}

        {result && (
          <div className="pop-in relative mt-6 rounded-xl border border-accent/30 bg-accent/5 p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Your short link</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <a href={shortUrl} target="_blank" rel="noreferrer"
                className="break-all text-xl font-bold text-accent hover:underline">
                {shortUrl.replace(/^https?:\/\//, '')}
              </a>
              <button type="button" onClick={() => copy(shortUrl)} className="btn-ghost">
                <Icon name={copied ? 'check' : 'copy'} />{copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="mt-1 truncate text-sm text-zinc-400" title={result.originalUrl}>{result.originalUrl}</p>

            {token ? (
              <p className="mt-3 text-sm text-zinc-400">
                Saved to your account. <Link to="/dashboard" className="font-medium text-accent hover:underline">Manage it in My links</Link>.
              </p>
            ) : (
              <p className="mt-3 text-sm text-zinc-400">
                This link works for everyone, but it cannot be edited or tracked.{' '}
                <Link to="/register" className="font-medium text-accent hover:underline">Create a free account</Link> to manage your links.
              </p>
            )}
          </div>
        )}
      </section>

      <section className="stagger grid gap-4 sm:grid-cols-3">
        {features.map(([title, text]) => (
          <div key={title} className="glass p-5">
            <h2 className="text-base font-bold">{title}</h2>
            <p className="mt-2 text-sm text-zinc-400">{text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}