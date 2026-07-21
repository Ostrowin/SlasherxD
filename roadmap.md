# WebSlasher — Roadmapa

> **Wersja:** 0.1 · **Data:** 2026-07-19 · Żywy dokument, aktualizowany razem z [gdd.md](gdd.md) i [TODOS.md](TODOS.md).
> Zasada: każda faza kończy się czymś, co **działa i da się pokazać** (link dla znajomego), nie "postępem w kodzie".
> Szacunki w dwóch skalach: praca ręczna solo / z Claude Code (CC).

---

## Faza 0 — Decyzje fundamentowe *(w toku)*

Cel: zamknąć pytania, które blokują sensowny start kodu.

- [x] Werdykt "czy warto w przeglądarce" — TAK (gdd.md sekcja 8)
- [x] Silnik: Phaser 3 + TypeScript
- [x] Klimat: absurd + neon · humor wizualny · teksty EN
- [ ] **Motyw gry** — 3 kandydaci w gdd.md sekcja 9 *(blokuje Fazę 2; Faza 1 może ruszyć bez tego)*
- [ ] Model walki: aktywna / auto / hybryda (gdd.md 5.1)

**Wyjście z fazy:** motyw wybrany, model walki wybrany.

---

## Faza 1 — Szkielet techniczny ✅ *(ukończona 2026-07-19)*

Cel: pusty, ale działający projekt z pętlą gry. Szacunek: solo ~1 tydzień / CC ~1 wieczór. **Faktycznie: 1 sesja.**

- [x] Init: Vite + Phaser 3 + TypeScript, ESLint/Prettier, git init *(2026-07-19; ESLint blokuje `Math.random()` w kodzie — strażnik determinizmu)*
- [x] W konfiguracji Vite od razu `base: './'` (ścieżki względne) i zero backendu — to gwarantuje, że późniejsza publikacja na itch.io = zip folderu `dist/` (~15 min, bez zmian w kodzie)
- [x] **Deterministyczny rdzeń od pierwszej linijki**: symulacja w `src/sim/` (zero importów Phasera), stały tick 30/s, seedowany RNG (mulberry32), własna fizyka; jedyne wejście danych = `SimInput`
- [x] Scena gry: postać-placeholder porusza się (WASD/strzałki), kamera śledzi, interpolacja między tickami
- [x] Spawner mobków-placeholderów idących do gracza + object pooling (pool 400, zero alokacji w trakcie gry)
- [x] Kolizje (spatial hash we własnej symulacji) + obrażenia kontaktowe i placeholder auto-ataku (model walki wciąż otwarty — gdd.md 5.1)
- [x] Licznik FPS na ekranie (HUD) + dev-spawner pod klawiszem M
- [x] **Bramka wydajności: 200 mobków @ 60 FPS** — symulacja: 0.22 ms/tick przy 400 mobkach; wizualnie potwierdzone przez użytkownika (okejka 2026-07-19)
- [x] Gra odpalana **prywatnie, bez pośredników**: `npm run dev` na localhost; test na telefonie przez Wi-Fi (`npm run dev:lan`). Publiczny deploy dopiero w Fazie 6, decyzją użytkownika.

**Wyjście z fazy:** odpalasz localhost, biegasz, mobki Cię gonią, 60 FPS. Brzydkie — i dobrze.

---

## Faza 2 — Grywalny rdzeń (MVP z gdd.md sekcja 10) *(w toku od 2026-07-19)*

Cel: pełny run od startu do śmierci, z motywem (ssaki vs kosmiczni najeźdźcy, neon sci-fi). Szacunek: solo ~3-4 tyg / CC ~3-5 wieczorów.

- [x] Motyw nałożony na szkielet: 10 klas-ssaków (kolor + statystyki, ekran wyboru) i 4 typy najeźdźców (Alien / Demon / Robot / Alien Mage z pociskami) — *2026-07-19; test: wszystkie typy w polu, determinizm PASS, 0.083 ms/tick*
- [x] Klimat wizualny neon sci-fi: wypalane poświaty, sylwetki per typ wroga, gwiazdy z parallaxem, cząsteczki śmierci *(2026-07-19, `src/render/textures.ts`)*
- [x] ~~Magowie kumulują się w hordzie~~ — bliżej gracza (230 px), rzadziej, limit 12 sztuk, strzał z telegrafem *(2026-07-19)*
- [x] **Playtest #1 przez człowieka** *(2026-07-19)* — werdykt: siekanie i skill zajebiste, ale dało się wygrać stojąc w miejscu. Naprawione (patrz niżej).
- [ ] **Playtest #2** po zmianach trudności — sprawdzić, czy Brute daje frajdę i czy fale 45 s nie są za długie
- [ ] Balans finalny **po projekcie nowych ataków** (użytkownik przygotowuje) — teraz strojenie byłoby marnowane

