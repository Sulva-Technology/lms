/**
 * Turns whatever a data call threw into something worth showing.
 *
 * PostgREST only wraps its errors in an Error subclass when a query opts into
 * `throwOnError()`. Everywhere else `{ data, error }` carries a plain object,
 * so the usual `error instanceof Error` test fails and the page falls back to
 * a generic sentence — which is how a permission or column problem reaches a
 * person as "Could not load students." with nothing to act on.
 */
export function describeDataError(error: unknown, fallback: string): string {
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[data] ${fallback}`, error);
  }

  if (!error || typeof error !== 'object') return fallback;

  const shape = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
  const message = typeof shape.message === 'string' && shape.message.trim() ? shape.message.trim() : null;

  if (!message) return fallback;

  const detail = typeof shape.details === 'string' && shape.details.trim() ? shape.details.trim() : null;
  const code = typeof shape.code === 'string' && shape.code.trim() ? shape.code.trim() : null;

  return [detail && detail !== message ? `${message} — ${detail}` : message, code ? `(${code})` : null]
    .filter(Boolean)
    .join(' ');
}
