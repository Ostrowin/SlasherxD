# Krety: inżynierowie podziemi — sci-fi/tech (wiertła, para, mosiądz, lampy górnicze), magia ognia
# tylko u Magmy (dowódca). Żółte kaski = rozpoznawalność rasy na ciemnej ziemi.
from common import *

FUR = "#6b5548"
FUR_D = "#463830"
FUR_L = "#8a7060"
SNOUT = "#d98f8f"
SNOUT_D = "#b86a6a"
PALM = "#e0a8a0"
CLAW = "#efe6cf"
HELM = "#d9a032"
HELM_D = "#a8741e"
HELM_L = "#f0c860"
LAMP = "#ffc233"
LAMP_C = "#fff2c0"
AMBER = "#ffb020"


def head(helmet=True, goggles="down", extra=""):
    s = g(f'''    <path d="M44 50 C44 32 58 22 74 22 C90 22 100 34 100 46 C100 58 90 68 74 68 C58 68 44 62 44 50 Z" fill="{FUR}"/>
    <path d="M94 42 C104 40 116 44 119 50 C120 55 114 58 106 58 C99 58 94 55 93 50 Z" fill="{SNOUT}"/>''')
    s += f'''
  <ellipse cx="117" cy="50" rx="2.6" ry="3" fill="{SNOUT_D}"/>
  <path d="M104 56 L106 61 L108 56" fill="{CLAW}" stroke="{INK}" stroke-width="1"/>
  <path d="M110 48 L124 44 M110 52 L125 53 M108 50 L122 48" stroke="#2a201a" stroke-width="0.9"/>
  <path d="M46 54 C50 64 62 68 74 68 C64 64 54 58 50 50 Z" fill="{FUR_D}" opacity="0.7"/>
  <path d="M60 30 C66 26 74 25 80 26" fill="none" stroke="{FUR_L}" stroke-width="1.8"/>'''
    if goggles == "down":
        s += f'''
  <path d="M46 44 C60 40 80 38 96 40" stroke="{LEATHER}" stroke-width="5" fill="none"/>
  <circle cx="97" cy="41" r="5" fill="{BRASS}" stroke="{INK}" stroke-width="1.8"/><circle cx="97" cy="41" r="3" fill="{AMBER}"/>
  <circle cx="86" cy="43" r="7" fill="{BRASS}" stroke="{INK}" stroke-width="2"/><circle cx="86" cy="43" r="4.6" fill="{AMBER}"/>
  <path d="M84 40 L87 42 L85 46" stroke="#7a4a10" stroke-width="0.9" fill="none"/>
  <circle cx="84.5" cy="41.5" r="1.4" fill="{LAMP_C}"/>'''
    else:
        s += f'''
  <circle cx="88" cy="44" r="1.8" fill="#120c08"/><circle cx="97" cy="43" r="1.4" fill="#120c08"/>
  <path d="M84 40 L91 41" stroke="#2a201a" stroke-width="1.5"/>'''
    if helmet:
        s += g(f'''    <path d="M46 38 C48 22 62 14 76 15 C90 16 100 26 101 36 C84 31 62 31 46 38 Z" fill="{HELM}"/>
    <path d="M42 40 C60 32 86 30 106 36 L104 40 C86 35 62 36 44 44 Z" fill="{HELM_D}"/>
    <path d="M92 20 C98 20 102 24 102 30 C102 34 98 36 94 36 C90 36 88 32 88 28 C88 24 90 20 92 20 Z" fill="{METAL}"/>''', sw=2.5)
        s += f'''
  <circle cx="96" cy="28" r="4" fill="{LAMP}"/><circle cx="96" cy="28" r="2" fill="{LAMP_C}"/>
  <path d="M70 15.5 L79 15.5 L81 32.5 L70 33 Z" fill="{TEAM_M}"/>
  <path d="M70 16 L70.5 32.5" stroke="{TEAM}" stroke-width="1.2"/>
  <path d="M54 24 C62 18 68 16.5 70 16.5" fill="none" stroke="{HELM_L}" stroke-width="2"/>
  <path d="M66 20 L70 28 L66 30" stroke="{HELM_D}" stroke-width="1.5" fill="none"/>
  <circle cx="58" cy="30" r="1.2" fill="{HELM_D}"/>'''
    return s + extra


