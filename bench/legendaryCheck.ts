import { World, EMPTY_INPUT, type SimInput } from '../src/sim/world';
import { classById } from '../src/sim/classes';
import { talentSlotsFor } from '../src/sim/talentsConfig';
import {
  LEGENDARIES, LEGENDARY_RARITY, legendaryById, type GearPiece,
} from '../src/sim/gearConfig';
import { statusIndexById } from '../src/sim/statusConfig';

/**
 * TESTY LEGENDAREK (2026-08-27).
 *
 * Efekty legendarek to zbiór jednolinijkowych HOOKÓW rozsianych po `world.ts`,
 * z których każdy sprawdza `uniqueEffects.has(id)`. Da się je zepsuć niewidocznie:
 * literówka w id, przeniesiony hook, zmieniona ścieżka obrażeń — a `tsc` niczego
 * nie zauważy. Ten plik zamraża je dwoma warstwami:
 *
 *  1. OKABLOWANIE (wszystkie): equip przez realny pipeline (plecak → equip →
 *     `recomputeGear` → `uniqueEffects`) i asercja, że efekt się zarejestrował.
 *     Łapie literówki id i rozjazd rejestr↔pipeline dla KAŻDEJ legendarki.
 *  2. BEHAWIOR (reprezentant każdej RODZINY hooków): scenariusz + asercja, że
 *     efekt naprawdę pala (obrażenia, status, licznik, czas). Rodziny dzielą kod
 *     hooka, więc jeden reprezentant chroni całą grupę.
 */

const wyniki: [string, boolean, string][] = [];
const check = (n: string, ok: boolean, i = ''): void => {
  wyniki.push([n, ok, i]);
};
const input = (over: Partial<SimInput>): SimInput => ({ ...EMPTY_INPUT, ...over });

/** Świeży świat z jedną klasą. */
function makeWorld(classId: string): World {
  return new World(4242, [classById(classId)!], [[]]);
}

/** Wydaje punkt w specjalizację (id = `${branch}-spec`) — jak w otterCheck. */
function pickSpec(world: World, classId: string, specId: string): void {
  const slots = talentSlotsFor(classId);
  const index = slots.findIndex((s) => s.def.id === specId);
  if (index < 0) throw new Error(`brak talentu ${specId}`);
  const p = world.players[0];
  p.level = Math.max(p.level, 25);
  p.talentPoints++;
  world.step([input({ talentPick: index })]);
}

let nextId = 90000;
/** Zakłada legendarkę realnym pipeline'em (plecak → komenda equip → recompute). */
function equip(world: World, legId: string): void {
  const def = legendaryById(legId);
  if (!def) throw new Error(`brak legendarki ${legId}`);
  const p = world.players[0];
  const piece: GearPiece = {
    id: nextId++,
    slotType: def.slotType,
    twoHanded: def.twoHanded,
    name: def.name,
    rarity: LEGENDARY_RARITY,
    affixes: def.affixes.map((a) => ({ ...a })),
    unique: def.id,
  };
  let bi = p.bag.findIndex((x) => !x);
  if (bi < 0) bi = 0;
  p.bag[bi] = piece;
  world.step([input({ equipFromBag: bi })]);
}

/** Czeka aż pojawi się co najmniej `n` żywych wrogów. */
function spawnMobs(world: World, n = 1): void {
  for (let t = 0; t < 200 && world.aliveMobs < n; t++) world.step([EMPTY_INPUT]);
}

/* ── 1. OKABLOWANIE: equip → uniqueEffects dla KAŻDEJ legendarki ─────────────
 * Realny pipeline (plecak → equip → recomputeGear). Łapie literówki id oraz
 * rozjazd między rejestrem LEGENDARIES a hookami w world.ts.
 */
{
  let ok = 0;
  for (const def of LEGENDARIES) {
    const world = makeWorld(def.classId);
    equip(world, def.id);
    const wired = world.players[0].uniqueEffects.has(def.id);
    if (wired) ok++;
    else check(`OKABLOWANIE ${def.id}`, false, `NIE zarejestrowane`);
  }
  check(`OKABLOWANIE wszystkich legendarek (${ok}/${LEGENDARIES.length})`, ok === LEGENDARIES.length, '');
}

