// Tiny inline icon set (stroke icons, inherit the button's text color).
const paths = {
  copy: (<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>),
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  pencil: <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />,
  power: (<><path d="M12 3v8" /><path d="M6.3 6.8a8 8 0 1 0 11.4 0" /></>),
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />,
};

export default function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      {paths[name]}
    </svg>
  );
}