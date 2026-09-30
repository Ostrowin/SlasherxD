# Wydry: morskie fantasy — muszle zamiast płyt, trójzęby i harpuny, sieci, koral, turkusowa magia wody.
# Gładka brązowa sierść, jasny pyszczek i gruby ogon = rozpoznawalność rasy.
from common import *

FUR = "#7a5236"
FUR_D = "#54361f"
FUR_L = "#9c6e4c"
FACE = "#d9b48a"
NOSE = "#2a1a12"
SHELL = "#e8cfae"
SHELL_D = "#b89878"
SHELL_P = "#e8a0a0"
WATER = "#3fd0c0"
WATER_C = "#c8fff6"
KELP = "#3f6a3a"
ROPE = "#b8a070"


def head(hat="", extra=""):
    """Głowa wydry (patrzy w prawo): płaska czaszka, małe uszy, jasny pyszczek z wąsami."""
    s = g(f'''    <path d="M56 32 C54 26 60 22 64 26 C66 30 64 34 60 35 Z" fill="{FUR_D}"/>
    <path d="M46 52 C46 36 60 28 76 28 C92 28 104 38 104 50 C104 62 92 70 76 70 C60 70 46 64 46 52 Z" fill="{FUR}"/>
    <path d="M84 44 C96 42 110 46 114 52 C116 60 108 66 96 66 C88 66 82 60 82 54 Z" fill="{FACE}"/>''')
    s += f'''
  <path d="M110 48 C114 48 116 50 115 53 C113 55 109 54 108 51 Z" fill="{NOSE}"/>
  <path d="M104 58 C107 61 111 61 114 58" fill="none" stroke="{NOSE}" stroke-width="1.4"/>
  <path d="M100 54 L124 49 M100 57 L125 57 M99 60 L122 64" stroke="#e8dcc8" stroke-width="1"/>
  <ellipse cx="90" cy="45" rx="3.8" ry="4" fill="{NOSE}"/><circle cx="91" cy="43.6" r="1.3" fill="#ffffff"/>
  <path d="M84 39 C88 37 94 37 97 40" stroke="{FUR_D}" stroke-width="2" fill="none"/>
  <path d="M48 56 C52 64 62 70 76 70 C66 66 56 60 52 52 Z" fill="{FUR_D}" opacity="0.7"/>
  <path d="M60 32 C68 29 78 29 86 31" fill="none" stroke="{FUR_L}" stroke-width="2"/>'''
    return s + hat + extra


TAIL = g(f'''    <path d="M46 100 C30 102 16 112 6 128 C4 134 10 136 16 132 C26 122 36 116 48 112 Z" fill="{FUR_D}"/>''') + f'''
  <path d="M40 106 C28 110 18 118 10 128" stroke="{FUR_L}" stroke-width="1.8" fill="none"/>'''
LEGS = g(f'''    <path d="M52 108 L48 124 L44 134 L62 134 L62 122 L64 110 Z" fill="{FUR_D}"/>
    <path d="M70 110 L70 124 L68 134 L88 134 L84 122 L82 110 Z" fill="{FUR}"/>''') + f'''
  <path d="M44 134 L62 134 M68 134 L88 134" stroke="{INK}" stroke-width="3"/>
  <path d="M48 131 L50 134 M54 131 L55 134 M74 131 L75 134 M80 131 L81 134" stroke="{FUR_D}" stroke-width="1.2"/>'''
TORSO = g(f'    <path d="M42 94 C40 76 52 64 68 64 C84 64 94 76 94 94 C94 110 84 118 68 118 C52 118 42 110 42 94 Z" fill="{FUR}"/>') + f'''
  <path d="M66 70 C80 70 88 80 88 94 C88 106 80 114 70 114 C76 104 76 84 66 70 Z" fill="{FACE}" opacity="0.85"/>'''


def shell_armor(y0=78):
    """Napierśnik z muszli z pasem (szarfą) koloru drużyny."""
    s = g(f'''    <path d="M54 {y0} C62 {y0-6} 80 {y0-6} 88 {y0} C92 {y0+12} 90 {y0+26} 80 {y0+32} L62 {y0+32} C52 {y0+26} 50 {y0+12} 54 {y0} Z" fill="{SHELL}"/>''')
    s += f'''
  <path d="M71 {y0-4} L71 {y0+30} M62 {y0-2} L66 {y0+30} M80 {y0-2} L76 {y0+30}" stroke="{SHELL_D}" stroke-width="1.6"/>
  <path d="M50 {y0+2} L92 {y0+22} L90 {y0+30} L48 {y0+10} Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2"/>
  <path d="M50 {y0+2} L92 {y0+22}" stroke="{TEAM}" stroke-width="1.2"/>
  <circle cx="84" cy="{y0+20}" r="3" fill="{WATER}" stroke="{INK}" stroke-width="1.2"/>'''
    return s


