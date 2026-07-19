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

### 5.2 Mobki i fale — najeźdźcy z kosmosu *(zdecydowane 2026-07-19)*
Cztery typy najeźdźców na start (grafika: na razie kolory, sci-fi sprite'y później):
| Typ | Rola | Charakter |
|---|---|---|
| **Alien** | podstawowy | średnie tempo, idzie na gracza |
| **Demon** | szybki | mało HP, dużo ruchu — presja |
| **Robot** | tank | wolny, gruby, boli przy kontakcie |
| **Alien Mage** | dystansowy | trzyma odległość, strzela pociskami |

- Miks fal zmienia się z czasem gry (najpierw alieny, potem dochodzą kolejne typy).
- Cel wydajnościowy: setki mobków na ekranie przy 60 FPS (osiągalne w WebGL — patrz sekcja 7).

### 5.3 Itemki
- Przedmioty modyfikujące statystyki i styl gry.
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

### 5.5 Krainy (progresja poziomów)
- Kraina zależna od poziomu/etapu runu: nowa sceneria + nowe mobki + nowy klimat.
- Naturalny nośnik motywu gry (patrz OTWARTE: motyw zamiast ziemniaków).

### 5.6 Multiplayer (co-op) — planowany
- Docelowo co-op dla 2-4 graczy (znajomi), najpewniej przez WebRTC/LAN — zgodne z trybem prywatnym, gra pozostaje statyczną paczką plików.
- **Decyzja architektoniczna (2026-07-19):** rdzeń gry pisany jako **deterministyczna symulacja** od pierwszej linijki (stały timestep, seedowany RNG, własna prosta fizyka, symulacja oddzielona od renderu). Netcode (lockstep) dochodzi dopiero po grywalnym single-playerze — bez przepisywania rdzenia.
- Bonus dla single-player: powtarzalne runy z seeda (daily run, replaye) niemal za darmo.
- **Do rozstrzygnięcia:** ilu graczy maks? drop-in w trakcie runu czy tylko wspólny start? LAN only czy też przez internet?

### 5.7 Meta-progresja (roguelite)
- Po śmierci zostaje waluta/odblokowania → kolejny run zaczynasz mocniejszy.
- **Do rozstrzygnięcia:** co dokładnie kupujemy (statystyki? nowe klasy? nowe itemy w puli?). Zapis: localStorage/IndexedDB na start, konta/chmura później.

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
