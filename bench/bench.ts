import { World } from '../src/sim/world';
import { CLASSES } from '../src/sim/classes';
import { WAVE_CONFIG } from '../src/sim/wavesConfig';
import { PROGRESSION } from '../src/sim/talentsConfig';
import * as C from '../src/sim/constants';
import { botInput, type Policy } from './bot';

/**
 * ═══════════════════════════════════════════════════════════════════
 *  BENCH BALANSU — `npm run bench`
 *
 *  Odpowiada na pytanie „czy gra jest jeszcze trudna?" liczbami zamiast
 *  przeczuciem. Bot gra pełne runy wszystkimi klasami i raportuje, ile fal
 *  przeżywa, kiedy maksuje postać i jak urosła jego moc.
 *
 *  Mierzy też DETERMINIZM (ten sam seed → ta sama suma kontrolna), bo to
 *  jedyny warunek działania co-opu, a złamać go można przypadkiem w każdej
 *  zmianie w symulacji.
 * ═══════════════════════════════════════════════════════════════════
 */

const SEEDS = [1111, 2222, 3333];
/** Twardy limit, żeby nieukończona fala z bossem nie zawiesiła bencha. */
const MAX_TICKS = 60_000;

interface RunResult {
  classId: string;
  victory: boolean;
  timeout: boolean;
  waveReached: number;
  level: number;
  maxLevelWave: number;
  kills: number;
  /** Mnożnik obrażeń z itemów, kart i talentów (1 = brak wzmocnień). */
  damageMult: number;
  critChance: number;
  critDamageMult: number;
  /** Oczekiwany mnożnik z krytów: 1 + szansa × (mnożnik - 1). */
  critExpected: number;
  minutes: number;
  seed: number;
  regenPerSec: number;
  leechHealPerKill: number;
  armorFlat: number;
  hp: number;
}

function playRun(classId: string, seed: number, policy: Policy): RunResult {
  const cls = CLASSES.find((c) => c.id === classId)!;
  const world = new World(seed, [cls], [[]]);
  const p = world.players[0];
  let maxLevelWave = -1;
  let ticks = 0;

  while (ticks < MAX_TICKS && world.phase !== 'victory' && !p.dead) {
    world.step([botInput(world, p, policy)]);
    ticks++;
    if (maxLevelWave < 0 && p.level >= PROGRESSION.maxLevel) maxLevelWave = world.wave;
  }

  const critExpected = 1 + (p.critChance / 100) * (p.critDamageMult - 1);
  return {
    classId,
    victory: world.phase === 'victory',
    timeout: ticks >= MAX_TICKS,
    waveReached: world.wave,
    level: p.level,
    maxLevelWave,
    kills: p.kills,
    damageMult: p.damageMult,
    critChance: p.critChance,
    critDamageMult: p.critDamageMult,
    critExpected,
    minutes: (ticks * C.TICK_DT) / 60,
    seed,
    regenPerSec: p.regenPerSec,
    leechHealPerKill: p.leechHealPerKill,
    armorFlat: p.armorFlat,
    hp: p.hp,
  };
}

const avg = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const pad = (s: string | number, n: number): string => String(s).padEnd(n);
const padL = (s: string | number, n: number): string => String(s).padStart(n);

function summarise(label: string, runs: RunResult[]): void {
  const wins = runs.filter((r) => r.victory).length;
  const maxed = runs.filter((r) => r.maxLevelWave > 0);
  console.log(
    `\n${label}: ${wins}/${runs.length} zwyciestw (${Math.round((wins / runs.length) * 100)}%)` +
      `  |  srednia fala ${avg(runs.map((r) => r.waveReached)).toFixed(1)}/${WAVE_CONFIG.totalWaves}` +
      `  |  sredni poziom ${avg(runs.map((r) => r.level)).toFixed(1)}/${PROGRESSION.maxLevel}` +
      `  |  max poziom na fali ${maxed.length ? avg(maxed.map((r) => r.maxLevelWave)).toFixed(1) : '—'}` +
      `  |  sredni run ${avg(runs.map((r) => r.minutes)).toFixed(1)} min`,
  );
}

