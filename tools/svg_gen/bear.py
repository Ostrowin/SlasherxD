# Niedźwiedzie: ciężka piechota — kute żelazo, futra, fioletowe runy grawitacji. Najmasywniejsza sylwetka
# ze wszystkich ras (szerokie barki, mała głowa z okrągłymi uszami).
from common import *

FUR = "#7a4f2c"
FUR_D = "#553519"
FUR_L = "#9a6a40"
MUZZLE = "#c09a70"
NOSE = "#1e1410"
IRON = "#4a4e55"
IRON_D = "#2c2f34"
IRON_L = "#767d86"
RUNE = "#b070ff"
RUNE_C = "#eadcff"
PELT = "#8a7a64"


def head(helm=True, extra=""):
    s = g(f'''    <circle cx="56" cy="30" r="8" fill="{FUR_D}"/>
    <circle cx="82" cy="26" r="8" fill="{FUR}"/>
    <path d="M46 50 C46 34 60 26 76 26 C92 26 102 36 102 50 C102 62 90 70 74 70 C58 70 46 62 46 50 Z" fill="{FUR}"/>
    <path d="M90 46 C100 44 110 48 112 54 C113 62 104 66 96 65 C90 64 86 58 88 52 Z" fill="{MUZZLE}"/>''')
    s += f'''
  <circle cx="82" cy="26" r="3.5" fill="#c08a70"/>
  <path d="M106 50 C110 49 113 51 112 54 C110 56 106 55 105 52 Z" fill="{NOSE}"/>
  <path d="M100 59 C104 62 108 62 111 59" fill="none" stroke="{NOSE}" stroke-width="1.4"/>
  <circle cx="88" cy="44" r="2.6" fill="{NOSE}"/><circle cx="88.8" cy="43.2" r="0.9" fill="#ffffff"/>
  <path d="M82 38 C86 36 92 37 94 40" stroke="{FUR_D}" stroke-width="2.4" fill="none"/>
  <path d="M48 54 C52 64 62 70 74 70 C64 66 56 60 52 50 Z" fill="{FUR_D}" opacity="0.7"/>
  <path d="M60 32 C66 29 76 28 84 30" fill="none" stroke="{FUR_L}" stroke-width="2"/>'''
    if helm:
        s += g(f'''    <path d="M48 42 C48 28 62 22 76 22 C90 22 100 30 101 40 C84 35 64 35 48 42 Z" fill="{IRON}"/>
    <path d="M70 22 L72 8 L78 22 Z" fill="{IRON_L}"/>''', sw=2.5) + f'''
  <path d="M60 26 L60 38 M72 24 L72 36" stroke="{IRON_D}" stroke-width="1.5"/>
  <path d="M84 26 L96 36" stroke="{RUNE}" stroke-width="2"/>'''
    return s + extra


LEGS = g(f'''    <path d="M44 108 L38 126 L36 136 L60 136 L60 122 L62 110 Z" fill="{FUR_D}"/>
    <path d="M70 110 L68 126 L66 136 L94 136 L90 122 L88 110 Z" fill="{FUR}"/>''') + f'''
  <path d="M36 136 L60 136 M66 136 L94 136" stroke="{INK}" stroke-width="3"/>
  <path d="M40 133 L41 136 M46 133 L46 136 M72 133 L73 136 M80 133 L80 136" stroke="#e8dcc0" stroke-width="1.5"/>'''
TORSO = g(f'    <path d="M34 92 C32 70 48 58 68 58 C88 58 100 70 100 92 C100 110 88 120 68 120 C48 120 34 110 34 92 Z" fill="{FUR}"/>') + f'''
  <path d="M36 96 C40 110 52 120 68 120 C54 114 44 104 42 88 Z" fill="{FUR_D}" opacity="0.6"/>'''


