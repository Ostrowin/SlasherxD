# Wilki: zimowi łowcy — stal, futra, kły, niebieskie błyskawice. Szara sierść, długi pysk i spiczaste uszy.
from common import *

FUR = "#8a929c"
FUR_D = "#5c636c"
FUR_L = "#c8ccd2"
MUZZLE = "#d8dce0"
NOSE = "#1a1a1e"
EYE = "#ffd24a"
STEEL = "#5a6470"
STEEL_D = "#343a42"
STEEL_L = "#8a96a4"
BOLT = "#6ab4ff"
BOLT_C = "#e0f0ff"
CLOAK = "#3a4450"


def head(extra="", hood=False):
    s = g(f'''    <path d="M54 34 L50 10 L66 28 Z" fill="{FUR_D}"/>
    <path d="M66 30 L68 6 L80 28 Z" fill="{FUR}"/>
    <path d="M46 50 C46 34 60 26 76 28 C88 30 96 38 98 46 C98 60 86 68 72 68 C58 68 46 62 46 50 Z" fill="{FUR}"/>
    <path d="M86 42 C98 42 112 46 118 52 C118 58 110 62 98 62 C90 62 84 56 84 50 Z" fill="{MUZZLE}"/>''')
    s += f'''
  <path d="M70 26 L70 12 L76 26 Z" fill="#c08a8a"/>
  <path d="M114 48 C118 48 120 51 118 54 C116 55 112 54 112 51 Z" fill="{NOSE}"/>
  <path d="M96 60 L100 64 L104 60 L108 63" stroke="{INK}" stroke-width="1.3" fill="#ffffff"/>
  <path d="M82 42 C86 38 92 38 94 42 C90 45 86 45 82 42 Z" fill="{EYE}" stroke="{INK}" stroke-width="1.2"/>
  <circle cx="88" cy="42" r="1.4" fill="{NOSE}"/>
  <path d="M80 37 L94 36" stroke="{FUR_D}" stroke-width="2.2"/>
  <path d="M48 54 C52 64 60 68 72 68 C62 64 54 58 52 50 Z" fill="{FUR_D}" opacity="0.7"/>
  <path d="M52 46 C48 52 48 58 52 64" stroke="{FUR_L}" stroke-width="2" fill="none"/>'''
    if hood:
        s += g(f'''    <path d="M44 56 C40 36 52 22 66 22 C58 30 56 44 60 60 Z" fill="{CLOAK}"/>''', sw=2.5)
    return s + extra


TAIL = g(f'''    <path d="M44 100 C30 96 18 102 8 94 C14 108 26 114 42 110 Z" fill="{FUR}"/>''') + f'''
  <path d="M10 96 C18 104 28 106 40 104" stroke="{FUR_L}" stroke-width="2" fill="none"/>'''
LEGS = g(f'''    <path d="M50 106 L44 124 L42 136 L60 136 L60 122 L62 108 Z" fill="{FUR_D}"/>
    <path d="M70 108 L70 124 L68 136 L88 136 L84 122 L82 108 Z" fill="{FUR}"/>''') + f'''
  <path d="M42 130 L42 138 L62 138 L61 130 Z M66 130 L66 138 L90 138 L88 130 Z" fill="{STEEL_D}" stroke="{INK}" stroke-width="2"/>'''
TORSO = g(f'    <path d="M42 94 C40 76 52 64 68 64 C84 64 94 76 94 94 C94 110 84 118 68 118 C52 118 42 110 42 94 Z" fill="{FUR}"/>') + f'''
  <path d="M68 68 C80 70 88 80 88 92 C82 86 76 80 68 78 Z" fill="{FUR_L}" opacity="0.8"/>'''


def mail(y0=78):
    s = g(f'''    <path d="M52 {y0} C62 {y0-6} 80 {y0-6} 90 {y0} C94 {y0+14} 90 {y0+30} 80 {y0+34} L60 {y0+34} C50 {y0+28} 48 {y0+14} 52 {y0} Z" fill="{STEEL}"/>''')
    s += f'''
  <path d="M52 {y0+4} L90 {y0+24} L89 {y0+31} L50 {y0+11} Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2"/>
  <path d="M52 {y0+4} L90 {y0+24}" stroke="{TEAM}" stroke-width="1.2"/>
  <path d="M58 {y0+18} L64 {y0+14} L62 {y0+22} L68 {y0+18}" stroke="{BOLT}" stroke-width="1.8" fill="none"/>
  <path d="M54 {y0-2} C64 {y0-6} 78 {y0-6} 88 {y0-2}" stroke="{STEEL_L}" stroke-width="1.5" fill="none"/>'''
    return s


def paw(cx, cy, r=5.5):
    return g(f'    <circle cx="{cx}" cy="{cy}" r="{r}" fill="{FUR_D}"/>', sw=2.2)


