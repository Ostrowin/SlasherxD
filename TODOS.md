# TODOS — WebSlasher

## Do decyzji

- [x] ~~KIERUNEK GRY~~ — **ZDECYDOWANE 2026-07-19:** roguelike-slasher, ssaki vs najeźdźcy z kosmosu, neon sci-fi, co-op 1-8 znajomych (gdd.md sekcje 1, 5.2, 5.4)

## Do dorozwinięcia (motyw jest, szczegóły później)

- [ ] Nazwa gry (WebSlasher to robocza nazwa repo)
- [x] ~~Drzewka umiejętności dla klas~~ — **ZAPROJEKTOWANE 2026-07-20:** 12 klas × 3 specjalizacje jako gałęzie drzewka W RUNIE, bez zapisu i odblokowań (gdd.md 5.8). Wdrożenie: roadmap.md Faza 4.7
- [ ] **Trudność: Void Warden na fali 5 jest ścianą** — 0/36 runów bota przechodzi dalej; człowiek też tam zginął. Złagodzić, przesunąć czy zostawić? (roadmap.md, balans 2026-07-20)
- [ ] **Druga połowa drzewka talentów to martwa treść** — realne runy kończą się na poziomie ~13/25, więc rzędy za 10 i 15 punktów nikt nie widzi
- [ ] **Długość runu** — dziś ~8 min, potrzeba 20-40 min, żeby zmieścił się łuk „goły → maks → master" (gdd.md 5.8)
- [ ] **Los SALVAGE/LAB** — zaimplementowane, ale „zero zapisu" je wywraca: usunąć czy zostawić tylko statystyki? (gdd.md 5.7)
- [ ] Kształt drzewka talentów: ile punktów, ile gałęzi, czy gałąź trzeba domknąć? (gdd.md 5.8)
- [ ] Specjalizacje pozostałych klas (znane: kret → Sniper, zając → Aura Master)
- [ ] Co przyciąga do kolejnego runu bez odblokowań — wybór trudności w lobby? (gdd.md 5.8)
- [ ] Sci-fi bronie (bardzo sci-fi — kierunek potwierdzony, konkrety później)
- [ ] Grafiki (na razie celowo kolory zamiast sprite'ów)
- [~] Więcej bossów — **2026-08-22: fale 5/7/9/10 obsadzone** (Void Warden, PLASMA REAVER, HIVE COLOSSUS,
      Hive Queen). Hive Queen (10) **wzmocniona**: HP 900→1250, +dmg, szybsze ataki, NOWA 3. faza „THE HIVE
      CONSUMES ALL". Nowe bossy mają prymitywy startowe — do STROJENIA. (nowy boss = plik w `src/sim/bosses/`
      + wpis w `index.ts` i `BOSS_WAVES`)
- [ ] **Wybór mapy** — **2026-08-22: szkielet gotowy.** `src/sim/maps.ts` (1 realna `station` = obecna arena
      + 3 `comingSoon`), `MapSelectScene` (klasa → mapa → gra), `GameScene.mapId` przekazany, retry zachowuje mapę.
      ZOSTAJE: realne mapy zmieniające generację świata (przeszkody/rozmiar/pula wrogów) + wybór mapy w co-opie (host).
- [ ] Muzyka (dźwięki są, muzyki nie ma — też do zsyntezowania, bez plików)

## Dalej (po decyzji o motywie)

- [x] ~~Rozstrzygnąć model walki~~ — **HYBRYDA (D10, 2026-07-19):** auto-atak + aktywne skille na klawisze/kombinacje, dużo pasywów; v1 (Power Slash pod spacją) wdrożone
- [ ] Zaprojektować system kombinacji klawiszy dla skilli (składnia combo, buforowanie inputu, czytelność dla gracza; uwaga na lockstep — input rozszerzy się o przyciski skilli)
- [ ] Zatwierdzić zakres MVP (gdd.md sekcja 10)
- [ ] Init projektu: Phaser 3 + TypeScript (decyzja z 2026-07-19) — **z deterministycznym rdzeniem** (gdd.md sekcja 7, decyzja 2026-07-19)

## DOKOŃCZYĆ CO-OP *(zapisane 2026-07-19 — działa, ale niekompletny)*