function table(runs: RunResult[]): void {
  console.log(
    '\n  ' + pad('klasa', 10) + padL('fala', 6) + padL('lvl', 5) + padL('zabici', 8) +
      padL('dmg x', 8) + padL('kryt%', 7) + padL('krytx', 7) + padL('moc x', 8) + '  wynik',
  );
  console.log('  ' + '-'.repeat(72));
  for (const r of runs) {
    const power = r.damageMult * r.critExpected;
    console.log(
      '  ' + pad(r.classId, 10) +
        padL(r.waveReached, 6) + padL(r.level, 5) + padL(r.kills, 8) +
        padL(r.damageMult.toFixed(2), 8) + padL(r.critChance.toFixed(0), 7) +
        padL(r.critDamageMult.toFixed(2), 7) + padL(power.toFixed(2), 8) +
        '  ' + (r.victory ? 'WYGRANA' : r.timeout ? 'TIMEOUT' : `smierc (fala ${r.waveReached})`),
    );
  }
}

/** Ten sam seed musi dać identyczny świat — warunek działania co-opu. */
function determinismCheck(): boolean {
  const runA = new World(777, [CLASSES[4], CLASSES[3]], [[], []]);
  const runB = new World(777, [CLASSES[4], CLASSES[3]], [[], []]);
  for (let t = 0; t < 4000; t++) {
    const inputs = [
      botInput(runA, runA.players[0], 'active'),
      botInput(runA, runA.players[1], 'active'),
    ];
    runA.step(inputs);
    runB.step(inputs);
  }
  const ok = runA.checksum() === runB.checksum();
  console.log(
    `\nDETERMINIZM: ${ok ? 'OK' : 'BLAD'} (${runA.checksum()} vs ${runB.checksum()})`,
  );
  return ok;
}

function main(): void {
  console.log('═'.repeat(76));
  console.log(`BENCH BALANSU — ${WAVE_CONFIG.totalWaves} fal po ${WAVE_CONFIG.waveDurationSeconds}s` +
    `, max poziom ${PROGRESSION.maxLevel}, ${SEEDS.length} seedy na klase`);
  console.log('═'.repeat(76));

  const started = Date.now();
  const results: Record<Policy, RunResult[]> = { passive: [], active: [] };

  for (const policy of ['passive', 'active'] as Policy[]) {
    for (const cls of CLASSES) {
      for (const seed of SEEDS) results[policy].push(playRun(cls.id, seed, policy));
    }
  }

  // Bot pasywny to podłoga: jeśli stanie w miejscu wystarcza, gra jest zepsuta.
  summarise('STANIE W MIEJSCU', results.passive);
  summarise('AKTYWNA GRA    ', results.active);

  // Stanie w miejscu NIE MOŻE wygrywać. Jeśli wygrywa, to nie kwestia balansu,
  // tylko dziura w regułach — dokładnie tak wyglądał bug z regeneracją
  // (roadmap.md, playtest 2026-07-19). Dlatego alarm jest głośny.
  const passiveWins = results.passive.filter((r) => r.victory || r.waveReached > 5);
  if (passiveWins.length > 0) {
    console.log('\n!!! ANOMALIA: stanie w miejscu zaszło za daleko:');
    for (const r of passiveWins) {
      console.log(
        `    ${r.classId} (seed ${r.seed}) — fala ${r.waveReached}, lvl ${r.level}` +
          `, leech ${r.leechHealPerKill.toFixed(1)} HP/zabicie` +
          `, regen ${r.regenPerSec.toFixed(2)}/s, pancerz ${r.armorFlat}` +
          `, ${r.victory ? 'WYGRANA' : 'przezyl'}`,
      );
    }
  }

  // W tabeli pokazujemy pierwszy seed każdej klasy — reszta idzie w średnie.
  console.log('\nAKTYWNA GRA — po jednym runie na klase (seed ' + SEEDS[0] + '):');
  table(results.active.filter((_, i) => i % SEEDS.length === 0));

  const ok = determinismCheck();
  console.log(`\nCzas bencha: ${((Date.now() - started) / 1000).toFixed(1)}s`);
  if (!ok) process.exitCode = 1;
}

main();
