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

### 5.4 Klasy postaci — 12 ssaków *(zaktualizowane 2026-07-20)*
Gracz wybiera ssaka. **Kapibara i pancernik usunięci** (2026-07-20) — dublowali role niedźwiedzia i jeża. Dołączyli **szczur, dzik, wydra i hiena**.

Klasa to nie tylko statystyki: każda ma **jedną sygnaturową mechanikę** (oś różnicowania). Bez tej siatki 12 klas zrobiłoby się dwunastoma wariantami tego samego zwierzaka z inną liczbą HP.

| # | Ssak (EN w grze) | Kolor | Rola | Sygnatura |
|---|---|---|---|---|
| 1 | Niedźwiedź (Bear) | brąz | tank | wchłania obrażenia, ciężki cios |
| 2 | Wilk (Wolf) | szary | melee DPS | premia w zwarciu obok sojusznika (wataha) |
| 3 | Lis (Fox) | pomarańcz | burst | rzadkie, mocne ciosy → krytyki |
| 4 | Zając (Hare) | biały | mobilność | najszybszy, uniki |
| 5 | Kret (Mole) | ciemny brąz | inżynier | konstrukcje / kopanie, walka z dystansu |
| 6 | Jeż (Hedgehog) | oliwka | odwet | kolce — obrażenia za bycie trafionym |
| 7 | Nietoperz (Bat) | fiolet | wampir | leczenie z zabójstw, atak dźwiękowy |
| 8 | Goryl (Gorilla) | grafit | siła / AoE | zamaszyste ciosy w wielu wrogów |
| 9 | Szczur (Rat) | toksyczna limonka | zaraza | obrażenia w czasie, rozprzestrzenianie się |
| 10 | Dzik (Boar) | rdzawy | szarża | rozpęd — odrzut i staranowanie |
| 11 | Wydra (Otter) | morski | support | leczenie i wzmacnianie drużyny |
| 12 | Hiena (Hyena) | piaskowe złoto | osłabianie | żeruje na rannych, nakłada osłabienia |

**Status:** roster i statystyki **wdrożone 2026-07-20**. Sygnaturowe mechaniki jeszcze nie — to w praktyce ten sam kod co talenty, więc przyjdą razem z drzewkiem.

**UWAGA TECHNICZNA (blokuje zmianę rosteru):** klasa jest dziś identyfikowana **indeksem w tablicy** — `classIndex` w protokole sieciowym (`src/net/types.ts`) i `lastClassIndex` w zapisie. Usunięcie klas ze środka listy przesuwa wszystkie indeksy: stare zapisy wskażą inną klasę, a w co-opie stara i nowa wersja gry **dogadają się bez błędu i policzą dwa różne światy** (desync bez błędu w logice — bardzo trudny do znalezienia). Przed ruszeniem rosteru: przejść na identyfikatory tekstowe (`'mole'`) w protokole i zapisie + odrzucać sesję z nieznanym id.

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

### 5.7 Meta-progresja (roguelite) *(zdecydowane 2026-07-19 — ⚠️ POD ZNAKIEM ZAPYTANIA od 2026-07-20)*

> **UWAGA:** decyzja „zero zapisu, cała gra mieści się w jednym runie" (5.8) wywraca ten system. Jest zaimplementowany i działa, ale nie ma już miejsca w koncepcji. Do rozstrzygnięcia: usunąć całkowicie czy zostawić `localStorage` wyłącznie na statystyki i rekordy, bez wpływu na moc postaci.

Postęp, który **zostaje między runami** — realizacja pierwotnego pomysłu „jak zginiesz, zaczynasz trochę bardziej podpakowany".

- **Waluta: SALVAGE** (złom z rozbitych statków najeźdźców). Nagroda za run = zabici × 0.1 + fale × 25 + premia 200 za zwycięstwo.
- **LAB** — sklep między runami (klawisz `L` z ekranu wyboru klasy albo z ekranu końca runu). 10 trwałych ulepszeń z poziomami: max HP, obrażenia, prędkość, szybkość ataku, pancerz, zasięg, cooldown skilla, regeneracja, promień zbierania, **szansa na drop**.
- Koszt rośnie z poziomem (`baseCost × (poziom+1)`), każde ulepszenie ma limit poziomów.
- Zapis w **localStorage**: waluta, poziomy ulepszeń, statystyki (runy, zwycięstwa, rekord fali i zabójstw, ostatnia klasa). Wersjonowany i odporny na uszkodzenie — zepsuty plik nie wywala gry, tylko wraca do domyślnego stanu.
- Konfiguracja: **`src/sim/metaConfig.ts`** (nagrody, ulepszenia, koszty; `globalMultiplier` = tempo całej progresji).
- **Architektura pod co-op:** bonusy meta trafiają do symulacji jako jawny argument konstruktora (`MetaBonus[]`), a nie przez odczyt z localStorage w środku. W co-opie każdy gracz rozsyła swój zestaw przy starcie sesji i lockstep pozostaje deterministyczny. Kod zapisu leży poza `src/sim`.
- **Rola SALVAGE po 2026-07-20:** SALVAGE zostaje walutą **konta**, wspólną dla wszystkich 12 postaci, i odpowiada za *podłogę mocy*. Tożsamość postaci (specjalizacje, talenty) idzie osobnym torem — EXP per klasa (sekcja 5.9). To rozdzielenie jest celowe: świeży alt wchodzi do gry z całym pancerzem i HP kupionym za SALVAGE, brakuje mu tylko charakteru.
- **Do rozstrzygnięcia:** odblokowywanie klas za SALVAGE? nowe itemy w puli?