### Balans 2026-07-20 — zmierzone benchem (`npm run bench`)

36 runów na politykę (12 klas × 3 seedy), bot deterministyczny.

| Styl gry | Zwycięstwa | Średnia fala | Średni poziom |
|---|---|---|---|
| Stanie w miejscu | 0/36 | 1.1/10 | 2.9/25 |
| Aktywna gra (kiting + skille + talenty) | 0/36 | 3.3/10 | 12.9/25 |

*(Aktywna gra spadła z 3.6 po dodaniu Power Jumpa: bot używa doskoku wyłącznie do ucieczki, a Power Jump ma dłuższy cooldown w zamian za obrażenia. Bot nie potrafi skorzystać z jego ofensywy — człowiek powinien.)*

**Znalezione i naprawione: nietoperz wygrywał cały run STOJĄC W MIEJSCU.** Generator gałęzi pasywnych używał jednej wspólnej wartości na rangę dla wszystkich statystyk — dla obrażeń 5% jest sensowne, ale dla wampiryzmu 1 HP/zabicie dawało **21 HP z każdego zabicia** (karta ulepszenia daje 1, item 0.2). Naprawa dwuwarstwowa: wartości rang wyprowadzane z wartości kart (`rankValue`) + sufity na statystyki podtrzymujące życie (`ITEM_CAPS.leechMax/regenMax/thornsMax`). To ta sama klasa błędu co nieśmiertelność z regeneracji z 2026-07-19 — dlatego bench ma teraz stały alarm na „stanie w miejscu zaszło za daleko".

**Znalezione 2026-07-20 przy pierwszym URUCHOMIENIU renderu: połowa wciśnięć klawiszy i kliknięć przepadała.**
`sampleInput()` wykonuje się co KLATKĘ (60/s), a `world.step()` co TICK (30/s). Jednorazowe wejścia — `JustDown` dla `Q`/`W`/`E`/spacji oraz kliknięcia w talent i w kartę ulepszenia — były konsumowane w klatce bez ticku i znikały bez śladu. Objaw dla gracza: „czasem skill nie odpala", „czasem klik w talent nic nie robi". Naprawa: wejścia jednorazowe są **buforowane do momentu, aż symulacja je faktycznie skonsumuje**, i stosowane dokładnie raz (`withoutOneShots` chroni przed podwójnym użyciem, gdy w jednej klatce zmieści się kilka ticków). To samo zabezpieczenie dodane w lockstepie przy nadganianiu ticków.

**Znalezione 2026-07-20 (zgłoszone przez gracza): gra zawieszała się przy zabiciu bossa.**
`bossMobIndex` był WISZĄCYM WSKAŹNIKIEM: po śmierci bossa jego slot w poolu mobków zwalniał się, spawner oddawał go pierwszemu nowemu wrogowi, a świat dalej uważał ten slot za bossa. Skutki dwa naraz: `BOSSES[-1]` → `undefined.color` wywalało `drawBossBar` **w każdej klatce** (obraz zamarzał), a `endWave()` nigdy nie odpalało, bo „boss wciąż żył" — fala trwała w nieskończoność. Objaw dla gracza: „ostatni cios, ścinka i nie mogę nic zrobić".
Naprawa: `bossMobIndex` zerowany w chwili śmierci, a fakt pokonania trzymany w osobnej fladze `bossDefeated` (plus zabezpieczenie przed ponownym przyzwaniem bossa). Dodatkowo render nie może się już wywalić na złym indeksie — awaria rysowania nigdy nie powinna móc zamrozić całej gry. Regresja zabezpieczona testem: **`npm test`**.

**Do rozstrzygnięcia (balans należy do użytkownika, nie zmieniałem):**
1. **VOID WARDEN na fali 5 jest ścianą** — większość runów kończy się dokładnie tam (potwierdzone też playtestem człowieka). Złagodzić, przesunąć dalej czy zostawić jako sprawdzian?
2. **Druga połowa drzewka to martwa treść** — bot kończy runy na poziomie ~13 z 25, więc rzędy wymagające 10 i 15 punktów w gałęzi praktycznie nie istnieją w prawdziwej grze.
3. Bot jest prosty (naiwny kiting, nie używa przeszkód) — 0% zwycięstw mierzy trudność dla SŁABEGO gracza, nie dla dobrego.

