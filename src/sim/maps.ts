/**
 * Mapy (areny) do wyboru po klasie. Na razie JEDNA realna — reszta `comingSoon`
 * (widoczna, ale niewybieralna), tak jak niezaprojektowane gałęzie talentów.
 *
 * `id` jest jedynym identyfikatorem przekraczającym granice (zapis, sieć).
 * Docelowo mapa wpłynie na generację świata (przeszkody, rozmiar, pula wrogów);
 * dziś tylko `station` istnieje i odpowiada obecnej arenie — wybór jest przekazywany
 * do `GameScene`, ale symulacji jeszcze nie zmienia.
 */
export interface MapDef {
  id: string;
  /** Nazwa pokazywana w grze (EN — teksty w grze). */
  name: string;
  color: number;
  /** Jednozdaniowy opis na ekranie wyboru. */
  blurb: string;
  /** Mapa jeszcze niezaprojektowana — widoczna, ale zablokowana. */
  comingSoon?: boolean;
  /**
   * Harmonogram bossów tej mapy: numer fali → LISTA id bossów (z `src/sim/bosses/`).
   * Lista, bo na jednej fali może stać KILKU bossów naraz (np. 3× ten sam).
   * Fala z bossem nie kończy się na czas — trwa, dopóki żyje którykolwiek boss.
   */
  bossWaves: Record<number, string[]>;
}

export const MAPS: MapDef[] = [
  {
    id: 'station', name: 'Derelict Station', color: 0x2a6ad4,
    blurb: 'Neon ruins adrift in the void. The classic arena.',
    bossWaves: {
      5: ['void-warden'],
      7: ['plasma-reaver'],
      9: ['hive-colossus'],
      10: ['hive-queen'],
    },
  },
  {
    id: 'crater', name: 'Impact Crater', color: 0xff6b1a,
    blurb: 'Molten rock and relentless invaders. Wave 9: a pack of Ember Stalkers.',
    bossWaves: {
      5: ['ember-stalker'],
      7: ['obsidian-colossus'],
      // Fala 9 — TRZEJ bossowie naraz (3× boss z fali 5).
      9: ['ember-stalker', 'ember-stalker', 'ember-stalker'],
      10: ['core-tyrant'],
    },
  },
  { id: 'reactor', name: 'Reactor Core', color: 0x39ff14, blurb: 'Coming soon — hazard floors, nowhere to rest.', comingSoon: true, bossWaves: {} },
  { id: 'hive',    name: 'The Hive',     color: 0xff3ea5, blurb: 'Coming soon — organic maze, ambush corridors.', comingSoon: true, bossWaves: {} },
];

/** Mapa awaryjna / domyślna — gdy id jest nieznane albo pominięte. */
export const DEFAULT_MAP_ID = MAPS[0].id;

export function mapById(id: string): MapDef | null {
  return MAPS.find((m) => m.id === id) ?? null;
}
