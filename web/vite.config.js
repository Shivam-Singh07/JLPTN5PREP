import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'node:https';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'tts-proxy-middleware',
      configureServer(server) {
        server.middlewares.use('/api/tts', (req, res) => {
          handleTTSProxy(req, res);
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use('/api/tts', (req, res) => {
          handleTTSProxy(req, res);
        });
      }
    }
  ],
  server: {
    port: 5173,
    host: true
  },
  preview: {
    port: 5173,
    host: true
  },
  build: {
    chunkSizeWarningLimit: 1500
  }
});

function handleTTSProxy(req, res) {
  try {
    const urlObj = new URL(req.url, 'http://localhost:5173');
    const q = urlObj.searchParams.get('q');
    if (!q) {
      res.statusCode = 400;
      res.end('Missing query');
      return;
    }
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=${encodeURIComponent(q)}`;
    https.get(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, {
        'Content-Type': 'audio/mpeg',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400'
      });
      proxyRes.pipe(res);
    }).on('error', (err) => {
      res.statusCode = 500;
      res.end('TTS Proxy Error');
    });
  } catch (e) {
    res.statusCode = 500;
    res.end('Server Error');
  }
}
