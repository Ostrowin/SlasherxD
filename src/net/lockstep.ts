import { EMPTY_INPUT, withoutOneShots, World, type SimInput } from '../sim/world';
import * as C from '../sim/constants';
import type { NetMessage, Transport } from './types';

/**
 * Lockstep — silnik synchronizacji co-opu.
 *
 * ZASADA: świat wykonuje tick N dopiero wtedy, gdy zna wejścia WSZYSTKICH
 * graczy dla ticku N. Nikt nie wyprzedza reszty, więc symulacje nie mogą się
 * rozjechać. Ceną jest to, że najwolniejszy gracz dyktuje tempo — dlatego
 * wejścia wysyłamy z wyprzedzeniem (INPUT_DELAY), żeby zdążyły dolecieć.
 *
 * Opóźnienie wejścia to klasyczny kompromis: 3 ticki = 100 ms zwłoki między
 * kliknięciem a ruchem, ale zero zacinania przy normalnych opóźnieniach sieci.
 */
export const INPUT_DELAY_TICKS = 3;
/** Co ile ticków porównujemy sumy kontrolne stanu. */
export const CHECKSUM_INTERVAL = 30;
/**
 * Po ilu milisekundach ciszy uznajemy gracza za rozłączonego.
 *
 * Kompromis: za krótko — wyrzucamy kogoś, komu tylko przymuliło; za długo —
 * reszta gapi się w „waiting for players…". 5 s to znacznie więcej niż
 * jakikolwiek normalny skok opóźnienia, a wciąż nie jest to wieczność.
 * Grzeczne pożegnanie (`leave`) omija ten czas i wyrzuca od razu.
 */
export const DROP_AFTER_MS = 5000;

export class LockstepSession {
  /** tick → wejścia graczy (null = jeszcze nie dotarło). */
  private readonly buffer = new Map<number, (SimInput | null)[]>();
  /** tick → sumy kontrolne graczy (do wykrywania desyncu). */
  private readonly checksums = new Map<number, (number | null)[]>();

  private accumulator = 0;
  /** Ostatni tick, dla którego wysłaliśmy własne wejście. */
  private sentUpTo = 0;

  /** Tick, na którym wykryto rozjazd symulacji (-1 = wszystko gra). */
  desyncAtTick = -1;
  /** Czy w tej klatce czekamy na czyjeś wejścia. */
  stalled = false;
  /** Ile ticków z rzędu czekamy — do komunikatu „czekam na graczy". */
  stalledTicks = 0;

  /** Gracze usunięci z gry; ich wejścia uzupełniamy pustymi w nieskończoność. */
  private readonly dropped: boolean[];
  /** Gracze, którzy zapowiedzieli wyjście — nie czekamy na nich DROP_AFTER_MS. */
  private readonly leaving: boolean[];
  /** tick → gracze do usunięcia ZE ŚWIATA dokładnie przed tym tickiem. */
  private readonly pendingDrops = new Map<number, number[]>();
  /** Kiedy zaczęliśmy czekać (ms, zegar ścienny) — 0 = nie czekamy. */
  private stalledSinceMs = 0;

  /** Indeksy graczy, którzy wypadli — render pokazuje o tym komunikat. */
  readonly droppedIndexes: number[] = [];
  /**
   * Rozłączenie zostało zastosowane w innym ticku, niż uzgodniono — czyli
   * grozi rozjazdem symulacji. Nie powinno się zdarzyć na BroadcastChannel
   * (dostarcza wszystko i po kolei); zapala się dopiero przy zawodnym
   * transporcie, gdzie i tak trzeba będzie dołożyć potwierdzenia.
   */
  dropRaceDetected = false;

  constructor(
    private readonly world: World,
    private readonly transport: Transport,
    readonly localIndex: number,
    private readonly playerCount: number,
  ) {
    this.dropped = new Array(playerCount).fill(false);
    this.leaving = new Array(playerCount).fill(false);

    // Pierwsze ticki nikt nie zdążyłby obsadzić wejściami, więc wszyscy
    // startują z pustymi — identycznie na każdym kliencie, więc bezpiecznie.
    for (let tick = 1; tick <= INPUT_DELAY_TICKS; tick++) {
      this.buffer.set(tick, new Array(playerCount).fill(EMPTY_INPUT));
    }
    this.sentUpTo = INPUT_DELAY_TICKS;

    transport.onMessage((msg) => this.onMessage(msg));
  }