### Balans 2026-07-19 — zmierzone (bot, nie człowiek)
| Styl gry | Wynik |
|---|---|
| Stanie w miejscu, zero akcji | 0/4 wygranych, śmierć na fali 1-2 |
| Aktywna gra (ucieczka + skill) | 2/4 wygranych, reszta fala 2-3 |

**Bug źródłowy naprawiony:** gracz z regeneracją **nigdy nie umierał** — obrażenia zbijały HP do zera, a regen w tym samym ticku dorzucał ułamek punktu, więc `hp > 0`. Przy nietykalności 0.5 s dało się wisieć w nieskończoność na epsilonie HP. To była prawdziwa przyczyna „wygrałem stojąc w miejscu", nie sam balans. Naprawa: jawna flaga śmierci ustawiana w momencie obrażeń.
- [ ] Walka wg wybranego modelu + "game feel": screen shake, knockback, hit-flash, dźwięki cięcia
- [x] 10 fal rosnącej trudności, przerwy między falami, fale-wyzwania co 5. falę *(2026-07-19, `src/sim/wavesConfig.ts`)*
- [x] Itemy: **14 sztuk** dropiących z mobów, efekty permanentne w runie, balans w `src/sim/itemsConfig.ts` *(2026-07-19)*
- [x] Wybór ulepszenia między falami — 1 z 3, pula w `wavesConfig.ts` *(2026-07-19)*
- [x] Ekran śmierci z podsumowaniem runu, ekran zwycięstwa, pauza (ESC) *(2026-07-19)*
- [x] Zapis w localStorage (waluta, ulepszenia, statystyki; wersjonowany i odporny na uszkodzenie) *(2026-07-19)* (ustawienia + postęp)

### Weryfikacja wizualna w środowisku dev *(sposób znaleziony 2026-07-20)*

**`npm test`** — testy regresji logiki (obecnie: zawieszenie przy zabiciu bossa). **`npm run bench`** — pomiar balansu i determinizmu.

Karta podglądu jest dla przeglądarki kartą „w tle" (`visibilityState: hidden`), więc `requestAnimationFrame` **nigdy się nie odpala** — scena gry nie startuje, zrzuty ekranu się wieszają, a kod renderu nie wykonuje się ani razu. Obejście: **ręczne napędzanie pętli** przez `game.loop.step(t)` z konsoli, wysyłanie prawdziwych `KeyboardEvent`, a zamiast zrzutu — `canvas.toDataURL()` i zliczanie pikseli w danym kolorze. Tym sposobem wykryto błąd gubionych wejść opisany wyżej.

**Wyjście z fazy:** znajomy gra jeden pełny run i sam z siebie mówi "jeszcze raz".

---

## Faza 3 — Pętla roguelite

Cel: śmierć smakuje jak postęp. Szacunek: solo ~2 tyg / CC ~2-3 wieczory.

- [x] Waluta meta zdobywana w runie — **SALVAGE** *(2026-07-19)*
- [x] Trwałe ulepszenia kupowane między runami — **10 sztuk w LAB**, `src/sim/metaConfig.ts` *(2026-07-19)*
- [x] ~~Druga klasa postaci~~ — 10 klas zrobione wcześniej; wszystkie dostępne od startu
- [ ] Balans: krzywa trudności vs krzywa mocy (arkusz z liczbami, nie "na oko")
      *Zmierzone 2026-07-19: wymaksowanie całego LAB = 25 430 SALVAGE ≈ 43 zwycięskie runy (~4 h) albo ~111 średnich (~10 h). Pierwszy zakup już po 1. runie. Pokrętło tempa: `REWARD_CONFIG.globalMultiplier`.*

**Wyjście z fazy:** po śmierci gracz od razu klika "next run", bo ma na co zbierać.

---

## Faza 4 — Treść i głębia

Cel: z prototypu robi się gra. Zakres elastyczny — dokładamy, póki bawi.

