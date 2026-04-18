import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Sets `document.title` from the current route (no extra dependencies).
 */
export function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const base = 'PokeFind HQ';
    if (pathname.startsWith('/routes')) {
      document.title = `Routes — ${base}`;
    } else if (pathname.startsWith('/raids')) {
      document.title = `Raids — ${base}`;
    } else {
      document.title = `Map — ${base}`;
    }
  }, [pathname]);

  return null;
}
