import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const walk = (dir: string): string[] => {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
};

const readAll = (segments: string[], exclude?: (file: string) => boolean): string =>
  segments
    .flatMap((segment) => walk(path.join(process.cwd(), segment)))
    .filter((file) => /\.(tsx|ts)$/.test(file))
    .filter((file) => (exclude ? !exclude(file) : true))
    .map((file) => fs.readFileSync(file, 'utf8'))
    .join('\n');

describe('page completion contracts', () => {
  it('does not leave route-facing LMS placeholders or mock-backed production flows', () => {
    const source = readAll(['app', 'components']);

    expect(source).not.toContain('will be displayed here');
    expect(source).not.toContain('PlaceholderPage');
    expect(source).not.toContain('MO' + 'CK_REGISTRATION');
    expect(source).not.toContain('MO' + 'CK_COURSE_DETAIL');
    expect(source).not.toContain('MO' + 'CK_VIDEO_LESSON');
  });

  it('does not keep forbidden fake data or stub markers in runtime code', () => {
    const runtimeSource = readAll(['app', 'components', 'lib', 'types']);

    for (const marker of [
      'MO' + 'CK_',
      'Mock' + 'LiveClassProvider',
      'mock' + '-provider',
      'mock' + '.live',
      'mock' + '_provider',
      'Not fully ' + 'implemented',
    ]) {
      expect(runtimeSource).not.toContain(marker);
    }
  });

  it('does not reintroduce third-party placeholder imagery', () => {
    // Course art and avatars are either uploaded assets or generated locally.
    const runtimeSource = readAll(['app', 'components', 'lib']);

    expect(runtimeSource).not.toContain('picsum' + '.photos');
    expect(runtimeSource).not.toContain('ui-' + 'avatars.com');
  });

  it('keeps every server action reachable from the UI', () => {
    const actionsDir = path.join(process.cwd(), 'app', 'actions');
    const exported = new Set<string>();

    for (const file of walk(actionsDir).filter((entry) => entry.endsWith('.ts'))) {
      const contents = fs.readFileSync(file, 'utf8');
      for (const match of contents.matchAll(/export async function (\w+)/g)) {
        exported.add(match[1]);
      }
    }

    const callers = readAll(['app', 'components'], (file) => file.startsWith(actionsDir));
    const orphaned = [...exported].filter((name) => !callers.includes(name));

    expect(orphaned).toEqual([]);
  });
});
