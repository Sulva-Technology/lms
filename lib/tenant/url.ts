const isLocalHost = (rootDomain: string) =>
  rootDomain.startsWith('localhost') || rootDomain.startsWith('127.0.0.1');

export function tenantOrigin(subdomain: string, rootDomain: string): string {
  const protocol = isLocalHost(rootDomain) ? 'http' : 'https';
  return `${protocol}://${subdomain}.${rootDomain}`;
}

/**
 * Origin an emailed auth link must land on.
 *
 * Built from the subdomain the middleware resolved against the database and the
 * configured root domain — never from the request's Host header. A password
 * reset email whose link is assembled from an attacker-supplied Host is a
 * takeover, so the host is reconstructed rather than trusted.
 *
 * A request with no tenant (the root domain, or a super admin acting on the
 * platform) falls back to the platform's own address.
 */
export function emailLinkOrigin(
  subdomain: string | null | undefined,
  rootDomain: string,
  fallback: string,
): string {
  if (!subdomain) return fallback;
  return tenantOrigin(subdomain, rootDomain);
}