  private onMessage(msg: NetMessage): void {
    if (msg.t === 'input') {
      // Wejście od gracza, którego już usunięto, musi zostać zignorowane —
      // inaczej klient, do którego dotarło późno, policzyłby inny tick.
      if (this.dropped[msg.index]) return;
      this.slotFor(msg.tick)[msg.index] = msg.input;
    } else if (msg.t === 'checksum') {
      const slot = this.checksumSlotFor(msg.tick);
      slot[msg.index] = msg.sum;
      this.compareChecksums(msg.tick);
    } else if (msg.t === 'leave') {
      this.leaving[msg.index] = true;
    } else if (msg.t === 'drop') {
      this.applyDrop(msg.index, msg.fromTick);
    }
  }

  /**
   * Zapowiedź własnego wyjścia — wołane przy zamykaniu karty. Reszta dzięki
   * temu usuwa nas od razu, zamiast odczekiwać pełne DROP_AFTER_MS.
   */
  announceLeave(): void {
    this.transport.send({ t: 'leave', index: this.localIndex });
  }

  /**
   * Usuwa gracza z gry od ustalonego ticku. Wywoływane zarówno przez klienta,
   * który wykrył ciszę, jak i przez wszystkich, do których dotarła jego
   * decyzja — dlatego musi być idempotentne.
   */
  private applyDrop(index: number, fromTick: number): void {
    if (this.dropped[index] || index === this.localIndex) return;
    this.dropped[index] = true;
    this.droppedIndexes.push(index);

    // Uzgodniony tick może już minąć tylko wtedy, gdy transport zgubił albo
    // przestawił wiadomości. Wtedy i tak usuwamy gracza (lepiej grać dalej
    // niż wisieć), ale zapalamy flagę — sumy kontrolne to potwierdzą.
    let effective = fromTick;
    if (effective <= this.world.tick) {
      effective = this.world.tick + 1;
      this.dropRaceDetected = true;
    }

    // Od tego ticku gracz „nie naciska nic" — dzięki temu hasAllInputs
    // przestaje na niego czekać i lockstep rusza dalej.
    for (const [tick, slot] of this.buffer) {
      if (tick >= effective) slot[index] = EMPTY_INPUT;
    }

    const list = this.pendingDrops.get(effective);
    if (list) list.push(index);
    else this.pendingDrops.set(effective, [index]);
  }

  /**
   * Cisza od gracza trwa zbyt długo — ogłaszamy jego wypadnięcie.
   *
   * Tick wypadnięcia bierzemy z WŁASNEGO stanu, ale jest on identyczny
   * u wszystkich: lockstep zatrzymuje każdego dokładnie na pierwszym ticku
   * bez kompletu wejść. Dlatego nie ma tu żadnych negocjacji.
   */
  private proposeDrop(index: number, fromTick: number): void {
    this.transport.send({ t: 'drop', index, fromTick });
    this.applyDrop(index, fromTick);
  }

  /** Sprawdza, czy ktoś milczy na tyle długo, żeby go usunąć. */
  private checkForDrops(tick: number, nowMs: number): void {
    const slot = this.buffer.get(tick);
    if (!slot) return;
    const waitedLongEnough = nowMs - this.stalledSinceMs >= DROP_AFTER_MS;
    for (let i = 0; i < slot.length; i++) {
      if (slot[i] !== null || i === this.localIndex || this.dropped[i]) continue;
      // Kto się pożegnał, wypada natychmiast; resztę wyrzuca dopiero zegar.
      if (this.leaving[i] || waitedLongEnough) this.proposeDrop(i, tick);
    }
  }

  private slotFor(tick: number): (SimInput | null)[] {
    let slot = this.buffer.get(tick);
    if (!slot) {
      slot = new Array(this.playerCount).fill(null);
      // Na wypadniętych nigdy już nie czekamy — ich wejścia są z definicji puste.
      for (let i = 0; i < this.playerCount; i++) {
        if (this.dropped[i]) slot[i] = EMPTY_INPUT;
      }
      this.buffer.set(tick, slot);
    }
    return slot;
  }

  private checksumSlotFor(tick: number): (number | null)[] {
    let slot = this.checksums.get(tick);
    if (!slot) {
      slot = new Array(this.playerCount).fill(null);
      this.checksums.set(tick, slot);
    }
    return slot;
  }

  private hasAllInputs(tick: number): boolean {
    const slot = this.buffer.get(tick);
    if (!slot) return false;
    for (const input of slot) if (input === null) return false;
    return true;
  }

