import type { ItemKind } from './itemsConfig';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  EKWIPUNEK i SLOTY — model danych. Ten sam wzorzec co reszta configów:
 *  symulacja zna PRYMITYWY (slot, część, afiks), a konkretny loot to DANE.
 *
 *  FILOZOFIA (decyzja 2026-08-22):
 *   - Gear jest RUN-SCOPED — znajdujesz i zakładasz w trakcie runu, resetuje
 *     się co run. Zero zapisu, zero meta-progresji (jak romby-konsumpcje).
 *   - Część to WOREK AFIXÓW: `affixes: {kind, value}[]`, gdzie `kind` to ten sam
 *     `ItemKind` co dropy. Dzięki temu założenie części reużywa logikę statów
 *     (`recomputeGear` w world.ts) i te same CAPY (`ITEM_CAPS`) — cała filozofia
 *     balansu rombów obowiązuje gear za darmo.
 *   - Gear = TRZECIA WARSTWA statów, równolegle do aur (`gearX` w Player),
 *     przeliczana przy KAŻDEJ zmianie ekwipunku (nie co tick — jak aury).
 *
 *  WARTOŚĆ afiksu ma DOKŁADNIE to samo znaczenie co `value` w `itemsConfig.ts`
 *  (np. `strength` = %, `armor` = płasko). Jeden słownik, jeden kontrakt.
 *
 *  Rarity i sposób ROLLOWANIA afixów są świadomie ODŁOŻONE (Faza 6) — tu jest
 *  tylko szkielet, żeby generacja lootu mogła się wpiąć bez ruszania reszty.
 * ═══════════════════════════════════════════════════════════════════
 */

/**
 * Rodzaj slotu. `ring` występuje w DWÓCH pozycjach ekwipunku (patrz
 * `EQUIP_SLOTS`) — część-pierścień pasuje do każdej z nich.
 */
export type GearSlotType =
  | 'weapon'
  | 'offhand'
  | 'head'
  | 'body'
  | 'legs'
  | 'ring'
  | 'amulet'
  | 'boots'
  | 'gloves'
  | 'belt';

/** Jedna pozycja w ekwipunku gracza. `label` rozróżnia dwa pierścienie w UI. */
export interface EquipSlotDef {
  type: GearSlotType;
  /** Nazwa pokazywana na ekranie ekwipunku (EN, jak nazwy itemów). */
  label: string;
}

/**
 * UKŁAD EKWIPUNKU — 11 pozycji, w kolejności wyświetlania. Indeks w tej tablicy
 * jest ADRESEM slotu w `Player.equipped[]` (Faza 2) i w komendach equip (Faza 3),
 * więc kolejność jest częścią kontraktu — nie przestawiać bez powodu.
 *
 * Broń 2H (`GearPiece.twoHanded`) blokuje `offhand` w zamian za większy blok
 * statów — regułę egzekwuje `stepBreak` przy zakładaniu (Faza 3).
 */
export const EQUIP_SLOTS: EquipSlotDef[] = [
  { type: 'weapon', label: 'Weapon' },
  { type: 'offhand', label: 'Off-hand' },
  { type: 'head', label: 'Head' },
  { type: 'body', label: 'Body' },
  { type: 'legs', label: 'Legs' },
  { type: 'ring', label: 'Ring I' },
  { type: 'ring', label: 'Ring II' },
  { type: 'amulet', label: 'Amulet' },
  { type: 'boots', label: 'Boots' },
  { type: 'gloves', label: 'Gloves' },
  { type: 'belt', label: 'Belt' },
];

/** Ile części zmieści plecak. Stały rozmiar — tablica pre-alokowana (jak poole). */
export const BAG_CAP = 24;

/** Wszystkie typy slotów jako lista — źródło do losowania części (dropGear). */
export const GEAR_SLOT_TYPES: GearSlotType[] = [
  'weapon', 'offhand', 'head', 'body', 'legs', 'ring', 'amulet', 'boots', 'gloves', 'belt',
];

/**
 * Szansa (w %), że zabity mob upuści GEAR — osobno i RZADZIEJ niż romby.
 * PLACEHOLDER: docelowe źródło dropu (bossy/moby?) i wartość to Faza 6.
 */
export const GEAR_DROP = {
  dropChancePercent: 2,
};

/**
 * Zakresy [min, max] wartości afixu (dla Common). Roll losuje z przedziału,
 * potem mnoży przez `RarityDef.valueMult`. Znaczenie jak `value` w itemsConfig
 * (procent dla mnożników, płasko dla armora itd.). Liczniki (`projectileCount`,
 * `chainCount`) są zaokrąglane do int (min 1) po pomnożeniu.
 *
 * PLACEHOLDER liczb — strojenie w grze/Faza 6. Capy (`ITEM_CAPS`) i tak przycinają
 * sumę baza+gear przy odczycie, więc rolle nie zepsują balansu podtrzymania życia.
 */
