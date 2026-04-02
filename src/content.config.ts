import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const blog = defineCollection({
    // Load Markdown and MDX files in the `src/content/blog/` directory.
    loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
    // Type-check frontmatter using a schema
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            description: z.string(),
            pubDate: z.coerce.date(),
            updatedDate: z.coerce.date().optional(),
            private: z.boolean().optional(),
            heroImage: image().optional(),
        }),
})

const oss = defineCollection({
    // Load Markdown files in the `src/content/oss/` directory.
    loader: glob({ base: './src/content/oss', pattern: '**/*.md' }),
    // Type-check frontmatter using a schema
    schema: z.object({
        name: z.string(),
        language: z.enum(['Javascript', 'Rust', 'TypeScript', 'Bash', 'Go']),
        repo: z.string().url(),
        shields: z.array(z.object({
            label: z.string(),
            img: z.string(),
            url: z.string().optional(),
        })).optional(),
        repoShortText: z.string().optional(),
    }),
})

export const collections = { blog, oss }
