# Przeszkody aren WebSlashera (plan-grafik.md, Etap 2). Kolizja w symulacji to KOŁO (`world.obstacles`:
# x, y, r), więc przeszkody rysujemy prawie z góry: okrągły ślad o promieniu FOOT wokół środka (64, 64),
# z odrobiną boku od dołu. Gra skaluje sprite tak, żeby ślad = promień kolizji.
#
# Ta sama kreska co postacie: kontur INK, światło z lewej-góry, płaskie kolory, cień jako półprzezroczysta
# plama, brud z bakeArt. Neon (światła stacji, żar lawy) dokłada gra w punktach `data-glow`.
#
#   python tools/svg_gen/ws_world.py
import math

from common import *
import grit

FOOT = 52  # promień śladu w jednostkach SVG — musi się zgadzać z OBSTACLE_FOOT w src/render/artManifest.ts
C = 64

# stacja: stal, olej, neon stacji (kolor mapy 0x3d8bff)
ST = "#3a4048"
ST_D = "#262a30"
ST_L = "#5a626c"
ST_HI = "#7a848f"
CYAN = "#3d8bff"
CYAN_L = "#9cc6ff"
HAZ = "#c9a032"
CRATE = "#4a4a38"
CRATE_D = "#34342a"
CRATE_L = "#62624c"
# krater: bazalt, obsydian, lawa (kolor mapy 0xff6b1a)
BAS = "#3a322e"
BAS_D = "#241f1c"
BAS_L = "#524843"
OBS = "#1c1624"
OBS_M = "#2e2638"
OBS_L = "#5a4f70"
LAVA = "#ff6b1a"
LAVA_L = "#ffb04a"
LAVA_D = "#8a2e0a"


def shadow(dx=6, dy=10, rx=FOOT + 4, ry=FOOT * 0.8):
    return f'  <ellipse cx="{C + dx}" cy="{C + dy}" rx="{rx}" ry="{ry:.0f}" fill="#000" opacity="0.35"/>'


def obstacle(name, body, note, glow, grime=1.0):
    svg("obs_" + name, body, w=128, h=128, anchor=(C, C), grime=grime, note=note)
    if not glow:
        return
    path = os.path.join(OUT, "obs_" + name + ".svg")
    with open(path, encoding="utf-8") as f:
        text = f.read()
    attrs = "; ".join(f"{x} {y} {r}" for x, y, r in glow)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text.replace("<svg ", f'<svg data-glow="{attrs}" ', 1))


def poly(cx, cy, r, n, rot=0.0, jitter=0.0, seed=0):
    import random
    rnd = random.Random(seed)
    pts = []
    for i in range(n):
        a = rot + i * 2 * math.pi / n
        rr = r * (1 + (rnd.random() - 0.5) * jitter)
        pts.append(f"{cx + math.cos(a) * rr:.1f} {cy + math.sin(a) * rr:.1f}")
    return "M" + " L".join(pts) + " Z"


# ------------------------------------------------------------------ Derelict Station

