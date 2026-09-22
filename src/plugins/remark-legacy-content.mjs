function legacySlug(path) {
  return path
    .replace(/\.(?:md|MD)$/u, '')
    .normalize('NFKC')
    .replaceAll('\\', '/')
    .replaceAll('/', '--')
    .replaceAll('_', '-')
    .replace(/\s+/gu, '-')
    .replace(/-+/gu, '-')
    .toLowerCase();
}

function rewriteLegacyUrl(url) {
  let value = decodeURI(url);
  const queryMatch = value.match(/^md\.html\?file=(.+\.(?:md|MD))(?:#.*)?$/u);
  if (queryMatch) value = queryMatch[1];

  if (/^(?:study_note|robot_engineering|diary|hobbies|life_goals)\/.*\.(?:md|MD)$/u.test(value)) {
    return `/notes/${legacySlug(value)}/`;
  }

  if (/^(?:study_note|robot_engineering)\/.*\/index\.html$/u.test(value)) {
    return '/notes/';
  }

  return url;
}

export default function remarkLegacyContent() {
  return (tree, file) => {
    const filePath = String(file.path ?? '').replaceAll('\\', '/');
    const isLegacy = /\/(?:study_note|robot_engineering|diary|hobbies|life_goals)\//u.test(filePath);

    const visit = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'link' && typeof node.url === 'string') {
        node.url = rewriteLegacyUrl(node.url);
      }
      if ((node.type === 'math' || node.type === 'inlineMath') && typeof node.value === 'string') {
        node.value = node.value.replaceAll('²', '^2').replaceAll('³', '^3');
      }
      if (Array.isArray(node.children)) node.children.forEach(visit);
    };
    visit(tree);

    // Page metadata already renders the document title as the semantic h1.
    // Remove the legacy file's first h1 to avoid duplicate titles.
    if (isLegacy && Array.isArray(tree.children)) {
      const index = tree.children.findIndex((node) => node.type === 'heading' && node.depth === 1);
      if (index >= 0) tree.children.splice(index, 1);
      tree.children.forEach((node) => {
        if (node.type === 'heading' && node.depth === 1) node.depth = 2;
      });
    }
  };
}
