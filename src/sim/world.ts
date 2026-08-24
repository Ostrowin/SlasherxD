import { Rng } from './rng';
import { SpatialHash } from './spatialHash';
import { type ClassDef } from './classes';
import { CONTACT_CONFIG, ENEMIES, type EnemyDef } from './enemies';
import { DROP_CONFIG, ITEM_CAPS, ITEMS, type ItemKind } from './itemsConfig';
import {
  BAG_CAP, EQUIP_SLOTS, LEGENDARY_RARITY, OFFHAND_SLOT_INDEX, WEAPON_SLOT_INDEX,
  GEAR_AFFIX_RANGE, GEAR_DROP, GEAR_SLOT_TYPES, GOLD_PER_BOSS, GOLD_PER_KILL,
  GEAR_PRICE_MULT, RARITIES, SELL_VALUE, SHOP_REROLL_COST, SHOP_SIZE, UPGRADE_PRICE,
  SLOT_AFFIX_POOL,
  acceptsPiece, blocksOffhand, emptyGearFold, equipSlotType, legendariesFor,
  type GearAffix, type GearFold, type GearPiece, type GearRarity,
  type GearSlotType, type RarityDef,
} from './gearConfig';
import { UPGRADES, WAVE_CONFIG, WAVE_DURATION_TICKS, type UpgradeDef } from './wavesConfig';
import { DEFAULT_MAP_ID, mapById } from './maps';
import { BOSSES, bossById, type BossAttack, type BossDef } from './bosses';
import type { MetaEffectKind } from './metaConfig';
import {
  dashById, DEFAULT_SKILL_ID, skillById,
  type DashDef, type SkillDef, type SummonSkill, type ProjectileSkill,
  type BlinkSkill, type PhaseSwapSkill,
  type HookSkill, type TauntSkill, type ChannelSkill, type WallSkill,
  type DetonateSkill,
} from './skillsConfig';
import {
  MINION_POOL_SIZE, MINIONS, minionById, type MinionDef,
} from './minionsConfig';
import { COMBOS, COMBO_BUFFER, COMBO_WINDOW_TICKS } from './comboConfig';
import {
  AURAS, MOB_STATUS_SLOTS, STATUSES, auraById, statusIndexById,
} from './statusConfig';
import {
  ALPHA_PACK, branchesFor, PROGRESSION, talentSlotsFor, xpForLevel, xpPerWaveCleared,
} from './talentsConfig';
import * as C from './constants';

/** Indeksy statusów używane przez legendarki — policzone raz (findIndex nie w pętli). */
const STATUS_GRAVITY_DRAG = statusIndexById('gravity-drag');
const STATUS_STUN = statusIndexById('stun');

/*
 *  ARCHITEKTURA (fundament pod co-op 1-8 graczy):
 *
 *   inputy WSZYSTKICH graczy ──► World.step(inputs[])  (stały tick 30/s)
 *                                      │
 *                                      ▼
 *                             stan świata (gracze, mobki, tick)
 *                                      │
 *                                      ▼
 *                   GameScene (Phaser) tylko RYSUJE stan + interpoluje
 *
 *  Reguły tego katalogu (src/sim):
 *   - zero importów z Phasera, zero DOM, zero Date.now(), zero localStorage
 *   - losowość wyłącznie przez this.rng
 *   - jedyne wejście danych z zewnątrz to argumenty konstruktora i tablica
 *     SimInput w step()
 *
 *  Lockstep: każdy klient liczy IDENTYCZNĄ symulację z tych samych inputów.
 *  Po sieci lecą wyłącznie inputy graczy (kilkadziesiąt bajtów na tick),
 *  nigdy pozycje mobków — dlatego 400 wrogów kosztuje w sieci dokładnie tyle
 *  samo co zero.
 */

/** Wejście jednego gracza na jeden tick. Jedyna droga danych do symulacji. */
export interface SimInput {
  /**
   * Sterowanie ruchem — wyłącznie mysz (Dota/LoL-style): cel ruchu we
   * współrzędnych ŚWIATA. hasTarget=true w ticku, w którym RMB jest wciśnięty
   * (klik = jeden tick z celem, trzymanie = cel aktualizowany co tick).
   * Cel jest trwały w stanie symulacji — postać idzie do niego sama.
   */
  targetX: number;
  targetY: number;
  hasTarget: boolean;
  /**
   * Power Slash z celowaniem: attack=true w ticku zatwierdzenia ciosu
   * (LMB po spacji); aimX/aimY = punkt świata, w którego KIERUNKU idzie cios.
   * Tryb celowania to stan UI (render), nie symulacji.
   */
  /**
   * Który slot umiejętności odpalić w tym ticku: 0=Q, 1=W, 2=E, -1 = żaden.
   * Numer slotu zamiast flagi, bo klas z trzema skillami będzie coraz więcej
   * (dzik-inżynier stawia trzy różne totemy).
   */
  skillCast: number;
  aimX: number;
  aimY: number;
  /**
   * Doskok (spacja) — kierunek bierzemy z `aimX/aimY`, czyli spod kursora.
   * Osobne pole, bo dash ma własny cooldown niezależny od skilla.
   */
  dash: boolean;
  /** Dev-helper (klawisz M): natychmiastowy spawn 50 mobków do testu wydajności. */
  debugSpawn: boolean;
  /**
   * Wybór ulepszenia w przerwie: indeks w `upgradeChoices` gracza (0..n-1)
   * albo -1 gdy jeszcze nie wybrał. Przerwa trwa, aż zdecydują WSZYSCY żywi.
   */
  upgradePick: number;
  /**
   * Zakup rangi talentu: indeks w `talentSlotsFor(klasa)` albo -1.
   * Idzie przez input, a nie przez wywołanie metody z UI, bo w co-opie każdy
   * klient musi wydać ten sam punkt w tym samym ticku — inaczej symulacje
   * rozjadą się o statystyki gracza.
   */
  talentPick: number;
  /**
   * KOMENDY EKWIPUNKU (obsługiwane TYLKO w przerwie, `stepBreak`). Jak `talentPick`
   * — idą przez input, nie przez metodę z UI, bo w co-opie każdy klient musi wykonać
   * ten sam ruch w tym samym ticku, inaczej gear (a więc staty) się rozjedzie.
   * Wszystkie jednorazowe: -1 = brak. UI wysyła jedną akcję na interakcję.
   */
  /** Indeks części w plecaku do ZAŁOŻENIA (-1 = brak). */
  equipFromBag: number;
  /** Docelowa pozycja ekwipunku dla `equipFromBag` (-1 = auto: pierwszy pasujący slot). */
  equipToSlot: number;
  /** Pozycja ekwipunku do ZDJĘCIA (do plecaka; -1 = brak). */
  unequipSlot: number;
  /** Indeks części w plecaku do SPRZEDAŻY (-1 = brak). */
  dropBag: number;
  /** Indeks pozycji sklepu do KUPIENIA (-1 = brak). Tylko w przerwie. */
  shopBuy: number;
  /** Reroll oferty sklepu za złoto (tylko w przerwie). */
  shopReroll: boolean;
}

/** Pusty input — dla graczy, których dane jeszcze nie dotarły albo którzy padli. */
export const EMPTY_INPUT: SimInput = {
  targetX: 0, targetY: 0, hasTarget: false,
  skillCast: -1, aimX: 0, aimY: 0,
  dash: false, debugSpawn: false, upgradePick: -1, talentPick: -1,
  equipFromBag: -1, equipToSlot: -1, unequipSlot: -1, dropBag: -1,
  shopBuy: -1, shopReroll: false,
};

/**
 * Kopia wejścia z wyzerowanymi polami JEDNORAZOWYMI.
 *
 * Render pracuje w FPS przeglądarki, a symulacja w stałych tickach, więc
 * w jednej klatce może zmieścić się kilka ticków. Bez tego jedno kliknięcie
 * w talent albo jedno wciśnięcie klawisza zostałoby policzone dwa razy.
 */
export function withoutOneShots(input: SimInput): SimInput {
  return {
    ...input, skillCast: -1, dash: false, upgradePick: -1, talentPick: -1,
    equipFromBag: -1, equipToSlot: -1, unequipSlot: -1, dropBag: -1,
    shopBuy: -1, shopReroll: false,
  };
}

/** Faza runu — maszyna stanów struktury rozgrywki. */
export type Phase = 'wave' | 'break' | 'victory';

/**
 * Trwały bonus z meta-progresji, nakładany na starcie runu.
 * Przekazywany jawnie do konstruktora — w co-opie każdy gracz ma własny
 * zestaw, więc musi trafić do symulacji jako dane wejściowe (rozsyłane przy
 * starcie sesji), a nie być czytany z localStorage w środku.
 */
export interface MetaBonus {
  kind: MetaEffectKind;
  value: number;
}

/** Okrągła przeszkoda terenu — blokuje graczy, mobki i pociski. */
export interface Obstacle {
  x: number;
  y: number;
  r: number;
}

/**
 * Jeden status wiszący na wrogu (trucizna, spowolnienie…).
 * Slotów jest stała liczba i są prealokowane — zero alokacji w trakcie gry.
 */
export interface MobStatus {
  /** Indeks w STATUSES; -1 = slot pusty. */
  defIndex: number;
  ticksLeft: number;
  stacks: number;
  /** Ticki do następnego tyknięcia. */
  tickIn: number;
  /** Kto nałożył — jemu zaliczamy zabójstwo i to jego talenty skalują. */
  ownerIndex: number;
}

export interface Mob {
  alive: boolean;
  /** Indeks w ENEMIES — typ najeźdźcy. */
  defIndex: number;
  x: number;
  y: number;
  /** Pozycja z poprzedniego ticka — do interpolacji w renderze. */
  prevX: number;
  prevY: number;
  hp: number;
  /** HP przy spawnie = maksimum. Do ułamka życia (egzekucja hieny, paski HP). */
  maxHp: number;
  speed: number;
  /**
   * Id ostatniego łańcucha, który trafił tego wroga. Odbicie pomija cele
   * z własnym znacznikiem, więc pocisk NIGDY nie wraca na już trafionego.
   *
   * Bez tego łańcuch przy równo rozstawionej hordzie odbija się w tył i
   * marnuje przeskoki na dwóch wrogach zamiast rozejść się dalej — wyłapane
   * testem, nie teorią. Id rośnie monotonicznie, więc stary znacznik nigdy
   * nie zrówna się z nowym i nie trzeba go czyścić przy respawnie.
   */
  chainMark: number;
  /** Ticki do następnego ataku (strzał maga / młot Brute'a). */
  attackCooldown: number;
  /** Tick ostatniego otrzymanego ciosu — render robi z tego biały hit-flash. */
  lastHitTick: number;
  /**
   * Stan wroga z telegrafem:
   *  chase   — biegnie do najbliższego gracza
   *  windup  — zamach/ładowanie, stoi w miejscu (czas na ucieczkę)
   *  recover — po ataku, bezbronny (okno na kontrę)
   */
  state: 'chase' | 'windup' | 'recover' | 'charging';
  stateTicks: number;
  windupStartTick: number;
  lastSlamTick: number;
  /** Indeks gracza, na którego wróg aktualnie poluje. */
  targetPlayer: number;
  /**
   * PROWOKACJA (`TauntSkill`). Dopóki `tauntUntilTick > tick`, wróg jest
   * zmuszony atakować gracza `tauntedBy`, ignorując to, kto stoi bliżej.
   * Trzymamy ABSOLUTNY tick (nie licznik), żeby recyklowany slot poola nie
   * odziedziczył cudzej prowokacji — ten sam wzorzec co `chainMark`/`lastHitTick`.
   */
  tauntUntilTick: number;
  tauntedBy: number;

  /** Indeks w BOSSES (-1 = zwykły wróg). Boss to po prostu wyróżniony mob, */
  /** dzięki czemu cała istniejąca logika trafień działa dla niego za darmo. */
  bossIndex: number;
  /** Faza walki i miejsce w cyklu ataków (tylko boss). */
  phaseIndex: number;
  attackIndex: number;
  /** Statusy wiszące na wrogu — stała liczba slotów (statusConfig.ts). */
  statuses: MobStatus[];

  /** Prędkość szarży (tylko w stanie 'charging'). */
  chargeVX: number;
  chargeVY: number;
  /** Promień i obrażenia trwającej szarży. */
  chargeRadius: number;
  chargeDamage: number;
}

/**
 * Sojusznicza jednostka: totem, wskrzeszony wróg, przywołaniec.
 * Definicję zachowania trzyma `MinionDef` — tu jest tylko stan.
 */
export interface Minion {
  alive: boolean;
  /** Indeks w MINIONS. */
  defIndex: number;
  /** Indeks gracza-właściciela (dla nagród za zabójstwa). */
  ownerIndex: number;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  hp: number;
  maxHp: number;
  /** Ticki do zniknięcia; -1 = do końca fali. */
  ttl: number;
  attackCooldown: number;
  state: 'idle' | 'windup' | 'recover';
  stateTicks: number;
  attackIndex: number;
  spawnTick: number;
  /**
   * Ile ataków jednostce jeszcze zostało (`MinionDef.charges`).
   * 0 = bez limitu — zwykła wieżyczka nie liczy ładunków.
   */
  chargesLeft: number;
  /* ── Komenda gracza (`MinionDef.command`) ───────────────────────────── */
  /** Ticki wykonywania komendy; 0 = działa normalnie. */
  commandTicks: number;
  commandX: number;
  commandY: number;
  /** Cooldown komendy — osobny od cooldownu ataku. */
  commandCd: number;
}

export interface Projectile {
  alive: boolean;
  /**
   * Pocisk sojuszniczy (z wieżyczek i totemów) trafia WROGÓW, nie graczy.
   * Jedno pole zamiast osobnego poola — silnik lotu i kolizji jest ten sam.
   */
  friendly: boolean;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  ttl: number;
  damage: number;

  /* ── Odbicia (chain lightning / arcane volley) ──────────────────────────
   * Jeden mechanizm pod pasywkę wilka, combo z łańcuchem, rykoszety thunder
   * novy i strzały lisa — patrz `ProjectileSkill` w skillsConfig.ts.
   */
  /** Ile jeszcze razy pocisk może przeskoczyć na kolejnego wroga (0 = nie odbija). */
  chainsLeft: number;
  /** W jakim promieniu szukamy kolejnego celu przy odbiciu. */
  chainRange: number;
  /** Mnożnik obrażeń po KAŻDYM odbiciu (1 = łańcuch nie słabnie). */
  chainFalloff: number;
  /** Promień wybuchu przy trafieniu (0 = pocisk rani tylko trafionego). */
  blastRadius: number;
  /**
   * Unikalny numer TEGO pocisku. Trafiony wróg dostaje go w `chainMark`,
   * a odbicie i kolizja pomijają już oznaczonych — więc łańcuch nigdy nie
   * wraca na wroga, którego już trafił. Numer dostaje KAŻDY pocisk, także
   * niełańcuchowy, żeby świeży nigdy nie zrównał się ze starym znacznikiem.
   */
  chainId: number;
  /** Komu przypisać zabójstwo (-1 = nikomu konkretnie). */
  ownerIndex: number;
  /**
   * Wygląd pocisku dla renderu (np. `'lightning'`). Pusty = domyślna kula.
   * To JEDYNE pole czysto kosmetyczne — symulacja go nie czyta, ale musi je
   * nieść, bo tylko ona wie, kto wypuścił dany pocisk. Render nie widzi
   * skilli, widzi tylko pool pocisków.
   */
  visual: string;
}

/** Item leżący na ziemi (drop z moba), czeka na zebranie albo despawn. */
export interface Pickup {
  alive: boolean;
  /** Indeks w ITEMS (itemsConfig.ts) dla romba; -1 gdy slot niesie GEAR. */
  defIndex: number;
  /**
   * Część ekwipunku, gdy to drop gearu (inaczej null = romb). Zbierany trafia
   * do plecaka, nie w `applyEffect`. Referencja zwalniana przy zebraniu/despawnie.
   */
  gear: GearPiece | null;
  x: number;
  y: number;
  ttl: number;
}

/**
 * Pozycja w SKLEPIE runowym (przerwa, Brotato). Stan symulacji — generowany
 * deterministycznie na starcie przerwy; kupno/reroll to komendy w inpucie.
 */
export interface ShopOffer {
  kind: 'gear' | 'upgrade';
  price: number;
  sold: boolean;
  /** kind==='gear': gotowa część (kupno → do plecaka). */
  gear: GearPiece | null;
  /** kind==='upgrade': efekt romba/boosta (przez `applyEffect`, jak karta). */
  upgradeKind: ItemKind;
  upgradeValue: number;
  /** Nazwa i kolor do wyświetlenia w panelu. */
  label: string;
  color: number;
}

/**
 * Lecąca lina dociągnięcia (`HookSkill`). Stan w poolu, silnik w `stepHooks`.
 * Faza `out` = leci w kursor i szuka celu; `back` = zwija się (ciągnąc wroga
 * albo — w trybie `pullSelf` — gracza).
 */
export interface Hook {
  alive: boolean;
  ownerIndex: number;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  dirX: number;
  dirY: number;
  speed: number;
  /** Ile px już przeleciała — po przekroczeniu `maxRange` wraca pusta. */
  travelled: number;
  maxRange: number;
  width: number;
  damage: number;
  mode: 'pullTarget' | 'pullSelf';
  /** Indeks statusu z STATUSES nakładanego chwyconemu (-1 = żaden). */
  status: number;
  grabsAllies: boolean;
  phase: 'out' | 'back';
  /** Indeks chwyconego moba w `mobs` (-1 = lina pusta). */
  grabbedMob: number;
  /** Tick wystrzału — render rysuje z tego linę. */
  startTick: number;
}

/**
 * Tymczasowa ściana (`WallSkill`) — JEDEN odcinek. Pierścień to kilka slotów
 * poola naraz. Blokuje ruch: mobki i gracz nie przechodzą (`pushOutOfWalls`,
 * wpięte w `movePlayer` i `moveMobsAndAttack`). Bossów nie zatrzymuje.
 */
export interface Wall {
  alive: boolean;
  ownerIndex: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
  ttl: number;
  blocksProjectiles: boolean;
  /** Tick postawienia — render robi z tego animację wyrastania. */
  startTick: number;
}

/**
 * Pełny stan jednego gracza. W single-playerze tablica ma jeden element,
 * w co-opie do ośmiu — reszta symulacji nie widzi różnicy.
 */
export interface Player {
  index: number;
  cls: ClassDef;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  hp: number;
  /**
   * Flaga śmierci ustawiana w momencie zadania obrażeń.
   * Bez niej regeneracja „wskrzeszała" gracza: obrażenia zbijały HP do zera,
   * a regen w tym samym ticku dorzucał ułamek punktu, więc `hp > 0` i gra
   * leciała dalej — z regenem dało się wygrać cały run stojąc w miejscu.
   */
  dead: boolean;
  /**
   * Gracz rozłączył się w co-opie. Trzymamy to osobno od `dead`, mimo że
   * rozłączony jest zawsze też martwy: render ma pokazać „LEFT" zamiast
   * „DEAD", a podsumowanie runu — nie liczyć rozłączenia jako porażki.
   */
  left: boolean;
  hurtCooldown: number;

  /** Kierunek patrzenia (ostatni niezerowy ruch) — domyślny kierunek ciosu. */
  facingX: number;
  facingY: number;
  /** Trwały cel ruchu z RMB (Dota-style); render czyta do rysowania markera. */
  moveTargetX: number;
  moveTargetY: number;
  hasMoveTarget: boolean;
  /**
   * WYBRANY WRÓG (unit-select). Indeks w `mobs` (-1 = brak). RMB na wrogu go
   * ustawia, RMB na pustej ziemi zdejmuje. Dopóki żyje: gracz do niego idzie,
   * a auto-atak bije WYŁĄCZNIE jego; zasilają się nim też skille single-target
   * (hook, drain). Czyszczony w `killMob`, więc nigdy nie wskazuje na slot,
   * który pool oddał już nowemu wrogowi.
   */
  targetMob: number;

  /* ── Doskok (spacja) ────────────────────────────────────────────────── */
  dashCooldown: number;
  /** Ile ticków doskoku zostało (0 = stoi na ziemi). */
  dashTicksLeft: number;
  dashVX: number;
  dashVY: number;
  /** Tick startu doskoku — render rysuje z tego smugę. */
  lastDashTick: number;
  /** Tick uderzenia przy lądowaniu (Power Jump) — render rysuje falę. */
  lastDashImpactTick: number;

  /** Umiejętności w slotach Q/W/E — talent specjalizacji je podmienia. */
  skillIds: string[];
  /** Cooldown każdego slotu osobno. */
  skillCooldowns: number[];
  /** Wariant doskoku spod spacji — również podmienialny talentem. */
  dashId: string;
  /** Który wariant doskoku jest AKTUALNIE w locie (Q może odpalić inny). */
  activeDashId: string;
  /** Mnożnik promienia fali uderzeniowej — skalowany talentami skoczka. */
  impactRadiusMult: number;
  /** Wybrana specjalizacja: indeks gałęzi drzewka (-1 = jeszcze nie wybrał). */
  specIndex: number;

  meleeCooldown: number;
  lastMeleeTick: number;
  lastSkillTick: number;
  lastSkillDirX: number;
  lastSkillDirY: number;

  /** Modyfikatory z itemów i ulepszeń — permanentne do końca runu. */
  armorFlat: number;
  speedMult: number;
  attackSpeedMult: number;
  rangeMult: number;
  damageMult: number;
  /**
   * OŚ „auto vs skill" (gear, `gearConfig.ts`). `damageMult` (statek `strength`)
   * jest UNIWERSALNY i siedzi w `meleeDamageOf`, więc karmi oba kanały. Te dwa
   * rozdzielają je NA WIERZCHU wspólnej bazy:
   *  - `attackDamageMult` mnoży TYLKO auto-atak (`applyMelee`) i jego proc
   *    (rykoszet Thunder Fang),
   *  - `skillPowerMult` mnoży TYLKO obrażenia umiejętności (przez `skillDamageOf`).
   * Oba startują z 1 (brak wpływu), więc dopóki nic ich nie podnosi, balans stoi.
   * Ataki jednostek zostają na osi `minionDamageMult` — nie dotyka ich żaden z tych.
   */
  attackDamageMult: number;
  skillPowerMult: number;
  /* ── WARSTWA GEAR (ekwipunek, run-scoped; `gearConfig.ts`) ─────────────────
   * Trzecia warstwa statów, przeliczana `recomputeGear` przy KAŻDEJ zmianie
   * ekwipunku (nie co tick — inaczej niż aury; equip jest rzadki). Dwa mechanizmy:
   *  - staty BEZ capa foldują się ADDYTYWNIE do pól efektywnych powyżej
   *    (`damageMult`, `rangeMult`, …); `gearFold` trzyma aktualny wkład, żeby
   *    dało się go cofnąć przy zmianie ekwipunku,
   *  - staty Z capem mają RÓWNOLEGŁE `gearX`, łączone i clampowane na SUMIE
   *    (baza+gear) dopiero przy odczycie — clamp przy zapisie gubiłby informację
   *    potrzebną do cofnięcia. Capy te same co dla rombów (`ITEM_CAPS`). */
  equipped: (GearPiece | null)[];
  bag: (GearPiece | null)[];
  gearFold: GearFold;
  gearArmorFlat: number;
  gearCritChance: number;
  gearRegen: number;
  gearLeech: number;
  gearThorns: number;
  /** Mnożnik cooldownu z gearu (<1 = szybciej); łączony `× cooldownMult` z podłogą. */
  gearCooldownMult: number;
  /**
   * Aktywne UNIKALNE efekty legendarek (id z `LEGENDARIES`). Przeliczane od zera
   * przy każdej zmianie ekwipunku (`recomputeGear`), więc odwracalne. Sim sprawdza
   * `uniqueEffects.has('id')` w hookach — odpowiednik talentowych `grants*`.
   */
  uniqueEffects: Set<string>;
  /**
   * SONIC: ile NADWYŻKI prędkości zamienia się w obrażenia. 0 = brak (każda
   * inna klasa). >0 = obrażenia gracza rosną wraz z `speedMult × auraSpeedMult`,
   * więc `speed` (normalnie defensywny) staje się głównym statem DPS. Wchodzi
   * do `meleeDamageOf`, więc karmi WSZYSTKO: roll, spin, auto-atak. Nadaje to
   * specjalizacja przez `grantsSpeedDamage`.
   */
  speedToDamage: number;
  /**
   * CURL: ile NADWYŻKI życia (`maxHpBonus` ponad bazę klasy) zamienia się
   * w obrażenia. 0 = brak. >0 = tank bije tym mocniej, im jest twardszy —
   * „touch me and regret it" jako mechanika. Też w `meleeDamageOf`, więc karmi
   * cały kit CURL-a (nova, slam, auto-atak). Nadaje `grantsHpDamage`.
   */
  hpToDamage: number;
  /**
   * RAMPAGE (niedźwiedź): ile BRAKUJĄCEGO życia zamienia się w obrażenia —
   * odwrotność CURL-a. 0 = brak. >0 = im niżej masz pasek, tym mocniej bijesz
   * (berserker). Też w `meleeDamageOf`, więc karmi cały kit. Ryzyko/nagroda:
   * niski HP to potęga, ale i śmierć — sustain (leech, BLOODLUST) trzyma Cię
   * w grze. Nadaje `grantsLostHpDamage`.
   */
  lostHpToDamage: number;
  /**
   * CACKLE (hiena): egzekucja — bonus do obrażeń rosnący z BRAKIEM życia CELU.
   * 0 = brak. >0 = im bardziej ranny wróg, tym mocniej go bijesz („laughs at
   * the wounded"). Wchodzi w `rollDamage` (czyta ułamek HP celu przez `Mob.maxHp`),
   * więc dotyczy KAŻDEGO trafienia z celem: cios, stożek, nawet minion gracza.
   * Nadaje `grantsExecuteDamage`.
   */
  executeToDamage: number;
  shieldCharges: number;
  regenPerSec: number;
  maxHpBonus: number;
  cooldownMult: number;
  leechHealPerKill: number;
  magnetBonus: number;
  knockbackMult: number;
  thornsDamage: number;
  dropChanceBonus: number;
  /**
   * Promień wskrzeszania (hiena nekromantka). Wróg zabity bliżej niż tyle
   * wstaje po naszej stronie. 0 = brak.
   */
  raiseRadius: number;
  /**
   * Skalowanie sojuszniczych jednostek. Buildy przywoływaczy rosną przez te
   * mnożniki, a nie przez obrażenia własne gracza — inaczej specjalizacja,
   * w której `Q` nie zadaje obrażeń, byłaby ślepą uliczką.
   */
  minionDamageMult: number;
  minionHpMult: number;
  minionDurationMult: number;
  minionCountBonus: number;
  /**
   * Ile razy bolt turreta skalowanego graczem (`scalesWithOwner`) ODBIJA się
   * na kolejnych wrogów. 0 = nie odbija. Nadaje to zwieńczenie buildera
   * (`OVERCHARGE`) przez `grantsTurretChains` — jeden turret zaczyna czyścić
   * hordę, zamiast bić w jeden cel.
   */
  turretBoltChains: number;
  /** Ile DODATKOWYCH celów sączy jednocześnie `channel/drain` (NIGHT TERROR Q). */
  drainExtraTargets: number;
  /** Ile DODATKOWYCH jednostek stawia skill `summon` na rzut (NIGHT TERROR R). */
  summonCountBonus: number;
  /**
   * `onHit` (SCURRY): indeks statusu nakładanego KAŻDYM auto-atakiem, który
   * zadał obrażenia (-1 = żaden, każda inna klasa). To jest cały prymityw orba:
   * zwykły cios zaczyna truć/spowalniać bez osobnego skilla. Wchodzi tylko
   * w `applyMelee`, więc skille i tak niosą swój status z definicji. Nadaje
   * `grantsOnHitStatus`.
   */
  onHitStatus: number;
  /**
   * `onHit` (SCURRY): ile HP leczy KAŻDY auto-atak, który zadał obrażenia.
   * Pierwszy w grze lifesteal-NA-TRAFIENIE (dotąd `leech` był tylko na
   * zabójstwo). Skaluje się z attack-speedem — więcej ciosów = więcej
   * leczenia — dlatego GNAW FRENZY / RABID robią z papierowego szczura wampira.
   * Nadaje `grantsOnHitLifesteal`, apex (`RABID BLOOD`) podbija.
   */
  onHitLifesteal: number;

  /* ── Combo (comboConfig.ts) — dziś wyłącznie Thunder Fang wilka ─────── */
  /** Combo, które gracz zna. Puste = klawisze działają zwyczajnie. */
  comboIds: string[];
  /** Ostatnie wciśnięte sloty (max `COMBO_BUFFER`). */
  comboSeq: number[];
  /** Ticki ciszy od ostatniego wciśnięcia — po oknie bufor pada. */
  comboIdleTicks: number;
  /** Cooldown każdego combo, indeksowany jak `COMBOS`. */
  comboCooldowns: number[];
  /** Combo, którego doskok właśnie leci (-1 = zwykły doskok). */
  dashBoltCombo: number;
  /** Tick i indeks ostatniego combo — render robi z tego napis. */
  lastComboTick: number;
  lastComboIndex: number;

  /* ── Rykoszet auto-ataku ────────────────────────────────────────────── */
  /**
   * BAZOWY rykoszet, nadany talentem na stałe (pasywka Thunder Fang).
   * 0 przeskoków = klasa nie ma rykoszetu.
   */
  meleeChains: number;
  meleeChainRange: number;
  meleeChainFalloff: number;
  /** Obrażenia rykoszetu = obrażenia zwarcia × to. */
  meleeChainDamageMult: number;
  /** Wygląd pocisku rykoszetu (Thunder Fang = `'lightning'`). */
  meleeChainVisual: string;

  /**
   * WZMOCNIENIE rykoszetu — jeden mechanizm pod dwa różne zastosowania:
   *  - combo `STORM CHAIN`: jednorazowe (`uses` 1), bardzo długi łańcuch;
   *  - `ARCANE SURGE` lisa: na czas (`uses` -1), każdy cios przez 20 s.
   * Wcześniej były to dwa osobne komplety pól; scalone, bo różnią się
   * wyłącznie tym, czy zużywa je pierwsze trafienie.
   */
  chainBuffTicks: number;
  /** Ile trafień jeszcze skorzysta; -1 = bez limitu do końca czasu. */
  chainBuffUses: number;
  chainBuffChains: number;
  chainBuffRange: number;
  chainBuffFalloff: number;
  chainBuffMult: number;
  /** Nazwa na HUD; pusta = brak wzmocnienia. */
  chainBuffName: string;
  /** Wygląd rykoszetu z wzmocnienia (Storm Chain = lightning, Surge = strzała). */
  chainBuffVisual: string;

