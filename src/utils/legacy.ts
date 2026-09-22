import type { CollectionEntry } from 'astro:content';

export function legacySlug(id: string) {
  return id
    .replace(/\.(?:md|MD)$/u, '')
    .normalize('NFKC')
    .replaceAll('\\', '/')
    .replaceAll('/', '--')
    .replaceAll('_', '-')
    .replace(/\s+/gu, '-')
    .replace(/-+/gu, '-')
    .toLowerCase();
}

function cleanInlineMarkdown(value: string) {
  return value
    .replace(/^>\s*/u, '')
    .replace(/\*\*|__|`/gu, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/gu, '$1')
    .replace(/^一句话[：:]\s*/u, '')
    .trim();
}

function fallbackTitle(id: string) {
  const basename = id.split('/').at(-1) ?? id;
  return basename
    .replace(/\.(?:md|MD)$/u, '')
    .replace(/^\d+[_-]?/u, '')
    .replaceAll('_', ' ')
    .trim();
}

function legacyCategory(id: string) {
  if (id.startsWith('study_note/data_struct/')) return 'Data Structures';
  if (id.startsWith('study_note/math/')) return 'Mathematics';
  if (id.startsWith('study_note/shader/')) return 'Shader';
  if (id.startsWith('study_note/')) return 'Shell';
  if (id.startsWith('robot_engineering/')) return 'Robot Engineering';
  if (id.startsWith('diary/')) return 'Diary';
  if (id.startsWith('hobbies/')) return 'Hobbies';
  if (id.startsWith('life_goals/')) return 'Life Goals';
  return 'Legacy Notes';
}

function legacyTags(id: string, category: string) {
  const tags = [category, 'Legacy'];
  if (id.includes('/data_struct/')) tags.push('C++', 'Algorithms');
  if (id.includes('/math/')) tags.push('Linear Algebra');
  if (id.includes('/shader/')) tags.push('GLSL', 'Computer Graphics');
  if (id.includes('/bridge/')) tags.push('Vulkan');
  if (id.includes('jetson')) tags.push('Jetson', 'Linux');
  if (id.includes('linux')) tags.push('Linux');
  if (id.toLowerCase().includes('bash') || id.startsWith('study_note/base')) tags.push('Bash');
  return [...new Set(tags)];
}

export function legacyMetadata(entry: CollectionEntry<'legacy'>) {
  const body = entry.body ?? '';
  const titleOverrides: Record<string, string> = {
    'robot_engineering/jetson_wifi': 'NVIDIA Jetson 无线网卡（Intel AX200）调试与修复指南',
  };
  const title = titleOverrides[entry.id] ?? cleanInlineMarkdown(body.match(/^#\s+(.+)$/mu)?.[1] ?? fallbackTitle(entry.id));
  const candidates = body.split(/\r?\n/u).map(cleanInlineMarkdown).filter((line) =>
    line.length >= 12 &&
    !line.startsWith('#') &&
    !line.startsWith('---') &&
    !line.startsWith('关键词：') &&
    !line.startsWith('[') &&
    !line.startsWith('```') &&
    !line.startsWith('|')
  );
  const category = legacyCategory(entry.id);
  const description = (candidates[0] ?? `原仓库迁移的 ${category} 笔记。`).slice(0, 140);

  return {
    title,
    description,
    category,
    tags: legacyTags(entry.id, category),
    slug: legacySlug(entry.id),
    originalPath: entry.id,
  };
}