def station_reactor():
    """Beczka reaktora widziana z góry: pierścień z pasem ostrzegawczym, właz z żarzącym się rdzeniem."""
    side = g(f'    <circle cx="{C}" cy="{C + 8}" r="{FOOT}" fill="{ST_D}"/>')
    top = g(f'    <circle cx="{C}" cy="{C}" r="{FOOT}" fill="{ST}"/>')
    band = "\n".join(
        f'  <path d="M{C + math.cos(a) * 44:.1f} {C + math.sin(a) * 44:.1f} A44 44 0 0 1 {C + math.cos(a + 0.35) * 44:.1f} {C + math.sin(a + 0.35) * 44:.1f}" '
        f'stroke="{HAZ if i % 2 == 0 else INK}" stroke-width="7" fill="none"/>'
        for i, a in enumerate([k * 0.35 for k in range(18)]))
    inner = g(f'''    <circle cx="{C}" cy="{C}" r="36" fill="{ST_L}"/>
    <circle cx="{C}" cy="{C}" r="18" fill="{ST_D}"/>''', sw=2.5) + f'''
  <circle cx="{C}" cy="{C}" r="10" fill="{CYAN}" stroke="{INK}" stroke-width="2"/>
  <circle cx="{C - 3}" cy="{C - 3}" r="3" fill="{CYAN_L}"/>
  <path d="M{C - 30} {C - 18} C{C - 20} {C - 32} {C + 4} {C - 36} {C + 18} {C - 30}" stroke="{ST_HI}" stroke-width="2" fill="none"/>'''
    vents = "\n".join(
        f'  <rect x="{C + math.cos(a) * 27 - 4:.1f}" y="{C + math.sin(a) * 27 - 2:.1f}" width="8" height="4" rx="1" fill="{INK}" '
        f'transform="rotate({math.degrees(a):.0f} {C + math.cos(a) * 27:.1f} {C + math.sin(a) * 27:.1f})"/>'
        for a in [k * math.pi / 3 + 0.5 for k in range(6)])
    marks = grit.scratches(C - 34, C - 20, 60, 44, n=7, seed=51)
    body = "\n".join([shadow(), side, top, band, g(f'    <circle cx="{C}" cy="{C}" r="{FOOT}" fill="none"/>'), inner, vents,
                      rivets([(C + math.cos(k * 0.785) * 48, C + math.sin(k * 0.785) * 48) for k in range(8)], r=1.8, col=ST_HI), marks])
    obstacle("station_reactor", body, "Stacja: beczka reaktora z pasem ostrzegawczym i żarzącym się rdzeniem.", glow=[(C, C, 12)])


def station_crates():
    """Stos skrzyń cargo: trzy skrzynie z góry, szablonowe oznaczenia, jedna lampka stacji."""
    def crate(x, y, w, h, rot, seed):
        cx, cy = x + w / 2, y + h / 2
        return (f'  <g transform="rotate({rot} {cx} {cy})">\n'
                + g(f'''    <rect x="{x}" y="{y + 6}" width="{w}" height="{h}" rx="3" fill="{CRATE_D}"/>
    <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="3" fill="{CRATE}"/>''', sw=2.5)
                + f'''
    <path d="M{x + 5} {y + 5} L{x + w - 5} {y + h - 5} M{x + w - 5} {y + 5} L{x + 5} {y + h - 5}" stroke="{CRATE_D}" stroke-width="3"/>
    <rect x="{x + 4}" y="{y + 4}" width="{w - 8}" height="{h - 8}" rx="2" fill="none" stroke="{CRATE_L}" stroke-width="1.5"/>
    <path d="M{x + 3} {y + 2} L{x + w - 3} {y + 2}" stroke="{CRATE_L}" stroke-width="1.5"/>
{grit.scratches(x + 4, y + 4, w - 8, h - 8, n=3, seed=seed, length=(2.0, 6.0))}
  </g>''')
    body = "\n".join([
        shadow(ry=FOOT * 0.75),
        crate(14, 22, 50, 46, -8, 61),
        crate(62, 30, 50, 46, 6, 62),
        crate(30, 64, 56, 44, -2, 63),
        f'  <rect x="44" y="80" width="20" height="5" fill="{HAZ}" stroke="{INK}" stroke-width="1"/>',
        f'  <circle cx="98" cy="38" r="3.5" fill="{CYAN}" stroke="{INK}" stroke-width="1.5"/>',
    ])
    obstacle("station_crates", body, "Stacja: stos skrzyń cargo z oznaczeniami i lampką.", glow=[(98, 38, 5)])