  /* ── Wzmocnienie na czas (`EmpowerSkill`) ───────────────────────────── */
  /** Ile ticków jeszcze trwa; 0 = brak. */
  empowerTicks: number;
  /** +% prędkości ataku na czas trwania. */
  empowerAttackSpeed: number;

  /* ── Transformacja (`TransformSkill`) ───────────────────────────────────
   * Czasowa FORMA nadpisująca staty (dziś: niedźwiedzia COLOSSUS). Mnożniki są
   * dokładane w `stepAuras` (ta sama warstwa co aury), więc gdy `transformTicks`
   * spadnie do 0, przestają wchodzić — staty wracają same, bez cofania. */
  /** Ile ticków formy zostało; 0 = brak formy. */
  transformTicks: number;
  transformDamageMult: number;
  transformSpeedMult: number;
  transformAttackSpeedMult: number;
  transformArmorBonus: number;
  /** Ile ticków dokłada JEDNO zabójstwo w formie; 0 = forma tylko na zegar. */
  transformKillExtend: number;
  /** Sufit przedłużania (= czas bazowy formy) — zabójstwa nie leczą ponad to. */
  transformMaxTicks: number;

  /* ── Kanałowanie (`ChannelSkill`) ───────────────────────────────────── */
  /** Ile ticków kanału zostało; 0 = nie kanałuje. Ruch to zeruje. */
  channelTicks: number;
  /** Id kanałowanej umiejętności — z niej bierzemy `payload` co tyknięcie. */
  channelSkillId: string;
  /** Środek efektu (punkt pod kursorem w chwili startu — używa go vortex). */
  channelX: number;
  channelY: number;
  /** Tick startu — render rysuje z tego wiązkę/wir, a krok pomija nim break. */
  lastChannelTick: number;

  /* ── Blink arrow (`BlinkSkill`) ─────────────────────────────────────── */
  /**
   * Gdzie wbiła się strzała i ile ticków zostało na skok za nią. Cast jest
   * DWUETAPOWY: pierwsze wciśnięcie strzela, drugie teleportuje.
   */
  blinkX: number;
  blinkY: number;
  blinkTicks: number;
  /** Tick teleportu — render robi z tego błysk w obu punktach. */
  lastBlinkTick: number;

  /* ── Portale (`MinionDef.portal`) ───────────────────────────────────── */
  /**
   * Blokada po przejściu przez portal. Bez niej gracz ląduje NA drugim
   * portalu i natychmiast wraca — i tak w kółko.
   */
  portalCooldown: number;
  /** Tick ostatniego przejścia — render robi z tego błysk. */
  lastPortalTick: number;

  /* ── Pociski odbijane (`ProjectileSkill`) ───────────────────────────── */
  /** +tyle pocisków w wachlarzu skilla strzelającego. */
  projectileCountBonus: number;
  /** +tyle odbić na kolejnego wroga. */
  chainCountBonus: number;
  /** Mnożnik obrażeń rykoszetu/błyskawicy (1 = bez zmian). */
  chainDamageMult: number;

  /* ── Wataha (ALPHA_PACK w talentsConfig.ts) ─────────────────────────── */
  /** Czy gracz ma mechanikę watahy (specjalizacja ALPHA PACK). */
  packLeader: boolean;
  /**
   * PACK INSTINCT — licznik rosnący za zabójstwa dokonane, gdy w pobliżu
   * był ktoś swój. Nie spada: to jest miara tego, jak konsekwentnie gracz
   * trzymał się watahy przez CAŁY run. Sufit w `ALPHA_PACK.instinctMax`.
   */
  packInstinct: number;
  /** Sojusznicy w promieniu — przeliczane co tick, HUD to pokazuje. */
  allyCount: number;

  /* ── Aury (statusConfig.ts) ─────────────────────────────────────────── */
  /** Aury, które gracz roztacza — nadawane talentami. */
  auraIds: string[];
  /**
   * Aury WŁĄCZONE NA CZAS przez umiejętność (`AuraSkill`), indeksowane jak
   * `AURAS`. Osobno od `auraIds`, bo tamte trwają cały run.
   */
  auraTicks: number[];
  /**
   * Bonusy OD CUDZYCH I WŁASNYCH AUR, przeliczane od zera w każdym ticku.
   *
   * Osobna warstwa od `damageMult` itd. celowo: bonus z aury ma zniknąć
   * w chwili wyjścia z pola, a doklejony na stałe wymagałby pamiętania
   * o cofaniu go. Tak jest bezobsługowo.
   */
  auraDamageMult: number;
  auraSpeedMult: number;
  auraAttackSpeedMult: number;
  auraArmorFlat: number;
  /**
   * Mnożnik cooldownów Z AUR (redukcja), przeliczany od zera co tick jak reszta
   * warstwy. 1 = bez zmian; TEMPO zająca (`am-tempo`) zbija go poniżej 1. Wchodzi
   * w `skillCooldownTicksOf`, więc skraca cooldowny CAŁEJ drużyny w zasięgu.
   */
  auraCooldownMult: number;
  /**
   * AURA MASTER (zając): aura na slot Q/W/E/R (indeks = slot), aktywna DOPÓKI
   * slot gotowy (`skillCooldowns[i] <= 0`). Po wciśnięciu skill idzie na
   * cooldown i jego pasywna aura gaśnie. Pusta lista = każda inna klasa. Nadaje
   * `grantsSlotAuras`.
   */
  slotAuras: string[];
  /** Szansa na trafienie krytyczne w procentach (0-100). */
  critChance: number;
  /** Mnożnik obrażeń krytycznych — bazowo 2x, rośnie od itemów i talentów. */
  critDamageMult: number;
  /** Tick ostatniego kryta — render robi z tego błysk liczby. */
  lastCritTick: number;

  /** Statystyki i historia — podsumowanie runu. */
  kills: number;
  itemCounts: number[];
  totalItemsCollected: number;
  /** Złoto runowe (sklep w przerwie) — z zabójstw i sprzedaży; reset co run. */
  gold: number;
  lastPickupTick: number;
  lastPickupDefIndex: number;
  /** Event zebrania GEARU (render pokazuje floating text + dźwięk). Kosmetyka. */
  lastGearTick: number;
  lastGearName: string;
  lastGearRarity: number;
  lastShieldTick: number;
  pickedUpgrades: number[];
  /** Ulepszenia wylosowane temu graczowi na aktualną przerwę. */
  upgradeChoices: number[];
  /** Czy gracz podjął już decyzję w tej przerwie. */
  hasPickedThisBreak: boolean;
  /** Oferta sklepu na aktualną przerwę (kupno/reroll za złoto). */
  shopOffers: ShopOffer[];

  /* ── Progresja w runie (gdd.md 5.8) — znika razem z runem ──────────── */
  level: number;
  /** Exp w kierunku NASTĘPNEGO poziomu (nie suma od początku runu). */
  xp: number;
  /** Nierozdane punkty talentów. */
  talentPoints: number;
  /** Rangi talentów, indeksowane jak `talentSlotsFor(klasa)`. */
  talentRanks: number[];
  /** Punkty wydane w każdej gałęzi — z tego wynika dostęp do głębszych rzędów. */
  spentPerBranch: number[];
  /** Tick ostatniego awansu — render robi z tego błysk i dźwięk. */
  lastLevelUpTick: number;
}

/**
 * Ile ticków po przejściu przez portal gracz go nie widzi.
 *
 * Bez tego teleport jest natychmiastową pętlą: lądujesz NA drugim portalu,
 * więc w tym samym ticku wracasz — i tak w nieskończoność. Wartość musi być
 * na tyle duża, żeby zdążyć zejść z pola portalu normalnym chodzeniem.
 */
const PORTAL_REUSE_TICKS = Math.round(0.9 * C.TICK_RATE);

/** Rozmiary pul nowych prymitywów — z zapasem na co-op (8 graczy). */
const HOOK_POOL_SIZE = 8;
/** Pierścień (`shape: 'ring'`) zjada kilka slotów naraz, stąd większa pula. */
const WALL_POOL_SIZE = 32;

/** Zapas wokół promienia wroga przy wskazywaniu celu RMB — łatwiej trafić. */
const TARGET_PICK_MARGIN = 22;

/** Czy bufor wciśnięć KOŃCZY SIĘ podaną sekwencją (dopasowanie combo). */
function seqEndsWith(buffer: number[], sequence: number[]): boolean {
  if (buffer.length < sequence.length) return false;
  const offset = buffer.length - sequence.length;
  for (let i = 0; i < sequence.length; i++) {
    if (buffer[offset + i] !== sequence[i]) return false;
  }
  return true;
}

export class World {
  readonly rng: Rng;
  tick = 0;
  /**
   * Licznik numerów pocisków (`Projectile.chainId`). Rośnie monotonicznie
   * i identycznie na każdym kliencie, bo zależy wyłącznie od kolejności
   * spawnów w symulacji — nie od losowości ani od zegara.
   */
  private nextChainId = 1;
  /**
   * STOP CZASU (`TimeStopSkill`). Dopóki > 0, wrogowie nie ruszają się, nie
   * atakują, a ich pociski wiszą w powietrzu. Stan jest GLOBALNY i siedzi
   * w symulacji, więc w co-opie widzą go identycznie wszyscy klienci.
   */
  timeStopTicks = 0;

  readonly players: Player[] = [];

  /** Poole o stałym rozmiarze — zero alokacji w trakcie gry. */
  readonly mobs: Mob[] = [];
  readonly projectiles: Projectile[] = [];
  /** Sojusznicze jednostki (totemy, wskrzeszeni, przywołańcy). */
  readonly minions: Minion[] = [];
  readonly pickups: Pickup[] = [];
  /** Lecące liny dociągnięcia (`HookSkill`) — pool o stałym rozmiarze. */
  readonly hooks: Hook[] = [];
  /** Tymczasowe ściany (`WallSkill`) — jeden slot = jeden odcinek. */
  readonly walls: Wall[] = [];
  /** Przeszkody wygenerowane z seeda w konstruktorze — stałe przez cały run. */
  readonly obstacles: Obstacle[] = [];

  aliveMobs = 0;
  /**
   * Kolejny `id` instancji części gearu. Rośnie deterministycznie z każdą
   * zrollowaną częścią (`rollGearPiece`), więc jest identyczny na wszystkich
   * klientach. Wchodzi do `checksum` przez `equipped`/`bag`.
   */
  private nextGearId = 1;
  /** Ilu wrogów każdego typu żyje (indeks = ENEMIES) — pilnuje limitów maxAlive. */
  readonly aliveByType: number[] = ENEMIES.map(() => 0);
  /** Łączny licznik zabitych mobków (wszyscy gracze razem). */
  kills = 0;

  /* ── Boss ─────────────────────────────────────────────────────────────── */
  /**
   * Sloty mobków, w które wstawiono bossów tej fali (może być kilku naraz).
   * `bossMobIndex`/`bossDefeated` są GETTERAMI liczonymi z tej listy — nie ma
   * osobnej flagi do zerowania, bo martwego bossa poznajemy po `bossIndex < 0`
   * (zwolniony slot przejmowany przez zwykłego moba i tak ma `bossIndex = -1`).
   */
  bossMobIndices: number[] = [];
  /** Czy bossowie tej fali zostali już przyzwani (spawn raz na falę). */
  bossesSpawned = false;
  /** HP startowe bossa — render rysuje z tego pasek. */
  bossMaxHp = 0;
  /** Tick ostatniej zmiany fazy bossa i jej komunikat (dla renderu). */
  bossPhaseTick = -1;
  bossPhaseAnnounce = '';
  /** Harmonogram bossów tej mapy (fala → lista id). Ustawiany w konstruktorze. */
  private readonly bossWaves: Record<number, string[]>;

  /** Pierwszy ŻYWY boss tej fali (dla paska HP) albo null. */
  get boss(): Mob | null {
    const i = this.bossMobIndex;
    return i >= 0 ? this.mobs[i] : null;
  }

  /** Slot pierwszego żywego bossa (żywego = `alive && bossIndex >= 0`) albo -1. */
  get bossMobIndex(): number {
    for (const i of this.bossMobIndices) {
      const m = this.mobs[i];
      if (m && m.alive && m.bossIndex >= 0) return i;
    }
    return -1;
  }

  /** Wszyscy bossowie fali polegli (przyzwani i żaden nie żyje). */
  get bossDefeated(): boolean {
    return this.bossesSpawned && this.bossMobIndex < 0;
  }

  get bossDef(): BossDef | null {
    const b = this.boss;
    return b ? BOSSES[b.bossIndex] : null;
  }

  /** Czy na bieżącej fali mają pojawić się bossowie (wg harmonogramu mapy). */
  get isBossWave(): boolean {
    return this.bossWaves[this.wave] !== undefined;
  }

  /* ── Struktura runu: fale i przerwy (wavesConfig.ts) ──────────────────── */
  phase: Phase = 'wave';
  /** Numer aktualnej fali, liczony od 1. */
  wave = 1;
  /** Ticki pozostałe do końca bieżącej fali. */
  waveTicksLeft = WAVE_DURATION_TICKS;

  private readonly hash = new SpatialHash();

  /**
   * @param seed        wspólny dla wszystkich klientów — z niego lecą przeszkody,
   *                    spawny i losowanie ulepszeń, więc świat jest identyczny
   * @param classes     klasa każdego gracza (długość = liczba graczy)
   * @param metaBonuses bonusy meta osobno dla każdego gracza
   */
  constructor(
    seed: number, classes: ClassDef[], metaBonuses: MetaBonus[][] = [],
    mapId: string = DEFAULT_MAP_ID,
  ) {
    this.rng = new Rng(seed);
    this.bossWaves = mapById(mapId)?.bossWaves ?? {};

    classes.forEach((cls, i) => {
      const p = this.createPlayer(i, cls);
      // Gracze startują w wachlarzu wokół środka areny, żeby się nie nakładali.
      if (classes.length > 1) {
        const angle = (i / classes.length) * Math.PI * 2;
        p.x = C.WORLD_W / 2 + Math.cos(angle) * 70;
        p.y = C.WORLD_H / 2 + Math.sin(angle) * 70;
      }
      p.prevX = p.x;
      p.prevY = p.y;
      for (const bonus of metaBonuses[i] ?? []) {
        if (bonus.kind === 'dropChance') p.dropChanceBonus += bonus.value;
        else this.applyEffect(p, bonus.kind, bonus.value);
      }
      p.hp = this.maxHpOf(p);
      // Ustala niezmiennik „pola efektywne zawierają wkład gearu" od t=0.
      // Ekwipunek startowy jest pusty, więc to no-op — ale trzyma jeden punkt
      // prawdy dla warstwy gear (i za darmo obejmie przyszły gear startowy).
      this.recomputeGear(p);
      this.players.push(p);
    });

    for (let i = 0; i < C.MOB_CAP; i++) {
      this.mobs.push({
        statuses: Array.from({ length: MOB_STATUS_SLOTS }, () => ({
          defIndex: -1, ticksLeft: 0, stacks: 0, tickIn: 0, ownerIndex: 0,
        })),
        alive: false, defIndex: 0, x: 0, y: 0, prevX: 0, prevY: 0,
        hp: 0, maxHp: 0, speed: 0, chainMark: -1, attackCooldown: 0, lastHitTick: -100,
        state: 'chase', stateTicks: 0, windupStartTick: -100, lastSlamTick: -100,
        targetPlayer: 0, tauntUntilTick: -100, tauntedBy: 0,
        bossIndex: -1, phaseIndex: 0, attackIndex: 0,
        chargeVX: 0, chargeVY: 0, chargeRadius: 0, chargeDamage: 0,
      });
    }
    for (let i = 0; i < C.PROJECTILE_CAP; i++) {
      this.projectiles.push({
        alive: false, friendly: false,
        x: 0, y: 0, prevX: 0, prevY: 0, vx: 0, vy: 0, ttl: 0, damage: 0,
        chainsLeft: 0, chainRange: 0, chainFalloff: 1, blastRadius: 0,
        chainId: 0, ownerIndex: -1, visual: '',
      });
    }
    for (let i = 0; i < MINION_POOL_SIZE; i++) {
      this.minions.push({
        alive: false, defIndex: 0, ownerIndex: 0,
        x: 0, y: 0, prevX: 0, prevY: 0, hp: 0, maxHp: 0, ttl: 0,
        attackCooldown: 0, state: 'idle', stateTicks: 0, attackIndex: 0, spawnTick: 0,
        chargesLeft: 0, commandTicks: 0, commandX: 0, commandY: 0, commandCd: 0,
      });
    }
    for (let i = 0; i < DROP_CONFIG.maxGroundItems; i++) {
      this.pickups.push({ alive: false, defIndex: 0, gear: null, x: 0, y: 0, ttl: 0 });
    }
    for (let i = 0; i < HOOK_POOL_SIZE; i++) {
      this.hooks.push({
        alive: false, ownerIndex: 0, x: 0, y: 0, prevX: 0, prevY: 0,
        dirX: 1, dirY: 0, speed: 0, travelled: 0, maxRange: 0, width: 0,
        damage: 0, mode: 'pullTarget', status: -1, grabsAllies: false,
        phase: 'out', grabbedMob: -1, startTick: -1,
      });
    }
    for (let i = 0; i < WALL_POOL_SIZE; i++) {
      this.walls.push({
        alive: false, ownerIndex: 0, x1: 0, y1: 0, x2: 0, y2: 0,
        thickness: 0, ttl: 0, blocksProjectiles: false, startTick: -1,
      });
    }

    this.generateObstacles();
  }

  private createPlayer(index: number, cls: ClassDef): Player {
    return {
      index, cls,
      x: C.WORLD_W / 2, y: C.WORLD_H / 2, prevX: C.WORLD_W / 2, prevY: C.WORLD_H / 2,
      hp: cls.maxHp, dead: false, left: false, hurtCooldown: 0,
      facingX: 1, facingY: 0,
      moveTargetX: 0, moveTargetY: 0, hasMoveTarget: false, targetMob: -1,
      skillIds: [DEFAULT_SKILL_ID, '', '', ''],
      activeDashId: cls.dashId, impactRadiusMult: 1,
      skillCooldowns: [0, 0, 0, 0],
      dashId: cls.dashId, specIndex: -1,
      dashCooldown: 0, dashTicksLeft: 0, dashVX: 0, dashVY: 0, lastDashTick: -1, lastDashImpactTick: -1,
      meleeCooldown: cls.meleeIntervalTicks, lastMeleeTick: -1,
      lastSkillTick: -1, lastSkillDirX: 1, lastSkillDirY: 0,
      armorFlat: 0, speedMult: 1, attackSpeedMult: 1, rangeMult: 1, damageMult: 1,
      attackDamageMult: 1, skillPowerMult: 1,
      equipped: EQUIP_SLOTS.map(() => null),
      bag: Array.from({ length: BAG_CAP }, () => null),
      gearFold: emptyGearFold(),
      gearArmorFlat: 0, gearCritChance: 0, gearRegen: 0, gearLeech: 0, gearThorns: 0,
      gearCooldownMult: 1, uniqueEffects: new Set(),
      speedToDamage: 0, hpToDamage: 0, lostHpToDamage: 0, executeToDamage: 0,
      shieldCharges: 0, regenPerSec: 0, maxHpBonus: 0, cooldownMult: 1,
      leechHealPerKill: 0, magnetBonus: 0, knockbackMult: 1, thornsDamage: 0,
      dropChanceBonus: 0, raiseRadius: 0,
      minionDamageMult: 1, minionHpMult: 1, minionDurationMult: 1, minionCountBonus: 0,
      turretBoltChains: 0, drainExtraTargets: 0, summonCountBonus: 0,
      onHitStatus: -1, onHitLifesteal: 0,
      projectileCountBonus: 0, chainCountBonus: 0, chainDamageMult: 1,
      comboIds: [], comboSeq: [], comboIdleTicks: 0,
      comboCooldowns: COMBOS.map(() => 0),
      dashBoltCombo: -1,
      chainBuffTicks: 0, chainBuffUses: 0, chainBuffChains: 0,
      chainBuffRange: 0, chainBuffFalloff: 1, chainBuffMult: 1, chainBuffName: '', chainBuffVisual: '',
      empowerTicks: 0, empowerAttackSpeed: 0,
      transformTicks: 0, transformDamageMult: 1, transformSpeedMult: 1,
      transformAttackSpeedMult: 1, transformArmorBonus: 0,
      transformKillExtend: 0, transformMaxTicks: 0,
      channelTicks: 0, channelSkillId: '', channelX: 0, channelY: 0, lastChannelTick: -1,
      blinkX: 0, blinkY: 0, blinkTicks: 0, lastBlinkTick: -1,
      portalCooldown: 0, lastPortalTick: -1,
      lastComboTick: -1, lastComboIndex: -1,
      meleeChains: 0, meleeChainRange: 0, meleeChainFalloff: 1, meleeChainDamageMult: 1, meleeChainVisual: '',
      packLeader: false, packInstinct: 0, allyCount: 0,
      auraIds: [], auraTicks: AURAS.map(() => 0),
      auraDamageMult: 1, auraSpeedMult: 1, auraAttackSpeedMult: 1, auraArmorFlat: 0,
      auraCooldownMult: 1, slotAuras: [],
      critChance: 0, critDamageMult: 2, lastCritTick: -1,
      kills: 0, itemCounts: ITEMS.map(() => 0), totalItemsCollected: 0, gold: 0,
      lastPickupTick: -1, lastPickupDefIndex: -1, lastShieldTick: -1,
      lastGearTick: -1, lastGearName: '', lastGearRarity: 0,
      pickedUpgrades: [], upgradeChoices: [], hasPickedThisBreak: false, shopOffers: [],
      level: 1, xp: 0, talentPoints: 0,
      talentRanks: talentSlotsFor(cls.id).map(() => 0),
      spentPerBranch: branchesFor(cls.id).map(() => 0),
      lastLevelUpTick: -1,
    };
  }

  /* ── Progresja w runie ────────────────────────────────────────────────── */

  /** Ile expa daje ukończona fala — wyliczane z długości runu (talentsConfig). */
  private get waveXp(): number {
    return xpPerWaveCleared(WAVE_CONFIG.totalWaves);
  }

  /**
   * Dopisuje exp i rozlicza awanse. Po osiągnięciu maksimum exp przestaje się
   * liczyć — nie ma sensu zbierać go „na zapas", bo run i tak zaraz się kończy.
   */
  private gainXp(p: Player, amount: number): void {
    if (p.dead || p.level >= PROGRESSION.maxLevel) return;
    p.xp += amount;
    while (p.level < PROGRESSION.maxLevel && p.xp >= xpForLevel(p.level + 1)) {
      p.xp -= xpForLevel(p.level + 1);
      p.level++;
      p.talentPoints++;
      p.lastLevelUpTick = this.tick;
    }
    if (p.level >= PROGRESSION.maxLevel) p.xp = 0;
  }

  /**
   * Zakup jednej rangi talentu. Walidujemy WSZYSTKO, bo indeks przychodzi
   * z inputu: zły punkt kupiony u jednego gracza to rozjazd symulacji.
   */
  private trySpendTalent(p: Player, index: number): void {
    if (p.dead || p.talentPoints <= 0) return;
    const slots = talentSlotsFor(p.cls.id);
    if (index < 0 || index >= slots.length) return;

    const slot = slots[index];
    if (p.talentRanks[index] >= slot.def.maxRank) return;

    if (slot.isSpec) {
      // Specjalizację wybiera się RAZ na run i dopiero od ustalonego poziomu.
      if (p.specIndex >= 0) return;
      if (p.level < PROGRESSION.specLevel) return;
      p.specIndex = slot.branchIndex;
    } else {
      // Poza specjalizacją nie wolno wydawać punktów: pozostałe gałęzie są
      // zamknięte, a przed wyborem nie ma w co inwestować. To wymusza
      // decyzję o kierunku postaci na 2. poziomie.
      if (p.specIndex !== slot.branchIndex) return;
      // Głębsze rzędy wymagają wcześniejszego wejścia w tę samą gałąź.
      if (p.spentPerBranch[slot.branchIndex] < slot.requiresInBranch) return;
    }

    // Talent może obsadzić SLOTY umiejętności (Q/W/E) — na tym polega gałąź
    // zmieniająca zachowanie. Dzik-inżynier dostaje od razu trzy totemy,
    // snajper podmienia samo Q; ten sam mechanizm obsługuje oba przypadki.
    // Specjalizacja oparta wyłącznie na combo (Thunder Fang) OPRÓŻNIA sloty:
    // klawisze przestają cokolwiek odpalać, liczy się tylko ich kolejność.
    // Musi iść PRZED `grantsSkills`, żeby dało się jedno z drugim łączyć.
    if (slot.def.clearsSkills) {
      for (let i = 0; i < p.skillIds.length; i++) {
        p.skillIds[i] = '';
        p.skillCooldowns[i] = 0;
      }
    }
    if (slot.def.grantsSkills) {
      slot.def.grantsSkills.forEach((id, i) => {
        if (!id || i >= p.skillIds.length) return;
        p.skillIds[i] = id;
        // Nowa umiejętność ma własny cooldown; nie przenosimy starego.
        p.skillCooldowns[i] = 0;
      });
    }
    if (slot.def.grantsCombos) {
      for (const id of slot.def.grantsCombos) {
        if (!p.comboIds.includes(id)) p.comboIds.push(id);
      }
    }
    if (slot.def.grantsPack) p.packLeader = true;
    if (slot.def.grantsTurretChains) p.turretBoltChains = slot.def.grantsTurretChains;
    if (slot.def.grantsSpeedDamage) p.speedToDamage = slot.def.grantsSpeedDamage;
    if (slot.def.grantsHpDamage) p.hpToDamage = slot.def.grantsHpDamage;
    if (slot.def.grantsLostHpDamage) p.lostHpToDamage = slot.def.grantsLostHpDamage;
    if (slot.def.grantsExecuteDamage) p.executeToDamage = slot.def.grantsExecuteDamage;
    if (slot.def.grantsOnHitStatus) p.onHitStatus = statusIndexById(slot.def.grantsOnHitStatus);
    if (slot.def.grantsOnHitLifesteal) p.onHitLifesteal = slot.def.grantsOnHitLifesteal;
    if (slot.def.grantsRicochet) {
      const r = slot.def.grantsRicochet;
      p.meleeChains = r.chains;
      p.meleeChainRange = r.range;
      p.meleeChainFalloff = r.falloff;
      p.meleeChainDamageMult = r.damageMult;
      p.meleeChainVisual = r.visual ?? '';
    }
    // Aury się SUMUJĄ — gracz może roztaczać kilka naraz, więc tylko dokładamy.
    if (slot.def.grantsAura && !p.auraIds.includes(slot.def.grantsAura)) {
      p.auraIds.push(slot.def.grantsAura);
    }
    // AURA MASTER: aury sprzężone ze slotami Q/W/E/R (aktywne, gdy slot gotowy).
    if (slot.def.grantsSlotAuras) p.slotAuras = slot.def.grantsSlotAuras.slice();
    if (slot.def.grantsDash) {
      p.dashId = slot.def.grantsDash;
      p.dashCooldown = 0;
    }

    p.talentRanks[index]++;
    p.spentPerBranch[slot.branchIndex]++;
    p.talentPoints--;
    // Ta sama ścieżka co itemy, karty z przerwy i LAB — jedna implementacja efektów.
    this.applyEffect(p, slot.def.kind, slot.def.valuePerRank);
  }

  /* ── Statystyki efektywne (baza klasy + modyfikatory) ─────────────────── */

  maxHpOf(p: Player): number {
    return p.cls.maxHp + p.maxHpBonus;
  }
  moveSpeedOf(p: Player): number {
    return p.cls.speed * p.speedMult * p.auraSpeedMult;
  }
  meleeRangeOf(p: Player): number {
    return p.cls.meleeRange * p.rangeMult;
  }
  meleeDamageOf(p: Player): number {
    let dmg = p.cls.meleeDamage * p.damageMult * p.auraDamageMult;
    // SONIC: nadwyżka prędkości ponad bazę (`speedMult × auraSpeedMult`) wchodzi
    // w obrażenia. `max(0, …)` — spowolnienie nigdy nie zbija poniżej bazy. To
    // przez tę metodę liczą się roll, spin i auto-atak, więc jeden hook skaluje
    // całą gałąź prędkością.
    // LIGHTSPEED GREAVES (legendarka hog-sonic): nadwyżka prędkości liczy się PODWÓJNIE.
    const s2d = p.uniqueEffects.has('lightspeed-greaves') ? p.speedToDamage * 2 : p.speedToDamage;
    if (s2d > 0) {
      const speedFactor = p.speedMult * p.auraSpeedMult;
      dmg *= 1 + Math.max(0, speedFactor - 1) * s2d;
    }
    // CURL: nadwyżka HP nad bazę klasy wchodzi w obrażenia — tank bije tym
    // mocniej, im jest twardszy. Ten sam wzorzec co SONIC, tylko oś to życie.
    if (p.hpToDamage > 0) {
      dmg *= 1 + Math.max(0, p.maxHpBonus / p.cls.maxHp) * p.hpToDamage;
    }
    // RAMPAGE: BRAKUJĄCE życie wchodzi w obrażenia — odwrotność CURL-a. Im niżej
    // pasek, tym mocniejszy cios (berserker na krawędzi). Wyleczenie się zdejmuje
    // premię, więc gałąź sama reguluje: bądź nisko, ale nie martwy.
    if (p.lostHpToDamage > 0) {
      // HEART OF THE BERSERKER (legendarka bear-rampage): licz jak przy 25% mniej HP.
      let missing = 1 - p.hp / this.maxHpOf(p);
      if (p.uniqueEffects.has('heart-of-berserker')) missing = Math.min(1, missing + 0.25);
      dmg *= 1 + Math.max(0, missing) * p.lostHpToDamage;
    }
    return dmg;
  }
  /**
   * Obrażenia UMIEJĘTNOŚCI: wspólna baza (`meleeDamageOf`) × mnożnik danego
   * skilla × oś `skillPower`. Jeden lejek dla WSZYSTKICH skilli — dzięki temu
   * `skillPowerMult` wpina się w jednym miejscu (i tu wpięłaby się każda przyszła
   * globalna modyfikacja obrażeń umiejętności). Auto-atak NIE idzie przez ten
   * lejek — ma własną oś `attackDamageMult` w `applyMelee`.
   */
  skillDamageOf(p: Player, mult: number): number {
    return this.meleeDamageOf(p) * mult * p.skillPowerMult;
  }
  meleeIntervalOf(p: Player): number {
    return Math.max(
      ITEM_CAPS.minMeleeIntervalTicks,
      Math.round(p.cls.meleeIntervalTicks / (p.attackSpeedMult * p.auraAttackSpeedMult)),
    );
  }
  /** Definicja umiejętności w slocie (0=Q, 1=W, 2=E); null gdy slot pusty. */
  skillOf(p: Player, slot = 0): SkillDef | null {
    const id = p.skillIds[slot];
    return id ? skillById(id) : null;
  }
  /** Definicja doskoku spod spacji — drugi slot umiejętności, też podmienialny. */
  dashOf(p: Player): DashDef {
    return dashById(p.dashId);
  }
  skillCooldownTicksOf(p: Player, slot = 0): number {
    const skill = this.skillOf(p, slot);
    // `auraCooldownMult` < 1 = redukcja z aury TEMPO (AURA MASTER) — liczona
    // w chwili castu, więc krótszy cooldown dostajesz, gdy aura działała.
    const cd = Math.max(ITEM_CAPS.minCooldownMult, p.cooldownMult * p.gearCooldownMult);
    return skill ? Math.round(skill.cooldownTicks * cd * p.auraCooldownMult) : 0;
  }
  /** Zasięg umiejętności stożkowej — render rysuje z tego podgląd. */
  skillRangeOf(p: Player, slot = 0): number {
    const skill = this.skillOf(p, slot);
    return skill && skill.kind === 'cone' ? this.meleeRangeOf(p) * skill.rangeMult : 0;
  }
  pickupRadiusOf(p: Player): number {
    return DROP_CONFIG.pickupRadiusBase + p.magnetBonus;
  }

