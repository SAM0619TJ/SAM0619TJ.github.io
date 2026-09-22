export default function rehypeLegacyMath() {
  return (tree) => {
    const visit = (node, insideMath = false) => {
      if (!node || typeof node !== 'object') return;
      const classes = Array.isArray(node.properties?.className) ? node.properties.className : [];
      const isMath = insideMath || classes.includes('math-inline') || classes.includes('math-display') || classes.includes('language-math');
      if (isMath && node.type === 'text' && typeof node.value === 'string') {
        node.value = node.value.replaceAll('²', '^2').replaceAll('³', '^3');
      }
      if (Array.isArray(node.children)) node.children.forEach((child) => visit(child, isMath));
    };
    visit(tree);
  };
}
