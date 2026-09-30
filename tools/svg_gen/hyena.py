# Hieny: dark fantasy + zdobyczna technika (lasery z odzysku, złom, kości, trofea).
from common import *

FUR = "#b8923a"
FUR_D = "#7d5f24"
FUR_L = "#dcc07a"
SPOT = "#4a3520"
MUZZLE = "#3a2c20"
LASER = "#ff5a36"
LASER_C = "#ffd9b0"
NECRO = "#7dff6a"
NECRO_D = "#2f8a3a"


def head(extra_after_skull="", scar=True, jaw=""):
    s = g(f'''    <path d="M78 22 C78 8 94 6 96 18 C97 26 90 30 84 30 Z" fill="{FUR_D}"/>
    <path d="M46 44 C46 26 60 16 76 18 C92 20 100 32 98 44 C96 58 86 66 72 66 C56 66 46 58 46 44 Z" fill="{FUR}"/>
    <path d="M84 38 C96 34 110 38 114 48 C116 58 108 64 98 64 C90 64 84 60 82 54 Z" fill="{FUR}"/>
{extra_after_skull}
    <path d="M50 30 C44 16 52 4 62 8 L60 12 L65 13 C70 18 68 28 62 34 Z" fill="{FUR}"/>''')
    s += f'''
  <path d="M53 26 C50 18 54 12 59 12 C63 16 62 24 59 30 Z" fill="#3a2a1a"/>
  <path d="M82 22 C82 14 90 12 92 18 C92 22 88 26 85 26 Z" fill="#3a2a1a"/>
  <path d="M92 38 C102 36 111 40 113 48 C114 56 108 62 100 62 C94 62 90 58 90 52 Z" fill="{MUZZLE}"/>
  <ellipse cx="111" cy="45" rx="4" ry="3" fill="#120c08"/>
  <ellipse cx="112" cy="44" rx="1.5" ry="0.8" fill="#6b5a4a"/>
  <path d="M90 56 C96 60 104 60 110 56" fill="none" stroke="#120c08" stroke-width="2"/>
  <path d="M94 57 L95.5 61 L97 58 L98.5 61.5 L100 58.5 L101.5 61.5 L103 58 L104.5 60.5 L106 57.5" fill="#efe6cf" stroke="#120c08" stroke-width="0.8"/>
  <g fill="{SPOT}" opacity="0.8">
    <ellipse cx="58" cy="50" rx="2.5" ry="2"/><ellipse cx="64" cy="58" rx="2" ry="1.6"/><ellipse cx="54" cy="40" rx="2" ry="1.5"/>
  </g>
  <path d="M48 46 C50 58 60 66 72 66 C64 62 56 56 52 44 Z" fill="{FUR_D}" opacity="0.7"/>
  <path d="M78 36 C83 32 90 33 92 38 C88 41 82 41 78 36 Z" fill="#f2c14e" stroke="#120c08" stroke-width="1.5"/>
  <circle cx="86" cy="37" r="2" fill="#120c08"/>
  <path d="M76 32 L92 30" stroke="#2e2016" stroke-width="3" stroke-linecap="round"/>'''
    if scar:
        s += '''
  <path d="M80 24 L86 46" stroke="#b86a5c" stroke-width="2" stroke-linecap="round"/>
  <path d="M80 24 L86 46" stroke="#e0a090" stroke-width="0.8" stroke-linecap="round"/>'''
    s += f'''
  <path d="M70 23 C76 21 84 22 90 27" fill="none" stroke="{FUR_L}" stroke-width="2" stroke-linecap="round"/>'''
    s += jaw
    return s


TAIL = g(f'''    <path d="M46 92 C34 90 24 96 16 108 C26 108 34 104 44 102 Z" fill="#9c7a30"/>
    <path d="M22 100 C14 104 10 112 12 118 C18 116 26 110 30 104 Z" fill="#3a2a1a"/>''')
FAR_LEG = g(f'''    <path d="M52 102 L44 120 L46 128 L58 128 L56 120 L62 106 Z" fill="{FUR_D}"/>
    <path d="M44 124 L44 136 L62 136 L60 124 Z" fill="{METAL_D}"/>''')
TORSO = g(f'    <path d="M38 98 C36 82 46 68 64 64 C80 60 92 68 94 82 C96 98 86 112 70 114 C54 116 40 110 38 98 Z" fill="{FUR}"/>')
NEAR_LEG = g(f'''    <path d="M62 104 L58 122 L60 128 L76 128 L72 120 L78 106 Z" fill="{FUR}"/>
    <path d="M58 122 L58 136 L80 136 L78 124 Z" fill="{METAL}"/>''')