  /* ── Stan runu ────────────────────────────────────────────────────────── */

  get livingPlayers(): Player[] {
    return this.players.filter((p) => !p.dead);
  }

  /**
   * Gracz opuścił grę (zamknął kartę / stracił połączenie).
   *
   * MUSI być wywołane na WSZYSTKICH klientach w tym samym ticku, inaczej
   * symulacje się rozjadą — tym zajmuje się LockstepSession, która uzgadnia
   * tick rozłączenia po sieci. Tu tylko efekt: postać znika z pola walki.
   */
  dropPlayer(index: number): void {
    const p = this.players[index];
    if (!p || p.left) return;
    p.left = true;
    p.dead = true;
    p.hasMoveTarget = false;
    // Gdyby odszedł w trakcie przerwy, reszta czekałaby na jego wybór
    // ulepszenia w nieskończoność — dokładnie ten zwis, który naprawiamy.
    p.hasPickedThisBreak = true;
  }

  /** Run przegrany, gdy padli wszyscy — w co-opie jeden trup nie kończy gry. */
  get allPlayersDead(): boolean {
    return this.players.every((p) => p.dead);
  }

  get isRunOver(): boolean {
    return this.allPlayersDead || this.phase === 'victory';
  }

  /** Ile fal drużyna faktycznie zaliczyła (do nagrody meta). */
  get wavesCleared(): number {
    return this.phase === 'victory' ? WAVE_CONFIG.totalWaves : this.wave - 1;
  }

  /** Mnożnik HP wrogów w bieżącej fali (krzywa trudności: wavesConfig.ts). */
  get enemyHpMult(): number {
    return 1 + (this.wave - 1) * (WAVE_CONFIG.enemyHpPercentPerWave / 100);
  }

  /** Mnożnik obrażeń wrogów w bieżącej fali. */
  get enemyDamageMult(): number {
    return 1 + (this.wave - 1) * (WAVE_CONFIG.enemyDamagePercentPerWave / 100);
  }

  /** Czas trwania bieżącej fali (fale-wyzwania co N fal są dłuższe). */
  get currentWaveDurationTicks(): number {
    const elite =
      WAVE_CONFIG.eliteEveryNWaves > 0 && this.wave % WAVE_CONFIG.eliteEveryNWaves === 0;
    return Math.round(WAVE_DURATION_TICKS * (elite ? WAVE_CONFIG.eliteWaveMultiplier : 1));
  }

  /**
   * Jeden krok symulacji. `inputs[i]` należy do gracza `i`;
   * brakujące wpisy są traktowane jak brak akcji.
   */
  step(inputs: SimInput[]): void {
    if (this.isRunOver) return;
    this.tick++;

    const inputOf = (p: Player): SimInput => inputs[p.index] ?? EMPTY_INPUT;

    // Talenty i ekwipunek ogarnia się kiedy się chce — także w środku fali.
    // W co-opie nie ma pauzy, więc czekanie na przerwę oznaczałoby granie bez
    // awansów i bez założonego lootu. Deterministyczne (komendy w inpucie).
    for (const p of this.players) {
      const pick = inputOf(p).talentPick;
      if (pick >= 0) this.trySpendTalent(p, pick);
      this.handleGearCommands(p, inputOf(p));
    }

    if (this.phase === 'break') {
      this.stepBreak(inputOf);
      return;
    }

    if (this.timeStopTicks > 0) this.timeStopTicks--;
    const czasStoi = this.timeStopTicks > 0;

    this.savePrevPositions();
    for (const p of this.players) {
      if (!p.dead) this.movePlayer(p, inputOf(p));
    }
    this.stepPortals();
    this.spawnMobs(this.players.some((p) => !p.dead && inputOf(p).debugSpawn));
    this.rebuildHash();
    // STOP CZASU wycina wrogom ruch, ataki i obrażenia od dotknięcia.
    // Statusy tykają dalej świadomie: trucizny i podpalenia to obrażenia
    // GRACZA, a zamrażanie ich zamieniłoby ultimate w karę dla siebie.
    if (!czasStoi) this.moveMobsAndAttack();
    this.stepStatuses();
    this.stepAuras();
    this.stepMinions();
    this.stepProjectiles();
    this.stepHooks();
    for (const p of this.players) {
      if (p.dead) continue;
      this.applyMelee(p);
      this.applySkill(p, inputOf(p));
      if (!czasStoi) this.applyContactDamage(p);
    }
    this.stepPickups();
    for (const p of this.players) {
      if (!p.dead) this.applyRegen(p);
    }
    // Kanałowanie i ściany rozliczamy PO ruchu i castach: kanał sprawdza, czy
    // gracz się w tym ticku ruszył (przerwanie), a ściana odlicza swój czas.
    this.stepChannels(inputOf);
    this.stepWalls();

    // Fala z bossem nie kończy się na czas — trwa, dopóki boss żyje.
    if (this.isBossWave) {
      if (this.bossDefeated) this.endWave();
      return;
    }
    this.waveTicksLeft--;
    if (this.waveTicksLeft <= 0) this.endWave();
  }

  /* ── Fale i przerwy ───────────────────────────────────────────────────── */

  /**
   * W przerwie gracze chodzą (mogą pozbierać leżące itemy) i wybierają
   * ulepszenia. Fala rusza dopiero, gdy zdecydują WSZYSCY żywi — nikt nie
   * zostaje z tyłu z niewybraną kartą.
   */
  private stepBreak(inputOf: (p: Player) => SimInput): void {
    this.savePrevPositions();
    for (const p of this.players) {
      if (p.dead) continue;
      const input = inputOf(p);
      this.movePlayer(p, input);

      if (!p.hasPickedThisBreak) {
        const pick = input.upgradePick;
        if (pick >= 0 && pick < p.upgradeChoices.length) {
          const defIndex = p.upgradeChoices[pick];
          const def = UPGRADES[defIndex];
          this.applyEffect(p, def.kind, def.value);
          p.pickedUpgrades.push(defIndex);
          p.hasPickedThisBreak = true;
        }
      }

      // Sklep — kupno/reroll za złoto (tylko w przerwie). Nie bramkuje startu fali.
      this.handleShop(p, input);
    }
    this.stepPickups();
    for (const p of this.players) {
      if (!p.dead) this.applyRegen(p);
    }

    const living = this.livingPlayers;
    if (living.length > 0 && living.every((p) => p.hasPickedThisBreak)) {
      this.startNextWave();
    }
  }

  private endWave(): void {
    if (WAVE_CONFIG.clearMobsBetweenWaves) {
      for (let i = 0; i < this.mobs.length; i++) this.mobs[i].alive = false;
      for (let i = 0; i < this.projectiles.length; i++) this.projectiles[i].alive = false;
      // Jednostki znikają razem z falą — inaczej totemy przechodziłyby przez
      // przerwę i pierwsza fala po niej byłaby darmowa. WYJĄTEK: jednostki
      // wieczne (Behemot) zostają, bo w ich przypadku „wieczny" ma znaczyć
      // wieczny, a nie „do końca fali". Giną wyłącznie od obrażeń.
      for (let i = 0; i < this.minions.length; i++) {
        if (this.minions[i].ttl >= 0) this.minions[i].alive = false;
      }
      this.aliveMobs = 0;
      for (let i = 0; i < this.aliveByType.length; i++) this.aliveByType[i] = 0;
    }

    if (this.wave >= WAVE_CONFIG.totalWaves) {
      this.phase = 'victory';
      return;
    }
    this.phase = 'break';
    for (const p of this.players) {
      // Exp za falę dostają wszyscy żywi — także ci, którym słabo poszło.
      // To ta część progresji, która nie zależy od liczby zabójstw.
      this.gainXp(p, this.waveXp);
      p.hasPickedThisBreak = p.dead;
      p.upgradeChoices = [];
      if (!p.dead) {
        this.rollUpgradeChoices(p);
        this.rollShop(p);
      }
    }
  }

  /** Losuje ulepszenia dla gracza (deterministycznie, bez powtórek w trójce). */
  private rollUpgradeChoices(p: Player): void {
    p.upgradeChoices = [];
    // Leczenie przy (prawie) pełnym HP to zmarnowana karta — nie oferujemy go.
    const healthy = p.hp >= this.maxHpOf(p) * 0.9;
    const eligible = (i: number): boolean =>
      !p.upgradeChoices.includes(i) && !(healthy && UPGRADES[i].kind === 'medkit');

    const available = UPGRADES.filter((_, i) => !(healthy && UPGRADES[i].kind === 'medkit')).length;
    const count = Math.min(WAVE_CONFIG.upgradeChoices, available);
    while (p.upgradeChoices.length < count) {
      let totalWeight = 0;
      for (let i = 0; i < UPGRADES.length; i++) {
        if (eligible(i)) totalWeight += UPGRADES[i].weight;
      }
      let roll = this.rng.next() * totalWeight;
      for (let i = 0; i < UPGRADES.length; i++) {
        if (!eligible(i)) continue;
        roll -= UPGRADES[i].weight;
        if (roll <= 0) {
          p.upgradeChoices.push(i);
          break;
        }
      }
    }
  }

  private startNextWave(): void {
    this.wave++;
    this.phase = 'wave';
    this.waveTicksLeft = this.currentWaveDurationTicks;
    // Nowa fala = nowi bossowie (albo ich brak).
    this.bossMobIndices = [];
    this.bossesSpawned = false;
    this.bossMaxHp = 0;
    for (const p of this.players) {
      p.upgradeChoices = [];
      p.hasPickedThisBreak = false;
    }
  }

  /* ── Świat: przeszkody ────────────────────────────────────────────────── */

  /** Losowe przeszkody z seeda — deterministyczne, z czystą strefą startową. */
  private generateObstacles(): void {
    let attempts = 0;
    const cx = C.WORLD_W / 2;
    const cy = C.WORLD_H / 2;
    while (this.obstacles.length < C.OBSTACLE_COUNT && attempts < C.OBSTACLE_COUNT * 10) {
      attempts++;
      const r = this.rng.range(C.OBSTACLE_RADIUS_MIN, C.OBSTACLE_RADIUS_MAX);
      const x = this.rng.range(r, C.WORLD_W - r);
      const y = this.rng.range(r, C.WORLD_H - r);
      const dx = x - cx;
      const dy = y - cy;
      const clearance = C.OBSTACLE_SPAWN_CLEARANCE + r;
      if (dx * dx + dy * dy < clearance * clearance) continue;
      this.obstacles.push({ x, y, r });
    }
  }

  private projectileHitsObstacle(x: number, y: number): boolean {
    for (let i = 0; i < this.obstacles.length; i++) {
      const o = this.obstacles[i];
      const dx = x - o.x;
      const dy = y - o.y;
      const minD = o.r + C.PROJECTILE_RADIUS;
      if (dx * dx + dy * dy < minD * minD) return true;
    }
    return false;
  }

  /**
   * Wypycha okrąg (x, y, radius) poza wszystkie przeszkody.
   * Zwraca skorygowaną pozycję; przy idealnym środku przeszkody wypycha w prawo.
   */
  private pushOutOfObstacles(x: number, y: number, radius: number): { x: number; y: number } {
    for (let i = 0; i < this.obstacles.length; i++) {
      const o = this.obstacles[i];
      const dx = x - o.x;
      const dy = y - o.y;
      const minD = o.r + radius;
      const d2 = dx * dx + dy * dy;
      if (d2 >= minD * minD) continue;
      const d = Math.sqrt(d2);
      if (d < 0.001) {
        x = o.x + minD;
      } else {
        x = o.x + (dx / d) * minD;
        y = o.y + (dy / d) * minD;
      }
    }
    return { x, y };
  }

  /**
   * Wypycha punkt POZA każdą żywą ścianę (`WallSkill`). Ściana to odcinek —
   * traktujemy ją jak „gruby mur": kto podejdzie bliżej niż `thickness + radius`
   * do odcinka, zostaje odepchnięty na jego bok. To jest realna kolizja: mobki
   * (i gracz) nie przechodzą przez mur, tylko się o niego zatrzymują.
   */
  private pushOutOfWalls(x: number, y: number, radius: number): { x: number; y: number } {
    for (const w of this.walls) {
      if (!w.alive) continue;
      const abx = w.x2 - w.x1;
      const aby = w.y2 - w.y1;
      const ab2 = abx * abx + aby * aby || 1;
      // Najbliższy punkt na odcinku.
      let t = ((x - w.x1) * abx + (y - w.y1) * aby) / ab2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const cx = w.x1 + abx * t;
      const cy = w.y1 + aby * t;
      const dx = x - cx;
      const dy = y - cy;
      const minD = w.thickness + radius;
      const d2 = dx * dx + dy * dy;
      if (d2 >= minD * minD) continue;
      const d = Math.sqrt(d2);
      if (d < 0.001) {
        // Dokładnie na linii — pchamy wzdłuż normalnej odcinka.
        const nlen = Math.sqrt(ab2);
        x = cx + (-aby / nlen) * minD;
        y = cy + (abx / nlen) * minD;
      } else {
        x = cx + (dx / d) * minD;
        y = cy + (dy / d) * minD;
      }
    }
    return { x, y };
  }

  /* ── Gracze ───────────────────────────────────────────────────────────── */