- [ ] Druga i trzecia kraina (nowe mobki, nowy klimat) — krainy wg poziomu z gdd.md 5.5
- [x] **Boss na koniec runu** — HIVE QUEEN na fali 10, 2 fazy, 4 typy ataków, architektura „jeden plik na bossa" *(2026-07-19)*
- [x] **Drugi boss** — VOID WARDEN na fali 5: szybki szarżownik, celowo odwrotność powolnej Królowej. Potwierdził architekturę „jeden plik na bossa" *(2026-07-20)*
- [ ] Kolejni bossowie (nowy plik w `src/sim/bosses/` + wpis w `BOSS_WAVES`)
- [ ] Więcej klas, itemów, synergii między itemami
- [x] **Audio** — 14 dźwięków SYNTEZOWANYCH z WebAudio, zero plików (`src/render/audio.ts`); odblokowanie przy pierwszym geście, wyciszenie pod `N` zapamiętywane w localStorage *(2026-07-20)*
- [ ] Muzyka (dźwięki gotowe; muzyka też do zsyntezowania, żeby repo zostało bez assetów)
- [ ] Ekran startowy, ustawienia, credits

---

## Faza 4.5 — Co-op ze znajomymi *(odblokowana przez deterministyczny rdzeń z Fazy 1)*

Cel: 1-8 graczy w jednym runie (decyzja 2026-07-19). Szacunek: solo ~2-3 tyg / CC ~1 tydzień — pod warunkiem, że dyscyplina determinizmu z Fazy 1 była trzymana.

- [x] **Etap 1: symulacja dla N graczy** — `Player[]`, `step(inputs[])`, mobki celują w najbliższego, przerwa czeka na wszystkich, śmierć jednego nie kończy runu, `checksum()` do wykrywania desyncu *(2026-07-19)*
- [x] **Minimapa z mgłą wojny** — mapa zasłonięta na starcie, odkrywana wspólnie przez drużynę, kropki graczy *(2026-07-19)*
- [x] **Netcode lockstep** — tylko wejścia graczy w sieci, opóźnienie 3 ticki, wykrywanie desyncu przez sumy kontrolne co 30 ticków *(2026-07-19)*
- [x] **Rysowanie pozostałych graczy** w świecie: sylwetki w kolorach klas, paski HP nad kolegami, wachlarz ciosu u każdego *(2026-07-19)*
- [x] **Lobby co-op** (`K` z ekranu wyboru klasy): host/goście, wspólny seed, `BroadcastChannel` = dwie karty bez serwera *(2026-07-19)*
- [ ] **Test dwóch kart przez człowieka** — logika zweryfikowana testami, ale pełny handshake między kartami nie był odpalony na żywo (środowisko dev wstrzymuje render w karcie w tle)
- [ ] Transport: WebRTC (bezpośrednio między przeglądarkami) — na LAN działa bez internetu, zgodnie z trybem prywatnym
- [x] **Obsługa rozłączeń** — gracz milczący > 5 s wypada z runu; tick wypadnięcia jest uzgadniany po sieci, więc symulacje nie rozjeżdżają się przy usuwaniu *(2026-07-20)*
- [ ] Ponowne dołączenie w trakcie runu (do decyzji: drop-in czy wspólny start — TODOS.md)
- [ ] Obsługa rozłączenia hosta **w lobby** (dziś goście czekają w nieskończoność)
- [ ] Balans fal i ekonomii na 2+ graczy
- [ ] Checksum stanu symulacji między klientami (wykrywanie desyncu) — bez tego debugowanie lockstepu to koszmar

**Wyjście z fazy:** dwie przeglądarki, jeden run, zero rozjazdów symulacji przez 15 minut gry.

---

## Faza 4.7 — Poziomy, drzewko talentów i specjalizacje *(przeprojektowana 2026-07-20, gdd.md 5.8)*

Cel: **cała gra mieści się w jednym runie.** Wchodzisz gołą postacią, zdobywasz poziomy, budujesz drzewko, maksujesz klasę — po runie reset. Zero kont, zapisu postaci i odblokowań.

*(Wcześniejsza wersja tej fazy — konta, exp per klasa, alty, 5 runów w tierach — porzucona tego samego dnia; analiza zwinięta w gdd.md 5.8.)*

- [x] **1. Klasa po tekstowym id, nie po indeksie** *(2026-07-20)*
      `classId` w protokole (`hello`, `LobbyMember`) i w zapisie; lobby odrzuca gracza z nieznanym id klasy, czyli obcą wersję gry. Zapis migrowany v1→v2 z zachowaniem SALVAGE, ulepszeń i rekordów (usunięte klasy mapowane na te o tej samej roli: kapibara→wydra, pancernik→niedźwiedź).