### 5.8 Progresja W RUNIE — bez zapisu *(zdecydowane 2026-07-20, zastępuje 5.8-5.10 i 5.13)*

**Cały postęp mieści się w jednym runie i po nim znika.** Jeden run to cała gra: wchodzisz gołą postacią, zdobywasz poziomy, budujesz drzewko, maksujesz i masterujesz klasę — a po zakończeniu wszystko się resetuje. Zero kont, zero zapisu postaci, zero odblokowań.

- **Lobby:** ekipa wybiera klasy, **klasy się nie powtarzają** (jedna sztuka na drużynę).
- **Poziomy i drzewko talentów w trakcie runu.** Jest **maksymalny poziom** — osiągany w okolicach końcówki runu, żeby finał grało się w pełni zmasterowaną postacią.
- **Specjalizacje to gałęzie drzewka, nie odblokowania.** Kret nie „odblokowuje Snipera" — kret *staje się* Sniperem w tym runie, bo tak poszły talenty; w następnym może pójść inaczej. Bliżej Diablo 2 / Hadesa niż MMO. Treść ta sama (12 klas × 3 ścieżki), bez grindu wokół niej.
- **Liczby (wdrożone 2026-07-20, `src/sim/talentsConfig.ts`):** max poziom **25**, punkt talentu co awans (24 punkty na run), gałąź kosztuje dokładnie 24 punkty — zmaksowanie jednej zjada więc cały run. Rzędy odblokowuje inwestycja w tę samą gałąź (0 / 5 / 10 / 15 punktów).
- **Exp:** 3 za zabójstwo + porcja za każdą ukończoną falę, **wyliczana z długości runu** (`xpPerWaveCleared`). Fale są podłogą, której nikt nie przegapi, zabójstwa tylko przyspieszają. Zmierzone: maks poziom na fali 7 z 10 przy agresywnej grze.
- **Wybór specjalizacji na 2. poziomie** *(2026-07-20)*: pierwszy punkt talentu można wydać WYŁĄCZNIE na specjalizację. Wybór jest **nieodwracalny** — zamyka pozostałe dwie gałęzie do końca runu. To moment, w którym run dostaje kierunek.
- **Talenty mogą PODMIENIAĆ umiejętność, nie tylko dodawać liczby.** Mechanizm: skille są danymi (`src/sim/skillsConfig.ts`), a talent wskazuje id umiejętności (`TalentDef.grantsSkill`). Wybór specjalizacji SNIPER natychmiast zamienia `Q` z szerokiego wachlarza w zwarciu na **bardzo daleki, wąski strzał** (zasięg ×6.5, rozwarcie ~11°). To ten sam wzorzec co przy bossach: prymitywy w symulacji, konkrety w danych — i to on powtórzy się przy każdej kolejnej gałęzi.
- **Dwa sloty umiejętności, oba podmienialne:** `Q` (skille, `SKILLS`) i spacja (doskoki, `DASHES`). Talent wskazuje id przez `grantsSkill` albo `grantsDash`. Sprawdzone na dwóch przypadkach z różnych slotów: kret → SNIPER SHOT pod `Q`, zając → POWER JUMP pod spacją (skok z obrażeniami obszarowymi przy lądowaniu, zamienia ucieczkę w wejście). Trzeci i kolejne warianty to wpis w danych, nie zmiana w symulacji.
- **Status:** system, drzewka 12 klas, panel pod `T` i dwie gałęzie zmieniające zachowanie — wdrożone. Reszta talentów jest wciąż pasywna.

**Konsekwencja architektoniczna — najważniejszy zysk tej zmiany.** Skoro nic nie przechodzi przez granicę runu, świat jest w całości wyznaczony przez **seed + listę wybranych klas**. Kontrakt „loadoutu" staje się zbędny, nie ma czego deklarować ani czego oszukiwać, a lockstep robi się wyraźnie bezpieczniejszy, bo wszyscy startują identycznie. To był największy nierozwiązany problem poprzedniej koncepcji.

**Do rozstrzygnięcia:**
1. **Długość runu.** Dziś 10 fal × 45 s ≈ 8 minut — za mało na łuk „goły → maks → master". Skoro run jest całą grą, potrzebuje **20-40 minut**; to zmiana i liczby fal, i ich tempa.
2. **Podział ról: drzewko vs karty z przerwy.** Oba dają dziś moc w trakcie runu i zaczną się dublować. Propozycja: **drzewko = tożsamość i zachowanie** (umiejętności klasy), **karty z przerwy = ogólne statystyki i losowa przyprawa**, itemy z ziemi bez zmian.
3. **Los SALVAGE i LAB** (sekcja 5.7) — system jest zaimplementowany, a „żadnych zapisów" go wywraca. Usuwamy całkowicie czy zostawiamy `localStorage` wyłącznie na statystyki i rekordy, bez wpływu na moc?
4. **Co przyciąga do kolejnego runu**, skoro nie ma odblokowań? Zostaje inna klasa, inny build, inny seed. Tani zamiennik bez łamania zasady zero-zapisu: **wybór trudności w lobby** — dostępny od razu, nie do odblokowania.

---

<details>
<summary><b>PORZUCONE 2026-07-20:</b> koncepcja z kontami i progresją między runami (5.8-5.10, 5.13) — rozwijana wcześniej tego samego dnia, zastąpiona powyższą</summary>

Poniższe sekcje opisują model, w którym postęp przeżywał run: 12 alt-postaci na koncie, exp per klasa, specjalizacje odblokowywane ukończeniem runów, 5 runów w drabince tierów, carry i konta (docelowo Discord OAuth). **Zostawione dla historii decyzji** — gdyby kiedyś wracać do meta-progresji, tu jest gotowa analiza wraz z pułapkami (skalowanie hordy pod mieszane poziomy, exp za obecność zamiast udziału, dzielenie odblokowań w drużynie).