def plate(y0=74):
    s = g(f'''    <path d="M44 {y0} C56 {y0-8} 82 {y0-8} 94 {y0} C98 {y0+16} 94 {y0+34} 82 {y0+40} L58 {y0+40} C46 {y0+34} 40 {y0+16} 44 {y0} Z" fill="{IRON}"/>''')
    s += f'''
  <path d="M44 {y0+10} L95 {y0+10} L94 {y0+20} L44 {y0+20} Z" fill="{TEAM_M}"/>
  <path d="M44 {y0+10} L95 {y0+10}" stroke="{TEAM}" stroke-width="1.2"/>
  <path d="M60 {y0+28} L68 {y0+34} L76 {y0+28}" stroke="{RUNE}" stroke-width="2" fill="none"/>
  <path d="M48 {y0-2} C60 {y0-8} 80 {y0-8} 90 {y0-2}" stroke="{IRON_L}" stroke-width="1.5" fill="none"/>
''' + rivets([(50, y0 + 26), (88, y0 + 26), (56, y0 + 36), (82, y0 + 36)])
    return s


def pelt():
    return g(f'''    <path d="M36 66 C44 54 70 52 84 58 L80 66 C66 62 48 64 40 74 Z" fill="{PELT}"/>''', sw=2.5) + f'''
  <path d="M42 64 L40 70 M50 60 L49 66 M60 58 L60 64 M70 58 L71 64" stroke="#5a4a38" stroke-width="1.5"/>'''


def paw(cx, cy, r=7):
    return g(f'    <circle cx="{cx}" cy="{cy}" r="{r}" fill="{FUR_D}"/>', sw=2.2)


def soldier():
    axe = g(f'''    <path d="M88 104 L110 36" stroke-width="7"/>
    <path d="M102 34 C96 24 104 14 116 14 C122 22 122 36 114 44 Z" fill="{IRON}"/>''') + f'''
  <path d="M88 104 L110 36" stroke="#6a4a2e" stroke-width="3.5"/>
  <path d="M106 22 C110 20 116 20 118 24" stroke="{IRON_L}" stroke-width="1.5" fill="none"/>
  <path d="M108 30 L114 34" stroke="{RUNE}" stroke-width="2"/>'''
    far = g(f'    <path d="M50 76 C40 84 42 96 50 98 L58 94 C52 90 54 84 56 80 Z" fill="{FUR_D}"/>')
    near = g(f'    <path d="M82 68 C96 72 100 84 96 96 L86 98 C88 88 84 82 78 80 Z" fill="{FUR}"/>')
    body = "\n".join([far, LEGS, TORSO, plate(), pelt(), near, axe, paw(92, 100), head()])
    svg("bear_soldier", body, world=0.23, note="Niedźwiedź-piechur: topór z runą, kuty napierśnik, futro na barkach.")


def archer():
    xbow = g(f'''    <rect x="62" y="80" width="54" height="10" rx="2" fill="#6a4a2e"/>
    <path d="M110 64 C120 72 120 98 110 106" fill="none" stroke-width="5"/>''', sw=2.5) + f'''
  <path d="M110 64 C120 72 120 98 110 106" fill="none" stroke="{IRON_L}" stroke-width="2.5"/>
  <path d="M110 64 L80 85 L110 106" stroke="#e8dcc0" stroke-width="1.2" fill="none"/>
  <path d="M86 85 L126 85" stroke="{INK}" stroke-width="3"/><path d="M120 81 L128 85 L120 89 Z" fill="{RUNE}" stroke="{INK}" stroke-width="1"/>'''
    quiver = g(f'    <rect x="28" y="62" width="14" height="30" rx="3" fill="{PELT}"/>', sw=2) + f'''
  <path d="M31 62 L29 52 M36 61 L36 51 M40 62 L42 52" stroke="{IRON_L}" stroke-width="2"/>'''
    far = g(f'    <path d="M52 76 C46 84 56 90 66 88 L68 84 C62 84 60 82 60 80 Z" fill="{FUR_D}"/>')
    near = g(f'    <path d="M82 68 C94 70 100 78 100 86 L92 90 C88 84 84 80 78 80 Z" fill="{FUR}"/>')
    body = "\n".join([quiver, far, LEGS, TORSO, plate(), near, xbow, paw(96, 88, 6), head()])
    svg("bear_archer", body, world=0.23, note="Niedźwiedź-kusznik: ciężka kusza z bełtami-runami, kołczan z futra.")


