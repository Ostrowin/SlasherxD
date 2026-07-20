# WebSlasher — Game Design Document

> **Wersja:** 0.1 (szkielet) · **Data:** 2026-07-19 · **Status:** pomysł / eksploracja
> Żywy dokument — dopisujemy pomysły do odpowiednich sekcji, a surowe notatki lądują w Backlogu na dole.
> Powiązane: [roadmap.md](roadmap.md) (fazy i kolejność prac) · [TODOS.md](TODOS.md) (otwarte decyzje)

---

## 1. Pitch (jedno zdanie)

Przeglądarkowy roguelike-slasher dla **1-8 znajomych**: gracze wcielają się w **ssaki-wojowników** (10 klas), które bronią Ziemi przed **najeźdźcami z kosmosu** (alieny, alieni magowie, demony, roboty) w neonowym sci-fi klimacie — z itemami, meta-progresją i brutalną frajdą z siekania hord. Grasz od razu z linku, bez instalacji; docelowo także na mobile.

## 2. Filary designu

*(propozycja do akceptacji — 3 filary, do których przykładamy każdy nowy pomysł)*

1. **Natychmiastowa frajda** — od kliknięcia linku do siekania mobków w mniej niż 10 sekund. Zero instalacji, zero logowania na start.
2. **"Jeszcze jeden run"** — krótkie runy (10–20 min), po śmierci zaczynasz mocniejszy, więc porażka smakuje jak postęp.
3. **Build ma znaczenie** — klasa + itemy + wybory w trakcie runu składają się w wyraźnie inny styl gry za każdym razem.

## 3. Gatunek i inspiracje

| Inspiracja | Co bierzemy | Czego NIE bierzemy |
|---|---|---|
| **Brotato** | pętla fal, sklep między falami, dziesiątki postaci/klas, statystyki itemów | ziemniaków 🥔 — wymyślimy ciekawszy motyw (OTWARTE, sekcja 9) |
| **Vampire Survivors** | skalowanie hord, poczucie mocy, prostota sterowania | pasywnego auto-ataku jako jedynej mechaniki |
| **Halls of Torment / melee buildy** | dowód, że walka wręcz działa w tym gatunku | — |

Steam w maju 2026 oficjalnie uznał ten gatunek za osobną kategorię ("Bullet Heaven") — rynek jest duży, ale i zatłoczony. Nasz wyróżnik: **slasher (melee) + przeglądarka (zero frykcji)**.

## 4. Core loop

```
  START RUNU (wybór klasy)
        │
        ▼
  ┌─► FALA MOBKÓW ── siekanie ── loot/złoto
  │         │
  │         ▼
  │   MIĘDZY FALAMI: itemki / ulepszenia / (sklep?)
  │         │
  │         ▼
  └── kolejna fala (trudniejsza; co X poziomów nowa KRAINA)
            │
            ▼ (śmierć albo boss końcowy?)
       KONIEC RUNU
            │
            ▼
  META-PROGRESJA: wydajesz walutę na trwałe ulepszenia
  → następny run zaczynasz "trochę bardziej podpakowany"
            │
            └────────► nowy run
```

## 5. Systemy gry (pomysły z notatek, do rozwinięcia)

### 5.1 Walka (slasher) — hybryda *(zdecydowane 2026-07-19, D10)*
- **Model hybrydowy:** auto-atak (słabszy, krótki zasięg) czyści tłum wokół + **aktywne skille odpalane klawiszami i kombinacjami klawiszy** (docelowo przeważnie kombinacjami — pomysł użytkownika).
- **Dużo pasywów** w przyszłych drzewkach umiejętności — filozofia buildów.
- Wdrożone v1: auto-atak (koło, interwał z klasy) + **Power Slash** (spacja): stożek 120° w kierunku ruchu, zasięg x1.9, obrażenia x3, knockback, cooldown 3 s.
- **Do zaprojektowania:** system kombinacji klawiszy (składnia, buforowanie inputu, czytelność), skille per klasa.