#### ~~5.8 Postacie i konto~~ *(porzucone)*

Gra przesuwa się z czystego roguelite w stronę **„dungeon runnera z postaciami"** (bliżej Diablo niż Brotato). To świadoma zmiana i warto ją nazwać, bo zmienia sens śmierci:

- Konto trzyma **12 osobnych postaci** — po jednej na klasę, każda z własnym poziomem, expem i talentami. To alty w rozumieniu MMO, nie „wybór klasy" w rozumieniu roguelike.
- **Run to wejście do lochu, nie życie.** Exp, poziom i talenty przeżywają śmierć. Jednorazowe są wyłącznie ulepszenia wybierane między falami (sekcja 5.0).
- Nieukończony run **nie jest stratą, tylko brakiem pełnej nagrody** — daje exp i SALVAGE proporcjonalnie do przetrwanych fal i zabójstw (ten sam kształt wzoru co dzisiejsza nagroda SALVAGE). Ekran końca runu przestaje komunikować „przegrałeś".

**Jedna klasa na lobby:** w jednej drużynie nie ma dwóch kretów. Jeśli ktoś zajmie Twojego maina, grasz inną postacią z konta — na jej własnym, niższym poziomie. Klasa zajęta w lobby zwalnia się po wyjściu gracza, ale klasa zajęta **w trakcie runu zostaje zablokowana do końca**, żeby dało się później dorobić powrót rozłączonego gracza do tej samej postaci.

#### ~~5.9 EXP i specjalizacje~~ *(porzucone — exp per klasa i odblokowania zastąpione progresją w runie; sam podział talentów na „liczbowe vs zmieniające zachowanie" i budżet 1-2 umiejętności na ścieżkę POZOSTAJĄ aktualne, patrz 5.8)*

- **EXP jest w całości per klasa.** Zabijasz kretem — rośnie kret. Bez wspólnej puli konta; rolę zabezpieczenia przed „zajęli mi maina" pełni SALVAGE, które jest kontowe.
- **Nadrabianie altami** przez krzywą, nie przez osobny system: zysk expa rośnie z tierem (sekcja 5.10), więc świeża postać szybko rośnie na niskich tierach.
- **EXP zależy od udziału, nie od obecności** — liczony z zabójstw i przetrwanych fal. Bez tego optymalną strategią byłoby wejść altem, umrzeć na pierwszej fali i poczekać na łup z najwyższego tieru.
- Każda klasa ma **3 specjalizacje** do odblokowania, po jednej ścieżce na styl gry. Odblokowanie specjalizacji to nagroda za ukończenie konkretnego runu (sekcja 5.10).
- **Drzewko talentów w lobby** — wybór przed wejściem do runu, nie w trakcie.

**Pierwsze zaplanowane specjalizacje:** kret → **Sniper** (od niej zaczynamy), zając → **Aura Master**.

**Budżet treści — najważniejsze ryzyko tego systemu.** Talenty dzielą się na dwa zupełnie różne kosztowo rodzaje:

| Rodzaj | Przykład | Koszt |
|---|---|---|
| liczbowe | „+15% obrażeń" | ~zero — mechanizm efektów już istnieje i jest wspólny dla itemów, ulepszeń i LAB |
| zmieniające zachowanie | celowany strzał snipera | nowy kod w symulacji, osobno testowany pod determinizm |

12 klas × 3 specjalizacje = 36 ścieżek. Przy 4 nowych umiejętnościach na ścieżkę to 144 mechaniki — to się nie skończy. Realistyczny budżet: **1–2 prawdziwe umiejętności na specjalizację, reszta liczbowo.**

**Kolejność wdrożenia:** ten sam ruch, który zadziałał przy bossach (drugi boss kosztował jeden plik) — zbudować system ogólnie, ale wypuścić **JEDNĄ specjalizację od początku do końca (kret Sniper)** i przejść z nią pełną pętlę: lobby → drzewko → run → odblokowanie. Dopiero to pokaże realny koszt jednej ścieżki.

#### ~~5.10 Runy, odblokowania i tiery~~ *(porzucone — nie ma odblokowań ani tierów; pomysł „run jako dane, jeden plik = jeden run" wart zachowania na przyszłe warianty runu)*

- **5 runów (dungeonów)**, każdy z własnymi bossami, pulą itemów i nagrodami. Ukończenie odblokowuje m.in. specjalizacje klas.
- **Odblokowywane po kolei:** run 2 dostępny po ukończeniu runu 1 itd.
- **Drabinka tierów:** po przejściu wszystkich pięciu runów odblokowuje się kolejny tier — te same runy, wyższa trudność i lepsze nagrody. Tier jest **jedną globalną liczbą konta**, a nie osobną trudnością per run: jedna liczba do pokazania graczowi i jedna do balansowania.
- Tierów ma być **skończenie wiele (5–8)**. Nieskończone brzmią hojnie, ale nie da się ich zbalansować i odbierają moment „przeszedłem grę".
- **Architektura: run jako dane, dokładnie jak boss.** Jeden plik = jeden run (tabela fal, lista bossów, pula itemów, tabela nagród, co odblokowuje). Dzisiejszy `wavesConfig.ts` staje się jednym z runów, a nie globalną konfiguracją.

**Wspólna gra przy różnych odblokowaniach** — bez tej zasady pierwszy wspólny wieczór się sypie, bo każdy ma odblokowane co innego:

