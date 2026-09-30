/**
 * Znacznik szybkiego startu (`devStart.ts`). Osobny plik bez zależności, bo czyta go też `bench/artCheck.ts`,
 * który sprawdza, że znacznik NIE występuje w `dist/` (kod DEV nie trafia do buildu na itch.io).
 */
export const DEV_MARKER = '[dev-quickstart]';