Co-op gra się dziś **tylko między kartami jednego komputera**. Do grania z ziomkami brakuje:
- [ ] **WebRTC** zamiast `BroadcastChannel` — wymaga decyzji o serwerze sygnałowym (pośrednik!) i o tym, gdzie wystawić grę, żeby ziomek mógł wejść
- [x] ~~**Obsługa rozłączeń**~~ — **ZROBIONE 2026-07-20:** cisza dłuższa niż 5 s (`DROP_AFTER_MS`) usuwa gracza z runu; zamknięcie karty wysyła `leave` i skraca to do ~0,1 s. Tick usunięcia jest UZGADNIANY po sieci (`drop`), nie liczony lokalnie — inaczej każdy klient wyrzuciłby gracza w innym ticku i symulacje by się rozjechały. Zweryfikowane testem 3 klientów: po rozłączeniu sumy kontrolne zostających są identyczne
  - [ ] Zostaje ten sam problem **w lobby**: gdy host zamknie kartę przed startem, goście czekają w nieskończoność (potrzebny wybór nowego hosta)
- [ ] **Bonusy LAB wszystkich graczy** — lobby rozsyła skład, ale nie bonusy meta; zdalni gracze grają bez swoich trwałych ulepszeń

## Decyzje co-op (przed Fazą 4.5, nie blokują startu)

- [x] ~~Ilu graczy maksymalnie?~~ — **1-8 graczy** (decyzja 2026-07-19)
- [ ] Drop-in w trakcie runu czy tylko wspólny start? (drop-in znacznie droższy w lockstepie)
- [ ] Tylko LAN/WebRTC prywatnie czy też gra przez internet? (internet = potrzebny malutki serwer sygnalizacyjny)

---

## Trudność: REAKCJA, nie ściana HP *(kierunek 2026-08)*

Cel: gra ma być **naprawdę trudna przez wymóg SZYBKIEJ REAKCJI**, a nie przez one-shoty
od bossa. Ataki mają być **telegrafowane i unikalne**, ale nietrafienie **KUMULUJE się**
(chip + debuff + zostajesz w tyle z hordą). Śmierć = suma błędów w reakcjach, nie jeden cios.

- [ ] **Wrogowie wymuszający KONKRETNĄ reakcję** (nie tylko „biegnij i bij"): charger (unik
      w bok), bomber (odejdź od pola), sniper (przerwij linię wzroku za budynkiem), grabber
      (nie daj się odizolować), shielded (flankuj — bij z tyłu), enrage-na-niskim-HP (dobij
      albo się cofnij).
- [ ] **Ataki karzące STANIE**: trwałe pola pod nogami, rozszerzające się pierścienie —
      wymuszają ciągły ruch, a nie facetank.
- [ ] **Arena jako narzędzie**: wysokie budynki blokujące LoS pocisków bossa (chowanie się),
      wąskie gardła. Dziś mamy tylko okrągłe głazy (`OBSTACLE_*`) — dołożyć cover.
- [ ] **Bossy fazowe (docelowa wizja)**: ~10 ataków na bossa, każdy wymaga innej reakcji —
      dash pod slam, skok nad falą, schowaj się za budynkiem przed beamem, przejdź kawałek
      w oknie recovery. Rytm faz: **atak → unik · recovery → burst · reposycja → leczenie/schowanie**.
- [ ] **Attack-tool matching**: beam = przerwij LoS, slam = dash-iframe, pull = wydashuj się.
      Boss uczy używać kitu (dash, blink, mur, tarcza), zamiast go ignorować.

### Decyzja: combo i liczba skilli
- [x] **NIE zmuszać wszystkich klas do combo** — to zabija tożsamości (kanały, turret,
      transform…). Combo zostaje **opcjonalną warstwą DODATKOWĄ** na wierzchu Q/W/E/R (jak
      wilk Thunder Fang, ale additive), nagroda dla wymiatających, nie przymus.
- [ ] Rdzeń: **Q/W/E/R + dash** (już 6 wejść ekspresji). Rozważyć **5. slot skilla** dopiero
      po wyciśnięciu warstwy combo. Trudność ma iść z WROGÓW, nie ze skomplikowania klawiatury.
- [ ] Dać każdemu specowi **1–3 opcjonalne combo** (rozbudowa `comboConfig.ts`).

## Nowe prymitywy — backlog *(propozycje 2026-08, inspiracja Dota 2 / WoW)*

Silnikowe „czasowniki" do zbudowania (każdy generyczny, reużywalny przez wiele skilli):

- [ ] **`transform`** — Lycan Shapeshift / DH Metamorphosis / druid forms: czasowa forma
      nadpisuje staty (dmg/speed/atak-speed/pancerz/rozmiar) i opcjonalnie podmienia Q/W/E/R.
      Werewolf, bear-form, demon-form. *(najbardziej soczysty — otwiera kilka klas naraz)*
