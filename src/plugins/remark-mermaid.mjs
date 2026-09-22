function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export default function remarkMermaid() {
  return (tree) => {
    const visit = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'code' && node.lang === 'mermaid') {
        node.type = 'html';
        node.value = `<div class="mermaid" data-mermaid>${escapeHtml(node.value)}</div>`;
        delete node.lang;
        delete node.meta;
        return;
      }
      if (Array.isArray(node.children)) node.children.forEach(visit);
    };
    visit(tree);
  };
}
