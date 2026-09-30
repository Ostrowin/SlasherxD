# Gibony: sci-fi — broń soniczna, rezonatory, ceramiczno-stalowe pancerze, cyjanowa energia.
from common import *

FUR = "#c9b08a"
FUR_D = "#8f7a5c"
HEADFUR = "#d9c29c"
RING = "#f0e6d2"
FACE = "#2a221e"
HAND = "#2a221c"
ARMOR = "#2f4a4f"
ARMOR_D = "#1d2e31"
ARMOR_L = "#4f7278"
CYAN = "#5ff3ff"
CYAN_C = "#e8feff"
GEAR = "#3b4a4e"


def head(eye="implant", helmet="", scar=True):
    s = g(f'    <path d="M44 44 C42 28 54 18 68 18 C84 18 94 28 94 44 C94 58 84 68 68 68 C54 68 44 58 44 44 Z" fill="{HEADFUR}"/>')
    s += f'''
  <path d="M46 36 L42 32 L48 30 L46 24 L54 26 L54 20 L60 23 L64 17 L67 22" fill="{HEADFUR}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M46 48 C48 60 58 68 70 68 C60 64 52 56 50 44 Z" fill="{FUR_D}" opacity="0.7"/>
  <path d="M50 42 C46 40 44 46 46 50 C48 52 51 51 52 48 L50 46 Z" fill="{FUR_D}" stroke="{INK}" stroke-width="1.5"/>
  <ellipse cx="78" cy="45" rx="15" ry="16.5" fill="{RING}"/>
  <ellipse cx="80" cy="47" rx="11.5" ry="13" fill="{FACE}"/>
  <ellipse cx="85" cy="54" rx="7.5" ry="5.5" fill="#3d332d"/>
  <path d="M69 38 C74 35 82 35 90 37" stroke="{RING}" stroke-width="3" fill="none" stroke-linecap="round"/>'''
    if eye == "implant":
        s += f'''
  <path d="M69 39 L79 39 L79 47 L71 48 Z" fill="#5a6468" stroke="#101214" stroke-width="1.2"/>
  <circle cx="74.5" cy="43.2" r="2.6" fill="{CYAN}"/><circle cx="74.5" cy="43.2" r="1" fill="{CYAN_C}"/>
  <path d="M68 41 L64 40 M69 46 L64 47" stroke="#6f8a90" stroke-width="1"/>
  <ellipse cx="86" cy="43.5" rx="2.6" ry="2.2" fill="#e0a43a"/><circle cx="86.6" cy="43.5" r="1.3" fill="#0c0806"/>
  <path d="M83 40.5 L90 40" stroke="{INK}" stroke-width="1.5" stroke-linecap="round"/>'''
    elif eye == "visor":
        s += f'''
  <path d="M64 38 L94 38 L94 46 L66 48 Z" fill="{GEAR}" stroke="{INK}" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M70 40.5 L92 40.5 L92 44 L71 45 Z" fill="{CYAN}"/>
  <path d="M72 41.5 L84 41.5" stroke="{CYAN_C}" stroke-width="1"/>'''
    else:
        s += f'''
  <ellipse cx="75" cy="43.5" rx="2.8" ry="2.3" fill="#e0a43a"/><circle cx="75.6" cy="43.5" r="1.4" fill="#0c0806"/>
  <ellipse cx="86" cy="43.5" rx="2.6" ry="2.2" fill="#e0a43a"/><circle cx="86.6" cy="43.5" r="1.3" fill="#0c0806"/>
  <path d="M71 40 L79 40.5 M83 40.5 L90 40" stroke="{INK}" stroke-width="1.5" stroke-linecap="round"/>'''
    if scar:
        s += '\n  <path d="M72 51 L78 58" stroke="#8a5a50" stroke-width="1.8" stroke-linecap="round"/>'
    s += f'''
  <path d="M88 50.5 L89.5 51.5 M85.5 51 L86.5 51.8" stroke="#120c08" stroke-width="1.3" stroke-linecap="round"/>
  <path d="M80 57.5 C84 59 88 58.5 91 56" fill="none" stroke="#0c0806" stroke-width="1.5"/>
  <path d="M58 24 C62 22 68 21 72 22" fill="none" stroke="#f0e2c4" stroke-width="2" stroke-linecap="round"/>'''
    s += helmet
    return s


LEGS = g(f'''    <path d="M60 106 L56 122 L54 134 L66 134 L66 122 L68 108 Z" fill="{FUR_D}"/>
    <path d="M70 106 L70 122 L70 134 L84 134 L82 122 L80 106 Z" fill="{FUR}"/>
    <path d="M52 130 L52 136 L68 136 L67 130 Z M68 130 L68 136 L86 136 L84 130 Z" fill="{HAND}"/>''')
