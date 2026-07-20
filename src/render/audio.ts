/**
 * ═══════════════════════════════════════════════════════════════════
 *  DŹWIĘK — w całości SYNTEZOWANY, zero plików audio.
 *
 *  Dlaczego bez sampli: gra celowo nie ma assetów (kolory zamiast sprite'ów),
 *  a WebAudio daje neonowe sci-fi z samych oscylatorów i szumu. Repo zostaje
 *  lekkie, nie ma licencji do pilnowania, a barwę zmienia się liczbą w kodzie
 *  zamiast szukaniem nowego pliku.
 *
 *  ZASADA: to warstwa RENDERU. Dźwięk nigdy nie wpływa na symulację —
 *  odtwarzamy go, obserwując stan świata (tak samo jak błyski i wstrząsy
 *  kamery). Dzięki temu wyciszony gracz liczy w co-opie dokładnie ten sam
 *  świat co gracz z głośnikami.
 * ═══════════════════════════════════════════════════════════════════
 */

import { Rng } from '../sim/rng';

const MUTE_KEY = 'webslasher-muted';

/** Krzywa wygaszania — wykładnicza brzmi naturalnie, liniowa „klika". */
type Wave = OscillatorType;

interface ToneOpts {
  /** Częstotliwość początkowa i końcowa (Hz) — różne dają „sweep". */
  from: number;
  to?: number;
  /** Czas trwania w sekundach. */
  dur: number;
  /** Głośność szczytowa (0-1) przed masterem. */
  gain: number;
  wave?: Wave;
  /** Opóźnienie startu — z niego robimy akordy i podwójne uderzenia. */
  delay?: number;
}

