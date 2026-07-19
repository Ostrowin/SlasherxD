import { defineConfig } from 'vite';

export default defineConfig({
  // Ścieżki względne — warunek taniej publikacji na itch.io (gra serwowana z podkatalogu w iframe).
  base: './',
});