TORSO = g(f'    <path d="M50 92 C48 78 56 66 68 64 C80 64 88 74 88 90 C88 104 80 114 68 114 C58 114 50 106 50 92 Z" fill="{FUR}"/>')


def vest(core=True):
    s = g(f'    <path d="M54 76 C62 68 78 68 85 76 C88 88 86 100 80 108 L58 108 C54 100 52 88 54 76 Z" fill="{ARMOR}"/>')
    s += f'''
  <path d="M65 70 L72 70 L72 108 L65 108 Z" fill="{TEAM_M}"/>
  <path d="M65 70 L65 108" stroke="{TEAM}" stroke-width="1"/>
  <path d="M54 77 C62 69 78 69 85 77" fill="none" stroke="{BRASS}" stroke-width="2"/>
  <path d="M58 107 L80 107" stroke="{BRASS}" stroke-width="2"/>
  <path d="M58 94 L62 100 M60 84 L64 88" stroke="{ARMOR_D}" stroke-width="1.5"/>'''
    if core:
        s += f'''
  <circle cx="78" cy="88" r="5" fill="#1c1f22" stroke="{BRASS}" stroke-width="1.5"/>
  <circle cx="78" cy="88" r="2.8" fill="{CYAN}"/>'''
    return s


SCARF = g(f'    <path d="M56 66 C44 70 32 76 20 74 L26 80 L18 84 L30 86 L24 92 C38 90 50 82 60 74 Z" fill="{CLOTH}"/>')


def archer():
    far_arm = g(f'''    <path d="M58 70 C50 80 50 90 60 94 L94 88 L94 82 L62 86 C60 82 62 78 66 76 Z" fill="{FUR_D}"/>''')
    rifle = g(f'''    <path d="M36 80 L50 76 L52 90 L40 94 Z" fill="{GEAR}"/>
    <rect x="48" y="78" width="56" height="11" rx="3" fill="#2b2e33"/>
    <rect x="102" y="80" width="18" height="7" rx="2" fill="{GEAR}"/>
    <circle cx="66" cy="76" r="6" fill="{GEAR}"/>''', sw=2.5) + f'''
  <path d="M84 77 L84 90 M90 77 L90 90 M96 77 L96 90" stroke="{CYAN}" stroke-width="2.2"/>
  <circle cx="66" cy="76" r="3" fill="{CYAN}"/>
  <rect x="118" y="81" width="3" height="5" fill="{CYAN_C}"/>
  <path d="M52 80 L100 80" stroke="#6f8a90" stroke-width="1.2"/>'''
    near_arm = g(f'''    <path d="M74 68 C86 70 92 78 92 86 L84 90 C84 82 80 78 70 78 Z" fill="{FUR}"/>
    <circle cx="90" cy="88" r="5.5" fill="{HAND}"/>''')
    pack = g(f'''    <rect x="38" y="60" width="16" height="22" rx="3" fill="#2b2e33"/>''') + f'''
  <path d="M42 60 L40 48" stroke="{INK}" stroke-width="2.5"/><circle cx="40" cy="47" r="2.3" fill="{CYAN}" stroke="{INK}" stroke-width="1"/>'''
    body = "\n".join([SCARF, pack, LEGS, TORSO, vest(core=False), far_arm, rifle, near_arm, head(eye="visor")])
    svg("gibbon_archer", body, note="Gibon-strzelec: karabin rezonansowy (cyjanowe pierścienie), gogle celownicze.")