def paw(cx, cy, r=5.5):
    return g(f'    <circle cx="{cx}" cy="{cy}" r="{r}" fill="{FUR_D}"/>', sw=2.2)


def pauldron(cx=82, cy=70):
    return g(f'''    <path d="M{cx-12} {cy+2} C{cx-10} {cy-10} {cx+10} {cy-10} {cx+12} {cy+2} C{cx+6} {cy+8} {cx-6} {cy+8} {cx-12} {cy+2} Z" fill="{SHELL_P}"/>''', sw=2.5) + f'''
  <path d="M{cx} {cy-7} L{cx} {cy+5} M{cx-6} {cy-5} L{cx-4} {cy+5} M{cx+6} {cy-5} L{cx+4} {cy+5}" stroke="#b86a6a" stroke-width="1.3"/>'''


def soldier():
    trident = g(f'''    <path d="M84 100 L122 28" stroke="{INK}" stroke-width="6"/>
    <path d="M84 100 L122 28" stroke="{ROPE}" stroke-width="3"/>
    <path d="M114 30 L128 18 L126 30 M118 22 L124 8 L126 24 M112 24 L112 10 L118 26" fill="none" stroke-width="3.5"/>''') + f'''
  <path d="M114 30 L128 18 L126 30 M118 22 L124 8 L126 24 M112 24 L112 10 L118 26" fill="none" stroke="{METAL_L}" stroke-width="1.8"/>
  <path d="M110 44 L116 48 M106 52 L112 56" stroke="{KELP}" stroke-width="2.5"/>'''
    far_arm = g(f'    <path d="M58 78 C50 86 52 94 60 96 L66 92 C60 90 62 84 64 80 Z" fill="{FUR_D}"/>')
    near_arm = g(f'    <path d="M78 72 C90 76 94 86 90 94 L82 94 C84 86 80 82 74 80 Z" fill="{FUR}"/>')
    body = "\n".join([TAIL, far_arm, LEGS, TORSO, shell_armor(), near_arm, trident, paw(88, 96), pauldron(), head()])
    svg("otter_soldier", body, note="Wydra-piechur: trójząb owinięty wodorostami, napierśnik z muszli, szarfa drużyny.")


def archer():
    sling = g(f'''    <path d="M86 94 L104 56" stroke="{INK}" stroke-width="6"/>
    <path d="M86 94 L104 56" stroke="{ROPE}" stroke-width="3"/>
    <path d="M100 58 L106 46 L112 60 Z" fill="{SHELL}"/>''') + f'''
  <path d="M104 56 L126 70" stroke="{METAL_D}" stroke-width="2"/>
  <path d="M120 64 L128 68 L122 74 Z" fill="{METAL_L}" stroke="{INK}" stroke-width="1"/>
  <circle cx="106" cy="52" r="3" fill="{WATER}"/>'''
    bag = g(f'    <path d="M36 74 C34 90 40 98 50 98 C54 88 54 78 48 70 Z" fill="{ROPE}"/>', sw=2) + f'''
  <path d="M38 80 L50 78 M38 88 L51 86 M42 72 L42 96 M47 71 L48 97" stroke="#8a7048" stroke-width="1"/>
  <path d="M40 72 L36 62 M45 70 L44 60" stroke="{METAL_L}" stroke-width="2"/>'''
    far_arm = g(f'    <path d="M58 78 C52 86 54 92 62 94 L68 90 C62 88 62 84 64 80 Z" fill="{FUR_D}"/>')
    near_arm = g(f'    <path d="M78 72 C88 74 92 82 90 90 L82 92 C82 86 80 82 74 80 Z" fill="{FUR}"/>')
    body = "\n".join([bag, TAIL, far_arm, LEGS, TORSO, shell_armor(), near_arm, sling, paw(88, 92), head()])
    svg("otter_archer", body, note="Wydra-łuczniczka: kusza harpunowa z muszlą, sieć z harpunami na plecach.")


