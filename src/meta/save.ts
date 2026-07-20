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
const SAVE_VERSION = 1;

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
    /** Indeks ostatnio granej klasy — podpowiadamy go przy starcie. */
    lastClassIndex: number;
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
      lastClassIndex: 0,
    },
  };
}

/** Odczyt zapisu; przy braku, uszkodzeniu albo starej wersji zwraca domyślny. */
export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    if (!parsed || parsed.version !== SAVE_VERSION) return defaultSave();

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
      stats: { ...base.stats, ...(parsed.stats ?? {}) },
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