export const GEAR_AFFIX_RANGE: Partial<Record<ItemKind, [number, number]>> = {
  strength: [8, 15], attackDamage: [8, 15], skillPower: [8, 15],
  attackSpeed: [8, 15], range: [6, 12], critDamage: [10, 25],
  knockback: [10, 20], speed: [5, 12], maxHp: [12, 25], magnet: [6, 14],
  projectileCount: [1, 1], chainCount: [1, 1],
  armor: [1, 2], critChance: [3, 6], regen: [0.5, 1.2], leech: [0.5, 1.2],
  thorns: [3, 8], cooldown: [6, 12],
};

/**
 * Rarity — indeks w `RARITIES`. 3 tiery (decyzja 2026-08-22): Common/Rare/Epic.
 * Wyższy tier = więcej afixów i wyższe rolle wartości. Unikalne mechaniki
 * legendarek świadomie ODŁOŻONE do kolejnej sesji (patrz TODOS).
 */
export type GearRarity = 0 | 1 | 2 | 3;

export interface RarityDef {
  /** Nazwa pokazywana w grze (EN) i prefiks nazwy części. */
  name: string;
  /** Kolor rombu na ziemi i ramki/tekstu w UI ekwipunku. */
  color: number;
  /** Ile afixów niesie część tego tieru. */
  affixCount: number;
  /** Względna częstość dropu (większa = pospolitszy). */
  weight: number;
  /** Mnożnik wartości afixów — wyższy tier rolluje mocniej. */
  valueMult: number;
}

/**
 * Tiery rarity. PLACEHOLDER liczb (wagi/mnożniki) — Faza 6/strojenie w grze je
 * dostroi. Indeks = wartość `GearRarity`.
 */
export const RARITIES: RarityDef[] = [
  { name: 'Common',    color: 0x9aa5b1, affixCount: 1, weight: 62, valueMult: 1.0 },
  { name: 'Rare',      color: 0x4da3ff, affixCount: 2, weight: 30, valueMult: 1.35 },
  { name: 'Epic',      color: 0xc77dff, affixCount: 3, weight: 8,  valueMult: 1.8 },
  // LEGENDARY: waga 0 → nigdy nie pada z normalnej puli mobów; leci WYŁĄCZNIE
  // z bossów, jako nazwana część z rejestru LEGENDARIES (nie z rollGearPiece).
  { name: 'Legendary', color: 0xffb020, affixCount: 3, weight: 0,  valueMult: 2.0 },
];

/** Indeks tieru Legendary w RARITIES — część legendarna nosi `rarity: LEGENDARY_RARITY`. */
export const LEGENDARY_RARITY: GearRarity = 3;

/* ── EKONOMIA SKLEPU RUNOWEGO (Brotato-style; złoto resetuje się co run) ──────
 * PLACEHOLDER liczb — strojenie w grze. Złoto: z zabójstw; wydajesz w sklepie
 * w przerwie. Sprzedaż części daje `SELL_VALUE[rarity]`.
 */
export const GOLD_PER_KILL = 2;
export const GOLD_PER_BOSS = 40;
/** Cena sprzedaży wg rarity (indeks = GearRarity): Common/Rare/Epic/Legendary. */
export const SELL_VALUE = [5, 12, 30, 80];

/** Sklep w przerwie (Brotato). PLACEHOLDER — strojenie w grze. */
export const SHOP_SIZE = 4;
export const SHOP_REROLL_COST = 10;
/** Cena KUPNA gearu = `SELL_VALUE[rarity] × ten mnożnik` (kupno drożej niż sprzedaż). */
export const GEAR_PRICE_MULT = 3;
/** Cena kupna romba/boosta statu (płaska). */
export const UPGRADE_PRICE = 25;

export interface GearAffix {
  kind: ItemKind;
  /** Znaczenie jak `value` w `itemsConfig.ts` (np. % dla `strength`, płasko dla `armor`). */
  value: number;
}

/**
 * Konkretna INSTANCJA części (afixy są rollowane, więc to nie statyczny def jak
 * `ITEMS`, tylko obiekt w stanie gracza). `id` jest stabilny na czas życia
 * instancji — adresuje część w plecaku/UI i wchodzi do `checksum`.
 */
