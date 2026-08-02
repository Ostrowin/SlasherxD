import { EMPTY_INPUT, World, type Player, type SimInput } from '../src/sim/world';
import { PROGRESSION, talentSlotsFor } from '../src/sim/talentsConfig';
import { UPGRADES } from '../src/sim/wavesConfig';
import { COMBOS } from '../src/sim/comboConfig';
import { minionById, minionEffectRadius } from '../src/sim/minionsConfig';
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

/**
 * Pierwszy talent, który bot może teraz kupić (specjalizacja ma pierwszeństwo).
 *
 * `branch` mówi, KTÓRĄ gałąź bot ma zagrać. Wcześniej było to zaszyte na 0,
 * więc gałęzie 1 i 2 nie były mierzone ani razu — a to właśnie w nich siedzi
 * połowa zaprojektowanej treści.
 */
function greedyTalentPick(w: World, p: Player, branch: number): number {
  if (p.talentPoints <= 0) return -1;
  const slots = talentSlotsFor(p.cls.id);

  if (p.specIndex < 0) {
    if (p.level < PROGRESSION.specLevel) return -1;
    const wanted = slots.findIndex((s) => s.isSpec && s.branchIndex === branch);
    // Gałąź niezaprojektowana (`comingSoon`) nie ma rzędu specjalizacji.
    // Wtedy wracamy do gałęzi 0, żeby run w ogóle ruszył.
    return wanted >= 0 ? wanted : slots.findIndex((s) => s.isSpec && s.branchIndex === 0);
  }
  return slots.findIndex(
    (s, i) =>
      !s.isSpec &&
      s.branchIndex === p.specIndex &&
      p.talentRanks[i] < s.def.maxRank &&
      p.spentPerBranch[s.branchIndex] >= s.requiresInBranch,
  );
}

/**
 * Gdzie postawić pole albo totem.
 *
 * Nie jest to zwykły środek ciężkości wrogów w zasięgu — taki przy DUŻYM
 * zasięgu wypada w pustce pomiędzy rozproszonymi grupami (widać to było
 * wprost w pomiarze, gdy niedźwiedź dostał dalsze zasięgi i zaczął stawiać
 * pola w polu, nie w tłumie).
 *
 * Zamiast tego: kotwiczymy na NAJBLIŻSZYM wrogu w zasięgu stawiania, a potem
 * uśredniamy tylko jego SĄSIADÓW mieszczących się w promieniu efektu. Punkt
 * zawsze ląduje w realnym skupisku.
 */
function clusterPoint(
  w: World, p: Player, range: number, effect: number,
): { x: number; y: number } | null {
  let ax = 0;
  let ay = 0;
  let bestD2 = range * range;
  let found = false;
  for (let i = 0; i < w.mobs.length; i++) {
    const m = w.mobs[i];
    if (!m.alive) continue;
    const dx = m.x - p.x;
    const dy = m.y - p.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > bestD2) continue;
    bestD2 = d2;
    ax = m.x;
    ay = m.y;
    found = true;
  }
  if (!found) return null;
  if (effect <= 0) return { x: ax, y: ay };

  let sx = 0;
  let sy = 0;
  let n = 0;
  const e2 = effect * effect;
  for (let i = 0; i < w.mobs.length; i++) {
    const m = w.mobs[i];
    if (!m.alive) continue;
    const dx = m.x - ax;
    const dy = m.y - ay;
    if (dx * dx + dy * dy > e2) continue;
    sx += m.x;
    sy += m.y;
    n++;
  }
  return n === 0 ? { x: ax, y: ay } : { x: sx / n, y: sy / n };
}

/** Czy bufor combo jest początkiem tej sekwencji. */
function isPrefix(buffer: number[], sequence: number[]): boolean {
  if (buffer.length >= sequence.length) return false;
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] !== sequence[i]) return false;
  }
  return true;
}

/**
 * COMBO (Thunder Fang wilka). Bot nie potrzebuje własnej pamięci: `p.comboSeq`
 * mówi, co już wcisnął, więc wystarczy dopisać kolejny klawisz.
 *
 * KLUCZOWE: wybieramy wyłącznie sekwencje, których bufor jest początkiem —
 * dzięki temu bot nigdy nie zabrnie w ślepy zaułek (`q→w` i próba `e→…`),
 * po którym musiałby czekać 2,5 s na wygaśnięcie bufora.
 */
