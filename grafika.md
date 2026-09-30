# grafika.md — styl i pipeline grafiki WebSlashera

Instrukcja dla sesji, która robi grafikę do WebSlashera. Styl jest **wspólny ze światem gry TowerDefense**
(`C:\Projects\Private\TowerDefense`, Godot) — te same rasy, te same postacie, ta sama kreska. Tam grafika już
istnieje i działa, więc **nie wymyślaj stylu od nowa — przenieś go**. Poniżej wszystko, czego trzeba, żeby nie
przekopywać tamtego repo.

> Zasada nadrzędna: **ssak z WebSlashera ma być rozpoznawalnie tym samym zwierzakiem co w TowerDefense**
> (sylwetka, sierść, znak rasy, paleta). Różnić może się tylko skala, poza i ilość neonu.

---

## 1. Kierunek artystyczny (skrót)

- **Słodkie zwierzaki, brudny i brutalny świat.** Duże głowy, czytelne sylwetki — ale blizny, łaty, wyszczerbienia,
  błoto od dołu, rysy na metalu. Nie „czysty cartoon”, nie realizm.
- **Wektorowe sprite'y SVG + ruch z kodu.** Każdy sprite to jedna poza; chód, zamach, odrzut, lot, błysk trafienia,
  poświaty i pociski robi kod (w Phaserze: tweeny, skala, rotacja, tint, cząsteczki).
- **Rzut 3/4 z boku, postać patrzy w prawo** (w lewo = lustro `flipX`). To działa też w grze top-down (tak robi
  większość slasherów z widokiem z góry) — nie rysuj widoku z góry ani 8 kierunków.
- **Sci-fi i fantasy per postać, nie per rasa.** W TowerDefense każdy dowódca jest albo sci-fi, albo fantasy, a w każdej
  rasie są obie odmiany. W WebSlasherze klimat to **neon sci-fi** — domyślnie idź w sci-fi odmianę rasy, fantasy
  zostaw na specjalizacje/itemy, które ewidentnie są magiczne.
- **Neon = akcenty, nie cała postać.** Energia rasy (wizjery, dysze, runy, diody, broń) świeci; sierść i pancerz są
  matowe i brudne. Świecenie dodawaj w kodzie (poświata w teksturze jak dziś w `src/render/textures.ts`, blend ADD),
  a nie przez rozjaśnianie całego sprite'a.

## 2. Techniczne zasady rysowania (wspólne dla obu gier)

| Zasada | Wartość |
|---|---|
| Kontur | `#1a120c` (INK), grubość 3 (drobne detale 1–2), `stroke-linejoin/linecap="round"` |
| Światło | z **lewej-góry**: jaśniejsze krawędzie u góry/lewej (`*_L`), cień u dołu/prawej (`*_D`, `opacity 0.6`) |
| Kierunek | postać patrzy w **prawo**; pysk/broń po prawej |
| Płótno | `viewBox="0 0 128 144"` dla szeregowych, 160–176 dla dowódców/bossów; wyższe płótno dla uszu (zające: +16) |
| Stopy | punkt zaczepienia w atrybucie `data-anchor="x y"` (domyślnie `64 136`) — wszystkie postacie stoją na tej linii |
| Kolor drużyny | **tylko odcienie magenty `#RR00RR`** (`#ff00ff`, `#c800c8`, `#8c008c`) — pasy, proporce, szarfy, lampki klasy. Wypalanie robi z nich osobną szarą warstwę, którą gra barwi kolorem gracza/klasy (`setTint`). **Żaden inny kolor nie może mieć `G = 00` przy równych R i B**, bo zostanie potraktowany jak kolor drużyny (fiolety najeźdźców rób np. `#a040c0`). |
| Faktura/brud | **nie w SVG** (filtry SVG nie działają w rasteryzerach) — dokłada wypalanie (p. 5); SVG ma płaskie kolory + kilka półprzezroczystych plam cienia |
| Materiały | metal `#3b3f45 / #25282c / #6b7280 / #8b939e`, skóra `#4a3a2a / #5c4a36`, kość `#d8cdb4 / #a89c80`, tkanina `#6e2a22`, mosiądz `#b8893a` |

## 3. Rasy — paleta i znak rozpoznawczy

Id ras są wspólne (`src/sim/classes.ts` ↔ `scripts/races.gd` w TD). Znak rasy = to, po czym gracz rozpozna ją
z daleka na małym sprite'cie — **pilnuj go w każdej postaci**.