- Run wybiera **host**, wejść może **każdy**, niezależnie od własnych odblokowań.
- Ukończenie runu **odblokowuje go WSZYSTKIM uczestnikom** — carry jest legalne i jest głównym sposobem, w jaki nowy znajomy dogania resztę.
- **Trudność i nagrody idą za najwyższym uczestnikiem** (tier najmocniejszego w drużynie). Zamyka to lukę „podstaw świeżą postać jako hosta, żeby zbić trudność", a jednocześnie sprawia, że carry realnie nadrabia — nowy dostaje łup z góry drabinki.

Odrzucone warianty: część wspólna odblokowań (jedna osoba blokuje całą ekipę) i „każdy gra tylko swoje" (nie zagracie razem, dopóki wszyscy nie odrobią tego samego). Przy grze dla znajomych oba są zabójcze.

**Dwie konsekwencje do wdrożenia razem z tierami:**

1. **Skalowanie hordy siłą, nie liczbą głów.** Dziś `mobsPercentPerExtraPlayer: 60` dokłada 60% wrogów za każdego gracza. Przy trudności ustawionej na najmocniejszego oznacza to, że dorzucenie postaci na poziomie 1 dokłada 60% hordy, a prawie nic nie zabija — carry staje się karą dla weterana, czyli odwrotnie niż zamierzono. Gracz znacznie poniżej czoła ma liczyć się jako ułamek osoby.
2. **Wskrzeszanie między falami.** Skoro wrogowie są tunowani pod weterana, świeża postać padnie w pierwszej fali i oglądałaby 20 minut cudzej gry. Martwi wracają na start kolejnej fali; run przegrywacie tylko, gdy padniecie **wszyscy w obrębie jednej fali**. Symulacja ma już fazę przerwy i flagę śmierci — to zmiana zasady, nie architektury.

</details>

---

### 5.14 Sojusznicze jednostki *(zdecydowane i wdrożone 2026-07-20)*

Jeden system pod wszystkie pomysły na „coś walczy po mojej stronie": totemy, wskrzeszeni, przywołańcy. Konfiguracja: **`src/sim/minionsConfig.ts`**.

**Osie zmienności** (to one decydują, czy system jest ogólny):

| Oś | Warianty |
|---|---|
| ruch | `static` (totem) · `follow` (leci za graczem) · `hunt` (poluje sam) |
| trwałość | HP (0 = niezniszczalny) + czas życia w tickach |
| atak | **ten sam słownik co u bossów** (`slam`, `ring`) + `bolt` (pocisk w najbliższego) |
| skala | limit sztuk na gracza + twardy sufit poola (zawór dla FPS) |

**Kluczowa decyzja: ataki jednostek to ataki bossów.** Behemot zająca dostaje ataki Hive Queen dosłownie — przez odczyt `HIVE_QUEEN.phases[0].attacks`, nie przez kopię liczb. Dzięki temu każdy przyszły „duży przywołaniec ze skillami" jest darmowy.

**Trzy specjalizacje zbudowane na tym systemie (wszystkie to DANE, nie kod):**

| Klasa | Specjalizacja | Co robi |
|---|---|---|
| Hiena | **NECROMANCER** | `Q` bez zmian; **pasywka**: wróg zabity w promieniu wokół gracza wstaje po naszej stronie. Talenty w gałęzi powiększają promień, więc build skaluje samą pasywkę |
| Dzik | **TOTEM ENGINEER** | obsadza **wszystkie trzy sloty**: `Q` wieżyczka (szybkie pociski), `W` totem pulsujący (pierścienie), `E` totem odpychający (knockback bez obrażeń) |
| Zając | **SUMMONER** | `Q` przywołuje **Behemota** — jednego, wielkiego, z własnym paskiem HP i atakami bossa. Alternatywa dla Slipstreamu: wybór jednej gałęzi zamyka drugą (standardowa reguła rzędu specjalizacji) |

### Zając SLIPSTREAM — build skoczka *(2026-07-20)*

Cała gałąź stoi na jednej pętli: **`Q` i `W` zerują cooldown skoku**, więc łańcuch skok → cios → skok kręci się, dopóki masz co naciskać.

| Klawisz | Co robi |
|---|---|
| `Q` LEAP STRIKE | skok w kursor z falą uderzeniową przy lądowaniu · **resetuje skok** |
| `W` SHOCK NOVA | potężny cios dookoła siebie, bez ruchu · **resetuje skok** |
| `SPACJA` | zwykły skok; talent na końcu gałęzi zamienia go w pełny POWER JUMP |