LEGS = g(f'''    <path d="M52 108 L48 126 L46 134 L62 134 L62 122 L64 110 Z" fill="{FUR_D}"/>
    <path d="M70 110 L70 124 L70 134 L86 134 L84 122 L82 110 Z" fill="{FUR}"/>
    <path d="M44 128 L44 138 L64 138 L63 128 Z M68 128 L68 138 L90 138 L88 128 Z" fill="{LEATHER}"/>''')
TORSO = g(f'    <path d="M42 94 C40 76 52 64 68 64 C84 64 94 76 94 94 C94 110 84 118 68 118 C52 118 42 110 42 94 Z" fill="{FUR}"/>')


def overalls():
    s = g(f'    <path d="M50 84 L88 84 C92 96 90 110 82 116 L56 116 C48 110 46 96 50 84 Z" fill="#4a5058"/>')
    s += f'''
  <path d="M54 84 L58 70 M84 84 L80 70" stroke="{INK}" stroke-width="5"/>
  <path d="M54 84 L58 70 M84 84 L80 70" stroke="#4a5058" stroke-width="2.8"/>
  <path d="M60 90 L78 90 L78 102 L60 102 Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2"/>
  <path d="M60 91.5 L78 91.5" stroke="{TEAM}" stroke-width="1.2"/>
  <circle cx="56" cy="86" r="1.5" fill="{BRASS}"/><circle cx="82" cy="86" r="1.5" fill="{BRASS}"/>
  <path d="M52 108 L86 108" stroke="{LEATHER}" stroke-width="4"/>
  <rect x="64" y="105" width="8" height="6" fill="{BRASS}" stroke="{INK}" stroke-width="1"/>'''
    return s


def hand(cx, cy, r=6, claws_dir=1):
    d = claws_dir
    return g(f'''    <circle cx="{cx}" cy="{cy}" r="{r}" fill="{PALM}"/>
    <path d="M{cx+d*r*0.6} {cy-r*0.5} L{cx+d*(r+6)} {cy-r*0.7} M{cx+d*r*0.8} {cy} L{cx+d*(r+7)} {cy+1} M{cx+d*r*0.6} {cy+r*0.5} L{cx+d*(r+6)} {cy+r*0.8}" stroke="{CLAW}" stroke-width="2.4"/>''', sw=2.2)


def soldier():
    far_arm = g(f'    <path d="M56 76 C48 84 50 94 58 96 L66 92 C60 90 60 84 62 80 Z" fill="{FUR_D}"/>')
    drill = g(f'''    <path d="M44 92 L60 88 L62 100 L46 102 Z" fill="{LEATHER}"/>
    <rect x="58" y="84" width="30" height="18" rx="4" fill="{BRASS}"/>
    <path d="M88 84 L124 92 L88 102 Z" fill="{METAL_L}"/>''', sw=2.5) + f'''
  <path d="M94 86 L98 99 M102 88 L106 97 M110 89 L113 95 M117 91 L119 93" stroke="{INK}" stroke-width="1.5"/>
  <path d="M90 86 L118 91" stroke="{METAL_HI}" stroke-width="1.2"/>
  <rect x="64" y="88" width="6" height="10" fill="{LAMP}" stroke="{INK}" stroke-width="1"/>
  <path d="M74 86 L74 100 M80 86 L80 100" stroke="#8a6420" stroke-width="1.5"/>'''
    near_arm = g(f'    <path d="M78 70 C88 74 92 82 90 90 L82 92 C82 86 78 80 74 78 Z" fill="{FUR}"/>')
    body = "\n".join([far_arm, LEGS, TORSO, overalls(), drill, near_arm, hand(84, 94, 5.5), head()])
    svg("mole_soldier", body, note="Kret-piechur: lanca-wiertło z silniczkiem, kask górniczy z lampą, gogle.")