- [ ] **`ward` (riposta)** — Nyx Spiked Carapace / Centaur Return / Blade Mail: reaktywnie
      pochłania N ciosów, ODBIJA % do napastnika, opcjonalnie go ogłusza. *(przewija się od
      początku sesji — wciąż niezbudowane; idealny pod reaktywną trudność)*
- [ ] **`mark` + detonate** — Venomancer / Bane / WoW Affliction: trafienia nabijają stacki
      klątwy, osobny skill DETONUJE je w AoE za burst ∝ liczbie stacków.
- [ ] **`onHit` (orb)** — orby Doty / trucizny WoW: KAŻDY auto-atak nakłada efekt (status /
      **lifesteal %** / splash). Daje też lifesteal-na-trafienie, którego dziś brak.
- [ ] **`fling` (kolizja)** — Magnus Skewer / Tiny Toss: knockback zadaje BONUS, gdy wróg
      wpadnie w innego LUB w ŚCIANĘ. Realne combo z murami BASTIONa.
- [ ] **`globalStrike`** — Zeus ult / Spectre Haunt: rani WSZYSTKICH na arenie / w ogromnym
      promieniu, opcjonalnie status. Dramatyczne „czyszczenie ekranu" jako ultimate.
- [ ] **`shield` (co-op)** — WoW Power Word: Shield / Abaddon: czasowa tarcza pochłaniająca
      X obrażeń sobie i sojusznikom.

## Kolejne specjalizacje — propozycje *(mapowane na comingSoon, każda pokazuje nowy prymityw)*

- [ ] **Wolf HOWL → WEREWOLF** (`transform`): wycie → forma wilkołaka (+dmg/atak-speed/rozmiar),
      ramp utrzymywany łańcuchem zabójstw.
- [ ] **Fox TRICKSTER → riposta/unik** (`ward`): spiked carapace (odbij+ogłusz) + wabik-iluzja
      (ściąga aggro i wybucha) + blink.
- [ ] **Rat SWARM → PLAGUELORD** (`mark`+detonate): nabij hordę stackami zarazy → RUPTURE
      zmiata falę jednym wciśnięciem. + rój szczurów.
- [ ] **Boar TUSKS → charge + fling** (`fling`): szarża niosąca nabitego wroga; rzut w grupę
      albo w ŚCIANĘ = bonus.
- [ ] **Mole BURROWER → ambush** (stan zakopania + `globalStrike`-lite): zakop się (nietykalny,
      szybki ruch), wynurzenie = EPICENTER (pulsujące fale AoE).
- [ ] **Rat SCURRY → truciciel** (`onHit`): auto-ataki trują i spowalniają, hit-and-run.
- [ ] **Gorilla WARBEAT → co-op support** (`shield` + aura atak-speedu dla drużyny).
- [ ] **Hare AURA MASTER → mobilny support**: wiele aur naraz + `shield`.
- [ ] **Otter PLAYFUL → pinball** (`fling`): odbijasz wrogów tak, że wpadają na siebie.
- [ ] **Bear HIBERNATION → transform obronny** (`transform` + `channel`): sen (regen) →
      przebudzenie w formie-kolosie.
- [ ] **Pasywki → pełne speki**: bat BLOODSONG, gorilla WRECKER, rat PLAGUEBEARER, boar
      STAMPEDE, hyena SCAVENGER (dziś tylko staty).

## Domknięcia z sesji 2026-08 *(drobne, silnikowe)*

- [ ] **Ściany BASTIONa nie blokują POCISKÓW** — `blocksProjectiles` na murach nie jest
      wpięte w `stepProjectiles` (ruch blokują, strzały wciąż przelatują).
- [ ] **Hook `grabsAllies`** (co-op ratunek — dociągnij sojusznika) — stub.
- [ ] **Render taunta** (WAR ROAR / PROVOKE) bez własnej grafiki (widać tylko po aurze / obrocie wrogów).
- [ ] **Strojenie do sprawdzenia w grze**: SONAR (możliwe za słaby — niska baza dmg bata),
      RAMPAGE (bench wygrał moc 9.85 — możliwe za mocny), BASTION (realny zysk dopiero w grze
      ręcznej — bot nie pilotuje buildera).

---

## EKWIPUNEK i SLOTY *(projekt 2026-08-22)*

