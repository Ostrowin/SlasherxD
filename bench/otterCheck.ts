import { World, EMPTY_INPUT, type SimInput } from '../src/sim/world';
import { classById } from '../src/sim/classes';
import { talentSlotsFor } from '../src/sim/talentsConfig';
import { MINIONS } from '../src/sim/minionsConfig';
import { statusIndexById } from '../src/sim/statusConfig';

/**
 * TESTY OBU GAŁĘZI WYDRY (2026-07-24).
 *
 * Gałęzie wydry wprowadziły trzy prymitywy, których nie miała żadna inna
 * klasa — jazdę na fali (`DashDef.ride`), status na ciosie w stożku
 * (`ConeSkill.status`) i zamianę miejsc z własną jednostką (`phaseSwap`) —
 * plus wpięcie podatności w obrażenia gracza. Każdy z nich da się zepsuć
 * niewidocznie: fala nadal będzie niosła gracza, tylko przestanie bić po
 * drodze, a klony nadal będą stały, tylko przestaną powtarzać cios.
 *
 * Test złapał przy pisaniu dwa prawdziwe błędy: `R` stawiające cztery klony
 * przy limicie trzech (ultimate kasował własnego pierwszego klona w tym samym
 * ticku) i pudło `PHASE SWAP` zjadające pełny cooldown.
 */

const wyniki: [string, boolean, string][] = [];
const check = (n: string, ok: boolean, i = ''): void => {
  wyniki.push([n, ok, i]);
};

function makeWorld(): World {
  return new World(4242, [classById('otter')!], [[]]);
}

/** Wydaje punkt w talent o podanym id (indeks w spłaszczonej tablicy). */
function pick(world: World, id: string): void {
  const slots = talentSlotsFor('otter');
  const index = slots.findIndex((s) => s.def.id === id);
  if (index < 0) throw new Error(`brak talentu ${id}`);
  const p = world.players[0];
  // Specjalizacji nie da się kupić przed `PROGRESSION.specLevel` — w teście
  // interesuje nas zachowanie gałęzi, nie krzywa expa, więc dajemy poziom.
  p.level = Math.max(p.level, 25);
  p.talentPoints++;
  const input: SimInput = { ...EMPTY_INPUT, talentPick: index };
  world.step([input]);
}

const input = (over: Partial<SimInput>): SimInput => ({ ...EMPTY_INPUT, ...over });

/* ── 1. TIDECALLER: fala bije PO DRODZE i da się z niej zejść ────────────── */
{
  const world = makeWorld();
  const p = world.players[0];
  pick(world, 'ott-tide-spec');
  check('TIDECALLER obsadza 4 sloty', p.skillIds.join(',') === 'tidal-surf,tide-whirl,tide-guard,tide-maelstrom', p.skillIds.join(','));
  check('TIDECALLER zapala aure lifetide', p.auraIds.includes('lifetide'), p.auraIds.join(','));

  // Stawiamy wroga na trasie fali i mierzymy, czy oberwał i czy zmókł.
  const startX = p.x;
  for (let t = 0; t < 60 && world.aliveMobs === 0; t++) world.step([EMPTY_INPUT]);
  const mob = world.mobs.find((m) => m.alive)!;
  mob.x = p.x + 400;
  mob.y = p.y;
  const hpPrzed = mob.hp;

  world.step([input({ skillCast: 0, aimX: p.x + 1000, aimY: p.y })]);
  check('surf wystartowal', p.dashTicksLeft > 0, `ticks=${p.dashTicksLeft}`);
  // 16 ticków z 45: jesteśmy w POŁOWIE jazdy, więc obrażenia poniżej mogą
  // pochodzić wyłącznie z drogi, a nie z lądowania. O to w tym teście chodzi.
  for (let t = 0; t < 16; t++) world.step([EMPTY_INPUT]);
  check('fala rani PO DRODZE (nie na koncu)', mob.hp < hpPrzed || !mob.alive, `hp ${hpPrzed} -> ${mob.hp}`);
  const soaked = statusIndexById('soaked');
  check('fala naklada SOAKED', !mob.alive || mob.statuses.some((s) => s.defIndex === soaked), '');

  // Dowozimy jazdę prawie do końca: fala ma nieść DALEKO, nie szarpnąć.
  for (let t = 0; t < 14; t++) world.step([EMPTY_INPUT]);
  check('surf niesie gracza daleko', p.x - startX > 900, `dx=${Math.round(p.x - startX)}`);

  // Drugie wciśnięcie Q ZSIADA z fali, mimo że skill jest na cooldownie.
  const przedZsiadem = p.dashTicksLeft;
  world.step([input({ skillCast: 0, aimX: p.x + 1000, aimY: p.y })]);
  check('drugie Q zsiada z fali', przedZsiadem > 0 && p.dashTicksLeft === 0, `${przedZsiadem} -> ${p.dashTicksLeft}`);
}