def archer():
    gun = g(f'''    <path d="M40 90 L54 84 L56 98 L42 100 Z" fill="{LEATHER}"/>
    <rect x="52" y="82" width="54" height="12" rx="2" fill="{METAL}"/>
    <rect x="104" y="85" width="16" height="6" fill="{METAL_D}"/>
    <circle cx="70" cy="98" r="8" fill="{BRASS}"/>
    <rect x="64" y="74" width="24" height="7" rx="2" fill="{METAL_D}"/>''', sw=2.5) + f'''
  <circle cx="70" cy="98" r="4" fill="{METAL_D}"/><circle cx="70" cy="98" r="1.5" fill="{BRASS}"/>
  <circle cx="88" cy="77.5" r="2.4" fill="{AMBER}"/>
  <path d="M56 85 L102 85" stroke="{METAL_HI}" stroke-width="1.2"/>
  <path d="M120 86 L126 88 L120 90" fill="{METAL_HI}"/>'''
    far_arm = g(f'    <path d="M56 76 C50 84 52 92 60 94 L68 90 C62 88 62 84 64 80 Z" fill="{FUR_D}"/>')
    near_arm = g(f'    <path d="M78 70 C88 74 92 82 90 88 L82 90 C82 84 78 80 74 78 Z" fill="{FUR}"/>')
    pouch = g(f'    <rect x="40" y="74" width="12" height="22" rx="3" fill="{LEATHER_L}"/>', sw=2) + f'''
  <path d="M42 74 L42 68 M46 74 L46 67 M50 74 L50 68" stroke="{METAL_HI}" stroke-width="1.5"/>'''
    body = "\n".join([pouch, far_arm, LEGS, TORSO, overalls(), near_arm, gun, hand(88, 90, 5.5), head()])
    svg("mole_archer", body, note="Kret-strzelec: gwoździarka z bębnowym magazynkiem i celownikiem, kołczan nitów.")


def shield():
    pick = g(f'''    <path d="M100 118 L110 30" stroke="{INK}" stroke-width="6"/>
    <path d="M100 118 L110 30" stroke="#8a6a44" stroke-width="3"/>
    <path d="M92 32 C100 22 118 22 126 32 L122 34 C114 28 104 28 96 35 Z" fill="{METAL_L}"/>''')
    door = g(f'''    <path d="M66 64 L108 60 L112 128 L70 134 Z" fill="#5a5048"/>
    <rect x="76" y="72" width="26" height="6" rx="2" fill="#1c1a18"/>''') + f'''
  <path d="M67 90 L110 86 L110 98 L68 102 Z" fill="{TEAM_M}"/>
  <path d="M67 90 L110 86" stroke="{TEAM}" stroke-width="1.2"/>
  <path d="M70 116 L110 112" stroke="{HELM}" stroke-width="5"/>
  <path d="M74 115 L78 119 M84 114 L88 118 M94 113 L98 117 M104 112 L108 116" stroke="{INK}" stroke-width="2"/>
  <path d="M68 66 L106 62" stroke="#7a7068" stroke-width="1.5"/>
  <path d="M96 104 L100 110 L96 112" stroke="{INK}" stroke-width="1.2" fill="none"/>
''' + rivets([(70, 68), (104, 65), (108, 124), (74, 128), (88, 66), (90, 130)], r=1.5)
    body = "\n".join([LEGS, TORSO, overalls(), head(), pick, door, hand(108, 70, 5.5, -1)])
    svg("mole_shield", body, world=0.22, note="Kret-tarczownik: pancerne drzwi z szybu z wizjerem, kilof.")


