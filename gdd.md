# WebSlasher — Game Design Document

> **Wersja:** 0.1 (szkielet) · **Data:** 2026-07-19 · **Status:** pomysł / eksploracja
> Żywy dokument — dopisujemy pomysły do odpowiednich sekcji, a surowe notatki lądują w Backlogu na dole.
> Powiązane: [roadmap.md](roadmap.md) (fazy i kolejność prac) · [TODOS.md](TODOS.md) (otwarte decyzje)

---

## 1. Pitch (jedno zdanie)

Przeglądarkowy arena-slasher w stylu Brotato / Vampire Survivors, ale z walką **wręcz** zamiast auto-strzelania, z klasami postaci, itemami, krainami rosnącymi z poziomem i meta-progresją roguelite. Grasz od razu z linku, bez instalacji; docelowo także na mobile.

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

### 5.1 Walka (slasher)
- Walka wręcz z hordami mobków — to rdzeń gry.
- **Do rozstrzygnięcia:** atak aktywny (klik/przycisk), auto-atak jak w VS, czy hybryda (auto-atak + aktywne umiejętności)? Hybryda najlepiej znosi przejście na mobile (dotyk).

### 5.2 Mobki i fale
- Fale rosnącej trudności; różne typy mobków (szybkie/tanki/dystansowe/elitarne?).
- Cel wydajnościowy: setki mobków na ekranie przy 60 FPS (osiągalne w WebGL — patrz sekcja 7).

### 5.3 Itemki
- Przedmioty modyfikujące statystyki i styl gry.
- **Do rozstrzygnięcia:** rzadkości? sloty ekwipunku? synergie/zestawy? sklep między falami jak w Brotato?

### 5.4 Klasy postaci
- Różne klasy = różne buildy startowe i ograniczenia (jak postacie w Brotato).
- **Do rozstrzygnięcia:** ile na start (propozycja MVP: 2–3), sposób odblokowywania.

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

## 6. Platformy

- **Faza 1:** przeglądarka desktop (klawiatura/mysz).
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

1. **Motyw/temat gry** — "coś ciekawszego niż ziemniaki". **[TODO — decyzja odłożona 2026-07-19, wracamy]**
   Ustalone ramy (sesja office-hours 2026-07-19): klimat **absurd + neon/sci-fi**, humor **czysto wizualny**, teksty **EN**, motyw ma **wybaczać proste assety** (śmieszne > ładne).
   Kandydaci z burzy mózgów:
   - **A. „Glitch Slasher"** — bohater-placeholder (kwadrat z mieczem) w popsutej grze wideo; tniesz glitche i błędy; krainy = epoki gier (ASCII → 8-bit → synthwave-neon → "nowoczesna"); meta-progresja = gra naprawia samą siebie i dosłownie ładnieje po każdym runie. Art na starcie ~za darmo z definicji. *(rekomendacja Claude)*
   - **B. „Capy Blade"** — kapibara z energetyczną kataną broni onsenu przed korpo-robotami w neonowym mieście; humor = wieczna obojętność kapibary vs skala rzezi; największy potencjał memiczny, ale wymaga uroczego artu.
   - **C. „Roomba Rampage"** — zbuntowany robot-odkurzacz z doklejonymi ostrzami vs zbuntowane smart-AGD, piętro po piętrze megawieżowca; wirujące ostrza = naturalny atak orbitalny; najsłabszy "wow" na screenshocie.
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
