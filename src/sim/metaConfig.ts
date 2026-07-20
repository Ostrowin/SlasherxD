import type { ItemKind } from './itemsConfig';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  KONFIGURACJA META-PROGRESJI — postęp, który ZOSTAJE między runami.
 *  Edytuj śmiało, Vite przeładuje grę po zapisie.
 *
 *  Pętla: grasz → zbierasz SALVAGE → giniesz → kupujesz trwałe ulepszenia
 *  w LAB → następny run zaczynasz mocniejszy.
 * ═══════════════════════════════════════════════════════════════════
 */

/** Nazwa waluty pokazywana w grze (EN). */
export const CURRENCY_NAME = 'SALVAGE';

export const REWARD_CONFIG = {
  /** Ile SALVAGE za jednego zabitego najeźdźcę. */
  perKill: 0.1,
  /** Ile SALVAGE za każdą przetrwaną falę. */
  perWaveCleared: 25,
  /** Premia za przejście całego runu (zwycięstwo). */
  victoryBonus: 200,
  /** Mnożnik całej nagrody — szybka pokrętka tempa progresji. */
  globalMultiplier: 1,
};

/**
 * Efekty meta używają tych samych typów co itemy (itemsConfig.ts),
 * plus `dropChance` dostępny wyłącznie tutaj.
 */
export type MetaEffectKind = ItemKind | 'dropChance';

export interface MetaUpgradeDef {
  id: string;
  name: string;
  /** Opis jednego poziomu (EN — teksty w grze). */
  desc: string;
  kind: MetaEffectKind;
  color: number;
  /** Ile efektu daje JEDEN poziom. */
  valuePerLevel: number;
  maxLevel: number;
  /** Koszt poziomu 1. Każdy kolejny: baseCost * (level + 1). */
  baseCost: number;
}

export const META_UPGRADES: MetaUpgradeDef[] = [
  { id: 'hide',      name: 'Tough Hide',      desc: '+8 max HP',          kind: 'maxHp',       color: 0xff5db1, valuePerLevel: 8,   maxLevel: 10, baseCost: 60 },
  { id: 'claws',     name: 'Sharp Claws',     desc: '+5% damage',         kind: 'strength',    color: 0xff8c42, valuePerLevel: 5,   maxLevel: 10, baseCost: 80 },
  { id: 'twitch',    name: 'Fast Twitch',     desc: '+3% move speed',     kind: 'speed',       color: 0x38e8ff, valuePerLevel: 3,   maxLevel: 8,  baseCost: 70 },
  { id: 'reflex',    name: 'Reflex Wiring',   desc: '+4% attack speed',   kind: 'attackSpeed', color: 0xffe066, valuePerLevel: 4,   maxLevel: 8,  baseCost: 90 },
  { id: 'plating',   name: 'Thick Plating',   desc: '+1 armor',           kind: 'armor',       color: 0x9db4c0, valuePerLevel: 1,   maxLevel: 5,  baseCost: 150 },
  { id: 'reach',     name: 'Long Reach',      desc: '+4% attack range',   kind: 'range',       color: 0x74f7b8, valuePerLevel: 4,   maxLevel: 6,  baseCost: 90 },
  { id: 'capacitor', name: 'Capacitor',       desc: '-4% skill cooldown', kind: 'cooldown',    color: 0xc77dff, valuePerLevel: 4,   maxLevel: 6,  baseCost: 120 },
  { id: 'medic',     name: 'Field Medic',     desc: '+0.2 HP per second', kind: 'regen',       color: 0x7bff9e, valuePerLevel: 0.2, maxLevel: 5,  baseCost: 130 },
  { id: 'scavenger', name: 'Scavenger',       desc: '+15 pickup radius',  kind: 'magnet',      color: 0xf1f5f9, valuePerLevel: 15,  maxLevel: 5,  baseCost: 70 },
  { id: 'luck',      name: 'Lucky Find',      desc: '+1% item drop rate', kind: 'dropChance',  color: 0xffd166, valuePerLevel: 1,   maxLevel: 6,  baseCost: 110 },
];

/** Koszt następnego poziomu (level = aktualny poziom, 0 = jeszcze nie kupione). */
export function upgradeCost(def: MetaUpgradeDef, level: number): number {
  return def.baseCost * (level + 1);
}

/** Nagroda za run — używane przy ekranie końca. */
export function computeReward(kills: number, wavesCleared: number, victory: boolean): number {
  const raw =
    kills * REWARD_CONFIG.perKill +
    wavesCleared * REWARD_CONFIG.perWaveCleared +
    (victory ? REWARD_CONFIG.victoryBonus : 0);
  return Math.floor(raw * REWARD_CONFIG.globalMultiplier);
}