interface NoiseOpts {
  dur: number;
  gain: number;
  /** Odcięcie filtra dolnoprzepustowego: wysokie = syk, niskie = łomot. */
  cutoffFrom: number;
  cutoffTo?: number;
  delay?: number;
}

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  /** Bufor białego szumu — generowany raz, używany przez wszystkie trzaski. */
  private noiseBuffer: AudioBuffer | null = null;
  /** Ostatni czas odtworzenia danego dźwięku — do limitowania natłoku. */
  private readonly lastPlayed = new Map<string, number>();

  muted: boolean;

  constructor() {
    this.muted = localStorage.getItem(MUTE_KEY) === '1';
  }

  /**
   * AudioContext wolno stworzyć dopiero po geście użytkownika — przeglądarki
   * blokują dźwięk startujący sam z siebie. Wołamy to z pierwszego kliknięcia
   * i klawisza; kolejne wywołania są darmowe.
   */
  unlock(): void {
    if (!this.ctx) {
      const Ctor: typeof AudioContext =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.6;
      this.master.connect(this.ctx.destination);
    }
    // Karta wróciła z tła albo kontekst wystartował zawieszony.
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0');
    if (this.master && this.ctx) {
      // Płynne wyciszenie zamiast skoku — skok słychać jako trzask.
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.6, this.ctx.currentTime, 0.02);
    }
    return this.muted;
  }

  dispose(): void {
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
    this.lastPlayed.clear();
  }

  /* ── Prymitywy syntezy ────────────────────────────────────────────────── */

  /**
   * Ogranicznik natłoku: przy 400 wrogach zdarzenia „trafienie" lecą dziesiątki
   * razy na sekundę. Bez tego dostajemy ścianę szumu zamiast dźwięku gry —
   * i realny spadek FPS od setek węzłów audio naraz.
   */
  private tooSoon(key: string, minGapMs: number): boolean {
    const now = performance.now();
    const last = this.lastPlayed.get(key) ?? -Infinity;
    if (now - last < minGapMs) return true;
    this.lastPlayed.set(key, now);
    return false;
  }

  private tone(o: ToneOpts): void {
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime + (o.delay ?? 0);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = o.wave ?? 'square';
    osc.frequency.setValueAtTime(o.from, t);
    if (o.to !== undefined && o.to !== o.from) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.to), t + o.dur);
    }
    // Atak 5 ms: dość szybki, żeby brzmiał ostro, dość wolny, żeby nie strzelał.
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(o.gain, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + o.dur + 0.02);
  }

  private noise(o: NoiseOpts): void {
    if (!this.ctx || !this.master || this.muted) return;
    if (!this.noiseBuffer) {
      const len = Math.floor(this.ctx.sampleRate * 0.5);
      this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      // Szum z seedowanego RNG, nie z Math.random(): brzmi identycznie, a nie
      // wprowadza do repo drugiego źródła losowości, które ktoś mógłby potem
      // skopiować do symulacji i rozjechać co-opa.
      const rng = new Rng(0x5eed);
      for (let i = 0; i < len; i++) data[i] = rng.next() * 2 - 1;
    }
    const t = this.ctx.currentTime + (o.delay ?? 0);
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(o.cutoffFrom, t);
    if (o.cutoffTo !== undefined) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(40, o.cutoffTo), t + o.dur);
    }
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(o.gain, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t);
    src.stop(t + o.dur + 0.02);
  }

  /* ── Paleta dźwięków gry ──────────────────────────────────────────────── */
  /* Każdy dźwięk ma swój limit natłoku dobrany do tego, jak często zachodzi. */

  /** Auto-atak: krótkie cięcie powietrza. */
  melee(): void {
    if (this.tooSoon('melee', 60)) return;
    this.noise({ dur: 0.09, gain: 0.16, cutoffFrom: 5200, cutoffTo: 900 });
    this.tone({ from: 420, to: 190, dur: 0.08, gain: 0.06, wave: 'sawtooth' });
  }

  /** Power Slash: to samo cięcie, ale cięższe i z opadającym ogonem. */
  skill(): void {
    this.noise({ dur: 0.24, gain: 0.3, cutoffFrom: 7000, cutoffTo: 400 });
    this.tone({ from: 700, to: 90, dur: 0.28, gain: 0.16, wave: 'sawtooth' });
    this.tone({ from: 180, to: 60, dur: 0.34, gain: 0.12, wave: 'triangle', delay: 0.02 });
  }

  /** Trafienie wroga — najczęstszy dźwięk w grze, więc najostrzej limitowany. */
  hit(): void {
    if (this.tooSoon('hit', 45)) return;
    this.tone({ from: 320, to: 160, dur: 0.05, gain: 0.07, wave: 'square' });
  }

  /** Zabicie wroga: krótkie, satysfakcjonujące „pyk" w dół. */
  kill(): void {
    if (this.tooSoon('kill', 55)) return;
    this.noise({ dur: 0.1, gain: 0.12, cutoffFrom: 2600, cutoffTo: 300 });
    this.tone({ from: 240, to: 70, dur: 0.11, gain: 0.09, wave: 'triangle' });
  }

  /** Gracz oberwał — celowo brzydkie i niskie, ma się wybijać z tła walki. */
  hurt(): void {
    if (this.tooSoon('hurt', 120)) return;
    this.tone({ from: 150, to: 55, dur: 0.26, gain: 0.24, wave: 'square' });
    this.noise({ dur: 0.16, gain: 0.18, cutoffFrom: 1400, cutoffTo: 180 });
  }

  /** Overshield pochłonął cios — jasne, „szklane", żeby odróżnić od hurt. */
  shield(): void {
    this.tone({ from: 1300, to: 2100, dur: 0.16, gain: 0.13, wave: 'sine' });
    this.tone({ from: 1950, to: 2600, dur: 0.13, gain: 0.07, wave: 'sine', delay: 0.03 });
  }

  /** Podniesienie itemu: dwutonowy wznoszący „ding". */
  pickup(): void {
    if (this.tooSoon('pickup', 40)) return;
    this.tone({ from: 880, dur: 0.07, gain: 0.11, wave: 'sine' });
    this.tone({ from: 1320, dur: 0.11, gain: 0.11, wave: 'sine', delay: 0.06 });
  }

  /** Start fali: wznoszący akord — sygnał „zaczynamy". */
  waveStart(): void {
    this.tone({ from: 300, to: 600, dur: 0.5, gain: 0.13, wave: 'sawtooth' });
    this.tone({ from: 450, to: 900, dur: 0.5, gain: 0.09, wave: 'sawtooth', delay: 0.07 });
  }

  /** Fala oczyszczona: ten sam akord opadający — sygnał „możesz odetchnąć". */
  waveCleared(): void {
    this.tone({ from: 700, to: 420, dur: 0.42, gain: 0.12, wave: 'triangle' });
    this.tone({ from: 470, to: 280, dur: 0.5, gain: 0.1, wave: 'triangle', delay: 0.08 });
  }

  /** Boss wchodzi albo zmienia fazę: niski, rozstrojony dron. */
  bossPhase(): void {
    this.tone({ from: 110, to: 55, dur: 0.9, gain: 0.22, wave: 'sawtooth' });
    // Rozstrojenie o kilka Hz daje charakterystyczne „dudnienie" grozy.
    this.tone({ from: 116, to: 58, dur: 0.9, gain: 0.18, wave: 'sawtooth' });
    this.noise({ dur: 0.7, gain: 0.14, cutoffFrom: 600, cutoffTo: 90 });
  }

  /** Śmierć gracza: długie opadanie, wyraźnie dłuższe niż cokolwiek innego. */
  death(): void {
    this.tone({ from: 400, to: 40, dur: 1.3, gain: 0.26, wave: 'sawtooth' });
    this.noise({ dur: 1.1, gain: 0.16, cutoffFrom: 1800, cutoffTo: 60 });
  }

  /** Zwycięstwo: wznoszący trójdźwięk. */
  victory(): void {
    [523, 659, 784, 1047].forEach((f, i) => {
      this.tone({ from: f, dur: 0.5, gain: 0.12, wave: 'triangle', delay: i * 0.13 });
    });
  }

  /** Gracz się rozłączył — neutralne, opadające „odpięcie". */
  disconnect(): void {
    this.tone({ from: 660, to: 220, dur: 0.3, gain: 0.14, wave: 'square' });
  }

  /** Klik w interfejsie (wybór ulepszenia, przyciski). */
  uiClick(): void {
    this.tone({ from: 720, to: 980, dur: 0.06, gain: 0.1, wave: 'square' });
  }
}

/**
 * Jedna instancja na całą grę: AudioContext jest zasobem systemowym i nie
 * chcemy go tworzyć od nowa przy każdym restarcie sceny (przeglądarki mają
 * twardy limit kontekstów na kartę).
 */
export const sfx = new Sfx();
