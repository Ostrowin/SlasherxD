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
- [ ] Kraina z klimatem (na razie neutralna siatka) + notka balansowa: magowie kumulują się w hordzie (trzymają dystans poza zasięgiem melee) — do balansu razem z modelem walki
- [ ] Walka wg wybranego modelu + "game feel": screen shake, knockback, hit-flash, dźwięki cięcia
- [ ] ~10 fal rosnącej trudności, przerwy między falami
- [ ] 5-8 itemów modyfikujących statystyki + wybór ulepszenia między falami
- [ ] Ekran śmierci z podsumowaniem runu, pauza
- [ ] Zapis w localStorage (ustawienia + postęp)

**Wyjście z fazy:** znajomy gra jeden pełny run i sam z siebie mówi "jeszcze raz".

---

## Faza 3 — Pętla roguelite

Cel: śmierć smakuje jak postęp. Szacunek: solo ~2 tyg / CC ~2-3 wieczory.

- [ ] Waluta meta zdobywana w runie
- [ ] 3-5 trwałych ulepszeń kupowanych między runami
- [ ] Druga klasa postaci (odblokowywana) — test, czy systemy są generyczne
- [ ] Balans: krzywa trudności vs krzywa mocy (arkusz z liczbami, nie "na oko")

**Wyjście z fazy:** po śmierci gracz od razu klika "next run", bo ma na co zbierać.

---

## Faza 4 — Treść i głębia

Cel: z prototypu robi się gra. Zakres elastyczny — dokładamy, póki bawi.

- [ ] Druga i trzecia kraina (nowe mobki, nowy klimat) — krainy wg poziomu z gdd.md 5.5
- [ ] Boss na końcu krainy (opcja z gdd.md — do decyzji)
- [ ] Więcej klas, itemów, synergii między itemami
- [ ] Muzyka + pełne audio (uwaga na quirki autoplay w przeglądarkach)
- [ ] Ekran startowy, ustawienia, credits

---

## Faza 4.5 — Co-op ze znajomymi *(odblokowana przez deterministyczny rdzeń z Fazy 1)*

Cel: 1-8 graczy w jednym runie (decyzja 2026-07-19). Szacunek: solo ~2-3 tyg / CC ~1 tydzień — pod warunkiem, że dyscyplina determinizmu z Fazy 1 była trzymana.

- [ ] Netcode lockstep: synchronizujemy tylko wejścia graczy, każdy klient liczy identyczną symulację
- [ ] Transport: WebRTC (bezpośrednio między przeglądarkami) — na LAN działa bez internetu, zgodnie z trybem prywatnym
- [ ] Obsługa rozłączeń i ponownego dołączenia (do decyzji: drop-in czy wspólny start — TODOS.md)
- [ ] Balans fal i ekonomii na 2+ graczy
- [ ] Checksum stanu symulacji między klientami (wykrywanie desyncu) — bez tego debugowanie lockstepu to koszmar

**Wyjście z fazy:** dwie przeglądarki, jeden run, zero rozjazdów symulacji przez 15 minut gry.

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
