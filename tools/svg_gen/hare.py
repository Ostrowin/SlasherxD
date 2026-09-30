# Zające: sci-fi „aero” — lekkie ceramiczne pancerze, turbinki i dysze, błękitna energia wiatru,
# gogle lotnicze. Biała sierść + długie uszy = rozpoznawalność rasy z daleka.
from common import *

FUR = "#eeeae2"
FUR_D = "#c4bcae"
FUR_L = "#ffffff"
EAR_IN = "#e8a8a8"
NOSE = "#d97a86"
EYE = "#2a1a14"
CERAMIC = "#dfe6ea"
CERAMIC_D = "#a9b4bc"
WIND = "#8cdcff"
EARS = 16  # płótno wyższe o tyle — długie uszy wystają ponad głowę
WIND_C = "#e6f8ff"
VISOR = "#3fb8e8"


def hsvg(name, body, anchor=(64, 136), **kw):
    """svg() z płótnem podniesionym o EARS (rysunek przesunięty w dół, stopy w tym samym miejscu)."""
    svg(name, tr(body, dy=EARS), h=144 + EARS, anchor=(anchor[0], anchor[1] + EARS), **kw)


def head(visor=True, extra="", ears_back=False):
    """Głowa z długimi uszami (patrzy w prawo). `ears_back` — uszy położone (szarża, lot)."""
    if ears_back:
        ears = g(f'''    <path d="M62 34 C46 26 26 22 10 26 C20 34 40 40 60 42 Z" fill="{FUR_D}"/>
    <path d="M66 30 C52 18 34 10 16 10 C24 22 44 32 64 38 Z" fill="{FUR}"/>''')
        ears += f'''
  <path d="M60 34 C46 24 32 17 22 15 C32 24 46 31 60 36 Z" fill="{EAR_IN}"/>'''
    else:
        ears = g(f'''    <path d="M60 32 C52 18 48 4 52 -8 C60 -4 66 12 68 30 Z" fill="{FUR_D}"/>
    <path d="M70 30 C66 14 66 -2 74 -12 C82 -4 82 14 78 32 Z" fill="{FUR}"/>''')
        ears += f'''
  <path d="M72 28 C70 14 71 2 75 -6 C79 2 78 16 76 30 Z" fill="{EAR_IN}"/>'''
    s = ears + g(f'''    <path d="M48 50 C48 34 62 26 78 28 C92 30 100 40 100 50 C100 62 90 70 76 70 C60 70 48 62 48 50 Z" fill="{FUR}"/>
    <path d="M92 46 C102 44 110 48 111 54 C112 60 104 64 96 63 C90 62 88 56 90 50 Z" fill="{FUR}"/>''')
    s += f'''
  <path d="M106 50 C109 50 111 52 110 54 C108 55 105 54 105 52 Z" fill="{NOSE}"/>
  <path d="M104 57 C106 60 108 60 110 58" fill="none" stroke="{INK}" stroke-width="1.3"/>
  <path d="M104 58 L104 62 L107 62 L107 59" fill="{FUR_L}" stroke="{INK}" stroke-width="0.8"/>
  <path d="M100 54 L122 50 M100 56 L123 57 M99 58 L120 63" stroke="#8a8078" stroke-width="0.8"/>
  <path d="M50 54 C54 64 64 70 76 70 C66 66 56 60 54 50 Z" fill="{FUR_D}" opacity="0.6"/>
  <path d="M60 34 C68 30 78 30 86 32" fill="none" stroke="{FUR_L}" stroke-width="2"/>
  <ellipse cx="72" cy="58" rx="5" ry="3" fill="#f0b8b8" opacity="0.5"/>'''
    if visor:
        s += f'''
  <path d="M50 44 C64 40 82 38 98 42" stroke="{METAL_D}" stroke-width="4.5" fill="none"/>
  <path d="M80 38 C86 36 96 37 100 42 C100 48 94 50 88 50 C82 50 78 46 80 38 Z" fill="{VISOR}" stroke="{INK}" stroke-width="2"/>
  <path d="M84 40 C88 39 94 40 96 42" stroke="{WIND_C}" stroke-width="1.5" fill="none"/>'''
    else:
        s += f'''
  <ellipse cx="88" cy="45" rx="3.6" ry="4.2" fill="{EYE}"/><circle cx="89" cy="43.5" r="1.3" fill="#ffffff"/>
  <path d="M82 38 C86 36 92 37 95 40" stroke="{FUR_D}" stroke-width="1.8" fill="none"/>'''
    return s + extra


