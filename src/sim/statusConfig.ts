import { TICK_RATE } from './constants';
import type { ItemKind } from './itemsConfig';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  STATUSY i AURY — dwa prymitywy, z których buduje się „pola" i „trucizny".
 *
 *  STATUS to coś, co WISI NA WROGU przez jakiś czas: trucizna, podpalenie,
 *  spowolnienie, osłabienie. Jeden opis pokrywa wszystkie cztery, bo różnią
 *  się tylko liczbami — a nie kodem.
 *
 *  AURA to coś, co WISI NA GRACZU i działa w promieniu: zatruwa wrogów wokół,
 *  leczy sojuszników, wzmacnia stojących blisko. Aura celująca we wrogów
 *  zwykle po prostu NAKŁADA STATUS — dlatego oba prymitywy siedzą w jednym
 *  pliku i korzystają ze wspólnego słownika.
 *
 *  Ten sam wzorzec co przy bossach, minionach i skillach: symulacja zna
 *  PRYMITYWY, a konkretne trucizny i aury są danymi.
 * ═══════════════════════════════════════════════════════════════════
 */

const secs = (s: number): number => Math.round(s * TICK_RATE);

export interface StatusDef {
  id: string;
  /** Nazwa na potrzeby UI i debugowania (EN). */
  name: string;
  /** Kolor migotania wroga — gracz musi widzieć, że coś na nim wisi. */
  color: number;
  durationTicks: number;
  /** Co ile ticków status „tyka" (obrażenia, rozprzestrzenianie). */
  intervalTicks: number;

  /** Obrażenia na jedno tyknięcie (0 = status nie rani). */
  damagePerTick: number;
  /**
   * Mnożnik prędkości wroga, 1 = bez zmian, 0.5 = o połowę wolniej.
   * Tym samym polem robi się spowolnienia i przymrożenia.
   */
  speedMult: number;
  /**
   * Mnożnik obrażeń, które wróg OTRZYMUJE. >1 = osłabiony, łatwiejszy cel.
   * Hiena „żeruje na rannych" dostanie to za darmo.
   */
  vulnerability: number;

  /**
   * Ile razy status może się nałożyć na tego samego wroga. Kolejne nałożenia
   * zwiększają obrażenia i odnawiają czas; prędkość i podatność biorą
   * NAJSILNIEJSZY stack, a nie iloczyn — inaczej dwa spowolnienia
   * zatrzymywałyby wroga w miejscu.
   */
  maxStacks: number;

  /**
   * Rozprzestrzenianie (zaraza szczura): przy każdym tyknięciu status
   * przeskakuje na wrogów w tym promieniu. 0 = nie rozprzestrzenia się.
   */
  spreadRadius: number;
  /** Ilu wrogów naraz zarazi jedno tyknięcie — zawór dla wydajności. */
  spreadCount: number;

  /**
   * OGŁUSZENIE: wróg nie tylko stoi, ale też nie atakuje i nie strzela.
   *
   * Osobne pole od `speedMult: 0`, bo prędkość wchodzi WYŁĄCZNIE w ruch —
   * unieruchomiony mob dalej zamachiwałby się i strzelał. Bossy są odporne
   * (tak jak na odrzut), inaczej dałoby się je przetrzymać w miejscu.
   */
  stuns?: boolean;
}

/**
 * Ile statusów naraz może wisieć na jednym wrogu.
 *
 * Mały i STAŁY, bo pool wrogów ma 400 sztuk i nie może alokować w trakcie
 * gry. Trzy sloty wystarczają na trucizna + spowolnienie + osłabienie;
 * czwarty status wypycha najsłabszy.
 */
export const MOB_STATUS_SLOTS = 3;

export const STATUSES: StatusDef[] = [
  {
    /** PLAGUE — zaraza szczura: słabo boli, ale skacze z wroga na wroga. */
    id: 'plague',
    name: 'PLAGUE',
    color: 0xb6d94c,
    durationTicks: secs(6),
    intervalTicks: secs(0.5),
    damagePerTick: 2,
    speedMult: 1,
    vulnerability: 1,
    maxStacks: 3,
    spreadRadius: 120,
    spreadCount: 2,
  },
  {
    /** BURN — czysty DoT, mocniejszy i krótszy, bez rozprzestrzeniania. */
    id: 'burn',
    name: 'BURN',
    color: 0xff8c42,
    durationTicks: secs(4),
    intervalTicks: secs(0.4),
    damagePerTick: 5,
    speedMult: 1,
    vulnerability: 1,
    maxStacks: 5,
    spreadRadius: 0,
    spreadCount: 0,
  },
  {
    /** CHILL — spowolnienie bez obrażeń; kontrola zamiast DPS. */
    id: 'chill',
    name: 'CHILL',
    color: 0x38e8ff,
    durationTicks: secs(3),
    intervalTicks: secs(1),
    damagePerTick: 0,
    speedMult: 0.55,
    vulnerability: 1,
    maxStacks: 1,
    spreadRadius: 0,
    spreadCount: 0,
  },
  {
    /**
     * GRAVITY DRAG — spowolnienie pola grawitacyjnego niedźwiedzia. Mocniejsze
     * od `chill` i bardzo krótkie: pole odnawia je co tyknięcie, więc wróg
     * wychodzący z obszaru odzyskuje prędkość niemal natychmiast. To ma być
     * kontrola TERENU, a nie kara ciągnąca się przez pół areny.
     */
    id: 'gravity-drag',
    name: 'GRAVITY DRAG',
    color: 0x7b5cff,
    durationTicks: secs(1.2),
    intervalTicks: secs(1),
    damagePerTick: 0,
    speedMult: 0.35,
    vulnerability: 1,
    maxStacks: 1,
    spreadRadius: 0,
    spreadCount: 0,
  },
  {
    /**
     * STUN — pełne ogłuszenie: ani ruchu, ani ataków. Krótkie i bez stackowania,
     * bo pole tyka cyklicznie i dłuższy czas trwania oznaczałby wrogów
     * zamrożonych na stałe.
     */
    id: 'stun',
    name: 'STUN',
    color: 0xffe066,
    durationTicks: secs(0.7),
    intervalTicks: secs(1),
    damagePerTick: 0,
    speedMult: 0,
    vulnerability: 1,
    maxStacks: 1,
    spreadRadius: 0,
    spreadCount: 0,
    stuns: true,
  },
  {
    /** WEAKEN — osłabiony wróg obrywa mocniej od wszystkiego. */
    id: 'weaken',
    name: 'WEAKEN',
    color: 0xc9a227,
    durationTicks: secs(5),
    intervalTicks: secs(1),
    damagePerTick: 0,
    speedMult: 1,
    vulnerability: 1.4,
    maxStacks: 1,
    spreadRadius: 0,
    spreadCount: 0,
  },
];