| Rasa | Sierść (`FUR / FUR_D / FUR_L`) | Energia / akcent | Materiały armii | Znak rasy |
|---|---|---|---|---|
| **mole** (krety) | `#6b5548 / #463830 / #8a7060`, ryjek `#d98f8f` | lampa `#ffc233`, bursztyn `#ffb020` | technika górnicza: wiertła, para, mosiądz | **żółty kask** `#d9a032` z lampą, wielkie jasne pazury `#efe6cf` |
| **gibbon** (gibony) | `#c9b08a / #8f7a5c`, czupryna `#d9c29c`, twarz `#2a221e` | **cyjan** `#5ff3ff` (soniczne) | ceramiczno-stalowy pancerz `#2f4a4f / #4f7278`, rezonatory | długie ręce, jasna obwódka twarzy `#f0e6d2` |
| **hyena** (hieny) | `#b8923a / #7d5f24 / #dcc07a`, cętki `#4a3520` | laser z odzysku `#ff5a36`; nekro `#7dff6a` | dark fantasy + złom: kości, trofea | cętki, garbaty kark, ciemny pysk `#3a2c20` |
| **boar** (dziki) | `#7a4a2e / #4a2a18`, grzywa `#2e1a10` | runy jak żar `#ff9a3c` | plemienne: żelazo `#4a4a4c`, skóry `#3a2e26`, drewno | **kły** `#efe6cf`, grzywa, malunki wojenne |
| **hare** (zające) | `#eeeae2 / #c4bcae / #ffffff`, ucho w środku `#e8a8a8` | wiatr `#8cdcff`, wizjer `#3fb8e8` | sci-fi „aero”: ceramika `#dfe6ea`, turbinki, dysze, gogle | **długie uszy**, biała sierść |
| **otter** (wydry) | `#7a5236 / #54361f`, pyszczek `#d9b48a` | turkus wody `#3fd0c0` | morskie fantasy: muszle `#e8cfae`, trójzęby, sieci, koral | jasny pyszczek, gruby ogon |
| **bear** (niedźwiedzie) | `#7a4f2c / #553519`, pysk `#c09a70` | runy grawitacji **fiolet** `#b070ff` | kute żelazo `#4a4e55`, futra `#8a7a64` | najmasywniejsza sylwetka, mała głowa z okrągłymi uszami |
| **wolf** (wilki) | `#8a929c / #5c636c / #c8ccd2`, pysk `#d8dce0`, oczy `#ffd24a` | błyskawice `#6ab4ff` | stal `#5a6470`, płaszcze `#3a4450` | długi pysk, spiczaste uszy, żółte oczy |
| **hedgehog** (jeże) | kolce `#4a3a2a / #7a6048`, pyszczek `#d8b890` | diody `#b8ff4a` | sci-fi pancerni: oliwkowe płyty `#6f7d45`, stalowe kolce | **kolce na plecach i czubku głowy**, spiczasty pyszczek |
| **fox** (lisy) | *jeszcze nie ma w TD* — ustal paletę tutaj (rudy `#ff7a29` z `classes.ts`), dopisz do tabeli i powiedz użytkownikowi, żeby przeniósł do TD | | | |
| **rat, bat** | w planie zastąpione kotami — **nie rysuj** | | | |

Gotowe rysunki głów, tułowi, nóg i ekwipunku każdej rasy są w generatorach TD (p. 4) — **kopiuj części, nie rysuj
od zera**. To najszybsza droga do spójności i oszczędność tokenów.

## 4. Skąd brać gotowe rzeczy (TowerDefense)

