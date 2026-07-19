# TODOS — WebSlasher

## Do decyzji

- [x] ~~KIERUNEK GRY~~ — **ZDECYDOWANE 2026-07-19:** roguelike-slasher, ssaki vs najeźdźcy z kosmosu, neon sci-fi, co-op 1-8 znajomych (gdd.md sekcje 1, 5.2, 5.4)

## Do dorozwinięcia (motyw jest, szczegóły później)

- [ ] Nazwa gry (WebSlasher to robocza nazwa repo)
- [ ] Drzewka umiejętności dla 10 klas-ssaków
- [ ] Sci-fi bronie (bardzo sci-fi — kierunek potwierdzony, konkrety później)
- [ ] Grafiki (na razie celowo kolory zamiast sprite'ów)

## Dalej (po decyzji o motywie)

- [x] ~~Rozstrzygnąć model walki~~ — **HYBRYDA (D10, 2026-07-19):** auto-atak + aktywne skille na klawisze/kombinacje, dużo pasywów; v1 (Power Slash pod spacją) wdrożone
- [ ] Zaprojektować system kombinacji klawiszy dla skilli (składnia combo, buforowanie inputu, czytelność dla gracza; uwaga na lockstep — input rozszerzy się o przyciski skilli)
- [ ] Zatwierdzić zakres MVP (gdd.md sekcja 10)
- [ ] Init projektu: Phaser 3 + TypeScript (decyzja z 2026-07-19) — **z deterministycznym rdzeniem** (gdd.md sekcja 7, decyzja 2026-07-19)

## Decyzje co-op (przed Fazą 4.5, nie blokują startu)

- [x] ~~Ilu graczy maksymalnie?~~ — **1-8 graczy** (decyzja 2026-07-19)
- [ ] Drop-in w trakcie runu czy tylko wspólny start? (drop-in znacznie droższy w lockstepie)
- [ ] Tylko LAN/WebRTC prywatnie czy też gra przez internet? (internet = potrzebny malutki serwer sygnalizacyjny)