def station_wreck():
    """Wrak grodzi: poszarpana płyta kadłuba, odsłonięte rury i iskrzący kabel."""
    slab = g(f'''    <path d="{poly(C, C + 7, FOOT, 9, 0.2, 0.25, seed=71)}" fill="{ST_D}"/>
    <path d="{poly(C, C, FOOT, 9, 0.2, 0.25, seed=71)}" fill="{ST}"/>''')
    ribs = f'''  <path d="M{C - 36} {C - 10} L{C + 38} {C - 14} M{C - 30} {C + 14} L{C + 34} {C + 12}" stroke="{ST_D}" stroke-width="5"/>
  <path d="M{C - 36} {C - 12} L{C + 38} {C - 16} M{C - 30} {C + 12} L{C + 34} {C + 10}" stroke="{ST_L}" stroke-width="1.5"/>'''
    pipes = g(f'''    <path d="M{C - 20} {C - 40} C{C - 10} {C - 20} {C - 18} {C} {C - 4} {C + 18}" stroke-width="9" fill="none"/>
    <path d="M{C + 16} {C - 36} L{C + 22} {C + 2}" stroke-width="8" fill="none"/>''', sw=0) + f'''
  <path d="M{C - 20} {C - 40} C{C - 10} {C - 20} {C - 18} {C} {C - 4} {C + 18}" stroke="{ST_L}" stroke-width="5" fill="none"/>
  <path d="M{C + 16} {C - 36} L{C + 22} {C + 2}" stroke="#6a4a2e" stroke-width="4.5" fill="none"/>
  <path d="M{C - 4} {C + 18} l6 4 l-3 5 l7 3" stroke="{CYAN}" stroke-width="2" fill="none" stroke-linecap="round"/>'''
    marks = "\n".join([grit.scratches(C - 30, C - 30, 60, 50, n=8, seed=72), grit.patch(C + 8, C + 18, 16, 11, rot=10, fill=ST_L)])
    chips = grit.chipped("chip_obs_wreck", [(C + 50, C - 6, 6, 90), (C - 44, C + 28, 5, -60), (C + 18, C - 50, 5, 0)], 128, 128)
    body = chips + "\n" + grit.wrap_mask("\n".join([slab, ribs, pipes, marks]), "chip_obs_wreck")
    body = shadow() + "\n" + body
    obstacle("station_wreck", body, "Stacja: wrak grodzi z rurami i iskrzącym kablem.", glow=[(C + 3, C + 26, 5)])


# ------------------------------------------------------------------ Impact Crater

def crater_boulder():
    """Bazaltowy głaz: fasetowana bryła, jaśniejsze ściany od lewej-góry, pęknięcie z żarem."""
    rock = g(f'''    <path d="{poly(C, C + 8, FOOT, 8, 0.3, 0.2, seed=81)}" fill="{BAS_D}"/>
    <path d="{poly(C, C, FOOT, 8, 0.3, 0.2, seed=81)}" fill="{BAS}"/>''')
    facets = f'''  <path d="M{C - 38} {C - 22} L{C - 8} {C - 40} L{C + 6} {C - 12} L{C - 24} {C + 4} Z" fill="{BAS_L}" stroke="{INK}" stroke-width="1.5"/>
  <path d="M{C + 6} {C - 12} L{C + 36} {C - 26} L{C + 42} {C + 10} L{C + 12} {C + 18} Z" fill="{BAS}" stroke="{INK}" stroke-width="1.5"/>
  <path d="M{C - 24} {C + 4} L{C + 12} {C + 18} L{C + 2} {C + 42} L{C - 34} {C + 26} Z" fill="{BAS_D}" stroke="{INK}" stroke-width="1.5"/>'''
    crack = f'''  <path d="M{C - 30} {C + 12} L{C - 10} {C + 6} L{C + 4} {C + 20} L{C + 24} {C + 14}" stroke="{LAVA_D}" stroke-width="5" fill="none" stroke-linejoin="round"/>
  <path d="M{C - 30} {C + 12} L{C - 10} {C + 6} L{C + 4} {C + 20} L{C + 24} {C + 14}" stroke="{LAVA}" stroke-width="2.2" fill="none" stroke-linejoin="round"/>'''
    body = "\n".join([shadow(), rock, facets, crack, grit.scratches(C - 30, C - 36, 50, 30, n=5, seed=82, length=(2.0, 5.0))])
    obstacle("crater_boulder", body, "Krater: bazaltowy głaz z żarzącym się pęknięciem.", glow=[(C - 10, C + 8, 7), (C + 10, C + 18, 6)])


