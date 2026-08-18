const isLocalHost = (rootDomain: string) =>
  rootDomain.startsWith('localhost') || rootDomain.startsWith('127.0.0.1');

export function tenantOrigin(subdomain: string, rootDomain: string): string {
  const protocol = isLocalHost(rootDomain) ? 'http' : 'https';
  return `${protocol}://${subdomain}.${rootDomain}`;
}