def shield():
    shell_shield = g(f'''    <path d="M70 70 C80 58 106 58 114 70 C120 88 118 112 108 124 C98 132 82 132 74 124 C66 112 64 88 70 70 Z" fill="{SHELL}"/>''') + f'''
  <path d="M92 62 L92 130 M80 64 L76 126 M104 64 L108 126 M72 80 L68 110 M112 80 L116 110" stroke="{SHELL_D}" stroke-width="2"/>
  <path d="M68 86 L117 82 L117 94 L68 98 Z" fill="{TEAM_M}"/>
  <path d="M68 86 L117 82" stroke="{TEAM}" stroke-width="1.2"/>
  <path d="M84 110 C88 104 96 104 100 110 C96 116 88 116 84 110 Z" fill="{WATER}" stroke="{INK}" stroke-width="1.5"/>'''
    spear = g(f'''    <path d="M121 128 L121 26" stroke="{INK}" stroke-width="6"/>
    <path d="M121 128 L121 26" stroke="{ROPE}" stroke-width="3"/>
    <path d="M121 6 L127 26 L115 26 Z" fill="{METAL_L}"/>''')
    helm = f'''
  <path d="M50 40 C52 26 66 20 78 22 C92 24 100 32 102 40 C86 34 66 34 50 40 Z" fill="{SHELL_P}" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M60 36 L62 24 M70 34 L72 22 M80 34 L82 22 M90 36 L92 26" stroke="#b86a6a" stroke-width="1.5"/>'''
    body = "\n".join([TAIL, LEGS, TORSO, shell_armor(), head(hat=helm), spear, shell_shield, paw(119, 84)])
    svg("otter_shield", body, world=0.22, note="Wydra-tarczownik: tarcza z wielkiej muszli, hełm z różowej muszli, włócznia.")


def brute():
    # stary morski wilk: masywny, z kotwicą
    legs = g(f'''    <path d="M36 100 L30 124 L28 136 L54 136 L54 120 L58 104 Z" fill="{FUR_D}"/>
    <path d="M66 104 L64 124 L62 136 L92 136 L88 122 L86 104 Z" fill="{FUR}"/>''') + f'''
  <path d="M28 136 L54 136 M62 136 L92 136" stroke="{INK}" stroke-width="3"/>'''
    tail = g(f'''    <path d="M28 98 C14 102 6 116 4 132 C10 134 16 128 20 120 C24 112 30 108 36 106 Z" fill="{FUR_D}"/>''')
    torso = g(f'''    <path d="M22 88 C18 64 38 46 64 44 C90 42 108 60 106 84 C104 104 90 118 66 118 C42 118 26 108 22 88 Z" fill="{FUR}"/>''') + f'''
  <path d="M62 52 C86 52 100 66 98 88 C96 104 84 114 70 116 C82 100 80 70 62 52 Z" fill="{FACE}" opacity="0.8"/>
  <path d="M30 60 C44 48 70 46 88 56 L84 64 C68 56 46 58 34 68 Z" fill="{ROPE}" stroke="{INK}" stroke-width="2"/>
  <path d="M36 62 L40 68 M46 56 L50 62 M58 54 L60 60 M70 54 L72 60 M80 56 L80 62" stroke="#8a7048" stroke-width="1.5"/>
  <path d="M36 80 L96 76 L96 88 L36 92 Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2"/>
  <path d="M36 81.5 L96 77.5" stroke="{TEAM}" stroke-width="1.5"/>'''
    anchor = g(f'''    <path d="M100 60 L110 128" stroke-width="7"/>
    <path d="M90 116 C92 132 124 136 132 118 L126 116 C120 128 100 126 98 114 Z" fill="{METAL}"/>
    <circle cx="99" cy="56" r="6" fill="none" stroke-width="3"/>''') + f'''
  <path d="M100 60 L110 128" stroke="{METAL_L}" stroke-width="3.5"/>
  <path d="M94 72 L114 70" stroke="{METAL}" stroke-width="6"/>
  <path d="M96 118 C100 128 118 130 126 118" stroke="{METAL_HI}" stroke-width="1.5" fill="none"/>'''
    arm = g(f'''    <path d="M86 64 C100 68 108 80 106 92 L96 94 C96 84 92 78 84 76 Z" fill="{FUR}"/>''') + paw(102, 94, 8)
    h = tr(head(), dx=10, dy=8, s=0.8)
    body = "\n".join([tail, legs, torso, h, anchor, arm])
    svg("otter_brute", body, world=0.3, anchor=(60, 136), note="Wydra-osiłek: stary morski wilk z kotwicą, lina na ramieniu.")


