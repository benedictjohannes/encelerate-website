import { getCollection } from 'astro:content'
import { readFileSync } from 'node:fs'

export async function getStaticPaths() {
    const posts = await getCollection('blog')
    return posts.map(post => ({
        params: { slug: post.id },
        props: { post },
    }))
}

export const GET = async ({ props }: { props: { post: any } }) => {
    const { post } = props
    
    // Prioritize reading the original file to include frontmatter.
    let body = ''

    if (post.filePath) {
        try {
            body = readFileSync(post.filePath, 'utf-8')
        } catch (e) {
            console.error(`Failed to read markdown file: ${post.filePath}`, e)
        }
    }

    // Fallback to post.body if filePath failed or is missing.
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