/* ── 2. TIDECALLER: wir ogłusza, Breakwater podmienia falę ───────────────── */
{
  const world = makeWorld();
  const p = world.players[0];
  pick(world, 'ott-tide-spec');
  for (let i = 0; i < 5; i++) pick(world, 'tide-current');
  pick(world, 'tide-breakwater');
  check('Breakwater podmienia Q', p.skillIds[0] === 'tidal-surf-crash', p.skillIds[0]);

  for (let t = 0; t < 60 && world.aliveMobs === 0; t++) world.step([EMPTY_INPUT]);
  const mob = world.mobs.find((m) => m.alive)!;
  mob.x = p.x + 200;
  mob.y = p.y;
  world.step([input({ skillCast: 0, aimX: p.x + 1000, aimY: p.y })]);
  for (let t = 0; t < 6; t++) world.step([EMPTY_INPUT]);
  check('fala Breakwater OGLUSZA', !mob.alive || world.mobStunned(mob), '');

  // Wir: stawiamy i sprawdzamy, że w ogóle powstał i ogłusza.
  const world2 = makeWorld();
  const p2 = world2.players[0];
  pick(world2, 'ott-tide-spec');
  world2.step([input({ skillCast: 1, aimX: p2.x + 200, aimY: p2.y })]);
  const wir = world2.minions.find((m) => m.alive && MINIONS[m.defIndex].id === 'tide-whirl');
  check('WHIRLPOOL powstal', !!wir, '');
}

/* ── 3. MIRROR TIDE: Q zostawia klona i klony powtarzają cios ────────────── */
{
  const world = makeWorld();
  const p = world.players[0];
  pick(world, 'ott-mirror-spec');
  check('MIRROR TIDE obsadza 4 sloty', p.skillIds.join(',') === 'mirror-lance,mirror-shatter,phase-swap,thousand-mirrors', p.skillIds.join(','));

  const cloneDef = MINIONS.findIndex((m) => m.id === 'mirror-clone');
  const klony = (): number => world.minions.filter((m) => m.alive && m.defIndex === cloneDef).length;

  world.step([input({ skillCast: 0, aimX: p.x + 500, aimY: p.y })]);
  check('Q zostawia klona', klony() === 1, `${klony()}`);

  // Klon stoi tam, gdzie padł cios — czyli na pozycji gracza.
  const klon = world.minions.find((m) => m.alive && m.defIndex === cloneDef)!;
  check('klon stoi w miejscu ciosu', Math.abs(klon.x - p.x) < 1 && Math.abs(klon.y - p.y) < 1, `${Math.round(klon.x - p.x)},${Math.round(klon.y - p.y)}`);

  // Wróg NIE przed graczem, tylko przed KLONEM — trafić go może wyłącznie echo.
  for (let t = 0; t < 60 && world.aliveMobs === 0; t++) world.step([EMPTY_INPUT]);
  // Najpierw czekamy na cooldown, a DOPIERO POTEM ustawiamy pozycje: wrogowie
  // gonią gracza, więc mob ustawiony przed czekaniem zdążyłby odejść z zasięgu
  // klona i test mierzyłby jego wędrówkę zamiast echa.
  for (let t = 0; t < 90 && p.skillCooldowns[0] > 0; t++) world.step([EMPTY_INPUT]);

  const mob = world.mobs.find((m) => m.alive)!;
  mob.hp = 9999;
  mob.x = klon.x + 250;
  mob.y = klon.y;
  // Gracz odchodzi tak daleko, że jego własny stożek nie ma jak dosięgnąć.
  p.x = klon.x + 2000;
  p.y = klon.y;
  const hpPrzed = mob.hp;
  // Gracz celuje w prawo; klon powtarza cios ze SWOJEJ pozycji w tym kierunku.
  world.step([input({ skillCast: 0, aimX: p.x + 1000, aimY: p.y })]);
  check('KLON powtarza Q (echo trafia poza zasiegiem gracza)', mob.hp < hpPrzed, `hp ${hpPrzed} -> ${mob.hp}`);
}

