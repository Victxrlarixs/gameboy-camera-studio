// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://victxrlarixs.github.io',
  base: '/gameboy-camera-studio/',
  trailingSlash: 'always',
  vite: {
    plugins: [tailwindcss()]
  }
});