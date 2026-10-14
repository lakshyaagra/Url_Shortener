// Linkly mark: a rounded gold tile with an "L" whose end is a link node, plus the wordmark.
export default function Logo({ size = 28 }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <defs>
          <linearGradient id="linkly-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f0dba0" />
            <stop offset="1" stopColor="#b8913f" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#linkly-gold)" />
        <path d="M11 8v11a3 3 0 0 0 3 3h6" fill="none" stroke="#0a0a0c" strokeWidth="3"
          strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="22" cy="12" r="2.8" fill="#0a0a0c" />
      </svg>
      <span className={`${size > 32 ? 'text-2xl' : 'text-lg'} font-extrabold tracking-tight`}>
        Link<span className="text-accent">ly</span>
      </span>
    </span>
  );
}