import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { SITE_DESCRIPTION, SITE_TITLE } from '../consts';
import { makeAbsoluteUrls } from '../lib/html';
import MarkdownIt from 'markdown-it';
import type { APIRoute } from 'astro'; // <-- New import

const parser = new MarkdownIt();

export const prerender = true;

export const GET: APIRoute = async (context) => { // <-- Typed function
	const posts = await getCollection('blog');
	const publicPosts = posts
		.filter((post) => post.data.private !== true)
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
		.slice(0, 20);

	const items = await Promise.all(
		publicPosts.map(async (post) => {
			const html = parser.render(post.body || '');
			const absoluteHtml = await makeAbsoluteUrls(html, context.site?.origin || '');

			return {
				...post.data,
				link: `/blog/${post.id}/`,
				content: absoluteHtml,
			};
		})
	);

	return await rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site?.toString() || '', //rss helper expects string
		items,
	});
};