export interface GearPiece {
  id: number;
  slotType: GearSlotType;
  /** Tylko dla `weapon`: broń dwuręczna blokuje `offhand`. */
  twoHanded?: boolean;
  /** Nazwa pokazywana w grze (EN). */
  name: string;
  rarity: GearRarity;
  affixes: GearAffix[];
  /**
   * Tylko legendarki: id UNIKALNEGO efektu (= id w `LEGENDARIES`). Silnik trzyma
   * aktywne efekty założonych części w `Player.uniqueEffects` i sprawdza je
   * w hookach — jak talenty `grants*`, ale ODWRACALNIE (przeliczane przy equipie).
   */
  unique?: string;
}

/**
 * PULA AFIXÓW PER SLOT — które `ItemKind` w ogóle mogą paść na danym slocie.
 * Chroni tożsamość slotów (buty nie rollują crit-damage, korpus jest obronny).
 *
 * WARTOŚCI SĄ PLACEHOLDEREM — dobór i strojenie to Faza 6. Tu chodzi o to, żeby
 * generator lootu (Faza 4) miał z czego losować i żeby intencja slotów była
 * zapisana w jednym miejscu.
 */
export const SLOT_AFFIX_POOL: Record<GearSlotType, ItemKind[]> = {
  weapon: ['attackDamage', 'skillPower', 'strength', 'critChance', 'critDamage', 'attackSpeed', 'range'],
  offhand: ['skillPower', 'cooldown', 'strength', 'projectileCount', 'chainCount', 'critChance'],
  head: ['maxHp', 'armor', 'cooldown', 'critChance', 'skillPower'],
  body: ['armor', 'maxHp', 'thorns', 'regen'],
  legs: ['armor', 'maxHp', 'speed', 'regen'],
  ring: ['attackDamage', 'skillPower', 'strength', 'critChance', 'critDamage', 'leech', 'cooldown'],
  amulet: ['strength', 'maxHp', 'skillPower', 'attackDamage', 'critDamage', 'cooldown'],
  boots: ['speed', 'magnet', 'range'],
  gloves: ['attackSpeed', 'attackDamage', 'critChance', 'knockback'],
  // `overshield` (ładunek konsumowalny) ma dziwną semantykę na STAŁEJ części —
  // odłożone, wróci w Fazie 6 (albo jako inny prymityw). Na razie poza pulą.
  belt: ['leech', 'thorns', 'magnet', 'regen', 'maxHp'],
};

/**
 * WKŁAD FOLDOWANY gearu w pola statów BEZ capa. Trzymany osobno od pól
 * efektywnych, żeby `recomputeGear` mógł go DOKŁADNIE cofnąć (odjąć) przed
 * ponownym przeliczeniem — dodawanie jest odwracalne tylko bez clampu.
 *
 * Staty Z capem (`armor`, `critChance`, `regen`, `leech`, `thorns`, `cooldown`)
 * NIE idą tutaj — mają równoległe `gearX` w Player, łączone i clampowane dopiero
 * przy odczycie (clamp przy zapisie gubiłby informację potrzebną do cofnięcia).
 *
 * Pola to procentowe MNOŻNIKI (wkład w `xMult`, np. +0.3 = +30%) i płaskie
 * dodatki/licznik — dokładnie te, które fold rusza w `world.ts`.
 */
export interface GearFold {
  damageMult: number;
  attackDamageMult: number;
  skillPowerMult: number;
  attackSpeedMult: number;
  rangeMult: number;
  critDamageMult: number;
  knockbackMult: number;
  speedMult: number;
  maxHpBonus: number;
  magnetBonus: number;
  projectileCountBonus: number;
  chainCountBonus: number;
}

export function emptyGearFold(): GearFold {
  return {
    damageMult: 0, attackDamageMult: 0, skillPowerMult: 0,
    attackSpeedMult: 0, rangeMult: 0, critDamageMult: 0,
    knockbackMult: 0, speedMult: 0,
    maxHpBonus: 0, magnetBonus: 0,
    projectileCountBonus: 0, chainCountBonus: 0,
  };
}

/* ── Pomocnicze (czyste funkcje) ─────────────────────────────────────────── */

/** Typ slotu pod danym adresem ekwipunku, albo null gdy indeks poza zakresem. */
export function equipSlotType(index: number): GearSlotType | null {
  return EQUIP_SLOTS[index]?.type ?? null;
}

/** Czy część pasuje do pozycji ekwipunku pod `index` (zgodność typu slotu). */
export function acceptsPiece(index: number, piece: GearPiece): boolean {
  return equipSlotType(index) === piece.slotType;
}

/** Indeks pozycji `offhand` w `EQUIP_SLOTS` — używany przy regule 2H↔off-hand. */
export const OFFHAND_SLOT_INDEX = EQUIP_SLOTS.findIndex((s) => s.type === 'offhand');

