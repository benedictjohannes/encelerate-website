// @ts-check

import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

// https://astro.build/config
export default defineConfig({
    site: 'https://encelerate.com',
    integrations: [mdx(), sitemap()],
    markdown: {
        shikiConfig: {
            themes: {
                light: 'github-light-high-contrast',
                dark: 'github-dark-high-contrast',
            },
        },
    },
    vite: {
        plugins: [tailwindcss()],
    },
})