  private savePrevPositions(): void {
    for (const p of this.players) {
      p.prevX = p.x;
      p.prevY = p.y;
    }
    for (let i = 0; i < this.mobs.length; i++) {
      const m = this.mobs[i];
      if (!m.alive) continue;
      m.prevX = m.x;
      m.prevY = m.y;
    }
    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      if (!p.alive) continue;
      p.prevX = p.x;
      p.prevY = p.y;
    }
  }

  /**
   * Doskok spod spacji. Wariant opisują DANE (`DASHES` w skillsConfig.ts),
   * a talent może go podmienić — tak samo jak umiejętność spod Q.
   *
   * Zwraca `true`, jeśli w tym ticku ruch został już obsłużony i normalne
   * chodzenie ma zostać pominięte.
   */
  /**
   * Rozpoczyna doskok wskazanym wariantem. Wyodrębnione, bo doskok odpala
   * się z DWÓCH miejsc: spacji i skoku bojowego (`LeapSkill`), który może
   * użyć innego wariantu niż ten spod spacji.
   */
  private startDash(p: Player, dash: DashDef, dirX: number, dirY: number): void {
    const speed = dash.distance / (dash.durationTicks * C.TICK_DT);
    p.dashVX = dirX * speed;
    p.dashVY = dirY * speed;
    p.dashTicksLeft = dash.durationTicks;
    // Zapamiętujemy, KTÓRY wariant leci — inaczej skok z `Q` byłby w locie
    // liczony parametrami doskoku spod spacji.
    p.activeDashId = dash.id;
    p.lastDashTick = this.tick;
    p.facingX = dirX;
    p.facingY = dirY;
    // Doskok to świadome przestawienie się — stary cel ruchu przestaje
    // obowiązywać, inaczej postać od razu wracałaby tam, skąd skoczyła.
    p.hasMoveTarget = false;
  }

  /** Duży wróg na trasie doskoku (null = droga wolna). */
  private bigMobOnPath(x: number, y: number, minRadius: number): Mob | null {
    let hit: Mob | null = null;
    this.hash.forEachNear(x, y, C.MOB_RADIUS_MAX + C.PLAYER_RADIUS, (i) => {
      if (hit) return;
      const m = this.mobs[i];
      if (!m.alive) return;
      const r = m.bossIndex >= 0 ? BOSSES[m.bossIndex].radius : ENEMIES[m.defIndex].radius;
      if (r < minRadius) return;
      const reach = r + C.PLAYER_RADIUS;
      const dx = m.x - x;
      const dy = m.y - y;
      if (dx * dx + dy * dy <= reach * reach) hit = m;
    });
    return hit;
  }

  private stepDash(p: Player, input: SimInput): boolean {
    if (p.dashCooldown > 0) p.dashCooldown--;

    // Start doskoku: kierunek spod kursora, a jak kursor jest na graczu —
    // to w stronę, w którą patrzy (żeby spacja nigdy nie „nie zadziałała").
    if (input.dash && p.dashTicksLeft <= 0 && p.dashCooldown <= 0) {
      const equipped = this.dashOf(p);
      let dx = input.aimX - p.x;
      let dy = input.aimY - p.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 1) {
        dx = p.facingX;
        dy = p.facingY;
      } else {
        dx /= d;
        dy /= d;
      }
      this.startDash(p, equipped, dx, dy);
      p.dashCooldown = equipped.cooldownTicks;
    }

    if (p.dashTicksLeft <= 0) return false;

    // W locie obowiązuje wariant, którym doskok wystartował.
    const dash = dashById(p.activeDashId);
    p.dashTicksLeft--;
    const nx = p.x + p.dashVX * C.TICK_DT;
    const ny = p.y + p.dashVY * C.TICK_DT;

    if (dash.passesObstacles) {
      // Skok ignoruje przeszkody — liczą się tylko granice areny.
      p.x = Math.min(Math.max(nx, C.PLAYER_RADIUS), C.WORLD_W - C.PLAYER_RADIUS);
      p.y = Math.min(Math.max(ny, C.PLAYER_RADIUS), C.WORLD_H - C.PLAYER_RADIUS);
    } else {
      // Dash po ziemi: wejście w przeszkodę ucina doskok w miejscu zderzenia.
      const pushed = this.pushOutOfObstacles(nx, ny, C.PLAYER_RADIUS);
      if (pushed.x !== nx || pushed.y !== ny) p.dashTicksLeft = 0;
      p.x = Math.min(Math.max(pushed.x, C.PLAYER_RADIUS), C.WORLD_W - C.PLAYER_RADIUS);
      p.y = Math.min(Math.max(pushed.y, C.PLAYER_RADIUS), C.WORLD_H - C.PLAYER_RADIUS);
    }

    // Wielki wróg zatrzymuje doskok — nad terenem przeskoczysz, nad Brutem
    // czy bossem już nie. Ulepszony doskok przy okazji w niego uderza.
    if (dash.bounceMobRadius > 0) {
      const big = this.bigMobOnPath(p.x, p.y, dash.bounceMobRadius);
      if (big) {
        p.dashTicksLeft = 0;
        // Odbicie: cofamy się kawałek, żeby nie utknąć w jego hitboksie.
        const bx = p.x - big.x;
        const by = p.y - big.y;
        const bd = Math.sqrt(bx * bx + by * by) || 1;
        const push = C.PLAYER_RADIUS + 4;
        p.x = Math.min(Math.max(p.x + (bx / bd) * push, C.PLAYER_RADIUS), C.WORLD_W - C.PLAYER_RADIUS);
        p.y = Math.min(Math.max(p.y + (by / bd) * push, C.PLAYER_RADIUS), C.WORLD_H - C.PLAYER_RADIUS);
      }
    }

    // Błyskawica sypie rykoszetami W LOCIE (combo `Q→W→Q`).
    if (p.dashBoltCombo >= 0) this.stepDashBolts(p);
    // Fala orze wszystko po DRODZE, a nie na końcu (surf wydry).
    if (dash.ride) this.rideWave(p, dash);

    // Lądowanie. Uderzenie liczymy w ticku, w którym doskok się KOŃCZY —
    // także gdy urwała go przeszkoda albo wielki wróg, więc odbicie boli.
    if (p.dashTicksLeft <= 0 && dash.impactRadius > 0) this.dashImpact(p, dash);
    if (p.dashTicksLeft <= 0) p.dashBoltCombo = -1;
    return true;
  }

  /**
   * Uderzenie w miejscu lądowania (Power Jump). Osobna metoda, bo to jest
   * prymityw do wielokrotnego użytku: każdy kolejny doskok z obrażeniami
   * dostaje go za darmo, wystarczy wpisać liczby w `DASHES`.
   */
  private dashImpact(p: Player, dash: DashDef): void {
    p.lastDashImpactTick = this.tick;
    const damage = this.skillDamageOf(p, dash.impactDamageMult);
    const knockback = dash.impactKnockback * p.knockbackMult;
    // Promień skalowany talentami — to główna oś wzrostu buildu skoczka.
    const radius = this.dashImpactRadiusOf(p, dash);

    this.hash.forEachNear(p.x, p.y, radius + C.MOB_RADIUS_MAX, (i) => {
      const m = this.mobs[i];
      if (!m.alive) return;
      const reach = radius + ENEMIES[m.defIndex].radius;
      const dx = m.x - p.x;
      const dy = m.y - p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > reach * reach) return;

      m.hp -= this.rollDamage(p, damage, m);
      m.lastHitTick = this.tick;
      if (m.hp <= 0) {
        this.killMob(m, p);
        return;
      }
      if (m.bossIndex >= 0) return;
      const d = Math.sqrt(d2) || 1;
      const kb = this.pushOutOfObstacles(
        m.x + (dx / d) * knockback,
        m.y + (dy / d) * knockback,
        ENEMIES[m.defIndex].radius,
      );
      m.x = Math.min(Math.max(kb.x, C.MOB_RADIUS), C.WORLD_W - C.MOB_RADIUS);
      m.y = Math.min(Math.max(kb.y, C.MOB_RADIUS), C.WORLD_H - C.MOB_RADIUS);
    });
  }

  /**
   * Uderzenie fali W TRAKCIE jazdy (`DashDef.ride`) — odwrotność `dashImpact`,
   * które pada raz, na końcu. Tu liczy się droga, więc bijemy cyklicznie.
   *
   * To jest zwykła nowa (`coneCos: -1`) wokół gracza, czyli ten sam kod, co
   * Shock Nova zająca — fala nie potrzebowała własnego wykrywania trafień.
   * Rytm bierzemy z `dashTicksLeft`, a nie z osobnego licznika na graczu:
   * ta liczba i tak maleje o 1 na tick, więc jest darmowym zegarem, który
   * nie może się rozjechać między klientami w co-opie.
   */
  private rideWave(p: Player, dash: DashDef): void {
    const ride = dash.ride;
    if (!ride || p.dashTicksLeft % ride.hitEveryTicks !== 0) return;
    // Szerokość fali rośnie z zasięgiem gracza — dlatego talenty na `range`
    // w gałęzi TIDECALLER poszerzają falę, zamiast być martwą statystyką.
    const radius = ride.hitRadius * p.rangeMult;
    this.applyCone(
      p, p.x, p.y, p.facingX, p.facingY,
      radius, this.skillDamageOf(p, ride.damageMult), -1,
      ride.knockback * p.knockbackMult,
      ride.status ? statusIndexById(ride.status) : -1,
    );
  }

  /** Promień fali uderzeniowej po ulepszeniach — render rysuje z tego okrąg. */
  dashImpactRadiusOf(p: Player, dash: DashDef): number {
    return dash.impactRadius * p.impactRadiusMult;
  }

  /** Czy gracz jest w powietrzu — w skoku nie da się go trafić. */
  isAirborne(p: Player): boolean {
    return p.dashTicksLeft > 0 && dashById(p.activeDashId).invulnerable;
  }

  private movePlayer(p: Player, input: SimInput): void {
    // Doskok ma pierwszeństwo przed chodzeniem do celu.
    if (this.stepDash(p, input)) return;

    // Rozkaz RMB: wróg pod kursorem = wskaż go jako cel ataku; pusta ziemia =
    // zwykły ruch (i zdejmij poprzedni cel). Cel rozwiązujemy w SYMULACJI ze
    // współrzędnych świata, więc każdy klient w co-opie wskaże tego samego moba.
    if (input.hasTarget) {
      const picked = this.mobAtPoint(input.targetX, input.targetY);
      if (picked >= 0) {
        p.targetMob = picked;
      } else {
        p.targetMob = -1;
        p.moveTargetX = Math.min(Math.max(input.targetX, C.PLAYER_RADIUS), C.WORLD_W - C.PLAYER_RADIUS);
        p.moveTargetY = Math.min(Math.max(input.targetY, C.PLAYER_RADIUS), C.WORLD_H - C.PLAYER_RADIUS);
        p.hasMoveTarget = true;
      }
    }

    // GOŃ WYBRANY CEL: dopóki żyje, idź w jego stronę i zatrzymaj się tuż
    // w zasięgu zwarcia (tam auto-atak bije już tylko jego). Cel zniknął —
    // zdejmujemy go i wracamy do zwykłego chodzenia.
    if (p.targetMob >= 0) {
      const m = this.mobs[p.targetMob];
      if (m && m.alive) {
        const rad = m.bossIndex >= 0 ? BOSSES[m.bossIndex].radius : ENEMIES[m.defIndex].radius;
        const dx = m.x - p.x;
        const dy = m.y - p.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const stop = Math.max(1, this.meleeRangeOf(p) + rad - 2);
        if (d > stop) {
          p.moveTargetX = m.x - (dx / d) * stop;
          p.moveTargetY = m.y - (dy / d) * stop;
          p.hasMoveTarget = true;
        } else {
          // W zasięgu — stój i patrz na cel (kierunek dla stożków i renderu).
          p.hasMoveTarget = false;
          p.facingX = dx / d;
          p.facingY = dy / d;
        }
      } else {
        p.targetMob = -1;
      }
    }

    if (!p.hasMoveTarget) return;

    let dx = p.moveTargetX - p.x;
    let dy = p.moveTargetY - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const stepLen = this.moveSpeedOf(p) * C.TICK_DT;

    if (dist <= stepLen) {
      // Dochodzimy do celu w tym ticku — snap i stop (bez drgania wokół punktu).
      p.x = p.moveTargetX;
      p.y = p.moveTargetY;
      p.hasMoveTarget = false;
      if (dist > 0.001) {
        p.facingX = dx / dist;
        p.facingY = dy / dist;
      }
    } else {
      dx /= dist;
      dy /= dist;
      p.facingX = dx;
      p.facingY = dy;
      p.x += dx * stepLen;
      p.y += dy * stepLen;
    }

    // Kolizja z przeszkodami + ścianami (`WallSkill`) + granice świata.
    let pushed = this.pushOutOfObstacles(p.x, p.y, C.PLAYER_RADIUS);
    pushed = this.pushOutOfWalls(pushed.x, pushed.y, C.PLAYER_RADIUS);
    p.x = Math.min(Math.max(pushed.x, C.PLAYER_RADIUS), C.WORLD_W - C.PLAYER_RADIUS);
    p.y = Math.min(Math.max(pushed.y, C.PLAYER_RADIUS), C.WORLD_H - C.PLAYER_RADIUS);

    // Cel nieosiągalny (gracz zablokowany o przeszkodę) — kasujemy, żeby nie drgał.
    const movedX = p.x - p.prevX;
    const movedY = p.y - p.prevY;
    if (p.hasMoveTarget && movedX * movedX + movedY * movedY < 0.01) {
      p.hasMoveTarget = false;
    }
  }

  /* ── Wrogowie ─────────────────────────────────────────────────────────── */

  /**
   * Losuje typ najeźdźcy spośród odblokowanych (wagi z ENEMIES).
   * Typy z limitem `maxAlive` wypadają z puli po osiągnięciu limitu.
   */
  private pickEnemyDef(elapsedSeconds: number): number {
    const eligible = (i: number): boolean => {
      const def = ENEMIES[i];
      if (def.unlockAtSeconds > elapsedSeconds) return false;
      if (def.maxAlive > 0 && this.aliveByType[i] >= def.maxAlive) return false;
      return true;
    };

    let totalWeight = 0;
    for (let i = 0; i < ENEMIES.length; i++) if (eligible(i)) totalWeight += ENEMIES[i].weight;
    if (totalWeight <= 0) return 0;

    let roll = this.rng.next() * totalWeight;
    for (let i = 0; i < ENEMIES.length; i++) {
      if (!eligible(i)) continue;
      roll -= ENEMIES[i].weight;
      if (roll <= 0) return i;
    }
    return 0;
  }

  /** Wstawia bossa fali na arenę (raz na falę). Definicja: src/sim/bosses/. */
  private spawnBoss(defId: string): void {
    const def = bossById(defId);
    const living = this.livingPlayers;
    if (!def || living.length === 0) return;
    const slot = this.findFreeMobSlot();
    if (slot === -1) return;

    const around = living[0];
    const angle = this.rng.range(0, Math.PI * 2);
    const m = this.mobs[slot];
    m.defIndex = 0;
    m.bossIndex = BOSSES.indexOf(def);
    m.x = Math.min(Math.max(around.x + Math.cos(angle) * 520, def.radius), C.WORLD_W - def.radius);
    m.y = Math.min(Math.max(around.y + Math.sin(angle) * 520, def.radius), C.WORLD_H - def.radius);
    m.prevX = m.x;
    m.prevY = m.y;
    // HP bossa rośnie z liczbą graczy — inaczej czterech ziomków rozłożyłoby
    // go zanim zdążyłby pokazać drugą fazę.
    const teamMult =
      1 + (living.length - 1) * (WAVE_CONFIG.bossHpPercentPerExtraPlayer / 100);
    m.hp = def.hp * this.enemyHpMult * teamMult;
    m.maxHp = m.hp;
    this.bossMaxHp = m.hp;
    m.speed = def.speed;
    m.state = 'chase';
    m.stateTicks = 0;
    m.phaseIndex = 0;
    m.attackIndex = 0;
    m.attackCooldown = def.phases[0].attackIntervalTicks;
    m.lastHitTick = -100;
    m.alive = true;
    this.aliveMobs++;
    this.bossMobIndices.push(slot);
    this.bossPhaseTick = this.tick;
    this.bossPhaseAnnounce = def.phases[0].announce;
  }

  private spawnMobs(debugSpawn: boolean): void {
    const living = this.livingPlayers;
    if (living.length === 0) return;

    // Bossowie pojawiają się RAZ, na początku swojej fali (może być ich kilku).
    // `bossesSpawned` chroni przed ponownym przyzwaniem po ich śmierci.
    const bossIds = this.bossWaves[this.wave];
    if (bossIds && !this.bossesSpawned) {
      for (const id of bossIds) this.spawnBoss(id);
      this.bossesSpawned = true;
    }

    const elapsedSeconds = this.tick * C.TICK_DT;
    // Liczba wrogów rośnie z falą ORAZ z liczbą graczy — inaczej co-op byłby
    // trywialny (ta sama horda rozłożona na ośmiu).
    const elite =
      WAVE_CONFIG.eliteEveryNWaves > 0 && this.wave % WAVE_CONFIG.eliteEveryNWaves === 0;
    const perPlayer = 1 + (living.length - 1) * (WAVE_CONFIG.mobsPercentPerExtraPlayer / 100);
    // Na fali z bossem zwykłych wrogów jest mniej — walka ma być o bossa.
    const bossWaveMult = this.isBossWave ? WAVE_CONFIG.bossWaveMobsPercent / 100 : 1;
    let target = Math.min(
      Math.round(
        (WAVE_CONFIG.mobsBase + (this.wave - 1) * WAVE_CONFIG.mobsPerWave) *
          (elite ? WAVE_CONFIG.eliteWaveMultiplier : 1) *
          perPlayer *
          bossWaveMult,
      ),
      C.MOB_CAP,
    );
    if (debugSpawn) target = Math.min(this.aliveMobs + 50, C.MOB_CAP);

    while (this.aliveMobs < target) {
      const slot = this.findFreeMobSlot();
      if (slot === -1) return;
      const m = this.mobs[slot];
      const defIndex = this.pickEnemyDef(elapsedSeconds);
      const def = ENEMIES[defIndex];
      // Spawn wokół losowego żywego gracza — presja rozkłada się na drużynę.
      const around = living[Math.floor(this.rng.next() * living.length)] ?? living[0];
      const angle = this.rng.range(0, Math.PI * 2);
      m.defIndex = defIndex;
      m.x = around.x + Math.cos(angle) * C.MOB_SPAWN_DISTANCE;
      m.y = around.y + Math.sin(angle) * C.MOB_SPAWN_DISTANCE;
      m.x = Math.min(Math.max(m.x, def.radius), C.WORLD_W - def.radius);
      m.y = Math.min(Math.max(m.y, def.radius), C.WORLD_H - def.radius);
      m.prevX = m.x;
      m.prevY = m.y;
      m.hp = def.hp * this.enemyHpMult;
      m.maxHp = m.hp;
      m.speed = this.rng.range(def.speedMin, def.speedMax);
      m.attackCooldown = def.ranged ? def.ranged.cooldownTicks : 0;
      m.state = 'chase';
      m.stateTicks = 0;
      m.windupStartTick = -100;
      m.lastSlamTick = -100;
      m.targetPlayer = around.index;
      this.clearStatuses(m);
      m.alive = true;
      this.aliveMobs++;
      this.aliveByType[defIndex]++;
    }
  }

  private findFreeMobSlot(): number {
    for (let i = 0; i < this.mobs.length; i++) if (!this.mobs[i].alive) return i;
    return -1;
  }

  private rebuildHash(): void {
    this.hash.clear();
    for (let i = 0; i < this.mobs.length; i++) {
      const m = this.mobs[i];
      if (m.alive) this.hash.insert(i, m.x, m.y);
    }
  }

  /** Najbliższy żywy gracz — cel polowania mobków. */
  private nearestLivingPlayer(x: number, y: number): Player | null {
    let best: Player | null = null;
    let bestD2 = Infinity;
    for (const p of this.players) {
      if (p.dead) continue;
      const dx = p.x - x;
      const dy = p.y - y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = p;
      }
    }
    return best;
  }

  private moveMobsAndAttack(): void {
    const separationRadius = C.MOB_RADIUS * 2;
    for (let i = 0; i < this.mobs.length; i++) {
      const m = this.mobs[i];
      if (!m.alive) continue;
      const def = ENEMIES[m.defIndex];

      let target = this.nearestLivingPlayer(m.x, m.y);
      if (!target) continue;
      // PROWOKACJA (`TauntSkill`) nadpisuje wybór celu: sprowokowany wróg idzie
      // na gracza, który go zawołał, nawet jeśli bliżej stoi ktoś inny. Wygasa
      // sama przez porównanie ticków — bez licznika i bez czyszczenia na respawnie.
      if (m.tauntUntilTick > this.tick) {
        const caller = this.players[m.tauntedBy];
        if (caller && !caller.dead) target = caller;
      }
      m.targetPlayer = target.index;

      // Boss ma własny cykl ataków i fazy — obsługiwany osobno. Sprawdzenie
      // ogłuszenia jest PO nim celowo: bossy są na nie odporne, tak samo jak
      // na odrzut. Inaczej dałoby się je przetrzymać w miejscu do śmierci.
      if (m.bossIndex >= 0) {
        this.stepBoss(m, BOSSES[m.bossIndex], target);
        continue;
      }

      // Ogłuszony nie robi NIC: ani kroku, ani zamachu, ani strzału.
      // `continue` zatrzymuje też odliczanie cooldownu ataku — o to chodzi.
      if (this.mobStunned(m)) continue;

      // STRACH: wróg ucieka od najbliższego zagrożenia i NIE atakuje. Kierunek
      // liczymy najpierw, bo zastępuje domyślne „na gracza"; resztę pętli
      // (rozpychanie, ruch) współdzielimy ze zwykłym zachowaniem.
      const feared = this.mobFeared(m);
      const dist = Math.sqrt((target.x - m.x) ** 2 + (target.y - m.y) ** 2) || 1;
      let dx: number;
      let dy: number;
      if (feared) {
        const threat = this.nearestThreatTo(m.x, m.y) ?? target;
        dx = m.x - threat.x;
        dy = m.y - threat.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        dx /= d;
        dy /= d;
        // Ucieczka przerywa zamach — inaczej po wygaśnięciu strachu wróg
        // dokończyłby stary cios „z zaskoczenia".
        m.state = 'chase';
      } else {
        dx = (target.x - m.x) / dist;
        dy = (target.y - m.y) / dist;
      }

      // advance: 1 = biegnie, 0 = stoi (zamach, ładowanie, odpoczynek).
      let advance = 1;
      if (m.attackCooldown > 0) m.attackCooldown--;

      if (feared) {
        // Przestraszony tylko biegnie — pomijamy całą maszynę ataków.
      } else if (m.state === 'windup' || m.state === 'recover') {
        advance = 0;
        m.stateTicks--;
        if (m.stateTicks <= 0) {
          if (m.state === 'windup') this.resolveWindup(m, def, target);
          else m.state = 'chase';
        }
      } else if (def.slam && dist <= def.slam.triggerRange && m.attackCooldown === 0) {
        // Ciężki wróg w zasięgu — zaczyna zamach (gracz ma czas odskoczyć).
        m.state = 'windup';
        m.stateTicks = def.slam.windupTicks;
        m.windupStartTick = this.tick;
        advance = 0;
      } else if (def.ranged) {
        // Strzelec trzyma dystans; strzał też ma telegraf.
        if (dist <= def.ranged.holdDistance) {
          advance = 0;
          if (m.attackCooldown === 0) {
            m.state = 'windup';
            m.stateTicks = def.ranged.windupTicks;
            m.windupStartTick = this.tick;
          }
        }
      }

      // Miękkie rozpychanie sąsiadów, żeby horda nie zlewała się w jeden punkt.
      const mobRadius = def.radius;
      const sep = Math.max(separationRadius, mobRadius * 2);
      let pushX = 0;
      let pushY = 0;
      this.hash.forEachNear(m.x, m.y, sep, (j) => {
        if (j === i) return;
        const o = this.mobs[j];
        const ox = m.x - o.x;
        const oy = m.y - o.y;
        const d2 = ox * ox + oy * oy;
        if (d2 > 0 && d2 < sep * sep) {
          const d = Math.sqrt(d2);
          const force = (sep - d) / sep;
          pushX += (ox / d) * force;
          pushY += (oy / d) * force;
        }
      });

      const slow = this.mobSpeedMultOf(m);
      m.x += (dx * m.speed * slow * advance + pushX * 60) * C.TICK_DT;
      m.y += (dy * m.speed * slow * advance + pushY * 60) * C.TICK_DT;

      // Przeszkody I ŚCIANY blokują najeźdźców (wypchnięcie = ślizganie po
      // brzegu). Ściany to mur buildera — mobki się o niego zatrzymują, nie
      // przechodzą przez niego. Bossów nie dotyczy (obsługiwane osobno).
      let pushed = this.pushOutOfObstacles(m.x, m.y, mobRadius);
      pushed = this.pushOutOfWalls(pushed.x, pushed.y, mobRadius);
      m.x = pushed.x;
      m.y = pushed.y;
    }
  }

  /* ── Boss: fazy i cykl ataków ─────────────────────────────────────────── */

  /**
   * Krok bossa. Zachowanie jest w całości sterowane deklaracją z pliku bossa
   * (src/sim/bosses/) — tutaj tylko wykonujemy to, co tam zapisane.
   */
  private stepBoss(m: Mob, def: BossDef, target: Player): void {
    // Wejście w kolejną fazę, gdy HP spadnie poniżej progu. Liczymy z WŁASNEGO
    // maxHp moba, nie ze wspólnego `bossMaxHp` — przy kilku bossach każdy fazuje
    // niezależnie na swoim pasku.
    const frac = m.maxHp > 0 ? m.hp / m.maxHp : 1;
    for (let i = def.phases.length - 1; i > m.phaseIndex; i--) {
      if (frac <= def.phases[i].hpFraction) {
        m.phaseIndex = i;
        m.attackIndex = 0;
        m.attackCooldown = def.phases[i].attackIntervalTicks;
        this.bossPhaseTick = this.tick;
        this.bossPhaseAnnounce = def.phases[i].announce;
        break;
      }
    }
    const phase = def.phases[m.phaseIndex];

    if (m.attackCooldown > 0) m.attackCooldown--;

    if (m.state === 'charging') {
      // Szarża: boss pędzi po prostej i rani wszystkich po drodze.
      m.stateTicks--;
      m.x = Math.min(Math.max(m.x + m.chargeVX * C.TICK_DT, def.radius), C.WORLD_W - def.radius);
      m.y = Math.min(Math.max(m.y + m.chargeVY * C.TICK_DT, def.radius), C.WORLD_H - def.radius);
      const reach = m.chargeRadius + C.PLAYER_RADIUS;
      for (const p of this.players) {
        if (p.dead) continue;
        const dx = p.x - m.x;
        const dy = p.y - m.y;
        if (dx * dx + dy * dy <= reach * reach) {
          this.damagePlayer(p, m.chargeDamage * this.enemyDamageMult);
        }
      }
      if (m.stateTicks <= 0) {
        m.state = 'recover';
        m.stateTicks = m.attackCooldown = phase.attackIntervalTicks;
      }
      return;
    }

    if (m.state === 'windup' || m.state === 'recover') {
      m.stateTicks--;
      if (m.stateTicks <= 0) {
        if (m.state === 'windup') this.executeBossAttack(m, def, phase.attacks[m.attackIndex], target);
        else m.state = 'chase';
      }
      return;
    }

    // Chase: podchodzi do gracza i czeka na moment ataku.
    let dx = target.x - m.x;
    let dy = target.y - m.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    dx /= dist;
    dy /= dist;
    m.x += dx * def.speed * phase.speedMult * C.TICK_DT;
    m.y += dy * def.speed * phase.speedMult * C.TICK_DT;
    const pushed = this.pushOutOfObstacles(m.x, m.y, def.radius);
    m.x = pushed.x;
    m.y = pushed.y;

    if (m.attackCooldown <= 0) {
      const attack = phase.attacks[m.attackIndex];
      m.state = 'windup';
      m.stateTicks = attack.windupTicks;
      m.windupStartTick = this.tick;
    }
  }

  /** Wykonanie pojedynczego ataku bossa po zakończeniu zamachu. */
  private executeBossAttack(m: Mob, def: BossDef, attack: BossAttack, target: Player): void {
    const phase = def.phases[m.phaseIndex];

    switch (attack.kind) {
      case 'slam': {
        m.lastSlamTick = this.tick;
        const reach = attack.hitRadius + C.PLAYER_RADIUS;
        for (const p of this.players) {
          if (p.dead) continue;
          const dx = p.x - m.x;
          const dy = p.y - m.y;
          if (dx * dx + dy * dy <= reach * reach) {
            this.damagePlayer(p, attack.damage * this.enemyDamageMult);
          }
        }
        m.state = 'recover';
        m.stateTicks = attack.recoverTicks;
        break;
      }
      case 'ring': {
        // Pociski równomiernie w okręgu — luka do wybiegnięcia zawsze istnieje.
        for (let i = 0; i < attack.count; i++) {
          const a = (i / attack.count) * Math.PI * 2;
          this.spawnProjectile(
            m.x, m.y,
            Math.cos(a) * attack.projectileSpeed,
            Math.sin(a) * attack.projectileSpeed,
            attack.damage * this.enemyDamageMult,
          );
        }
        m.state = 'recover';
        m.stateTicks = attack.recoverTicks;
        break;
      }
      case 'charge': {
        const dx = target.x - m.x;
        const dy = target.y - m.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        m.chargeVX = (dx / d) * attack.speed;
        m.chargeVY = (dy / d) * attack.speed;
        m.chargeRadius = attack.hitRadius;
        m.chargeDamage = attack.damage;
        m.state = 'charging';
        m.stateTicks = attack.durationTicks;
        break;
      }
      case 'summon': {
        const defIndex = ENEMIES.findIndex((e) => e.id === attack.enemyId);
        if (defIndex >= 0) {
          for (let i = 0; i < attack.count; i++) {
            const a = this.rng.range(0, Math.PI * 2);
            this.spawnMobAt(defIndex, m.x + Math.cos(a) * 90, m.y + Math.sin(a) * 90);
          }
        }
        m.state = 'recover';
        m.stateTicks = attack.recoverTicks;
        break;
      }
    }

    // Kolejny atak z cyklu fazy.
    m.attackIndex = (m.attackIndex + 1) % phase.attacks.length;
    m.attackCooldown = phase.attackIntervalTicks;
  }

  /**
   * Koniec zamachu: młot Brute'a trafia w obszar (jeśli gracz nie uciekł),
   * a mag wypuszcza pocisk. Potem wróg przechodzi w fazę bezbronności.
   */
  private resolveWindup(m: Mob, def: EnemyDef, target: Player): void {
    if (def.slam) {
      m.lastSlamTick = this.tick;
      const reach = def.slam.hitRadius + C.PLAYER_RADIUS;
      // Młot rani KAŻDEGO gracza w obszarze — w co-opie nie stójcie w kupie.
      for (const p of this.players) {
        if (p.dead) continue;
        const dx = p.x - m.x;
        const dy = p.y - m.y;
        if (dx * dx + dy * dy <= reach * reach) {
          this.damagePlayer(p, def.slam.damage * this.enemyDamageMult);
        }
      }
      m.state = 'recover';
      m.stateTicks = def.slam.recoverTicks;
      m.attackCooldown = def.slam.recoverTicks;
      return;
    }
    if (def.ranged) {
      const dx = target.x - m.x;
      const dy = target.y - m.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      this.fireProjectile(m.x, m.y, dx / d, dy / d, def);
      m.attackCooldown = def.ranged.cooldownTicks;
    }
    m.state = 'chase';
  }

  private fireProjectile(x: number, y: number, dirX: number, dirY: number, def: EnemyDef): void {
    const r = def.ranged;
    if (!r) return;
    this.spawnProjectile(
      x, y,
      dirX * r.projectileSpeed,
      dirY * r.projectileSpeed,
      r.projectileDamage * this.enemyDamageMult,
    );
  }

  /** Opcjonalne zachowanie pocisku — bez tego leci prosto i ginie na pierwszym celu. */
  private static readonly PLAIN_SHOT = {
    chains: 0, chainRange: 0, chainFalloff: 1, blastRadius: 0, ownerIndex: -1,
  };

  /** Wspólny spawner pocisków — używany przez magów, bossy i skille graczy. */
  private spawnProjectile(
    x: number, y: number, vx: number, vy: number, damage: number, friendly = false,
    opts: {
      chains?: number; chainRange?: number; chainFalloff?: number;
      blastRadius?: number; ownerIndex?: number; visual?: string;
    } = World.PLAIN_SHOT,
  ): Projectile | null {
    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      if (p.alive) continue;
      p.alive = true;
      p.x = x;
      p.y = y;
      p.prevX = x;
      p.prevY = y;
      p.vx = vx;
      p.vy = vy;
      p.ttl = C.PROJECTILE_TTL_TICKS;
      p.damage = damage;
      p.friendly = friendly;
      // Slot wraca z poola po innym pocisku — KAŻDE pole trzeba nadpisać,
      // inaczej zwykły strzał odziedziczyłby łańcuch po poprzedniku.
      p.chainsLeft = opts.chains ?? 0;
      p.chainRange = opts.chainRange ?? 0;
      p.chainFalloff = opts.chainFalloff ?? 1;
      p.blastRadius = opts.blastRadius ?? 0;
      p.ownerIndex = opts.ownerIndex ?? -1;
      p.visual = opts.visual ?? '';
      p.chainId = this.nextChainId++;
      return p;
    }
    return null;
  }

  /** Stawia wroga w konkretnym miejscu (przyzywanie przez bossa). */
  private spawnMobAt(defIndex: number, x: number, y: number): void {
    const slot = this.findFreeMobSlot();
    if (slot === -1) return;
    const def = ENEMIES[defIndex];
    const m = this.mobs[slot];
    m.defIndex = defIndex;
    m.bossIndex = -1;
    m.x = Math.min(Math.max(x, def.radius), C.WORLD_W - def.radius);
    m.y = Math.min(Math.max(y, def.radius), C.WORLD_H - def.radius);
    m.prevX = m.x;
    m.prevY = m.y;
    m.hp = def.hp * this.enemyHpMult;
    m.maxHp = m.hp;
    m.speed = this.rng.range(def.speedMin, def.speedMax);
    m.attackCooldown = def.ranged ? def.ranged.cooldownTicks : 0;
    m.state = 'chase';
    m.stateTicks = 0;
    m.lastHitTick = -100;
    // Slot wraca z poola po innym wrogu — bez tego nowy dziedziczyłby
    // trucizny i spowolnienia poprzednika.
    this.clearStatuses(m);
    m.alive = true;
    this.aliveMobs++;
    this.aliveByType[defIndex]++;
  }

  private stepProjectiles(): void {
    const hitDist = C.PROJECTILE_RADIUS + C.PLAYER_RADIUS;
    const hit2 = hitDist * hitDist;
    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      if (!p.alive) continue;
      // W zatrzymanym czasie WROGIE pociski wiszą nieruchomo — także ich
      // licznik życia stoi, więc po odmrożeniu lecą dalej zamiast zniknąć.
      // Nasze lecą normalnie; na tym polega cała fantazja tej umiejętności.
      if (this.timeStopTicks > 0 && !p.friendly) continue;
      p.x += p.vx * C.TICK_DT;
      p.y += p.vy * C.TICK_DT;
      p.ttl--;
      if (p.ttl <= 0) {
        p.alive = false;
        continue;
      }
      // Pociski rozbijają się o przeszkody — teren działa jak osłona.
      if (this.projectileHitsObstacle(p.x, p.y)) {
        p.alive = false;
        continue;
      }
      if (p.friendly) {
        // Pocisk sojuszniczy szuka WROGA. Ostatnio trafiony jest pomijany,
        // żeby odbicie nie wracało natychmiast na ten sam cel.
        let hitIndex = -1;
        this.hash.forEachNear(p.x, p.y, C.PROJECTILE_RADIUS + C.MOB_RADIUS_MAX, (mi) => {
          if (hitIndex >= 0) return;
          const m = this.mobs[mi];
          if (!m.alive || m.chainMark === p.chainId) return;
          const reach = C.PROJECTILE_RADIUS + ENEMIES[m.defIndex].radius;
          const dx = p.x - m.x;
          const dy = p.y - m.y;
          if (dx * dx + dy * dy <= reach * reach) hitIndex = mi;
        });
        if (hitIndex >= 0) this.resolveFriendlyHit(p, hitIndex);
        continue;
      }

      // Pocisk trafia pierwszego gracza na drodze.
      for (const pl of this.players) {
        if (pl.dead) continue;
        const dx = p.x - pl.x;
        const dy = p.y - pl.y;
        if (dx * dx + dy * dy <= hit2) {
          p.alive = false;
          this.damagePlayer(pl, p.damage);
          break;
        }
      }
    }
  }

  /**
   * Trafienie pociskiem sojuszniczym: obrażenia, ewentualny wybuch, a na
   * końcu próba ODBICIA na kolejnego wroga. Pocisk ginie dopiero wtedy, gdy
   * skończą mu się odbicia albo nie ma dokąd skoczyć — dzięki temu „łańcuch
   * błyskawic ×20" to ta sama ścieżka kodu co zwykły strzał wieżyczki.
   */
  private resolveFriendlyHit(p: Projectile, mobIndex: number): void {
    const owner = this.players[p.ownerIndex] ?? this.players[0];
    const target = this.mobs[mobIndex];
    const blastRadius = p.blastRadius;
    // Zapamiętane PRZED zabiciem celu: `killMob` może wyzerować pozycję,
    // a łańcuch i wybuch mają wychodzić z miejsca trafienia.
    const hx = target.x;
    const hy = target.y;

    // Znaczymy cel PRZED zadaniem obrażeń — dzięki temu ani kolizja, ani
    // kolejne odbicie tego pocisku już na niego nie wrócą.
    target.chainMark = p.chainId;
    this.damageMobByProjectile(target, p.damage, owner);

    if (blastRadius > 0) {
      this.hash.forEachNear(hx, hy, blastRadius + C.MOB_RADIUS_MAX, (mi) => {
        if (mi === mobIndex) return;
        const m = this.mobs[mi];
        if (!m.alive) return;
        const reach = blastRadius + ENEMIES[m.defIndex].radius;
        const dx = m.x - hx;
        const dy = m.y - hy;
        if (dx * dx + dy * dy > reach * reach) return;
        this.damageMobByProjectile(m, p.damage, owner);
      });
    }

    if (p.chainsLeft <= 0) {
      p.alive = false;
      return;
    }
    const next = this.nearestMobTo(hx, hy, p.chainRange, p.chainId);
    if (!next) {
      p.alive = false;
      return;
    }

    // Pocisk NIE ginie — przeskakuje w miejsce trafienia i skręca w nowy cel
    // z tą samą prędkością, z jaką leciał.
    const dx = next.x - hx;
    const dy = next.y - hy;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1;
    p.x = hx;
    p.y = hy;
    p.prevX = hx;
    p.prevY = hy;
    p.vx = (dx / d) * speed;
    p.vy = (dy / d) * speed;
    p.damage *= p.chainFalloff;
    p.chainsLeft--;
    // Bez odnowienia licznika długi łańcuch wygasłby w połowie drogi.
    p.ttl = C.PROJECTILE_TTL_TICKS;
  }

  private damageMobByProjectile(m: Mob, damage: number, owner: Player): void {
    m.hp -= damage;
    m.lastHitTick = this.tick;
    if (m.hp <= 0) this.killMob(m, owner);
  }

  /* ── Walka gracza ─────────────────────────────────────────────────────── */

  private applyMelee(p: Player): void {
    // PLACEHOLDER modelu walki (pełne koło co interwał klasy) — docelowy model
    // to otwarta decyzja w gdd.md 5.1; wymiana tej metody nie rusza reszty.
    p.meleeCooldown--;
    if (p.meleeCooldown > 0) return;
    p.meleeCooldown = this.meleeIntervalOf(p);
    p.lastMeleeTick = this.tick;

    const range = this.meleeRangeOf(p);
    // Oś „pod auto": `attackDamageMult` mnoży TYLKO cios podstawowy (i jego
    // rykoszet), nie skille. Skille jadą przez `skillDamageOf`.
    const baseMeleeDamage = this.meleeDamageOf(p) * p.attackDamageMult;

    // FOCUS (unit-select): z wybranym celem auto-atak bije WYŁĄCZNIE jego — o ile
    // jest w zasięgu (poza zasięgiem cios idzie w próżnię, bo gracz właśnie do
    // niego podchodzi). Bez celu — dotychczasowe AoE (pełne koło).
    if (p.targetMob >= 0) {
      const idx = p.targetMob;
      const m = this.mobs[idx];
      if (m && m.alive) {
        const reach =
          range + (m.bossIndex >= 0 ? BOSSES[m.bossIndex].radius : ENEMIES[m.defIndex].radius);
        const dx = m.x - p.x;
        const dy = m.y - p.y;
        if (dx * dx + dy * dy <= reach * reach) {
          m.hp -= this.rollDamage(p, baseMeleeDamage, m);
          m.lastHitTick = this.tick;
          this.applyOnHit(p, m);
          // Kill czyści `targetMob`, więc rykoszet strzela z zapamiętanego `idx`.
          if (m.hp <= 0) this.killMob(m, p);
          this.spawnMeleeRicochet(p, idx);
        }
      }
      return;
    }

    // Pierwszy trafiony jest źródłem rykoszetu (pasywka Thunder Fang).
    let firstHit = -1;
    this.hash.forEachNear(p.x, p.y, range + C.MOB_RADIUS_MAX, (i) => {
      const m = this.mobs[i];
      if (!m.alive) return;
      const reach = range + ENEMIES[m.defIndex].radius;
      const dx = m.x - p.x;
      const dy = m.y - p.y;
      if (dx * dx + dy * dy > reach * reach) return;
      if (firstHit < 0) firstHit = i;
      m.hp -= this.rollDamage(p, baseMeleeDamage, m);
      m.lastHitTick = this.tick;
      this.applyOnHit(p, m);
      if (m.hp <= 0) this.killMob(m, p);
    });

    if (firstHit >= 0) this.spawnMeleeRicochet(p, firstHit);
  }

  /**
   * `onHit` (SCURRY): efekt doczepiony do KAŻDEGO auto-ataku, który zadał
   * obrażenia. Leczenie-na-trafienie leci zawsze (nawet gdy cios dobija —
   * ugryzłeś, więc się żywisz), status tylko na wroga, który przeżył (na trupa
   * bez sensu). Dla każdej innej klasy `onHitStatus === -1` i `onHitLifesteal
   * === 0`, więc to dwa tanie odczyty i wyjście — zero kosztu w gorącej pętli.
   */
  private applyOnHit(p: Player, m: Mob): void {
    if (p.onHitLifesteal > 0) {
      p.hp = Math.min(this.maxHpOf(p), p.hp + p.onHitLifesteal);
    }
    if (p.onHitStatus >= 0 && m.hp > 0) this.applyStatus(m, p.onHitStatus, p.index);
    // NEUTRON CORE (legendarka bear-gravity): auto-atak nakłada GRAVITY DRAG.
    if (m.hp > 0 && STATUS_GRAVITY_DRAG >= 0 && p.uniqueEffects.has('neutron-core')) {
      this.applyStatus(m, STATUS_GRAVITY_DRAG, p.index);
    }
  }

  /**
   * Power Slash — aktywny skill hybrydy z celowaniem: spacja otwiera celowanie
   * (UI), LMB zatwierdza — cios idzie stożkiem 120° w kierunku punktu aim.
   */
  /**
   * Rzut na trafienie krytyczne — jedyne miejsce, w którym gracz zadaje
   * obrażenia „przez losowanie". Losowość idzie z seedowanego RNG symulacji,
   * więc w co-opie każdy klient wylosuje ten sam kryt w tym samym ticku.
   */
  private rollDamage(p: Player, base: number, target?: Mob): number {
    /**
     * PODATNOŚĆ celu mnoży trafienie, jeszcze przed rzutem na kryta.
     *
     * Do tej pory `vulnerability` wchodziło WYŁĄCZNIE w tyknięcia statusów
     * i aur, więc `weaken` — opisany jako „wróg obrywa mocniej od wszystkiego"
     * — nie robił nic ciosom gracza. Osłabienie działało na trucizny, ale nie
     * na miecz, co jest odwrotnością tego, po co się je nakłada.
     *
     * `target` jest opcjonalny, bo pociski liczą obrażenia ZANIM poznają cel
     * (wachlarz leci w kursor, a odbicia szukają następnego moba dopiero po
     * trafieniu). Tam podatność nadal nie wchodzi — to osobna zmiana.
     */
    let dmg = target ? base * this.mobVulnerabilityOf(target) : base;
    // CACKLE (hiena): EGZEKUCJA — im bardziej ranny CEL, tym mocniej go bijesz
    // („laughs at the wounded"). Ułamek HP z `Mob.maxHp`: przy pełnym życiu
    // bonus zerowy, przy bliskim śmierci pełny. Pociski bez celu (`target`
    // pominięty) go nie łapią — liczą obrażenia, zanim poznają wroga.
    if (target && p.executeToDamage > 0 && target.maxHp > 0) {
      dmg *= 1 + Math.max(0, 1 - target.hp / target.maxHp) * p.executeToDamage;
    }
    // DEADEYE SCOPE (legendarka mole-sniper): trafienie w cel z PEŁNYM HP bije
    // +200% — nagroda za „opening shot" (naturalnie łapie pierwszy strzał snajpera).
    if (target && target.maxHp > 0 && target.hp >= target.maxHp && p.uniqueEffects.has('deadeye-scope')) {
      dmg *= 3;
    }
    // EVENT HORIZON (legendarka bear-gravity): cel pod GRAVITY DRAG obrywa +30%
    // od Ciebie — combo z Twoimi studniami grawitacji (spowolnij → zmiażdż).
    if (
      target && STATUS_GRAVITY_DRAG >= 0 && p.uniqueEffects.has('event-horizon') &&
      target.statuses.some((st) => st.defIndex === STATUS_GRAVITY_DRAG)
    ) {
      dmg *= 1.3;
    }
    // Szansa bazowa (romby) + gear, clamp na SUMIE do `critChanceMax`. RNG rusza
    // dopiero po sprawdzeniu `crit > 0` — bez gearu to bit-w-bit stare zachowanie.
    const crit = Math.min(ITEM_CAPS.critChanceMax, p.critChance + p.gearCritChance);
    if (crit <= 0) return dmg;
    if (this.rng.next() * 100 >= crit) return dmg;
    p.lastCritTick = this.tick;
    return dmg * p.critDamageMult;
  }

  private applySkill(p: Player, input: SimInput): void {
    for (let i = 0; i < p.skillCooldowns.length; i++) {
      if (p.skillCooldowns[i] > 0) p.skillCooldowns[i]--;
    }

    const slot = input.skillCast;
    const validSlot = slot >= 0 && slot < p.skillIds.length;

    // Kierunek ciosu: od gracza do punktu celowania; fallback = kierunek patrzenia.
    let dirX = input.aimX - p.x;
    let dirY = input.aimY - p.y;
    const dirLen = Math.sqrt(dirX * dirX + dirY * dirY);
    if (dirLen < 0.001) {
      dirX = p.facingX;
      dirY = p.facingY;
    } else {
      dirX /= dirLen;
      dirY /= dirLen;
    }

    // COMBO idzie PRZED sprawdzeniem slotu: Thunder Fang ma sloty puste, więc
    // gdyby zostało niżej, jego wciśnięcia nigdy by tu nie dotarły.
    this.stepCombos(p, validSlot ? slot : -1, input, dirX, dirY);

    if (!validSlot) return;
    const skill = this.skillOf(p, slot);
    if (!skill) return;

    /**
     * ZSIADANIE Z FALI — drugie wciśnięcie tego samego klawisza kończy jazdę.
     *
     * Idzie PRZED bramką cooldownu, bo surf ma 7 s odnowienia: gdyby zostało
     * niżej, wciśnięcie w locie odbiłoby się od cooldownu i gracz jechałby
     * do końca dystansu bez względu na to, czy nadal tego chce.
     *
     * Warunek na `ride` jest istotny: zwykły doskok i Leap Strike zająca też
     * są `leap`, a ich nikt nie ma prawa przerywać w połowie — trwają jedną
     * szóstą sekundy i całą ich treścią jest lądowanie.
     */
    if (
      skill.kind === 'leap' && p.dashTicksLeft > 0 &&
      p.activeDashId === skill.dashId && dashById(p.activeDashId).ride
    ) {
      p.dashTicksLeft = 0;
      return;
    }

    // Skill „summon-lub-komenda" z JUŻ POSTAWIONĄ jednostką omija bramkę
    // cooldownu slotu: to komenda, a nie stawianie, i ma własny cooldown
    // (na jednostce). Bez tego 14 s cooldownu przywołania blokowałoby też
    // sterowanie duchem.
    const isCommandPress =
      skill.kind === 'summon' && skill.commandsMinion &&
      this.minions.some(
        (mi) => mi.alive && mi.ownerIndex === p.index &&
          mi.defIndex === MINIONS.indexOf(minionById(skill.minionId)!),
      );

    if (!isCommandPress && p.skillCooldowns[slot] > 0) return;
    if (!isCommandPress) p.skillCooldowns[slot] = this.skillCooldownTicksOf(p, slot);
    p.lastSkillTick = this.tick;
    p.lastSkillDirX = dirX;
    p.lastSkillDirY = dirY;

    // Skill przywołujący stawia jednostkę i na tym kończy — reszta tej metody
    // dotyczy wyłącznie ciosów w stożku.
    if (skill.kind === 'summon') {
      this.castSummon(p, skill, input, dirX, dirY, slot);
      return;
    }

    // Stop czasu: jedna liczba w świecie, resztą zajmuje się `step`.
    if (skill.kind === 'timestop') {
      this.timeStopTicks = Math.max(this.timeStopTicks, skill.durationTicks);
      return;
    }

    // Blink ma cast DWUETAPOWY, więc sam zarządza swoim cooldownem.
    if (skill.kind === 'blink') {
      this.castBlink(p, skill, input, dirX, dirY, slot);
      return;
    }

    // Zamiana miejsc z własnym klonem — sam zwraca cooldown, gdy nie ma z kim.
    if (skill.kind === 'phaseSwap') {
      this.castPhaseSwap(p, skill, input, slot);
      return;
    }

    // Dociągnięcie: lina leci w kursor i chwyta pierwszą jednostkę. Dalej
    // wszystkim steruje `stepHooks`, więc ta metoda tylko wypuszcza linę.
    if (skill.kind === 'hook') {
      this.castHook(p, skill, dirX, dirY);
      return;
    }

    // Prowokacja: wrogowie w promieniu są zmuszeni atakować gracza.
    if (skill.kind === 'taunt') {
      this.castTaunt(p, skill);
      return;
    }

    // Detonacja (RUPTURE): zjada zarazę z wrogów wokół i zamienia stacki w burst.
    if (skill.kind === 'detonate') {
      this.castDetonate(p, skill);
      return;
    }

    // Kanałowanie: gracz staje i sączy efekt, dopóki się nie ruszy (`stepChannels`).
    if (skill.kind === 'channel') {
      this.castChannel(p, skill, input, dirX, dirY);
      return;
    }

    // Bariera: tymczasowa geometria kolizji w punkcie pod kursorem.
    if (skill.kind === 'wall') {
      this.castWall(p, skill, input, dirX, dirY);
      return;
    }

    // Wzmocnienie na czas: nie zadaje obrażeń, tylko zmienia zwykłe ciosy.
    if (skill.kind === 'empower') {
      p.empowerTicks = skill.durationTicks;
      p.empowerAttackSpeed = skill.attackSpeed;
      // Arcane Surge lisa to STRZAŁY, nie błyskawice — wygląd domyślny.
      this.setChainBuff(p, skill.name, skill.durationTicks, -1, skill.chain, '');
      return;
    }

    // Transformacja: włącza FORMĘ na czas — zapisuje mnożniki i licznik, resztą
    // (dokładaniem statów, wygaśnięciem) zajmuje się `stepAuras`.
    if (skill.kind === 'transform') {
      p.transformTicks = skill.durationTicks;
      p.transformMaxTicks = skill.durationTicks;
      p.transformDamageMult = skill.damageMult;
      p.transformSpeedMult = skill.speedMult;
      p.transformAttackSpeedMult = skill.attackSpeedMult;
      p.transformArmorBonus = skill.armorBonus;
      p.transformKillExtend = skill.killExtendTicks ?? 0;
      return;
    }

    // Aura na czas: zapala licznik i tyle — resztą zajmuje się `stepAuras`.
    if (skill.kind === 'aura') {
      const index = AURAS.findIndex((a) => a.id === skill.auraId);
      if (index >= 0) p.auraTicks[index] = skill.durationTicks;
      return;
    }

    // Strzał: wachlarz pocisków w kursor. Dalej leci już silnikiem pocisków,
    // więc odbicia i wybuch nie dotykają tej metody.
    if (skill.kind === 'projectile') {
      this.castProjectile(p, skill, dirX, dirY);
      return;
    }

    // Skok bojowy: odpalamy ten sam doskok, którego używa spacja, tylko
    // wskazany przez umiejętność. Zero powielonego kodu skoku.
    if (skill.kind === 'leap') {
      this.startDash(p, dashById(skill.dashId), dirX, dirY);
      // Reset dasha po skoku bojowym byłby resetem samego siebie — pętla
      // bez przestoju. Dlatego zerujemy cooldown TYLKO doskoku spod spacji.
      if (skill.resetsDash) p.dashCooldown = 0;
      return;
    }

    // Trafienie umiejętnością odnawia doskok — silnik buildu skoczka.
    // Nie sprawdzamy, czy faktycznie kogoś trafiło: w hordzie i tak zawsze
    // trafia, a warunek „musisz trafić" karałby za pudło w pustym polu.
    if (skill.resetsDash) p.dashCooldown = 0;

    // Wszystkie parametry z definicji umiejętności — podmiana skilla przez
    // talent zmienia zachowanie bez dotykania tego kodu.
    const range = this.meleeRangeOf(p) * skill.rangeMult;
    const baseDamage = this.skillDamageOf(p, skill.damageMult);
    const knockback = skill.knockback * p.knockbackMult;
    let statusIndex = skill.status ? statusIndexById(skill.status) : -1;
    // RAILGUN BARREL (legendarka mole-sniper): SNIPER SHOT ogłusza trafionych.
    if (skill.id === 'sniper-shot' && STATUS_STUN >= 0 && p.uniqueEffects.has('railgun-barrel')) {
      statusIndex = STATUS_STUN;
    }
    // FLING (wydra PLAYFUL): bonus przy zderzeniu = obrażenia zwarcia × `fling`.
    const flingBonus = skill.fling ? this.skillDamageOf(p, skill.fling) : 0;
    this.applyCone(p, p.x, p.y, dirX, dirY, range, baseDamage, skill.coneCos, knockback, statusIndex, flingBonus);

    // SWIPE alfy: ten sam cios POWTARZA każdy sojuszniczy minion gracza,
    // ze swojej pozycji i w tym samym kierunku. Dlatego siła tej gałęzi
    // rośnie z liczbą wilków, a nie z liczb na samej umiejętności.
    // Klony wydry jadą na dokładnie tym samym mechanizmie.
    if (skill.packEcho) {
      for (const mi of this.minions) {
        if (!mi.alive || mi.ownerIndex !== p.index) continue;
        this.applyCone(p, mi.x, mi.y, dirX, dirY, range, baseDamage, skill.coneCos, knockback, statusIndex, flingBonus);
        // SHATTER: jednostka rozpryskuje się zaraz po powtórzeniu ciosu.
        if (skill.consumesEcho) mi.alive = false;
      }
    }

    // Klon zostaje DOPIERO TERAZ, w miejscu, z którego padł cios — gdyby
    // powstał wcześniej, powtórzyłby ten sam cios z pozycji gracza i jedno
    // wciśnięcie liczyłoby się podwójnie.
    if (skill.spawns) {
      const def = minionById(skill.spawns.minionId);
      if (def) {
        const n = skill.spawns.count;
        for (let i = 0; i < n; i++) {
          // Rozstawienie w poprzek kierunku ciosu — dwa klony w jednym punkcie
          // wyglądałyby jak jeden i tną dokładnie tę samą linię.
          const off = n === 1 ? 0 : (i - (n - 1) / 2) * 34;
          this.spawnMinion(def, p.index, p.x - dirY * off, p.y + dirX * off);
        }
      }
    }
  }

  /**
   * Cios w stożku z DOWOLNEGO punktu. Wyodrębnione, bo Swipe alfy odpala
   * ten sam stożek raz z gracza i raz z każdego jego wilka — bez tego
   * `packEcho` byłby kopią trzydziestu linijek.
   *
   * `coneCos: -1` daje stożek 360°, czyli nowę wokół punktu — z tego korzysta
   * i Shock Nova zająca, i fala wydry sunąca za graczem (`rideWave`).
   */
  private applyCone(
    p: Player, ox: number, oy: number, dirX: number, dirY: number,
    range: number, baseDamage: number, coneCos: number, knockback: number,
    statusIndex = -1, flingBonus = 0,
  ): void {
    this.hash.forEachNear(ox, oy, range + C.MOB_RADIUS_MAX, (i) => {
      const m = this.mobs[i];
      if (!m.alive) return;
      const reach = range + ENEMIES[m.defIndex].radius;
      const dx = m.x - ox;
      const dy = m.y - oy;
      const d2 = dx * dx + dy * dy;
      if (d2 > reach * reach || d2 === 0) return;
      const d = Math.sqrt(d2);
      // Test stożka: kąt między kierunkiem celowania a wektorem do moba.
      if ((dx / d) * dirX + (dy / d) * dirY < coneCos) return;
      m.hp -= this.rollDamage(p, baseDamage, m);
      m.lastHitTick = this.tick;
      if (m.hp <= 0) {
        this.killMob(m, p);
        return;
      }
      // Status PO obrażeniach: inaczej `soaked` nałożony tym samym ciosem
      // podbijałby sam siebie, a każde kolejne cięcie liczyłoby się podwójnie.
      if (statusIndex >= 0) this.applyStatus(m, statusIndex, p.index);
      // Bossa nie da się odepchnąć — inaczej dałoby się go zaganiać w róg.
      if (m.bossIndex >= 0) return;
      // Knockback z respektowaniem przeszkód — mob nie wyląduje w ścianie.
      const intX = m.x + (dx / d) * knockback;
      const intY = m.y + (dy / d) * knockback;
      const kb = this.pushOutOfObstacles(intX, intY, ENEMIES[m.defIndex].radius);
      const finalX = Math.min(Math.max(kb.x, C.MOB_RADIUS), C.WORLD_W - C.MOB_RADIUS);
      const finalY = Math.min(Math.max(kb.y, C.MOB_RADIUS), C.WORLD_H - C.MOB_RADIUS);
      // FLING (pinball wydry PLAYFUL): jeśli odepchnięty wróg WALI w innego
      // wroga albo w ścianę/przeszkodę/granicę (lot przycięty względem zamiaru),
      // obrywa bonus. Zderzenia z wrogiem szukamy w miejscu lądowania.
      if (flingBonus > 0) {
        const blocked = (finalX - intX) ** 2 + (finalY - intY) ** 2 > 4;
        let hitMob = false;
        this.hash.forEachNear(finalX, finalY, ENEMIES[m.defIndex].radius + C.MOB_RADIUS_MAX, (j) => {
          if (hitMob) return;
          const o = this.mobs[j];
          if (!o.alive || o === m || o.bossIndex >= 0) return;
          const rr = ENEMIES[m.defIndex].radius + ENEMIES[o.defIndex].radius;
          const ex = o.x - finalX;
          const ey = o.y - finalY;
          if (ex * ex + ey * ey <= rr * rr) hitMob = true;
        });
        if (blocked || hitMob) {
          m.hp -= this.rollDamage(p, flingBonus, m);
          m.lastHitTick = this.tick;
          if (m.hp <= 0) { this.killMob(m, p); return; }
        }
      }
      m.x = finalX;
      m.y = finalY;
    });
  }

  /**
   * Bufor combo: upkeep co tick i rozpoznanie sekwencji przy wciśnięciu.
   * `slot` = -1 w tickach bez wciśnięcia (wtedy tylko odliczamy czas).
   */
  private stepCombos(
    p: Player, slot: number, input: SimInput, dirX: number, dirY: number,
  ): void {
    for (let i = 0; i < p.comboCooldowns.length; i++) {
      if (p.comboCooldowns[i] > 0) p.comboCooldowns[i]--;
    }
    // Wzmocnienie rykoszetu wygasa samo — i to jest jedyne miejsce, w którym
    // odliczamy czas, niezależnie od tego, czy dał je combo czy skill.
    if (p.chainBuffTicks > 0) {
      p.chainBuffTicks--;
      if (p.chainBuffTicks === 0) this.clearChainBuff(p);
    }
    if (p.empowerTicks > 0) p.empowerTicks--;
    if (p.blinkTicks > 0) p.blinkTicks--;
    if (p.comboIds.length === 0) return;

    // Cisza dłuższa niż okno kasuje niedokończoną sekwencję.
    if (p.comboSeq.length > 0) {
      p.comboIdleTicks++;
      if (p.comboIdleTicks > COMBO_WINDOW_TICKS) {
        p.comboSeq.length = 0;
        p.comboIdleTicks = 0;
      }
    }
    if (slot < 0) return;

    p.comboSeq.push(slot);
    if (p.comboSeq.length > COMBO_BUFFER) p.comboSeq.shift();
    p.comboIdleTicks = 0;

    // Dopasowujemy CAŁĄ sekwencję dopiero na trzecim klawiszu — `q→w→e`
    // i `q→w→q` różnią się właśnie nim.
    for (const id of p.comboIds) {
      const index = COMBOS.findIndex((c) => c.id === id);
      if (index < 0 || p.comboCooldowns[index] > 0) continue;
      if (!seqEndsWith(p.comboSeq, COMBOS[index].sequence)) continue;
      this.fireCombo(p, index, input, dirX, dirY);
      p.comboSeq.length = 0;
      return;
    }
  }

  private fireCombo(
    p: Player, index: number, input: SimInput, dirX: number, dirY: number,
  ): void {
    const combo = COMBOS[index];
    const cd = Math.max(ITEM_CAPS.minCooldownMult, p.cooldownMult * p.gearCooldownMult);
    p.comboCooldowns[index] = Math.round(combo.cooldownTicks * cd);
    p.lastComboTick = this.tick;
    p.lastComboIndex = index;

    const effect = combo.effect;
    switch (effect.kind) {
      case 'armChain':
        // Nie zadaje obrażeń teraz — czeka na następny trafiony cios.
        // `uses: 1` odróżnia je od wzmocnienia lisa, które działa przez cały
        // swój czas; poza tym mechanizm jest ten sam.
        this.setChainBuff(p, combo.name, effect.armTicks, 1, {
          chains: effect.chains,
          range: effect.chainRange,
          falloff: effect.chainFalloff,
          damageMult: effect.damageMult,
        }, effect.visual ?? '');
        break;
      case 'field': {
        const def = minionById(effect.minionId);
        if (!def) break;
        const at = this.aimPoint(p, input, dirX, dirY, effect.placeRange);
        this.spawnMinion(def, p.index, at.x, at.y);
        break;
      }
      case 'dash':
        this.startDash(p, dashById(effect.dashId), dirX, dirY);
        // Doskok sam z siebie nie rani — obrażenia sypie `stepDashBolts`.
        p.dashBoltCombo = index;
        break;
    }
  }

  /**
   * Błyskawice sypane w locie przez combo `Q→W→Q`. Osobno od lądowania,
   * bo ten doskok ma ranić PO DRODZE, a nie na końcu.
   */
  private stepDashBolts(p: Player): void {
    const effect = COMBOS[p.dashBoltCombo]?.effect;
    if (!effect || effect.kind !== 'dash') return;
    if (p.dashTicksLeft % effect.boltEveryTicks !== 0) return;

    const target = this.nearestMobTo(p.x, p.y, effect.boltRange);
    if (!target) return;
    const dx = target.x - p.x;
    const dy = target.y - p.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    this.spawnProjectile(
      p.x, p.y, (dx / d) * 700, (dy / d) * 700,
      this.skillDamageOf(p, effect.damageMult) * p.chainDamageMult, true,
      {
        chains: effect.chains + p.chainCountBonus,
        chainRange: effect.chainRange,
        chainFalloff: effect.chainFalloff,
        ownerIndex: p.index,
        // Dash-błyskawica jest tylko wilcza (Lightning Rush), więc zawsze świeci.
        visual: 'lightning',
      },
    );
  }

  /**
   * Włącza wzmocnienie rykoszetu. Jedno wejście dla combo i dla skilla —
   * różnią się tylko `uses` (1 = jednorazowe, -1 = do końca czasu).
   */
  private setChainBuff(
    p: Player, name: string, ticks: number, uses: number,
    def: { chains: number; range: number; falloff: number; damageMult: number },
    visual: string,
  ): void {
    p.chainBuffName = name;
    p.chainBuffTicks = ticks;
    p.chainBuffUses = uses;
    p.chainBuffChains = def.chains;
    p.chainBuffRange = def.range;
    p.chainBuffFalloff = def.falloff;
    p.chainBuffMult = def.damageMult;
    p.chainBuffVisual = visual;
  }

  private clearChainBuff(p: Player): void {
    p.chainBuffTicks = 0;
    p.chainBuffUses = 0;
    p.chainBuffName = '';
    p.chainBuffVisual = '';
  }

  /**
   * Rykoszet z auto-ataku: pasywka Thunder Fang, a po combo `Q→W→E` ten sam
   * mechanizm z dwudziestoma odbiciami. Błyskawica startuje Z TRAFIONEGO
   * WROGA i leci do następnego — dlatego źródło od razu dostaje znacznik
   * łańcucha, żeby pocisk nie uderzył w nie, na czym stoi.
   */
  private spawnMeleeRicochet(p: Player, mobIndex: number): void {
    let chains = p.meleeChains;
    let range = p.meleeChainRange;
    let falloff = p.meleeChainFalloff;
    let mult = p.meleeChainDamageMult;
    let visual = p.meleeChainVisual;

    // Wzmocnienie ma pierwszeństwo przed rykoszetem bazowym.
    if (p.chainBuffTicks > 0) {
      chains = p.chainBuffChains;
      range = p.chainBuffRange;
      falloff = p.chainBuffFalloff;
      mult = p.chainBuffMult;
      visual = p.chainBuffVisual;
      // `uses` -1 = działa do końca czasu; dodatnie zużywa to trafienie.
      if (p.chainBuffUses > 0) {
        p.chainBuffUses--;
        if (p.chainBuffUses === 0) this.clearChainBuff(p);
      }
    }
    // STORMFANG (legendarka wolf-thunder): rykoszet przeskakuje +3 razy więcej.
    if (p.uniqueEffects.has('stormfang')) chains += 3;
    if (chains <= 0) return;

    const from = this.mobs[mobIndex];
    const next = this.nearestMobTo(from.x, from.y, range, undefined, mobIndex);
    if (!next) return;

    const dx = next.x - from.x;
    const dy = next.y - from.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const bolt = this.spawnProjectile(
      from.x, from.y, (dx / d) * 640, (dy / d) * 640,
      // Rykoszet to proc AUTO-ataku → skaluje się `attackDamageMult`, nie skillem.
      this.meleeDamageOf(p) * mult * p.chainDamageMult * p.attackDamageMult, true,
      {
        // -1, bo pierwszy przeskok to sam lot do `next`.
        chains: Math.max(0, chains - 1 + p.chainCountBonus),
        chainRange: range,
        chainFalloff: falloff,
        ownerIndex: p.index,
        visual,
      },
    );
    // Trafiony już oberwał od ciosu — znaczymy go, żeby łańcuch nie wracał.
    if (bolt) from.chainMark = bolt.chainId;
  }

  /**
   * BLINK ARROW. Pierwsze wciśnięcie wbija strzałę w punkt pod kursorem
   * i ZERUJE cooldown, żeby drugie było natychmiastowe; dopiero ono
   * teleportuje i płaci pełną cenę. Skok jest więc osobną decyzją, a nie
   * efektem ubocznym strzału — można strzelić i zostać.
   */
  private castBlink(
    p: Player, skill: BlinkSkill, input: SimInput,
    dirX: number, dirY: number, slot: number,
  ): void {
    if (p.blinkTicks > 0) {
      const at = this.pushOutOfObstacles(p.blinkX, p.blinkY, C.PLAYER_RADIUS);
      p.x = Math.min(Math.max(at.x, C.PLAYER_RADIUS), C.WORLD_W - C.PLAYER_RADIUS);
      p.y = Math.min(Math.max(at.y, C.PLAYER_RADIUS), C.WORLD_H - C.PLAYER_RADIUS);
      p.blinkTicks = 0;
      p.lastBlinkTick = this.tick;
      // Teleport przerywa marsz — inaczej postać od razu wróciłaby pod stary cel.
      p.hasMoveTarget = false;
      return;
    }

    const at = this.aimPoint(p, input, dirX, dirY, skill.range);
    p.blinkX = at.x;
    p.blinkY = at.y;
    p.blinkTicks = skill.windowTicks;

    // Strzała leci naprawdę i rani po drodze, ale punkt lądowania jest
    // ustalony Z GÓRY — inaczej teleport byłby nieprzewidywalny.
    const dx = at.x - p.x;
    const dy = at.y - p.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    this.spawnProjectile(
      p.x, p.y, (dx / d) * skill.speed, (dy / d) * skill.speed,
      this.rollDamage(p, this.skillDamageOf(p, skill.damageMult)), true,
      { ownerIndex: p.index },
    );
    p.skillCooldowns[slot] = 0;
  }

  /**
   * PHASE SWAP — gracz i jego klon najbliżej kursora ZAMIENIAJĄ SIĘ MIEJSCAMI.
   *
   * Celem jest kursor, a nie wejście na jednostkę (jak w portalach lisa), bo
   * klonów może być kilkanaście i trzeba móc wskazać, o który chodzi. Dzięki
   * temu jeden przycisk jest naraz wejściem i ucieczką: skaczesz do klona
   * w środku hordy albo do tego, którego zostawiłeś z tyłu.
   *
   * Klon ląduje tam, gdzie stał gracz — więc każdy skok PRZESTAWIA stado,
   * a nie tylko gracza. To jest ta drobna rzecz, która robi z tego pozycyjną
   * grę: nie da się skakać bez rozstrajania własnego pola ostrzału.
   */
  private castPhaseSwap(
    p: Player, skill: PhaseSwapSkill, input: SimInput, slot: number,
  ): void {
    const def = minionById(skill.minionId);
    if (!def) return;
    const defIndex = MINIONS.indexOf(def);

    let best: Minion | null = null;
    let bestD2 = skill.pickRadius * skill.pickRadius;
    for (const mi of this.minions) {
      if (!mi.alive || mi.ownerIndex !== p.index || mi.defIndex !== defIndex) continue;
      const dx = mi.x - input.aimX;
      const dy = mi.y - input.aimY;
      const d2 = dx * dx + dy * dy;
      if (d2 <= bestD2) {
        bestD2 = d2;
        best = mi;
      }
    }
    // Brak klona pod kursorem = skill w ogóle się nie odpalił. Oddajemy
    // cooldown, bo inaczej pudło kosztowałoby 6 s ucieczki — a wskazanie
    // pustego miejsca to pomyłka, nie decyzja.
    if (!best) {
      p.skillCooldowns[slot] = 0;
      return;
    }

    const fromX = p.x;
    const fromY = p.y;
    const at = this.pushOutOfObstacles(best.x, best.y, C.PLAYER_RADIUS);
    p.x = Math.min(Math.max(at.x, C.PLAYER_RADIUS), C.WORLD_W - C.PLAYER_RADIUS);
    p.y = Math.min(Math.max(at.y, C.PLAYER_RADIUS), C.WORLD_H - C.PLAYER_RADIUS);
    best.x = fromX;
    best.y = fromY;

    // Teleport przerywa marsz — inaczej postać od razu wróciłaby pod stary cel.
    p.hasMoveTarget = false;
    // Render rysuje błysk w obu punktach z tych samych pól co Blink Arrow.
    p.blinkX = fromX;
    p.blinkY = fromY;
    p.lastBlinkTick = this.tick;
  }

  /** Punkt pod kursorem, przycięty do zasięgu — wspólny dla pól i przywołań. */
  private aimPoint(
    p: Player, input: SimInput, dirX: number, dirY: number, maxRange: number,
  ): { x: number; y: number } {
    const dx = input.aimX - p.x;
    const dy = input.aimY - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxRange || dist < 0.001) {
      return { x: p.x + dirX * maxRange, y: p.y + dirY * maxRange };
    }
    return { x: input.aimX, y: input.aimY };
  }

  /**
   * Strzał wachlarzem pocisków. Liczbę strzał i liczbę odbić podbijają
   * talenty gracza — dlatego definicja skilla podaje tylko WARTOŚCI BAZOWE.
   */
  private castProjectile(
    p: Player, skill: ProjectileSkill, dirX: number, dirY: number,
  ): void {
    const count = Math.max(1, skill.count + p.projectileCountBonus);
    const chains = Math.max(0, skill.chains + p.chainCountBonus);
    // Jeden rzut na kryta dla CAŁEJ salwy, nie osobno na każdą strzałę:
    // czytelniej (cała salwa błyska razem) i zużycie RNG nie zależy od tego,
    // ile strzał dokleiły talenty.
    const damage = this.rollDamage(p, this.skillDamageOf(p, skill.damageMult));
    const base = Math.atan2(dirY, dirX);

    for (let i = 0; i < count; i++) {
      const a = base + (count > 1 ? (i - (count - 1) / 2) * skill.spreadRad : 0);
      this.spawnProjectile(
        p.x, p.y,
        Math.cos(a) * skill.speed, Math.sin(a) * skill.speed,
        damage, true,
        {
          chains,
          chainRange: skill.chainRange,
          chainFalloff: skill.chainFalloff,
          blastRadius: skill.blastRadius,
          ownerIndex: p.index,
        },
      );
    }
  }

  /** Postawienie jednostki skillem — miejsce bierzemy spod kursora. */
  private castSummon(
    p: Player, skill: SummonSkill, input: SimInput, dirX: number, dirY: number, slot: number,
  ): void {
    const def = minionById(skill.minionId);
    if (!def) return;

    // SUMMON-LUB-KOMENDA: jeśli jednostka już żyje, wciśnięcie ją STERUJE,
    // a nie stawia drugiej. Komenda ma własny cooldown (na jednostce), więc
    // NIE blokujemy slotu skilla na cały czas przywołania — zerujemy go.
    if (skill.commandsMinion) {
      const defIndex = MINIONS.indexOf(def);
      const existing = this.minions.find(
        (mi) => mi.alive && mi.ownerIndex === p.index && mi.defIndex === defIndex,
      );
      if (existing) {
        p.skillCooldowns[slot] = 0;
        if (existing.commandTicks <= 0 && existing.commandCd <= 0 && def.command) {
          existing.commandTicks = def.command.durationTicks;
          existing.commandX = input.aimX;
          existing.commandY = input.aimY;
          existing.commandCd = def.command.cooldownTicks;
        }
        return;
      }
    }

    // Cel poza zasięgiem stawiania przycinamy do maksimum — skill nigdy nie
    // „nie działa", tylko stawia jednostkę tak daleko, jak wolno.
    const at = this.aimPoint(p, input, dirX, dirY, skill.placeRange);
    const tx = at.x;
    const ty = at.y;

    // SUMMON-LUB-PRZENIEŚ: jeśli jednostka już żyje, PRZESUWAMY ją zamiast
    // stawiać drugą — to jest jeden przenośny turret buildera. Zachowujemy jej
    // stan (cykl ataku, czas życia); relokacja to teleport, nie re-deploy.
    if (skill.relocates) {
      const defIndex = MINIONS.indexOf(def);
      const existing = this.minions.find(
        (mi) => mi.alive && mi.ownerIndex === p.index && mi.defIndex === defIndex,
      );
      if (existing) {
        const pos = this.pushOutOfObstacles(
          Math.min(Math.max(tx, def.radius), C.WORLD_W - def.radius),
          Math.min(Math.max(ty, def.radius), C.WORLD_H - def.radius),
          def.radius,
        );
        existing.x = pos.x;
        existing.y = pos.y;
        existing.prevX = pos.x;
        existing.prevY = pos.y;
        return;
      }
    }

    // `summonCountBonus` (talent R NIGHT TERROR) dokłada sztuk na rzut. Zero
    // dla wszystkich innych klas, więc niczyjego summona nie rusza.
    const count = skill.count + p.summonCountBonus;
    for (let i = 0; i < count; i++) {
      // Kilka sztuk naraz rozstawiamy w wachlarzu, żeby nie stały w sobie.
      const spread = count > 1 ? (i - (count - 1) / 2) * def.radius * 2.4 : 0;
      this.spawnMinion(def, p.index, tx - dirY * spread, ty + dirX * spread);
    }
  }

  /* ── Dociągnięcie (`HookSkill`) ───────────────────────────────────────── */

  /** Wypuszcza linę w kierunku celowania; resztą zajmuje się `stepHooks`. */
  private castHook(p: Player, skill: HookSkill, dirX: number, dirY: number): void {
    // Z wybranym celem lina leci PROSTO w niego (a i tak łapie pierwszego na
    // trasie — hook zostaje skillshotem). Bez celu: kierunek spod kursora.
    if (p.targetMob >= 0) {
      const m = this.mobs[p.targetMob];
      if (m && m.alive) {
        const tx = m.x - p.x;
        const ty = m.y - p.y;
        const tl = Math.sqrt(tx * tx + ty * ty);
        if (tl > 0.001) { dirX = tx / tl; dirY = ty / tl; }
      }
    }
    for (const h of this.hooks) {
      if (h.alive) continue;
      h.alive = true;
      h.ownerIndex = p.index;
      h.x = p.x; h.y = p.y; h.prevX = p.x; h.prevY = p.y;
      h.dirX = dirX; h.dirY = dirY;
      h.speed = skill.speed;
      h.travelled = 0;
      h.maxRange = skill.range;
      h.width = skill.width;
      // Jeden rzut na kryta w chwili wystrzału — trafienie jest z góry ustalone.
      h.damage = this.rollDamage(p, this.skillDamageOf(p, skill.damageMult));
      h.mode = skill.mode;
      h.status = skill.status ? statusIndexById(skill.status) : -1;
      h.grabsAllies = skill.grabsAllies ?? false;
      h.phase = 'out';
      h.grabbedMob = -1;
      h.startTick = this.tick;
      return;
    }
    // Brak wolnego slotu w poolu = lina się nie odpaliła; cooldown już zszedł
    // w `applySkill`, ale przy 8 slotach na 8 graczy to sytuacja teoretyczna.
  }

  private stepHooks(): void {
    const dt = C.TICK_DT;
    for (const h of this.hooks) {
      if (!h.alive) continue;
      h.prevX = h.x; h.prevY = h.y;
      const owner = this.players[h.ownerIndex];
      // Właściciel padł — lina znika (nie ma dokąd zwijać ani kogo ciągnąć).
      if (!owner || owner.dead) { h.alive = false; continue; }

      const stepLen = h.speed * dt;

      if (h.phase === 'out') {
        h.x += h.dirX * stepLen;
        h.y += h.dirY * stepLen;
        h.travelled += stepLen;
        // Trafienie: pierwszy wróg w zasięgu czubka zostaje chwycony. TODO: gdy
        // wejdzie „wybieranie jednostek", celem będzie WSKAZANY wróg, nie najbliższy.
        // TODO(grabsAllies): wariant ratunkowy ma łapać też sojuszników w co-opie.
        const hit = this.nearestMobTo(h.x, h.y, h.width + C.MOB_RADIUS_MAX);
        if (hit && hit.bossIndex < 0) {
          // Bossa nie da się dociągnąć — tak jak nie da się go odepchnąć.
          hit.hp -= h.damage;
          hit.lastHitTick = this.tick;
          if (hit.hp <= 0) {
            this.killMob(hit, owner);
          } else {
            h.grabbedMob = this.mobs.indexOf(hit);
            if (h.status >= 0) this.applyStatus(hit, h.status, owner.index);
          }
          h.phase = 'back';
        } else if (
          h.travelled >= h.maxRange ||
          h.x < 0 || h.x > C.WORLD_W || h.y < 0 || h.y > C.WORLD_H
        ) {
          h.phase = 'back';
        }
        continue;
      }

      // ── Faza zwijania ──
      if (h.mode === 'pullSelf' && h.grabbedMob >= 0) {
        // Hookshot: to GRACZA ciągniemy do celu; lina zostaje wbita we wroga.
        const m = this.mobs[h.grabbedMob];
        if (!m.alive) { h.alive = false; continue; }
        h.x = m.x; h.y = m.y;
        const dx = m.x - owner.x;
        const dy = m.y - owner.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        if (d <= C.PLAYER_RADIUS + ENEMIES[m.defIndex].radius + 4) {
          owner.hasMoveTarget = false;
          h.alive = false;
          continue;
        }
        const step = Math.min(stepLen, d);
        const at = this.pushOutOfObstacles(owner.x + (dx / d) * step, owner.y + (dy / d) * step, C.PLAYER_RADIUS);
        owner.x = Math.min(Math.max(at.x, C.PLAYER_RADIUS), C.WORLD_W - C.PLAYER_RADIUS);
        owner.y = Math.min(Math.max(at.y, C.PLAYER_RADIUS), C.WORLD_H - C.PLAYER_RADIUS);
        continue;
      }

      // pullTarget (Pudge) albo lina wróciła pusta: czubek zwija się do gracza,
      // a chwycony wróg jedzie razem z nim.
      const dx = owner.x - h.x;
      const dy = owner.y - h.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const step = Math.min(stepLen, d);
      h.x += (dx / d) * step;
      h.y += (dy / d) * step;
      if (h.grabbedMob >= 0) {
        const m = this.mobs[h.grabbedMob];
        if (m.alive && m.bossIndex < 0) {
          const at = this.pushOutOfObstacles(h.x, h.y, ENEMIES[m.defIndex].radius);
          m.x = Math.min(Math.max(at.x, C.MOB_RADIUS), C.WORLD_W - C.MOB_RADIUS);
          m.y = Math.min(Math.max(at.y, C.MOB_RADIUS), C.WORLD_H - C.MOB_RADIUS);
        } else {
          h.grabbedMob = -1;
        }
      }
      if (d <= C.PLAYER_RADIUS + 4) h.alive = false; // lina zwinięta do końca
    }
  }

  /* ── Prowokacja (`TauntSkill`) ────────────────────────────────────────── */

  private castTaunt(p: Player, skill: TauntSkill): void {
    const r2 = skill.radius * skill.radius;
    this.hash.forEachNear(p.x, p.y, skill.radius + C.MOB_RADIUS_MAX, (i) => {
      const m = this.mobs[i];
      // Bossów się nie prowokuje — tak jak są odporni na odrzut i ogłuszenie.
      if (!m.alive || m.bossIndex >= 0) return;
      const dx = m.x - p.x;
      const dy = m.y - p.y;
      const d2 = dx * dx + dy * dy;
      if (d2 > r2) return;
      m.tauntUntilTick = this.tick + skill.durationTicks;
      m.tauntedBy = p.index;
      // Ściągnięcie do gracza — Berserker's Call zbiera hordę w kupę pod cios.
      if (skill.pullIn && d2 > 1) {
        const d = Math.sqrt(d2);
        const pull = Math.min(skill.pullIn, d - 1);
        const at = this.pushOutOfObstacles(
          m.x - (dx / d) * pull, m.y - (dy / d) * pull, ENEMIES[m.defIndex].radius,
        );
        m.x = Math.min(Math.max(at.x, C.MOB_RADIUS), C.WORLD_W - C.MOB_RADIUS);
        m.y = Math.min(Math.max(at.y, C.MOB_RADIUS), C.WORLD_H - C.MOB_RADIUS);
      }
    });
    // Aura na czas prowokacji (np. pancerz) — reuse mechanizmu `AuraSkill`.
    if (skill.auraId) {
      const index = AURAS.findIndex((a) => a.id === skill.auraId);
      if (index >= 0) p.auraTicks[index] = Math.max(p.auraTicks[index], skill.durationTicks);
    }
  }

  /* ── Detonacja (`DetonateSkill`) ──────────────────────────────────────── */

  /**
   * RUPTURE (SWARM): zjada status `plague` z wrogów w promieniu WOKÓŁ GRACZA
   * i zamienia liczbę stacków na jednorazowy burst. Wyśrodkowane na graczu —
   * dowódca stoi w zarażonej hordzie i ją rozrywa. Obrażenia na wroga =
   * obrażenia zwarcia gracza × `damagePerStackMult` × jego stacki; `range`
   * gracza poszerza promień. Po detonacji zaraza z celu ZNIKA, żeby RUPTURE
   * był realnym zbiorem stacków, a nie darmowym AoE co cooldown na wciąż
   * zarażonym wrogu (zaraza i tak sama go zainfekuje ponownie).
   */
  private castDetonate(p: Player, skill: DetonateSkill): void {
    const statusIndex = statusIndexById(skill.status);
    if (statusIndex < 0) return;
    const radius = skill.radius * p.rangeMult;
    const r2 = radius * radius;
    const perStack = this.skillDamageOf(p, skill.damagePerStackMult);
    this.hash.forEachNear(p.x, p.y, radius + C.MOB_RADIUS_MAX, (i) => {
      const m = this.mobs[i];
      if (!m.alive) return;
      const dx = m.x - p.x;
      const dy = m.y - p.y;
      if (dx * dx + dy * dy > r2) return;
      let stacks = 0;
      for (const st of m.statuses) {
        if (st.defIndex === statusIndex) { stacks = st.stacks; break; }
      }
      if (stacks <= 0) return;
      m.hp -= this.rollDamage(p, perStack * stacks, m);
      m.lastHitTick = this.tick;
      for (const st of m.statuses) {
        if (st.defIndex === statusIndex) st.defIndex = -1;
      }
      if (m.hp <= 0) this.killMob(m, p);
    });
  }

  /* ── Kanałowanie (`ChannelSkill`) ─────────────────────────────────────── */

  private castChannel(
    p: Player, skill: ChannelSkill, input: SimInput, dirX: number, dirY: number,
  ): void {
    p.channelTicks = skill.channelTicks;
    p.channelSkillId = skill.id;
    // vortex działa wokół WYBRANEGO punktu; drain sączy z okolic gracza i środka
    // nie czyta — ale zapisujemy go dla obu, żeby render miał z czego rysować.
    const at = this.aimPoint(p, input, dirX, dirY, 600);
    p.channelX = at.x;
    p.channelY = at.y;
    p.lastChannelTick = this.tick;
  }

  private stepChannels(inputOf: (p: Player) => SimInput): void {
    for (const p of this.players) {
      if (p.channelTicks <= 0) continue;
      const skill = skillById(p.channelSkillId);
      if (p.dead || skill.kind !== 'channel') { p.channelTicks = 0; continue; }

      // PRZERWANIE RUCHEM: kanał jest przerywalny — chód, doskok albo odrzut
      // kasują resztę. Pierwszego ticka nie sprawdzamy, bo gracz dopiero co stał,
      // gdy go odpalał (`lastChannelTick === tick`).
      if (this.tick > p.lastChannelTick) {
        const moved = (p.x - p.prevX) ** 2 + (p.y - p.prevY) ** 2 > 1;
        if (moved || inputOf(p).dash) { p.channelTicks = 0; continue; }
      }

      const every = Math.max(1, skill.tickEveryTicks);
      // Pierwszy puls pada od razu (różnica 0), potem co `every` ticków.
      if ((skill.channelTicks - p.channelTicks) % every === 0) {
        this.channelTickEffect(p, skill);
      }
      p.channelTicks--;
    }
  }

  private channelTickEffect(p: Player, skill: ChannelSkill): void {
    const pay = skill.payload;
    if (pay.type === 'rest') {
      // HIBERNATE (niedźwiedź): sen leczy z ustalonej wartości na tyknięcie —
      // czysty regen, zero obrażeń. Ruch przerywa kanał (patrz `stepChannels`),
      // więc to sustain za cenę stania w miejscu.
      p.hp = Math.min(this.maxHpOf(p), p.hp + pay.healPerTick);
      return;
    }
    if (pay.type === 'drain') {
      // MULTI-DRAIN: sączymy z `1 + drainExtraTargets` wrogów naraz (talent Q
      // NIGHT TERROR), lecząc z SUMY zadanych obrażeń. Wybrany cel (unit-select)
      // idzie na pierwszy ogień, resztę dopełniamy wrogami z zasięgu. `range`
      // gracza poszerza promień sączenia.
      const radius = pay.targetRadius * p.rangeMult;
      const r2 = radius * radius;
      const maxTargets = 1 + p.drainExtraTargets;
      let hit = 0;
      let healed = 0;
      let picked = -1;
      const ti = p.targetMob;
      if (ti >= 0) {
        const t = this.mobs[ti];
        if (t && t.alive) {
          const dx = t.x - p.x;
          const dy = t.y - p.y;
          if (dx * dx + dy * dy <= r2) {
            picked = ti;
            const dmg = this.rollDamage(p, this.skillDamageOf(p, pay.damageMult), t);
            t.hp -= dmg; t.lastHitTick = this.tick; healed += dmg; hit++;
            if (t.hp <= 0) this.killMob(t, p);
          }
        }
      }
      this.hash.forEachNear(p.x, p.y, radius + C.MOB_RADIUS_MAX, (i) => {
        if (hit >= maxTargets || i === picked) return;
        const m = this.mobs[i];
        if (!m.alive) return;
        const dx = m.x - p.x;
        const dy = m.y - p.y;
        if (dx * dx + dy * dy > r2) return;
        const dmg = this.rollDamage(p, this.skillDamageOf(p, pay.damageMult), m);
        m.hp -= dmg; m.lastHitTick = this.tick; healed += dmg; hit++;
        if (m.hp <= 0) this.killMob(m, p);
      });
      if (healed > 0) p.hp = Math.min(this.maxHpOf(p), p.hp + healed * pay.healPct);
      return;
    }
    if (pay.type === 'vortex') {
      // vortex: wsysa i rani wszystko wokół celowanego punktu (`range` poszerza).
      const radius = pay.radius * p.rangeMult;
      const r2 = radius * radius;
      this.hash.forEachNear(p.channelX, p.channelY, radius + C.MOB_RADIUS_MAX, (i) => {
        const m = this.mobs[i];
        if (!m.alive || m.bossIndex >= 0) return;
        const dx = p.channelX - m.x;
        const dy = p.channelY - m.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > r2) return;
        const d = Math.sqrt(d2) || 1;
        const pull = Math.min(pay.pull, d);
        const at = this.pushOutOfObstacles(
          m.x + (dx / d) * pull, m.y + (dy / d) * pull, ENEMIES[m.defIndex].radius,
        );
        m.x = Math.min(Math.max(at.x, C.MOB_RADIUS), C.WORLD_W - C.MOB_RADIUS);
        m.y = Math.min(Math.max(at.y, C.MOB_RADIUS), C.WORLD_H - C.MOB_RADIUS);
        m.hp -= this.rollDamage(p, this.skillDamageOf(p, pay.damageMult), m);
        m.lastHitTick = this.tick;
        if (m.hp <= 0) this.killMob(m, p);
      });
      return;
    }

    // drainNova: pierścień grozy WOKÓŁ GRACZA — rani wszystkich (także bossa),
    // leczy z SUMY zadanych obrażeń i nakłada status (fear). `range` gracza
    // poszerza pierścień (upgrade W w NIGHT TERROR). Silnik AoE-wampira.
    const statusIndex = pay.status ? statusIndexById(pay.status) : -1;
    const novaRadius = pay.radius * p.rangeMult;
    const novaR2 = novaRadius * novaRadius;
    let healed = 0;
    this.hash.forEachNear(p.x, p.y, novaRadius + C.MOB_RADIUS_MAX, (i) => {
      const m = this.mobs[i];
      if (!m.alive) return;
      const dx = m.x - p.x;
      const dy = m.y - p.y;
      if (dx * dx + dy * dy > novaR2) return;
      const dmg = this.rollDamage(p, this.skillDamageOf(p, pay.damageMult), m);
      m.hp -= dmg;
      m.lastHitTick = this.tick;
      healed += dmg;
      if (m.hp <= 0) {
        this.killMob(m, p);
        return;
      }
      // Status PO obrażeniach (jak w applyCone); bossy i tak zignorują fear.
      if (statusIndex >= 0) this.applyStatus(m, statusIndex, p.index);
    });
    if (healed > 0) p.hp = Math.min(this.maxHpOf(p), p.hp + healed * pay.healPct);
  }

  /* ── Bariera (`WallSkill`) ────────────────────────────────────────────── */

  private castWall(
    p: Player, skill: WallSkill, input: SimInput, dirX: number, dirY: number,
  ): void {
    const at = skill.aimed
      ? this.aimPoint(p, input, dirX, dirY, skill.placeRange)
      : { x: p.x + dirX * skill.placeRange, y: p.y + dirY * skill.placeRange };

    if (skill.shape === 'line') {
      // Odcinek W POPRZEK kierunku celowania, wyśrodkowany na punkcie.
      const nx = -dirY;
      const ny = dirX;
      const half = skill.length / 2;
      this.spawnWall(
        p.index, at.x - nx * half, at.y - ny * half, at.x + nx * half, at.y + ny * half, skill,
      );
      return;
    }
    // Pierścień: N odcinków po obwodzie koła o promieniu `length`.
    const seg = 10;
    const r = skill.length;
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2;
      const a1 = ((i + 1) / seg) * Math.PI * 2;
      this.spawnWall(
        p.index,
        at.x + Math.cos(a0) * r, at.y + Math.sin(a0) * r,
        at.x + Math.cos(a1) * r, at.y + Math.sin(a1) * r,
        skill,
      );
    }
  }

  private spawnWall(
    owner: number, x1: number, y1: number, x2: number, y2: number, skill: WallSkill,
  ): void {
    for (const w of this.walls) {
      if (w.alive) continue;
      w.alive = true;
      w.ownerIndex = owner;
      w.x1 = x1; w.y1 = y1; w.x2 = x2; w.y2 = y2;
      w.thickness = skill.thickness;
      w.ttl = skill.durationTicks;
      w.blocksProjectiles = skill.blocksProjectiles;
      w.startTick = this.tick;
      // Wrogowie stojący na linii W CHWILI stawiania dostają status (Fissure).
      if (skill.status) {
        const statusIndex = statusIndexById(skill.status);
        if (statusIndex >= 0) this.statusAlongSegment(x1, y1, x2, y2, w.thickness, statusIndex, owner);
      }
      return;
    }
  }

  private stepWalls(): void {
    // Sam upkeep czasu życia. Kolizja (blokowanie ruchu) siedzi w
    // `pushOutOfWalls`, wołanym z `movePlayer` i `moveMobsAndAttack` — mobki
    // i gracz zatrzymują się o mur. Blokowanie POCISKÓW: jeszcze niepodpięte
    // (pole `blocksProjectiles` czeka na wpięcie w `stepProjectiles`).
    for (const w of this.walls) {
      if (!w.alive) continue;
      if (--w.ttl <= 0) w.alive = false;
    }
  }

  /** Nakłada status wszystkim wrogom leżącym na odcinku (grubość + promień). */
  private statusAlongSegment(
    x1: number, y1: number, x2: number, y2: number,
    thickness: number, statusIndex: number, owner: number,
  ): void {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const reach = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 2 + thickness + C.MOB_RADIUS_MAX;
    this.hash.forEachNear(midX, midY, reach, (i) => {
      const m = this.mobs[i];
      if (!m.alive || m.bossIndex >= 0) return;
      const margin = thickness + ENEMIES[m.defIndex].radius;
      if (this.pointSegDist2(m.x, m.y, x1, y1, x2, y2) <= margin * margin) {
        this.applyStatus(m, statusIndex, owner);
      }
    });
  }

  /** Kwadrat odległości punktu od odcinka — wspólny helper geometrii ścian. */
  private pointSegDist2(
    px: number, py: number, ax: number, ay: number, bx: number, by: number,
  ): number {
    const abx = bx - ax;
    const aby = by - ay;
    const ab2 = abx * abx + aby * aby || 1;
    let t = ((px - ax) * abx + (py - ay) * aby) / ab2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const cx = ax + abx * t;
    const cy = ay + aby * t;
    return (px - cx) ** 2 + (py - cy) ** 2;
  }

  /* ── Statusy na wrogach ───────────────────────────────────────────────── */

  /**
   * Nakłada status na wroga. Zajmuje wolny slot; gdy wszystkie są zajęte,
   * odświeża ten sam status albo wypycha ten z najkrótszym pozostałym czasem.
   */
  applyStatus(m: Mob, statusIndex: number, ownerIndex: number): void {
    if (!m.alive || statusIndex < 0) return;
    const def = STATUSES[statusIndex];

    // Ten sam status już wisi — dokładamy stack i odnawiamy czas.
    for (const st of m.statuses) {
      if (st.defIndex !== statusIndex) continue;
      st.stacks = Math.min(def.maxStacks, st.stacks + 1);
      st.ticksLeft = def.durationTicks;
      st.ownerIndex = ownerIndex;
      return;
    }

    let target = m.statuses.find((st) => st.defIndex < 0);
    if (!target) {
      // Brak miejsca: wypada ten, któremu i tak zostało najmniej.
      target = m.statuses.reduce((a, b) => (b.ticksLeft < a.ticksLeft ? b : a));
    }
    target.defIndex = statusIndex;
    target.ticksLeft = def.durationTicks;
    target.stacks = 1;
    target.tickIn = def.intervalTicks;
    target.ownerIndex = ownerIndex;
  }

  /** Mnożnik prędkości wroga z nałożonych statusów (najsilniejsze spowolnienie). */
  mobSpeedMultOf(m: Mob): number {
    let mult = 1;
    for (const st of m.statuses) {
      if (st.defIndex < 0) continue;
      // Najsilniejsze, nie iloczyn — dwa spowolnienia nie mają zatrzymywać.
      mult = Math.min(mult, STATUSES[st.defIndex].speedMult);
    }
    return mult;
  }

  /** Mnożnik obrażeń OTRZYMYWANYCH przez wroga (osłabienia). */
  /**
   * Czy wróg jest ogłuszony — nie rusza się I nie atakuje.
   *
   * Osobno od `mobSpeedMultOf`, bo prędkość wchodzi wyłącznie w ruch:
   * bez tej bramki „ogłuszony" mob stałby w miejscu i dalej się zamachiwał.
   */
  mobStunned(m: Mob): boolean {
    for (const st of m.statuses) {
      if (st.defIndex < 0) continue;
      if (STATUSES[st.defIndex].stuns) return true;
    }
    return false;
  }

  /** Czy wróg jest przestraszony — ucieka i nie atakuje (`StatusDef.flees`). */
  mobFeared(m: Mob): boolean {
    for (const st of m.statuses) {
      if (st.defIndex < 0) continue;
      if (STATUSES[st.defIndex].flees) return true;
    }
    return false;
  }

  /**
   * Najbliższe ZAGROŻENIE dla wroga: żywy gracz albo dowolna jego jednostka.
   * Od tego ucieka przestraszony mob — a że duch też jest jednostką, sam
   * rozgania hordę, którą przestraszył.
   */
  private nearestThreatTo(x: number, y: number): { x: number; y: number } | null {
    let best: { x: number; y: number } | null = null;
    let bestD2 = Infinity;
    for (const p of this.players) {
      if (p.dead) continue;
      const d2 = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
      if (d2 < bestD2) { bestD2 = d2; best = p; }
    }
    for (const mi of this.minions) {
      if (!mi.alive) continue;
      const d2 = (mi.x - x) * (mi.x - x) + (mi.y - y) * (mi.y - y);
      if (d2 < bestD2) { bestD2 = d2; best = mi; }
    }
    return best;
  }

  mobVulnerabilityOf(m: Mob): number {
    let mult = 1;
    for (const st of m.statuses) {
      if (st.defIndex < 0) continue;
      mult = Math.max(mult, STATUSES[st.defIndex].vulnerability);
    }
    return mult;
  }

  private clearStatuses(m: Mob): void {
    for (const st of m.statuses) st.defIndex = -1;
  }

  /**
   * Tyknięcia wszystkich statusów: obrażenia, wygasanie, rozprzestrzenianie.
   *
   * Rozprzestrzenianie zbieramy do listy i nakładamy PO pętli — inaczej
   * świeżo zarażony wróg mógłby zarazić kolejnych w tym samym ticku,
   * co przy zarazie dałoby lawinę przez całą arenę w jednej klatce.
   */
  private stepStatuses(): void {
    const doSpread: { x: number; y: number; statusIndex: number; owner: number }[] = [];

    for (const m of this.mobs) {
      if (!m.alive) continue;
      for (const st of m.statuses) {
        if (st.defIndex < 0) continue;
        const def = STATUSES[st.defIndex];

        st.ticksLeft--;
        if (st.ticksLeft <= 0) {
          st.defIndex = -1;
          continue;
        }

        st.tickIn--;
        if (st.tickIn > 0) continue;
        st.tickIn = def.intervalTicks;

        if (def.damagePerTick > 0) {
          const killer = this.players[st.ownerIndex] ?? this.players[0];
          m.hp -= def.damagePerTick * st.stacks * this.mobVulnerabilityOf(m);
          m.lastHitTick = this.tick;
          if (m.hp <= 0) {
            this.killMob(m, killer);
            break;
          }
        }
        if (def.spreadRadius > 0) {
          doSpread.push({ x: m.x, y: m.y, statusIndex: st.defIndex, owner: st.ownerIndex });
        }
      }
    }

    for (const s of doSpread) {
      let left = STATUSES[s.statusIndex].spreadCount;
      const r = STATUSES[s.statusIndex].spreadRadius;
      this.hash.forEachNear(s.x, s.y, r, (i) => {
        if (left <= 0) return;
        const other = this.mobs[i];
        if (!other.alive) return;
        // Nie zarażamy tych, którzy już to mają — inaczej zaraza tylko
        // odświeżałaby samą siebie zamiast szukać nowych celów.
        if (other.statuses.some((st) => st.defIndex === s.statusIndex)) return;
        const dx = other.x - s.x;
        const dy = other.y - s.y;
        if (dx * dx + dy * dy > r * r) return;
        this.applyStatus(other, s.statusIndex, s.owner);
        left--;
      });
    }
  }

  /* ── Aury ─────────────────────────────────────────────────────────────── */

  /**
   * Aury graczy. Warstwa bonusów jest przeliczana OD ZERA w każdym ticku,
   * więc wyjście z pola samo je zabiera — bez żadnej księgowości.
   */
  private stepAuras(): void {
    for (const p of this.players) {
      p.auraDamageMult = 1;
      p.auraSpeedMult = 1;
      p.auraAttackSpeedMult = 1;
      p.auraArmorFlat = 0;
      p.auraCooldownMult = 1;
    }

    // Wataha wchodzi w TĘ SAMĄ warstwę co aury: liczona od zera co tick,
    // więc bonus znika w chwili, gdy wilki zginą albo gracz od nich odbiegnie.
    this.stepPack();

    // Wzmocnienie na czas (`EmpowerSkill`) też tu — z tego samego powodu:
    // wygaśnie samo, bez cofania czegokolwiek.
    for (const p of this.players) {
      if (p.empowerTicks > 0) p.auraAttackSpeedMult += p.empowerAttackSpeed / 100;
    }

    for (const owner of this.players) {
      if (owner.dead) continue;
      for (let ai = 0; ai < AURAS.length; ai++) {
        const aura = AURAS[ai];
        // Aura działa, gdy jest nadana talentem ALBO włączona na czas skillem.
        // Odliczamy PRZED sprawdzeniem, ale stan bierzemy sprzed odliczenia —
        // inaczej ostatni tick aury przepadałby.
        const timed = owner.auraTicks[ai] > 0;
        if (timed) owner.auraTicks[ai]--;
        // AURA MASTER: aura slotu jest aktywna, DOPÓKI slot gotowy (cd<=0). Po
        // wciśnięciu skill idzie na cooldown → jego pasywna aura gaśnie.
        const slotIdx = owner.slotAuras.indexOf(aura.id);
        const slotReady = slotIdx >= 0 && owner.skillCooldowns[slotIdx] <= 0;
        if (!timed && !slotReady && !owner.auraIds.includes(aura.id)) continue;

        // Promień aur AURA MASTERA (slotowych) rośnie z `rangeMult` gracza
        // (drzewko `range`) — stąd RADIANCE na maksie sięga przez cały ekran.
        const radius = slotIdx >= 0 ? aura.radius * owner.rangeMult : aura.radius;

        // PACK FURY rośnie z licznikiem właściciela; zwykłe aury mają `power` 1.
        const power = aura.scalesWithPack
          ? 1 + (owner.packInstinct * ALPHA_PACK.auraPerInstinct) / 100
          : 1;

        // Bonusy dla sojuszników liczymy CO TICK (są tanie i muszą znikać
        // natychmiast), a działanie na wrogów tylko co `intervalTicks`.
        if (aura.allyBuff) {
          for (const ally of this.players) {
            if (ally.dead) continue;
            const dx = ally.x - owner.x;
            const dy = ally.y - owner.y;
            if (dx * dx + dy * dy > radius * radius) continue;
            // Wataha wilka: premia za bycie OBOK KOGOŚ, nie za samotność.
            if (ally === owner && this.players.length > 1) continue;
            this.applyAuraBuff(ally, aura.allyBuff.kind, aura.allyBuff.value * power);
          }
        }

        if (this.tick % aura.intervalTicks !== 0) continue;

        if (aura.allyHeal > 0) {
          for (const ally of this.players) {
            if (ally.dead) continue;
            const dx = ally.x - owner.x;
            const dy = ally.y - owner.y;
            if (dx * dx + dy * dy > radius * radius) continue;
            ally.hp = Math.min(this.maxHpOf(ally), ally.hp + aura.allyHeal);
          }
        }

        if (aura.enemyStatus || aura.enemyDamage > 0) {
          const statusIndex = aura.enemyStatus ? statusIndexById(aura.enemyStatus) : -1;
          this.hash.forEachNear(owner.x, owner.y, radius + C.MOB_RADIUS_MAX, (i) => {
            const m = this.mobs[i];
            if (!m.alive) return;
            const reach = radius + ENEMIES[m.defIndex].radius;
            const dx = m.x - owner.x;
            const dy = m.y - owner.y;
            if (dx * dx + dy * dy > reach * reach) return;
            if (statusIndex >= 0) this.applyStatus(m, statusIndex, owner.index);
            if (aura.enemyDamage > 0) {
              // Obrażenia aury skalują się statem obrażeń właściciela (`damageMult`),
              // więc drzewko `strength` AURA MASTERA (RADIANCE) nadąża za falami —
              // inaczej pole tłukłoby na sztywno i odpadło late-game.
              m.hp -= aura.enemyDamage * owner.damageMult * this.mobVulnerabilityOf(m);
              m.lastHitTick = this.tick;
              if (m.hp <= 0) this.killMob(m, owner);
            }
          });
        }
      }
    }

    // Aury roztaczane przez JEDNOSTKI (duch summonera). Źródłem jest minion,
    // a nie gracz — ale warstwa ta sama (liczona od zera co tick), więc bonus
    // znika, gdy duch zginie albo gracz odejdzie z jego promienia. Obsługujemy
    // buff i leczenie sojuszników; debuffy na wrogów jednostka i tak zrobi
    // atakiem `slam` ze statusem.
    for (const mi of this.minions) {
      if (!mi.alive) continue;
      const auraId = MINIONS[mi.defIndex].auraId;
      if (!auraId) continue;
      const aura = auraById(auraId);
      if (!aura) continue;
      const r2 = aura.radius * aura.radius;

      if (aura.allyBuff) {
        for (const ally of this.players) {
          if (ally.dead) continue;
          const dx = ally.x - mi.x;
          const dy = ally.y - mi.y;
          if (dx * dx + dy * dy > r2) continue;
          this.applyAuraBuff(ally, aura.allyBuff.kind, aura.allyBuff.value);
        }
      }
      if (aura.allyHeal > 0 && this.tick % aura.intervalTicks === 0) {
        for (const ally of this.players) {
          if (ally.dead) continue;
          const dx = ally.x - mi.x;
          const dy = ally.y - mi.y;
          if (dx * dx + dy * dy > r2) continue;
          ally.hp = Math.min(this.maxHpOf(ally), ally.hp + aura.allyHeal);
        }
      }
    }

    // TRANSFORMACJA (`TransformSkill`) — NA KOŃCU, na wierzch wszystkich aur:
    // czasowa forma mnoży/dolicza staty i odlicza swój czas. Gdy `transformTicks`
    // dojdzie do 0, po prostu przestajemy tu wchodzić — staty wracają same
    // (ta sama zasada „licz od zera co tick", co reszta tej metody).
    for (const p of this.players) {
      if (p.transformTicks <= 0) continue;
      p.transformTicks--;
      p.auraDamageMult *= p.transformDamageMult;
      p.auraSpeedMult *= p.transformSpeedMult;
      p.auraAttackSpeedMult *= p.transformAttackSpeedMult;
      p.auraArmorFlat += p.transformArmorBonus;
    }
  }

  /**
   * Bonusy WATAHY (ALPHA PACK). Sojusznikiem jest KAŻDY: inny żywy gracz
   * i dowolny żywy minion, także cudzy — decyzja projektowa, dzięki której
   * gałąź działa też w runie solo, bo wilki spod `E` liczą się same.
   *
   * Dwa źródła: LICZBA sojuszników obok (znika natychmiast, gdy zostaniesz
   * sam) i PACK INSTINCT (narasta przez cały run). Oba wpadają w warstwę
   * przeliczaną co tick, więc nie ma czego cofać.
   */
  private stepPack(): void {
    const r2 = ALPHA_PACK.radius * ALPHA_PACK.radius;
    for (const p of this.players) {
      if (!p.packLeader) continue;
      p.allyCount = 0;
      if (p.dead) continue;

      for (const other of this.players) {
        if (other === p || other.dead) continue;
        const dx = other.x - p.x;
        const dy = other.y - p.y;
        if (dx * dx + dy * dy <= r2) p.allyCount++;
      }
      for (const mi of this.minions) {
        if (!mi.alive) continue;
        const dx = mi.x - p.x;
        const dy = mi.y - p.y;
        if (dx * dx + dy * dy <= r2) p.allyCount++;
      }

      p.auraDamageMult +=
        (p.allyCount * ALPHA_PACK.damagePerAlly +
          p.packInstinct * ALPHA_PACK.damagePerInstinct) / 100;
      p.auraArmorFlat += p.allyCount * ALPHA_PACK.armorPerAlly;
    }
  }

  /**
   * Wpina bonus z aury we właściwą warstwę.
   *
   * Obsługiwane są rodzaje mające sens „na chwilę". Reszta jest świadomie
   * ignorowana — np. maks. HP z aury wymagałoby leczenia przy wejściu
   * i obcinania przy wyjściu, czyli dokładnie tej księgowości, której
   * ta warstwa ma unikać. Dokładając nowy rodzaj, dopisz go TUTAJ.
   */
  private applyAuraBuff(p: Player, kind: ItemKind, value: number): void {
    switch (kind) {
      case 'strength':
        p.auraDamageMult += value / 100;
        break;
      case 'speed':
        p.auraSpeedMult += value / 100;
        break;
      case 'attackSpeed':
        p.auraAttackSpeedMult += value / 100;
        break;
      case 'armor':
        p.auraArmorFlat += value;
        break;
      case 'cooldown':
        // Redukcja cooldownów z aury (TEMPO). Podłoga 0.4, żeby stos aur nie
        // zszedł do zera/ujemnych wartości i nie zrobił skilli natychmiastowymi.
        p.auraCooldownMult = Math.max(0.4, p.auraCooldownMult - value / 100);
        break;
      default:
        break;
    }
  }

  /* ── Sojusznicze jednostki ────────────────────────────────────────────── */

  /** Wolny slot w poolu jednostek (-1 = pool pełny). */
  private findFreeMinionSlot(): number {
    for (let i = 0; i < this.minions.length; i++) if (!this.minions[i].alive) return i;
    return -1;
  }

  private countMinions(defIndex: number, ownerIndex: number): number {
    let n = 0;
    for (const mi of this.minions) {
      if (mi.alive && mi.defIndex === defIndex && mi.ownerIndex === ownerIndex) n++;
    }
    return n;
  }

  /**
   * Stawia jednostkę. Przy przekroczeniu `maxActive` USUWA NAJSTARSZĄ zamiast
   * odmawiać — inaczej skill po cichu „nie działa", co jest gorsze niż
   * podmiana: gracz widzi efekt każdego użycia.
   */
  spawnMinion(def: MinionDef, ownerIndex: number, x: number, y: number): Minion | null {
    const owner = this.players[ownerIndex];
    // Limit i statystyki skalują się talentami właściciela — to jest główny
    // sposób, w jaki build przywoływacza rośnie w trakcie runu.
    // `fixedCount` = liczba sztuk jest ZASADĄ, nie siłą (portale muszą być
    // dokładnie dwa), więc talenty na `minionCount` jej nie ruszają.
    const maxActive = def.fixedCount
      ? def.maxActive
      : def.maxActive + (owner?.minionCountBonus ?? 0);
    if (this.countMinions(MINIONS.indexOf(def), ownerIndex) >= maxActive) {
      let oldest: Minion | null = null;
      for (const mi of this.minions) {
        if (!mi.alive || mi.defIndex !== MINIONS.indexOf(def) || mi.ownerIndex !== ownerIndex) continue;
        if (!oldest || mi.spawnTick < oldest.spawnTick) oldest = mi;
      }
      if (oldest) oldest.alive = false;
    }

    const slot = this.findFreeMinionSlot();
    if (slot === -1) return null;

    const pos = this.pushOutOfObstacles(
      Math.min(Math.max(x, def.radius), C.WORLD_W - def.radius),
      Math.min(Math.max(y, def.radius), C.WORLD_H - def.radius),
      def.radius,
    );
    const mi = this.minions[slot];
    mi.alive = true;
    mi.defIndex = MINIONS.indexOf(def);
    mi.ownerIndex = ownerIndex;
    mi.x = pos.x;
    mi.y = pos.y;
    mi.prevX = pos.x;
    mi.prevY = pos.y;
    mi.hp = def.hp * (owner?.minionHpMult ?? 1);
    mi.maxHp = mi.hp;
    // Jednostki wieczne (lifetimeTicks < 0) zostają wieczne niezależnie
    // od mnożników — nie ma czego przedłużać.
    mi.ttl =
      def.lifetimeTicks < 0
        ? -1
        : Math.round(def.lifetimeTicks * (owner?.minionDurationMult ?? 1));
    mi.attackCooldown = def.attackIntervalTicks;
    mi.state = 'idle';
    mi.stateTicks = 0;
    mi.attackIndex = 0;
    mi.spawnTick = this.tick;
    // Slot wraca z poola po innej jednostce — bez tego mina odziedziczyłaby
    // zużyte ładunki poprzedniczki.
    mi.chargesLeft = def.charges ?? 0;
    mi.commandTicks = 0;
    mi.commandCd = 0;
    return mi;
  }

  /**
   * Najbliższy żywy wróg w promieniu — wspólny celownik jednostek i odbić.
   *
   * `skipChainMark` pomija wrogów już trafionych przez ten sam łańcuch,
   * `excludeIndex` pomija JEDEN konkretny slot. To drugie jest potrzebne
   * osobno: przy rykoszecie z ciosu źródło nie ma jeszcze znacznika, a
   * podanie jego `chainMark` (-1) odrzuciłoby wszystkich nieoznaczonych.
   */
  /**
   * Wróg „pod kursorem" — najbliższy mob, którego tarcza (promień + margines)
   * obejmuje punkt (x,y). Zwraca indeks w `mobs` albo -1. Rozwiązywane w
   * SYMULACJI ze współrzędnych świata, więc w co-opie każdy klient wskaże ten
   * sam cel niezależnie od tego, co ma na ekranie.
   */
  private mobAtPoint(x: number, y: number): number {
    let best = -1;
    let bestD2 = Infinity;
    // Zapas na największego bossa: promień szukania musi objąć jego środek.
    this.hash.forEachNear(x, y, 120 + TARGET_PICK_MARGIN, (i) => {
      const m = this.mobs[i];
      if (!m.alive) return;
      const rad =
        (m.bossIndex >= 0 ? BOSSES[m.bossIndex].radius : ENEMIES[m.defIndex].radius) +
        TARGET_PICK_MARGIN;
      const dx = m.x - x;
      const dy = m.y - y;
      const d2 = dx * dx + dy * dy;
      if (d2 > rad * rad) return;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = i;
      }
    });
    return best;
  }

  private nearestMobTo(
    x: number, y: number, maxDist: number,
    skipChainMark?: number, excludeIndex?: number,
  ): Mob | null {
    let best: Mob | null = null;
    let bestD2 = maxDist * maxDist;
    this.hash.forEachNear(x, y, maxDist, (i) => {
      if (i === excludeIndex) return;
      const m = this.mobs[i];
      if (!m.alive) return;
      if (skipChainMark !== undefined && m.chainMark === skipChainMark) return;
      const dx = m.x - x;
      const dy = m.y - y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = m;
      }
    });
    return best;
  }

  /**
   * Przejścia przez portale. Gracz korzysta wyłącznie z WŁASNEJ pary —
   * cudze portale go nie wciągają, bo w co-opie byłoby to narzędzie do
   * przerzucania kolegów w hordę wbrew ich woli.
   *
   * Pary pilnuje `maxActive: 2` w `spawnMinion` (trzeci kasuje najstarszy),
   * więc tutaj wystarczy znaleźć dwa żywe i sprawdzić, czy stoimy na którymś.
   */
  private stepPortals(): void {
    for (const p of this.players) {
      if (p.portalCooldown > 0) p.portalCooldown--;
      if (p.dead || p.portalCooldown > 0) continue;

      let first: Minion | null = null;
      let second: Minion | null = null;
      for (const mi of this.minions) {
        if (!mi.alive || mi.ownerIndex !== p.index) continue;
        if (!MINIONS[mi.defIndex].portal) continue;
        if (!first) first = mi;
        else if (!second) second = mi;
      }
      // Pojedynczy portal nie ma dokąd prowadzić.
      if (!first || !second) continue;

      const reach = MINIONS[first.defIndex].radius + C.PLAYER_RADIUS;
      const na = (mi: Minion): boolean => {
        const dx = mi.x - p.x;
        const dy = mi.y - p.y;
        return dx * dx + dy * dy <= reach * reach;
      };
      const wejscie = na(first) ? first : na(second) ? second : null;
      if (!wejscie) continue;

      const wyjscie = wejscie === first ? second : first;
      const at = this.pushOutOfObstacles(wyjscie.x, wyjscie.y, C.PLAYER_RADIUS);
      p.x = Math.min(Math.max(at.x, C.PLAYER_RADIUS), C.WORLD_W - C.PLAYER_RADIUS);
      p.y = Math.min(Math.max(at.y, C.PLAYER_RADIUS), C.WORLD_H - C.PLAYER_RADIUS);
      p.portalCooldown = PORTAL_REUSE_TICKS;
      p.lastPortalTick = this.tick;
      // Bez tego postać natychmiast maszerowałaby z powrotem do starego celu.
      p.hasMoveTarget = false;
    }
  }

  private stepMinions(): void {
    for (const mi of this.minions) {
      if (!mi.alive) continue;
      const def = MINIONS[mi.defIndex];
      mi.prevX = mi.x;
      mi.prevY = mi.y;

      if (mi.ttl > 0) {
        mi.ttl--;
        if (mi.ttl === 0) {
          mi.alive = false;
          continue;
        }
      }

      if (mi.commandCd > 0) mi.commandCd--;
      // KOMENDA ma pierwszeństwo nad zwykłym ruchem: jednostka leci w zadany
      // punkt i sieje status, dopóki komenda trwa.
      if (mi.commandTicks > 0) {
        this.stepMinionCommand(mi, def);
        if (def.hp > 0) this.damageMinionByContact(mi, def);
        continue;
      }

      // Zasięg szukania celu: jednostki nieruchome mają go z ataku, ruchome
      // polują po całej okolicy.
      const scan = def.movement === 'static' ? 520 : 900;
      const target = this.nearestMobTo(mi.x, mi.y, scan);

      if (def.movement !== 'static') this.moveMinion(mi, def, target);
      if (def.hp > 0) this.damageMinionByContact(mi, def);
      if (!mi.alive) continue;

      if (def.attacks.length > 0) this.stepMinionAttack(mi, def, target);
      if (def.spews) this.stepSpewer(mi, def);
    }
  }

  /**
   * SPAWNER (`MinionDef.spews`) — co `attackIntervalTicks` wypluwa jednostkę
   * w LOSOWYM punkcie w promieniu wokół siebie. Silnik WULKANU maga magmy.
   * `attackCooldown` jest tu wolne (spawner nie ma własnych ataków, więc
   * `stepMinionAttack` go nie rusza), więc służy za licznik zrzutów. Losowanie
   * z RNG symulacji = identyczny opad na każdym kliencie (determinizm).
   */
  private stepSpewer(mi: Minion, def: MinionDef): void {
    if (mi.attackCooldown > 0) { mi.attackCooldown--; return; }
    mi.attackCooldown = def.attackIntervalTicks;
    const spews = def.spews!;
    const meteor = minionById(spews.minionId);
    if (!meteor) return;
    for (let i = 0; i < spews.count; i++) {
      // sqrt(rnd) rozkłada punkty RÓWNOMIERNIE po polu (bez zagęszczenia w środku).
      const ang = this.rng.next() * Math.PI * 2;
      const rad = Math.sqrt(this.rng.next()) * spews.radius;
      this.spawnMinion(meteor, mi.ownerIndex, mi.x + Math.cos(ang) * rad, mi.y + Math.sin(ang) * rad);
    }
  }

  /**
   * Wykonanie KOMENDY (`MinionDef.command`): jednostka mknie w zadany punkt
   * i co tick nakłada status w promieniu. Generyczne — konkretny efekt
   * (dziś: strach ducha) jest DANYMI, więc kolejne skille summonów to wpis.
   */
  private stepMinionCommand(mi: Minion, def: MinionDef): void {
    mi.commandTicks--;
    const cmd = def.command;
    if (!cmd) return;

    const dx = mi.commandX - mi.x;
    const dy = mi.commandY - mi.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const step = cmd.speed * C.TICK_DT;
    if (dist > step) {
      const pos = this.pushOutOfObstacles(mi.x + (dx / dist) * step, mi.y + (dy / dist) * step, def.radius);
      mi.x = Math.min(Math.max(pos.x, def.radius), C.WORLD_W - def.radius);
      mi.y = Math.min(Math.max(pos.y, def.radius), C.WORLD_H - def.radius);
    }

    if (cmd.status && cmd.statusRadius) {
      const si = statusIndexById(cmd.status);
      if (si >= 0) {
        this.hash.forEachNear(mi.x, mi.y, cmd.statusRadius + C.MOB_RADIUS_MAX, (i) => {
          const m = this.mobs[i];
          if (!m.alive) return;
          const reach = cmd.statusRadius! + ENEMIES[m.defIndex].radius;
          const ddx = m.x - mi.x;
          const ddy = m.y - mi.y;
          if (ddx * ddx + ddy * ddy <= reach * reach) this.applyStatus(m, si, mi.ownerIndex);
        });
      }
    }
  }

  private moveMinion(mi: Minion, def: MinionDef, target: Mob | null): void {
    // `follow` trzyma się właściciela, `hunt` idzie po najbliższego wroga.
    let tx: number;
    let ty: number;
    if (def.movement === 'follow') {
      const owner = this.players[mi.ownerIndex];
      tx = owner.x;
      ty = owner.y;
      const dx = tx - mi.x;
      const dy = ty - mi.y;
      // Blisko właściciela stoimy — inaczej jednostka wibruje wokół niego.
      if (dx * dx + dy * dy < 90 * 90) return;
    } else {
      if (!target) return;
      tx = target.x;
      ty = target.y;
    }

    const dx = tx - mi.x;
    const dy = ty - mi.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const step = def.speed * C.TICK_DT;
    const nx = mi.x + (dx / dist) * step;
    const ny = mi.y + (dy / dist) * step;
    const pos = this.pushOutOfObstacles(nx, ny, def.radius);
    mi.x = Math.min(Math.max(pos.x, def.radius), C.WORLD_W - def.radius);
    mi.y = Math.min(Math.max(pos.y, def.radius), C.WORLD_H - def.radius);

    // Walka wręcz: dotknięcie wroga rani go i nas (jeśli mamy HP).
    if (def.contactDamage > 0 && target) {
      const reach = def.radius + ENEMIES[target.defIndex].radius;
      const tdx = target.x - mi.x;
      const tdy = target.y - mi.y;
      if (tdx * tdx + tdy * tdy <= reach * reach && mi.attackCooldown <= 0) {
        mi.attackCooldown = Math.round(0.6 * C.TICK_RATE);
        target.hp -= def.contactDamage * (this.players[mi.ownerIndex]?.minionDamageMult ?? 1);
        target.lastHitTick = this.tick;
        if (target.hp <= 0) this.killMob(target, this.players[mi.ownerIndex]);
        // Rój szczurów roznosi zarazę: ugryzienie nakłada `contactStatus`.
        else if (def.contactStatus) {
          const si = statusIndexById(def.contactStatus);
          if (si >= 0) this.applyStatus(target, si, mi.ownerIndex);
        }
      }
    }
  }

  /** Jednostki z HP obrywają od stykających się wrogów (duzi przywołańcy). */
  private damageMinionByContact(mi: Minion, def: MinionDef): void {
    let incoming = 0;
    this.hash.forEachNear(mi.x, mi.y, def.radius + C.MOB_RADIUS_MAX, (i) => {
      const m = this.mobs[i];
      if (!m.alive) return;
      const reach = def.radius + ENEMIES[m.defIndex].radius;
      const dx = m.x - mi.x;
      const dy = m.y - mi.y;
      if (dx * dx + dy * dy <= reach * reach) incoming += ENEMIES[m.defIndex].contactDamage;
    });
    if (incoming <= 0) return;
    mi.hp -= incoming * this.enemyDamageMult * C.TICK_DT;
    if (mi.hp <= 0) mi.alive = false;
  }

  /**
   * Cykl ataków jednostki. Świadomie ten sam kształt co u bossów
   * (`stepBoss`): zamach → wykonanie → odpoczynek, ataki brane po kolei
   * z listy. Dzięki temu duży przywołaniec może dostać ataki bossa 1:1.
   */
  private stepMinionAttack(mi: Minion, def: MinionDef, target: Mob | null): void {
    if (mi.attackCooldown > 0) mi.attackCooldown--;

    if (mi.state === 'windup' || mi.state === 'recover') {
      mi.stateTicks--;
      if (mi.stateTicks <= 0) {
        if (mi.state === 'windup') this.executeMinionAttack(mi, def, target);
        else mi.state = 'idle';
      }
      return;
    }

    if (mi.attackCooldown > 0) return;
    const attack = def.attacks[mi.attackIndex];
    // PUŁAPKA leży bezczynnie, dopóki ktoś na nią nie wejdzie. To jedyny
    // sposób, w jaki jednostka reaguje na wroga zamiast działać z własnej
    // inicjatywy — bez tego każda mina byłaby wieżyczką.
    if (def.triggerRadius && (!target || this.distTo(mi, target) > def.triggerRadius)) return;
    // Atak wymagający celu czeka, aż ktoś wejdzie w zasięg.
    if (attack.kind === 'bolt' && (!target || this.distTo(mi, target) > attack.range)) return;
    if (attack.windupTicks <= 0) {
      this.executeMinionAttack(mi, def, target);
      return;
    }
    mi.state = 'windup';
    mi.stateTicks = attack.windupTicks;
  }

  private distTo(mi: Minion, m: Mob): number {
    return Math.sqrt((m.x - mi.x) * (m.x - mi.x) + (m.y - mi.y) * (m.y - mi.y));
  }

  private executeMinionAttack(mi: Minion, def: MinionDef, target: Mob | null): void {
    const attack = def.attacks[mi.attackIndex];
    const owner = this.players[mi.ownerIndex];
    // Obrażenia jednostki liczymy dwojako:
    //  - `scalesWithOwner` (turret buildera): `attack.damage` jest MNOŻNIKIEM
    //    obrażeń zwarcia gracza, a trafienie łapie jego kryty (`rollDamage`);
    //  - klasycznie: płaskie `attack.damage` × stat sumonera `minionDamageMult`.
    const scaleOwner = def.scalesWithOwner ? owner : null;
    const power = owner?.minionDamageMult ?? 1;
    const dmgOf = (t?: Mob): number =>
      scaleOwner
        ? this.rollDamage(scaleOwner, this.meleeDamageOf(scaleOwner) * attack.damage, t)
        : attack.damage * power;

    switch (attack.kind) {
      case 'bolt': {
        if (!target) break;
        const d = this.distTo(mi, target) || 1;
        this.spawnProjectile(
          mi.x, mi.y,
          ((target.x - mi.x) / d) * attack.projectileSpeed,
          ((target.y - mi.y) / d) * attack.projectileSpeed,
          dmgOf(target),
          true,
          {
            // Pominięte w danych = zwykły pocisk, więc stare wieżyczki
            // zachowują się dokładnie jak przedtem. Turret gracza (`scalesWithOwner`)
            // dokłada odbicia z jego zwieńczenia (`OVERCHARGE`), z sensownymi
            // domyślnymi zasięgiem/wytraceniem, gdy dane bolta ich nie mają.
            chains: (attack.chains ?? 0) + (scaleOwner ? scaleOwner.turretBoltChains : 0),
            chainRange: attack.chainRange ?? (scaleOwner?.turretBoltChains ? 240 : 0),
            chainFalloff: attack.chainFalloff ?? 0.8,
            ownerIndex: mi.ownerIndex,
            visual: attack.visual ?? '',
          },
        );
        break;
      }
      case 'ring': {
        for (let i = 0; i < attack.count; i++) {
          const a = (i / attack.count) * Math.PI * 2;
          this.spawnProjectile(
            mi.x, mi.y,
            Math.cos(a) * attack.projectileSpeed,
            Math.sin(a) * attack.projectileSpeed,
            dmgOf(),
            true,
          );
        }
        break;
      }
      case 'slam': {
        const knockback = attack.knockback ?? 0;
        const statusIndex = attack.status ? statusIndexById(attack.status) : -1;
        this.hash.forEachNear(mi.x, mi.y, attack.hitRadius + C.MOB_RADIUS_MAX, (i) => {
          const m = this.mobs[i];
          if (!m.alive) return;
          const reach = attack.hitRadius + ENEMIES[m.defIndex].radius;
          const dx = m.x - mi.x;
          const dy = m.y - mi.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > reach * reach) return;
          if (statusIndex >= 0) this.applyStatus(m, statusIndex, mi.ownerIndex);
          // Pole BEZ obrażeń nie ma migotać przy każdym tyknięciu — inaczej
          // samo spowolnienie wyglądałoby jak ciągłe bicie.
          if (attack.damage > 0) {
            m.hp -= dmgOf(m);
            m.lastHitTick = this.tick;
            if (m.hp <= 0) {
              this.killMob(m, this.players[mi.ownerIndex]);
              return;
            }
          }
          if (knockback <= 0 || m.bossIndex >= 0) return;
          const d = Math.sqrt(d2) || 1;
          const kb = this.pushOutOfObstacles(
            m.x + (dx / d) * knockback,
            m.y + (dy / d) * knockback,
            ENEMIES[m.defIndex].radius,
          );
          m.x = Math.min(Math.max(kb.x, C.MOB_RADIUS), C.WORLD_W - C.MOB_RADIUS);
          m.y = Math.min(Math.max(kb.y, C.MOB_RADIUS), C.WORLD_H - C.MOB_RADIUS);
        });
        break;
      }
    }

    // Zużycie ładunku. Po ostatnim jednostka znika razem z wybuchem —
    // patrz `MinionDef.charges`.
    if (mi.chargesLeft > 0) {
      mi.chargesLeft--;
      if (mi.chargesLeft === 0) {
        mi.alive = false;
        return;
      }
    }

    mi.state = attack.recoverTicks > 0 ? 'recover' : 'idle';
    mi.stateTicks = attack.recoverTicks;
    mi.attackIndex = (mi.attackIndex + 1) % def.attacks.length;
    // Turret buildera strzela tak szybko, jak szybko bije gracz — więc OVERCLOCK
    // (empower atak speedu) przyspiesza działko za darmo, przez ten sam mnożnik.
    mi.attackCooldown = def.scalesWithOwner
      ? this.ownerScaledInterval(def.attackIntervalTicks, owner)
      : def.attackIntervalTicks;
  }

  /** Interwał ataku jednostki skalowany prędkością ataku właściciela. */
  private ownerScaledInterval(base: number, owner?: Player): number {
    if (!owner) return base;
    const as = owner.attackSpeedMult * owner.auraAttackSpeedMult;
    return Math.max(2, Math.round(base / Math.max(0.01, as)));
  }

  /**
   * Wskrzeszenie zabitego wroga po stronie gracza (hiena nekromantka).
   * Wywoływane z `killMob`, więc działa niezależnie od tego, CZYM wróg zginął.
   */
  private tryRaise(m: Mob, killer: Player): void {
    if (killer.raiseRadius <= 0 || m.bossIndex >= 0) return;
    const dx = m.x - killer.x;
    const dy = m.y - killer.y;
    if (dx * dx + dy * dy > killer.raiseRadius * killer.raiseRadius) return;
    const def = minionById('thrall');
    if (def) this.spawnMinion(def, killer.index, m.x, m.y);
  }

  private applyContactDamage(p: Player): void {
    if (p.hurtCooldown > 0) {
      p.hurtCooldown--;
      return;
    }
    let maxRadius = 0;
    for (const e of ENEMIES) maxRadius = Math.max(maxRadius, e.radius);
    const searchDist = C.PLAYER_RADIUS + maxRadius;

    let damage = 0;
    let touching = 0;
    // Thorns (item 14): każdy dotykający wróg dostaje obrażenia odwetowe.
    this.hash.forEachNear(p.x, p.y, searchDist, (i) => {
      const m = this.mobs[i];
      if (!m.alive) return;
      // Ogłuszony ani przestraszony nie rani dotknięciem. Obrażenia kontaktowe
      // to OSOBNA ścieżka od AI moba, więc bez tego wróg „zamrożony" albo
      // „uciekający" dalej by parzył i umiejętność wyglądałaby na zepsutą.
      if (this.mobStunned(m) || this.mobFeared(m)) return;
      const def = ENEMIES[m.defIndex];
      const contactDist = C.PLAYER_RADIUS + def.radius;
      const dx = m.x - p.x;
      const dy = m.y - p.y;
      if (dx * dx + dy * dy > contactDist * contactDist) return;

      touching++;
      damage = Math.max(damage, def.contactDamage);
      const thorns = Math.min(ITEM_CAPS.thornsMax, p.thornsDamage + p.gearThorns);
      if (thorns > 0) {
        m.hp -= thorns;
        m.lastHitTick = this.tick;
        if (m.hp <= 0) this.killMob(m, p);
      }
    });

    if (damage > 0) {
      // Im większy tłok, tym mocniej boli — bez tego stanie w hordzie było
      // bezpieczne, bo globalny cooldown zrównywał 300 wrogów z jednym.
      const crowdMult = Math.min(
        CONTACT_CONFIG.crowdDamageMaxMultiplier,
        1 + (touching - 1) * (CONTACT_CONFIG.crowdDamagePercentPerEnemy / 100),
      );
      this.damagePlayer(p, damage * crowdMult * this.enemyDamageMult);
    }
  }

  /**
   * Wspólna bramka obrażeń gracza — kontakt i pociski dzielą cooldown
   * nietykalności. Kolejność: Overshield pochłania całe trafienie,
   * inaczej Armor redukuje płasko (minimum 1 obrażenie).
   */
  private damagePlayer(p: Player, amount: number): void {
    if (p.dead || p.hurtCooldown > 0) return;
    // Zając w skoku jest nad hordą — nic go nie dosięga. To jego sygnatura,
    // więc bramka jest tutaj: dotyczy i kontaktu, i pocisków naraz.
    if (this.isAirborne(p)) return;
    p.hurtCooldown = C.PLAYER_HURT_COOLDOWN_TICKS;
    if (p.shieldCharges > 0) {
      p.shieldCharges--;
      p.lastShieldTick = this.tick;
      return;
    }
    // Armor bazowy (romby) + gear, clamp na SUMIE do `armorMax`; aura osobno na wierzchu.
    const armor = Math.min(ITEM_CAPS.armorMax, p.armorFlat + p.gearArmorFlat);
    const reduced = Math.max(1, amount - (armor + p.auraArmorFlat));
    p.hp = Math.max(0, p.hp - reduced);
    if (p.hp <= 0) {
      p.dead = true;
      p.hasMoveTarget = false;
    }
  }

  /* ── Itemy ────────────────────────────────────────────────────────────── */

  /** Jedyne miejsce uśmiercania moba: liczniki, leech i rzut na drop. */
  private killMob(m: Mob, killer: Player): void {
    m.alive = false;
    // Zdejmij ten cel każdemu, kto go trzymał — inaczej `targetMob` wisiałby na
    // slocie, który pool zaraz odda nowemu wrogowi (recycle). Porównanie przez
    // tożsamość obiektu trafia dokładnie w tego moba, nie w jego następcę.
    for (const pl of this.players) {
      if (pl.targetMob >= 0 && this.mobs[pl.targetMob] === m) pl.targetMob = -1;
    }
    this.aliveMobs--;
    this.kills++;
    // WEREWOLF: zabójstwo w formie dolewa jej czasu (do sufitu). Dotyczy KAŻDEGO
    // zabójstwa — także bossa — więc łańcuch rzezi trzyma wilkołaka w transie.
    if (killer.transformTicks > 0 && killer.transformKillExtend > 0) {
      killer.transformTicks = Math.min(
        killer.transformMaxTicks, killer.transformTicks + killer.transformKillExtend,
      );
    }
    // PACK INSTINCT rośnie WYŁĄCZNIE za zabójstwa w grupie — samotne
    // polowanie nie buduje watahy. `allyCount` jest z tego ticku (stepPack).
    if (killer.packLeader && killer.allyCount > 0) {
      killer.packInstinct = Math.min(
        ALPHA_PACK.instinctMax, killer.packInstinct + ALPHA_PACK.instinctPerKill,
      );
    }
    if (m.bossIndex >= 0) {
      // Boss padł. `bossIndex = -1` sprawia, że getter `bossMobIndex` przestaje
      // go liczyć (a przejęty przez zwykłego moba slot i tak ma bossIndex -1).
      // Wave kończy się, gdy WSZYSCY bossowie fali polegną (`bossDefeated` getter).
      m.bossIndex = -1;
      killer.kills++;
      killer.gold += GOLD_PER_BOSS;
      // LEGENDARKA: tylko z bossa, pod klasę+spec zabójcy, bez dubli. Kładzie się
      // na ziemi w miejscu bossa — zabójca podnosi ją do plecaka (jak każdy gear).
      const leg = this.rollLegendary(killer);
      if (leg) this.dropGearPiece(m.x, m.y, leg);
      // Boss to nie jest „jeden mob" — daje tyle, co cała fala zwykłych.
      this.gainXp(killer, this.waveXp);
      return;
    }
    this.aliveByType[m.defIndex]--;
    killer.kills++;
    killer.gold += GOLD_PER_KILL;
    this.gainXp(killer, PROGRESSION.xpPerKill);
    const leech = Math.min(ITEM_CAPS.leechMax, killer.leechHealPerKill + killer.gearLeech);
    if (leech > 0) {
      killer.hp = Math.min(this.maxHpOf(killer), killer.hp + leech);
    }
    this.tryRaise(m, killer);
    // GEAR najpierw — rzadszy, własny roll. Gdy padnie gear, romb z tego moba
    // już nie leci (jeden drop na zabójstwo). Źródło/szansa/rarity → Faza 6.
    if (this.rng.next() * 100 < GEAR_DROP.dropChancePercent) {
      this.dropGear(m.x, m.y);
    } else {
      const dropChance = DROP_CONFIG.dropChancePercent + killer.dropChanceBonus;
      if (this.rng.next() * 100 < dropChance) this.dropItem(m.x, m.y);
    }
  }

  private dropItem(x: number, y: number): void {
    let slot = -1;
    for (let i = 0; i < this.pickups.length; i++) {
      if (!this.pickups[i].alive) {
        slot = i;
        break;
      }
    }
    if (slot === -1) return;

    // Losowanie typu wg wag z itemsConfig.ts.
    let totalWeight = 0;
    for (let i = 0; i < ITEMS.length; i++) totalWeight += ITEMS[i].weight;
    let roll = this.rng.next() * totalWeight;
    let defIndex = 0;
    for (let i = 0; i < ITEMS.length; i++) {
      roll -= ITEMS[i].weight;
      if (roll <= 0) {
        defIndex = i;
        break;
      }
    }

    const p = this.pickups[slot];
    p.alive = true;
    p.defIndex = defIndex;
    p.gear = null; // slot mógł wcześniej nieść gear — wyczyść referencję
    p.x = x;
    p.y = y;
    p.ttl = Math.round(DROP_CONFIG.despawnSeconds * C.TICK_RATE);
  }

  /** Upuszcza zrollowaną (losową) część gearu na ziemię (ten sam pool co romby). */
  private dropGear(x: number, y: number): void {
    this.dropGearPiece(x, y, this.rollGearPiece());
  }

  /** Kładzie KONKRETNĄ część na ziemi — wspólne dla dropu losowego i legendarki. */
  private dropGearPiece(x: number, y: number, piece: GearPiece): void {
    let slot = -1;
    for (let i = 0; i < this.pickups.length; i++) {
      if (!this.pickups[i].alive) { slot = i; break; }
    }
    if (slot === -1) return;
    const p = this.pickups[slot];
    p.alive = true;
    p.defIndex = -1; // -1 = to gear, nie romb
    p.gear = piece;
    p.x = x;
    p.y = y;
    p.ttl = Math.round(DROP_CONFIG.despawnSeconds * C.TICK_RATE);
  }

  /**
   * Losuje legendarkę dla gracza (drop z bossa): pod jego klasę + WYBRANY spec,
   * z pominięciem już posiadanych (założone lub w plecaku) — bez dubli. null gdy
   * brak speca albo wszystkie już ma. Deterministycznie przez `this.rng`.
   */
  private rollLegendary(p: Player): GearPiece | null {
    if (p.specIndex < 0) return null;
    const branch = branchesFor(p.cls.id)[p.specIndex];
    if (!branch) return null;
    const owned = this.ownedUniqueIds(p);
    const pool = legendariesFor(p.cls.id, branch.id).filter((l) => !owned.has(l.id));
    if (pool.length === 0) return null;
    const def = pool[Math.floor(this.rng.next() * pool.length)];
    return {
      id: this.nextGearId++,
      slotType: def.slotType,
      twoHanded: def.twoHanded,
      name: def.name,
      rarity: LEGENDARY_RARITY,
      affixes: def.affixes.map((a) => ({ ...a })),
      unique: def.id,
    };
  }

  /** Zbiór id legendarek, które gracz już posiada (założone + plecak) — anty-dubel. */
  private ownedUniqueIds(p: Player): Set<string> {
    const s = new Set<string>();
    for (const piece of p.equipped) if (piece?.unique) s.add(piece.unique);
    for (const piece of p.bag) if (piece?.unique) s.add(piece.unique);
    return s;
  }

  /* ── Sklep runowy (przerwa) ─────────────────────────────────────────────── */

  /** Generuje ofertę sklepu na przerwę (deterministycznie przez `this.rng`). */
  private rollShop(p: Player): void {
    p.shopOffers = [];
    for (let i = 0; i < SHOP_SIZE; i++) p.shopOffers.push(this.rollShopOffer());
  }

  /** Jedna pozycja sklepu: 60% gear (losowany), 40% romb/boost statu. */
  private rollShopOffer(): ShopOffer {
    if (this.rng.next() < 0.6) {
      const piece = this.rollGearPiece();
      return {
        kind: 'gear', price: (SELL_VALUE[piece.rarity] ?? 5) * GEAR_PRICE_MULT, sold: false,
        gear: piece, upgradeKind: 'strength', upgradeValue: 0,
        label: piece.name, color: RARITIES[piece.rarity].color,
      };
    }
    const def = this.pickShopUpgrade();
    return {
      kind: 'upgrade', price: UPGRADE_PRICE, sold: false,
      gear: null, upgradeKind: def.kind, upgradeValue: def.value,
      label: def.name, color: def.color,
    };
  }

  /** Ważony wybór romba do sklepu — z tej samej puli co karty ulepszeń. */
  private pickShopUpgrade(): UpgradeDef {
    let total = 0;
    for (const u of UPGRADES) total += u.weight;
    let roll = this.rng.next() * total;
    for (const u of UPGRADES) { roll -= u.weight; if (roll <= 0) return u; }
    return UPGRADES[0];
  }

  /** Obsługa komend sklepu (kupno/reroll) — wywoływana w przerwie. */
  private handleShop(p: Player, input: SimInput): void {
    if (input.shopBuy >= 0 && input.shopBuy < p.shopOffers.length) {
      const o = p.shopOffers[input.shopBuy];
      if (o && !o.sold && p.gold >= o.price) {
        if (o.kind === 'gear' && o.gear && this.stashInBag(p, o.gear)) {
          p.gold -= o.price;
          o.sold = true;
        } else if (o.kind === 'upgrade') {
          p.gold -= o.price;
          this.applyEffect(p, o.upgradeKind, o.upgradeValue);
          o.sold = true;
        }
      }
    }
    if (input.shopReroll && p.gold >= SHOP_REROLL_COST) {
      p.gold -= SHOP_REROLL_COST;
      this.rollShop(p);
    }
  }

  /**
   * Losuje część gearu: slot → tier rarity → z niego liczba afixów → dobór
   * RÓŻNYCH kindów z puli slotu → roll wartości z zakresu × mnożnik rarity.
   * Deterministycznie przez `this.rng`; `id` z monotonicznego `nextGearId`.
   * Unikalne mechaniki legendarek świadomie odłożone (patrz TODOS).
   */
  private rollGearPiece(): GearPiece {
    const slotType = GEAR_SLOT_TYPES[Math.floor(this.rng.next() * GEAR_SLOT_TYPES.length)];
    const rarityIdx = this.rollRarityIndex();
    const rarity = RARITIES[rarityIdx];

    // Kopia puli — losujemy BEZ powtórek (jeden kind na część).
    const pool = SLOT_AFFIX_POOL[slotType].slice();
    const count = Math.min(rarity.affixCount, pool.length);
    const affixes: GearAffix[] = [];
    for (let n = 0; n < count; n++) {
      const kind = pool.splice(Math.floor(this.rng.next() * pool.length), 1)[0];
      affixes.push({ kind, value: this.rollAffixValue(kind, rarity) });
    }

    const twoHanded = slotType === 'weapon' && this.rng.next() < 0.3;
    return {
      id: this.nextGearId++,
      slotType,
      twoHanded,
      name: this.gearName(slotType, twoHanded, rarity),
      rarity: rarityIdx,
      affixes,
    };
  }

  /** Ważony wybór tieru rarity (indeks w RARITIES). */
  private rollRarityIndex(): GearRarity {
    let total = 0;
    for (const r of RARITIES) total += r.weight;
    let roll = this.rng.next() * total;
    for (let i = 0; i < RARITIES.length; i++) {
      roll -= RARITIES[i].weight;
      if (roll <= 0) return i as GearRarity;
    }
    return 0;
  }

  /** Roll wartości afixu z zakresu × mnożnik rarity; liczniki → int (min 1). */
  private rollAffixValue(kind: ItemKind, rarity: RarityDef): number {
    const range = GEAR_AFFIX_RANGE[kind] ?? [0, 0];
    const value = (range[0] + this.rng.next() * (range[1] - range[0])) * rarity.valueMult;
    if (kind === 'projectileCount' || kind === 'chainCount') {
      return Math.max(1, Math.round(value));
    }
    return Math.round(value * 10) / 10; // 0.1 precyzji — czytelne w UI
  }

  /** Robocza nazwa części (EN) z prefiksem rarity, np. „Rare Ring". */
  private gearName(slotType: GearSlotType, twoHanded: boolean, rarity: RarityDef): string {
    const base: Record<GearSlotType, string> = {
      weapon: twoHanded ? 'Greatweapon' : 'Weapon',
      offhand: 'Off-hand', head: 'Helm', body: 'Chestplate', legs: 'Greaves',
      ring: 'Ring', amulet: 'Amulet', boots: 'Boots', gloves: 'Gauntlets', belt: 'Belt',
    };
    return `${rarity.name} ${base[slotType]}`;
  }

  /** Item zbiera pierwszy gracz, który do niego dojdzie (kto pierwszy, ten lepszy). */
  private stepPickups(): void {
    for (let i = 0; i < this.pickups.length; i++) {
      const item = this.pickups[i];
      if (!item.alive) continue;
      item.ttl--;
      if (item.ttl <= 0) {
        item.alive = false;
        item.gear = null;
        continue;
      }
      for (const p of this.players) {
        if (p.dead) continue;
        const radius = this.pickupRadiusOf(p);
        const dx = item.x - p.x;
        const dy = item.y - p.y;
        if (dx * dx + dy * dy > radius * radius) continue;
        if (item.gear) {
          // Gear → plecak. Pełny plecak = zostaw na ziemi (może inny gracz albo później).
          if (!this.stashInBag(p, item.gear)) continue;
          p.lastGearTick = this.tick;
          p.lastGearName = item.gear.name;
          p.lastGearRarity = item.gear.rarity;
          item.gear = null;
        } else {
          this.collectItem(p, item.defIndex);
        }
        item.alive = false;
        break;
      }
    }
  }

  private collectItem(p: Player, defIndex: number): void {
    const def = ITEMS[defIndex];
    p.itemCounts[defIndex]++;
    p.totalItemsCollected++;
    p.lastPickupTick = this.tick;
    p.lastPickupDefIndex = defIndex;
    this.applyEffect(p, def.kind, def.value);
  }

  /**
   * Jedna implementacja efektów dla itemów (dropy), ulepszeń (przerwa)
   * i bonusów meta. Różnią się tylko wartościami.
   */
  private applyEffect(p: Player, kind: ItemKind, value: number): void {
    switch (kind) {
      case 'medkit':
        p.hp = Math.min(this.maxHpOf(p), p.hp + value);
        break;
      case 'armor':
        p.armorFlat = Math.min(ITEM_CAPS.armorMax, p.armorFlat + value);
        break;
      case 'speed':
        p.speedMult += value / 100;
        break;
      case 'attackSpeed':
        p.attackSpeedMult += value / 100;
        break;
      case 'range':
        p.rangeMult += value / 100;
        break;
      case 'strength':
        p.damageMult += value / 100;
        break;
      case 'attackDamage':
        p.attackDamageMult += value / 100;
        break;
      case 'skillPower':
        p.skillPowerMult += value / 100;
        break;
      case 'overshield':
        p.shieldCharges = Math.min(ITEM_CAPS.maxShieldCharges, p.shieldCharges + value);
        break;
      case 'regen':
        p.regenPerSec = Math.min(ITEM_CAPS.regenMax, p.regenPerSec + value);
        break;
      case 'maxHp':
        p.maxHpBonus += value;
        p.hp = Math.min(this.maxHpOf(p), p.hp + value);
        break;
      case 'cooldown':
        p.cooldownMult = Math.max(ITEM_CAPS.minCooldownMult, p.cooldownMult - value / 100);
        break;
      case 'critChance':
        p.critChance = Math.min(ITEM_CAPS.critChanceMax, p.critChance + value);
        break;
      case 'critDamage':
        p.critDamageMult += value / 100;
        break;
      case 'raiseDead':
        p.raiseRadius += value;
        break;
      case 'minionDamage':
        p.minionDamageMult += value / 100;
        break;
      case 'minionHp':
        p.minionHpMult += value / 100;
        break;
      case 'minionDuration':
        p.minionDurationMult += value / 100;
        break;
      case 'minionCount':
        p.minionCountBonus += value;
        break;
      case 'impactRadius':
        p.impactRadiusMult += value / 100;
        break;
      case 'projectileCount':
        p.projectileCountBonus += value;
        break;
      case 'chainCount':
        p.chainCountBonus += value;
        break;
      case 'drainTargets':
        p.drainExtraTargets += value;
        break;
      case 'summonCount':
        p.summonCountBonus += value;
        break;
      case 'chainDamage':
        p.chainDamageMult += value / 100;
        break;
      case 'leech':
        p.leechHealPerKill = Math.min(ITEM_CAPS.leechMax, p.leechHealPerKill + value);
        break;
      case 'magnet':
        p.magnetBonus += value;
        break;
      case 'knockback':
        p.knockbackMult += value / 100;
        break;
      case 'thorns':
        p.thornsDamage = Math.min(ITEM_CAPS.thornsMax, p.thornsDamage + value);
        break;
    }
  }

  /**
   * Przelicza warstwę GEAR od zera i wpina ją w staty gracza. Wołane po KAŻDEJ
   * zmianie ekwipunku (i raz przy tworzeniu gracza). Trzy kroki:
   *  1. cofnij poprzedni wkład foldowany (odjęcie — dlatego pola bez capa),
   *  2. zsumuj afixy założonych części do `gearFold` (bez capa) i `gearX` (z capem),
   *  3. dołóż nowy wkład foldowany do pól efektywnych.
   * Staty z capem NIE są tu wpinane w pola efektywne — łączy je i clampuje read-site.
   */
  private recomputeGear(p: Player): void {
    this.applyGearFold(p, -1);

    const g = p.gearFold;
    g.damageMult = 0; g.attackDamageMult = 0; g.skillPowerMult = 0;
    g.attackSpeedMult = 0; g.rangeMult = 0; g.critDamageMult = 0;
    g.knockbackMult = 0; g.speedMult = 0;
    g.maxHpBonus = 0; g.magnetBonus = 0;
    g.projectileCountBonus = 0; g.chainCountBonus = 0;
    p.gearArmorFlat = 0; p.gearCritChance = 0; p.gearRegen = 0;
    p.gearLeech = 0; p.gearThorns = 0; p.gearCooldownMult = 1;

    for (const piece of p.equipped) {
      if (!piece) continue;
      for (const a of piece.affixes) this.accumulateGearAffix(p, a.kind, a.value);
    }

    this.applyGearFold(p, 1);

    // UNIKALNE efekty legendarek — rebuild od zera z założonych części. Sim
    // sprawdza `uniqueEffects.has(id)` w hookach; zdjęcie części zdejmuje efekt.
    p.uniqueEffects.clear();
    for (const piece of p.equipped) {
      if (piece?.unique) p.uniqueEffects.add(piece.unique);
    }

    // Zdjęcie części z +maxHp może obniżyć maks — utnij HP do nowego sufitu.
    p.hp = Math.min(this.maxHpOf(p), p.hp);
  }

  /** Dodaje (`sign=+1`) lub cofa (`sign=-1`) foldowany wkład gearu z pól efektywnych. */
  private applyGearFold(p: Player, sign: number): void {
    const g = p.gearFold;
    p.damageMult += sign * g.damageMult;
    p.attackDamageMult += sign * g.attackDamageMult;
    p.skillPowerMult += sign * g.skillPowerMult;
    p.attackSpeedMult += sign * g.attackSpeedMult;
    p.rangeMult += sign * g.rangeMult;
    p.critDamageMult += sign * g.critDamageMult;
    p.knockbackMult += sign * g.knockbackMult;
    p.speedMult += sign * g.speedMult;
    p.maxHpBonus += sign * g.maxHpBonus;
    p.magnetBonus += sign * g.magnetBonus;
    p.projectileCountBonus += sign * g.projectileCountBonus;
    p.chainCountBonus += sign * g.chainCountBonus;
  }

  /**
   * Wpisuje jeden afiks części do akumulatorów warstwy gear. Kindy BEZ capa →
   * `gearFold` (procent jako ułamek, płaskie/licznik wprost). Kindy Z capem →
   * równoległe `gearX` (surowa suma; clamp dopiero przy odczycie). `value` znaczy
   * to samo co w `itemsConfig.ts`. Kindy spoza gearu są ignorowane (`default`).
   */
  private accumulateGearAffix(p: Player, kind: ItemKind, value: number): void {
    const g = p.gearFold;
    switch (kind) {
      // ── bez capa (fold do pól efektywnych) ──
      case 'strength': g.damageMult += value / 100; break;
      case 'attackDamage': g.attackDamageMult += value / 100; break;
      case 'skillPower': g.skillPowerMult += value / 100; break;
      case 'attackSpeed': g.attackSpeedMult += value / 100; break;
      case 'range': g.rangeMult += value / 100; break;
      case 'critDamage': g.critDamageMult += value / 100; break;
      case 'knockback': g.knockbackMult += value / 100; break;
      case 'speed': g.speedMult += value / 100; break;
      case 'maxHp': g.maxHpBonus += value; break;
      case 'magnet': g.magnetBonus += value; break;
      case 'projectileCount': g.projectileCountBonus += value; break;
      case 'chainCount': g.chainCountBonus += value; break;
      // ── z capem (równoległe; clamp na SUMIE przy odczycie) ──
      case 'armor': p.gearArmorFlat += value; break;
      case 'critChance': p.gearCritChance += value; break;
      case 'regen': p.gearRegen += value; break;
      case 'leech': p.gearLeech += value; break;
      case 'thorns': p.gearThorns += value; break;
      case 'cooldown':
        p.gearCooldownMult = Math.max(ITEM_CAPS.minCooldownMult, p.gearCooldownMult - value / 100);
        break;
      default: break;
    }
  }

  /**
   * Wykonuje komendy ekwipunku z inputu (drop/unequip/equip). Wołane WYŁĄCZNIE
   * w przerwie (`stepBreak`), więc gear zmienia się tylko w bezpiecznym oknie —
   * tak jak wybór ulepszenia. Po każdej realnej zmianie przelicza warstwę gear.
   */
  private handleGearCommands(p: Player, input: SimInput): void {
    let changed = false;

    // SPRZEDAŻ (prawy-klik w plecaku) — część znika, gracz dostaje złoto wg rarity.
    // Najpierw, żeby zwolnić miejsce pod ewentualny swap poniżej.
    const sellIdx = input.dropBag;
    if (sellIdx >= 0 && sellIdx < p.bag.length && p.bag[sellIdx]) {
      p.gold += SELL_VALUE[p.bag[sellIdx]!.rarity] ?? 0;
      p.bag[sellIdx] = null;
    }

    // UNEQUIP: część ze slotu wraca do plecaka (o ile jest miejsce).
    if (input.unequipSlot >= 0 && input.unequipSlot < p.equipped.length) {
      const piece = p.equipped[input.unequipSlot];
      if (piece && this.stashInBag(p, piece)) {
        p.equipped[input.unequipSlot] = null;
        changed = true;
      }
    }

    // EQUIP: część z plecaka na slot (reguła 2H↔off-hand + księgowanie miejsca).
    if (input.equipFromBag >= 0 && input.equipFromBag < p.bag.length) {
      const piece = p.bag[input.equipFromBag];
      if (piece && this.equipPiece(p, input.equipFromBag, piece, input.equipToSlot)) {
        changed = true;
      }
    }

    if (changed) this.recomputeGear(p);
  }

  /** Wkłada część do pierwszego wolnego slotu plecaka; false gdy plecak pełny. */
  private stashInBag(p: Player, piece: GearPiece): boolean {
    for (let i = 0; i < p.bag.length; i++) {
      if (!p.bag[i]) { p.bag[i] = piece; return true; }
    }
    return false;
  }

  /**
   * Pozycja auto-routingu: pierwszy PUSTY slot pasujący typem, a gdy takiego nie
   * ma — pierwszy pasujący (będzie swap). -1 gdy żaden slot nie pasuje typem.
   */
  private autoRouteSlot(p: Player, piece: GearPiece): number {
    let firstMatch = -1;
    for (let i = 0; i < p.equipped.length; i++) {
      if (equipSlotType(i) !== piece.slotType) continue;
      if (firstMatch < 0) firstMatch = i;
      if (!p.equipped[i]) return i;
    }
    return firstMatch;
  }

  /**
   * Zakłada część z plecaka na slot. Reguła 2H↔off-hand:
   *  - broń 2H wypycha off-hand do plecaka,
   *  - cokolwiek zakładane na off-hand wypycha broń 2H do plecaka.
   * Wypchnięte części (z dotychczasowym lokatorem slotu włącznie) muszą zmieścić
   * się w plecaku — inaczej operacja jest ANULOWANA bez żadnej mutacji.
   */
  private equipPiece(p: Player, bagIndex: number, piece: GearPiece, toSlot: number): boolean {
    let slot: number;
    if (toSlot >= 0) {
      if (toSlot >= p.equipped.length || !acceptsPiece(toSlot, piece)) return false;
      slot = toSlot;
    } else {
      slot = this.autoRouteSlot(p, piece);
      if (slot < 0) return false;
    }

    // Pozycje ekwipunku do wypchnięcia do plecaka (wszystkie różne).
    const displaced: number[] = [];
    if (p.equipped[slot]) displaced.push(slot);
    if (blocksOffhand(piece) && slot !== OFFHAND_SLOT_INDEX
        && OFFHAND_SLOT_INDEX >= 0 && p.equipped[OFFHAND_SLOT_INDEX]) {
      displaced.push(OFFHAND_SLOT_INDEX);
    }
    if (slot === OFFHAND_SLOT_INDEX && WEAPON_SLOT_INDEX >= 0) {
      const weapon = p.equipped[WEAPON_SLOT_INDEX];
      if (weapon && blocksOffhand(weapon)) displaced.push(WEAPON_SLOT_INDEX);
    }

    // Miejsce w plecaku PO wyjęciu zakładanej części (jej slot się zwalnia).
    let free = 0;
    for (let i = 0; i < p.bag.length; i++) if (!p.bag[i] || i === bagIndex) free++;
    if (displaced.length > free) return false; // brak miejsca → anuluj bez mutacji

    p.bag[bagIndex] = null;
    for (const idx of displaced) {
      this.stashInBag(p, p.equipped[idx]!);
      p.equipped[idx] = null;
    }
    p.equipped[slot] = piece;
    return true;
  }

  private applyRegen(p: Player): void {
    // Cap wspólny dla rombów i gearu (patrz warstwa gear w interfejsie Player).
    const regen = Math.min(ITEM_CAPS.regenMax, p.regenPerSec + p.gearRegen);
    if (regen <= 0) return;
    p.hp = Math.min(this.maxHpOf(p), p.hp + regen * C.TICK_DT);
  }

  /**
   * Suma kontrolna stanu — w lockstepie każdy klient liczy ją co N ticków
   * i porównuje z resztą. Rozjazd = desync, czyli błąd determinizmu.
   */
  checksum(): number {
    let h = 2166136261 >>> 0;
    const mix = (v: number): void => {
      // Zaokrąglamy do 0.01 px: chroni przed szumem zmiennoprzecinkowym,
      // a wyłapuje każdą realną rozbieżność symulacji.
      h ^= Math.round(v * 100) | 0;
      h = Math.imul(h, 16777619) >>> 0;
    };
    mix(this.tick);
    mix(this.wave);
    mix(this.aliveMobs);
    mix(this.kills);
    for (const p of this.players) {
      mix(p.x);
      mix(p.y);
      mix(p.hp);
      mix(p.dead ? 1 : 0);
      mix(p.left ? 1 : 0);
      // Progresja wpływa na statystyki, więc musi być pilnowana przez sumę
      // kontrolną — inaczej rozjazd talentów ujawniłby się dopiero w obrażeniach.
      mix(p.level);
      mix(p.talentPoints);
      // Specjalizacja zmienia umiejętność, więc rozjazd tutaj oznacza dwie
      // różne postacie — musi być wyłapany od razu, nie dopiero po obrażeniach.
      mix(p.specIndex);
      for (const spent of p.spentPerBranch) mix(spent);
      mix(p.kills);
      mix(p.gold);
      // Ekwipunek wpływa na staty, a plecak jest sterowany inputem (equip =
      // komenda), więc rozjazd w gearze musi być wyłapany tak samo szybko jak
      // rozjazd talentów. `id` instancji wystarcza — różny gear = różne id.
      for (const it of p.equipped) mix(it ? it.id : 0);
      for (const it of p.bag) mix(it ? it.id : 0);
      // Oferta sklepu jest deterministyczna, a kupno to komenda — rozjazd w niej
      // (cena/sprzedane/id) zdradziłby desync w ekonomii, zanim ruszy staty.
      for (const o of p.shopOffers) { mix(o.price); mix(o.sold ? 1 : 0); mix(o.gear ? o.gear.id : 0); }
    }
    // Jednostki wpływają na przebieg walki, więc rozjazd w nich musi być
    // wykryty tak samo szybko jak rozjazd w mobkach.
    for (const mi of this.minions) {
      if (!mi.alive) continue;
      mix(mi.x);
      mix(mi.y);
      mix(mi.hp);
    }
    for (let i = 0; i < this.mobs.length; i++) {
      const m = this.mobs[i];
      if (!m.alive) continue;
      mix(m.x);
      mix(m.y);
      mix(m.hp);
      // Statusy zmieniają prędkość i obrażenia, więc rozjazd w nich musi
      // być wykryty tak samo szybko jak rozjazd pozycji.
      for (const st of m.statuses) {
        mix(st.defIndex);
        mix(st.stacks);
      }
    }
    return h >>> 0;
  }
}