TAIL = g(f'    <path d="M40 98 C30 94 24 100 26 108 C30 114 40 112 44 106 Z" fill="{FUR_L}"/>', sw=2.5)
LEGS = g(f'''    <path d="M50 104 C42 110 40 122 46 128 L44 134 L64 136 L62 124 C62 116 60 108 56 104 Z" fill="{FUR_D}"/>
    <path d="M70 106 C66 116 66 126 70 130 L68 136 L94 138 L92 130 C86 128 84 118 82 106 Z" fill="{FUR}"/>''') + f'''
  <path d="M44 132 L64 134 M68 134 L94 136" stroke="{CERAMIC_D}" stroke-width="3"/>'''
TORSO = g(f'    <path d="M44 96 C42 78 54 66 70 66 C86 66 94 78 94 94 C94 110 84 118 70 118 C54 118 44 110 44 96 Z" fill="{FUR}"/>') + f'''
  <path d="M46 100 C50 112 60 118 70 118 C60 112 52 104 50 92 Z" fill="{FUR_D}" opacity="0.6"/>'''


def vest(y0=80):
    """Ceramiczny napierśnik z pasem koloru drużyny."""
    s = g(f'    <path d="M52 {y0} C62 {y0-6} 80 {y0-6} 90 {y0} C94 {y0+14} 90 {y0+30} 80 {y0+34} L60 {y0+34} C50 {y0+28} 48 {y0+14} 52 {y0} Z" fill="{CERAMIC}"/>')
    s += f'''
  <path d="M52 {y0+8} L91 {y0+8} L90 {y0+16} L51 {y0+16} Z" fill="{TEAM_M}"/>
  <path d="M52 {y0+8} L91 {y0+8}" stroke="{TEAM}" stroke-width="1.2"/>
  <path d="M58 {y0+24} C66 {y0+28} 76 {y0+28} 84 {y0+24}" stroke="{CERAMIC_D}" stroke-width="2" fill="none"/>
  <circle cx="71" cy="{y0+22}" r="3" fill="{WIND}" stroke="{INK}" stroke-width="1.2"/>'''
    return s


def paw(cx, cy, r=5.5):
    return g(f'    <circle cx="{cx}" cy="{cy}" r="{r}" fill="{FUR_L}"/>', sw=2.2)


def jet(x=34, y=70):
    """Plecak z dwiema dyszami i smugą wiatru."""
    s = g(f'''    <rect x="{x}" y="{y}" width="16" height="30" rx="5" fill="{CERAMIC_D}"/>
    <path d="M{x+2} {y+30} L{x-2} {y+40} L{x+8} {y+40} L{x+8} {y+30} Z M{x+9} {y+30} L{x+9} {y+40} L{x+18} {y+40} L{x+14} {y+30} Z" fill="{METAL}"/>''', sw=2.2)
    s += f'''
  <path d="M{x+3} {y+42} L{x} {y+50} M{x+13} {y+42} L{x+14} {y+50}" stroke="{WIND}" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="{x+8}" cy="{y+10}" r="3" fill="{WIND}" stroke="{INK}" stroke-width="1"/>'''
    return s