def shield():
    field = f'''  <path d="M96 58 C112 66 116 96 110 122 C104 128 96 130 92 128 C98 104 98 80 92 62 Z" fill="{CYAN}" opacity="0.28" stroke="{CYAN}" stroke-width="2"/>
  <path d="M95 70 L104 74 L106 86 L98 90 M98 90 L106 94 L106 108 L98 112 M98 112 L104 118" fill="none" stroke="{CYAN_C}" stroke-width="1" opacity="0.7"/>'''
    far_arm = g(f'''    <path d="M58 70 C42 80 32 100 30 124 L40 126 C42 104 50 88 64 80 Z" fill="{FUR_D}"/>
    <circle cx="35" cy="129" r="7" fill="{HAND}"/>''')
    near_arm = g(f'''    <path d="M74 68 C86 70 94 80 94 92 L86 94 C84 84 80 80 70 78 Z" fill="{FUR}"/>
    <rect x="82" y="86" width="16" height="22" rx="4" fill="{GEAR}"/>
    <circle cx="94" cy="96" r="5" fill="{HAND}"/>''') + f'''
  <path d="M84 92 L96 92 M84 100 L96 100" stroke="{CYAN}" stroke-width="2"/>
  <circle cx="92" cy="97" r="2" fill="{CYAN_C}"/>'''
    helm = f'''
  <path d="M44 38 C44 24 56 16 70 16 C82 16 92 24 94 36 L86 34 C80 28 58 28 50 38 Z" fill="{ARMOR}" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M52 30 C58 24 70 22 80 24" stroke="{ARMOR_L}" stroke-width="1.6" fill="none"/>
  <path d="M60 17 L66 17 L66 30 L60 31 Z" fill="{TEAM_M}"/>'''
    pauldron = g(f'    <path d="M68 66 C72 60 86 60 90 68 C90 76 84 80 76 78 C70 76 68 72 68 66 Z" fill="{ARMOR_L}"/>', sw=2.5)
    body = "\n".join([SCARF, far_arm, LEGS, TORSO, vest(), pauldron, head(eye="normal", helmet=helm), near_arm, field])
    svg("gibbon_shield", body, world=0.22, note="Gibon-tarczownik: projektor pola siłowego na przedramieniu, hełm.")


def brute():
    frame_back = g(f'''    <path d="M30 60 L42 44 L90 44 L100 60 L96 112 L36 112 Z" fill="{ARMOR_D}"/>
    <rect x="26" y="52" width="16" height="44" rx="4" fill="{GEAR}"/>''')
    legs = g(f'''    <path d="M40 108 L34 126 L30 138 L54 138 L54 126 L58 110 Z" fill="{GEAR}"/>
    <path d="M70 108 L70 126 L68 138 L94 138 L92 126 L88 108 Z" fill="#4a5a5e"/>
    <circle cx="46" cy="118" r="5" fill="{ARMOR_D}"/><circle cx="80" cy="118" r="5" fill="{ARMOR_D}"/>''')
    pilot = g(f'    <path d="M50 88 C48 70 58 60 70 58 C82 58 90 68 88 86 C86 100 78 106 68 106 C58 106 50 100 50 88 Z" fill="{FUR}"/>')
    hull = g(f'''    <path d="M42 80 L94 80 L100 96 L92 112 L44 112 L38 96 Z" fill="{ARMOR}"/>''') + f'''
  <path d="M42 84 L94 84" stroke="{ARMOR_L}" stroke-width="2"/>
  <path d="M60 90 L78 90 L78 110 L60 110 Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2"/>
  <path d="M60 92 L78 92" stroke="{TEAM}" stroke-width="1.5"/>
  <circle cx="50" cy="100" r="4" fill="#1c1f22" stroke="{BRASS}" stroke-width="1.5"/><circle cx="50" cy="100" r="2" fill="{CYAN}"/>
''' + rivets([(46, 88), (90, 88), (88, 106), (48, 108)])
    arm_far = g(f'''    <path d="M36 62 C22 70 16 88 18 104 L30 104 C30 92 34 80 44 74 Z" fill="{GEAR}"/>
    <path d="M10 104 L36 104 L38 124 L28 130 L12 126 Z" fill="#4a5a5e"/>''')
    arm_near = g(f'''    <path d="M86 60 C104 62 114 78 112 96 L100 98 C100 86 96 76 84 72 Z" fill="#4a5a5e"/>
    <path d="M94 94 L124 94 L126 118 L116 126 L96 122 Z" fill="{GEAR}"/>
    <path d="M100 122 L100 130 M108 124 L108 132 M116 124 L117 131" stroke-width="4"/>''') + f'''
  <path d="M96 100 L122 100 M96 106 L123 106" stroke="{CYAN}" stroke-width="2"/>
  <path d="M90 66 C98 68 104 74 108 82" stroke="#6f8a90" stroke-width="2" fill="none"/>
  <circle cx="98" cy="78" r="3" fill="{ARMOR_D}" stroke="{INK}" stroke-width="1.5"/>'''
    pipes = f'''  <path d="M34 56 C30 40 46 32 52 44" fill="none" stroke="{INK}" stroke-width="5"/>
  <path d="M34 56 C30 40 46 32 52 44" fill="none" stroke="#6f8a90" stroke-width="2.5"/>'''
    h = tr(head(eye="implant"), dx=4, dy=4, s=0.9)
    body = "\n".join([frame_back, pipes, arm_far, legs, pilot, h, hull, arm_near])
    svg("gibbon_brute", body, world=0.3, anchor=(62, 136), note="Gibon-osiłek: egzoszkielet hydrauliczny z ogromnymi pięściami, gibon w ramie.")


