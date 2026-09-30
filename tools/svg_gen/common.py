# Generator źródeł SVG (art/svg). Sprite'y ras składa z tych samych części (głowa, nogi, tułów),
# więc postacie jednej rasy są spójne. Uruchomienie nadpisuje pliki w art/svg — ręczne poprawki SVG
# przenoś tutaj, inaczej zginą przy następnym generowaniu.
#
# Skopiowane z TowerDefense (tools/svg_gen) — części ras są wspólne dla obu gier (grafika.md).
# W WebSlasherze generujemy tylko postacie z ws_*.py:
#
#   python tools/svg_gen/ws_heroes.py
#   potem: npm run bake-art   (tools/bakeArt.ts → public/art/atlas.png + atlas.json)
#
# Pliki ras (bear.py, wolf.py, ...) i commanders*.py importujemy jako biblioteki części; uruchomione
# bezpośrednio też zapiszą do art/svg WebSlashera, nie do TD.
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "art", "svg")
INK = "#1a120c"
# kolor drużyny: odcienie magenty (#RR00RR) — bake robi z nich nakładkę
TEAM = "#ff00ff"
TEAM_M = "#c800c8"
TEAM_D = "#8c008c"
METAL = "#3b3f45"
METAL_D = "#25282c"
METAL_L = "#6b7280"
METAL_HI = "#8b939e"
LEATHER = "#4a3a2a"
LEATHER_L = "#5c4a36"
BONE = "#d8cdb4"
BONE_D = "#a89c80"
CLOTH = "#6e2a22"
BRASS = "#b8893a"


def svg(name, body, w=128, h=144, anchor=None, world=0.21, scale=None, grime=None, note=""):
    anchor = anchor or (w / 2, h - 8)
    attrs = f'data-anchor="{anchor[0]} {anchor[1]}" data-world="{world}"'
    if scale is not None:
        attrs += f' data-scale="{scale}"'
    if grime is not None:
        attrs += f' data-grime="{grime}"'
    text = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" {attrs}>\n'
            f'  <!-- {note} -->\n{body}\n</svg>\n')
    with open(os.path.join(OUT, name + ".svg"), "w", encoding="utf-8") as f:
        f.write(text)


def g(inner, sw=3, extra=""):
    """Grupa z konturem."""
    return f'  <g stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round"{extra}>\n{inner}\n  </g>'


def tr(inner, dx=0, dy=0, s=1.0, rot=0, cx=0, cy=0, flip=False):
    t = f"translate({dx} {dy})"
    if rot:
        t += f" rotate({rot} {cx} {cy})"
    if s != 1.0:
        t += f" scale({s})"
    if flip:
        t += " scale(-1 1)"
    return f'  <g transform="{t}">\n{inner}\n  </g>'


def rivets(pts, r=1.2, col=METAL_HI):
    return "\n".join(f'    <circle cx="{x}" cy="{y}" r="{r}" fill="{col}"/>' for x, y in pts)