def soldier():
    blade = g(f'''    <path d="M86 96 L96 88 L100 92 L92 100 Z" fill="{METAL}"/>
    <path d="M96 90 L124 50 L128 54 L100 94 Z" fill="{CERAMIC}"/>''', sw=2.5) + f'''
  <path d="M98 90 L124 53" stroke="{WIND}" stroke-width="1.8"/>
  <path d="M100 94 L126 58" stroke="{CERAMIC_D}" stroke-width="1"/>'''
    far_arm = g(f'    <path d="M58 78 C50 86 52 94 60 96 L66 92 C60 90 62 84 64 80 Z" fill="{FUR_D}"/>')
    near_arm = g(f'    <path d="M78 72 C90 76 94 86 90 94 L82 94 C84 86 80 82 74 80 Z" fill="{FUR}"/>')
    body = "\n".join([jet(), TAIL, far_arm, LEGS, TORSO, vest(), near_arm, blade, paw(88, 96), head()])
    hsvg("hare_soldier", body, note="Zając-piechur: ceramiczne ostrze z żyłą energii, plecak odrzutowy, gogle lotnicze.")


def archer():
    bow = g(f'''    <path d="M96 52 C112 66 114 102 96 118" fill="none" stroke-width="5"/>
    <rect x="92" y="80" width="10" height="14" rx="3" fill="{METAL}"/>''', sw=2) + f'''
  <path d="M96 52 C112 66 114 102 96 118" fill="none" stroke="{CERAMIC}" stroke-width="3"/>
  <path d="M96 52 L96 118" stroke="{WIND}" stroke-width="1.5"/>
  <path d="M70 86 L118 86" stroke="{INK}" stroke-width="3"/><path d="M70 86 L118 86" stroke="{WIND_C}" stroke-width="1.5"/>
  <path d="M118 82 L126 86 L118 90 Z" fill="{WIND}" stroke="{INK}" stroke-width="1"/>
  <circle cx="98" cy="60" r="2" fill="{WIND}"/><circle cx="98" cy="110" r="2" fill="{WIND}"/>'''
    quiver = g(f'    <rect x="36" y="66" width="12" height="28" rx="3" fill="{CERAMIC_D}" transform="rotate(-12 42 80)"/>', sw=2) + f'''
  <path d="M36 66 L32 56 M41 65 L39 55 M46 65 L46 56" stroke="{WIND}" stroke-width="2"/>'''
    far_arm = g(f'    <path d="M58 78 C52 86 62 90 70 88 L72 84 C66 84 64 82 64 80 Z" fill="{FUR_D}"/>')
    near_arm = g(f'    <path d="M78 72 C88 74 94 80 96 86 L90 90 C86 86 80 82 74 80 Z" fill="{FUR}"/>')
    body = "\n".join([quiver, TAIL, far_arm, LEGS, TORSO, vest(), near_arm, bow, paw(97, 87, 5), paw(70, 86, 4.5), head()])
    hsvg("hare_archer", body, note="Zając-łucznik: łuk kompozytowy ze strzałami-dronami, kołczan na plecach.")


def shield():
    pike = g(f'''    <path d="M120 128 L120 24" stroke="{INK}" stroke-width="6"/>
    <path d="M120 128 L120 24" stroke="{METAL_L}" stroke-width="3"/>
    <path d="M120 6 L126 24 L114 24 Z" fill="{CERAMIC}"/>''') + f'''
  <path d="M120 10 L120 22" stroke="{WIND}" stroke-width="2"/>'''
    shield_ = g(f'''    <path d="M72 66 C86 60 106 60 114 68 L114 116 C106 128 86 134 74 128 C68 110 68 84 72 66 Z" fill="{CERAMIC}"/>
    <path d="M78 74 C88 70 102 70 108 74 L108 112 C100 120 88 124 80 120 Z" fill="{CERAMIC_D}" stroke-width="1.5"/>''') + f'''
  <path d="M70 84 L115 80 L115 92 L70 96 Z" fill="{TEAM_M}"/>
  <path d="M70 84 L115 80" stroke="{TEAM}" stroke-width="1.2"/>
  <path d="M92 100 L96 108 L92 116 M86 104 L92 108 L98 108" stroke="{WIND}" stroke-width="2.5" fill="none"/>
  <path d="M74 70 C88 64 104 64 112 70" stroke="{FUR_L}" stroke-width="1.5" fill="none"/>'''
    helmet = f'''
  <path d="M50 40 C52 28 64 22 78 24 C90 26 98 32 100 40 C86 36 66 36 50 40 Z" fill="{CERAMIC}" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>'''
    body = "\n".join([TAIL, LEGS, TORSO, vest(), head(extra=helmet), pike, shield_, paw(118, 82, 5)])
    hsvg("hare_shield", body, world=0.22, note="Zając-tarczownik: owalna tarcza ceramiczna z runą wiatru, lekka pika, hełm.")


