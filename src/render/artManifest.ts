/**
 * Manifest grafik (docs/designs/plan-grafik.md, Etap 0): jedno miejsce, które mówi, jaki sprite należy
 * do jakiej klasy/specjalizacji, w którym atlasie leży i czy dostaje obwódkę.
 *
 * Czytają go DWA światy: gra (import przez Vite) i `tools/bakeArt.ts` (node, samo wycinanie typów).
 * Dlatego plik jest samodzielny: zero importów (ani Phasera, ani `src/sim`) i tylko składnia, którą
 * node umie wyciąć (sprawdza to `tsconfig.tools.json` z `erasableSyntaxOnly`).
 */

/** Ile pikseli ekranu (px CSS, `Scale.RESIZE`) przypada na jednostkę SVG postaci. Postać 122 jedn. ≈ 61 px. */
export const SCREEN_PX_PER_UNIT = 0.5;

/** Grubość obwódki postaci w pikselach ekranu (D3/D4 w planie). */
export const RIM_SCREEN_PX = 2;

export interface AtlasDef {
  /** Klucz tekstury w Phaserze i nazwa plików `public/art/<key>.{png,json}`. */
  key: string;
  /** Piksele atlasu na jednostkę SVG (D2: postacie 0.75 — ostre także w skoku ×1.35). */
  scale: number;
  /** Maks. bok atlasu — telefony; `bakeArt` przerywa z błędem przy przepełnieniu. */
  maxSize: number;
}

export const ATLASES: Record<string, AtlasDef> = {
  heroes: { key: 'heroes', scale: 0.75, maxSize: 2048 },
  // przeszkody aren: na ekranie do ~180 px (promień kolizji 90), więc gęściej niż postacie
  world: { key: 'world', scale: 1.5, maxSize: 2048 },
};

export interface SpriteDef {
  atlas: string;
  /** Czy wypalić klatkę `#rim` (obwódka w kolorze gracza) — tylko postacie graczy (D4). */
  rim: boolean;
}

/** Każdy plik `art/svg/<nazwa>.svg` musi tu mieć wpis — `bakeArt` odrzuca sieroty. */
export const SPRITES: Record<string, SpriteDef> = {
  hero_bear_soldier: { atlas: 'heroes', rim: true },
  hero_bear_gravity: { atlas: 'heroes', rim: true },
  hero_bear_rampage: { atlas: 'heroes', rim: true },
  hero_bear_colossus: { atlas: 'heroes', rim: true },
  sum_gravity_well: { atlas: 'heroes', rim: false },
  sum_gravity_collapse: { atlas: 'heroes', rim: false },
  obs_station_reactor: { atlas: 'world', rim: false },
  obs_station_crates: { atlas: 'world', rim: false },
  obs_station_wreck: { atlas: 'world', rim: false },
  obs_crater_boulder: { atlas: 'world', rim: false },
  obs_crater_spire: { atlas: 'world', rim: false },
  obs_crater_vent: { atlas: 'world', rim: false },
};

/** Promień okrągłego śladu przeszkody w jednostkach SVG (tools/svg_gen/ws_world.py: FOOT). */
export const OBSTACLE_FOOT = 52;

export interface MapArtDef {
  /** Kafel podłoża `public/art/tiles/<tile>.png` (tools/bakeTiles.ts). */
  tile: string;
  /** Warianty przeszkód — wybór per przeszkoda deterministyczny (indeks), bez losowania w renderze. */
  obstacles: string[];
  /** Kolor akcentu mapy: neon stacji / żar lawy — poświaty przeszkód i krawędź areny. */
  accent: number;
}

/** Grafika aren (plan, Etap 2). Mapy bez wpisu (np. `comingSoon`) rysują się jak dawniej: gwiazdy + siatka. */
export const MAP_ART: Record<string, MapArtDef> = {
  station: {
    tile: 'station',
    obstacles: ['obs_station_reactor', 'obs_station_crates', 'obs_station_wreck'],
    accent: 0x3d8bff,
  },
  crater: {
    tile: 'crater',
    obstacles: ['obs_crater_boulder', 'obs_crater_spire', 'obs_crater_vent'],
    accent: 0xff6b1a,
  },
};

export interface HeroArtDef {
  /** Szeregowy przed wyborem specjalizacji (Etap 1); `null` = jeszcze nie narysowany. */
  soldier: string | null;
  /** Klatka dla każdej gałęzi specjalizacji (indeks = `specIndex`); `null` = brak grafiki. */
  specs: (string | null)[];
  /** Kolor energii rasy — neon (poświaty) i znak „swój” przywołańców. */
  energy: number;
}

export const HEROES: Record<string, HeroArtDef> = {
  // gałęzie: GRAVITY MAGE, RAMPAGE, HIBERNATION (w TD jej postacią jest Kolos)
  bear: {
    soldier: 'hero_bear_soldier',
    specs: ['hero_bear_gravity', 'hero_bear_rampage', 'hero_bear_colossus'],
    energy: 0xb070ff,
  },
};

/**
 * Przywołańce i pola z grafiką: id z `src/sim/minionsConfig.ts` → klatka. Bez obwódki (D4); „swój” poznaje się
 * po energii rasy w rysunku. Reszta przywołańców dalej rysuje się świecącym wielokątem.
 */
/**
 * Przywołańce rysujemy 1.5× gęściej niż postacie: pylon studni ma wtedy ~45 px, tyle co dawny świecący sześciokąt,
 * i nie ginie w środku swojego 200-pikselowego pola (karta Etapu 2).
 */
export const SUMMON_SCALE = 1.5;

export const SUMMONS: Record<string, string> = {
  'gravity-field': 'sum_gravity_well',
  'gravity-field-crush': 'sum_gravity_well',
  'gravity-field-singularity': 'sum_gravity_well',
  'gravity-collapse': 'sum_gravity_collapse',
};

/**
 * Kolory slotów graczy (D3): obwódka i pas drużyny. Klasę pokazuje rysunek, a kolor mówi „to ty / to Kuba”.
 * Każdy ma luminancję względną ≥ 0,35 na tle `#0a0a12` — pilnuje tego `bench/artCheck.ts`.
 */
export const PLAYER_COLORS: number[] = [
  0x3fd8ff, // cyjan
  0xffc233, // bursztyn
  0x7dff6a, // zieleń
  0xff6ad5, // róż
  0xc0a0ff, // lawenda
  0xff9a4a, // pomarańcz
  0x5ff3c0, // mięta
  0xf0f0f0, // biel
];

export const PLAYER_COLOR_MIN_LUMINANCE = 0.35;

/**
 * Klatka postaci dla klasy i specjalizacji. Bez specjalizacji: szeregowy; gałąź bez grafiki (np. `comingSoon`)
 * zostaje przy szeregowym. Gdy rasa nie ma jeszcze szeregowego — pierwsza narysowana specjalizacja.
 */
export function heroFrameFor(classId: string, specIndex: number): string | null {
  const def = HEROES[classId];
  if (!def) return null;
  if (specIndex >= 0 && def.specs[specIndex]) return def.specs[specIndex];
  return def.soldier ?? def.specs.find((f) => f !== null) ?? null;
}
