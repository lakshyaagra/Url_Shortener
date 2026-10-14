import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, shortUrlFor } from '../api.js';
import { formatDate, parseDate } from '../format.js';
import Icon from './Icons.jsx';

function statusOf(url) {
  if (!url.isActive) return { label: 'Inactive', className: 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20' };

  const expiresAt = parseDate(url.expiresAt);
  if (expiresAt && expiresAt <= new Date()) {
    return { label: 'Expired', className: 'bg-red-400/10 text-red-300 ring-red-400/20' };
  }

  return { label: 'Active', className: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20' };
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked by the browser; the link is still visible to select manually.
    }
  }

  return (
    <button type="button" onClick={copy} className="btn-ghost shrink-0">
      <Icon name={copied ? 'check' : 'copy'} />
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-zinc-300">{value}</dd>
    </div>
  );
}

// One link card: short URL, status badge, metadata, and actions.
export default function LinkRow({ url, onChanged, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [originalUrl, setOriginalUrl] = useState(url.originalUrl);
  const [expiresAt, setExpiresAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const status = statusOf(url);
  const shortUrl = shortUrlFor(url.shortCode);

  async function patch(body) {
    setBusy(true);
    setError('');
    try {
      await api(`/api/v1/urls/${url.shortCode}`, { method: 'PATCH', body });
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  function startEdit() {
    setOriginalUrl(url.originalUrl);
    setExpiresAt('');
    setError('');
    setEditing(true);
  }

  async function toggleActive() {
    if (await patch({ isActive: !url.isActive })) onChanged();
  }

  async function saveEdit(event) {
    event.preventDefault();

    // Send only what the user actually changed.
    const body = {};
    const trimmed = originalUrl.trim();
    if (trimmed !== url.originalUrl) body.originalUrl = trimmed;
    // <input type="datetime-local"> gives local time without a zone; convert to a real instant.
    if (expiresAt) body.expiresAt = new Date(expiresAt).toISOString();

    if (Object.keys(body).length === 0) {
      setEditing(false);
      return;
    }

    if (await patch(body)) {
      setEditing(false);
      onChanged();
    }
  }

  async function remove() {
    if (!window.confirm('Delete this link? Its click history will be deleted too.')) return;

    setBusy(true);
    setError('');
    try {
      await api(`/api/v1/urls/${url.shortCode}`, { method: 'DELETE' });
      onDeleted();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <li className="glass p-5 transition hover:border-white/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <a href={shortUrl} target="_blank" rel="noreferrer"
              className="truncate text-base font-semibold text-accent hover:underline">
              {shortUrl.replace(/^https?:\/\//, '')}
            </a>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${status.className}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {status.label}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-zinc-400" title={url.originalUrl}>{url.originalUrl}</p>
        </div>
        <CopyButton text={shortUrl} />
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
        <Meta label="Clicks" value={url.clicks ?? '-'} />
        <Meta label="Created" value={formatDate(url.createdAt)} />
        <Meta label="Expires" value={url.expiresAt ? formatDate(url.expiresAt) : 'Never'} />
      </dl>

      {editing ? (
        <form onSubmit={saveEdit} className="pop-in mt-4 space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400" htmlFor={`url-${url.id}`}>Destination URL</label>
            <input id={`url-${url.id}`} type="url" required value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)} className="field py-2.5 text-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400" htmlFor={`exp-${url.id}`}>Set expiry (optional)</label>
            <input id={`exp-${url.id}`} type="datetime-local" value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)} className="field w-auto py-2.5 text-sm" />
            <p className="mt-1.5 text-xs text-zinc-500">
              Leave empty to keep the current expiry. Removing an expiry is not supported yet.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn-primary px-4 py-2 text-sm">
              {busy ? 'Saving...' : 'Save changes'}
            </button>
            <button type="button" onClick={() => setEditing(false)} disabled={busy} className="btn-ghost">Cancel</button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          <Link to={`/links/${url.shortCode}`} className="btn-ghost"><Icon name="chart" />Analytics</Link>
          <button type="button" onClick={startEdit} disabled={busy} className="btn-ghost"><Icon name="pencil" />Edit</button>
          <button type="button" onClick={toggleActive} disabled={busy} className="btn-ghost">
            <Icon name="power" />{url.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button type="button" onClick={remove} disabled={busy} className="btn-danger ml-auto"><Icon name="trash" />Delete</button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-300 ring-1 ring-inset ring-red-400/20">
          {error}
        </p>
      )}
    </li>
  );
}