def shield():
    tower = g(f'''    <path d="M70 58 L118 56 L120 130 L72 134 Z" fill="{IRON}"/>
    <path d="M76 64 L112 62 L114 124 L78 128 Z" fill="{IRON_D}" stroke-width="1.5"/>''') + f'''
  <path d="M70 84 L119 82 L119 94 L70 96 Z" fill="{TEAM_M}"/>
  <path d="M70 84 L119 82" stroke="{TEAM}" stroke-width="1.2"/>
  <circle cx="95" cy="110" r="9" fill="none" stroke="{RUNE}" stroke-width="2.5"/>
  <path d="M95 102 L95 118 M87 110 L103 110" stroke="{RUNE}" stroke-width="1.5"/>
''' + rivets([(74, 62), (116, 60), (116, 128), (76, 130)], r=1.6)
    helm = g(f'''    <path d="M48 44 C48 26 62 18 76 18 C92 18 102 28 103 44 L96 46 C90 36 62 36 54 46 Z" fill="{IRON}"/>''', sw=2.5)
    body = "\n".join([LEGS, TORSO, plate(), pelt(), head(helm=False, extra=helm), tower, paw(118, 90)])
    svg("bear_shield", body, world=0.25, note="Niedźwiedź-tarczownik: ściana z kutego żelaza z runą, pełny hełm.")


def brute():
    legs = g(f'''    <path d="M30 100 L24 124 L22 136 L52 136 L52 120 L56 104 Z" fill="{FUR_D}"/>
    <path d="M66 104 L64 124 L62 136 L96 136 L92 122 L88 104 Z" fill="{FUR}"/>''') + f'''
  <path d="M22 136 L52 136 M62 136 L96 136" stroke="{INK}" stroke-width="3"/>'''
    torso = g(f'''    <path d="M16 86 C12 60 34 40 64 38 C94 36 114 56 112 84 C110 106 94 120 66 120 C38 120 20 108 16 86 Z" fill="{FUR}"/>''') + f'''
  <path d="M20 90 C26 108 44 120 66 120 C46 112 32 100 28 84 Z" fill="{FUR_D}" opacity="0.7"/>
  <path d="M30 70 L100 66 L102 80 L32 84 Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2"/>
  <path d="M30 71.5 L100 67.5" stroke="{TEAM}" stroke-width="1.5"/>
  <path d="M30 52 C44 40 80 38 100 50 L94 58 C78 50 48 50 36 60 Z" fill="{IRON}" stroke="{INK}" stroke-width="2.5"/>
  <path d="M54 94 L64 102 L74 94 L64 86 Z" fill="none" stroke="{RUNE}" stroke-width="2.5"/>'''
    hammer = g(f'''    <path d="M100 60 L110 128" stroke-width="8"/>
    <rect x="92" y="112" width="36" height="26" rx="4" fill="{IRON}"/>''') + f'''
  <path d="M100 60 L110 128" stroke="#6a4a2e" stroke-width="4"/>
  <path d="M96 118 L124 118" stroke="{IRON_L}" stroke-width="2"/>
  <path d="M104 126 L116 126 M110 120 L110 134" stroke="{RUNE}" stroke-width="2"/>'''
    arm = g(f'    <path d="M86 58 C102 62 110 76 108 90 L96 92 C96 80 92 72 84 70 Z" fill="{FUR}"/>') + paw(102, 92, 9)
    h = tr(head(), dx=12, dy=4, s=0.75)
    body = "\n".join([legs, torso, h, hammer, arm])
    svg("bear_brute", body, world=0.32, anchor=(60, 136), note="Niedźwiedź-osiłek: olbrzym z młotem runicznym, żelazny kołnierz.")