Gear **run-scoped** (jak romby — resetuje się co run, zero zapisu). Romby-konsumpcje
**zostają, ale rzadsze**. Gear leci OBOK nich, do plecaka, zakładany na **ekranie w fazie
`break`** (nie ma pauzy sim — break to bezpieczne okno bez mobów; equip = komenda w inpucie,
jak `upgradePick`). Warstwa statów gear = **trzecia warstwa równolegle do aur** (`gearX`),
przeliczana `recomputeGear` przy każdej zmianie ekwipunku; capy (`armorMax`, `critChanceMax`,
`minCooldownMult`…) nakładane na SUMĘ baza+gear przy odczycie.

**11 slotów:** broń główna (1H/2H), off-hand (tylko przy 1H), głowa, korpus, **spodnie**,
pierścień ×2, amulet, buty, rękawice, pas. Broń 2H blokuje off-hand w zamian za większy blok statów.

**Oś auto vs skill** (nowe `ItemKind`): `attackDamage` (tylko auto), `skillPower` (tylko skille),
`strength` zostaje uniwersalny (rzadszy, cenniejszy).

### Fazy wdrożenia
- [x] ~~**Faza 0 — fundament danych:** `gearConfig.ts` (typy, `EQUIP_SLOTS`, `GearPiece`, pula
      afixów per slot, `BAG_CAP`) + dopisać `attackDamage`/`skillPower` do `ItemKind`. Zero zachowania.~~
      **ZROBIONE 2026-08-22:** nowy `src/sim/gearConfig.ts`, `ItemKind` += `attackDamage`/`skillPower`. tsc+eslint czyste.
- [x] ~~**Faza 1 — oś auto/skill w pipeline:** pola `attackDamageMult`/`skillPowerMult`; mnożnik auto
      w `applyMelee`; helper `skillDamageOf(p,mult)` i przepięcie ~13 miejsc skilli; obsługa w `applyEffect`.~~
      **ZROBIONE 2026-08-22:** 12 skilli przez `skillDamageOf`, auto+rykoszet przez `attackDamageMult`,
      atak miniona zostawiony na osi `minionDamage`. Regresje/determinizm bit-w-bit zachowane (mults=1).
- [x] ~~**Faza 2 — warstwa statów gear:** pola `equipped[]`/`bag[]`/`gearX`; `recomputeGear`;
      wpięcie w chokepointy read-time z capami na sumie; gear do `checksum`.~~
      **ZROBIONE 2026-08-22:** hybryda — staty bez capa foldowane addytywnie (`gearFold`, odwracalne),
      staty z capem równoległe `gearX` clampowane na sumie przy odczycie (armor/crit/regen/leech/thorns/cooldown).
      Gear w `checksum`. Regresje bit-w-bit + ad-hoc recompute (fold rusza, odwracalność, cap) OK.
- [x] ~~**Faza 3 — komendy equip:** `SimInput` += `equipFromBag`/`unequipSlot`/`dropBag`; obsługa w
      `stepBreak` (dopasowanie slotu, reguła 2H↔off-hand, pojemność plecaka) → `recomputeGear`.~~
      **ZROBIONE 2026-08-22:** +`equipToSlot` (auto-route lub celowany slot). Handler `handleGearCommands`/
      `equipPiece`/`autoRouteSlot`/`stashInBag` w `stepBreak`, atomowy abort przy braku miejsca. Ad-hoc
      20/20 (routing, 2H↔off-hand, pojemność, unequip, determinizm). Komendy jednorazowe (`withoutOneShots`).
- [x] ~~**Faza 4 — drop gearu:** ground-item niesie `GearPiece`; `rollGearDrop()` (gated configiem);
      pickup → plecak; `DROP_CONFIG` rozbity na gear/romb/nic (romby rzadsze).~~
      **ZROBIONE 2026-08-22:** `Pickup.gear`, `dropGear`+`rollGearPiece` (PLACEHOLDER rolla → Faza 6),
      `nextGearId` deterministyczny, split na zabójstwie (gear 2% osobno, romby z 8%→5%), pickup→plecak
      (pełny = zostaje na ziemi), gear na ziemi świeci złotem. Ad-hoc 11/11. Wizualny verify zablokowany
      (ukryty panel = zepsuty WebGL), ale bundler+sim czyste.
