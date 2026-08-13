export function resolveAppUrl(publicAppUrl?: string, vercelUrl?: string) {
  if (publicAppUrl) return publicAppUrl;
  if (vercelUrl) return `https://${vercelUrl}`;
  return undefined;
}
