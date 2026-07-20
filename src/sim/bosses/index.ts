import type { BossDef } from './types';
import { HIVE_QUEEN } from './hiveQueen';
import { VOID_WARDEN } from './voidWarden';

/**
 * Rejestr bossów. Nowego bossa dodajesz w dwóch krokach:
 *  1. nowy plik obok (np. `voidWarden.ts`) z definicją `BossDef`
 *  2. import + wpis do tablicy poniżej
 *
 * Który boss pojawia się na której fali: `wavesConfig.ts` (BOSS_WAVES).
 */
export const BOSSES: BossDef[] = [HIVE_QUEEN, VOID_WARDEN];

export function bossById(id: string): BossDef | null {
  return BOSSES.find((b) => b.id === id) ?? null;
}

export * from './types';