export function statusIndexById(id: string): number {
  return STATUSES.findIndex((s) => s.id === id);
}

/* ── Aury ───────────────────────────────────────────────────────────────── */

export interface AuraDef {
  id: string;
  name: string;
  color: number;
  radius: number;
  /** Co ile ticków aura działa. Rzadziej = taniej; 0.5 s wystarcza. */
  intervalTicks: number;

  /** Status nakładany wrogom w zasięgu (pusty = żaden). */
  enemyStatus: string;
  /** Obrażenia zadawane wrogom w zasięgu przy każdym tyknięciu. */
  enemyDamage: number;

  /** Leczenie sojuszników (i właściciela) na tyknięcie. */
  allyHeal: number;
  /**
   * Bonus dla sojuszników W ZASIĘGU — liczony NA BIEŻĄCO, nie doklejany
   * na stałe do statystyk. Dzięki temu nie trzeba pamiętać o cofaniu go,
   * gdy ktoś wyjdzie z pola: wyszedł, to bonusu po prostu nie ma.
   */
  allyBuff: { kind: ItemKind; value: number } | null;
  /**
   * Czy siła bonusu rośnie z licznikiem Pack Instinct właściciela
   * (`ALPHA_PACK` w talentsConfig.ts). Domyślnie nie — zwykłe aury mają
   * stałą wartość.
   */
  scalesWithPack?: boolean;
}

export const AURAS: AuraDef[] = [
  {
    /** WYDRA — pole leczące drużynę. */
    id: 'lifetide',
    name: 'LIFETIDE',
    color: 0x3fa7a0,
    radius: 260,
    intervalTicks: secs(0.5),
    enemyStatus: '',
    enemyDamage: 0,
    allyHeal: 2,
    allyBuff: null,
  },
  {
    /** WILK — wataha: obok kogoś ze swoich bijesz mocniej. */
    id: 'packbond',
    name: 'PACK BOND',
    color: 0x9aa5b1,
    radius: 220,
    intervalTicks: secs(0.5),
    enemyStatus: '',
    enemyDamage: 0,
    allyHeal: 0,
    allyBuff: { kind: 'strength', value: 25 },
  },
  {
    /** SZCZUR — chmura zarazy ciągnąca się za graczem. */
    id: 'miasma',
    name: 'MIASMA',
    color: 0xb6d94c,
    radius: 200,
    intervalTicks: secs(0.6),
    enemyStatus: 'plague',
    enemyDamage: 0,
    allyHeal: 0,
    allyBuff: null,
  },
  {
    /** Pole spowalniające — kontrola bez obrażeń. */
    id: 'frostfield',
    name: 'FROST FIELD',
    color: 0x38e8ff,
    radius: 230,
    intervalTicks: secs(0.5),
    enemyStatus: 'chill',
    enemyDamage: 0,
    allyHeal: 0,
    allyBuff: null,
  },
];

AURAS.push({
  /**
   * WILK ALPHA PACK — `W`. Aura na czas, nie na stałe: włącza ją umiejętność
   * (`AuraSkill`), a jej siła rośnie z licznikiem Pack Instinct. Bonus dostaje
   * CAŁA drużyna, bo to gałąź o graniu w grupie — samotny alfa dostanie
   * wartość bazową i tyle.
   */
  id: 'pack-fury',
  name: 'PACK FURY',
  color: 0xe07a5f,
  radius: 300,
  intervalTicks: secs(0.5),
  enemyStatus: '',
  enemyDamage: 0,
  allyHeal: 0,
  allyBuff: { kind: 'strength', value: 15 },
  scalesWithPack: true,
});

export function auraById(id: string): AuraDef | null {
  return AURAS.find((a) => a.id === id) ?? null;
}
