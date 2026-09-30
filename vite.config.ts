import { appendFileSync, mkdirSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

/**
 * Tylko `npm run dev`: przyjmuje wynik sondy FPS szybkiego startu (src/render/devStart.ts) i dopisuje go
 * do `.dev/fps.jsonl` — wynik zostaje, nawet gdy karta przeglądarki (albo telefon) już się zamknęła.
 * `configureServer` nie działa w buildzie, więc na itch.io tego endpointu nie ma.
 */
function devFpsLog(): Plugin {
  return {
    name: 'dev-fps-log',
    configureServer(server) {
      server.middlewares.use('/__dev/fps', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
          try {
            JSON.parse(body);
            mkdirSync('.dev', { recursive: true });
            appendFileSync('.dev/fps.jsonl', body.replace(/\n/g, ' ') + '\n');
            res.end('ok');
          } catch {
            res.statusCode = 400;
            res.end('bad json');
          }
        });
      });
    },
  };
}

export default defineConfig({
  // Ścieżki względne — warunek taniej publikacji na itch.io (gra serwowana z podkatalogu w iframe).
  base: './',
  plugins: [devFpsLog()],
});
