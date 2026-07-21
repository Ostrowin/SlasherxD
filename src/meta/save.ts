import { classById, DEFAULT_CLASS_ID } from '../sim/classes';
import { META_UPGRADES } from '../sim/metaConfig';
import type { MetaBonus } from '../sim/world';

/**
 * Zapis stanu meta-progresji w localStorage.
 *
 * UWAGA architektoniczna: ten plik celowo NIE leży w src/sim — symulacja
 * musi zostać czysta (bez DOM i localStorage), żeby dało się ją uruchomić
 * identycznie u każdego gracza w przyszłym co-opie.
 *
 * Zapis jest wersjonowany i defensywny: uszkodzony albo starszy plik nie
 * wywala gry, tylko wraca do stanu domyślnego.
 */

const SAVE_KEY = 'webslasher.save';
const SAVE_VERSION = 2;

/**
 * Roster z wersji 1 zapisu, w oryginalnej kolejności. Potrzebny WYŁĄCZNIE do
 * migracji `lastClassIndex` → `lastClassId`: w v1 klasa była zapisana
 * indeksem, a roster od tego czasu się zmienił (gdd.md 5.4).
 * Kapibara i pancernik nie istnieją — mapujemy na klasy o tej samej roli.
 */
const V1_CLASS_IDS = [
  'bear', 'wolf', 'fox', 'hare', 'mole',
  'hedgehog', 'bat',
  'otter', // była kapibara — spokojny support, więc rolę przejmuje wydra
  'gorilla',
  'bear', // był pancernik — tank, więc rolę przejmuje niedźwiedź
];

export interface SaveData {
  version: number;
  /** Waluta meta (SALVAGE). */
  currency: number;
  /** Poziomy trwałych ulepszeń: id z META_UPGRADES → poziom. */
  upgrades: Record<string, number>;
  stats: {
    runs: number;
    victories: number;
    bestWave: number;
    bestKills: number;
    totalKills: number;
    /** Id ostatnio granej klasy — podpowiadamy ją przy starcie. */
    lastClassId: string;
  };
}

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    currency: 0,
    upgrades: {},
    stats: {
      runs: 0,
      victories: 0,
      bestWave: 0,
      bestKills: 0,
      totalKills: 0,
      lastClassId: DEFAULT_CLASS_ID,
    },
  };
}

/**
 * Migracja w miejscu: `stats.lastClassIndex` (v1) → `stats.lastClassId` (v2).
 * Waluta, ulepszenia i rekordy przechodzą bez zmian.
 */
function migrateV1ToV2(save: Record<string, unknown>): void {
  const stats = save.stats as Record<string, unknown> | undefined;
  const oldIndex = Number(stats?.lastClassIndex);
  const migrated =
    Number.isFinite(oldIndex) && oldIndex >= 0 && oldIndex < V1_CLASS_IDS.length
      ? V1_CLASS_IDS[oldIndex]
      : DEFAULT_CLASS_ID;
  if (stats) {
    stats.lastClassId = migrated;
    delete stats.lastClassIndex;
  }
  save.version = SAVE_VERSION;
}

/** Odczyt zapisu; przy braku, uszkodzeniu albo starej wersji zwraca domyślny. */
export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    if (!parsed) return defaultSave();
    // Wersja 1 → 2: klasa była zapisana indeksem. Migrujemy zamiast kasować,
    // żeby zmiana rosteru nie zabrała graczowi uzbieranego SALVAGE.
    if (parsed.version === 1) migrateV1ToV2(parsed as Record<string, unknown>);
    else if (parsed.version !== SAVE_VERSION) return defaultSave();

    const base = defaultSave();
    const upgrades: Record<string, number> = {};
    // Przepisujemy tylko znane ulepszenia i przycinamy do maxLevel —
    // zmiana configu nie może wpuścić do gry nieprawidłowego stanu.
    for (const def of META_UPGRADES) {
      const lvl = Number(parsed.upgrades?.[def.id] ?? 0);
      upgrades[def.id] = Number.isFinite(lvl)
        ? Math.max(0, Math.min(def.maxLevel, Math.floor(lvl)))
        : 0;
    }
    const currency = Number(parsed.currency);
    return {
      version: SAVE_VERSION,
      currency: Number.isFinite(currency) ? Math.max(0, Math.floor(currency)) : 0,
      upgrades,
      stats: {
        ...base.stats,
        ...(parsed.stats ?? {}),
        // Klasa mogła zniknąć z rosteru między wersjami gry — wtedy wracamy
        // do domyślnej, zamiast zostawiać w zapisie martwe id.
        lastClassId: classById(parsed.stats?.lastClassId ?? '')
          ? parsed.stats!.lastClassId
          : DEFAULT_CLASS_ID,
      },
    };
  } catch {
    // Prywatne okno, wyłączony storage, uszkodzony JSON — gramy bez zapisu.
    return defaultSave();
  }
}

/** Zapis; przy braku dostępu do storage cicho się poddaje (gra działa dalej). */
export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    /* brak zapisu nie może psuć rozgrywki */
  }
}

export function resetSave(): SaveData {
  const fresh = defaultSave();
  writeSave(fresh);
  return fresh;
}

export function upgradeLevel(save: SaveData, id: string): number {
  return save.upgrades[id] ?? 0;
}

/**
 * Zamienia kupione poziomy na listę bonusów startowych dla symulacji.
 * To jedyny most między zapisem a rdzeniem gry — World dostaje gotowe dane,
 * nigdy nie sięga sam do localStorage.
 */
export function metaBonusesFrom(save: SaveData): MetaBonus[] {
  const bonuses: MetaBonus[] = [];
  for (const def of META_UPGRADES) {
    const level = upgradeLevel(save, def.id);
    if (level > 0) bonuses.push({ kind: def.kind, value: def.valuePerLevel * level });
  }
  return bonuses;
}