def siege():
    # machina: balista na tratwie-wózku, strzela bańkami wody
    wheel = lambda cx, cy, r: g(f'''    <circle cx="{cx}" cy="{cy}" r="{r}" fill="#6a5238"/>
    <circle cx="{cx}" cy="{cy}" r="{r*0.35}" fill="{SHELL}"/>''') + f'''
  <path d="M{cx-r+3} {cy} L{cx+r-3} {cy} M{cx} {cy-r+3} L{cx} {cy+r-3}" stroke="{INK}" stroke-width="2.5"/>'''
    raft = g(f'''    <path d="M10 102 L116 102 L112 116 L14 116 Z" fill="#7a5a3a"/>''') + f'''
  <path d="M30 102 L28 116 M50 102 L49 116 M70 102 L70 116 M90 102 L91 116" stroke="{INK}" stroke-width="2"/>
  <path d="M12 108 L114 108" stroke="{ROPE}" stroke-width="2.5"/>'''
    ballista = g(f'''    <path d="M48 102 L60 76 L72 76 L80 102 Z" fill="#6a5238"/>
    <path d="M30 70 C44 54 92 54 110 70" fill="none" stroke-width="6"/>
    <path d="M40 84 L118 50" stroke-width="5"/>''') + f'''
  <path d="M30 70 C44 54 92 54 110 70" fill="none" stroke="{SHELL_D}" stroke-width="3"/>
  <path d="M40 84 L118 50" stroke="{ROPE}" stroke-width="2.5"/>
  <circle cx="118" cy="48" r="7" fill="{WATER}" stroke="{INK}" stroke-width="2"/><circle cx="116" cy="46" r="2.5" fill="{WATER_C}"/>
  <path d="M30 70 L66 68 L110 70" stroke="#e8dcc8" stroke-width="1.2" fill="none"/>'''
    sail = g(f'''    <path d="M22 102 L22 40" stroke-width="3"/>
    <path d="M24 42 C40 50 40 78 24 90 Z" fill="{TEAM_M}"/>''') + f'''
  <path d="M26 46 C36 54 36 76 26 86" stroke="{TEAM}" stroke-width="1.2" fill="none"/>'''
    body = "\n".join([sail, raft, ballista, wheel(34, 122, 13), wheel(92, 122, 13)])
    svg("otter_siege", body, world=0.3, anchor=(64, 136), note="Machina wydr: balista z muszli na tratwie z kołami, strzela bańkami wody.")


def flyer():
    # wydra na mewie bojowej
    wing_far = g(f'''    <path d="M60 64 C48 46 28 34 4 30 C16 42 28 50 40 56 C30 58 26 62 30 66 C40 66 50 68 56 72 Z" fill="#b8b8b0"/>''')
    gull = g(f'''    <path d="M36 80 C36 66 52 60 72 62 C92 64 104 72 104 80 C102 92 86 98 66 98 C48 98 36 92 36 80 Z" fill="#f0f0ea"/>
    <path d="M100 70 C104 62 112 60 118 64 C122 68 120 74 114 76 C108 78 104 76 100 74 Z" fill="#f0f0ea"/>
    <path d="M118 66 L128 70 L118 72 Z" fill="#f0b030"/>
    <path d="M38 84 L20 92 L30 94 L26 100 L42 92 Z" fill="#d8d8d0"/>''') + f'''
  <circle cx="112" cy="67" r="1.6" fill="{INK}"/>
  <path d="M58 98 L56 108 M74 98 L76 108" stroke="#f0b030" stroke-width="2.5"/>'''
    saddle = f'''  <path d="M54 66 C62 74 78 76 88 70 L88 76 C78 82 62 80 52 72 Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2"/>
  <path d="M54 68 C62 75 78 77 88 72" stroke="{TEAM}" stroke-width="1" fill="none"/>'''
    rider = g(f'    <path d="M58 66 C54 54 62 44 72 44 C82 44 86 54 84 66 Z" fill="{FUR}"/>')
    wing_near = g(f'''    <path d="M60 76 C62 54 72 30 92 12 C92 20 90 26 88 30 C94 30 94 36 90 40 C86 42 84 48 84 52 C78 58 74 66 72 76 Z" fill="#dcdcd4"/>''') + f'''
  <path d="M66 70 C70 50 78 34 90 18" stroke="#9a9a92" stroke-width="1.5" fill="none"/>
  <path d="M88 30 L92 14 L86 28 Z" fill="#3a3a38"/>'''
    h = tr(head(), dx=30, dy=6, s=0.55)
    s = "\n".join([wing_far, gull, wing_near, saddle, rider, h])
    svg("otter_flyer", s, world=0.24, anchor=(64, 108), note="Latająca wydra: jeździec na mewie bojowej, siodło w barwach drużyny.")


if __name__ == "__main__":
    soldier(); archer(); shield(); brute(); siege(); flyer()
    print("otter ok")
