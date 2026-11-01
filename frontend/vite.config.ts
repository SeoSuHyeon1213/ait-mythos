import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import aitDevtools from '@apps-in-toss/devtools/unplugin';
export default defineConfig({
 plugins: [aitDevtools.vite(), react(), tailwindcss()],
 server: { host: '0.0.0.0', port: 5173, strictPort: true, proxy: { '/api': 'http://localhost:5080', '/health': 'http://localhost:5080' } },
});
