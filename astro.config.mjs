// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
	site: "https://encelerate.com",
	adapter: cloudflare(),
	integrations: [
		expressiveCode({
			themes: ["github-light-high-contrast", "github-dark-high-contrast"],
			useDarkModeMediaQuery: false,
			themeCssSelector: (theme) => theme.type === "dark" ? ".dark" : ":root",
		}),
		mdx(),
		sitemap(),
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
	},
});
