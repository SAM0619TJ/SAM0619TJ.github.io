import type { CollectionEntry } from 'astro:content';

export function byNewest<T extends { data: { date: Date } }>(entries: T[]) {
  return entries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function readingTime(body = '') {
  const latinWords = body.match(/[A-Za-z0-9_]+/g)?.length ?? 0;
  const cjkChars = body.match(/[\u3400-\u9fff\uf900-\ufaff]/g)?.length ?? 0;
  return Math.max(1, Math.ceil(latinWords / 220 + cjkChars / 400));
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function isPublished<T extends CollectionEntry<'blog'> | CollectionEntry<'notes'> | CollectionEntry<'projects'>>(entry: T) {
  return !entry.data.draft;
}

export function slugifyTag(tag: string) {
  return tag.toLowerCase().replaceAll(' ', '-');
}