def brute():
    boiler = g(f'''    <rect x="20" y="46" width="30" height="56" rx="8" fill="{BRASS}"/>
    <rect x="26" y="30" width="8" height="18" fill="{METAL}"/>''') + f'''
  <path d="M22 60 L48 60 M22 84 L48 84" stroke="#8a6420" stroke-width="2.5"/>
  <circle cx="35" cy="72" r="5" fill="{METAL_D}" stroke="{INK}" stroke-width="1.5"/><path d="M35 72 L38 69" stroke="{AMBER}" stroke-width="1.5"/>
  <circle cx="28" cy="24" r="5" fill="#8a8a8a" opacity="0.5"/><circle cx="33" cy="16" r="6" fill="#9a9a9a" opacity="0.4"/>'''
    legs = g(f'''    <path d="M42 108 L36 126 L32 138 L58 138 L58 126 L60 110 Z" fill="{METAL}"/>
    <path d="M72 108 L72 126 L70 138 L98 138 L96 126 L92 108 Z" fill="#4a5058"/>''')
    suit = g(f'''    <path d="M34 90 C32 66 48 52 70 52 C92 52 106 66 104 90 C102 110 90 118 70 118 C50 118 36 110 34 90 Z" fill="#4a5058"/>''') + f'''
  <path d="M40 76 C46 62 60 56 76 56" stroke="{METAL_HI}" stroke-width="2" fill="none"/>
  <path d="M56 96 L84 96 L84 112 L56 112 Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2"/>
  <path d="M56 97.5 L84 97.5" stroke="{TEAM}" stroke-width="1.2"/>
''' + rivets([(44, 84), (98, 84), (46, 104), (96, 104), (70, 60)], r=1.5)
    window = f'''  <circle cx="72" cy="64" r="16" fill="{METAL_D}" stroke="{INK}" stroke-width="2.5"/>'''
    h = tr(head(helmet=False), dx=18, dy=22, s=0.62)
    glass = f'''  <circle cx="72" cy="64" r="14" fill="#9ad0d8" opacity="0.18"/><path d="M62 56 C66 52 72 50 78 52" stroke="#e8f8ff" stroke-width="2" fill="none" opacity="0.6"/>
  <circle cx="72" cy="64" r="16" fill="none" stroke="{BRASS}" stroke-width="3"/>'''
    arm_far = g(f'''    <path d="M40 64 C26 72 20 88 22 102 L34 102 C34 90 38 80 46 74 Z" fill="{METAL}"/>
    <path d="M14 100 L40 100 L40 118 L16 118 Z" fill="{BRASS}"/>''')
    arm_near = g(f'''    <path d="M96 62 C110 66 116 80 112 94 L100 96 C102 86 98 78 90 74 Z" fill="#4a5058"/>
    <rect x="94" y="92" width="22" height="16" rx="3" fill="{BRASS}"/>
    <path d="M116 94 L136 100 L116 106 Z" fill="{METAL_L}"/>''') + f'''
  <path d="M120 96 L122 104 M126 98 L127 102" stroke="{INK}" stroke-width="1.5"/>
  <path d="M100 96 L100 106 M106 96 L106 106" stroke="#8a6420" stroke-width="1.5"/>'''
    body = "\n".join([boiler, arm_far, legs, suit, window, h, glass, arm_near])
    svg("mole_brute", body, w=140, world=0.3, anchor=(66, 136), note="Kret-osiłek: parowy skafander z kotłem i ramieniem-wiertłem, kret za szybą.")


