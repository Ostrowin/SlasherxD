import { EMPTY_INPUT, World, type Player, type SimInput } from '../src/sim/world';
import { PROGRESSION, talentSlotsFor } from '../src/sim/talentsConfig';
import { UPGRADES } from '../src/sim/wavesConfig';
import type { ItemKind } from '../src/sim/itemsConfig';
import * as C from '../src/sim/constants';

/**
 * Bot do pomiarów balansu. NIE jest to AI do gry — ma tylko grać na tyle
 * sensownie, żeby liczby coś znaczyły, i na tyle powtarzalnie, żeby dwa
 * uruchomienia bencha dały ten sam wynik.
 *
 * Zero losowości po stronie bota: wszystkie decyzje wynikają ze stanu świata.
 * Dzięki temu różnica między pomiarami to zawsze zmiana w GRZE, nigdy szum.
 */

export type Policy = 'passive' | 'active';

/** Czego bot szuka na kartach ulepszeń, od najbardziej pożądanego. */
const UPGRADE_PRIORITY: ItemKind[] = [
  'strength', 'critChance', 'attackSpeed', 'critDamage',
  'maxHp', 'armor', 'range', 'regen', 'speed', 'cooldown',
];

function nearestMob(w: World, p: Player): { dx: number; dy: number; dist: number } | null {
  let best = -1;
  let bestD2 = Infinity;
  for (let i = 0; i < w.mobs.length; i++) {
    const m = w.mobs[i];
    if (!m.alive) continue;
    const dx = m.x - p.x;
    const dy = m.y - p.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestD2) {
      bestD2 = d2;
      best = i;
    }
  }
  if (best < 0) return null;
  const m = w.mobs[best];
  return { dx: m.x - p.x, dy: m.y - p.y, dist: Math.sqrt(bestD2) };
}

/** Pierwszy talent, który bot może teraz kupić (specjalizacja ma pierwszeństwo). */
function greedyTalentPick(w: World, p: Player): number {
  if (p.talentPoints <= 0) return -1;
  const slots = talentSlotsFor(p.cls.id);

  if (p.specIndex < 0) {
    if (p.level < PROGRESSION.specLevel) return -1;
    // Zawsze pierwsza zaprojektowana gałąź — bench ma mierzyć grę, nie wybory.
    return slots.findIndex((s) => s.isSpec && s.branchIndex === 0);
  }
  return slots.findIndex(
    (s, i) =>
      !s.isSpec &&
      s.branchIndex === p.specIndex &&
      p.talentRanks[i] < s.def.maxRank &&
      p.spentPerBranch[s.branchIndex] >= s.requiresInBranch,
  );
}

function bestUpgrade(p: Player): number {
  if (p.hasPickedThisBreak || p.upgradeChoices.length === 0) return -1;
  for (const kind of UPGRADE_PRIORITY) {
    const i = p.upgradeChoices.findIndex((defIndex) => UPGRADES[defIndex].kind === kind);
    if (i >= 0) return i;
  }
  return 0;
}

export function botInput(w: World, p: Player, policy: Policy): SimInput {
  const input: SimInput = { ...EMPTY_INPUT };
  input.upgradePick = bestUpgrade(p);
  input.talentPick = greedyTalentPick(w, p);

  // Pasywny bot: stoi i nic nie robi. To jest podłoga trudności —
  // jeśli TAKI bot wygrywa, gra jest zepsuta (patrz playtest 2026-07-19).
  if (policy === 'passive') return input;

  const near = nearestMob(w, p);
  if (!near) {
    input.targetX = C.WORLD_W / 2;
    input.targetY = C.WORLD_H / 2;
    input.hasTarget = true;
    return input;
  }

  const ux = near.dist > 0.001 ? near.dx / near.dist : 1;
  const uy = near.dist > 0.001 ? near.dy / near.dist : 0;

  // Celujemy zawsze w najbliższego; symulacja sama odpali skill, gdy gotowy.
  input.aimX = p.x + ux * 400;
  input.aimY = p.y + uy * 400;
  // Bot używa wyłącznie slotu Q i tylko dla ciosów — przywołania wymagają
  // innej taktyki (stawiania w dobrym miejscu), której nie modeluje.
  const q = w.skillOf(p, 0);
  input.skillCast = q?.kind === 'cone' && near.dist <= w.skillRangeOf(p) ? 0 : -1;

  // Za blisko — uciekamy (kiting). Dalej — podchodzimy do zasięgu zwarcia.
  const danger = 150;
  if (near.dist < danger) {
    input.targetX = p.x - ux * 500;
    input.targetY = p.y - uy * 500;
    // Doskok w tył ratuje z otoczenia; to jego główne zastosowanie.
    input.dash = p.dashCooldown <= 0;
    input.aimX = p.x - ux * 400;
    input.aimY = p.y - uy * 400;
    input.skillCast = -1;
  } else {
    input.targetX = p.x + ux * (near.dist - w.meleeRangeOf(p) * 0.6);
    input.targetY = p.y + uy * (near.dist - w.meleeRangeOf(p) * 0.6);
  }
  input.targetX = Math.min(Math.max(input.targetX, 20), C.WORLD_W - 20);
  input.targetY = Math.min(Math.max(input.targetY, 20), C.WORLD_H - 20);
  input.hasTarget = true;
  return input;
}