def soldier():
    sword = g(f'''    <path d="M86 98 L94 90 L98 94 L90 102 Z" fill="{STEEL_D}"/>
    <path d="M94 92 C104 72 114 54 126 40 C124 58 112 78 98 96 Z" fill="{STEEL_L}"/>''', sw=2.5) + f'''
  <path d="M97 92 C106 74 114 60 122 48" stroke="{BOLT}" stroke-width="1.5" fill="none"/>'''
    far = g(f'    <path d="M58 78 C50 86 52 94 60 96 L66 92 C60 90 62 84 64 80 Z" fill="{FUR_D}"/>')
    near = g(f'    <path d="M78 72 C90 76 94 86 90 94 L82 94 C84 86 80 82 74 80 Z" fill="{FUR}"/>')
    body = "\n".join([TAIL, far, LEGS, TORSO, mail(), near, sword, paw(88, 96), head()])
    svg("wolf_soldier", body, note="Wilk-piechur: zakrzywiony miecz z żyłą błyskawicy, kolczuga, szarfa drużyny.")


def archer():
    bow = g(f'''    <path d="M96 50 C114 64 114 104 96 118" fill="none" stroke-width="5"/>''', sw=2) + f'''
  <path d="M96 50 C114 64 114 104 96 118" fill="none" stroke="#6a4a2e" stroke-width="3"/>
  <path d="M96 50 L96 118" stroke="#e8dcc0" stroke-width="1.2"/>
  <path d="M70 84 L118 84" stroke="{INK}" stroke-width="3"/><path d="M70 84 L118 84" stroke="#a88660" stroke-width="1.5"/>
  <path d="M118 80 L126 84 L118 88 Z" fill="{BOLT}" stroke="{INK}" stroke-width="1"/>'''
    cloak = g(f'''    <path d="M56 64 C40 70 30 92 28 124 L40 120 L46 128 L54 118 L60 124 C62 104 64 86 70 70 Z" fill="{CLOAK}"/>''')
    far = g(f'    <path d="M58 78 C52 86 62 90 70 86 L72 82 C66 82 64 80 64 78 Z" fill="{FUR_D}"/>')
    near = g(f'    <path d="M78 72 C88 74 94 80 96 86 L90 90 C86 86 80 82 74 80 Z" fill="{FUR}"/>')
    body = "\n".join([cloak, TAIL, far, LEGS, TORSO, mail(), near, bow, paw(97, 86, 5), paw(70, 84, 4.5), head(hood=True)])
    svg("wolf_archer", body, note="Wilk-łucznik: długi łuk, płaszcz z kapturem, strzały z grotem-iskrą.")


def shield():
    shield_ = g(f'''    <path d="M72 64 L116 64 L116 104 C116 120 104 130 94 134 C84 130 72 120 72 104 Z" fill="{STEEL}"/>
    <path d="M78 70 L110 70 L110 102 C110 114 102 122 94 126 C86 122 78 114 78 102 Z" fill="{STEEL_D}" stroke-width="1.5"/>''') + f'''
  <path d="M72 80 L116 80 L116 92 L72 92 Z" fill="{TEAM_M}"/>
  <path d="M72 80 L116 80" stroke="{TEAM}" stroke-width="1.2"/>
  <path d="M96 96 L88 110 L96 110 L90 124" stroke="{BOLT}" stroke-width="2.5" fill="none"/>'''
    spear = g(f'''    <path d="M121 128 L121 26" stroke="{INK}" stroke-width="6"/>
    <path d="M121 128 L121 26" stroke="#6a4a2e" stroke-width="3"/>
    <path d="M121 6 L127 26 L115 26 Z" fill="{STEEL_L}"/>''')
    helm = f'''
  <path d="M50 42 C52 28 64 22 76 24 C88 26 96 32 98 40 C84 36 64 36 50 42 Z" fill="{STEEL}" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>'''
    body = "\n".join([TAIL, LEGS, TORSO, mail(), head(extra=helm), spear, shield_, paw(119, 84)])
    svg("wolf_shield", body, world=0.22, note="Wilk-tarczownik: stalowa tarcza z błyskawicą, włócznia, hełm.")