def siege():
    tracks = g(f'''    <path d="M16 112 C16 104 22 100 30 100 L100 100 C108 100 114 104 114 112 C114 120 108 126 100 126 L30 126 C22 126 16 120 16 112 Z" fill="#2b2a28"/>''') + f'''
  <circle cx="30" cy="113" r="8" fill="{METAL}" stroke="{INK}" stroke-width="2"/><circle cx="52" cy="113" r="8" fill="{METAL}" stroke="{INK}" stroke-width="2"/>
  <circle cx="76" cy="113" r="8" fill="{METAL}" stroke="{INK}" stroke-width="2"/><circle cx="100" cy="113" r="8" fill="{METAL}" stroke="{INK}" stroke-width="2"/>
  <path d="M20 104 L110 104" stroke="#4a4844" stroke-width="2" stroke-dasharray="4 3"/>'''
    hull = g(f'''    <path d="M22 100 L28 76 L92 76 L106 100 Z" fill="#4a5058"/>
    <rect x="30" y="62" width="30" height="16" rx="3" fill="{BRASS}"/>''') + f'''
  <path d="M30 80 L96 80" stroke="{METAL_HI}" stroke-width="1.5"/>
  <path d="M40 86 L90 86 L94 96 L36 96 Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2"/>
  <path d="M40 87.5 L90 87.5" stroke="{TEAM}" stroke-width="1.2"/>
  <rect x="34" y="52" width="6" height="12" fill="{METAL}" stroke="{INK}" stroke-width="1.5"/>
  <circle cx="37" cy="46" r="4" fill="#8a8a8a" opacity="0.5"/><circle cx="41" cy="38" r="5" fill="#9a9a9a" opacity="0.4"/>
''' + rivets([(32, 92), (100, 96), (60, 80), (84, 80)], r=1.4)
    mortar = g(f'''    <path d="M62 78 L76 46 L96 54 L84 82 Z" fill="{METAL}"/>
    <ellipse cx="86" cy="50" rx="11" ry="6" transform="rotate(22 86 50)" fill="{METAL_D}"/>''') + f'''
  <ellipse cx="86" cy="50" rx="7" ry="3.6" transform="rotate(22 86 50)" fill="#120c08"/>
  <path d="M70 64 L88 72 M74 56 L92 64" stroke="{BRASS}" stroke-width="3"/>'''
    lamp = f'''  <circle cx="102" cy="88" r="4" fill="{LAMP}" stroke="{INK}" stroke-width="1.5"/><circle cx="102" cy="88" r="2" fill="{LAMP_C}"/>'''
    body = "\n".join([tracks, hull, mortar, lamp])
    svg("mole_siege", body, world=0.3, anchor=(64, 132), note="Machina kretów: parowy moździerz na gąsienicach, kocioł z kominem.")


def flyer():
    rotor = f'''  <path d="M20 22 L108 18" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>
  <path d="M20 22 L108 18" stroke="{METAL_L}" stroke-width="2.5" stroke-linecap="round"/>
  <ellipse cx="64" cy="20" rx="46" ry="5" fill="#cfd4d8" opacity="0.18"/>
  <path d="M64 20 L64 44" stroke="{INK}" stroke-width="5"/><path d="M64 20 L64 44" stroke="{METAL}" stroke-width="2.5"/>
  <circle cx="64" cy="20" r="4" fill="{BRASS}" stroke="{INK}" stroke-width="1.5"/>'''
    frame = g(f'''    <path d="M28 76 L10 80 L12 88 L32 86 Z" fill="{METAL}"/>
    <path d="M30 66 C30 52 46 44 64 44 C82 44 98 52 98 66 L96 92 C80 100 48 100 32 92 Z" fill="{BRASS}"/>
    <path d="M8 74 L14 72 L16 94 L10 96 Z" fill="{METAL_D}"/>''') + f'''
  <path d="M34 60 C42 52 54 48 66 48" stroke="#e0b860" stroke-width="2" fill="none"/>
  <path d="M40 80 L90 80 L90 88 L40 88 Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2"/>
  <path d="M40 81.5 L90 81.5" stroke="{TEAM}" stroke-width="1"/>
  <path d="M40 96 L34 108 M88 96 L94 108 M30 108 L98 108" stroke="{INK}" stroke-width="3"/>'''
    pilot = tr(head(), dx=24, dy=10, s=0.6)
    body = "\n".join([rotor, frame, pilot, hand(88, 66, 4.5)])
    svg("mole_flyer", body, world=0.22, anchor=(64, 110), note="Latający kret: mosiężny wiatrakowiec z pilotem w kasku.")


if __name__ == "__main__":
    soldier(); archer(); shield(); brute(); siege(); flyer()
    print("mole ok")
