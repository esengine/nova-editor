import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  optimizeDeps: {
    include: ['monaco-editor/esm/vs/language/typescript/ts.worker']
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    target: 'es2018',
    outDir: 'dist',
    sourcemap: true
  }
});
