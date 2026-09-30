# Postacie graczy WebSlashera. Bazą są szeregowi i dowódcy TD (bear.py, commanders_bwh.py) — ta sama rasa,
# ta sama kreska (grafika.md p. 4). Różnice względem TD:
#   - poświaty NIE ma w SVG — gra dokłada ją sama (blend ADD) w punktach `data-glow="x y r; ..."`
#     (jednostki SVG), które bakeArt przepisuje do atlasu,
#   - warstwa brutalu z grit.py (blizny, łaty, rysy, wyszczerbienia) — ton „mroczniej w rysunku” (plan, D5).
#
#   python tools/svg_gen/ws_heroes.py
#
# Skalę wypalenia ustala atlas w src/render/artManifest.ts (postacie: 0.75), nie SVG — dlatego bez data-scale.
# Każdy nowy plik trzeba też dopisać do SPRITES/HEROES/SUMMONS w manifeście, inaczej bakeArt go odrzuci.
import math

from common import *
import bear as BR
import commanders_bwh as CB
import grit


def _write(name, body, w, h, anchor, grime, note, glow):
    """svg() z common.py jest wspólne z TD — data-glow dopisujemy do korzenia po fakcie."""
    svg(name, body, w=w, h=h, anchor=anchor, grime=grime, note=note)
    if not glow:
        return
    path = os.path.join(OUT, name + ".svg")
    with open(path, encoding="utf-8") as f:
        text = f.read()
    attrs = "; ".join(f"{x} {y} {r}" for x, y, r in glow)
    text = text.replace("<svg ", f'<svg data-glow="{attrs}" ', 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def hero(name, body, note, glow, marks="", chips=(), grime=0.8):
    """Postać gracza: płótno 128×144, stopy w (64, 136). `marks` = znaki z grit.py rysowane na wierzchu,
    `chips` = odpryski (x, y, size, rot) tylko na ZEWNĘTRZNEJ krawędzi sylwetki (maska tnie na wylot)."""
    full = body + ("\n" + marks if marks else "")
    if chips:
        mid = f"chip_{name}"
        full = grit.chipped(mid, chips) + "\n" + grit.wrap_mask(full, mid)
    _write("hero_" + name, full, 128, 144, (64, 136), grime, note, glow)


def summon(name, body, note, glow, w=96, h=96, anchor=(48, 80), marks="", chips=(), grime=0.7):
    """Przywołaniec/pole: własne płótno, kotwica = punkt, w którym sim trzyma jednostkę (środek pola)."""
    full = body + ("\n" + marks if marks else "")
    if chips:
        mid = f"chip_{name}"
        full = grit.chipped(mid, chips, w, h) + "\n" + grit.wrap_mask(full, mid)
    _write("sum_" + name, full, w, h, anchor, grime, note, glow)


def _captured(module, fn):
    """Ciało postaci z generatora TD bez zapisu pliku: podmieniamy `svg` w module na czas wywołania."""
    got = {}
    old = module.svg
    module.svg = lambda name, body, **kw: got.update(body=body)
    try:
        fn()
    finally:
        module.svg = old
    return got["body"]


# ------------------------------------------------------------------ niedźwiedzie

def bear_soldier():
    """Szeregowy (przed wyborem specjalizacji): bear.soldier() z TD + brutal. Runa na toporze, hełmie i napierśniku."""
    body = _captured(BR, BR.soldier)
    marks = "\n".join([
        grit.scar(94, 51, 12, rot=75, width=2.2),                    # policzek pod okiem
        grit.scar(80, 124, 9, rot=-20, width=1.8, stitches=2),       # przednia noga
        grit.patch(40, 56, 11, 8, rot=-12),                          # futro na barkach
        grit.scratches(50, 80, 38, 26, n=6, seed=7),                 # napierśnik
        grit.scratches(104, 18, 14, 18, n=3, seed=3, length=(2.0, 5.0)),  # ostrze topora
    ])
    chips = [(119, 22, 4.5, -90), (116, 38, 3.5, -110), (75, 10, 3.0, 180)]
    hero("bear_soldier", body, "Szeregowy niedźwiedź: topór z runą, kuty napierśnik, futro na barkach (TD bear_soldier + brutal).",
         glow=[(111, 32, 4), (90, 31, 4), (68, 104, 5)], marks=marks, chips=chips)


def bear_gravity():
    """Grawitant z commanders_bwh.gravity(), bez wypalonej aureoli wokół kul, z brutalem."""
    def orb(cx, cy, r):
        return f'''  <circle cx="{cx}" cy="{cy}" r="{r}" fill="#2a1a40" stroke="{INK}" stroke-width="2"/>
  <circle cx="{cx}" cy="{cy}" r="{r * 0.5}" fill="{BR.RUNE}"/>
  <ellipse cx="{cx}" cy="{cy}" rx="{r + 8}" ry="{r * 0.4}" fill="none" stroke="{BR.RUNE_C}" stroke-width="1.2" opacity="0.8"/>'''
    far = g(f'    <path d="M50 74 C40 70 30 66 22 64 L20 74 C30 76 40 80 46 86 Z" fill="{BR.FUR_D}"/>') + g(
        f'    <rect x="12" y="62" width="16" height="16" rx="4" fill="{METAL}"/>', sw=2.2) + orb(18, 52, 7)
    near = g(f'''    <path d="M82 66 C96 68 106 74 110 82 L102 90 C98 84 90 80 78 78 Z" fill="{BR.FUR}"/>
    <rect x="100" y="78" width="18" height="16" rx="4" fill="{METAL}"/>''', sw=2.5) + orb(112, 62, 9)
    collar = g(f'''    <path d="M42 70 C54 60 84 60 96 70 L92 78 C80 70 58 70 46 78 Z" fill="{METAL}"/>''') + f'''
  <circle cx="58" cy="70" r="2" fill="{BR.RUNE}"/><circle cx="70" cy="68" r="2" fill="{BR.RUNE}"/><circle cx="82" cy="70" r="2" fill="{BR.RUNE}"/>'''
    coat = g(f'''    <path d="M44 76 C54 70 84 70 94 76 C98 94 94 112 84 118 L56 118 C44 112 40 94 44 76 Z" fill="#2c2a38"/>''') + f'''
  <path d="M64 76 L74 76 L74 118 L64 118 Z" fill="{TEAM_M}"/>
  <path d="M50 96 C58 100 64 100 70 96" stroke="{BR.RUNE}" stroke-width="2" fill="none"/>'''
    visor = f'''
  <path d="M80 38 C88 34 98 36 100 42 C98 48 90 50 84 49 C80 48 78 44 80 38 Z" fill="{BR.RUNE}" stroke="{INK}" stroke-width="2"/>'''
    body = "\n".join([far, BR.LEGS, BR.TORSO, coat, collar, near, BR.head(helm=False, extra=visor)])
    marks = "\n".join([
        grit.scar(62, 44, 10, rot=65, width=2.0),                    # czoło, między uchem a wizjerem
        grit.patch(78, 102, 10, 8, rot=8, fill="#3a3648"),           # łata na płaszczu badacza
        grit.scratches(48, 64, 42, 8, n=4, seed=21, length=(2.0, 5.0)),  # kołnierz
        grit.scratches(101, 80, 16, 12, n=3, seed=22, length=(2.0, 4.0)),  # rękawica
    ])
    chips = [(12, 70, 3.5, -90), (118, 88, 3.5, 90)]
    hero("bear_gravity", body,
         "Grawitant (sci-fi): rękawice grawitacyjne z kulami osobliwości, płaszcz badacza, fioletowy wizjer.",
         glow=[(18, 52, 7), (112, 62, 9), (90, 42, 6)], marks=marks, chips=chips)


def bear_rampage():
    """Szał (fantasy): berserker z commanders_bwh.rampage() + brutal. Bez neonu — matowa, krwawa furia."""
    body = _captured(CB, CB.rampage)
    marks = "\n".join([
        grit.scar(92, 86, 9, rot=60, width=1.8, stitches=2),         # przedramię
        grit.patch(52, 60, 10, 7, rot=-8),                           # łata na skórze na barkach
        grit.scratches(104, 16, 16, 28, n=4, seed=31, length=(2.0, 5.0)),  # ostrze topora
    ])
    chips = [(125, 28, 4.0, 90), (121, 44, 3.5, 100)]
    hero("bear_rampage", body, "Szał (fantasy): berserker w skórze, czerwone malunki wojenne, zakrwawiony topór, blizny.",
         glow=[], marks=marks, chips=chips)


def bear_colossus():
    """Kolos (sci-fi, gałąź HIBERNATION): egzoszkielet z commanders_bwh.colossus() + brutal. Neon: rdzeń grawitacji."""
    body = _captured(CB, CB.colossus)
    marks = "\n".join([
        grit.patch(76, 58, 12, 9, rot=6, fill=BR.IRON_L),            # przyspawana łata pancerza
        grit.scratches(34, 56, 70, 26, n=8, seed=11),                # rama
        grit.scratches(6, 76, 20, 26, n=3, seed=12, length=(2.0, 5.0)),   # lewa pięść
        grit.scratches(106, 76, 20, 26, n=3, seed=13, length=(2.0, 5.0)),  # prawa pięść
    ])
    chips = [(4, 88, 3.5, -90), (127, 94, 3.5, 90), (108, 112, 3.5, 135)]
    hero("bear_colossus", body, "Kolos (sci-fi): niedźwiedź w ciężkim egzoszkielecie pod szklaną kopułą, pięści-tłoki, rdzeń grawitacji.",
         glow=[(68, 106, 6)], marks=marks, chips=chips)


# ------------------------------------------------------------------ przywołańce niedźwiedzi (Grawitant)

def gravity_well():
    """STUDNIA GRAWITACJI (gravity-field + warianty): kotwiczny pylon z kulą osobliwości. Znak „swój” = fiolet rasy."""
    plate = g(f'''    <path d="M20 80 L32 69 L64 69 L76 80 L64 90 L32 90 Z" fill="{BR.IRON}"/>
    <path d="M24 80 L20 92 M72 80 L78 92 M48 90 L48 95" stroke-width="3"/>''', sw=2.5) + f'''
  <path d="M33 71 L63 71" stroke="{BR.IRON_L}" stroke-width="1.5"/>
  <circle cx="30" cy="80" r="1.8" fill="{BR.RUNE}"/><circle cx="66" cy="80" r="1.8" fill="{BR.RUNE}"/><circle cx="48" cy="86" r="1.8" fill="{BR.RUNE}"/>'''
    column = g(f'''    <path d="M42 70 L44 44 L52 44 L54 70 Z" fill="{BR.IRON_D}"/>
    <path d="M36 46 C40 40 56 40 60 46 L56 50 C52 46 44 46 40 50 Z" fill="{BR.IRON}"/>''', sw=2.2) + f'''
  <path d="M48 50 L48 66" stroke="{BR.RUNE}" stroke-width="1.8"/>'''
    orb = f'''  <circle cx="48" cy="30" r="11" fill="#2a1a40" stroke="{INK}" stroke-width="2.2"/>
  <circle cx="48" cy="30" r="5.5" fill="{BR.RUNE}"/>
  <circle cx="45" cy="27" r="1.6" fill="{BR.RUNE_C}"/>
  <ellipse cx="48" cy="30" rx="20" ry="5" fill="none" stroke="{BR.RUNE_C}" stroke-width="1.2" opacity="0.8"/>'''
    marks = grit.scratches(30, 72, 36, 14, n=4, seed=41, length=(2.0, 5.0))
    summon("gravity_well", "\n".join([plate, column, orb]), "Studnia grawitacji: kuty pylon na trzech szponach, kula osobliwości.",
           glow=[(48, 30, 11)], marks=marks, chips=[(20, 80, 3.0, -90)])


def gravity_collapse():
    """ZAPAŚĆ (gravity-collapse): żelazna klatka z pękającym rdzeniem — za chwilę się zapadnie."""
    spikes = g("\n".join(
        f'    <path d="M{48 + 26 * math.cos(a):.1f} {48 + 26 * math.sin(a):.1f} L{48 + 34 * math.cos(a + 0.12):.1f} {48 + 34 * math.sin(a + 0.12):.1f} '
        f'L{48 + 26 * math.cos(a + 0.24):.1f} {48 + 26 * math.sin(a + 0.24):.1f} Z" fill="{BR.IRON_L}"/>'
        for a in [i * math.pi / 3 + 0.3 for i in range(6)]), sw=2)
    core = f'''  <circle cx="48" cy="48" r="24" fill="#2a1a40" stroke="{INK}" stroke-width="3"/>
  <path d="M34 36 L44 46 L40 54 L50 62 M58 30 L54 42 L62 50 M30 56 L40 58" stroke="{BR.RUNE}" stroke-width="2.4" fill="none" stroke-linejoin="round"/>
  <circle cx="48" cy="48" r="7" fill="{BR.RUNE}"/><circle cx="46" cy="46" r="2.2" fill="{BR.RUNE_C}"/>'''
    bands = g(f'''    <path d="M24 48 C24 34 72 34 72 48" fill="none" stroke="{BR.IRON}" stroke-width="5"/>
    <path d="M48 24 C62 24 62 72 48 72" fill="none" stroke="{BR.IRON}" stroke-width="5"/>''', sw=0) + f'''
  <path d="M24 48 C24 34 72 34 72 48 M48 24 C62 24 62 72 48 72" fill="none" stroke="{INK}" stroke-width="1.2"/>'''
    summon("gravity_collapse", "\n".join([spikes, core, bands]), "Zapaść: żelazna klatka z pękającym rdzeniem grawitacji.",
           glow=[(48, 48, 12)], anchor=(48, 48))


if __name__ == "__main__":
    bear_soldier(); bear_gravity(); bear_rampage(); bear_colossus()
    gravity_well(); gravity_collapse()
    print("ws heroes ok")
