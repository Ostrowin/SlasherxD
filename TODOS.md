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
- [ ] Więcej bossów (fale 5 i 10 obsadzone: Void Warden, Hive Queen — nowy boss to jeden plik w `src/sim/bosses/` + wpis w `index.ts` i `BOSS_WAVES`)
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
