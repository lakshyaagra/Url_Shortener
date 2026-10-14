import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

// Loads `path` and tracks { data, loading, error }. Calls reload() to fetch again.
// data is the full response body, e.g. { success, data: [...], pagination }.
export function useFetch(path) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // If `path` changes (or the component unmounts) while a request is in flight,
    // the old response must not overwrite newer state. The cleanup flips this flag.
    let ignore = false;

    setState((previous) => ({ ...previous, loading: true, error: null }));

    api(path)
      .then((body) => {
        if (!ignore) setState({ data: body, loading: false, error: null });
      })
      .catch((error) => {
        if (!ignore) setState({ data: null, loading: false, error: error.message });
      });

    return () => {
      ignore = true;
    };
  }, [path, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return { ...state, reload };
}