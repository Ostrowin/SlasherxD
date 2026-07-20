# TODOS — WebSlasher

## Do decyzji

- [x] ~~KIERUNEK GRY~~ — **ZDECYDOWANE 2026-07-19:** roguelike-slasher, ssaki vs najeźdźcy z kosmosu, neon sci-fi, co-op 1-8 znajomych (gdd.md sekcje 1, 5.2, 5.4)

## Do dorozwinięcia (motyw jest, szczegóły później)

- [ ] Nazwa gry (WebSlasher to robocza nazwa repo)
- [ ] Drzewka umiejętności dla 10 klas-ssaków
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
