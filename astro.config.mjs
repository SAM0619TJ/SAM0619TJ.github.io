import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkMermaid from './src/plugins/remark-mermaid.mjs';
import remarkLegacyContent from './src/plugins/remark-legacy-content.mjs';
import rehypeLegacyMath from './src/plugins/rehype-legacy-math.mjs';
import { unified } from '@astrojs/markdown-remark';

export default defineConfig({
  site: 'https://sam0619tj.github.io',
  output: 'static',
  integrations: [mdx(), sitemap()],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath, remarkMermaid, remarkLegacyContent],
      rehypePlugins: [rehypeLegacyMath, [rehypeKatex, { strict: false }]],
    }),
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: false,
    },
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Mermaid diagram engines are lazy chunks and never block ordinary pages.
      chunkSizeWarningLimit: 1600,
    },
  },
});