SPOTS = f'''  <g fill="{SPOT}" opacity="0.85">
    <ellipse cx="44" cy="90" rx="3" ry="2"/><ellipse cx="48" cy="80" rx="2.5" ry="2"/>
    <ellipse cx="42" cy="100" rx="2" ry="1.5"/><ellipse cx="66" cy="112" rx="2.5" ry="1.8"/><ellipse cx="30" cy="100" rx="2" ry="1.5"/>
  </g>
  <path d="M40 100 C44 110 56 114 66 114 C54 112 44 106 42 96 Z" fill="{FUR_D}" opacity="0.7"/>'''
MANE = f'''  <path d="M44 28 L40 34 L46 36 L40 42 L46 44 L40 52 L47 53 L42 62 L50 62 L46 70 L56 66 L56 34 Z"
        fill="#2e2016" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>'''
BELT = g(f'''    <path d="M44 100 C56 108 74 110 90 100 L90 106 C74 116 56 114 44 106 Z" fill="{LEATHER}"/>
    <rect x="50" y="102" width="9" height="9" rx="1" fill="{LEATHER_L}"/>''')
SKULL_TROPHY = g(f'''    <path d="M66 106 C66 100 76 100 76 106 C76 110 74 112 72 112 L70 112 C68 112 66 110 66 106 Z" fill="{BONE}"/>''', sw=2) + f'''
  <circle cx="69" cy="106" r="1.3" fill="{INK}"/><circle cx="73" cy="106" r="1.3" fill="{INK}"/>'''


def soldier():
    cleaver = g(f'''    <path d="M88 82 L46 28" stroke="{INK}" stroke-width="7"/>
    <path d="M88 82 L46 28" stroke="{LEATHER_L}" stroke-width="3.5"/>
    <path d="M42 36 L28 10 L46 2 L56 10 L52 15 L60 20 L50 32 Z" fill="{METAL}"/>''') + f'''
  <path d="M30 11 L46 4 L55 10" fill="none" stroke="{METAL_HI}" stroke-width="1.5"/>
  <circle cx="44" cy="18" r="2.2" fill="{METAL_D}"/><path d="M38 24 L48 20" stroke="#6a3a22" stroke-width="2.5" opacity="0.8"/>
  <path d="M60 60 L66 68 M56 55 L62 63" stroke="{TEAM_M}" stroke-width="3"/>'''
    armor = g(f'''    <path d="M56 70 C70 62 88 66 92 80 C94 94 86 106 74 108 C64 110 56 104 55 96 Z" fill="{METAL}"/>''') + f'''
  <path d="M58 74 L90 90 L89 97 L56 81 Z" fill="{TEAM_M}"/>
  <path d="M58 74 L90 90" stroke="{TEAM}" stroke-width="1.2"/>
  <path d="M62 92 C70 98 80 98 88 94" fill="none" stroke="{METAL_D}" stroke-width="2"/>
  <path d="M60 72 C68 66 80 66 88 72" fill="none" stroke="{METAL_L}" stroke-width="1.5"/>
''' + rivets([(64, 100), (72, 102), (80, 100), (86, 84)])
    pauldron = g(f'''    <path d="M70 66 C74 58 90 58 96 66 C98 74 94 80 86 80 C78 80 70 76 70 66 Z" fill="{METAL_L}"/>
    <path d="M76 60 L74 50 L80 58 Z M84 58 L86 48 L89 58 Z" fill="{BONE}"/>''', sw=2.5) + f'''
  <path d="M74 64 C80 60 88 60 92 64" fill="none" stroke="{METAL_HI}" stroke-width="1.5"/>'''
    arm = g(f'''    <path d="M80 70 C90 74 94 82 92 88 L84 90 C84 84 80 80 76 78 Z" fill="{FUR}"/>
    <circle cx="87" cy="84" r="5.5" fill="#9c7a30"/>''')
    far_arm = g(f'    <path d="M58 78 C52 86 54 94 62 98 L68 94 C62 90 62 84 64 80 Z" fill="{FUR_D}"/>')
    body = "\n".join([cleaver, TAIL, FAR_LEG, far_arm, TORSO, SPOTS, NEAR_LEG, BELT, SKULL_TROPHY, armor, MANE, pauldron, arm, head()])
    svg("hyena_soldier", body, note="Hiena-piechur: tasak ze złomu na ramieniu, pancerz z płyt, trofeum z czaszki.")


def archer():
    pass  # hyena_archer.svg — z próbek (karabin laserowy z odzysku)


