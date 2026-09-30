# Jeże: sci-fi pancerni — oliwkowe płyty, stalowe kolce, zielone diody. Kolce na plecach i czubku głowy
# to sylwetka rasy (widać ją z daleka), pyszczek jasny i spiczasty.
from common import *

QUILL = "#4a3a2a"
QUILL_L = "#7a6048"
FACE = "#d8b890"
FACE_D = "#b0906a"
NOSE = "#1e1410"
OLIVE = "#6f7d45"
OLIVE_D = "#4a5530"
OLIVE_L = "#98a860"
LED = "#b8ff4a"
LED_C = "#f0ffd0"


def spikes(cx, cy, r, n=9, a0=110, a1=290, length=16, col=QUILL):
    """Wachlarz kolców wokół (cx, cy) — kąty w stopniach (0 = w prawo, 90 = w dół)."""
    import math
    pts = []
    for i in range(n):
        a = math.radians(a0 + (a1 - a0) * i / max(n - 1, 1))
        b = math.radians(a0 + (a1 - a0) * (i + 0.5) / max(n - 1, 1))
        pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
        pts.append((cx + math.cos(b) * (r + length), cy + math.sin(b) * (r + length)))
    d = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + f" L{cx:.1f} {cy:.1f} Z"
    return g(f'    <path d="{d}" fill="{col}"/>', sw=2.2)


def head(extra="", crest=True):
    s = ""
    if crest:
        s += spikes(70, 46, 22, n=7, a0=170, a1=300, length=14)
    s += g(f'''    <path d="M48 50 C48 36 60 28 74 28 C86 28 96 36 98 46 C98 60 88 68 74 68 C60 68 48 62 48 50 Z" fill="{QUILL_L}"/>
    <path d="M78 40 C92 40 108 46 118 54 C114 60 104 64 92 64 C82 64 76 58 76 50 Z" fill="{FACE}"/>''')
    s += f'''
  <circle cx="118" cy="54" r="3" fill="{NOSE}"/>
  <circle cx="90" cy="46" r="2.8" fill="{NOSE}"/><circle cx="90.8" cy="45.2" r="0.9" fill="#ffffff"/>
  <path d="M100 58 C104 60 108 60 112 58" stroke="{NOSE}" stroke-width="1.2" fill="none"/>
  <path d="M80 60 C86 64 92 64 96 62" stroke="{FACE_D}" stroke-width="1.5" fill="none"/>'''
    return s + extra


BACK = spikes(60, 92, 30, n=11, a0=130, a1=300, length=16)
LEGS = g(f'''    <path d="M52 108 L48 124 L46 136 L62 136 L62 122 L64 110 Z" fill="{FACE_D}"/>
    <path d="M70 110 L70 124 L68 136 L88 136 L84 122 L82 110 Z" fill="{FACE}"/>''') + f'''
  <path d="M44 130 L44 138 L64 138 L63 130 Z M66 130 L66 138 L90 138 L88 130 Z" fill="{OLIVE_D}" stroke="{INK}" stroke-width="2"/>'''
TORSO = g(f'    <path d="M42 94 C40 76 52 64 68 64 C84 64 94 76 94 94 C94 110 84 118 68 118 C52 118 42 110 42 94 Z" fill="{QUILL_L}"/>') + f'''
  <path d="M70 70 C82 72 90 82 90 94 C90 106 82 114 72 116 C78 104 78 84 70 70 Z" fill="{FACE}"/>'''


def armor(y0=78):
    s = g(f'''    <path d="M54 {y0} C62 {y0-6} 80 {y0-6} 88 {y0} C92 {y0+12} 90 {y0+28} 80 {y0+34} L62 {y0+34} C52 {y0+28} 50 {y0+12} 54 {y0} Z" fill="{OLIVE}"/>''')
    s += f'''
  <path d="M54 {y0+8} L90 {y0+8} L90 {y0+16} L53 {y0+16} Z" fill="{TEAM_M}"/>
  <path d="M54 {y0+8} L90 {y0+8}" stroke="{TEAM}" stroke-width="1.2"/>
  <rect x="66" y="{y0+22}" width="10" height="5" rx="1" fill="{LED}" stroke="{INK}" stroke-width="1"/>
  <path d="M56 {y0-2} C64 {y0-6} 78 {y0-6} 86 {y0-2}" stroke="{OLIVE_L}" stroke-width="1.5" fill="none"/>'''
    return s


