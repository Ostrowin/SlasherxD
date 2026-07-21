import { TICK_RATE } from './constants';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  COMBO — sekwencje klawiszy zamiast pojedynczych umiejętności.
 *
 *  Thunder Fang wilka NIE MA skilli pod Q/W/E. Klawisze same z siebie nie
 *  robią nic; liczy się dopiero KOLEJNOŚĆ trzech wciśnięć. Dzięki temu nie
 *  ma konfliktu z cooldownami slotów i nie trzeba niczego blokować ani
 *  podmieniać — pusty slot po prostu nie ma czego odpalić.
 *
 *  Rozróżnienie następuje przy TRZECIM klawiszu: `q→w→e` i `q→w→q` mają
 *  wspólny początek, więc bufor trzyma trzy ostatnie wciśnięcia i dopasowuje
 *  całą sekwencję naraz. Bufor kasuje się po odpaleniu combo albo po
 *  `COMBO_WINDOW_TICKS` ciszy.
 *
 *  Ten sam wzorzec co wszędzie: symulacja zna PRYMITYWY (uzbrojenie ciosu,
 *  postawienie pola, doskok), a konkretne combo są danymi.
 * ═══════════════════════════════════════════════════════════════════
 */

const secs = (s: number): number => Math.round(s * TICK_RATE);

/** Ile ticków ciszy kasuje niedokończoną sekwencję. */
export const COMBO_WINDOW_TICKS = secs(2.5);

/** Ile wciśnięć pamiętamy — długość najdłuższej sekwencji. */
export const COMBO_BUFFER = 3;

/**
 * UZBROJENIE CIOSU — najbliższy trafiony wróg dostaje łańcuch błyskawic.
 * To ten sam prymityw, na którym stoi pasywny rykoszet wilka; combo różni
 * się wyłącznie liczbą odbić i czasem, przez jaki uzbrojenie czeka.
 */
export interface ArmChainEffect {
  kind: 'armChain';
  chains: number;
  chainRange: number;
  chainFalloff: number;
  /** Obrażenia łańcucha = obrażenia zwarcia gracza × to. */
  damageMult: number;
  /** Po tylu tickach uzbrojenie wygasa niewykorzystane. */
  armTicks: number;
}

/** POLE — stawia jednostkę z `minionsConfig.ts` w punkcie pod kursorem. */
export interface FieldEffect {
  kind: 'field';
  minionId: string;
  placeRange: number;
}

/** DOSKOK — leci wariantem z `DASHES` i sypie po drodze błyskawicami. */
export interface DashComboEffect {
  kind: 'dash';
  dashId: string;
  /** Co ile ticków lotu wystrzeliwuje błyskawicę w najbliższego wroga. */
  boltEveryTicks: number;
  boltRange: number;
  chains: number;
  chainRange: number;
  chainFalloff: number;
  damageMult: number;
}

export type ComboEffect = ArmChainEffect | FieldEffect | DashComboEffect;

export interface ComboDef {
  id: string;
  /** Nazwa na HUD-zie (EN — teksty w grze). */
  name: string;
  /** Sekwencja SLOTÓW: 0 = Q, 1 = W, 2 = E. */
  sequence: number[];
  cooldownTicks: number;
  effect: ComboEffect;
}

export const COMBOS: ComboDef[] = [
  {
    /**
     * Q → W → E — najdroższe combo gałęzi. Nie zadaje obrażeń samo z siebie:
     * UZBRAJA następny cios. Trafienie zamienia się w łańcuch przez dwadzieścia
     * celów, więc opłaca się je odpalić PRZED wejściem w tłum, a nie w pustce.
     * Wytracanie 0,92 jest łagodne (przy 0,85 dwudziesty cel dostawałby ułamek),
     * ale niezerowe — inaczej łańcuch nie miałby sufitu.
     */
    id: 'storm-chain',
    name: 'STORM CHAIN',
    sequence: [0, 1, 2],
    cooldownTicks: secs(9),
    effect: {
      kind: 'armChain',
      chains: 20,
      chainRange: 300,
      chainFalloff: 0.92,
      damageMult: 1.6,
      armTicks: secs(6),
    },
  },
  {
    /**
     * E → W → Q — burza w wybranym punkcie. Bije LEKKO, ale bardzo szybko,
     * a każda błyskawica jeszcze rykoszetuje — siła leży w liczbie trafień,
     * nie w pojedynczym. Odwrotna kolejność niż `storm-chain` celowo:
     * gracz musi pomyśleć, w którą stronę „przewija" klawisze.
     */
    id: 'thunder-nova',
    name: 'THUNDER NOVA',
    sequence: [2, 1, 0],
    cooldownTicks: secs(13),
    effect: { kind: 'field', minionId: 'thunder-nova', placeRange: 380 },
  },
  {
    /**
     * Q → W → Q — przemieszczenie jako błyskawica: daleko, szybko, przez
     * przeszkody i z rykoszetami sypanymi po drodze. Jednocześnie ucieczka
     * i wejście, bo trasa sama zadaje obrażenia.
     */
    id: 'lightning-rush',
    name: 'LIGHTNING RUSH',
    sequence: [0, 1, 0],
    cooldownTicks: secs(8),
    effect: {
      kind: 'dash',
      dashId: 'lightning-dash',
      boltEveryTicks: secs(0.08),
      boltRange: 380,
      chains: 2,
      chainRange: 260,
      chainFalloff: 0.85,
      damageMult: 0.7,
    },
  },
];

export function comboById(id: string): ComboDef | null {
  return COMBOS.find((c) => c.id === id) ?? null;
}
