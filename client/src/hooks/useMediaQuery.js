import { useEffect, useState } from 'react';

/**
 * Subscribes to a CSS media query. Safe on first paint when `window` is undefined.
 * @param {string} query e.g. '(min-width: 768px)'
 */
export function useMediaQuery(query) {
  const get = () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false);

  const [matches, setMatches] = useState(get);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