- [x] ~~**2. Typy obrażeń (fizyczne/magiczne)**~~ — **PORZUCONE 2026-07-20**, zanim powstał kod. Zostaje jeden rodzaj obrażeń (gdd.md 5.11).
- [x] **3. Roster 12 klas** *(2026-07-20)* — usunięci kapibara i pancernik, dodani szczur, dzik, wydra, hiena; siatka wyboru 6×2. **Same dane** — sygnaturowe mechaniki klas przyjdą razem z drzewkiem talentów (to ten sam kod).
- [x] **4. Poziomy w runie + max level** *(2026-07-20)* — exp z zabójstw i za falę, max poziom 25, punkt talentu za awans. **Exp za falę wyliczany z długości runu**, więc wydłużenie runu nie wymaga przestrajania krzywej ręcznie. Zmierzone: maks poziom pada na fali 7/10 przy agresywnej grze.
- [x] **5. Drzewko talentów — system + UI** *(2026-07-20)* — 3 gałęzie na klasę, rzędy odblokowywane inwestycją w gałąź (`requiresInBranch`), panel pod `T` działający w trakcie fali (co-op nie ma pauzy). Wybór talentu idzie przez `SimInput`, więc jest deterministyczny.
- [x] **5a. Doskok pod spacją + skok zająca** *(2026-07-20)* — `dash` blokowany przeszkodami, `jump` nad nimi z nietykalnością w locie; wariant w `ClassDef.dashMode`. Przy okazji: Power Slash na `Q`, skille w trybie quick cast (bez trybu celowania), pod przyszłe `W`/`E`/`R`.
- [x] **5b. Wybór specjalizacji na 2. poziomie** *(2026-07-20)* — rząd nad dotychczasowymi 0/5/10/15. Wybór jest nieodwracalny i zamyka pozostałe gałęzie do końca runu. Wybór SNIPERA **podmienia `Q`** na daleki, wąski strzał — pierwszy talent zmieniający zachowanie. Mechanizm: skille jako dane (`src/sim/skillsConfig.ts`), talent wskazuje id umiejętności.
- [x] **5c. Krytyki jako globalny efekt** *(2026-07-20)* — `critChance` i `critDamage` w dropach i kartach przerwy, sufit 75% szansy, losowane z RNG symulacji (deterministyczne). Snajper skaluje je mocniej — do dorobienia w jego gałęzi.
- [x] **5d. SOJUSZNICZE JEDNOSTKI — system ogólny** *(2026-07-20)*
      `src/sim/minionsConfig.ts`: osie ruchu (`static`/`follow`/`hunt`), trwałość (HP + czas życia), limity na gracza, a **ataki to ten sam słownik co u bossów** (`slam`/`ring`) plus nowy `bolt`. Behemot dostaje ataki Hive Queen dosłownie przez `HIVE_QUEEN.phases[0].attacks` — nie kopię.
      Trzy specjalizacje na tym systemie: **hiena NECROMANCER** (pasywka — wróg zabity w promieniu wstaje po naszej stronie; `Q` bez zmian), **dzik TOTEM ENGINEER** (obsadza Q/W/E trzema totemami: wieżyczka, pulsujący, odpychający), **zając SUMMONER** (`Q` przywołuje Behemota z paskiem HP; alternatywa dla Slipstreamu — wybór jednej gałęzi zamyka drugą).
      Przy okazji: sloty umiejętności **Q/W/E** (`SimInput.skillCast`), pociski sojusznicze w tym samym poolu co wrogie (`Projectile.friendly`), nowy efekt `raiseDead`.
- [x] **5d-bis. Wzmocnienia i skalowanie jednostek talentami** *(2026-07-20)*
      Behemot **wieczny** (bez licznika, ginie tylko od obrażeń, jako jedyny przeżywa przerwę), HP 320→620, szybsze ataki. Nekromanta: promień wskrzeszania ×3 (320→960), życie wskrzeszonych 12 s→35 s.
      Nowe efekty `minionDamage` / `minionHp` / `minionCount` / `minionDuration` — trzy gałęzie przywoływaczy skalują się **przez jednostki, nie przez własne obrażenia gracza**. Pełna gałąź nekromanty: +240% obrażeń stada i +16 sztuk naraz; summonera: +205% HP i drugi Behemot.