def siege():
    legs = g(f'''    <path d="M40 92 L18 118 L14 136 L24 136 L28 120 L50 100 Z" fill="{GEAR}"/>
    <path d="M86 92 L108 118 L112 136 L102 136 L98 120 L76 100 Z" fill="{GEAR}"/>
    <path d="M58 98 L54 124 L50 136 L62 136 L64 124 L68 100 Z" fill="#4a5a5e"/>''')
    body = g(f'''    <path d="M30 80 C30 66 48 58 64 58 C80 58 96 66 96 80 C96 94 80 102 64 102 C48 102 30 94 30 80 Z" fill="{ARMOR}"/>
    <rect x="44" y="86" width="40" height="10" rx="2" fill="{ARMOR_D}"/>''') + f'''
  <path d="M34 76 C40 66 56 62 70 62" stroke="{ARMOR_L}" stroke-width="2" fill="none"/>
  <path d="M46 88 L82 88 L82 94 L46 94 Z" fill="{TEAM_M}"/>
  <path d="M46 89 L82 89" stroke="{TEAM}" stroke-width="1"/>'''
    cannon = g(f'''    <path d="M56 70 L82 40 L96 52 L70 80 Z" fill="{GEAR}"/>
    <ellipse cx="98" cy="38" rx="16" ry="18" transform="rotate(40 98 38)" fill="#2b2e33"/>
    <ellipse cx="99" cy="37" rx="10" ry="12" transform="rotate(40 99 37)" fill="#1c1f22"/>''') + f'''
  <ellipse cx="99" cy="37" rx="7" ry="8.5" transform="rotate(40 99 37)" fill="none" stroke="{CYAN}" stroke-width="2.2"/>
  <ellipse cx="99" cy="37" rx="3" ry="3.8" transform="rotate(40 99 37)" fill="{CYAN_C}"/>
  <path d="M66 62 L74 70 M72 56 L80 64" stroke="{CYAN}" stroke-width="2"/>'''
    cab = g(f'''    <rect x="34" y="62" width="18" height="16" rx="3" fill="#2b2e33"/>''', sw=2.5) + f'''
  <rect x="37" y="66" width="12" height="5" fill="{CYAN}" opacity="0.8"/>
  <path d="M36 62 L32 48" stroke="{INK}" stroke-width="2"/><circle cx="32" cy="47" r="2" fill="{CYAN}"/>'''
    body_ = "\n".join([legs, body, cab, cannon])
    svg("gibbon_siege", body_, world=0.3, anchor=(64, 136), note="Machina gibonów: kroczące działo soniczne na trzech nogach, czasza rezonatora.")


def flyer():
    thrust = f'''  <path d="M34 92 C30 104 34 116 38 122 C42 114 44 104 42 92 Z" fill="{CYAN}" opacity="0.7"/>
  <path d="M36 94 C34 102 36 110 38 114 C40 108 41 100 40 94 Z" fill="{CYAN_C}"/>'''
    pack = g(f'''    <rect x="30" y="62" width="18" height="32" rx="5" fill="#2b2e33"/>
    <path d="M28 70 L4 62 L8 72 L30 80 Z" fill="{ARMOR}"/>''') + f'''
  <path d="M8 66 L28 72" stroke="{TEAM}" stroke-width="3"/>'''
    far_arm = g(f'''    <path d="M56 70 C44 62 30 50 14 46 L12 54 C26 58 40 70 52 80 Z" fill="{FUR_D}"/>
    <circle cx="11" cy="50" r="6" fill="{HAND}"/>''')
    legs = g(f'''    <path d="M58 104 L50 118 L42 122 L46 128 L58 122 L66 108 Z" fill="{FUR_D}"/>
    <path d="M70 106 L68 120 L62 128 L68 132 L78 122 L80 108 Z" fill="{FUR}"/>''')
    near_arm = g(f'''    <path d="M76 70 C92 60 106 48 118 38 L124 44 C114 56 98 70 82 80 Z" fill="{FUR}"/>
    <circle cx="121" cy="40" r="6" fill="{HAND}"/>''') + f'''
  <path d="M84 70 L96 62" stroke="{CYAN}" stroke-width="2"/>'''
    body = "\n".join([thrust, pack, far_arm, legs, TORSO, vest(), near_arm, head(eye="visor")])
    svg("gibbon_flyer", body, world=0.22, anchor=(64, 132), note="Latający gibon: plecak odrzutowy z lotkami, długie ręce rozpostarte.")


if __name__ == "__main__":
    archer(); shield(); brute(); siege(); flyer()
    print("gibbon ok")
