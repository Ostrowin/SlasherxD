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

  /**
   * STRACH: wróg UCIEKA od najbliższego zagrożenia (gracza lub jego jednostki)
   * zamiast gonić, i w tym czasie nie atakuje. Osobne od `stuns`, bo ogłuszony
   * stoi, a przestraszony biegnie — to narzędzie do ROZGANIANIA hordy, nie
   * zatrzymywania jej. Bossy są odporne, tak jak na ogłuszenie i odrzut.
   */
  flees?: boolean;
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
     * SOAKED — przemoczony. OŚ OBU GAŁĘZI WYDRY: support rozsiewa go falami
     * i wirami, asasyn na nim żeruje.
     *
     * Sam prawie nie boli — jego wartość siedzi w `vulnerability`, czyli
     * w tym, że każdy NASTĘPNY cios (twój i cudzy) boli mocniej. Dzięki temu
     * wydra-support realnie podnosi obrażenia drużyny, nie mając ani jednego
     * skilla o dużych liczbach — a asasyn dostaje premię do wejścia w cel,
     * który sam wcześniej zmoczył. Zero kodu warunkowego: obie gałęzie
     * korzystają z tego samego pola, które silnik i tak już liczy.
     *
     * Spowolnienie jest łagodne (0,85), bo od zatrzymywania hordy jest `stun`
     * z wirów — tu chodzi o zmiękczenie, nie o kontrolę.
     */
    id: 'soaked',
    name: 'SOAKED',
    color: 0x3fa7a0,
    durationTicks: secs(5),
    intervalTicks: secs(1),
    damagePerTick: 0,
    speedMult: 0.85,
    vulnerability: 1.3,
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
    /**
     * FEAR — przerażony wróg ucieka od najbliższego zagrożenia. Krótki, bo
     * nakłada się falami (duch pulsuje nim, kierowany przez gracza), a długi
     * rozgoniłby całą arenę na stałe. Kolor blady fiolet — „widmowy".
     */
    id: 'fear',
    name: 'FEAR',
    color: 0xb99cff,
    durationTicks: secs(1.5),
    intervalTicks: secs(1),
    damagePerTick: 0,
    speedMult: 1,
    vulnerability: 1,
    maxStacks: 1,
    spreadRadius: 0,
    spreadCount: 0,
    flees: true,
  },
  {
    /**
     * VENOM — jad szczura SCURRY. PRZECIWIEŃSTWO `plague`: nie rozprzestrzenia
     * się, za to mocno stackuje i SPOWALNIA. `onHit` nakłada go KAŻDYM
     * auto-atakiem, więc skirmisher trzymający wysoki attack-speed topi
     * pojedynczy cel w jadzie, a spowolnienie trzyma ofiarę w zasięgu ukąszeń
     * (hit-and-run, nie hit-and-lose). Skupiony single-target — gdy zaraza
     * szczura-dowódcy jest szerokim AoE.
     */
    id: 'venom',
    name: 'VENOM',
    color: 0x7fd93a,
    durationTicks: secs(4),
    intervalTicks: secs(0.4),
    damagePerTick: 3,
    speedMult: 0.7,
    vulnerability: 1,
    maxStacks: 6,
    spreadRadius: 0,
    spreadCount: 0,
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

AURAS.push({
  /**
   * WYDRA TIDECALLER — `E`. Aura roztaczana na czas: sojusznikom pancerz
   * i leczenie, wrogom SOAKED. Jedna z niewielu aur działających w OBIE
   * strony naraz — i to jest cała rola supporta wydry: stojąc w drużynie
   * jednocześnie ją trzyma przy życiu i zmiękcza wszystko dookoła.
   *
   * Zwieńczenie gałęzi (`EVERTIDE`) wiesza ją na stałe przez `grantsAura`,
   * obok `lifetide` ze specjalizacji — aury się sumują.
   */
  id: 'tideguard',
  name: 'TIDE GUARD',
  color: 0x3fa7a0,
  radius: 300,
  intervalTicks: secs(0.5),
  enemyStatus: 'soaked',
  enemyDamage: 0,
  allyHeal: 2,
  allyBuff: { kind: 'armor', value: 3 },
});

AURAS.push({
  /**
   * DUCH — zając Summoner, `E`. Aura obronna: sojusznicy w promieniu dostają
   * pancerz i leczą się w czasie. Roztaczana przez JEDNOSTKĘ (`MinionDef.auraId`),
   * nie gracza, więc chodzi za duchem po arenie.
   */
  id: 'spirit-ward',
  name: 'SPIRIT WARD',
  color: 0xb99cff,
  radius: 240,
  intervalTicks: secs(0.5),
  enemyStatus: '',
  enemyDamage: 0,
  allyHeal: 1,
  allyBuff: { kind: 'armor', value: 2 },
});

AURAS.push({
  /**
   * GORYL — WAR ROAR (`W` IRON GRIP). Aura na czas ryku: pancerz. Tank ściąga
   * na siebie hordę taunterem i na te kilka sekund twardnieje. Jak każda aura
   * buffowa, solo działa na samego goryla, a w co-opie na stojących obok
   * (`stepAuras`) — więc ryk jednocześnie chroni tanka i drużynę przy nim.
   */
  id: 'ironhide',
  name: 'IRONHIDE',
  color: 0x4a4a58,
  radius: 300,
  intervalTicks: secs(0.5),
  enemyStatus: '',
  enemyDamage: 0,
  allyHeal: 0,
  allyBuff: { kind: 'armor', value: 6 },
});

AURAS.push({
  /**
   * JEŻ SONIC — MOMENTUM (`E`). Aura prędkości na czas. Solo buffuje samego
   * Sonica, w co-opie stojących obok. U Sonica prędkość wchodzi w obrażenia
   * (`speedToDamage`), więc ta aura jest jednocześnie mobilnością i DPS-em.
   */
  id: 'momentum',
  name: 'MOMENTUM',
  color: 0x8a9a5b,
  radius: 260,
  intervalTicks: secs(0.5),
  enemyStatus: '',
  enemyDamage: 0,
  allyHeal: 0,
  allyBuff: { kind: 'speed', value: 40 },
});

AURAS.push({
  /**
   * JEŻ CURL — IRON CURL (`W`). Aura na czas: pancerz dla gracza (twardnieje
   * w kuli) i KOLCE raniące wszystkich wrogów w ciasnym promieniu. Jedna
   * z niewielu aur zadających obrażenia — bo to jest cała fantazja tanka jeża:
   * stać w hordzie i mleć ją samym dotknięciem.
   */
  id: 'ironcurl',
  name: 'IRON CURL',
  color: 0x8a9a5b,
  radius: 150,
  intervalTicks: secs(0.4),
  enemyStatus: '',
  enemyDamage: 6,
  allyHeal: 0,
  allyBuff: { kind: 'armor', value: 10 },
});

AURAS.push({
  /**
   * NIETOPERZ SONAR — SHRIEK (`E`). Aura rezonansu na czas: wrogowie w zasięgu
   * są OSŁABIENI (`weaken`), czyli obrywają mocniej od wszystkiego. SONAR
   * podbija obrażenia CAŁEJ drużyny, nie mając własnych dużych liczb — tym samym
   * polem `vulnerability`, którego używa już SOAKED wydry.
   */
  id: 'shriek',
  name: 'SHRIEK',
  color: 0x8e44ad,
  radius: 280,
  intervalTicks: secs(0.5),
  enemyStatus: 'weaken',
  enemyDamage: 0,
  allyHeal: 0,
  allyBuff: null,
});

AURAS.push({
  /**
   * NIEDŹWIEDŹ RAMPAGE — BLOODLUST (`W`). Aura krwawego szału: leczy i
   * przyspiesza atak. To sustain, który pozwala grać nisko — na pasku, na
   * którym `lostHpToDamage` daje najwięcej. Solo działa na samego niedźwiedzia,
   * w co-opie na stojących obok (jak każda aura buffowa).
   */
  id: 'bloodlust',
  name: 'BLOODLUST',
  color: 0xb5342b,
  radius: 240,
  intervalTicks: secs(0.5),
  enemyStatus: '',
  enemyDamage: 0,
  allyHeal: 4,
  allyBuff: { kind: 'attackSpeed', value: 40 },
});

/* ── ZAJĄC — AURA MASTER ─────────────────────────────────────────────────────
 * Cztery aury PASYWNE (jedna na slot Q/W/E/R) + dwie BURST. Pasywne są aktywne,
 * DOPÓKI ich slot jest gotowy — po wciśnięciu skill idzie na cooldown i pasywna
 * aura gaśnie, a w zamian dostajesz jednorazowy burst (silniejszy). Promień aur
 * pasywnych skaluje się `rangeMult` gracza (drzewko `range`), więc wymaksowana
 * RADIANCE (`R`) sięga przez cały ekran. Wpięcie: `slotAuras` w world.ts.
 */
AURAS.push({
  /** `Q` pasywna — leczenie drużyny. Burst: `am-mend-burst`. */
  id: 'am-mend',
  name: 'MEND',
  color: 0x5be8a0,
  radius: 240,
  intervalTicks: secs(0.5),
  enemyStatus: '',
  enemyDamage: 0,
  allyHeal: 3,
  allyBuff: null,
});
AURAS.push({
  /** `W` pasywna — pancerz drużynie. */
  id: 'am-ward',
  name: 'WARD',
  color: 0x5b9ae8,
  radius: 240,
  intervalTicks: secs(0.5),
  enemyStatus: '',
  enemyDamage: 0,
  allyHeal: 0,
  allyBuff: { kind: 'armor', value: 10 },
});
AURAS.push({
  /**
   * `E` pasywna — REDUKCJA COOLDOWNÓW drużynie (nowy rodzaj ally-buffa;
   * `applyAuraBuff` obsługuje `cooldown` → `auraCooldownMult`). Skraca ciemne
   * okna wszystkich aur — sama siebie reguluje.
   */
  id: 'am-tempo',
  name: 'TEMPO',
  color: 0xe8d15b,
  radius: 240,
  intervalTicks: secs(0.5),
  enemyStatus: '',
  enemyDamage: 0,
  allyHeal: 0,
  allyBuff: { kind: 'cooldown', value: 25 },
});
AURAS.push({
  /**
   * `R` pasywna — RADIANCE: obrażenia co tyknięcie WSZYSTKIM wrogom w promieniu.
   * Rdzeń ofensywny. Promień × `rangeMult`, więc drzewko `range` rozdmuchuje go
   * do rozmiaru ekranu przy maksie.
   */
  id: 'am-radiance',
  name: 'RADIANCE',
  color: 0xe85b8a,
  radius: 220,
  intervalTicks: secs(0.5),
  enemyStatus: '',
  enemyDamage: 8,
  allyHeal: 0,
  allyBuff: null,
});
AURAS.push({
  /** BURST `Q` — mocne leczenie na krótko (auraTicks po wciśnięciu). */
  id: 'am-mend-burst',
  name: 'RESTORE',
  color: 0x8bffc0,
  radius: 260,
  intervalTicks: secs(0.25),
  enemyStatus: '',
  enemyDamage: 0,
  allyHeal: 16,
  allyBuff: null,
});
AURAS.push({
  /** BURST `E` — zryw prędkości ataku drużynie na krótko. */
  id: 'am-haste-burst',
  name: 'QUICKEN',
  color: 0xfff08b,
  radius: 260,
  intervalTicks: secs(0.5),
  enemyStatus: '',
  enemyDamage: 0,
  allyHeal: 0,
  allyBuff: { kind: 'attackSpeed', value: 45 },
});

export function auraById(id: string): AuraDef | null {
  return AURAS.find((a) => a.id === id) ?? null;
}
