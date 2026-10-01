import { createServer } from 'vite';

// Run without loading a bundled config or Vite's native dependency scanner.
// This keeps local development reliable in restricted Windows workspaces.
const server = await createServer({
  configFile: false,
  root: process.cwd(),
  appType: 'spa',
  esbuild: { jsx: 'automatic' },
  optimizeDeps: { noDiscovery: true, include: [] },
  css: { postcss: { plugins: [] } },
  server: { host: '0.0.0.0', port: 4173, strictPort: true },
});
await server.listen();
server.printUrls();