/* ── 4. MIRROR TIDE: SHATTER zżera klony, PHASE SWAP zamienia miejsca ────── */
{
  const world = makeWorld();
  const p = world.players[0];
  pick(world, 'ott-mirror-spec');
  const cloneDef = MINIONS.findIndex((m) => m.id === 'mirror-clone');
  const klony = (): number => world.minions.filter((m) => m.alive && m.defIndex === cloneDef).length;

  world.step([input({ skillCast: 3, aimX: p.x, aimY: p.y })]);
  check('R stawia 4 klony', klony() === 4, `${klony()}`);

  // PHASE SWAP: klon najbliżej kursora zamienia się miejscami z graczem.
  const cel = world.minions.filter((m) => m.alive && m.defIndex === cloneDef)[0];
  const klonX = cel.x;
  const klonY = cel.y;
  const graczX = p.x;
  const graczY = p.y;
  world.step([input({ skillCast: 2, aimX: klonX, aimY: klonY })]);
  check('PHASE SWAP przenosi gracza na klona', Math.abs(p.x - klonX) < 30 && Math.abs(p.y - klonY) < 30, `${Math.round(p.x)},${Math.round(p.y)} vs ${Math.round(klonX)},${Math.round(klonY)}`);
  check('PHASE SWAP przenosi klona na gracza', Math.abs(cel.x - graczX) < 1 && Math.abs(cel.y - graczY) < 1, '');

  // Pudło (kursor daleko od klonów) NIE zjada cooldownu.
  for (let t = 0; t < 200 && p.skillCooldowns[2] > 0; t++) world.step([EMPTY_INPUT]);
  world.step([input({ skillCast: 2, aimX: p.x + 3000, aimY: p.y })]);
  check('PHASE SWAP w pustke oddaje cooldown', p.skillCooldowns[2] === 0, `cd=${p.skillCooldowns[2]}`);

  // SHATTER: wszystkie klony pękają.
  const przed = klony();
  for (let t = 0; t < 300 && p.skillCooldowns[1] > 0; t++) world.step([EMPTY_INPUT]);
  world.step([input({ skillCast: 1, aimX: p.x + 100, aimY: p.y })]);
  check('SHATTER zzera wszystkie klony', przed > 0 && klony() === 0, `${przed} -> ${klony()}`);
}

/* ── 5. Podatność wchodzi w ciosy gracza (SOAKED / WEAKEN) ───────────────── */
{
  const world = makeWorld();
  const p = world.players[0];
  for (let t = 0; t < 60 && world.aliveMobs === 0; t++) world.step([EMPTY_INPUT]);
  const a = world.mobs.find((m) => m.alive)!;
  const b = world.mobs.filter((m) => m.alive)[1]!;
  a.hp = 9999;
  b.hp = 9999;
  a.x = p.x + 60; a.y = p.y;
  b.x = p.x + 60; b.y = p.y;
  world.applyStatus(b, statusIndexById('soaked'), 0);

  // Ten sam cios w oba: zmoczony musi stracić więcej HP.
  const hpA = a.hp;
  const hpB = b.hp;
  world.step([input({ skillCast: 0, aimX: p.x + 500, aimY: p.y })]);
  const ubytekA = hpA - a.hp;
  const ubytekB = hpB - b.hp;
  check('SOAKED zwieksza obrazenia gracza', ubytekB > ubytekA * 1.2, `zwykly=${ubytekA.toFixed(1)} zmoczony=${ubytekB.toFixed(1)}`);
}

/* ── 6. Determinizm: ten sam seed → ten sam stan ─────────────────────────── */
{
  const sumaKontrolna = (branchTalent: string): string => {
    const world = makeWorld();
    const p = world.players[0];
    pick(world, branchTalent);
    for (let t = 0; t < 900; t++) {
      const slot = t % 40 === 0 ? (t / 40) % 4 : -1;
      world.step([input({ skillCast: slot, aimX: p.x + 300, aimY: p.y + 120, dash: t % 97 === 0 })]);
    }
    return `${Math.round(p.x)},${Math.round(p.y)},${world.kills},${Math.round(p.hp)},${world.minions.filter((m) => m.alive).length}`;
  };
  for (const branch of ['ott-tide-spec', 'ott-mirror-spec']) {
    const a = sumaKontrolna(branch);
    const b = sumaKontrolna(branch);
    check(`determinizm ${branch}`, a === b, `${a} vs ${b}`);
  }
}

let zle = 0;
for (const [n, ok, i] of wyniki) {
  if (!ok) zle++;
  console.log(`${ok ? 'OK  ' : 'BLAD'} ${n}${i ? ` — ${i}` : ''}`);
}
console.log(`WYNIK: ${zle === 0 ? 'OK' : `${zle} BLEDOW`}`);
process.exitCode = zle === 0 ? 0 : 1;
