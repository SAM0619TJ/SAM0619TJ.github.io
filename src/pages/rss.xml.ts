import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { byNewest, isPublished } from '../utils/content';

export async function GET(context: { site: URL }) {
  const posts = byNewest((await getCollection('blog')).filter(isPublished));
  return rss({
    title: 'Miyako Technical Blog',
    description: '机器人、计算机视觉、嵌入式系统与工程实践。',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/blog/${post.id}/`,
      categories: post.data.tags,
    })),
    customData: '<language>zh-CN</language>',
  });
}
