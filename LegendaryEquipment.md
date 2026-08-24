# Legendary Equipment — projekt (per klasa × drzewko)

**Status: PROPOZYCJE (2026-08-22).** To rozwinięcie odłożonej decyzji „unikalne mechaniki
legendarek" (memory `gear-legendary-mechanics`). Nic z tego nie jest jeszcze wdrożone.

## Zasady projektowe
- **Każde drzewko dostaje 1–3 legendarki**, które **przebudowują jego skille/mechaniki**, a nie
  tylko dosypują liczby. Legendarka to *build-definer*, nie płaski upgrade.
- **Haczą w istniejące prymitywy** silnika (statusy, aury, miniony, transform, onHit, chains,
  execute, speed/hp/lostHp→dmg), więc większość to dane + jeden hook, nie nowy system.
- **Często z tradeoffem** — mocny plus za koszt (mniej HP, węższy promień, „tylko w formie"…),
  żeby był to wybór, a nie oczywistość. Respektują capy (`ITEM_CAPS`) jak reszta gearu.
- **Slot przypisany** — rozrzucone po slotach (`gearConfig.ts`), żeby dało się nosić kilka naraz.

## Notatka wdrożeniowa
- Wymaga **nowego tieru `Legendary`** nad Epic (albo osobnej puli unique'ów) + pola `unique` na
  `GearPiece` (id efektu) — silnik czyta je w odpowiednim miejscu (jak talenty `grants*`).
- Część haczy w **prymitywy jeszcze niezbudowane** (backlog w `TODOS.md`): `ward` (riposta),
  `shield` (co-op), `fling` (kolizja). Oznaczone `⚠ needs <prymityw>`.
- Specjalizacje **`comingSoon`** (fox TRICKSTER, gorilla WARBEAT, boar TUSKS) — legendarki zakładają,
  że spec zostanie zbudowany. Oznaczone `⚠ spec comingSoon`.

---

## 🐻 BEAR

### GRAVITY *(pole grawitacji Q/W/E, `gravity-drag`, crush → singularity)*
- **Event Horizon** — *Amulet* — pole grawitacji **CIĄGNIE** wrogów do środka (nie tylko spowalnia),
  a SINGULARITY dodatkowo `stun`. *(tradeoff: promień pola −25%)*
- **Neutron Core** — *Weapon 2H* — auto-atak wrzuca `gravity-drag` na trafionego; masa daje moc:
  +skillPower, ale −attackDamage.

### RAMPAGE *(berserker `lostHpToDamage`, aura BLOODLUST)*
- **Heart of the Berserker** — *Chest* — obrażenia RAMPAGE liczone tak, jakbyś miał **o 25% mniej HP**
  niż faktycznie (bijesz mocniej wcześniej). *(tradeoff: regen i leech −50% — czysty glass cannon)*
- **Bloodmoon Totem** — *Belt* — poniżej 50% HP BLOODLUST leczy 2× i **wisi na całej drużynie na stałe**.

### HIBERNATION *(sen→kolos, `maxHp`/`armor` tank, Q swipe/W hibernate/E slam/R colossus)*
- **Dreaming Mountain** — *Chest* — podczas HIBERNATE roztaczasz `frostfield` i regen ×2; przebudzenie
  (COLOSSUS) robi falę `stun` 360°.
- **Titanheart** — *Amulet* — 30% Twojego `maxHp` ponad bazę zamienia się w obrażenia (`hpToDamage`
  dla tanka-niedźwiedzia) — obrona staje się ofensywą.

## 🐺 WOLF

### THUNDER FANG *(rykoszet auto-ataku + combo klawiszy)*
- **Stormfang** — *Weapon 1H* — rykoszet skacze **+3 razy** i nakłada `chill` na każdego trafionego.
- **Chain Lightning Collar** — *Amulet* — co 5. auto-atak wypuszcza rykoszet o **2× dłuższym łańcuchu**
  i wyższym `chainDamage`.

### ALPHA PACK *(aura PACK FURY, Pack Instinct, SWIPE echoowany przez wilki)*
- **Alpha's Crown** — *Head* — PACK FURY działa na **2× promieniu** i dodatkowo leczy watahę.
- **Warg Totem** — *Belt* — każdy sojusznik w aurze dorzuca **własną kopię Twojego SWIPE** (siła rośnie
  z liczbą watahy — apex fantasy dowódcy).

### HOWL *(wilkołacza forma karmiona zabójstwami, `attackSpeed`/`leech`)*
- **Moonpelt** — *Chest* — w formie wilkołaka leech +100% i **każdy kill przedłuża formę 2× dłużej**.
- **Feral Instinct** — *Gloves* — w formie attackSpeed +50%, poza formą −attackDamage — zmusza do
  trzymania transu (rdzeń kill-chain).

## 🦊 FOX

### CHRONOMANCER *(Q pułapka, W para portali, E stop czasu)*
- **Hourglass of the Void** — *Amulet* — TIME STOP trwa +50% i **w jego trakcie skille mają zerowy
  cooldown** (okno na burst).
- **Paradox Anchor** — *Ring* — para portali zostawia ślad, który wrzuca `gravity-drag` na przechodzących.

### ARCANE ARCHER *(strzała łańcuchowa Q, `projectileCount`+`chainCount`, blink)*
- **Quiver of Infinity** — *Weapon 2H* — +2 pociski i każdy odbija +2 razy. *(tradeoff: −20% obrażeń na
  pocisk — szeroko zamiast mocno)*
- **Seeker's Eye** — *Ring* — pociski ARCANE ARCHER lekko **naprowadzają** na najbliższego wroga (mniej pudeł).

### TRICKSTER `⚠ spec comingSoon` *(riposta/ward + wabik)*
- **Mirror Cloak** — *Chest* `⚠ needs ward` — reaktywna tarcza: pochłania N ciosów i **ODBIJA %** do napastnika.
- **Trickster's Coin** — *Ring* — po blink zostawia **wabik-iluzję** ściągającą aggro, który po chwili wybucha.

## 🐇 HARE

### SLIPSTREAM *(mobilność, POWER JUMP, TERMINAL VELOCITY)*
- **Windstep Boots** — *Boots* — POWER JUMP ląduje z **2× większą falą** i zostawia `frostfield` w miejscu lądowania.
- **Afterimage Sash** — *Belt* — dash zostawia **świetlny ślad raniący** wrogów po drodze (mobilność = DPS).

### SUMMONER *(Q golem · W hydra · E spirit · R swarm — skalowanie `minion*`)*
- **Beastmaster's Horn** — *Amulet* — R SWARM przyzywa **+50% jednostek**, a wszystkie Twoje summony
  roztaczają aurę `spirit-ward` (pancerz+leczenie).
- **Golemheart Core** — *Weapon 2H* — GOLEM staje się **wieczny** (`ttl −1`) i 2× większy/mocniejszy.
  *(tradeoff: możesz mieć tylko jednego naraz)*
- **Bond of the Pack** — *Ring* — +1 `minionCount` do wszystkich przyzwań; miniony **dziedziczą % Twojego leech**.

### AURA MASTER *(aury slotowe Q/W/E/R: MEND/WARD/TEMPO/RADIANCE + bursty)*
- **Prism of Radiance** — *Amulet* — RADIANCE rani 2× i jej promień skaluje `range` jeszcze mocniej
  (przy maksie czyści ekran).
- **Conductor's Baton** — *Head* — wszystkie 4 aury pasywne działają **JEDNOCZEŚNIE** — użycie skilla nie
  gasi pozostałych na czas cooldownu (apex dyrygenta).

## 🦫 MOLE

### SNIPER *(dalekosiężny pocisk / homing)*
- **Deadeye Scope** — *Head* — pierwszy pocisk w cel z **pełnym HP** dostaje +200% (headshot).
- **Railgun Barrel** — *Weapon 2H* — pocisk **PRZEBIJA** wszystkich w linii zamiast trafić jednego (pierce).

### SAPPER *(burrow + miny/turrety/charge/quake — deployables `minionDamage`)*
- **Demolition Charge** — *Belt* — MINY wybuchają 2× większym promieniem i nakładają `burn`.
- **Auto-Foundry** — *Gloves* — `minionCount` +2 i turrety strzelają 2× szybciej.

### MAGMA *(Q magma bolt, W lava pool, E eruption, R volcano — ogień, `burn`)*
- **Core of the Volcano** — *Weapon 2H* — LAVA POOL i meteory nakładają **stackujący `burn` (do 5)**;
  ERUPTION zostawia trwałą kałużę lawy.
- **Cinderheart** — *Amulet* — wrogowie z `burn` biorą od Ciebie +30% (vulnerability na podpalonych).

## 🦔 HEDGEHOG

### SONIC *(`speedToDamage`, aura MOMENTUM)*
- **Lightspeed Greaves** — *Boots* — nadwyżka prędkości liczy się **podwójnie** do obrażeń
  (`speedToDamage ×2`); MOMENTUM +40%.
- **Sonic Boom Spurs** — *Gloves* — powyżej progu prędkości auto-atak wypuszcza **falę uderzeniową** (AoE za szybkość).

### CURL *(`hpToDamage` tank, IRON CURL kolce)*
- **Aegis of Thorns** — *Chest* — IRON CURL kolce ×2 i **dotknięcie Cię nakłada `venom`**.
- **Unbreakable Shell** — *Amulet* — `hpToDamage ×1.5` i co kilka sekund pierwszy cios jest pochłonięty
  (mini-overshield na kołowrocie).

### BASTION *(builder: turret + ściany, OVERCHARGE = `grantsTurretChains`)*
- **Overcharge Capacitor** — *Amulet* — turret bolt **odbija +3** (jak OVERCHARGE) niezależnie od talentów,
  a każdy odbój +% dmg.
- **Fortress Protocol** — *Belt* `↔ TODO walls` — Twoje ŚCIANY **blokują pociski wroga** (wpina brakujący
  `blocksProjectiles`) i leczą sojuszników za nimi.

## 🦇 BAT

### BLOODSONG *(pasywka: `leech` + `attackSpeed`)*
- **Sanguine Chord** — *Amulet* `↔ onHit` — leech z **KAŻDEGO trafienia** (nie tylko killa) — wpina
  `onHitLifesteal`; wyższy cap.
- **Nightsong Fangs** — *Weapon 1H* — attackSpeed **rośnie z każdym trafieniem w serii** (ramp), reset po przerwie.

### SONAR *(aura SHRIEK → `weaken`, drużynowy amp)*
- **Resonance Crystal** — *Head* — SHRIEK dodatkowo `chill` i na **2× promieniu** — amp + kontrola.
- **Echo Lens** — *Amulet* — wrogowie pod `weaken` biorą **jeszcze więcej** od całej drużyny (silniejszy vulnerability).

### NIGHT TERROR *(DRAIN/`fear`, DRAIN NOVA, multi-drain, `summonCount`)*
- **Crown of Dread** — *Head* — DRAIN sączy z **+2 celów** (`drainExtraTargets`) i `fear` trwa 2× dłużej.
- **Vampire's Embrace** — *Chest* — % zassanego HP **leczy też sojuszników** w pobliżu (support-wampir).

## 🦍 GORILLA

### WRECKER *(pasywka: `strength` + `knockback`)*
- **Wreckingball Fists** — *Gloves* `⚠ needs fling` — knockback zadaje BONUS, gdy wróg wpadnie w innego
  lub w ŚCIANĘ; +strength.
- **Seismic Slam** — *Weapon 2H* — auto-atak co kilka ciosów robi **falę odrzutu 360°**.

### WARBEAT `⚠ spec comingSoon` *(co-op support: shield + aura attack-speedu)*
- **Warchief's Drum** — *Belt* `⚠ needs shield` — aura attack-speedu dla drużyny + okresowa tarcza dla stojących obok.

### IRON GRIP *(GRIP przyciąga+`stun`, aura WAR ROAR = IRONHIDE, tank/taunt)*
- **Gauntlet of Domination** — *Gloves* — IRON GRIP łapie i przyciąga **wielu wrogów naraz** + `stun`.
- **Warlord's Aegis** — *Chest* — WAR ROAR daje też **thorns i taunt** — pełny tank-brawler ściągający hordę.

## 🐀 RAT

### PLAGUEBEARER *(pasywka: `attackSpeed` + `strength`, motyw zarazy)*
- **Rotting Aura** — *Belt* — roztaczasz `MIASMA` (plague) za sobą na stałe; wrogowie w chmurze biorą +%.
- **Patient Zero** — *Amulet* — Twoja zaraza rozprzestrzenia się na **+2 wrogów** i stackuje wyżej.

### SWARM → PLAGUELORD *(plague + `mark`/detonate, rat swarm)*
- **Rupture Sigil** — *Amulet* — DETONATE za burst ∝ stackom, a **zabity zarażony wybucha nową chmurą**
  (łańcuch epidemii przez falę).
- **Swarmlord Scepter** — *Weapon 2H* — R SWARM +50% szczurów, a szczury **roznoszą `plague`** przy ukąszeniu.

### SCURRY *(`onHit` venom, hit-and-run, RABID BLOOD lifesteal)*
- **Fangs of Scurry** — *Weapon 1H* — VENOM stackuje 2× wyżej i mocniej spowalnia (trzyma cel w zasięgu ukąszeń).
- **Rabid Bloodline** — *Amulet* — `onHitLifesteal ×2`; przy pełnym HP nadwyżka staje się tymczasową tarczą.

## 🐗 BOAR

### TOTEM ENGINEER *(Q turret, W pulse, E knockback — totemy)*
- **Overclocked Totems** — *Amulet* — totemy pulsują 2× szybciej, a turret strzela salwą.
- **Totemic Network** — *Belt* — totemy blisko siebie **wzmacniają się nawzajem** (+dmg za każdy sąsiedni totem).

### STAMPEDE *(pasywka: `knockback` + `maxHp`, motyw szarży)*
- **Unstoppable Charge** — *Boots* `⚠ needs fling` — dash staje się **szarżą niosącą wroga**; rzut w grupę/ścianę = bonus.
- **Ironhide Boar** — *Chest* — im szybciej biegniesz, tym więcej armora (speed→armor); szarża daje overshield.

### TUSKS `⚠ spec comingSoon` *(charge + fling)*
- **Goring Tusks** — *Weapon 2H* `⚠ needs fling` — szarża **przebija linię** wrogów i odrzuca; wróg wbity
  w ścianę bierze 2×.

## 🦦 OTTER

### TIDECALLER *(support: TIDAL SURF, aura TIDE GUARD, `soaked`, LIFETIDE)*
- **Tideheart Pendant** — *Amulet* — TIDE GUARD leczy 2× i nakłada `soaked` na większym promieniu (sustain + amp).
- **Evertide Shell** — *Chest* — LIFETIDE i TIDE GUARD działają **JEDNOCZEŚNIE na stałe** (apex Evertide za darmo).

### MIRROR TIDE *(klony echoują ciosy, MIRROR LANCE, PHASE SWAP, THOUSAND MIRRORS)*
- **Fractal Prism** — *Amulet* — każdy klon powtarza nie tylko Q, ale i Twój **AUTO-atak**; +1 klon z R.
- **Twin Fate Ring** — *Ring* — PHASE SWAP z klonem **leczy i daje krótką nietykalność** (narzędzie repozycji/ucieczki).

### PLAYFUL *(pinball/fling, combo odrzutów)*
- **Pinball Paws** — *Gloves* `⚠ needs fling` — odrzuceni odbijają się od ścian/siebie, zadając `fling` łańcuchowo.
- **Bouncing Current** — *Belt* — knockback ×2, a wróg wpadający w innego nakłada `soaked` na obu.

## 🐆 HYENA

### NECROMANCER *(zabici obok wstają, `raiseDead` promień, horda)*
- **Grave Crown** — *Head* — promień wskrzeszania ×2, a wskrzeszeni **wybuchają `plague`** po śmierci.
- **Bonelord's Sigil** — *Amulet* — +`minionCount`, a co N wskrzeszeń rodzi się **większy, mocniejszy nieumarły**.

### SCAVENGER *(pasywka: `strength` + `leech`)*
- **Carrion Feast** — *Belt* — każdy kill leczy i dorzuca krótki **+dmg stack** (ramp za rzeź); wyższy cap leech.

### CACKLE *(`executeToDamage` — egzekucja rannych, NO SURVIVORS)*
- **Laughing Fang** — *Weapon 1H* — próg egzekucji rośnie: wrogowie **<25% HP dobijani natychmiast** (execute).
- **Predator's Grin** — *Amulet* — każdy execute-kill **resetuje cooldowny** i daje burst prędkości (snowball po dobiciach).

---

## Podsumowanie pokrycia
Wszystkie 12 klas × wszystkie drzewka mają propozycje. Prymitywy, w które haczą:
- **Gotowe** (dane + hook): statusy (`burn`/`chill`/`venom`/`plague`/`fear`/`stun`/`soaked`/`weaken`),
  aury, miniony (`minion*`, `ttl`), transform, `onHit`, chains (`chainCount`/`chainDamage`),
  `speed/hp/lostHp→dmg`, `execute`, `raiseDead`, `drainExtraTargets`, `turretChains`.
- **Do zbudowania** (backlog `TODOS.md`): `ward` (riposta — Fox Trickster), `shield` (co-op — Gorilla
  Warbeat), `fling` (kolizja — Gorilla Wrecker, Boar Stampede/Tusks, Otter Playful),
  `blocksProjectiles` na ścianach (Hedgehog Bastion).
- **Specy do zbudowania**: fox TRICKSTER, gorilla WARBEAT, boar TUSKS (`comingSoon`).
