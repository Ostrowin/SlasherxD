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
