import { World, EMPTY_INPUT } from '../src/sim/world';
import { classById } from '../src/sim/classes';
import { BOSSES } from '../src/sim/bosses';

/**
 * REGRESJA 2026-07-20: zawieszenie przy zabiciu bossa.
 *
 * Boss ginie → jego slot w poolu mobków zwalnia się → spawner oddaje ten sam
 * slot nowemu wrogowi. Dopóki `bossMobIndex` wskazywał stary slot, świat brał
 * przypadkowego aliena za bossa: `BOSSES[-1]` wywalało render w każdej klatce,
 * a `endWave()` nigdy nie odpalało, więc fala trwała w nieskończoność.
 *
 * Test wymusza NAJGORSZY przypadek: natychmiastowe przejęcie slotu po śmierci.
 */
const wyniki: [string, boolean, string][] = [];
const check = (n: string, ok: boolean, i = ''): void => {
  wyniki.push([n, ok, i]);
};

const world = new World(4242, [classById('hare')!], [[]]);
const p = world.players[0];

// Skaczemy na falę z Void Wardenem i czekamy, aż boss stanie na arenie.
world.wave = 5;
for (let t = 0; t < 200 && !world.boss; t++) {
  p.hp = p.cls.maxHp;
  p.dead = false;
  world.step([EMPTY_INPUT]);
}
const boss = world.boss;
check('boss sie pojawil', !!boss, boss ? `hp ${Math.round(boss.hp)}` : 'brak');

const slotBossa = world.bossMobIndex;
check('bossMobIndex ustawiony', slotBossa >= 0, `${slotBossa}`);

// Zabijamy bossa.
if (boss) boss.hp = 1;
for (let t = 0; t < 60 && world.boss; t++) {
  p.hp = p.cls.maxHp;
  p.dead = false;
  const b = world.boss;
  if (b) {
    p.x = b.x - 50;
    p.y = b.y;
  }
  world.step([EMPTY_INPUT]);
}
check('boss zginal', !world.boss);
check('bossDefeated ustawione', world.bossDefeated);
check('bossMobIndex WYCZYSZCZONY', world.bossMobIndex < 0, `${world.bossMobIndex}`);
check('fala sie zakonczyla', world.phase === 'break', world.phase);

// Najgorszy przypadek: wskrzeszamy slot po bossie jako zwykłego wroga.
const slot = world.mobs[slotBossa];
slot.alive = true;
slot.defIndex = 0;
check('slot po bossie NIE udaje bossa', world.boss === null);
check('bossDef bezpieczne', world.bossDef === null);
check('indeks bossa nie wskazuje na BOSSES[-1]', BOSSES[slot.bossIndex] === undefined);

// Fala musi ruszyć dalej, a nie utknąć.
for (let t = 0; t < 400; t++) world.step([{ ...EMPTY_INPUT, upgradePick: 0 }]);
check('gra idzie dalej po bossie', world.wave > 5, `fala ${world.wave}, faza ${world.phase}`);
check('boss NIE zostal przyzwany ponownie', world.wave !== 5 || !world.boss);

for (const [n, ok, i] of wyniki) console.log(`${ok ? 'OK  ' : 'BLAD'} ${n}${i ? ` (${i})` : ''}`);
const all = wyniki.every((r) => r[1]);
console.log(all ? 'WYNIK: OK' : `WYNIK: BLAD (${wyniki.filter((r) => !r[1]).length})`);
if (!all) process.exitCode = 1;