- [x] **5g. Zając SLIPSTREAM — build skoczka** *(2026-07-20)* — `Q` skok bojowy z falą, `W` nova 360°, oba zerują cooldown skoku; apex zamienia spację w Power Jump. Skalowanie promienia fali +845% przez gałąź. Doskok odbija się od dużych wrogów i rani ich, gdy ulepszony. Nowe w symulacji: `LeapSkill` i `resetsDash`; nova i „Q jest skokiem" nie wymagały nowego kodu.
- [ ] **5d-ter. Kolejne jednostki i przywoływacze** — dziś to wpis w `MINIONS` + `SKILLS`, bez zmian w symulacji
      Nie „dron", tylko jeden system pod wszystkie przyszłe pomysły: dron, **nekromanta hieny** (mnóstwo słabych stworków), **budowniczy turretów** (nieruchome), **przywoływacz** (pojedyncze silne stwory ze skillami). Ten sam wzorzec co bossy: prymitywy w symulacji, jednostki w danych.
      Osie zmienności do pokrycia w `MinionDef`: ruch (podąża za właścicielem / nieruchoma / poluje sama), cel (najbliższy wróg), atak (zwarcie / pocisk — docelowo ten sam słownik co ataki bossów, żeby duże stwory dostały skille za darmo), trwałość (HP albo niezniszczalna, czas życia), limity.
      Pierwsza jednostka: **dron** z kart przerwy — szybko atakuje najbliższego, na start niezniszczalny, drony się sumują (świadomie OP). Ulepszenia dropią z mobów, gdy już masz drona. Potrzebny wysoki bezpiecznik ilościowy — 8 graczy × stado to realne ryzyko dla FPS.
- [x] **5e. Power Jump zająca** *(2026-07-20)* — specjalizacja SLIPSTREAM zamienia skok w skok z obrażeniami obszarowymi przy lądowaniu. **Test ogólności mechanizmu zdany:** snajper podmienia umiejętność spod `Q`, zając podmienia doskok spod spacji — ten sam `TalentDef`, dwa różne sloty, zero nowych rozgałęzień w symulacji. Doskoki są teraz danymi (`DASHES` w `skillsConfig.ts`), tak samo jak skille.
- [ ] **5f. Friendly fire na strzale snajpera** (gdd.md 5.12) — pole `friendlyFire` jest już w `SkillDef`, brakuje samego trafiania sojuszników i bezpieczników (nie zabija, mnożnik poniżej 100%).
- [ ] **6. Rozdzielić role drzewka i kart z przerwy** — dziś oba dają czyste liczby, więc na razie się dublują. Docelowo drzewko = tożsamość i zachowanie, karty = ogólne statystyki.
- [ ] **7. Decyzja o SALVAGE/LAB** — system działa, ale nie ma już miejsca w koncepcji. Usunąć czy zostawić zapis wyłącznie na statystyki i rekordy?

**Wyjście z fazy:** ekipa siada do jednego runu, każdy gra inną klasą, w połowie widać, że dwaj gracze tej samej klasy poszliby zupełnie innym buildem — a po zakończeniu nikt nic nie traci ani nie zyskuje poza chęcią zagrania jeszcze raz inną klasą.

---

## Faza 5 — Mobile

Cel: ta sama gra na telefonie w przeglądarce. Szacunek: solo ~1-2 tyg / CC ~2 wieczory.

- [ ] Sterowanie dotykowe: wirtualny joystick (+ model walki musi działać bez klawiatury — decyzja z Fazy 0 się tu mści albo procentuje)
- [ ] Responsywny UI (bezpieczne strefy, wielkość przycisków)
- [ ] Bramka wydajności na średnim Androidzie (nie flagowcu)
- [ ] Test na iOS Safari (osobna kategoria quirków)

---

## Faza 6 — Publikacja i dalej *(opcjonalna — tylko jeśli zechcesz wyjść z trybu prywatnego)*

- [ ] itch.io jako główny dom gry (zip `dist/` + upload, ~15 min dzięki zasadom z Fazy 1) + strona z devlogiem
- [ ] Zgłoszenie na portale (Poki / CrazyGames) — mają własne SDK i wymagania, sprawdzić przed integracją
- [ ] Feedback → iteracja balansu i treści
- [ ] Opcje na później: wrapper Capacitor (sklepy mobilne), Steam (Electron/Tauri), konta i zapis w chmurze

---

## Zasady prowadzenia roadmapy

1. Fazy 0-3 idą po kolei; Faza 1 może ruszyć przed domknięciem motywu.
2. Nowe pomysły lądują najpierw w gdd.md (backlog/otwarte pytania), do roadmapy trafiają dopiero przypisane do fazy.
3. Nie otwieramy nowej fazy, póki "Wyjście z fazy" poprzedniej nie jest odhaczone.
4. Daty celowo brak — to projekt dla frajdy; tempo wyznacza życie, nie deadline.
