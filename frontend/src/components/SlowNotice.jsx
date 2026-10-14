import { useEffect, useState } from 'react';
import { setSlowListener } from '../api.js';

// Banner shown while any request is taking unusually long (free hosting cold start).
export default function SlowNotice() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    setSlowListener(setSlow);
    return () => setSlowListener(() => {});
  }, []);

  if (!slow) return null;

  return (
    <div role="status"
      className="fixed inset-x-0 top-0 z-30 bg-amber-400/15 px-4 py-2 text-center text-sm text-amber-200 backdrop-blur-md">
      The server is waking up (free hosting sleeps when idle). This can take up to a minute...
    </div>
  );
}