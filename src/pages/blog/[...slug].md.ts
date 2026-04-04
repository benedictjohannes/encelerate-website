import { getCollection } from 'astro:content'

// Use Vite's glob import to bundle the raw content of all markdown/mdx files.
// The `?raw` query tells Vite to treat the files as strings.
// This works perfectly in Cloudflare Workers because the content is part of the JS bundle.
const rawContentMap = import.meta.glob('/src/content/blog/**/*.{md,mdx}', {
    query: '?raw',
    import: 'default',
    eager: true,
}) as Record<string, string>

export async function getStaticPaths() {
    const posts = await getCollection('blog')
    return posts.map(post => ({
        params: { slug: post.id },
        props: { post },
    }))
}

export const GET = async ({ props }: { props: { post: any } }) => {
    const { post } = props
    
    // Prioritize reading the original file content including frontmatter.
    let body = ''

    // Find the matching file in the rawContentMap. 
    // Usually, the ID from getCollection matches the filename without extension.
    const fileKey = Object.keys(rawContentMap).find(
        key => key.endsWith(`/${post.id}.md`) || key.endsWith(`/${post.id}.mdx`)
    )

    if (fileKey) {
        body = rawContentMap[fileKey]
    }

    // Fallback to post.body if raw lookup failed.
    if (!body) {
        body = post.body
    }

    if (!body) {
        return new Response('Markdown content not found.', { status: 404 })
    }

    return new Response(body, {
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
        },
    })
}

export const prerender = true;
