import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'example',
  plugins: [react()],
  server: { port: 5174, open: true },
  resolve: {
    alias: {
      'react-ai-stream-markdown': new URL('../src/index.tsx', import.meta.url).pathname
    }
  },
  build: {
    outDir: 'dist-example'
  }
})