def shield():
    spear = g(f'''    <path d="M121 20 L121 120" stroke="{INK}" stroke-width="6"/>
    <path d="M121 20 L121 120" stroke="{LEATHER_L}" stroke-width="3"/>
    <path d="M121 2 L126 20 L116 20 Z" fill="{METAL_D}"/>''') + f'''
  <path d="M121 6 L123.5 18 L118.5 18 Z" fill="{LASER}"/><path d="M121 9 L121 17" stroke="{LASER_C}" stroke-width="1"/>'''
    helmet = f'''    <path d="M48 36 C48 22 62 14 76 16 C88 18 96 26 97 36 C84 32 62 32 48 36 Z" fill="{METAL}"/>
    <path d="M70 16 L72 8 L76 16" fill="{BONE}"/>'''
    shield_ = g(f'''    <path d="M70 70 L112 64 L118 72 L116 124 L96 136 L74 128 L68 76 Z" fill="{METAL}"/>
    <path d="M76 76 L110 71 L112 120 L96 129 L78 122 Z" fill="#454a52" stroke-width="1.5"/>''') + f'''
  <path d="M70 82 L117 76 L117 88 L70 94 Z" fill="{TEAM_M}"/>
  <path d="M70 82 L117 76" stroke="{TEAM}" stroke-width="1.2"/>
  <path d="M88 104 C88 96 102 96 102 104 C102 110 99 112 97 112 L93 112 C91 112 88 110 88 104 Z" fill="{BONE}" stroke="{INK}" stroke-width="1.5"/>
  <circle cx="92" cy="104" r="1.8" fill="{INK}"/><circle cx="98" cy="104" r="1.8" fill="{INK}"/>
  <path d="M93 112 L93 115 M95 112 L95 115 M97 112 L97 115" stroke="{BONE}" stroke-width="1.2"/>
  <path d="M104 92 L110 100 L106 106" stroke="{INK}" stroke-width="1.2" fill="none"/>
  <path d="M72 72 L110 67" stroke="{METAL_HI}" stroke-width="1.5"/>
''' + rivets([(73, 78), (114, 74), (114, 118), (76, 122), (96, 132)], r=1.4)
    hand = g(f'    <circle cx="117" cy="80" r="5" fill="#9c7a30"/>')
    body = "\n".join([TAIL, FAR_LEG, TORSO, SPOTS, NEAR_LEG, BELT, MANE, head(extra_after_skull=helmet), spear, shield_, hand])
    svg("hyena_shield", body, world=0.22, note="Hiena-tarczownik: tarcza ze złomu z czaszką, włócznia z laserowym grotem, hełm.")