def crater_spire():
    """Iglice obsydianu: kępa ostrych kryształów na bazaltowej podstawie, szkliste odblaski."""
    base = g(f'''    <path d="{poly(C, C + 8, FOOT - 2, 10, 0.1, 0.25, seed=91)}" fill="{BAS_D}"/>
    <path d="{poly(C, C, FOOT - 2, 10, 0.1, 0.25, seed=91)}" fill="{BAS}"/>''')

    def shard(x, y, w, h, lean):
        return g(f'''    <path d="M{x - w} {y} L{x + lean} {y - h} L{x + w} {y} L{x + lean * 0.3} {y + w * 0.6} Z" fill="{OBS}"/>''', sw=2.2) + f'''
  <path d="M{x - w * 0.5} {y - 2} L{x + lean * 0.9} {y - h + 4}" stroke="{OBS_L}" stroke-width="1.6"/>
  <path d="M{x + lean} {y - h} L{x + w} {y} L{x + lean * 0.3} {y + w * 0.6} Z" fill="{OBS_M}" opacity="0.8"/>'''
    shards = "\n".join([
        shard(C - 22, C + 14, 10, 40, -8),
        shard(C + 20, C + 16, 11, 44, 6),
        shard(C - 2, C + 4, 13, 56, 2),
        shard(C + 8, C + 30, 8, 26, 10),
        shard(C - 28, C + 32, 7, 20, -6),
    ])
    body = "\n".join([shadow(), base, shards])
    obstacle("crater_spire", body, "Krater: iglice obsydianu na bazaltowej podstawie.", glow=[])


def crater_vent():
    """Komin lawowy: pierścień bazaltowych brył wokół jeziorka lawy — żar świeci, bryły blokują przejście."""
    ring = g(f'''    <circle cx="{C}" cy="{C + 8}" r="{FOOT}" fill="{BAS_D}"/>
    <circle cx="{C}" cy="{C}" r="{FOOT}" fill="{BAS}"/>''')
    pool = f'''  <path d="{poly(C, C + 2, 28, 12, 0.0, 0.25, seed=101)}" fill="{LAVA_D}" stroke="{INK}" stroke-width="2.5"/>
  <path d="{poly(C, C + 2, 22, 12, 0.0, 0.3, seed=102)}" fill="{LAVA}"/>
  <path d="{poly(C - 4, C - 2, 11, 9, 0.0, 0.35, seed=103)}" fill="{LAVA_L}"/>
  <circle cx="{C + 10}" cy="{C + 8}" r="3" fill="{LAVA_D}"/><circle cx="{C - 12}" cy="{C + 10}" r="2" fill="{LAVA_D}"/>'''
    lumps = "\n".join(
        g(f'    <path d="{poly(C + math.cos(a) * 40, C + math.sin(a) * 40, 11, 6, a, 0.3, seed=110 + i)}" fill="{BAS_L if math.sin(a) < 0 else BAS}"/>', sw=2)
        for i, a in enumerate([k * 2 * math.pi / 9 for k in range(9)]))
    body = "\n".join([shadow(), ring, lumps, pool])
    obstacle("crater_vent", body, "Krater: komin lawowy — pierścień bazaltu wokół jeziorka lawy.", glow=[(C, C + 2, 24)], grime=0.7)


if __name__ == "__main__":
    station_reactor(); station_crates(); station_wreck()
    crater_boulder(); crater_spire(); crater_vent()
    print("ws world ok")