/* ── 2a. rollDamage — mnożnik warunkowy (reprezentant: EVENT HORIZON) ─────────
 * gravity-drag ma damagePerTick 0 i vulnerability 1, więc RÓŻNICA w obrażeniach
 * między celem pod dragiem a bez jest CZYSTO efektem legendarki (zero DoT-u).
 */
{
  const w = makeWorld('bear');
  const p = w.players[0];
  pickSpec(w, 'bear', 'bear-gravity-spec');
  equip(w, 'event-horizon');
  spawnMobs(w, 2);
  const alive = w.mobs.filter((m) => m.alive);
  const a = alive[0]; const b = alive[1];
  a.hp = 99999; b.hp = 99999;
  const drag = statusIndexById('gravity-drag');
  for (let t = 0; t < 60; t++) {
    a.x = p.x + 25; a.y = p.y - 8;
    b.x = p.x + 25; b.y = p.y + 8;
    w.applyStatus(b, drag, 0); // krótki status — odnawiaj co tick
    w.step([EMPTY_INPUT]);
  }
  const lossA = 99999 - a.hp; const lossB = 99999 - b.hp;
  check('event-horizon: +30% na gravity-drag', lossB > lossA * 1.2, `zwykly=${lossA.toFixed(0)} drag=${lossB.toFixed(0)}`);
}

/* ── 2b. rollDamage — EXECUTE (return target.hp) (LAUGHING FANG) ──────────────── */
{
  const w = makeWorld('hyena');
  const p = w.players[0];
  pickSpec(w, 'hyena', 'hy-cackle-spec');
  equip(w, 'laughing-fang');
  spawnMobs(w, 1);
  const m = w.mobs.find((x) => x.alive)!;
  m.x = p.x + 60; m.y = p.y; m.hp = m.maxHp * 0.2; // < 25% HP
  const zdrowy = m.alive;
  // RAVENOUS BITE (Q, cone) niesie target do rollDamage → egzekucja.
  w.step([input({ skillCast: 0, aimX: p.x + 500, aimY: p.y })]);
  check('laughing-fang: egzekucja wroga <25% HP', zdrowy && !m.alive, '');
}

/* ── 2c. meleeDamageOf — konwersja HP→dmg (TITANHEART) ───────────────────────
 * Dwa światy: ta sama nadwyżka HP, jeden z legendarką. Różnica = konwersja.
 */
{
  const mk = (leg: boolean): number => {
    const w = makeWorld('bear');
    const p = w.players[0];
    pickSpec(w, 'bear', 'bear-hib-spec');
    if (leg) equip(w, 'titanheart');
    p.maxHpBonus += 300;
    return w.meleeDamageOf(p);
  };
  const z = mk(true); const bez = mk(false);
  check('titanheart: nadwyżka HP → obrażenia', z > bez * 1.05, `bez=${bez.toFixed(1)} z=${z.toFixed(1)}`);
}

/* ── 2d. applyOnHit — status na auto-ataku (NEUTRON CORE) ────────────────────── */
{
  const w = makeWorld('bear');
  const p = w.players[0];
  pickSpec(w, 'bear', 'bear-gravity-spec');
  equip(w, 'neutron-core');
  spawnMobs(w, 1);
  const m = w.mobs.find((x) => x.alive)!;
  m.hp = 99999;
  const drag = statusIndexById('gravity-drag');
  let got = false;
  for (let t = 0; t < 90 && !got; t++) {
    m.x = p.x + 25; m.y = p.y;
    w.step([EMPTY_INPUT]);
    got = m.alive && m.statuses.some((s) => s.defIndex === drag);
  }
  check('neutron-core: auto-atak nakłada gravity-drag', got, '');
}

