import type { SimInput } from '../sim/world';

/**
 * Protokół co-opu. Po sieci lecą WYŁĄCZNIE inputy graczy i sumy kontrolne —
 * nigdy pozycje mobków. Dlatego 400 wrogów kosztuje w sieci dokładnie tyle
 * samo co zero: każdy klient liczy tę samą symulację z tych samych wejść.
 */
export type NetMessage =
  /** „Jestem tu" — rozgłaszane przy wejściu do lobby. */
  | { t: 'hello'; id: string; classId: string }
  /** Host rozsyła aktualny skład lobby (kolejność = indeksy graczy). */
  | { t: 'roster'; hostId: string; members: LobbyMember[] }
  /** Host startuje grę: wspólny seed przesądza o całym losowym świecie. */
  | { t: 'start'; seed: number; members: LobbyMember[] }
  /** Wejście gracza na konkretny tick — serce lockstepu. */
  | { t: 'input'; tick: number; index: number; input: SimInput }
  /** Suma kontrolna stanu — wykrywa desync, czyli błąd determinizmu. */
  | { t: 'checksum'; tick: number; index: number; sum: number }
  /**
   * „Wychodzę" — grzeczne pożegnanie wysyłane przy zamykaniu karty.
   * Sam nie usuwa gracza; tylko mówi reszcie, żeby nie czekała na niego
   * pełnych DROP_AFTER_MS, gdy zabraknie jego wejść.
   */
  | { t: 'leave'; index: number }
  /**
   * „Gracz `index` wypada od ticku `fromTick`" — wiążąca decyzja o usunięciu.
   *
   * Tick jest w wiadomości, a nie liczony lokalnie, i to jest tu cała sztuczka:
   * gdyby każdy klient wybierał moment rozłączenia sam (po swoim zegarze),
   * usunęliby gracza w różnych tickach i symulacje by się rozjechały.
   */
  | { t: 'drop'; index: number; fromTick: number };

export interface LobbyMember {
  id: string;
  /**
   * Tekstowe id klasy (`'mole'`), NIGDY indeks w CLASSES. Indeksy przesuwają
   * się przy zmianie rosteru, więc dwie wersje gry dogadałyby się bez błędu
   * i policzyły dwa różne światy — desync bez błędu w logice.
   */
  classId: string;
}

/**
 * Kanał komunikacji między graczami. Celowo malutki interfejs, żeby dało się
 * podmienić transport bez ruszania logiki gry:
 *  - BroadcastTransport — dwie karty jednej przeglądarki (testy, zero serwera)
 *  - w przyszłości WebRTC — gra przez internet
 */
export interface Transport {
  readonly localId: string;
  send(msg: NetMessage): void;
  onMessage(handler: (msg: NetMessage) => void): void;
  close(): void;
}
