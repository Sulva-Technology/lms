import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const walk = (dir: string): string[] => {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
};

describe('page completion contracts', () => {
  it('does not leave route-facing LMS placeholders or mock-backed production flows', () => {
    const source = walk(path.join(process.cwd(), 'app'))
      .concat(walk(path.join(process.cwd(), 'components')))
      .filter((file) => /\.(tsx|ts)$/.test(file))
      .map((file) => fs.readFileSync(file, 'utf8'))
      .join('\n');

    expect(source).not.toContain('will be displayed here');
    expect(source).not.toContain('PlaceholderPage');
    expect(source).not.toContain('MO' + 'CK_REGISTRATION');
    expect(source).not.toContain('MO' + 'CK_COURSE_DETAIL');
    expect(source).not.toContain('MO' + 'CK_VIDEO_LESSON');
  });

  it('does not keep forbidden fake data or stub markers in runtime code', () => {
    const runtimeSource = ['app', 'components', 'lib', 'types']
      .flatMap((segment) => walk(path.join(process.cwd(), segment)))
      .filter((file) => /\.(tsx|ts)$/.test(file))
      .map((file) => fs.readFileSync(file, 'utf8'))
      .join('\n');

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
});