/* ── 2e. applyOnHit — DODATKOWY stack (FANGS OF SCURRY) ──────────────────────
 * SCURRY sam nakłada 1 stack venomu na cios; legendarka dokłada drugi.
 */
{
  const w = makeWorld('rat');
  const p = w.players[0];
  pickSpec(w, 'rat', 'rat-scurry-spec');
  equip(w, 'fangs-of-scurry');
  spawnMobs(w, 1);
  const m = w.mobs.find((x) => x.alive)!;
  m.hp = 99999;
  const venom = statusIndexById('venom');
  let stacks = 0;
  for (let t = 0; t < 90; t++) {
    m.x = p.x + 25; m.y = p.y;
    w.step([EMPTY_INPUT]);
    const st = m.statuses.find((s) => s.defIndex === venom);
    if (st) { stacks = st.stacks; break; }
  }
  check('fangs-of-scurry: 2 stacki venomu z jednego ciosu', stacks >= 2, `stacks=${stacks}`);
}

/* ── 2f. castCone — nadpisanie statusu przez skill.id (GAUNTLET OF DOMINATION) ── */
{
  const w = makeWorld('gorilla');
  const p = w.players[0];
  pickSpec(w, 'gorilla', 'gor-iron-spec');
  equip(w, 'gauntlet-of-domination');
  spawnMobs(w, 1);
  const m = w.mobs.find((x) => x.alive)!;
  m.hp = 99999; m.x = p.x + 60; m.y = p.y;
  // GROUND SLAM = E (slot 2).
  w.step([input({ skillCast: 2, aimX: p.x + 500, aimY: p.y })]);
  check('gauntlet: GROUND SLAM ogłusza', !m.alive || w.mobStunned(m), '');
}

/* ── 2g. stepAuras — aura wymuszona legendarką (EVERTIDE SHELL) ───────────────
 * Bez castu TIDE GUARD: sama obecność legendarki wiesza aurę → wróg dostaje SOAKED.
 */
{
  const w = makeWorld('otter');
  const p = w.players[0];
  pickSpec(w, 'otter', 'ott-tide-spec');
  equip(w, 'evertide-shell');
  spawnMobs(w, 1);
  const m = w.mobs.find((x) => x.alive)!;
  m.hp = 99999;
  const soaked = statusIndexById('soaked');
  let got = false;
  for (let t = 0; t < 40 && !got; t++) {
    m.x = p.x + 80; m.y = p.y;
    w.step([EMPTY_INPUT]);
    got = m.statuses.some((s) => s.defIndex === soaked);
  }
  check('evertide-shell: TIDE GUARD na stałe (SOAKED bez castu)', got, '');
}

/* ── 2h. timestop — dłuższy czas (HOURGLASS OF THE VOID) ─────────────────────── */
{
  const base = makeWorld('fox');
  pickSpec(base, 'fox', 'fox-chrono-spec');
  base.step([input({ skillCast: 2, aimX: base.players[0].x, aimY: base.players[0].y })]);
  const baseTicks = base.timeStopTicks;

  const w = makeWorld('fox');
  const p = w.players[0];
  pickSpec(w, 'fox', 'fox-chrono-spec');
  equip(w, 'hourglass-of-the-void');
  w.step([input({ skillCast: 2, aimX: p.x, aimY: p.y })]);
  check('hourglass: TIME STOP +50%', baseTicks > 0 && w.timeStopTicks > baseTicks * 1.4, `baza=${baseTicks} z=${w.timeStopTicks}`);
}

