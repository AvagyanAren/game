import { defineConfig } from 'vite';

export default defineConfig({
  /** Relative base for portable static hosts (jsDelivr, Netlify, etc.). */
  base: process.env.GITHUB_PAGES === 'true' ? './' : '/',
  server: {
    host: '127.0.0.1',
    port: 43123,
  },
  preview: {
    host: '127.0.0.1',
    port: 43123,
  },
});