  /**
   * Wywoływane raz na klatkę renderu. Wysyła własne wejście z wyprzedzeniem
   * i wykonuje tyle ticków symulacji, ile da się bezpiecznie wykonać.
   */
  update(deltaMs: number, localInput: SimInput): void {
    this.sendPendingInputs(localInput);

    // Limit 250 ms chroni przed „spiralą śmierci" po powrocie do uśpionej karty.
    this.accumulator += Math.min(deltaMs, 250) / 1000;
    this.stalled = false;

    while (this.accumulator >= C.TICK_DT) {
      const nextTick = this.world.tick + 1;
      if (!this.hasAllInputs(nextTick)) {
        // Czekamy na kolegów. Nie konsumujemy czasu i nie pozwalamy
        // akumulatorowi rosnąć w nieskończoność — inaczej po wznowieniu
        // gra przewinęłaby się skokowo.
        this.stalled = true;
        this.stalledTicks++;
        const now = performance.now();
        if (this.stalledSinceMs === 0) this.stalledSinceMs = now;
        // Bez tego kroku czekalibyśmy tu w nieskończoność, gdy ktoś zamknie kartę.
        this.checkForDrops(nextTick, now);
        this.accumulator = Math.min(this.accumulator, C.TICK_DT);
        // Usunięcie mogło właśnie odblokować ten tick — spróbujmy jeszcze raz.
        if (!this.hasAllInputs(nextTick)) return;
      }
      this.stalledSinceMs = 0;

      this.applyPendingDrops(nextTick);
      const inputs = this.buffer.get(nextTick)!.map((i) => i ?? EMPTY_INPUT);
      this.world.step(inputs);
      this.accumulator -= C.TICK_DT;
      this.stalledTicks = 0;

      if (this.world.tick % CHECKSUM_INTERVAL === 0) this.publishChecksum();
      this.pruneOldEntries();
    }
  }

  /**
   * Wykonuje uzgodnione rozłączenia tuż przed właściwym tickiem. Każdy klient
   * robi to przed tym samym tickiem, więc świat zmienia się u wszystkich
   * identycznie — na tym opiera się cały determinizm rozłączeń.
   */
  private applyPendingDrops(tick: number): void {
    const list = this.pendingDrops.get(tick);
    if (!list) return;
    // Kolejność ma znaczenie dla sumy kontrolnej, więc jest ustalona.
    for (const index of [...list].sort((a, b) => a - b)) this.world.dropPlayer(index);
    this.pendingDrops.delete(tick);
  }

  private sendPendingInputs(localInput: SimInput): void {
    const targetTick = this.world.tick + 1 + INPUT_DELAY_TICKS;
    let first = true;
    while (this.sentUpTo < targetTick) {
      this.sentUpTo++;
      // Przy nadganianiu kilku ticków naraz wysyłamy pełne wejście tylko raz.
      // Bez tego jedno kliknięcie w talent kupiłoby go dwa razy.
      if (!first) localInput = withoutOneShots(localInput);
      first = false;
      // Własne wejście zapisujemy od razu — BroadcastChannel nie dostarcza
      // wiadomości do nadawcy, więc nikt nie zrobi tego za nas.
      this.slotFor(this.sentUpTo)[this.localIndex] = localInput;
      this.transport.send({
        t: 'input',
        tick: this.sentUpTo,
        index: this.localIndex,
        input: localInput,
      });
    }
  }

  private publishChecksum(): void {
    const sum = this.world.checksum();
    const tick = this.world.tick;
    this.checksumSlotFor(tick)[this.localIndex] = sum;
    this.transport.send({ t: 'checksum', tick, index: this.localIndex, sum });
    this.compareChecksums(tick);
  }

  /** Rozjazd sum = błąd determinizmu. Zgłaszamy raz i nie krzyczymy dalej. */
  private compareChecksums(tick: number): void {
    if (this.desyncAtTick >= 0) return;
    const slot = this.checksums.get(tick);
    if (!slot) return;
    const known = slot.filter((s): s is number => s !== null);
    if (known.length < 2) return;
    if (known.some((s) => s !== known[0])) this.desyncAtTick = tick;
  }

  private pruneOldEntries(): void {
    const cutoff = this.world.tick - 120;
    for (const tick of this.buffer.keys()) {
      if (tick < cutoff) this.buffer.delete(tick);
    }
    for (const tick of this.checksums.keys()) {
      if (tick < cutoff) this.checksums.delete(tick);
    }
  }

  /** Interpolacja renderu — ta sama zasada co w single-playerze. */
  get renderAlpha(): number {
    return this.accumulator / C.TICK_DT;
  }

  dispose(): void {
    // Pożegnanie PRZED zamknięciem kanału — inaczej reszta czekałaby na nas
    // pełne DROP_AFTER_MS zamiast ruszyć od razu.
    this.announceLeave();
    this.transport.close();
  }
}
