# Warstwa brutalu (plan-grafik.md, Etap 0): znaki FIZYCZNE nakładane na części z TD bez ich edycji —
# blizny, łaty, rysy z kształtem i wyszczerbienia. Fakturę (plamy, błoto, ziarno, włos) robi dalej bakeArt;
# te dwa systemy się nie dublują.
#
# Zasady (grafika.md p. 2): tylko płaskie kształty, zero filtrów SVG, kontur INK, światło z lewej-góry.
# Żaden kolor tutaj nie może mieć postaci #RR00RR (to kolor drużyny).
#
# Wyszczerbienia (D5): `chipped()` zwraca <mask> — wycina PRAWDZIWĄ przezroczystość w sylwetce, więc przez
# ubytek widać tło. Maskę nakłada się na grupę części: `wrap_mask(body, mask_id)`.
#
#   python tools/svg_gen/grit.py   → art/preview/grit_bear_soldier.svg (podgląd na karcie: npm run bake-art -- --sheet)
import math
import os
import random

from common import INK

SCAR = "#c98a7a"      # zabliźniona skóra
SCAR_D = "#7a3a30"    # brzeg blizny
STITCH = "#2a1e14"    # szwy
SCRATCH_L = "#a3acb6"  # świeża rysa na metalu (odsłonięty metal)
SCRATCH_D = "#1f2226"  # cień rysy
PATCH = "#5a4a38"      # łata ze skóry
PATCH_L = "#6e5c46"


def scar(x, y, length, rot=0.0, width=2.6, stitches=3):
    """Blizna: jasny pas z ciemnym brzegiem i poprzecznymi szwami. (x, y) = środek, rot w stopniach."""
    a = math.radians(rot)
    dx, dy = math.cos(a) * length / 2, math.sin(a) * length / 2
    x0, y0, x1, y1 = x - dx, y - dy, x + dx, y + dy
    s = (f'  <path d="M{x0:.1f} {y0:.1f} L{x1:.1f} {y1:.1f}" stroke="{SCAR_D}" stroke-width="{width + 1.4:.1f}" stroke-linecap="round"/>\n'
         f'  <path d="M{x0:.1f} {y0:.1f} L{x1:.1f} {y1:.1f}" stroke="{SCAR}" stroke-width="{width:.1f}" stroke-linecap="round"/>')
    nx, ny = -math.sin(a) * 2.2, math.cos(a) * 2.2
    for i in range(stitches):
        t = (i + 1) / (stitches + 1)
        cx, cy = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        s += f'\n  <path d="M{cx - nx:.1f} {cy - ny:.1f} L{cx + nx:.1f} {cy + ny:.1f}" stroke="{STITCH}" stroke-width="1" stroke-linecap="round"/>'
    return s


def patch(x, y, w, h, rot=0.0, fill=PATCH):
    """Łata: skórzany prostokąt z konturem i przerywanym szwem dookoła."""
    cx, cy = x + w / 2, y + h / 2
    return (f'  <g transform="rotate({rot} {cx:.1f} {cy:.1f})">\n'
            f'    <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="1.5" fill="{fill}" stroke="{INK}" stroke-width="1.6"/>\n'
            f'    <path d="M{x + 1.5} {y + 1.5} L{x + w - 1.5} {y + 1.5}" stroke="{PATCH_L}" stroke-width="1"/>\n'
            f'    <rect x="{x + 2}" y="{y + 2}" width="{w - 4}" height="{h - 4}" rx="1" fill="none" stroke="{STITCH}" '
            f'stroke-width="0.9" stroke-dasharray="1.6 1.4"/>\n'
            f'  </g>')


def scratches(x, y, w, h, n=5, seed=1, length=(3.0, 8.0)):
    """Rysy na metalu: krótkie jasne kreski (odsłonięty metal) z ciemnym cieniem pod spodem. Deterministyczne."""
    rnd = random.Random(seed)
    out = []
    for _ in range(n):
        px, py = x + rnd.random() * w, y + rnd.random() * h
        ang = math.radians(rnd.uniform(-35, 35) + (180 if rnd.random() < 0.5 else 0))
        ln = rnd.uniform(*length)
        qx, qy = px + math.cos(ang) * ln, py + math.sin(ang) * ln
        out.append(f'  <path d="M{px:.1f} {py + 0.8:.1f} L{qx:.1f} {qy + 0.8:.1f}" stroke="{SCRATCH_D}" stroke-width="1.1" stroke-linecap="round" opacity="0.6"/>')
        out.append(f'  <path d="M{px:.1f} {py:.1f} L{qx:.1f} {qy:.1f}" stroke="{SCRATCH_L}" stroke-width="0.9" stroke-linecap="round"/>')
    return "\n".join(out)


