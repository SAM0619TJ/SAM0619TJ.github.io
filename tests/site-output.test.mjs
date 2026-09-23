import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFile, readFile, rm, stat } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

import { isPublished } from '../src/utils/content.ts';
import { legacySlug } from '../src/utils/legacy.ts';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = join(repositoryRoot, 'dist');
const draftFixture = join(repositoryRoot, 'tests/fixtures/draft-post.md');
const draftTarget = join(repositoryRoot, 'src/content/blog/draft-publication-fixture.md');

await copyFile(draftFixture, draftTarget);
try {
  execFileSync('npm', ['run', 'build'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    stdio: 'inherit',
  });
} finally {
  await rm(draftTarget, { force: true });
}

test('legacy slugs and rendered links use the Notes route', async () => {
  assert.equal(
    legacySlug('study_note/data_struct/24_KD-tree.md'),
    'study-note-data-struct-24-kd-tree',
  );
  assert.equal(
    legacySlug('study_note/math/SVD奇异值分解.md'),
    'study-note-math-svd奇异值分解',
  );

  const sourcePage = await readFile(
    join(distRoot, 'notes/study-note-data-struct-25-bsp-tree/index.html'),
    'utf8',
  );
  assert.match(sourcePage, /href="\/notes\/study-note-data-struct-24-kd-tree\/"/);
  await stat(join(distRoot, 'notes/study-note-data-struct-24-kd-tree/index.html'));
});

test('production publication rules and build output exclude drafts', async () => {
  const published = { data: { draft: false } };
  const draft = { data: { draft: true } };

  assert.equal(isPublished(published), true);
  assert.equal(isPublished(draft), false);

  await assert.rejects(
    stat(join(distRoot, 'blog/draft-publication-fixture/index.html')),
    (error) => error?.code === 'ENOENT',
  );

  const generatedFiles = await readFile(join(distRoot, 'pagefind/pagefind-entry.json'), 'utf8');
  assert.doesNotMatch(generatedFiles, /DRAFT_FIXTURE_SENTINEL|draft-publication-fixture/);
});

test('RSS contains published Blog entries with absolute URLs', async () => {
  const rss = await readFile(join(distRoot, 'rss.xml'), 'utf8');

  assert.match(rss, /<title>Miyako Technical Blog<\/title>/);
  assert.match(rss, /https:\/\/sam0619tj\.github\.io\/blog\/getting-started-with-ros2\//);
  assert.match(rss, /https:\/\/sam0619tj\.github\.io\/blog\/vins-fusion-architecture\//);
  assert.doesNotMatch(rss, /draft-publication-fixture|DRAFT_FIXTURE_SENTINEL/);
});

test('Pagefind can query the generated production index', async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (resource) => {
    try {
      const url = new URL(typeof resource === 'string' || resource instanceof URL ? resource : resource.url);
      assert.equal(url.origin, 'https://pagefind.test');
      const pathname = decodeURIComponent(url.pathname);
      const filePath = resolve(distRoot, `.${pathname}`);
      if (filePath !== distRoot && !filePath.startsWith(`${distRoot}${sep}`)) {
        return new Response(null, { status: 403 });
      }

      const body = await readFile(filePath);
      const contentType = filePath.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream';
      return new Response(body, { status: 200, headers: { 'content-type': contentType } });
    } catch (error) {
      return new Response(null, { status: error?.code === 'ENOENT' ? 404 : 500 });
    }
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const basePath = 'https://pagefind.test/pagefind/';
  const pagefindModule = await import(`${pathToFileURL(join(distRoot, 'pagefind/pagefind.js')).href}?test`);
  const pagefind = pagefindModule.createInstance({ basePath, language: 'zh-cn', noWorker: true });
  t.after(() => pagefind.destroy());

  await pagefind.init();
  const response = await pagefind.search('VINS-Fusion');
  const results = await Promise.all(response.results.slice(0, 10).map((result) => result.data()));

  assert(response.results.length > 0);
  assert(results.some((result) => new URL(result.url, 'https://sam0619tj.github.io').pathname === '/blog/vins-fusion-architecture/'));
  assert(results.every((result) => !result.url.includes('draft-publication-fixture')));
});
