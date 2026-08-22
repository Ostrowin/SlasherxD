# WebSlasher

Roguelike-slasher w przeglądarce: **ssaki kontra najeźdźcy z kosmosu**, neonowe sci-fi,
co-op 1–8 znajomych. Przetrwaj fale na arenie, rozbuduj postać w trakcie runu, padnij,
spróbuj znów. Nazwa robocza (patrz [TODOS.md](TODOS.md)).

> Status: prototyp. Gra się i testuje; grafika to na razie **kolory i kształty**, nie sprite'y
> (świadomie — treść przed oprawą). Zapisu postępu brak: cała progresja żyje i ginie z runem.

## Uruchomienie

```bash
npm install
npm run dev      # Vite dev server — otwiera grę w przeglądarce
```

Inne skrypty:

```bash
npm run build    # tsc --noEmit && vite build  (dist/ = zip gotowy na itch.io)
npm test         # regresje symulacji + determinizm
npm run bench    # bench balansu: bot gra pełne runy każdą klasą
npm run lint     # eslint (blokuje m.in. Math.random — strażnik determinizmu)
```

## Jak to działa (architektura)

Fundament pod co-op i powtarzalność to **twardy podział sim/render**:

- **`src/sim/`** — deterministyczny rdzeń symulacji. Zero Phasera, zero DOM, zero `Date.now()`,
  zero `localStorage`. Stały tick 30/s, seedowany RNG. Jedyne wejście danych to `SimInput`
  (jeden na gracza na tick). Ten sam seed + te same inputy = identyczny świat na każdym kliencie.
- **`src/render/`** (Phaser 3) — **tylko rysuje** stan symulacji i interpoluje między tickami.
  Nie podejmuje decyzji o świecie.
- **`src/net/`** — lockstep co-op: klienci wymieniają inputy, każdy liczy tę samą symulację.
- **`src/meta/`** — meta-progresja (zapis bonusów startowych).
- **`bench/`** — bot pomiarowy i testy (bez losowości po stronie bota, więc różnica między
  pomiarami to zawsze zmiana w grze, nie szum).

### Zasada, na której wszystko stoi: **prymitywy w kodzie, treść w danych**

Symulacja zna garść generycznych „czasowników" (`cone`, `summon`, `channel`, `hook`, `taunt`,
`wall`, `transform`…), a konkretne umiejętności, statusy, aury, bossy i talenty to **dane**
w plikach `config`. Dzięki temu nowa umiejętność = nowy wiersz danych, a talent może
PODMIENIĆ skill bez dotykania silnika. Gdzie co siedzi:

| Plik | Zawiera |
|---|---|
| `src/sim/skillsConfig.ts` | umiejętności (Q/W/E/R), doskoki (`DASHES`) |
| `src/sim/comboConfig.ts` | combo (sekwencje klawiszy) |
| `src/sim/statusConfig.ts` | statusy (trucizna, stun, fear…) i aury |
| `src/sim/minionsConfig.ts` | jednostki sojusznicze (turrety, roje, klony) |
| `src/sim/talentsConfig.ts` | drzewka talentów (12 klas × 3 gałęzie) |
| `src/sim/classes.ts` · `enemies.ts` · `bosses/` | klasy gracza, wrogowie, bossy |
| `src/sim/itemsConfig.ts` · `wavesConfig.ts` | itemy/ulepszenia, struktura fal |

## Dokumenty

- **[gdd.md](gdd.md)** — pełny dokument projektowy (motyw, mechaniki, decyzje).
- **[roadmap.md](roadmap.md)** — roadmapa fazami.
- **[Classes.md](Classes.md)** — burza mózgów nazw klas i specjalizacji.
- **[TODOS.md](TODOS.md)** — backlog: decyzje, utrudnienia, nowe prymitywy i specjalizacje.
