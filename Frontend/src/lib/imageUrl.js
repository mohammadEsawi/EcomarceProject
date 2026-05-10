const BACKEND_ORIGIN = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
  : 'http://localhost:4000';

/**
 * Converts a stored image path to a full URL.
 * Passes through already-absolute URLs unchanged.
 */
export function imgUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('/assets/')) return url;
  return `${BACKEND_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
}