### 5.0 Struktura runu *(zdecydowane 2026-07-19)*
```
  WYBÓR KLASY → FALA 1 → PRZERWA (wybór ulepszenia) → FALA 2 → ... → FALA 10 → ZWYCIĘSTWO
                   │                                                              
                   └── śmierć → PODSUMOWANIE RUNU (fale, zabici, itemy, build)
```
- **10 fal po 30 s**, co 5. fala jest dłuższa i liczniejsza (fala-wyzwanie).
- Po każdej fali: wrogowie znikają, gracz dostaje **3 ulepszenia do wyboru** (klik albo klawisze 1-3). Przerwa trwa, dopóki gracz nie wybierze — to jego oddech, nie wyścig z czasem; w tym czasie może pozbierać leżące itemy.
- **Dwa źródła mocy:** dropy z mobów = przypadek (małe wartości), ulepszenia z przerwy = decyzja gracza (wartości ~3x większe). Obie korzystają z tej samej implementacji efektów.
- Leczenie nie jest oferowane przy (prawie) pełnym HP — nie marnujemy karty wyboru.
- Ekran końca runu: zwycięstwo albo śmierć + podsumowanie (klasa, czas, fale, zabici, wybrane ulepszenia, najczęstsze dropy).
- Konfiguracja: **`src/sim/wavesConfig.ts`** (liczba fal, czasy, krzywa wrogów, pula ulepszeń).

