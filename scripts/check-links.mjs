import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const root = resolve('dist');
const htmlFiles = [];

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name.endsWith('.html')) htmlFiles.push(path);
  }
}

function outputPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  if (decoded === '/') return join(root, 'index.html');
  const clean = decoded.replace(/^\/+/, '').replace(/\/$/, '');
  return extname(clean) ? join(root, clean) : join(root, clean, 'index.html');
}

walk(root);
const broken = [];

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const route = `/${relative(root, file).replaceAll('\\', '/').replace(/index\.html$/, '')}`;
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const value = match[1];
    if (!value || value.startsWith('#') || /^(?:https?:|mailto:|tel:|data:|javascript:)/.test(value)) continue;
    const url = new URL(value, `https://local.invalid${route}`);
    const target = outputPath(url.pathname);
    if (!existsSync(target)) broken.push(`${relative(root, file)} -> ${value}`);
  }
}

if (broken.length) {
  console.error(`Broken internal links (${broken.length}):\n${broken.join('\n')}`);
  process.exit(1);
}

console.log(`Checked ${htmlFiles.length} HTML files: 0 broken internal links.`);