- [ ] **Faza 5 — PRZEBUDOWA UI (rozszerzona 2026-08-22):** pełny HUD + ekwipunek + pauza/staty.
      Kolejność: HUD → ekwipunek → pauza/staty. Dodatki w passie: damage numbers, vignette na niskim HP,
      target frame, tooltipy skilli.
  - [x] ~~**5a — graficzny HUD (LoL/Dota):** …~~ **ZROBIONE 2026-08-22:** moduł `Hud.ts` (pasek HP+pipsy
        tarczy+odznaka lvl, pasek XP, ikony QWER+dash z radialnym cooldownem/ready/keybind, buffy z timerami,
        zasób klasowy pack/forma/channel, górny strip fala/timer/mobki/kills). Tekstowy `hud` odchudzony do
        dolnej linii (nag/celowanie/combo/sterowanie). EKSTRASY: damage numbers (`DamageNumbers.ts`, z delty HP),
        vignette na niskim HP (`makeVignette`), target frame (nazwa+HP+statusy wroga), tooltipy skilli (hover).
        tsc+lint czyste, moduły ładują się w kliencie. Wizualny pass do zrobienia, gdy panel odsłonięty.
  - [x] ~~**5b — ekran ekwipunku (break):** …~~ **ZROBIONE 2026-08-22:** moduł `InventoryScreen.ts` (klawisz `I`):
        11 slotów + siatka plecaka (6×4), klik w plecak → equip, klik w slot → unequip (komendy Fazy 3, tylko
        w break), tooltipy afixów w kolorze rarity, znacznik 2H/typu, blokada inputu gdy otwarty, backdrop nie
        łyka klików po zamknięciu. PLUS naprawiony feedback zebrania gearu: `sfx.gear()` + floating text w kolorze
        rarity (`lastGearTick/Name/Rarity` na graczu). tsc+lint+determinizm+module-load czyste.
        ZOSTAJE (nice-to-have): porównanie deltą względem założonego, drag&drop, celowany equip w konkretny slot.
  - [x] ~~**5c — menu pauzy (ESC) + ekran statystyk (Brotato):** …~~ **ZROBIONE 2026-08-22:** moduł
        `PauseScreen.ts` (ESC): pełny rozkład statów po kategoriach (Offense / Defense-Utility, efektywne wartości
        z capami baza+gear + mechaniki klasowe + run) + lista założonego gearu w kolorach rarity, przyciski
        Resume / Sound / Quit to Menu. `paused` mirroruje stan ekranu (Resume zamyka bez ESC). tsc+lint+module-load OK.
        UWAGA: pauza zamraża lokalnie jak dotąd (w co-opie to stary problem — osobny temat).
- [~] **Faza 6 — rarity + balans:** ROLL ZROBIONY 2026-08-22 (wyprzedził Fazę 5, bo domykaliśmy
      „przy rollu"): 3 tiery Common/Rare/Epic (1/2/3 afixy, wagi 62/30/8), rolle wartości min-max
      × `valueMult`, `RARITIES`/`GEAR_AFFIX_RANGE`, `rollRarityIndex`/`rollAffixValue`. Ad-hoc 6/6.
      ZOSTAJE: **unikalne mechaniki legendarek → kolejny czat** (user ma pomysły, memory zapisane);
      strojenie liczb w grze; źródło dropu.

### Otwarte decyzje
- [x] ~~**Rarity**~~ — **ZDECYDOWANE 2026-08-22:** 3 tiery Common/Rare/Epic, rolle min-max.
- [~] **Unikalne mechaniki legendarek** — PROJEKT GOTOWY 2026-08-22 w `LegendaryEquipment.md`.
      SCAFFOLDING + BATCH 1 ZROBIONE 2026-08-23: tier `Legendary` (rarity 3, waga 0 = tylko z bossów),
      pole `unique` na `GearPiece`, rejestr `LEGENDARIES` (`gearConfig.ts`). Drop `rollLegendary` — TYLKO z bossa,
      pod klasę+wybrany spec zabójcy, BEZ DUBLI (equipped+bag). `Player.uniqueEffects` przeliczane w `recomputeGear`
      (ODWRACALNE); sim czyta `uniqueEffects.has(id)`. 3 efekty: stormfang (wolf-thunder ricochet+3),
      lightspeed-greaves (hog-sonic spd→dmg ×2), heart-of-berserker (bear-rampage missing+0.25). Ad-hoc 14/14.
      ZOSTAJE: ~57 pozostałych (wpis + hook), `accumulateGearAffix` += afixy minion/chain, prymitywy
      `ward`/`shield`/`fling` + `blocksProjectiles`, specy `comingSoon`, drop multi-boss (dubel na ziemi).
- [ ] **Źródło dropu gearu** — bossy/moby/gwarant z bossa? (dziś: 2% z każdego moba)
- [ ] **Off-hand** — druga broń (dual-wield, +auto) czy focus (+skill)?
- [ ] **Strojenie liczb** — wagi rarity, zakresy afixów, szanse dropu (placeholdery w `gearConfig.ts`).
