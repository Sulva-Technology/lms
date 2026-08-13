import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourceDirs = ['app', 'components', 'lib'];
const sourceExtensions = new Set(['.ts', '.tsx']);

function walk(dir: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function appRouteFromFile(file: string): string | null {
  const rel = path.relative(path.join(root, 'app'), file).replace(/\\/g, '/');
  if (!/(page|route)\.tsx?$/.test(rel)) return null;

  const parts = rel
    .split('/')
    .slice(0, -1)
    .filter((segment) => !segment.startsWith('('))
    .map((segment) => (segment.startsWith('[') && segment.endsWith(']') ? `:${segment.slice(1, -1)}` : segment));

  return `/${parts.join('/')}`;
}

const appFiles = walk(path.join(root, 'app'));
const routes = appFiles.map(appRouteFromFile).filter((route): route is string => Boolean(route)).sort();
const routeSet = new Set(routes);

function routeExists(href: string): boolean {
  const cleanHref = href.split('?')[0].split('#')[0] || '/';
  if (routeSet.has(cleanHref)) return true;

  const hrefParts = cleanHref.split('/').filter(Boolean);

  return routes.some((route) => {
    const routeParts = route.split('/').filter(Boolean);
    if (routeParts.length !== hrefParts.length) return false;

    return routeParts.every((part, index) => {
      return part.startsWith(':') || hrefParts[index].includes('${') || part === hrefParts[index];
    });
  });
}

const sourceFiles = sourceDirs.flatMap((dir) => walk(path.join(root, dir)));
const idTargets = new Set<string>();
const linkFindings: string[] = [];

const linkPatterns = [
  /href=\"([^\"]+)\"/g,
  /href=\{`([^`]+)`\}/g,
  /href=\{\s*['\"]([^'\"]+)['\"]\s*\}/g,
  /router\.(?:push|replace)\(\s*['\"]([^'\"]+)['\"]/g,
  /redirect\(\s*['\"]([^'\"]+)['\"]/g,
  /NextResponse\.redirect\([^\n]*?['\"]([^'\"]+)['\"]/g,
  /href:\s*['\"]([^'\"]+)['\"]/g,
];

for (const file of sourceFiles) {
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(/id=\"([^\"]+)\"/g)) {
    idTargets.add(`#${match[1]}`);
  }
}

for (const file of sourceFiles) {
  const text = readFileSync(file, 'utf8');
  const rel = path.relative(root, file).replace(/\\/g, '/');

  for (const pattern of linkPatterns) {
    for (const match of text.matchAll(pattern)) {
      const href = match[1];

      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;

      if (href === '#') {
        linkFindings.push(`${rel}: placeholder href="#"`);
        continue;
      }

      if (href.startsWith('#') && !idTargets.has(href)) {
        linkFindings.push(`${rel}: missing anchor target ${href}`);
        continue;
      }

      if (href.startsWith('/') && !routeExists(href)) {
        linkFindings.push(`${rel}: missing route ${href}`);
      }
    }
  }
}

if (linkFindings.length > 0) {
  console.error('Link audit failed.');
  linkFindings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}

console.log(`Link audit passed for ${routes.length} app routes.`);