| Co | Gdzie |
|---|---|
| Generator SVG (Python, bez zależności) — wspólne stałe i helpery (`svg()`, `g()` = grupa z konturem, `tr()` = przesunięcie/skala/obrót/lustro, `rivets()`) | `C:\Projects\Private\TowerDefense\tools\svg_gen\common.py` |
| Części ras: `head()`, `TORSO`, `LEGS`, `TAIL`, `vest()`, bronie, pancerze | `tools\svg_gen\{mole,gibbon,hyena,boar,hare,otter,bear,wolf,hedgehog}.py` |
| Dowódcy (27 postaci — gotowe „bohaterskie” wersje ras, dobre na klasy/specjalizacje WebSlashera) | `tools\svg_gen\commanders.py`, `commanders_hare_otter.py`, `commanders_bwh.py`; wynik: `art\svg\cmd_*.svg` |
| Gotowe SVG (szeregowi: `<rasa>_soldier/archer/shield/brute/siege/flyer.svg`, dowódcy, budynki, dekoracje) | `C:\Projects\Private\TowerDefense\art\svg\` |
| Wypalanie brudu (referencja algorytmu) | `tools\bake_art.gd` |
| Mapowanie specjalizacji WebSlashera → dowódcy TD | `DECISIONS.md` w TD, wpisy **D31** (zające, wydry), **D32** (niedźwiedzie, wilki, jeże) |

Dowódcy TD to specjalizacje klas WebSlashera (np. Skoczek = SLIPSTREAM, Pani Przypływu = TIDECALLER, Grom = THUNDER
FANG, Sonik = SONIC) — **ich SVG to gotowy punkt startowy dla grafik klas i specjalizacji**, sci-fi/fantasy już
przypisane.

Zalecany start: skopiuj `tools/svg_gen/` do WebSlashera (np. `tools/svg_gen/`), zmień `OUT` w `common.py` na folder
źródeł WebSlashera i generuj stamtąd. Ręczne poprawki SVG przenoś do generatora, inaczej przepadną przy kolejnym
uruchomieniu.

## 5. Pipeline dla Phasera (propozycja)

W TD rasteryzuje i brudzi Godot (`bake_art.gd`). Tu odpowiednik w Node, uruchamiany ręcznie jak `npm run bench`:

1. **Źródła**: `art/svg/*.svg` (z generatora), atrybuty `data-anchor`, `data-scale` (rozdzielczość wypalenia),
   `data-grime` (siła brudu 0..1).
2. **Wypalanie** `tools/bakeArt.ts` (dev-dependency `@resvg/resvg-js` — szybki, bez przeglądarki):
   - rasteryzacja SVG w skali `data-scale`, **dwa przebiegi**: (a) sprite z magentą zamienioną na neutralną szarość
     o tej samej jasności, (b) **maska drużyny** — tylko piksele magenty jako skala szarości (jasność = `RR`),
   - **brud**: jak w `bake_art.gd` — plamy z szumu (fBm), błoto przyciemnione od dołu sylwetki, na metalu (niskie
     nasycenie) ziarno i rysy, na sierści (wysokie nasycenie) delikatny włos; tylko wewnątrz alfy sprite'a,
   - pakowanie wszystkiego do **jednego atlasu PNG + JSON** (format Phaser `atlas`, kotwica stóp jako `pivot`).
3. **W grze**: `this.load.atlas(...)`; postać = sprite z atlasu + drugi sprite z maski drużyny z `setTint(kolor klasy)`
   (albo jeden sprite, jeśli klasa nie potrzebuje barwienia). Jeden atlas = jedna tekstura = batching nawet przy
   ~400 wrogach (tak samo jak dziś z teksturami z poświatą).
4. **Neon**: poświatę dokładaj tak jak dziś (`textures.ts`: wypalona aureola, tint, blend ADD) — pod bronią, oczami,
   dyszami. Nie wypalaj poświaty w sprite postaci.

Zanim zbudujesz cały pipeline, zrób **próbkę 1 postaci** (np. zając SLIPSTREAM) w grze na prawdziwym tle i pokaż
użytkownikowi — tak zapadła decyzja stylu w TD (próbki technik obok siebie).

## 6. Najeźdźcy (nie ma ich w TD — do zaprojektowania tutaj)

Cztery typy z GDD: **Alien, Demon, Mage (alieni magowie), Robot**. Dziś czytelne po kształcie (trójkąt, romb,
sześciokąt, ośmiokąt) — **zachowaj te sylwetki jako bazę projektu**, żeby czytelność w hordzie nie spadła:

- **Alien** (trójkąt) — smukły, owadzi, pochylony do przodu, szpiczasta głowa.
- **Demon** (romb) — rogi i szerokie barki, sylwetka rozszerzona w środku.
- **Mage** (sześciokąt) — szata do ziemi, unosi się, kaptur/korona z kryształów.
- **Robot** (ośmiokąt) — kanciasty korpus, płyty, jedno oko-sensor.

Ten sam kontur `#1a120c`, światło z lewej-góry i brud (na robotach mocno). Najeźdźcy mają **wyraźnie inną paletę niż
ssaki**, żeby w hordzie odróżnić swoich od wrogów: zimne, obce barwy (trupia zieleń, siny fiolet — pamiętaj o zakazie
`#RR00RR`, stal chłodna), świecące oczy/rdzenie. Ssaki = ciepłe brązy, sierść, mosiądz; najeźdźcy = chłód, chityna,
obca technika. Bossy: większe płótno, więcej detalu, ta sama kreska.

## 7. Rozmiary i czytelność

- W TD szeregowy ma na ekranie ok. **27×30 px** (1 jednostka SVG ≈ 0,21 px świata), dowódca ok. 1,3× więcej. W
  WebSlasherze postać gracza może być większa (to slasher, patrzysz na nią cały czas) — wypal w wyższej
  rozdzielczości (`data-scale`), rysunek zostaje ten sam.
- Sprawdzaj sprite'y **w docelowym rozmiarze na ekranie**, nie w powiększeniu — detal mniejszy niż ~2 px znika.
  Znak rasy (uszy, kask, kolce, kły) musi przetrwać zmniejszenie.
- Na telefonie (cel WebSlashera też) liczy się liczba wywołań rysowania: jeden atlas, bez per-sprite shaderów.

## 8. Czego nie robić

- Portretów w stylu splash-artów LoL generowanych kodem — próbowane w TD, odrzucone przez użytkownika („kierunek zły”).
- Pixel artu i czystych wektorów z kolorów w kodzie jako głównej techniki — przegrały w porównaniu próbek (D30 w TD).
- Filtrów SVG (`feTurbulence`, `blur`) — rasteryzery ich nie obsługują; fakturę robi wypalanie.
- Nowego stylu dla ras, które już są w TD — kopiuj.
