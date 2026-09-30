# Postacie graczy WebSlashera. Bazą są dowódcy TD (commanders*.py) — ta sama rasa, ta sama kreska
# (grafika.md p. 4). Różnica: poświaty NIE ma w SVG — gra dokłada ją sama (blend ADD) w punktach
# z atrybutu `data-glow="x y r; ..."` (jednostki SVG), który bakeArt przepisuje do atlas.json.
#
#   python tools/svg_gen/ws_heroes.py
from common import *
import bear as BR

# Postać gracza jest większa niż dowódca TD (patrzysz na nią cały czas) — wypalamy gęściej.
HERO_SCALE = 1.0


def hero(name, body, note, glow, grime=0.8):
    body_attrs = "; ".join(f"{x} {y} {r}" for x, y, r in glow)
    svg("hero_" + name, body, anchor=(64, 136), scale=HERO_SCALE, grime=grime, note=note)
    # data-glow dopisujemy do korzenia po fakcie — svg() z common.py jest wspólne z TD
    path = os.path.join(OUT, "hero_" + name + ".svg")
    with open(path, encoding="utf-8") as f:
        text = f.read()
    text = text.replace("<svg ", f'<svg data-glow="{body_attrs}" ', 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)


def gravity_mage():
    """Grawitant z commanders_bwh.gravity(), bez wypalonej aureoli wokół kul."""
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
    hero("bear_gravity", body,
         "Grawitant (sci-fi): rękawice grawitacyjne z kulami osobliwości, płaszcz badacza, fioletowy wizjer.",
         glow=[(18, 52, 7), (112, 62, 9), (90, 42, 6)])


if __name__ == "__main__":
    gravity_mage()
    print("ws heroes ok")