def brute():
    club = g(f'''    <path d="M96 96 L118 128" stroke="{INK}" stroke-width="9"/>
    <path d="M96 96 L118 128" stroke="{LEATHER}" stroke-width="5"/>
    <path d="M108 120 C106 110 120 104 128 112 C134 120 128 136 118 138 C108 138 104 128 108 120 Z" fill="{METAL}"/>
    <path d="M110 112 L104 106 L114 110 Z M124 108 L128 100 L127 111 Z M129 124 L136 124 L129 130 Z M112 134 L106 140 L116 136 Z" fill="{BONE}" stroke-width="2"/>''', sw=3)
    legs = g(f'''    <path d="M40 104 L32 124 L34 132 L52 132 L52 120 L56 108 Z" fill="{FUR_D}"/>
    <path d="M30 126 L30 138 L54 138 L52 126 Z" fill="{METAL_D}"/>
    <path d="M66 108 L62 126 L64 132 L84 132 L80 120 L84 108 Z" fill="{FUR}"/>
    <path d="M60 126 L60 138 L86 138 L84 126 Z" fill="{METAL}"/>''')
    tail = g(f'''    <path d="M28 88 C18 88 10 96 6 106 C14 106 22 102 30 98 Z" fill="#9c7a30"/>''')
    torso = g(f'''    <path d="M24 90 C20 66 40 46 66 44 C92 42 108 60 106 84 C104 104 90 118 66 118 C42 118 26 108 24 90 Z" fill="{FUR}"/>''')
    spots = f'''  <g fill="{SPOT}" opacity="0.85">
    <ellipse cx="34" cy="80" rx="3.5" ry="2.5"/><ellipse cx="40" cy="66" rx="3" ry="2.2"/><ellipse cx="30" cy="96" rx="3" ry="2"/>
    <ellipse cx="46" cy="108" rx="3" ry="2"/>
  </g>
  <path d="M26 94 C32 110 48 118 66 118 C48 112 34 102 30 88 Z" fill="{FUR_D}" opacity="0.7"/>'''
    armor = g(f'''    <path d="M50 58 C66 48 94 52 102 70 C106 88 98 104 82 110 C68 114 56 108 52 98 Z" fill="{METAL}"/>
    <path d="M36 50 C40 38 62 34 70 44 C74 54 66 62 54 62 C42 62 34 58 36 50 Z" fill="{METAL_L}"/>''') + f'''
  <path d="M40 46 C48 40 60 40 66 44" fill="none" stroke="{METAL_HI}" stroke-width="1.8"/>
  <path d="M40 48 L34 38 L44 44 Z M52 42 L50 30 L57 41 Z M62 44 L66 33 L67 46 Z" fill="{BONE}" stroke="{INK}" stroke-width="2"/>
  <path d="M56 64 C70 72 86 80 100 76" fill="none" stroke="{INK}" stroke-width="5"/>
  <path d="M56 64 C70 72 86 80 100 76" fill="none" stroke="{METAL_L}" stroke-width="3" stroke-dasharray="4 2"/>
  <path d="M62 104 L86 104 L84 128 L74 124 L66 130 Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M64 106 L84 106" stroke="{TEAM}" stroke-width="1.5"/>
  <path d="M70 110 L78 118 M78 110 L70 118" stroke="{TEAM_D}" stroke-width="2"/>
''' + rivets([(60, 90), (72, 96), (86, 94), (96, 80), (92, 64)])
    arm = g(f'''    <path d="M88 66 C102 70 108 84 104 98 L92 100 C94 90 90 80 82 76 Z" fill="{FUR}"/>
    <circle cx="98" cy="98" r="8" fill="#9c7a30"/>''') + f'''
  <path d="M88 76 L100 82 M86 82 L99 88" stroke="{BONE}" stroke-width="2.5"/>'''
    jaw = f'''
  <path d="M88 58 L110 56 L112 62 L96 66 L88 64 Z" fill="{METAL}" stroke="{INK}" stroke-width="1.8" stroke-linejoin="round"/>
  <circle cx="92" cy="61" r="1" fill="{METAL_HI}"/><circle cx="106" cy="59" r="1" fill="{METAL_HI}"/>'''
    h = tr(head(jaw=jaw), dx=12, dy=14, s=0.82)
    mane = f'''  <path d="M50 30 L44 36 L50 38 L44 44 L51 46 L46 54 L54 52 L56 40 Z" fill="#2e2016" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>'''
    body = "\n".join([tail, legs, torso, spots, armor, mane, h, club, arm])
    svg("hyena_brute", body, world=0.3, anchor=(60, 136), note="Hiena-osiłek: garb, płyty i łańcuch, maczuga z kolcami z kości, klamra na szczęce.")


def siege():
    wheel = lambda cx, cy, r: g(f'''    <circle cx="{cx}" cy="{cy}" r="{r}" fill="#5a4630"/>
    <circle cx="{cx}" cy="{cy}" r="{r*0.35}" fill="{METAL}"/>''') + f'''
  <path d="M{cx-r+4} {cy} L{cx+r-4} {cy} M{cx} {cy-r+4} L{cx} {cy+r-4} M{cx-r*0.6} {cy-r*0.6} L{cx+r*0.6} {cy+r*0.6} M{cx-r*0.6} {cy+r*0.6} L{cx+r*0.6} {cy-r*0.6}" stroke="{INK}" stroke-width="2.5"/>
  <circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{BONE_D}" stroke-width="2.5" stroke-dasharray="5 3"/>'''
    frame = g(f'''    <path d="M14 104 L114 104 L114 114 L14 114 Z" fill="#6a5238"/>
    <path d="M52 104 L64 60 L74 60 L86 104 L78 104 L69 70 L60 104 Z" fill="#6a5238"/>
    <path d="M98 76 L98 104" stroke-width="3"/>''')
    arm = g(f'''    <path d="M72 70 L26 26" stroke="{INK}" stroke-width="8"/>
    <path d="M72 70 L26 26" stroke="#8a6a44" stroke-width="4.5"/>
    <path d="M14 26 C14 14 34 12 36 24 C36 32 28 36 22 36 C16 36 14 32 14 26 Z" fill="{LEATHER}"/>''')
    rock = f'''  <circle cx="25" cy="21" r="8" fill="#2a3a2a" stroke="{INK}" stroke-width="2"/>
  <circle cx="25" cy="21" r="5" fill="{NECRO_D}"/>
  <circle cx="23" cy="19" r="2.2" fill="{NECRO}"/>'''
    weight = g(f'''    <path d="M96 74 L100 74 L100 80" stroke-width="2"/>
    <path d="M88 82 C88 72 110 72 110 82 C110 92 104 96 99 96 C94 96 88 92 88 82 Z" fill="{BONE}"/>''') + f'''
  <circle cx="94" cy="82" r="2.6" fill="{INK}"/><circle cx="104" cy="82" r="2.6" fill="{INK}"/>
  <path d="M96 90 L96 94 M99 90 L99 95 M102 90 L102 94" stroke="{INK}" stroke-width="1.5"/>
  <circle cx="94" cy="82" r="1" fill="{NECRO}"/><circle cx="104" cy="82" r="1" fill="{NECRO}"/>'''
    lash = f'''  <path d="M60 70 L78 64 M56 86 L82 80 M20 104 L20 114 M40 104 L40 114 M88 104 L88 114 M108 104 L108 114" stroke="{BONE_D}" stroke-width="2.5"/>
  <path d="M16 106 L112 106" stroke="#8a6a44" stroke-width="1.5"/>'''
    banner = g(f'''    <path d="M10 104 L10 52" stroke-width="3"/>
    <path d="M10 54 L30 58 L28 72 L32 84 L10 80 Z" fill="{TEAM_M}"/>''') + f'''
  <path d="M12 58 L28 61" stroke="{TEAM}" stroke-width="1.5"/>'''
    body = "\n".join([banner, frame, lash, arm, rock, weight, wheel(34, 120, 16), wheel(94, 120, 16)])
    svg("hyena_siege", body, world=0.3, anchor=(64, 136), note="Machina hien: katapulta z kości i złomu, miota zielonym kamieniem dusz; przeciwwaga z czaszki.")