def brute():
    legs = g(f'''    <path d="M34 100 L28 124 L26 136 L52 136 L52 120 L56 104 Z" fill="{FUR_D}"/>
    <path d="M66 104 L64 124 L62 136 L92 136 L88 122 L86 104 Z" fill="{FUR}"/>''') + f'''
  <path d="M26 136 L52 136 M62 136 L92 136" stroke="{INK}" stroke-width="3"/>'''
    torso = g(f'''    <path d="M20 88 C16 62 36 44 64 42 C92 40 110 58 108 84 C106 106 92 120 66 120 C40 120 24 108 20 88 Z" fill="{FUR}"/>''') + f'''
  <path d="M24 92 C30 110 46 120 66 120 C48 112 34 102 30 86 Z" fill="{FUR_D}" opacity="0.7"/>
  <path d="M34 74 L100 70 L100 82 L34 86 Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2"/>
  <path d="M34 75.5 L100 71.5" stroke="{TEAM}" stroke-width="1.5"/>
  <path d="M26 56 C40 44 76 42 96 54 L90 62 C74 54 46 54 32 64 Z" fill="{STEEL}" stroke="{INK}" stroke-width="2.5"/>
  <path d="M34 54 L30 44 L38 52 M48 48 L46 36 L52 47 M62 46 L64 34 L66 46 M78 48 L84 38 L82 50" fill="{STEEL_L}" stroke="{INK}" stroke-width="1.5"/>'''
    flail = g(f'''    <path d="M96 70 L112 110" stroke-width="7"/>
    <circle cx="116" cy="126" r="12" fill="{STEEL_D}"/>''') + f'''
  <path d="M96 70 L112 110" stroke="#6a4a2e" stroke-width="3.5"/>
  <path d="M112 110 L116 116" stroke="{STEEL_L}" stroke-width="2.5"/>
  <path d="M104 126 L98 126 M128 126 L134 126 M116 114 L116 108 M116 138 L116 142 M108 118 L104 114 M124 134 L128 138" stroke="{INK}" stroke-width="3"/>
  <path d="M112 122 L118 124 L114 128 L120 130" stroke="{BOLT}" stroke-width="1.8" fill="none"/>'''
    arm = g(f'    <path d="M84 60 C98 64 106 76 104 88 L94 90 C94 80 90 74 82 72 Z" fill="{FUR}"/>') + paw(98, 88, 8)
    h = tr(head(), dx=12, dy=4, s=0.78)
    body = "\n".join([tr(TAIL, dx=-12, dy=-4), legs, torso, h, flail, arm])
    svg("wolf_brute", body, world=0.3, anchor=(60, 136), note="Wilk-osiłek: basior w kolczastym kołnierzu, korbacz z iskrzącą kulą.")


def siege():
    wheel = lambda cx, cy, r: g(f'''    <circle cx="{cx}" cy="{cy}" r="{r}" fill="#5a4630"/>
    <circle cx="{cx}" cy="{cy}" r="{r*0.35}" fill="{STEEL}"/>''') + f'''
  <path d="M{cx-r+4} {cy} L{cx+r-4} {cy} M{cx} {cy-r+4} L{cx} {cy+r-4}" stroke="{INK}" stroke-width="2.5"/>'''
    sled = g(f'''    <path d="M10 104 L116 104 L112 114 L14 114 Z" fill="#6a4a2e"/>''')
    coil = g(f'''    <rect x="30" y="58" width="44" height="46" rx="6" fill="{STEEL}"/>
    <path d="M70 70 L116 46 L120 56 L74 82 Z" fill="{STEEL_D}"/>''') + f'''
  <path d="M34 64 L70 64 M34 72 L70 72 M34 80 L70 80 M34 88 L70 88 M34 96 L70 96" stroke="#b8872a" stroke-width="2.5"/>
  <path d="M30 76 L74 76" stroke="{TEAM_M}" stroke-width="5"/>
  <path d="M120 48 L124 40 L126 50 L130 44" stroke="{BOLT}" stroke-width="2.5" fill="none"/>
  <circle cx="120" cy="50" r="6" fill="{BOLT}" opacity="0.5"/>'''
    body = "\n".join([sled, coil, wheel(34, 120, 14), wheel(94, 120, 14)])
    svg("wolf_siege", body, world=0.3, anchor=(64, 136), note="Machina wilków: działo gromowe z miedzianą cewką na wózku, strzela kulą błyskawicy.")


def flyer():
    wing_far = g(f'''    <path d="M58 62 C46 44 28 32 4 28 C14 38 22 44 34 50 C26 54 24 58 28 62 C38 62 48 66 54 70 Z" fill="#1e1e24"/>''')
    raven = g(f'''    <path d="M36 78 C36 64 52 58 72 60 C92 62 104 70 104 78 C102 90 86 96 66 96 C48 96 36 90 36 78 Z" fill="#26262e"/>
    <path d="M100 68 C104 60 112 58 118 62 C122 66 120 72 114 74 C108 76 104 74 100 72 Z" fill="#26262e"/>
    <path d="M118 64 L130 68 L118 72 Z" fill="#3a3a40"/>
    <path d="M38 82 L18 90 L28 92 L24 100 L42 90 Z" fill="#1e1e24"/>''') + f'''
  <circle cx="112" cy="65" r="1.8" fill="{EYE}"/>
  <path d="M58 96 L56 106 M74 96 L76 106" stroke="#3a3a40" stroke-width="2.5"/>'''
    saddle = f'''  <path d="M54 64 C62 72 78 74 88 68 L88 74 C78 80 62 78 52 70 Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2"/>'''
    rider = g(f'    <path d="M58 64 C54 52 62 42 72 42 C82 42 86 52 84 64 Z" fill="{FUR}"/>')
    wing_near = g(f'''    <path d="M60 74 C62 52 72 28 92 10 C92 18 90 24 88 28 C94 28 94 34 90 38 C86 40 84 46 84 50 C78 56 74 64 72 74 Z" fill="#30303a"/>''')
    h = tr(head(), dx=30, dy=4, s=0.55)
    s = "\n".join([wing_far, raven, wing_near, saddle, rider, h])
    svg("wolf_flyer", s, world=0.24, anchor=(64, 108), note="Latający wilk: jeździec na wielkim kruku, siodło w barwach drużyny.")


if __name__ == "__main__":
    soldier(); archer(); shield(); brute(); siege(); flyer()
    print("wolf ok")