def paw(cx, cy, r=5.5):
    return g(f'    <circle cx="{cx}" cy="{cy}" r="{r}" fill="{FACE_D}"/>', sw=2.2)


def soldier():
    gun = g(f'''    <rect x="70" y="84" width="40" height="12" rx="3" fill="{OLIVE_D}"/>
    <rect x="108" y="86" width="16" height="7" fill="{METAL}"/>
    <rect x="80" y="76" width="16" height="8" rx="2" fill="{METAL_D}"/>''', sw=2.5) + f'''
  <path d="M74 88 L104 88" stroke="{OLIVE_L}" stroke-width="1.5"/>
  <circle cx="126" cy="89" r="3" fill="{LED}" opacity="0.8"/>'''
    far = g(f'    <path d="M58 78 C50 86 52 94 60 96 L66 92 C60 90 62 84 64 80 Z" fill="{FACE_D}"/>')
    near = g(f'    <path d="M78 72 C88 74 92 82 90 90 L82 92 C82 86 80 82 74 80 Z" fill="{QUILL_L}"/>')
    body = "\n".join([BACK, far, LEGS, TORSO, armor(), near, gun, paw(84, 94), head()])
    svg("hedgehog_soldier", body, note="Jeż-piechur: karabin kolcowy, oliwkowy pancerz z diodą, grzebień kolców.")


def archer():
    launcher = g(f'''    <path d="M62 70 L116 56 L118 66 L64 82 Z" fill="{OLIVE_D}"/>
    <rect x="58" y="66" width="12" height="18" rx="3" fill="{METAL}"/>''', sw=2.5) + f'''
  <path d="M66 74 L114 60" stroke="{OLIVE_L}" stroke-width="1.5"/>
  <path d="M118 58 L128 56 L126 62 Z" fill="{QUILL}" stroke="{INK}" stroke-width="1"/>
  <circle cx="92" cy="70" r="2.5" fill="{LED}"/>'''
    pack = g(f'    <rect x="34" y="66" width="16" height="28" rx="4" fill="{OLIVE}"/>', sw=2) + f'''
  <path d="M36 66 L34 56 M42 65 L42 55 M48 66 L50 56" stroke="{QUILL}" stroke-width="2.5"/>'''
    far = g(f'    <path d="M58 78 C52 80 54 76 60 72 L64 70 Z" fill="{FACE_D}"/>')
    near = g(f'    <path d="M78 72 C86 70 90 68 94 66 L96 74 C90 76 84 80 76 82 Z" fill="{QUILL_L}"/>')
    body = "\n".join([pack, BACK, far, LEGS, TORSO, armor(), near, launcher, paw(94, 70, 5), head()])
    svg("hedgehog_archer", body, note="Jeż-strzelec: wyrzutnia kolców na ramieniu, zasobnik z zapasowymi kolcami.")


def shield():
    shield_ = g(f'''    <path d="M72 62 L114 62 L118 118 L96 134 L74 120 Z" fill="{OLIVE}"/>
    <path d="M78 68 L108 68 L112 114 L96 126 L80 116 Z" fill="{OLIVE_D}" stroke-width="1.5"/>''') + f'''
  <path d="M72 80 L116 80 L117 92 L73 92 Z" fill="{TEAM_M}"/>
  <path d="M72 80 L116 80" stroke="{TEAM}" stroke-width="1.2"/>
  <path d="M118 70 L126 68 L119 76 M119 96 L128 96 L119 102 M116 116 L124 120 L114 122" fill="{METAL_L}" stroke="{INK}" stroke-width="1.5"/>
  <rect x="90" y="100" width="12" height="6" rx="1" fill="{LED}" stroke="{INK}" stroke-width="1"/>'''
    body = "\n".join([BACK, LEGS, TORSO, armor(), head(), shield_, paw(116, 86)])
    svg("hedgehog_shield", body, world=0.22, note="Jeż-tarczownik: oliwkowa tarcza z kolcami na krawędzi i diodą.")


