import { useState } from 'react';
import { Link } from 'react-router-dom';
import LinkRow from '../components/LinkRow.jsx';
import { useFetch } from '../useFetch.js';

const PAGE_SIZE = 10;

// Dashboard = your links and how they perform. Creating links happens on the home page.
export default function Dashboard() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(
    `/api/v1/urls?page=${page}&limit=${PAGE_SIZE}`
  );

  const urls = data?.data ?? [];
  // The API names these fields numericPage / numericLimit.
  const pagination = data?.pagination;

  // If the last link on a page is deleted, step back one page instead of showing an empty page.
  function handleDeleted() {
    if (urls.length === 1 && page > 1) setPage(page - 1);
    else reload();
  }

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <div>
        <Link to="/" className="btn-ghost">&larr; Back to home</Link>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl font-bold">
              Link <span className="text-accent">analytics</span>
            </h1>
            <p className="mt-2 text-zinc-400">See how each of your links is performing.</p>
          </div>
          {pagination && (
            <p className="font-display text-sm text-zinc-500">
              <span className="text-2xl font-bold tabular-nums text-zinc-100">{pagination.total}</span> links
            </p>
          )}
        </div>
      </div>

      {loading && !data && <div className="glass h-28 animate-pulse" />}

      {error && (
        <div role="alert" className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-300 ring-1 ring-inset ring-red-400/20">
          {error}{' '}
          <button onClick={reload} className="underline">Try again</button>
        </div>
      )}

      {!loading && !error && urls.length === 0 && (
        <div className="glass p-10 text-center">
          <p className="text-zinc-400">No links yet. Shorten your first one on the home page.</p>
          <Link to="/" className="btn-primary mt-5 px-5 py-2.5 text-sm">Shorten a link &rarr;</Link>
        </div>
      )}

      <ul className="stagger space-y-4">
        {urls.map((url) => (
          <LinkRow key={url.id} url={url} onChanged={reload} onDeleted={handleDeleted} />
        ))}
      </ul>

      {pagination && pagination.totalPages > 1 && (
        <nav className="flex items-center justify-between text-sm">
          <button onClick={() => setPage(page - 1)} disabled={!pagination.hasPrevPage || loading} className="btn-ghost">
            &larr; Previous
          </button>
          <span className="font-mono text-zinc-400">Page {pagination.numericPage} of {pagination.totalPages}</span>
          <button onClick={() => setPage(page + 1)} disabled={!pagination.hasNextPage || loading} className="btn-ghost">
            Next &rarr;
          </button>
        </nav>
      )}
    </main>
  );
}