def brute():
    # „Mech-królik”: pancerz egzoszkieletu, wielka pięść-młot
    legs = g(f'''    <path d="M36 100 L30 124 L28 134 L54 134 L54 120 L58 104 Z" fill="{CERAMIC_D}"/>
    <path d="M66 104 L64 124 L62 134 L92 136 L88 122 L86 104 Z" fill="{CERAMIC}"/>
    <path d="M26 128 L26 138 L56 138 L56 128 Z M60 130 L60 140 L94 140 L92 130 Z" fill="{METAL}"/>''')
    torso = g(f'''    <path d="M22 88 C18 64 38 46 64 44 C90 42 108 60 106 84 C104 104 90 118 66 118 C42 118 26 108 22 88 Z" fill="{CERAMIC}"/>''') + f'''
  <path d="M26 90 C32 108 48 118 66 118 C48 112 34 102 30 86 Z" fill="{CERAMIC_D}" opacity="0.8"/>
  <path d="M40 72 L98 72 L98 84 L40 84 Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2"/>
  <path d="M40 73.5 L98 73.5" stroke="{TEAM}" stroke-width="1.5"/>
  <circle cx="70" cy="96" r="8" fill="{METAL}" stroke="{INK}" stroke-width="2"/><circle cx="70" cy="96" r="4.5" fill="{WIND}"/>
''' + rivets([(34, 64), (50, 54), (92, 58), (100, 90)], col=CERAMIC_D)
    fist = g(f'''    <path d="M88 70 C100 74 108 86 106 98 L96 100 C96 90 92 82 84 78 Z" fill="{CERAMIC_D}"/>
    <rect x="94" y="96" width="30" height="26" rx="6" fill="{METAL}"/>''') + f'''
  <path d="M98 104 L120 104 M98 112 L120 112" stroke="{METAL_HI}" stroke-width="2"/>
  <path d="M124 100 L130 98 M124 110 L132 110 M124 118 L130 120" stroke="{WIND}" stroke-width="2.5" stroke-linecap="round"/>'''
    h = tr(head(), dx=10, dy=6, s=0.78)
    body = "\n".join([tr(TAIL, dx=-16, dy=-4), legs, torso, h, fist])
    hsvg("hare_brute", body, world=0.3, anchor=(60, 136), note="Zając-osiłek: egzoszkielet z ceramiki, pięść-młot z dyszami, rdzeń energii na piersi.")


