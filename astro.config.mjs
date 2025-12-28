// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";

// https://astro.build/config
export default defineConfig({
	site: "https://encelerate.com",
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