function comboCast(w: World, p: Player, input: SimInput, danger: boolean): boolean {
  if (p.comboIds.length === 0) return false;

  let best = -1;
  let bestScore = -1;
  for (let i = 0; i < COMBOS.length; i++) {
    const combo = COMBOS[i];
    if (!p.comboIds.includes(combo.id)) continue;
    if (p.comboCooldowns[i] > 0) continue;
    if (!isPrefix(p.comboSeq, combo.sequence)) continue;

    // Priorytety sytuacyjne; przy remisie wygrywa niższy indeks, więc
    // wybór jest w pełni deterministyczny.
    const effect = combo.effect.kind;
    const score = danger
      ? (effect === 'dash' ? 3 : effect === 'field' ? 2 : 1)
      : (effect === 'armChain' ? 3 : effect === 'field' ? 2 : 1);
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  if (best < 0) return false;

  input.skillCast = COMBOS[best].sequence[p.comboSeq.length];
  return true;
}

/**
 * Wybór i wycelowanie umiejętności. Wcześniej bot obsługiwał WYŁĄCZNIE
 * stożek w slocie 0, przez co nie używał pól, pułapek, portali, strzał,
 * przywołań ani doskoków bojowych — czyli większości zaprojektowanej treści.
 */
function skillCast(
  w: World, p: Player, input: SimInput,
  near: { dx: number; dy: number; dist: number }, danger: boolean, escaping: boolean,
): void {
  const ux = near.dist > 0.001 ? near.dx / near.dist : 1;
  const uy = near.dist > 0.001 ? near.dy / near.dist : 0;
  const atNearest = (): void => {
    input.aimX = p.x + ux * Math.max(near.dist, 40);
    input.aimY = p.y + uy * Math.max(near.dist, 40);
  };

  /*
   * Wybór slotu: ROTACJA po gotowych, nie ranking.
   *
   * Dwie oczywiste heurystyki zawiodły i obie na tej samej zasadzie —
   * zagładzały któryś slot:
   *  - „pierwszy gotowy wygrywa": `Q` z krótkim cooldownem jest gotowe prawie
   *    zawsze, więc `E` przywołujące wilki nie szło niemal nigdy (ALPHA PACK
   *    stoi na ich liczbie);
   *  - „najdłuższy cooldown wygrywa": zagładzało TANIE skille będące silnikiem
   *    buildu — skok zająca zeruje cooldown doskoku, a przegrywał z nową,
   *    rzadszą, ale gorszą umiejętnością (527 → 95 zabójstw w pomiarze).
   *
   * Rotacja po numerze ticku daje każdej gotowej umiejętności czas antenowy,
   * jest w pełni deterministyczna i nie wymaga zgadywania wag.
   */
  const gotowe: number[] = [];
  for (let slot = 0; slot < p.skillIds.length; slot++) {
    if (p.skillCooldowns[slot] > 0) continue;
    const def = w.skillOf(p, slot);
    if (!def) continue;

    // Celownik jest zajęty przez doskok TYLKO w ticku, w którym doskok
    // faktycznie leci (patrz `botInput`). Wcześniej blokowałem go przy każdym
    // zbliżeniu wroga, przez co umiejętności o zasięgu KRÓTSZYM niż próg
    // ucieczki nie mogły wypalić nigdy — Swipe wilka ma 144 px przy progu 150.
    const needsAim =
      def.kind === 'cone' || def.kind === 'projectile' ||
      def.kind === 'summon' || def.kind === 'leap';
    if (needsAim && escaping) continue;

    let ok = true;
    switch (def.kind) {
      case 'cone': ok = near.dist <= w.skillRangeOf(p, slot); break;
      case 'projectile': ok = near.dist <= 620; break;
      case 'summon': {
        // Jednostki RUCHOME (wilki, wskrzeszeni) same znajdą sobie wrogów,
        // więc stawiamy je zawsze. Nieruchome pola i totemy mają sens tylko
        // tam, gdzie ktoś stoi — inaczej marnują cooldown.
        const md = minionById(def.minionId);
        ok = md?.movement !== 'static' ||
          clusterPoint(w, p, def.placeRange, md ? minionEffectRadius(md) : 0) !== null;
        break;
      }
      case 'aura':
      case 'empower': ok = near.dist <= 420; break;
      case 'timestop': ok = danger; break;
      case 'leap': ok = near.dist >= 120 && near.dist <= 520; break;
      case 'blink': ok = p.blinkTicks > 0 || danger; break;
    }
    if (!ok) continue;
    gotowe.push(slot);
  }
  if (gotowe.length === 0) return;
  const bestSlot = gotowe[w.tick % gotowe.length];

  // Wybrany slot już PRZESZEDŁ warunki wyżej — tutaj zostaje samo celowanie.
  const def = w.skillOf(p, bestSlot)!;
  switch (def.kind) {
    case 'cone':
    case 'projectile':
    case 'leap':
      atNearest();
      break;

    case 'summon': {
      const md = minionById(def.minionId);
      const spot = clusterPoint(w, p, def.placeRange, md ? minionEffectRadius(md) : 0);
      if (spot) {
        input.aimX = spot.x;
        input.aimY = spot.y;
      }
      break;
    }

    case 'blink':
      // Cast dwuetapowy: gdy strzała już leci, drugie wciśnięcie skacze
      // i celownik nie ma znaczenia. Pierwsze strzela OD wrogów — dla bota
      // blink jest ucieczką, nie wejściem.
      if (p.blinkTicks <= 0) {
        input.aimX = p.x - ux * def.range;
        input.aimY = p.y - uy * def.range;
      }
      break;

    // `aura`, `empower` i `timestop` działają na graczu — celownik nieistotny.
    default:
      break;
  }

  input.skillCast = bestSlot;
}

function bestUpgrade(p: Player): number {
  if (p.hasPickedThisBreak || p.upgradeChoices.length === 0) return -1;
  for (const kind of UPGRADE_PRIORITY) {
    const i = p.upgradeChoices.findIndex((defIndex) => UPGRADES[defIndex].kind === kind);
    if (i >= 0) return i;
  }
  return 0;
}

export function botInput(w: World, p: Player, policy: Policy, branch = 0): SimInput {
  const input: SimInput = { ...EMPTY_INPUT };
  input.upgradePick = bestUpgrade(p);
  input.talentPick = greedyTalentPick(w, p, branch);

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

  // Celujemy domyślnie w najbliższego; `skillCast` może to nadpisać, jeśli
  // konkretna umiejętność chce celować gdzie indziej (pole w tłum, blink w tył).
  input.aimX = p.x + ux * 400;
  input.aimY = p.y + uy * 400;

  // Za blisko — uciekamy (kiting). Dalej — podchodzimy do zasięgu zwarcia.
  const danger = near.dist < 150;
  // Celownik przejmuje doskok TYLKO wtedy, gdy naprawdę leci.
  const escaping = danger && p.dashCooldown <= 0;
  if (danger) {
    input.targetX = p.x - ux * 500;
    input.targetY = p.y - uy * 500;
    // Doskok w tył ratuje z otoczenia; to jego główne zastosowanie.
    input.dash = escaping;
    // KIERUNEK DOSKOKU BIERZE SIĘ Z `aimX/aimY` (patrz `stepDash` w world.ts),
    // czyli z tego samego pola co celownik umiejętności. W ticku doskoku
    // celownik MUSI więc wskazywać OD wrogów — inaczej doskok ratunkowy
    // wystrzeliwuje bota w środek hordy. Kosztowało to średnio 1,4 fali,
    // zanim wyszło z pomiaru.
    if (escaping) {
      input.aimX = p.x - ux * 400;
      input.aimY = p.y - uy * 400;
    }
  } else {
    input.targetX = p.x + ux * (near.dist - w.meleeRangeOf(p) * 0.6);
    input.targetY = p.y + uy * (near.dist - w.meleeRangeOf(p) * 0.6);
  }

  // Combo mają pierwszeństwo: klasa, która je ma, NIE ma umiejętności
  // w slotach, więc zwykła ścieżka i tak nic by nie znalazła.
  if (!comboCast(w, p, input, danger)) skillCast(w, p, input, near, danger, escaping);
  input.targetX = Math.min(Math.max(input.targetX, 20), C.WORLD_W - 20);
  input.targetY = Math.min(Math.max(input.targetY, 20), C.WORLD_H - 20);
  input.hasTarget = true;
  return input;
}