/** Indeks pozycji `weapon` — reguła 2H↔off-hand czyta z niego, czy siedzi tam broń 2H. */
export const WEAPON_SLOT_INDEX = EQUIP_SLOTS.findIndex((s) => s.type === 'weapon');

/** Czy część to broń dwuręczna (blokuje `offhand`). */
export function blocksOffhand(piece: GearPiece): boolean {
  return piece.slotType === 'weapon' && piece.twoHanded === true;
}

/* ── LEGENDARKI ───────────────────────────────────────────────────────────────
 * Nazwane, ręcznie robione części z UNIKALNYM efektem (build-definer). Projekt
 * wszystkich w `LegendaryEquipment.md`. Dropią WYŁĄCZNIE z bossów, tylko pod
 * klasę + wybrany spec gracza, bez dubli (`rollLegendary` w world.ts).
 *
 * `id` = jednocześnie id efektu `unique` na GearPiece (jedna legendarka = jeden
 * unique). Silnik czyta `unique` w hookach (`world.ts`) — patrz `uniqueEffects`.
 */
export interface LegendaryDef {
  id: string;
  name: string;
  classId: string;
  /** Branch id speca z `talentsConfig` (np. 'wolf-thunder', 'hog-sonic'). */
  specId: string;
  slotType: GearSlotType;
  twoHanded?: boolean;
  affixes: GearAffix[];
  /** Krótki opis unikalnego efektu (tooltip/UI). */
  effect: string;
}

export const LEGENDARIES: LegendaryDef[] = [
  {
    id: 'stormfang', name: 'Stormfang', classId: 'wolf', specId: 'wolf-thunder',
    slotType: 'weapon',
    affixes: [{ kind: 'attackDamage', value: 30 }, { kind: 'attackSpeed', value: 20 }],
    effect: 'Auto-attack ricochet jumps +3 more times.',
  },
  {
    id: 'lightspeed-greaves', name: 'Lightspeed Greaves', classId: 'hedgehog', specId: 'hog-sonic',
    slotType: 'boots',
    affixes: [{ kind: 'speed', value: 22 }, { kind: 'range', value: 12 }],
    effect: 'Excess move speed counts DOUBLE toward damage.',
  },
  {
    id: 'heart-of-berserker', name: 'Heart of the Berserker', classId: 'bear', specId: 'bear-rampage',
    slotType: 'body',
    affixes: [{ kind: 'strength', value: 30 }, { kind: 'maxHp', value: 25 }],
    effect: 'RAMPAGE damage is calculated as if you had 25% less HP.',
  },

  // ── MOLE — SNIPER (sniper-shot = wąski, daleki stożek) ──
  {
    id: 'deadeye-scope', name: 'Deadeye Scope', classId: 'mole', specId: 'mole-sniper',
    slotType: 'head',
    affixes: [{ kind: 'skillPower', value: 25 }, { kind: 'critChance', value: 5 }],
    effect: 'Hits on a FULL-HP enemy deal +200% damage (opening shot).',
  },
  {
    id: 'railgun-barrel', name: 'Railgun Barrel', classId: 'mole', specId: 'mole-sniper',
    slotType: 'weapon', twoHanded: true,
    affixes: [{ kind: 'skillPower', value: 30 }, { kind: 'range', value: 15 }],
    effect: 'SNIPER SHOT stuns everything it hits.',
  },

  // ── BEAR — GRAVITY MAGE (studnie grawitacji nakładają gravity-drag) ──
  {
    id: 'neutron-core', name: 'Neutron Core', classId: 'bear', specId: 'bear-gravity',
    slotType: 'weapon', twoHanded: true,
    affixes: [{ kind: 'skillPower', value: 30 }, { kind: 'maxHp', value: 30 }],
    effect: 'Auto-attacks apply GRAVITY DRAG (slow) on hit.',
  },
  {
    id: 'event-horizon', name: 'Event Horizon', classId: 'bear', specId: 'bear-gravity',
    slotType: 'amulet',
    affixes: [{ kind: 'skillPower', value: 25 }, { kind: 'cooldown', value: 12 }],
    effect: 'Enemies under GRAVITY DRAG take +30% damage from you.',
  },
];

/** Legendarki pasujące do klasy + speca gracza (do rolla dropu z bossa). */
export function legendariesFor(classId: string, specId: string): LegendaryDef[] {
  return LEGENDARIES.filter((l) => l.classId === classId && l.specId === specId);
}

/** Definicja legendarki po id (= `GearPiece.unique`) — do opisu efektu w UI. */
export function legendaryById(id: string): LegendaryDef | null {
  return LEGENDARIES.find((l) => l.id === id) ?? null;
}