def flyer():
    wing_far = g(f'''    <path d="M58 62 C48 44 30 30 6 24 C10 32 12 36 18 40 C12 42 10 46 14 50 C20 50 22 54 22 58 C32 60 42 66 50 72 Z" fill="#2e2622"/>''')
    body = g(f'''    <path d="M44 70 C44 58 58 52 72 54 C86 56 92 66 90 76 C88 88 76 94 62 94 C50 94 44 84 44 70 Z" fill="#3a302a"/>
    <path d="M46 84 L30 96 L40 96 L34 104 L50 94 Z" fill="#2e2622"/>
    <path d="M60 92 L56 106 L62 104 M72 92 L74 106 L78 102" fill="none" stroke-width="2.5"/>''')
    neck = g(f'''    <path d="M80 60 C86 48 92 40 100 38 C108 38 112 44 110 50 C106 54 100 54 96 58 C92 64 88 68 84 70 Z" fill="#b89080"/>''')
    mask = g(f'''    <path d="M96 34 C102 28 112 30 114 38 L124 46 L114 48 C112 52 104 52 100 48 C96 46 94 40 96 34 Z" fill="{BONE}"/>''', sw=2.2) + f'''
  <circle cx="104" cy="39" r="2.4" fill="{INK}"/><circle cx="104" cy="39" r="1" fill="{NECRO}"/>
  <path d="M116 44 L123 46" stroke="{INK}" stroke-width="1.2"/>'''
    ruff = f'''  <path d="M74 60 L78 52 L82 58 L86 50 L88 60 L92 56 L90 66 Z" fill="#5a4a40" stroke="{INK}" stroke-width="1.8" stroke-linejoin="round"/>'''
    harness = f'''  <path d="M52 64 C62 76 76 80 88 74 L88 80 C76 86 60 82 50 70 Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2"/>
  <path d="M52 66 C62 77 76 81 88 76" stroke="{TEAM}" stroke-width="1" fill="none"/>
  <circle cx="70" cy="78" r="2.5" fill="{BRASS}" stroke="{INK}" stroke-width="1"/>'''
    wing_near = g(f'''    <path d="M58 70 C58 48 66 22 86 2 C86 10 86 14 84 18 C90 16 92 20 88 26 C84 28 84 32 84 36 C80 40 76 50 74 66 Z" fill="#4a3e36"/>''') + f'''
  <path d="M64 62 C66 44 72 26 84 8" stroke="#6a5a4e" stroke-width="1.5" fill="none"/>
  <path d="M84 24 L78 28 M84 34 L78 36" stroke="{INK}" stroke-width="1.2"/>'''
    s = "\n".join([wing_far, body, harness, wing_near, neck, ruff, mask])
    svg("hyena_flyer", s, world=0.24, anchor=(64, 108), note="Latający hien: sęp padlinożerca w kościanej masce, uprząż w barwach drużyny.")


if __name__ == "__main__":
    soldier(); shield(); brute(); siege(); flyer()
    print("hyena ok")