def siege():
    wheel = lambda cx, cy, r: g(f'''    <circle cx="{cx}" cy="{cy}" r="{r}" fill="#5a4630"/>
    <circle cx="{cx}" cy="{cy}" r="{r*0.35}" fill="{IRON}"/>''') + f'''
  <path d="M{cx-r+4} {cy} L{cx+r-4} {cy} M{cx} {cy-r+4} L{cx} {cy+r-4}" stroke="{INK}" stroke-width="2.5"/>'''
    frame = g(f'''    <path d="M12 102 L116 102 L112 114 L16 114 Z" fill="#6a4a2e"/>
    <path d="M40 102 L56 64 L70 64 L84 102 Z" fill="#6a4a2e"/>''')
    arm = g(f'''    <path d="M62 70 L112 26" stroke-width="8"/>
    <path d="M104 14 C104 4 124 4 124 16 C124 24 118 28 112 28 C106 28 104 22 104 14 Z" fill="{IRON_D}"/>''') + f'''
  <path d="M62 70 L112 26" stroke="#8a6a44" stroke-width="4.5"/>
  <circle cx="114" cy="15" r="7" fill="#3a2c40" stroke="{INK}" stroke-width="2"/><circle cx="114" cy="15" r="3.5" fill="{RUNE}"/>'''
    weight = g(f'''    <rect x="22" y="70" width="26" height="24" rx="3" fill="{IRON}"/>''') + f'''
  <path d="M26 82 L44 82" stroke="{TEAM_M}" stroke-width="5"/>'''
    body = "\n".join([frame, weight, arm, wheel(34, 120, 15), wheel(94, 120, 15)])
    svg("bear_siege", body, world=0.3, anchor=(64, 136), note="Machina niedźwiedzi: trebusz z żelazną przeciwwagą, miota głazem z runą grawitacji.")


def flyer():
    balloon = g(f'''    <path d="M22 44 C18 16 42 2 64 2 C86 2 110 16 106 44 C104 58 86 68 64 68 C42 68 24 58 22 44 Z" fill="{PELT}"/>''') + f'''
  <path d="M64 2 L64 68 M40 6 C34 24 36 48 46 66 M88 6 C94 24 92 48 82 66" stroke="#5a4a38" stroke-width="2" fill="none"/>
  <path d="M24 34 C44 40 84 40 104 34 L104 44 C84 50 44 50 24 44 Z" fill="{TEAM_M}"/>
  <path d="M24 34 C44 40 84 40 104 34" stroke="{TEAM}" stroke-width="1.2" fill="none"/>'''
    ropes = f'''  <path d="M40 64 L48 84 M88 64 L80 84 M64 68 L64 84" stroke="{INK}" stroke-width="1.8"/>'''
    basket = g(f'''    <path d="M42 84 L86 84 L82 104 L46 104 Z" fill="#8a6a44"/>''') + f'''
  <path d="M44 90 L84 90 M45 96 L83 96" stroke="#5a4028" stroke-width="1.5"/>'''
    rider = g(f'    <path d="M52 84 C50 74 56 68 64 68 C72 68 78 74 76 84 Z" fill="{FUR}"/>')
    h = tr(head(), dx=30, dy=40, s=0.45)
    bomb = f'''  <circle cx="60" cy="110" r="5" fill="{IRON_D}" stroke="{INK}" stroke-width="1.5"/><path d="M60 105 L62 101" stroke="{RUNE}" stroke-width="1.5"/>'''
    s = "\n".join([balloon, ropes, rider, h, basket, bomb])
    svg("bear_flyer", s, world=0.24, anchor=(64, 112), note="Latający niedźwiedź: balon ze skór z koszem, zrzuca bomby.")


if __name__ == "__main__":
    soldier(); archer(); shield(); brute(); siege(); flyer()
    print("bear ok")