### 5.2 Mobki i fale — najeźdźcy z kosmosu *(zdecydowane 2026-07-19)*
Cztery typy najeźdźców na start (grafika: na razie kolory, sci-fi sprite'y później):
| Typ | Rola | Charakter |
|---|---|---|
| **Alien** | podstawowy | średnie tempo, idzie na gracza |
| **Demon** | szybki | mało HP, dużo ruchu — presja |
| **Robot** | tank | wolny, gruby, boli przy kontakcie |
| **Alien Mage** | dystansowy | trzyma odległość, strzela; **strzał ma telegraf**, limit sztuk na mapie |
| **Brute** | ciężki | wielki, powolny, dużo HP; **młot z zamachem** — trzeba odskoczyć |

**Rytm walki z ciężkim wrogiem (Brute):** podejdź → wróg staje i szykuje młot (widoczny rosnący krąg rażenia) → odskocz → młot idzie w próżnię → wróg jest **bezbronny** przez chwilę → kontra. Stany wroga: `chase → windup → recover`, wszystko w `enemies.ts`.

**Obrażenia od tłumu:** im więcej wrogów Cię dotyka, tym mocniej boli (do 2.2x). Bez tego stanie w hordzie było bezpieczne — globalny cooldown obrażeń zrównywał 300 wrogów z jednym.

- Miks fal zmienia się z czasem gry (najpierw alieny, potem dochodzą kolejne typy).
- **Wrogowie rosną w siłę z falą** (+15% HP, +7% obrażeń za falę) — bez tego moc gracza rosła wykładniczo, a wrogowie tylko się mnożyli.
- Cel wydajnościowy: setki mobków na ekranie przy 60 FPS (osiągalne w WebGL — patrz sekcja 7).

### 5.3 Itemki — 14 sztuk *(zdecydowane 2026-07-19)*
Dropią z zabitych mobów, leżą na ziemi, zbierane przez podejście. **Wszystkie efekty są permanentne do końca runu i stackują się** (małe wartości — decyzja użytkownika: lepiej dużo małych bonusów niż czasowe buffy). Itemy wspólne dla wszystkich klas.

**Wszystkie liczby (szansa dropu, wagi, wartości, capy, czas despawnu, promień zbierania) siedzą w `src/sim/itemsConfig.ts`** — plik do swobodnej edycji, Vite przeładowuje grę po zapisie.

| # | Item | Efekt |
|---|---|---|
| 1 | Medkit | natychmiast +HP |
| 2 | Armor Plate | płaska redukcja obrażeń (cap) |
| 3 | Speed Module | +% prędkości ruchu |
| 4 | Attack Chip | +% szybkości auto-ataku (cap na interwał) |
| 5 | Range Extender | +% zasięgu auto-ataku i skilla |
| 6 | Strength Serum | +% obrażeń auto-ataku i skilla |
| 7 | Overshield | ładunek bariery — pochłania całe następne trafienie (cap) |
| 8 | Repair Nanobots | +HP na sekundę (regen) |
| 9 | Max HP Core | +maks. HP (i tyle samo leczenia) |
| 10 | Cooldown Chip | −% cooldownu skilla (cap) |
| 11 | Vampiric Nanobots | leczenie za każde zabójstwo |
| 12 | Grav Magnet | +promień zbierania itemów |
| 13 | Knockback Booster | +% siły odrzutu ze skilla |
| 14 | Thorn Field | wróg dotykający gracza dostaje obrażenia |

- **Do rozstrzygnięcia:** rzadkości? sloty ekwipunku? synergie/zestawy? sklep między falami jak w Brotato?

### 5.4 Klasy postaci — 10 ssaków *(zdecydowane 2026-07-19)*
Gracz wybiera ssaka; na razie klasa = kolor + statystyki, docelowo drzewka umiejętności (przyszłość) i sci-fi bronie (przyszłość). Itemy wspólne dla wszystkich klas (na start).

| # | Ssak (EN w grze) | Kolor | Szkic roli (drzewko w przyszłości) |
|---|---|---|---|
| 1 | Niedźwiedź (Bear) | brąz | tank — dużo HP, mocny cios |
| 2 | Wilk (Wolf) | szary | szybki melee DPS |
| 3 | Lis (Fox) | pomarańcz | cwaniak — rzadsze, mocne ciosy (krytyki w przyszłości) |
| 4 | Zając (Hare) | biały | mobilność — najszybszy, unika |
| 5 | Kret (Mole) | ciemny brąz | inżynier (miny/kopanie w przyszłości) |
| 6 | Jeż (Hedgehog) | oliwka | kolce — obrona/odwet |
| 7 | Nietoperz (Bat) | fiolet | wampiryzm (leczenie z zabić w przyszłości) |
| 8 | Kapibara (Capybara) | piaskowy | spokojny support (aury/regen w przyszłości) |
| 9 | Goryl (Gorilla) | grafit | siła — zamaszyste AoE |
| 10 | Pancernik (Armadillo) | stal | pancerz — najtwardszy, najwolniejszy |

### 5.4b Oprawa wizualna — neon sci-fi *(zrobione 2026-07-19)*
- **Poświata wypalana w teksturach**, nie shaderem per-sprite — przy 400 wrogach na ekranie shader glow zabiłby wydajność, a wypalona tekstura kosztuje tyle samo co zwykła (`src/render/textures.ts`).
- **Sylwetka = typ wroga** (czytelność w hordzie, nie tylko kolor): trójkąt Alien, romb Demon, sześciokąt Mage, ośmiokąt Robot; gracz to pięciokąt.
- Kosmiczne tło: dwie warstwy gwiazd z parallaxem + siatka stacji; to samo tło w menu i LAB, żeby gra wyglądała spójnie.
- Cząsteczki po rozbitym najeźdźcy (limit 12 wybuchów na klatkę — czyszczenie fali nie może zrzucić FPS-ów), addytywne mieszanie dla pocisków, itemów i pierścienia ataku.

### 5.4c Minimapa i mgła wojny *(zrobione 2026-07-19)*
- Świat startuje **całkowicie zasłonięty** — widać tylko to, co gracz odkrył.
- Odkrywanie jest trwałe na cały run i **wspólne dla drużyny**: każdy gracz odsłania mapę dla wszystkich.
- Minimapa w prawym górnym rogu: odkryty teren, przeszkody, kropki graczy w kolorach klas (lokalny większy, z białą obwódką), martwi jako przygaszone krzyżyki w miejscu śmierci.
- Zastępuje wskaźniki drużyny przy krawędzi ekranu — cała informacja nawigacyjna w jednym miejscu (decyzja użytkownika).
- **Mgła liczona w renderze, nie w symulacji:** pozycje graczy są już zsynchronizowane przez lockstep, więc każdy klient wylicza identyczną mgłę sam — zero ruchu w sieci, zero puchnięcia sumy kontrolnej.
- Wydajność: teren rysowany **przyrostowo** na RenderTexture (tylko świeżo odkryte komórki), zamiast przerysowywania 6400 komórek co klatkę.

### 5.4d Bossowie *(zrobione 2026-07-19)*

**Architektura: jeden plik na bossa** (`src/sim/bosses/nazwa.ts`), ale **deklaratywny**. Prymitywy ataków żyją w symulacji, plik bossa mówi tylko *jakich* używa, z jakimi liczbami i w jakich fazach. Nowy boss = jeden plik i zero nowego kodu w symulacji; kod dopisujesz wyłącznie dla naprawdę nowego typu ataku. Bonus: deklaratywne ataki są deterministyczne z definicji, więc lockstep w co-opie nie ucierpiał.

**Prymitywy ataków (gotowe do użycia przez każdego bossa):**
| Typ | Działanie |
|---|---|
| `slam` | ciężki cios w obszarze z telegrafem |
| `ring` | pierścień pocisków we wszystkie strony |
| `charge` | telegrafowana szarża w gracza, rani po drodze |
| `summon` | przyzwanie pomocników (dowolny typ z `enemies.ts`) |

**Fazy:** boss zmienia zestaw ataków po zejściu poniżej progu HP („boss się wkurza") — inne ataki, inne tempo, inna prędkość.

**Pierwszy boss: HIVE QUEEN** (fala 10). Faza 1 karze i za stanie blisko (młot), i za stanie daleko (pierścień pocisków). Poniżej 50% HP wpada w furię: szarże, gęstsze pociski i przyzywanie Brute'ów.

- Fala z bossem **nie kończy się na czas** — trwa, dopóki boss żyje. Zwykłych wrogów jest na niej mniej (45%), żeby walka była o bossa.
- HP bossa rośnie z liczbą graczy (+70% za każdego dodatkowego) — inaczej czterech ziomków rozłożyłoby go przed drugą fazą.
- Boss jest **odporny na knockback** (nie da się go zaganiać w róg).
- Który boss na której fali: `BOSS_WAVES` w `wavesConfig.ts`.

### 5.5 Krainy (progresja poziomów)
- Kraina zależna od poziomu/etapu runu: nowa sceneria + nowe mobki + nowy klimat.
- Naturalny nośnik motywu gry (patrz OTWARTE: motyw zamiast ziemniaków).

### 5.6 Multiplayer (co-op) — w budowie *(etap 1 gotowy 2026-07-19)*

**Etap 1 (zrobiony): symulacja obsługuje N graczy.** `World` trzyma `Player[]`, `step()` przyjmuje tablicę inputów. Zasady współpracy:
- Mobki polują na **najbliższego żywego gracza**; spawnują się wokół losowego z drużyny, więc presja rozkłada się na wszystkich.
- Liczba wrogów rośnie z liczbą graczy (+60% za każdego dodatkowego) — inaczej ośmioosobowa drużyna rozłożyłaby tę samą hordę na ośmiu.
- Młot Brute'a rani **każdego** w obszarze — nie stójcie w kupie.
- Itemy: kto pierwszy dojdzie, ten zbiera. Każdy gracz ma własne modyfikatory i własną pulę ulepszeń w przerwie.
- Przerwa czeka, aż wybiorą **wszyscy żywi**; martwy nie blokuje drużyny.
- Śmierć jednego gracza **nie kończy runu** — run przegrany dopiero, gdy padną wszyscy.
- `World.checksum()` — suma kontrolna stanu do wykrywania desyncu w lockstepie.

**Etap 2 (zrobiony 2026-07-19): lockstep, transport i widoczna drużyna.**
- **Lockstep:** świat wykonuje tick N dopiero, gdy zna wejścia WSZYSTKICH graczy dla ticku N. Nikt nie wyprzedza reszty, więc symulacje nie mogą się rozjechać. Wejścia lecą z wyprzedzeniem 3 ticków (100 ms), żeby zdążyły dolecieć.
- **Po sieci lecą wyłącznie inputy i sumy kontrolne** — nigdy pozycje mobków. Dlatego 400 wrogów kosztuje w sieci tyle samo co zero.
- **Wykrywanie desyncu:** co 30 ticków klienci porównują `World.checksum()`. Rozjazd = błąd determinizmu, pokazywany na ekranie.
- **Transport wymienny** (`Transport` w `src/net/types.ts`): dziś `BroadcastChannel` (karty jednej przeglądarki, zero serwera), docelowo WebRTC. Wymiana nie ruszy logiki gry.
- **Lobby** (`CoopScene`, klawisz `K` z wyboru klasy): pierwsza karta zostaje hostem, kolejne dołączają; host rozsyła skład i seed. Wyścig dwóch hostów rozstrzygany deterministycznie (mniejsze id wygrywa).
- **Widoczna drużyna:** wszyscy gracze rysowani w świecie, paski HP nad kolegami, wachlarz ciosu widoczny u każdego, kropki na minimapie.

**Etap 3 (następny):** WebRTC (gra przez internet), rozsyłanie bonusów meta wszystkich graczy, obsługa rozłączeń w trakcie gry.
- Docelowo co-op dla 2-4 graczy (znajomi), najpewniej przez WebRTC/LAN — zgodne z trybem prywatnym, gra pozostaje statyczną paczką plików.
- **Decyzja architektoniczna (2026-07-19):** rdzeń gry pisany jako **deterministyczna symulacja** od pierwszej linijki (stały timestep, seedowany RNG, własna prosta fizyka, symulacja oddzielona od renderu). Netcode (lockstep) dochodzi dopiero po grywalnym single-playerze — bez przepisywania rdzenia.
- Bonus dla single-player: powtarzalne runy z seeda (daily run, replaye) niemal za darmo.
- **Do rozstrzygnięcia:** ilu graczy maks? drop-in w trakcie runu czy tylko wspólny start? LAN only czy też przez internet?

### 5.7 Meta-progresja (roguelite) *(zdecydowane 2026-07-19)*
Postęp, który **zostaje między runami** — realizacja pierwotnego pomysłu „jak zginiesz, zaczynasz trochę bardziej podpakowany".

- **Waluta: SALVAGE** (złom z rozbitych statków najeźdźców). Nagroda za run = zabici × 0.1 + fale × 25 + premia 200 za zwycięstwo.
- **LAB** — sklep między runami (klawisz `L` z ekranu wyboru klasy albo z ekranu końca runu). 10 trwałych ulepszeń z poziomami: max HP, obrażenia, prędkość, szybkość ataku, pancerz, zasięg, cooldown skilla, regeneracja, promień zbierania, **szansa na drop**.
- Koszt rośnie z poziomem (`baseCost × (poziom+1)`), każde ulepszenie ma limit poziomów.
- Zapis w **localStorage**: waluta, poziomy ulepszeń, statystyki (runy, zwycięstwa, rekord fali i zabójstw, ostatnia klasa). Wersjonowany i odporny na uszkodzenie — zepsuty plik nie wywala gry, tylko wraca do domyślnego stanu.
- Konfiguracja: **`src/sim/metaConfig.ts`** (nagrody, ulepszenia, koszty; `globalMultiplier` = tempo całej progresji).
- **Architektura pod co-op:** bonusy meta trafiają do symulacji jako jawny argument konstruktora (`MetaBonus[]`), a nie przez odczyt z localStorage w środku. W co-opie każdy gracz rozsyła swój zestaw przy starcie sesji i lockstep pozostaje deterministyczny. Kod zapisu leży poza `src/sim`.
- **Do rozstrzygnięcia:** odblokowywanie klas za SALVAGE? nowe itemy w puli? konta/chmura zamiast localStorage?

## 6. Platformy i sterowanie

- **Sterowanie (zdecydowane 2026-07-19): point-and-click jak Dota 2 / LoL** — klik RMB = idź do punktu, trzymanie RMB = podążaj za kursorem. **WASD usunięte** (decyzja późniejsza tego samego dnia — mysz jest jedynym sterowaniem ruchu). Skille: spacja = tryb celowania (podgląd stożka za kursorem), LMB = zatwierdzenie ciosu. Bonus: model mapuje się 1:1 na dotyk — tani port mobilny.
- **Faza 1:** przeglądarka desktop (mysz + klawiatura).
- **Faza 2:** przeglądarki mobilne (sterowanie dotykowe — wirtualny joystick; gatunek świetnie się do tego nadaje).
- **Faza 3 (opcja):** wrapper na sklepy (Capacitor) i/lub Steam (Electron/Tauri) — ten sam kod.

## 7. Technologia

**ZDECYDOWANE (2026-07-19): Phaser 3 + TypeScript.**
Uzasadnienie: najszybsza droga do grywalnego prototypu (fizyka, sceny, input, audio w zestawie), wydajność wystarczająca dla skali Brotato przy poolingu sprite'ów. Odrzucone: PixiJS + własny ECS (lepsza wydajność, ale start o tygodnie dłuższy), czysty Canvas (tylko na jednorazowy spike).

Wymagania wydajnościowe niezależnie od silnika: object pooling, spatial hashing dla kolizji, atlasy tekstur.

**Wymagania architektoniczne pod przyszły co-op (obowiązują od pierwszej linijki kodu):**
- symulacja gry oddzielona od renderowania (Phaser tylko rysuje i zbiera input),
- stały timestep symulacji (fixed tick, np. 30/s) niezależny od FPS,
- seedowany generator losowości (zero `Math.random()` w logice gry),
- własna prosta fizyka ruchu/kolizji zamiast wbudowanej w Phaser (i tak potrzebna pod hordy).

## 8. Analiza: czy warto robić to w przeglądarce?

**Werdykt: TAK** — szczegóły i źródła w rozmowie z 2026-07-19; skrót:

- ✅ Gatunek survivors-like to jeden z najlepiej dopasowanych gatunków do przeglądarki: proste sterowanie, krótkie sesje, mała waga assetów, ogromna popularność na portalach webowych.
- ✅ Techniczna wykonalność potwierdzona: 2D top-down z setkami sprite'ów działa płynnie w WebGL.
- ✅ Dystrybucja bez frykcji: link = gra; portale (itch.io, Poki, CrazyGames) dają graczy i monetyzację; później ten sam kod na mobile i Steam.
- ⚠️ Ryzyko główne: **zatłoczony rynek** — potrzebny wyraźny hook (nasz plan: melee-slasher + mocny motyw + meta-progresja).
- ⚠️ Ryzyka techniczne: wydajność na słabych telefonach, quirki audio w przeglądarkach, trwałość zapisu (localStorage może zostać wyczyszczony).

## 9. Otwarte pytania

1. ~~Motyw/temat gry~~ — **ZDECYDOWANE 2026-07-19: ssaki vs najeźdźcy z kosmosu, neon sci-fi** (pomysł użytkownika; sekcje 5.2 i 5.4). Absurd/humor porzucone; historyczne kandydaty z burzy mózgów (Glitch Slasher / Capy Blade / Roomba Rampage) — patrz git history.
   Do dorozwinięcia w ramach motywu: nazwa gry?, fabuła w pigułce (czemu ssaki?, skąd inwazja?), wygląd krain.
2. Model walki: aktywna / auto / hybryda? (5.1)
3. Struktura runu: ile fal, boss na końcu krainy?
4. Ekonomia: jedna waluta czy osobna w-runie / meta?
5. Monetyzacja (kiedyś): darmowa + portale? premium? kosmetyki?

## 10. Zakres MVP (propozycja — do zatwierdzenia)

- [ ] 1 kraina, 1 klasa, ~10 fal, 5–8 typów itemów, 3–4 typy mobków
- [ ] Sterowanie klawiatura/mysz, pauza, ekran śmierci
- [ ] Prosta meta-progresja (1 waluta, 3–5 trwałych ulepszeń)
- [ ] Zapis w localStorage
- [ ] Uruchamianie prywatnie na localhost (bez pośredników); build statyczny gotowy pod przyszłą publikację

Poza MVP (świadomie później): mobile/dotyk, więcej klas i krain, boss, dźwięk pełny, konta.

---

## 11. Dziennik decyzji

| Data | Decyzja | Uzasadnienie |
|---|---|---|
| 2026-07-19 | Silnik: **Phaser 3 + TypeScript** | Najszybsza droga do grywalnego prototypu; wydajność OK dla skali Brotato |
| 2026-07-19 | Cel projektu: **side project dla frajdy** (tryb builder) | Motyw wybieramy sercem, zakres pod przyjemność budowania |
| 2026-07-19 | Klimat: **absurd + neon/sci-fi** | Wybór z burzy mózgów (D4) |
| 2026-07-19 | Humor: **czysto wizualny**, teksty **EN** | Działa globalnie bez tłumaczeń, mało tekstu = mniej roboty |
| 2026-07-19 | Motyw gry: **ODŁOŻONE** — 3 kandydaci w sekcji 9 | Użytkownik chce to przemyśleć |
| 2026-07-19 | Dystrybucja: **na start prywatnie** (localhost, bez itch.io itp.) | Gra najpierw tylko dla autora; build statyczny + `base: './'` trzyma koszt późniejszej publikacji przy ~15 min |
| 2026-07-19 | Multiplayer: **fundament od dnia 1, netcode później** | Deterministyczna symulacja (~10-15% dyscypliny) trzyma drzwi do co-opa otwarte; lockstep dopiero po grywalnym single-playerze — dolepianie sieci do niedeterministycznego kodu = przepisanie rdzenia |
| 2026-07-19 | **Motyw: ssaki vs najeźdźcy z kosmosu, neon sci-fi** | Pomysł użytkownika; absurd/humor porzucone; pivot Tibia-like odrzucony (za duży), ale duch "zwierzaki + klasy" przetrwał w małej skali |
| 2026-07-19 | **10 klas-ssaków od startu; klasa = kolor + statystyki** | Bez grafik na razie; drzewka umiejętności i sci-fi bronie w przyszłości; itemy wspólne dla wszystkich klas |
| 2026-07-19 | **Co-op 1-8 graczy** | Skala "dla ziomeczków" potwierdzona; 8 graczy wykonalne w lockstepie (sieć przesyła tylko inputy) |
| 2026-07-19 | **Model walki: hybryda (D10)** — auto-atak + aktywne skille na klawisze/kombinacje, dużo pasywów | Auto niesie hordę i port mobile; aktywne skille dają slasher-feel; kombinacje klawiszy = wyróżnik do zaprojektowania |
| 2026-07-19 | **Sterowanie: RMB point-and-click (Dota/LoL)** — klik = idź, trzymanie = za kursorem | Pomysł użytkownika; świetnie mapuje się na dotyk (mobile); cel ruchu wchodzi do SimInput, więc lockstep bez zmian |
| 2026-07-19 | **WASD usunięte; skill z celowaniem** — spacja celuje (podgląd stożka), LMB zatwierdza cios | Pomysł użytkownika; czyste sterowanie myszą jak w MOBA; kierunek ciosu w SimInput (aimX/aimY) |
| 2026-07-19 | **Losowe przeszkody na mapie** (60 okręgów z seeda) — blokują gracza, mobki i pociski | Pomysł użytkownika; deterministyczne z seeda = ta sama mapa w co-opie; pociski rozbijają się o teren → przeszkody działają jak osłony |
| 2026-07-19 | **14 itemów, efekty permanentne do końca runu** (nie czasowe), małe wartości, stackowalne | Korekta pomysłu użytkownika w trakcie projektowania; stackowanie małych bonusów daje lepsze poczucie rosnącej mocy niż wygasające buffy |
| 2026-07-19 | **Balans itemów w osobnym pliku `src/sim/itemsConfig.ts`** | Użytkownik chce sam kręcić liczbami (drop %, wagi, wartości) bez czytania kodu symulacji |
| 2026-07-19 | **Struktura runu: 10 fal + przerwy z wyborem 1 z 3 ulepszeń** | Gra potrzebowała rytmu i końca; przerwa czeka na decyzję gracza (oddech), dropy = przypadek vs ulepszenia = decyzja |
| 2026-07-19 | **Meta-progresja: SALVAGE + LAB, zapis w localStorage** | Realizacja pierwotnego pomysłu z notatek; przegrany run zawsze coś daje |
| 2026-07-19 | **Bonusy meta jako jawne wejście symulacji (`MetaBonus[]`), zapis poza `src/sim`** | Warunek działania co-opu: symulacja nie może czytać localStorage, bo każdy gracz ma inny stan meta |
| 2026-07-19 | **Ciężki wróg z telegrafem (Brute) + obrażenia od tłumu + skalowanie wrogów z falą** | Playtest użytkownika: dało się wygrać stojąc w miejscu. Naprawiona też przyczyna źródłowa — patrz niżej |

---

## Backlog pomysłów

### Zaparkowany pivot (2026-07-19) — „Tibia-like" *(porzucony po dyskusji o skali, ale elementy mogą wrócić)*
> Otwarty spory świat (ładowane mapy) · mobki o różnym poziomie trudności · brutalna śmierć: utrata założonych itemów i expa · 2 frakcje: **owady vs rośliny** · rasa w ramach frakcji (drzewo/kwiat… vs żuk/modliszka/ważka…) · osobno profesja (paladyn/wojownik/monk…) · wbudowane PvP · podróże między biomami rakietą kupowaną u NPC (część gry w kosmosie).
> Wnioski z dyskusji: pełne MMO = grobowiec solo deva; realny wariant to prywatny serwer dla znajomych (model OTS); PvP + utrata itemów wymaga autorytatywnego serwera. Frakcje owady/rośliny i brutalna śmierć to pomysły warte rozważenia nawet w mniejszej grze.

### Surowe notatki — oryginał z 2026-07-19

> - w sumie kopia na przeglądarkę Brotato (ale wymyślę coś ciekawszego niż ziemniaki)
> - na początek zrobimy slashera z mobkami
> - itemki
> - różne klasy
> - różne krainy based on level
> - może trochę elementów z rogue-like (jak zginiesz, zaczynasz trochę bardziej podpakowany od nowa)