/* ── 2i. castSummon — liczba sztuk (SWARMLORD SCEPTER) ───────────────────────── */
{
  const countRats = (leg: boolean): number => {
    const w = makeWorld('rat');
    const p = w.players[0];
    pickSpec(w, 'rat', 'rat-swarm-spec');
    if (leg) equip(w, 'swarmlord-scepter');
    // SWARM = E (slot 2) — jedyny summon w tym momencie, więc liczymy wszystkie.
    w.step([input({ skillCast: 2, aimX: p.x + 100, aimY: p.y })]);
    return w.minions.filter((m) => m.alive).length;
  };
  const bez = countRats(false); const z = countRats(true);
  check('swarmlord: SWARM +50% szczurów', z > bez, `baza=${bez} z=${z}`);
}

/* ── 2j. spawnMinion — wyższy limit sztuk (BOND OF THE PACK) ─────────────────── */
{
  const peakGolems = (leg: boolean): number => {
    const w = makeWorld('hare');
    const p = w.players[0];
    pickSpec(w, 'hare', 'hare-summoner-spec');
    if (leg) equip(w, 'bond-of-the-pack');
    let peak = 0;
    for (let t = 0; t < 700; t++) {
      const cast = p.skillCooldowns[0] <= 0 ? 0 : -1; // Q = golem, spam ponad limit
      w.step([input({ skillCast: cast, aimX: p.x + 60, aimY: p.y })]);
      peak = Math.max(peak, w.minions.filter((m) => m.alive).length);
    }
    return peak;
  };
  const bez = peakGolems(false); const z = peakGolems(true);
  check('bond-of-the-pack: +1 do limitu przyzwań', z > bez, `baza=${bez} z=${z}`);
}

/* ── 2k. dashImpact — status na lądowaniu (WINDSTEP BOOTS) ───────────────────── */
{
  const w = makeWorld('hare');
  const p = w.players[0];
  pickSpec(w, 'hare', 'hare-slip-spec');
  equip(w, 'windstep-boots');
  spawnMobs(w, 1);
  const m = w.mobs.find((x) => x.alive)!;
  m.hp = 99999;
  const chill = statusIndexById('chill');
  let got = false;
  // LEAP STRIKE (Q, slot 0) → lądowanie z falą. Trzymamy moba przy graczu,
  // żeby na pewno był w promieniu uderzenia, gdy doskok wyląduje.
  for (let t = 0; t < 90 && !got; t++) {
    const cast = t === 0 ? 0 : -1;
    w.step([input({ skillCast: cast, aimX: p.x + 300, aimY: p.y })]);
    m.x = p.x; m.y = p.y + 20;
    got = m.alive && m.statuses.some((s) => s.defIndex === chill);
  }
  check('windstep-boots: lądowanie mrozi', got, '');
}

/* ── 3. Determinizm z założoną legendarką ────────────────────────────────────
 * Equip zmienia stan gracza (uniqueEffects + staty) i wchodzi do checksumu —
 * ten sam seed musi dać ten sam run.
 */
{
  const run = (): string => {
    const w = makeWorld('wolf');
    const p = w.players[0];
    pickSpec(w, 'wolf', 'wolf-thunder-spec');
    equip(w, 'stormfang');
    for (let t = 0; t < 600; t++) {
      const slot = t % 40 === 0 ? (t / 40) % 3 : -1;
      w.step([input({ skillCast: slot, aimX: p.x + 300, aimY: p.y + 120, dash: t % 97 === 0 })]);
    }
    return `${Math.round(p.x)},${Math.round(p.y)},${w.kills},${Math.round(p.hp)}`;
  };
  const a = run(); const b = run();
  check('determinizm z legendarką (stormfang)', a === b, `${a} vs ${b}`);
}

let zle = 0;
for (const [n, ok, i] of wyniki) {
  if (!ok) zle++;
  console.log(`${ok ? 'OK  ' : 'BLAD'} ${n}${i ? ` — ${i}` : ''}`);
}
console.log(`WYNIK: ${zle === 0 ? 'OK' : `${zle} BLEDOW`}`);
process.exitCode = zle === 0 ? 0 : 1;