**Pułapka projektowa, którą trzeba było zamknąć:** gdyby doskok też resetował doskok, apex („spacja staje się Power Jumpem") dałby **nieskończoną mobilność bez przestoju** — spacja resetowałaby samą siebie. Dlatego `resetsDash` jest wyłącznie na `Q` i `W`, a ich cooldowny są jedynym ogranicznikiem pętli. Zapisane też jako ostrzeżenie w `SkillBase.resetsDash`.

**Skalowanie:** oś gałęzi to `impactRadius` — promień fali uderzeniowej. Pełna gałąź daje **+845%** (206 px → ~1950 px), więc pod koniec runu jedno lądowanie czyści pół ekranu.

**Odbijanie od dużych wrogów:** skok przelatuje nad TERENEM, ale wielki wróg (promień ≥ 20 — Brute i bossowie) jest za wysoki i zatrzymuje doskok. Ulepszony doskok przy odbiciu od razu w niego uderza. Zwykłe mobki się nie liczą — przez hordę przelatujesz.

**Dwie rzeczy zrobione bez nowego kodu w symulacji:**
- **`W` to stożek o rozwarciu 360°** (`coneCos: -1`) — istniejący test stożka przepuszcza wtedy wszystkie kierunki.
- **`Q` to `LeapSkill`**, który odpala ten sam wariant doskoku co spacja, tylko wskazany po id. Zero powielonego kodu skoku.

**Trzy sloty umiejętności** *(2026-07-20)*: `Q`/`W`/`E`, w `SimInput` jako numer slotu (`skillCast`), nie flaga. Talent obsadza sloty przez `grantsSkills`, więc jedna specjalizacja może dać trzy umiejętności naraz.

**Skalowanie talentami** *(2026-07-20)*: cztery efekty — `minionDamage`, `minionHp`, `minionCount`, `minionDuration`. Buildy przywoływaczy rosną **przez jednostki, nie przez obrażenia własne gracza**; bez tego specjalizacja, w której `Q` nie zadaje obrażeń, byłaby ślepą uliczką. Skalowanie jest celowo bardzo mocne: pełna gałąź nekromanty to +240% obrażeń stada i +16 sztuk naraz, summonera +205% HP i drugi Behemot.

**Behemot jest WIECZNY** — nie ma licznika czasu, ginie wyłącznie od obrażeń i jako jedyny przeżywa przerwę między falami. Koszt: 20 s cooldownu i `Q`, które przestaje zadawać obrażenia.

**Jednostki znikają między falami** — inaczej totemy przechodziłyby przez przerwę i pierwsza fala po niej byłaby darmowa.

### 5.15 Statusy i aury — dwa prymitywy *(wdrożone 2026-07-20)*

Konfiguracja: **`src/sim/statusConfig.ts`**. Zbudowane generycznie, bo będziemy z nich korzystać przy wielu klasach.

**STATUS** — coś, co wisi NA WROGU przez jakiś czas. Jeden opis pokrywa cztery różne mechaniki, bo różnią się tylko liczbami:

| Oś | Do czego służy |
|---|---|
| `damagePerTick` | trucizny i podpalenia (DoT) |
| `speedMult` | spowolnienia i przymrożenia |
| `vulnerability` | osłabienia — wróg obrywa mocniej od WSZYSTKIEGO |
| `spreadRadius` / `spreadCount` | zaraza przeskakująca z wroga na wroga |
| `maxStacks` | nakładanie się; siła bierze najsilniejszy stack, nie iloczyn — dwa spowolnienia nie mają zatrzymywać wroga w miejscu |

Gotowe na start: `plague` (słaba, ale się rozprzestrzenia), `burn` (mocny DoT), `chill` (spowolnienie bez obrażeń), `weaken` (podatność).

**Sloty:** 3 na wroga, prealokowane. Pool ma 400 wrogów i nie może alokować w trakcie gry; czwarty status wypycha ten z najkrótszym pozostałym czasem.

**AURA** — coś, co wisi NA GRACZU i działa w promieniu. Aura celująca we wrogów zwykle po prostu **nakłada status**, więc oba prymitywy dzielą słownik i jeden plik.

Gotowe: `miasma` (chmura zarazy), `frostfield` (pole spowalniające), `lifetide` (leczy drużynę), `packbond` (wzmacnia sojuszników obok).

**Kluczowa decyzja — bonusy z aur są przeliczane OD ZERA w każdym ticku**, a nie doklejane na stałe do statystyk. Dzięki temu wyjście z pola samo zabiera bonus i nie ma żadnej księgowości „załóż / zdejmij", która jest klasycznym źródłem błędów typu „bonus został po wyjściu". Zweryfikowane testem: bonus znika w tym samym ticku, w którym sojusznik opuszcza promień.

Talent włącza aurę przez `grantsAura`; aury **się sumują** (gracz może roztaczać kilka naraz).

**Co odblokowują:** szczur (zaraza), wydra (leczenie drużyny), wilk (premia obok sojusznika) — a przy okazji trucizny, podpalenia, spowolnienia i osłabienia dla dowolnej przyszłej klasy.

### ~~5.11 Typy obrażeń: fizyczne i magiczne~~ *(PORZUCONE 2026-07-20, tego samego dnia)*

> Obrażenia zostają **jednego rodzaju**. Powód porzucenia jest dokładnie ten, który zapisano w analizie poniżej: system zwracał się wyłącznie wtedy, gdyby wrogowie dostali zróżnicowane odporności — a bez tego byłby podwojeniem liczby statystyk, opisów i pozycji w sklepie bez żadnej zmiany w rozgrywce. Nic nie trafiło do kodu.

<details>
<summary>rozwiń porzuconą analizę typów obrażeń</summary>


**Warunek sensu tego systemu:** typy zwracają się wyłącznie wtedy, gdy różnicują je WROGOWIE. Jeśli każdy najeźdźca przyjmuje jedno i drugie tak samo, podwajamy liczbę statystyk, opisów i pozycji w sklepie, a rozgrywka nie zmienia się o krok — to najczęstszy sposób, w jaki ten system staje się kosztem bez zysku.

Zysk pojawia się dopiero tu: część najeźdźców jest **opancerzona** (odbija fizyczne), część **osłonięta polem** (odbija magiczne). Wtedy skład drużyny zaczyna mieć znaczenie — co spina się z zasadą „jedna klasa na lobby" i ze specjalizacjami.

- **Typ deklarowany przy źródle** — każdy atak i skill mówi, czym bije, dokładnie jak ataki bossów deklarują swój rodzaj (`src/sim/bosses/types.ts`). Zero logiki rozsianej po symulacji.
- **Dwie statystyki obronne o IDENTYCZNYM wzorze:** pancerz (fizyczny, już istnieje) i odporność (magiczna). Ten sam wzór to świadoma decyzja — nie chcemy drugiego, niezależnego problemu balansowego.
- **Migracja:** dzisiejszy efekt `strength` podbija „obrażenia" bez rozróżnienia. Trzeba zdecydować, czy staje się „wszystkie obrażenia", czy rozszczepia na dwa — dotyczy itemów, ulepszeń z przerwy i LAB naraz.
- **Do rozstrzygnięcia:** nazwy w grze (EN). Pod neon sci-fi lepiej pasuje **KINETIC / ENERGY** niż physical/magical — do decyzji.

</details>

---

### 5.12 Friendly fire *(zdecydowane 2026-07-20)*

**Friendly fire jest cechą ATAKU, nie zasadą świata.** Globalny FF w kooperacji na 8 osób z 400 wrogami na ekranie jest zwykle po prostu przykry — nie dlatego, że trudny, tylko dlatego, że przy tym natłoku nie widać, kto kogo trafił. Kara bez czytelności to szum, nie wyzwanie.

Zamiast tego FF jest **podatkiem od mocy konkretnych umiejętności**: celowany strzał snipera przebija i rani sojuszników — i właśnie dlatego wolno mu bić tak mocno. Zwykłe machnięcie łapą nigdy nie rani swoich.

Bezpieczniki, bez których to się wywróci:

- **FF nie zabija** — obrażenia od swoich nie zbijają poniżej progu (np. 1 HP). Pomyłka boli, ale nie kończy komuś runu.
- **Mnożnik wyraźnie poniżej 100%** — trafienie kolegi ma być sygnałem, nie katastrofą.
- **Czytelność przed mechaniką** — podgląd celowania musi pokazywać, kto stoi na linii. Dziś jest podgląd stożka; przy pociskach przelotowych to za mało.
- Pełny FF (100%, bez progu) zostaje jako **przełącznik lobby** dla chętnych.

FF nie zagraża determinizmowi — to zwykłe źródło obrażeń w symulacji. Zagraża natomiast publicznemu matchmakingowi (wektor trollowania), więc dopóki gra jest dla znajomych, jest bezpieczny.

### ~~5.13 Lobby, tożsamość i konta~~ *(PORZUCONE 2026-07-20 — zero zapisu postaci znaczy zero kont; zostaje samo lobby z unikalnymi klasami, patrz 5.8. Poniższe tylko dla historii)*

<details>
<summary>rozwiń porzuconą analizę kont</summary>

Konta **nie powstają teraz** — nie z lenistwa, tylko dlatego, że dziś nie wiadomo jeszcze, co miałyby trzymać; schemat zaprojektowany przed drzewkiem talentów będzie zły. Trzy etapy:

| Etap | Tożsamość | Progresja | Infrastruktura |
|---|---|---|---|
| **A (teraz)** | wygenerowane id + nick w `localStorage`, lobby po kodzie | lokalna | zero |
| **B** | to samo | na serwerze | serwer sygnalizacyjny WebRTC dostaje drugie zadanie — jeden deploy, nie dwa |
| **C** | **Discord OAuth** | na serwerze | grę i tak organizujemy na Discordzie; brak obsługi haseł, rejestracja jednym klikiem |

**Świadomy koszt etapu A:** progresja jest lokalna, a połączenie peer-to-peer, więc **każdy klient deklaruje własne odblokowania i nikt tego nie sprawdza**. Między znajomymi to nie problem, ale to decyzja, nie przypadek — i to ona blokuje publiczny matchmaking do czasu etapu B.

**Kontrakt „loadoutu" — jedna abstrakcja, która spina cały ten dokument.** Wszystko, co gracz wnosi do runu (klasa, specjalizacja, talenty, poziom, bonusy LAB), to **jeden serializowalny obiekt rozsyłany w lobby i podawany symulacji jawnym argumentem**. Architektura jest już w ~80% gotowa: `World` dostaje dziś `MetaBonus[]` konstruktorem i nigdy nie sięga sam do `localStorage` (sekcja 5.7). Loadout to rozszerzenie tego wzorca, nie nowy pomysł.

</details>

## 6. Platformy i sterowanie

- **Sterowanie (zdecydowane 2026-07-19): point-and-click jak Dota 2 / LoL** — klik RMB = idź do punktu, trzymanie RMB = podążaj za kursorem. **WASD usunięte** (decyzja późniejsza tego samego dnia — mysz jest jedynym sterowaniem ruchu). Bonus: model mapuje się 1:1 na dotyk — tani port mobilny.
- **Skille: QUICK CAST *(zmienione 2026-07-20)*.** Klawisz odpala umiejętność natychmiast w stronę kursora — bez trybu celowania. `Q` = Power Slash, kolejne skille pójdą na `W`/`E`/`R` (docelowo też kombinacje). Tryb „najpierw wyceluj, potem zatwierdź" porzucony: przy czterech skillach byłby nie do grania. Podgląd zasięgu świeci sam, gdy skill jest gotowy.
- **Spacja = doskok *(2026-07-20)*.** Własny, krótki cooldown (3 s), niezależny od skilla — gdyby dzielił zasób, gracz musiałby wybierać „uciec albo uderzyć" i w praktyce nie użyłby żadnego w dobrym momencie. Dwa warianty w danych klasy (`ClassDef.dashMode`): `dash` zatrzymuje się o przeszkody, `jump` przelatuje nad nimi i daje **nietykalność w locie** (zając — jego sygnatura mobilności).
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
6. **DŁUGOŚĆ RUNU** *(blokuje poziomy i drzewko)* — dziś ~8 min, potrzeba 20-40, żeby zmieścił się łuk „goły → maks → master". Ile fal i jak długich? (5.8)
7. **Los SALVAGE i LAB** — zaimplementowane, ale „zero zapisu" je wywraca: usunąć czy zostawić zapis wyłącznie na statystyki i rekordy? (5.7)
8. **Kształt drzewka talentów** — ile punktów, ile gałęzi, czy gałąź trzeba „domknąć", żeby wejść w kolejną? (5.8)
9. **Specjalizacje klas** (znane: kret → Sniper, zając → Aura Master) — jako gałęzie drzewka, nie odblokowania (5.8)
10. **Co przyciąga do kolejnego runu** bez odblokowań — wybór trudności w lobby? (5.8)

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
| 2026-07-20 | **ZWROT: zero zapisu — cała gra mieści się w jednym runie** (poziomy, drzewko, max level, reset po runie) | Decyzja użytkownika, tego samego dnia co koncepcja z kontami — i ją zastępuje. Kasuje konta, serwer, exp per klasa, alty, tiery i carry. Zysk architektoniczny: świat wyznacza wyłącznie seed + lista klas, więc nie ma czego deklarować ani oszukiwać, a lockstep jest bezpieczniejszy (5.8) |
| 2026-07-20 | **Specjalizacje = gałęzie drzewka w runie, nie odblokowania** | Konsekwencja zera zapisu: treść zostaje ta sama (12 klas × 3 ścieżki), znika grind wokół niej. Bliżej Diablo 2 / Hadesa niż MMO (5.8) |
| 2026-07-20 | ~~Konta, exp per klasa, 5 runów w tierach, carry~~ **PORZUCONE** | Zastąpione powyższym zwrotem. Analiza zostaje w GDD zwinięta, bo zawiera pułapki warte pamiętania, gdyby meta-progresja kiedyś wracała |
| 2026-07-20 | **Roster: 12 klas** — usunięci kapibara i pancernik, dołączyli szczur, dzik, wydra, hiena | Pomysł użytkownika; usunięci dublowali role niedźwiedzia i jeża. Każda klasa dostaje sygnaturową mechanikę i typ obrażeń, żeby 12 klas nie było 12 wariantami tego samego (5.4) |
| 2026-07-20 | **Gatunek: dungeon runner z postaciami**, nie czysty roguelite | Konsekwencja expa per klasa i alt-postaci: run to wejście do lochu, nie życie; postęp klasy przeżywa śmierć (5.8) |
| 2026-07-20 | **EXP w całości per klasa; 12 osobnych postaci na koncie** | Decyzja użytkownika (odrzucona wspólna pula konta). Bezpieczne, bo SALVAGE/LAB jest kontowe i daje altowi podłogę mocy — brakuje mu tylko tożsamości (5.8, 5.9) |
| 2026-07-20 | **EXP liczony z udziału (zabójstwa + przetrwane fale)** | Bez tego optymalną strategią byłoby wejść altem, umrzeć na fali 1 i poczekać na łup z najwyższego tieru (5.9) |
| 2026-07-20 | **3 specjalizacje na klasę; pierwsza wdrażana: kret Sniper** | 12×3 = 36 ścieżek to ryzyko eksplozji treści. Ta sama taktyka co przy bossach: system ogólnie, ale JEDNA ścieżka end-to-end zanim ruszy produkcja reszty (5.9) |
| 2026-07-20 | **5 runów odblokowywanych po kolei + globalny tier konta (5–8 tierów)** | Decyzja użytkownika. Tier jako jedna liczba, nie trudność per run: jedna rzecz do pokazania i jedna do balansowania; skończona liczba tierów zostawia moment „przeszedłem grę" (5.10) |
| 2026-07-20 | **Run jako dane — jeden plik = jeden run** | Architektura bossów obroniła się w praktyce (drugi boss kosztował jeden plik); to ten sam kształt problemu (5.10) |
| 2026-07-20 | **Carry legalne: host wybiera run, ukończenie odblokowuje go wszystkim uczestnikom** | Bez tego pierwszy wspólny wieczór się sypie, bo każdy ma odblokowane co innego. Odrzucone: część wspólna odblokowań (jedna osoba blokuje ekipę) i „każdy gra swoje" (nie zagracie razem) (5.10) |
| 2026-07-20 | **Trudność i nagrody idą za NAJWYŻSZYM uczestnikiem** | Poprawka użytkownika do carry: zamyka lukę „podstaw świeżą postać jako hosta, żeby zbić trudność", a nowemu daje łup z góry drabinki (5.10) |
| 2026-07-20 | **Horda skalowana siłą drużyny, nie liczbą głów + wskrzeszanie między falami** | Konsekwencje trudności „za najmocniejszym": dziś każdy gracz dokłada 60% wrogów, więc słaby alt byłby karą dla weterana; a tunowani pod weterana wrogowie kazaliby mu oglądać 20 minut cudzej gry (5.10) |
| 2026-07-20 | ~~Obrażenia fizyczne i magiczne~~ **PORZUCONE** tego samego dnia — zostaje jeden rodzaj obrażeń | Warunkiem sensu było zróżnicowanie odporności u wrogów; bez tego system byłby podwojeniem liczby statystyk i opisów bez zmiany rozgrywki. Nic nie trafiło do kodu (5.11) |
| 2026-07-20 | **Friendly fire jako cecha ataku, nie zasada świata** | Globalny FF przy 8 graczach i 400 wrogach jest nieczytelny, więc frustruje zamiast wyzywać. Jako podatek od mocy celowanych skilli (sniper) — działa i uzasadnia ich obrażenia (5.12) |
| 2026-07-20 | **Konta odłożone; etapy A→B→C, docelowo Discord OAuth** | Schemat bazy zaprojektowany przed drzewkiem talentów byłby zły. Serwer sygnalizacyjny WebRTC i tak jest potrzebny — to on dostanie przechowywanie profilu (5.13) |
| 2026-07-20 | **Wybór specjalizacji na 2. poziomie, nieodwracalny, zamyka pozostałe gałęzie** | Pomysł użytkownika. Daje runowi kierunek w pierwszej minucie i sprawia, że drzewko jest decyzją, a nie listą zakupów (5.8) |
| 2026-07-20 | **Talent może podmienić umiejętność (`grantsSkill`); skille wyciągnięte do danych** | Warunek istnienia gałęzi zmieniających zachowanie. Bez tego każda z 36 ścieżek wymagałaby własnych rozgałęzień w kodzie symulacji (5.8, `skillsConfig.ts`) |
| 2026-07-20 | **Krytyki: globalny efekt z dropów i kart, sufit 75% szansy** | Pomysł użytkownika; snajper ma je skalować mocniej niż inne klasy. Sufit poniżej 100%, bo przy gwarantowanym krycie statystyka przestaje być zdarzeniem i staje się zwykłym mnożnikiem obrażeń (5.3) |
| 2026-07-20 | **Spacja = doskok; Power Slash przeniesiony na `Q`; skille w trybie quick cast** | Pomysł użytkownika. Quick cast zamiast celowania dwuetapowego, bo pod `W`/`E`/`R` dojdą kolejne skille — tryb celowania przy czterech byłby nie do grania. Dash ma własny cooldown, żeby nie konkurował ze skillem o ten sam zasób (5.4, sekcja 6) |
| 2026-07-20 | **Prymitywy STATUS i AURA** (`statusConfig.ts`) | Zamówione generycznie „bo będziemy z tego często korzystać". Jeden opis statusu pokrywa DoT, spowolnienie, osłabienie i zarazę; aura na wrogów po prostu nakłada status. Bonusy z aur przeliczane co tick zamiast doklejane — zero księgowości przy wychodzeniu z pola (5.15) |
| 2026-07-20 | **System sojuszniczych jednostek; ataki jednostek = ataki bossów** | Pomysł użytkownika (nekromanta, totemy, przywoływacz). Zbudowany od razu pod wszystkie cztery kształty naraz, a nie pod sam dron — dzięki czemu kolejna jednostka to wpis w danych. Behemot czyta ataki Hive Queen dosłownie (5.14) |
| 2026-07-20 | **Wejścia jednorazowe buforowane do czasu konsumpcji przez symulację** | Błąd znaleziony przy pierwszym uruchomieniu renderu: render 60 FPS vs symulacja 30 Hz oznaczały, że połowa wciśnięć `Q`/`W`/`E`/spacji i kliknięć w talenty przepadała. Objaw: „czasem skill nie odpala" (roadmap.md, Faza 2) |
| 2026-07-20 | **Zając SLIPSTREAM: `Q`/`W` resetują skok; apex zamienia spację w Power Jump** | Pomysł użytkownika — klasyczna pętla „reset przez trafienie" (Hades, Doom Eternal). Reset NIE trafił na sam doskok, bo resetowałby siebie i dał nieskończoną mobilność; pętlę ograniczają cooldowny `Q` i `W` (5.15) |
| 2026-07-20 | **Doskok odbija się od dużych wrogów (promień ≥ 20), ulepszony przy tym rani** | Pomysł użytkownika; nad terenem przeskakujesz, nad Brutem czy bossem już nie. Zwykła horda nie blokuje, więc przelot przez tłum zostaje (5.15) |
| 2026-07-20 | **Trzy sloty umiejętności Q/W/E; talent może obsadzić kilka naraz** | Wymuszone przez dzika-inżyniera (trzy totemy z jednej specjalizacji). `skillCast` jako numer slotu zamiast flagi `attack` — skaluje się na `R` i kombinacje (5.14) |
| 2026-07-20 | **Power Jump zająca; doskoki wyciągnięte do danych (`DASHES`)** | Drugi test mechanizmu talentów zmieniających zachowanie, celowo w INNYM slocie niż snajper (spacja zamiast `Q`). Ten sam `TalentDef` obsłużył oba — mechanizm jest ogólny, więc kolejne skille to wpisy w danych (5.8) |
| 2026-07-20 | **Doskok w dwóch wariantach zapisanych w danych klasy** — `dash` (blokowany przeszkodami) i `jump` (nad przeszkodami, nietykalność w locie, zając) | Pomysł użytkownika; pierwsza sygnaturowa mechanika klasy, która trafiła do kodu. Wariant siedzi w `ClassDef`, więc kolejne klasy dostają swoje bez dotykania symulacji |
| 2026-07-20 | **Loadout jako jeden kontrakt lobby↔symulacja** | Rozszerzenie działającego wzorca `MetaBonus[]`: symulacja dostaje wszystko jawnym argumentem i nigdy nie czyta zapisu sama — warunek determinizmu co-opu (5.13) |
| 2026-07-20 | **Klasa identyfikowana tekstowym id, nie indeksem** *(dług do spłacenia przed zmianą rosteru)* | `classIndex` w protokole i `lastClassIndex` w zapisie: usunięcie klas przesuwa indeksy, a stara i nowa wersja gry dogadają się bez błędu i policzą dwa różne światy — desync bez błędu w logice (5.4) |

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
