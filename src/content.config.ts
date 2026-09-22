import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const common = {
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
};

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    ...common,
    featured: z.boolean().default(false),
  }),
});

const notes = defineCollection({
  loader: glob({ base: './src/content/notes', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    ...common,
    category: z.string(),
  }),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tech: z.array(z.string()),
    status: z.enum(['Active', 'Completed', 'Archived']),
    github: z.url().optional(),
    documentation: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

// Read the repository's original Markdown in place. Keeping this collection
// schema-less lets those historical files remain untouched while Astro renders
// them through the new Notes UI.
const legacy = defineCollection({
  loader: glob({
    base: '.',
    pattern: '{robot_engineering,study_note,diary,hobbies,life_goals}/**/*.md',
  }),
});

export const collections = { blog, notes, projects, legacy };