def notch(x, y, size=5.0, rot=0.0, seed=0):
    """Kształt jednego odprysku: poszarpany trójkąt skierowany w głąb krawędzi. Zwraca atrybut `d`."""
    rnd = random.Random(seed)
    a = math.radians(rot)
    pts = []
    for i, (u, v) in enumerate([(-1.0, 0.0), (-0.35, 0.55), (0.0, 1.0), (0.4, 0.5), (1.0, 0.0), (0.0, -0.6)]):
        j = 1.0 + (rnd.random() - 0.5) * 0.35 if i not in (0, 4) else 1.0
        px, py = u * size * j, v * size * j
        pts.append((x + px * math.cos(a) - py * math.sin(a), y + px * math.sin(a) + py * math.cos(a)))
    return "M" + " L".join(f"{px:.1f} {py:.1f}" for px, py in pts) + " Z"


def chipped(mask_id, notches, w=128, h=144):
    """Maska wyszczerbień. `notches` = lista (x, y, size, rot): rot wskazuje, w którą stronę odprysk wchodzi w
    sylwetkę (0 = w dół). Zwraca `<defs>` do wstawienia PRZED ciałem.

    Maska tnie WSZYSTKIE warstwy pod sobą, więc odprysk stawiamy tylko na ZEWNĘTRZNEJ krawędzi sylwetki
    (ostrze, szpic hełmu, brzeg tarczy). W środku postaci wyciąłby dziurę na wylot — tam rysy i łaty."""
    holes = "\n".join(f'      <path d="{notch(x, y, s, r, seed=i)}" fill="#000"/>' for i, (x, y, s, r) in enumerate(notches))
    return (f'  <defs>\n    <mask id="{mask_id}" maskUnits="userSpaceOnUse" x="0" y="0" width="{w}" height="{h}">\n'
            f'      <rect x="0" y="0" width="{w}" height="{h}" fill="#fff"/>\n{holes}\n    </mask>\n  </defs>')


def wrap_mask(body, mask_id):
    """Nakłada maskę na grupę części (np. cały korpus albo tylko broń)."""
    return f'  <g mask="url(#{mask_id})">\n{body}\n  </g>'


# ------------------------------------------------------------------ podgląd

def preview_bear_soldier():
    """Szeregowy niedźwiedź z TD (bear.soldier) + brutal. Tylko podgląd na karcie — nie trafia do atlasu."""
    import bear as BR

    captured = {}
    BR.svg = lambda name, body, **kw: captured.update(name=name, body=body, kw=kw)
    BR.soldier()
    body = captured["body"]
    marks = "\n".join([
        scar(94, 51, 12, rot=75, width=2.2),          # przez policzek pod okiem (poniżej hełmu)
        scar(80, 124, 9, rot=-20, width=1.8, stitches=2),  # na przedniej nodze (futro, nie metal)
        patch(40, 56, 11, 8, rot=-12),                 # łata na futrze barków
        scratches(50, 80, 38, 26, n=6, seed=7),        # napierśnik
        scratches(104, 18, 14, 18, n=3, seed=3, length=(2.0, 5.0)),  # ostrze topora
    ])
    defs = chipped("chip_bear_soldier", [
        (119, 22, 4.5, -90),  # krawędź ostrza topora
        (116, 38, 3.5, -110),
        (75, 10, 3.0, 180),   # szpic hełmu
    ])
    full = defs + "\n" + wrap_mask(body + "\n" + marks, "chip_bear_soldier")
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "art", "preview")
    os.makedirs(out_dir, exist_ok=True)
    text = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 144" width="128" height="144" '
            'data-anchor="64 136" data-grime="0.8">\n'
            '  <!-- PODGLĄD warstwy brutalu: szeregowy niedźwiedź z TD + grit.py (blizny, łata, rysy, wyszczerbienia). -->\n'
            f'{full}\n</svg>\n')
    with open(os.path.join(out_dir, "grit_bear_soldier.svg"), "w", encoding="utf-8") as f:
        f.write(text)


if __name__ == "__main__":
    preview_bear_soldier()
    print("grit preview ok")
