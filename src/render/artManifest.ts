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
};

export interface SpriteDef {
  atlas: string;
  /** Czy wypalić klatkę `#rim` (obwódka w kolorze gracza) — tylko postacie graczy (D4). */
  rim: boolean;
}

/** Każdy plik `art/svg/<nazwa>.svg` musi tu mieć wpis — `bakeArt` odrzuca sieroty. */
export const SPRITES: Record<string, SpriteDef> = {
  hero_bear_gravity: { atlas: 'heroes', rim: true },
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
  bear: { soldier: null, specs: ['hero_bear_gravity', null, null], energy: 0xb070ff },
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
 * Klatka postaci dla klasy i specjalizacji. Bez specjalizacji: szeregowy, a dopóki go nie ma (Etap 1) —
 * pierwsza narysowana specjalizacja, żeby próbka dalej była widoczna.
 */
export function heroFrameFor(classId: string, specIndex: number): string | null {
  const def = HEROES[classId];
  if (!def) return null;
  if (specIndex >= 0 && def.specs[specIndex]) return def.specs[specIndex];
  return def.soldier ?? def.specs.find((f) => f !== null) ?? null;
}
