import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { shortUrlFor } from '../api.js';
import { formatDate } from '../format.js';
import { useFetch } from '../useFetch.js';

const PAGE_SIZE = 10;

function Stat({ label, value, hint }) {
  return (
    <div className="glass p-5">
      <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-2 truncate font-display text-3xl font-bold tabular-nums text-accent" title={String(value)}>
        {value}
      </p>
      {hint && <p className="mt-1 truncate text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

export default function Analytics() {
  const { shortCode } = useParams();
  const [page, setPage] = useState(1);

  const { data, loading, error, reload } = useFetch(
    `/api/v1/urls/${encodeURIComponent(shortCode)}/analytics?page=${page}&limit=${PAGE_SIZE}`
  );

  const analytics = data?.data;
  const pagination = analytics?.pagination; // this endpoint names them page / limit

  const total = analytics?.summary.totalClicks ?? 0;
  const referrers = analytics ? [...analytics.referrers].sort((a, b) => b.clicks - a.clicks) : [];
  const days = analytics?.clicksOverTime ?? [];
  const maxPerDay = Math.max(1, ...days.map((day) => day.clicks));
  const bestDay = days.reduce((best, day) => (!best || day.clicks > best.clicks ? day : best), null);
  const topReferrer = referrers[0];

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap gap-2">
        <Link to="/dashboard" className="btn-ghost">&larr; Back to dashboard</Link>
        <Link to="/" className="btn-ghost">Home</Link>
      </div>

      {loading && !analytics && <div className="glass h-40 animate-pulse" />}

      {error && (
        <div role="alert" className="rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-300 ring-1 ring-inset ring-red-400/20">
          {error}{' '}
          <button onClick={reload} className="underline">Try again</button>
        </div>
      )}

      {analytics && (
        <>
          <section className="glass p-6">
            <p className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">Analytics for</p>
            <p className="mt-1 break-all font-mono text-lg font-medium text-accent">
              {shortUrlFor(analytics.url.shortCode).replace(/^https?:\/\//, '')}
            </p>
            <p className="mt-1 truncate text-sm text-zinc-400" title={analytics.url.originalUrl}>
              {analytics.url.originalUrl}
            </p>
          </section>

          <section className="stagger grid gap-4 sm:grid-cols-3">
            <Stat label="Total clicks" value={total} />
            <Stat label="Top referrer" value={topReferrer ? topReferrer.referrer : '-'}
              hint={topReferrer ? `${topReferrer.clicks} clicks` : 'No clicks yet'} />
            <Stat label="Best day" value={bestDay ? bestDay.date : '-'}
              hint={bestDay ? `${bestDay.clicks} clicks` : 'No clicks yet'} />
          </section>

          <section className="glass p-6">
            <h2 className="font-display text-lg font-bold">Clicks per day</h2>
            {days.length === 0 ? (
              <p className="mt-3 text-zinc-400">No clicks yet. Open your short link to record one.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {days.map((day) => (
                  <li key={day.date} className="flex items-center gap-3 text-sm">
                    <span className="w-24 shrink-0 font-mono text-xs text-zinc-400">{day.date}</span>
                    <div className="h-3 flex-1 rounded-full bg-white/10">
                      <div className="h-3 rounded-full bg-accent transition-all duration-700"
                        style={{ width: `${(day.clicks / maxPerDay) * 100}%` }} />
                    </div>
                    <span className="w-8 text-right font-mono tabular-nums">{day.clicks}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="glass p-6">
            <h2 className="font-display text-lg font-bold">Referrers</h2>
            {referrers.length === 0 ? (
              <p className="mt-3 text-zinc-400">No clicks yet.</p>
            ) : (
              <ul className="mt-3 divide-y text-sm">
                {referrers.map((item) => (
                  <li key={item.referrer} className="flex items-center justify-between gap-4 py-2.5">
                    <span className="truncate" title={item.referrer}>{item.referrer}</span>
                    <span className="shrink-0 font-mono tabular-nums text-zinc-400">
                      {item.clicks}
                      <span className="ml-2 text-accent">{total ? Math.round((item.clicks / total) * 100) : 0}%</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="glass p-6">
            <h2 className="font-display text-lg font-bold">Recent clicks</h2>
            {analytics.recentClicks.length === 0 ? (
              <p className="mt-3 text-zinc-400">No clicks yet.</p>
            ) : (
              <ul className="mt-3 divide-y text-sm">
                {analytics.recentClicks.map((click) => (
                  <li key={click.id} className="py-2.5">
                    <p className="font-mono text-xs text-zinc-300">{formatDate(click.clickedAt)}</p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500" title={click.userAgent ?? ''}>
                      {click.referrer || 'Direct / Unknown'} &middot; {click.userAgent || 'Unknown browser'}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {pagination && pagination.totalPages > 1 && (
              <nav className="mt-4 flex items-center justify-between text-sm">
                <button onClick={() => setPage(page - 1)} disabled={!pagination.hasPrevPage || loading} className="btn-ghost">
                  &larr; Previous
                </button>
                <span className="font-mono text-zinc-400">Page {pagination.page} of {pagination.totalPages}</span>
                <button onClick={() => setPage(page + 1)} disabled={!pagination.hasNextPage || loading} className="btn-ghost">
                  Next &rarr;
                </button>
              </nav>
            )}
          </section>
        </>
      )}
    </main>
  );
}