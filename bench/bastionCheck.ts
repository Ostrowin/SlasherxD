import { World, EMPTY_INPUT, type SimInput } from '../src/sim/world';
import { classById } from '../src/sim/classes';
import { talentSlotsFor } from '../src/sim/talentsConfig';
import { MINIONS, minionById } from '../src/sim/minionsConfig';

/** TESTY JEŻA — BASTION (builder: jeden skalujący turret + mury). */
const wyniki: [string, boolean, string][] = [];
const check = (n: string, ok: boolean, i = ''): void => { wyniki.push([n, ok, i]); };
const input = (o: Partial<SimInput>): SimInput => ({ ...EMPTY_INPUT, ...o });
const makeWorld = (): World => new World(909, [classById('hedgehog')!], [[]]);
const TURRET = MINIONS.indexOf(minionById('bastion-turret')!);
const turrets = (w: World) => w.minions.filter((mi) => mi.alive && mi.defIndex === TURRET);

function spec(w: World): void {
  const slots = talentSlotsFor('hedgehog');
  const index = slots.findIndex((s) => s.def.id === 'hog-bastion-spec');
  const p = w.players[0];
  p.level = 25; p.talentPoints++;
  w.step([input({ talentPick: index })]);
}
/** Wypuszcza turret w punkt; zeruje cooldown, by dało się relokować od razu. */
function deploy(w: World, x: number, y: number): void {
  const p = w.players[0];
  p.skillCooldowns[0] = 0;
  w.step([input({ skillCast: 0, aimX: x, aimY: y })]);
}
/** Pierwszy żywy pocisk sojuszniczy (bolt turreta), null gdy brak. */
function firstBolt(w: World) {
  return w.projectiles.find((pr) => pr.alive && pr.friendly) ?? null;
}

/* ── 1. Speck + obsada slotów ────────────────────────────────────────────── */
{
  const w = makeWorld();
  const p = w.players[0];
  spec(w);
  check('BASTION obsadza 4 sloty',
    p.skillIds.join(',') === 'deploy-sentry,spike-wall,overclock,lockdown', p.skillIds.join(','));
}

/* ── 2. Jeden turret + relokacja (nigdy dwa) ─────────────────────────────── */
{
  const w = makeWorld();
  const p = w.players[0];
  spec(w);
  deploy(w, p.x + 150, p.y);
  check('DEPLOY stawia dokładnie jeden turret', turrets(w).length === 1, `${turrets(w).length}`);
  const t = turrets(w)[0];
  const firstX = t.x;
  deploy(w, p.x - 150, p.y); // relokacja
  check('ponowny DEPLOY NIE tworzy drugiego', turrets(w).length === 1, `${turrets(w).length}`);
  check('turret został PRZENIESIONY', Math.abs(turrets(w)[0].x - firstX) > 100,
    `${firstX.toFixed(0)} -> ${turrets(w)[0].x.toFixed(0)}`);
}

/* ── 3. DPS turreta skaluje się OBRAŻENIAMI gracza ───────────────────────── */
function boltDamageWith(damageMult: number): number {
  const w = makeWorld();
  const p = w.players[0];
  spec(w);
  p.damageMult = damageMult;
  deploy(w, p.x + 150, p.y);
  const m = w.mobs.find((mm) => !mm.alive)!; // ożyw jednego ręcznie w zasięgu, daleko od gracza
  m.alive = true; m.defIndex = 0; m.hp = 1e9; m.speed = 0;
  m.x = p.x + 150 + 380; m.y = p.y; // 380 px od turreta (w locie, więc pocisk istnieje)
  for (let t = 0; t < 30 && !firstBolt(w); t++) w.step([EMPTY_INPUT]);
  return firstBolt(w)?.damage ?? -1;
}
{
  const base = boltDamageWith(1);
  const buff = boltDamageWith(5);
  check('bolt turreta istnieje', base > 0, `dmg=${base}`);
  check('×5 obrażeń gracza ≈ ×5 dmg bolta', buff > base * 3, `${base} -> ${buff}`);
}

/* ── 4. DPS turreta skaluje się PRĘDKOŚCIĄ ATAKU gracza ──────────────────── */
function turretDamageOver(ticks: number, attackSpeedMult: number): number {
  const w = makeWorld();
  const p = w.players[0];
  spec(w);
  p.attackSpeedMult = attackSpeedMult;
  deploy(w, p.x + 300, p.y);
  const m = w.mobs.find((mm) => !mm.alive)!;
  m.alive = true; m.defIndex = 0; m.hp = 1e9; m.speed = 0;
  m.x = p.x + 300 + 30; m.y = p.y; // tuż przy turrecie, poza zasięgiem gracza
  for (let t = 0; t < ticks; t++) w.step([EMPTY_INPUT]);
  return 1e9 - m.hp;
}
{
  const slow = turretDamageOver(90, 1);
  const fast = turretDamageOver(90, 3);
  check('turret w ogóle strzela', slow > 0, `dmg=${slow.toFixed(0)}`);
  check('×3 atak speed ≈ ×3 więcej strzałów', fast > slow * 2, `${slow.toFixed(0)} -> ${fast.toFixed(0)}`);
}

/* ── 5. OVERCHARGE: bolt turreta zaczyna odbijać ─────────────────────────── */
{
  const w = makeWorld();
  const p = w.players[0];
  spec(w);
  p.turretBoltChains = 3; // to nadaje talent OVERCHARGE (grantsTurretChains)
  deploy(w, p.x + 150, p.y);
  const m = w.mobs.find((mm) => !mm.alive)!;
  m.alive = true; m.defIndex = 0; m.hp = 1e9; m.speed = 0;
  m.x = p.x + 150 + 380; m.y = p.y;
  for (let t = 0; t < 30 && !firstBolt(w); t++) w.step([EMPTY_INPUT]);
  check('bolt po OVERCHARGE ma odbicia', (firstBolt(w)?.chainsLeft ?? 0) === 3,
    `chains=${firstBolt(w)?.chainsLeft}`);
}

/* ── Wynik ──────────────────────────────────────────────────────────────── */
let ok = true;
for (const [n, pass, i] of wyniki) {
  console.log(`${pass ? 'OK  ' : 'FAIL'} ${n}${i ? ' — ' + i : ''}`);
  if (!pass) ok = false;
}
console.log(`WYNIK: ${ok ? 'OK' : 'FAIL'}`);