def siege():
    # wyrzutnia „wiatrowa”: działo pneumatyczne na lekkim wózku z turbiną
    wheel = lambda cx, cy, r: g(f'''    <circle cx="{cx}" cy="{cy}" r="{r}" fill="{METAL_D}"/>
    <circle cx="{cx}" cy="{cy}" r="{r*0.45}" fill="{CERAMIC}"/>''') + f'''
  <circle cx="{cx}" cy="{cy}" r="{r*0.2}" fill="{WIND}"/>'''
    frame = g(f'''    <path d="M14 104 L112 104 L108 114 L18 114 Z" fill="{CERAMIC_D}"/>
    <path d="M40 104 L58 72 L72 72 L66 104 Z" fill="{CERAMIC}"/>''')
    barrel = g(f'''    <path d="M44 82 L108 44 L116 56 L52 94 Z" fill="{CERAMIC}"/>
    <path d="M104 40 L122 34 L126 58 L114 60 Z" fill="{METAL}"/>''') + f'''
  <path d="M50 86 L110 50" stroke="{WIND}" stroke-width="2"/>
  <path d="M64 78 L68 86 M78 70 L82 78 M92 62 L96 70" stroke="{TEAM_M}" stroke-width="4"/>
  <circle cx="126" cy="44" r="4" fill="{WIND}" opacity="0.8"/>'''
    turbine = g(f'''    <circle cx="30" cy="84" r="16" fill="{METAL}"/>
    <circle cx="30" cy="84" r="5" fill="{CERAMIC}"/>''') + f'''
  <path d="M30 70 L32 84 L44 86 M18 76 L30 84 L22 96" stroke="{METAL_HI}" stroke-width="3" fill="none"/>
  <circle cx="30" cy="84" r="16" fill="none" stroke="{WIND}" stroke-width="1.5" stroke-dasharray="4 4"/>'''
    banner = g(f'''    <path d="M100 104 L100 70" stroke-width="3"/>
    <path d="M100 72 L118 76 L114 84 L118 92 L100 90 Z" fill="{TEAM_M}"/>''')
    body = "\n".join([banner, frame, turbine, barrel, wheel(34, 120, 14), wheel(92, 120, 14)])
    hsvg("hare_siege", body, world=0.3, anchor=(64, 136), note="Machina zajęcy: działo pneumatyczne z turbiną na lekkim wózku.")


def flyer():
    # zając na lotni z napędem — uszy położone od pędu
    glider = g(f'''    <path d="M4 40 C30 24 90 20 124 34 C96 38 60 44 20 50 Z" fill="{CERAMIC}"/>''') + f'''
  <path d="M10 42 C40 30 90 26 118 34" stroke="{WIND}" stroke-width="2" fill="none"/>
  <path d="M40 34 L44 46 M64 30 L66 44 M88 30 L88 42" stroke="{CERAMIC_D}" stroke-width="2"/>
  <path d="M48 34 L80 30 L80 38 L48 42 Z" fill="{TEAM_M}"/>'''
    struts = f'''  <path d="M40 46 L60 70 M90 40 L74 70" stroke="{INK}" stroke-width="3"/>
  <path d="M40 46 L60 70 M90 40 L74 70" stroke="{METAL_L}" stroke-width="1.5"/>'''
    body_ = g(f'''    <path d="M50 84 C48 70 58 62 70 62 C84 62 92 72 90 84 C88 96 78 102 68 102 C58 102 52 94 50 84 Z" fill="{FUR}"/>
    <path d="M56 100 C50 104 46 110 50 114 L62 110 Z M74 100 C74 108 78 114 86 114 L84 104 Z" fill="{FUR_D}"/>''')
    thrust = g(f'    <rect x="38" y="74" width="12" height="18" rx="3" fill="{METAL}"/>', sw=2) + f'''
  <path d="M38 84 L22 82 M38 88 L24 92" stroke="{WIND}" stroke-width="3" stroke-linecap="round"/>'''
    h = tr(head(ears_back=True), dx=4, dy=26, s=0.72)
    s = "\n".join([glider, struts, thrust, body_, vest(y0=74).replace("M52 74", "M52 74"), h])
    hsvg("hare_flyer", s, world=0.24, anchor=(64, 116), note="Latający zając: lotnia z ceramicznym skrzydłem i dyszą, uszy położone od pędu.")


if __name__ == "__main__":
    soldier(); archer(); shield(); brute(); siege(); flyer()
    print("hare ok")
