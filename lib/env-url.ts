export function resolveAppUrl(publicAppUrl?: string, vercelUrl?: string) {
  const explicit = publicAppUrl?.trim();
  if (explicit) return explicit;
  const inferred = vercelUrl?.trim();
  if (inferred) return `https://${inferred}`;
  return undefined;
}
