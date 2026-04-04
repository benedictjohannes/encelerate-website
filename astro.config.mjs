// @ts-check

import fs from 'node:fs';
import path from 'node:path';
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import cloudflare from "@astrojs/cloudflare";
import svelte from "@astrojs/svelte";

// Scan for private blog posts during build time to exclude them from the sitemap
const blogDir = './src/content/blog';
const privateSlugs = new Set();

if (fs.existsSync(blogDir)) {
	const files = fs.readdirSync(blogDir);
	files.forEach(file => {
		const filePath = path.join(blogDir, file);
		const content = fs.readFileSync(filePath, 'utf-8');

		// Check for "private: true" flag in the frontmatter
		if (/^private:\s*true/m.test(content)) {
			const slug = file.replace(/\.(md|mdx)$/, '');
			privateSlugs.add(slug);
		}
	});
}

// https://astro.build/config
export default defineConfig({
	output: 'server',
	site: "https://encelerate.com",
	adapter: cloudflare(),
	integrations: [
		expressiveCode({
			themes: ["github-light-high-contrast", "github-dark-high-contrast"],
			useDarkModeMediaQuery: false,
			themeCssSelector: (theme) => theme.type === "dark" ? ".dark" : ":root",
		}),
		mdx(),
		sitemap({
			filter: (page) => {
				// Exclude pages that match any of our private slugs
				const isPrivate = [...privateSlugs].some(slug => page.includes(`/blog/${slug}`));
				return !isPrivate;
			}
		}),
		svelte(),
	],
	markdown: {
		remarkPlugins: [remarkMath],
		rehypePlugins: [rehypeKatex],
		shikiConfig: {
			themes: {
				light: "github-light-high-contrast",
				dark: "github-dark-high-contrast",
			},
		},
	},
	server: {
		allowedHosts: true
	},
	vite: {
		plugins: [tailwindcss()],
		optimizeDeps: {
			exclude: ['aws4fetch', 'better-auth']
		},
		ssr: {
			external: ['aws4fetch', 'better-auth']
		}
	},
});