def brute():
    back = spikes(62, 84, 44, n=13, a0=120, a1=305, length=20)
    legs = g(f'''    <path d="M34 100 L28 124 L26 136 L52 136 L52 120 L56 104 Z" fill="{FACE_D}"/>
    <path d="M66 104 L64 124 L62 136 L92 136 L88 122 L86 104 Z" fill="{FACE}"/>''') + f'''
  <path d="M26 136 L52 136 M62 136 L92 136" stroke="{INK}" stroke-width="3"/>'''
    torso = g(f'''    <path d="M20 88 C16 62 36 44 64 42 C92 40 110 58 108 84 C106 106 92 120 66 120 C40 120 24 108 20 88 Z" fill="{QUILL_L}"/>''') + f'''
  <path d="M64 50 C88 52 102 66 100 88 C98 104 86 114 72 116 C84 100 82 70 64 50 Z" fill="{FACE}"/>
  <path d="M40 70 L102 66 L102 78 L40 82 Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2"/>
  <path d="M40 71.5 L102 67.5" stroke="{TEAM}" stroke-width="1.5"/>
  <path d="M46 92 L96 88 L96 106 L50 110 Z" fill="{OLIVE}" stroke="{INK}" stroke-width="2.5"/>
  <rect x="66" y="94" width="14" height="6" rx="1" fill="{LED}" stroke="{INK}" stroke-width="1"/>'''
    arm = g(f'''    <path d="M86 60 C102 64 110 78 108 92 L96 94 C96 82 92 74 84 72 Z" fill="{QUILL_L}"/>
    <rect x="94" y="88" width="26" height="24" rx="5" fill="{METAL}"/>''') + f'''
  <path d="M120 92 L130 90 M120 100 L132 100 M120 108 L130 110" stroke="{METAL_L}" stroke-width="3"/>'''
    h = tr(head(crest=False), dx=12, dy=4, s=0.78)
    body = "\n".join([back, legs, torso, h, arm])
    svg("hedgehog_brute", body, world=0.3, anchor=(60, 136), note="Jeż-osiłek: potężny grzbiet kolców, pięść-hydraulika z ostrzami.")


def siege():
    wheel = lambda cx, cy, r: g(f'''    <circle cx="{cx}" cy="{cy}" r="{r}" fill="{METAL_D}"/>
    <circle cx="{cx}" cy="{cy}" r="{r*0.4}" fill="{OLIVE}"/>''')
    body_ = g(f'''    <path d="M14 104 C14 80 34 64 62 64 C90 64 112 80 112 104 Z" fill="{OLIVE}"/>
    <path d="M60 70 L116 48 L120 58 L66 82 Z" fill="{METAL}"/>''') + f'''
  <path d="M20 96 L108 96" stroke="{TEAM_M}" stroke-width="5"/>
  <path d="M24 84 C40 72 70 70 90 76" stroke="{OLIVE_L}" stroke-width="2" fill="none"/>
  <rect x="40" y="80" width="12" height="6" rx="1" fill="{LED}" stroke="{INK}" stroke-width="1"/>
  <path d="M118 50 L126 46 L124 54 Z" fill="{QUILL}" stroke="{INK}" stroke-width="1"/>'''
    quills = spikes(62, 96, 32, n=9, a0=195, a1=345, length=12, col=METAL_L)
    body = "\n".join([quills, body_, wheel(34, 118, 14), wheel(92, 118, 14)])
    svg("hedgehog_siege", body, world=0.3, anchor=(64, 134), note="Machina jeży: opancerzony wóz-jeż z działem kolcowym i stalowym grzebieniem.")


def flyer():
    rotor = f'''  <path d="M20 20 L108 28" stroke="{INK}" stroke-width="5"/><path d="M20 20 L108 28" stroke="{METAL_L}" stroke-width="2.5"/>
  <path d="M64 24 L64 42" stroke="{INK}" stroke-width="4"/>'''
    cab = g(f'''    <path d="M30 70 C30 52 46 42 64 42 C86 42 104 54 106 70 C104 86 86 94 64 94 C46 94 30 86 30 70 Z" fill="{OLIVE}"/>
    <path d="M24 70 L4 64 L4 76 Z" fill="{OLIVE_D}"/>''') + f'''
  <path d="M34 78 L102 78" stroke="{TEAM_M}" stroke-width="5"/>
  <path d="M80 50 C92 52 100 60 102 68 L82 68 Z" fill="#8ad8ff" opacity="0.6" stroke="{INK}" stroke-width="1.5"/>
  <path d="M48 96 L44 104 M80 96 L84 104 M40 104 L90 104" stroke="{INK}" stroke-width="2.5"/>'''
    h = tr(head(), dx=36, dy=18, s=0.5)
    s = "\n".join([rotor, cab, h])
    svg("hedgehog_flyer", s, world=0.24, anchor=(64, 108), note="Latający jeż: mały wiatrakowiec w oliwkowym pancerzu, pilot za szybą.")


if __name__ == "__main__":
    soldier(); archer(); shield(); brute(); siege(); flyer()
    print("hedgehog ok")
