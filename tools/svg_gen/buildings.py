# Budynki: wspólne dla ras — fortyfikacje frontu (kamień, stal, worki z piaskiem), technika i odrobina
# magii (kryształy). Rzut 3/4, podstawa = kamienna płyta; kolor drużyny na proporcach i pasach.
from common import *

STONE = "#7d776a"
STONE_S = "#4f4a42"
STONE_D = "#2e2a24"
SAND = "#8a7a5a"
WOOD = "#6a4a2e"
WOOD_L = "#8a6a44"
ROOF = "#4a3a30"
LASER = "#ff5a36"
LASER_C = "#ffd9b0"
PLASMA = "#ff9a2c"
PLASMA_C = "#fff0b0"
ICE = "#8fd8ff"
ICE_L = "#d8f4ff"
ICE_D = "#3a7aa8"
GOLD = "#ffd24a"
GOLD_L = "#fff4b8"
GOLD_D = "#b8871a"


def platform(rx=52, cy=132, h=18, bags=True):
    s = g(f'''    <path d="M{64-rx} {cy} L{64-rx} {cy+h} C{64-rx} {cy+h+12} {64-rx*0.5} {cy+h+20} 64 {cy+h+20} C{64+rx*0.5} {cy+h+20} {64+rx} {cy+h+12} {64+rx} {cy+h} L{64+rx} {cy} Z" fill="{STONE_S}"/>
    <ellipse cx="64" cy="{cy}" rx="{rx}" ry="{rx*0.37}" fill="{STONE}"/>''')
    s += f'''
  <g stroke="{STONE_D}" stroke-width="1.5" fill="none">
    <path d="M{64-rx} {cy+10} C{64-rx*0.6} {cy+20} {64+rx*0.6} {cy+20} {64+rx} {cy+10}"/>
    <path d="M{64-rx*0.66} {cy+18} L{64-rx*0.66} {cy+28} M{64-rx*0.22} {cy+22} L{64-rx*0.22} {cy+36} M{64+rx*0.22} {cy+22} L{64+rx*0.22} {cy+36} M{64+rx*0.66} {cy+18} L{64+rx*0.66} {cy+28}"/>
    <path d="M{64-rx*0.7} {cy-8} L{64-rx*0.35} {cy-14} M{64+rx*0.4} {cy-14} L{64+rx*0.75} {cy-8}"/>
  </g>
  <path d="M{64+rx*0.62} {cy+18} L{64+rx*0.82} {cy+14} L{64+rx*0.92} {cy+20} L{64+rx*0.76} {cy+28} Z" fill="#2a2622" stroke="{INK}" stroke-width="1.5"/>'''
    if bags:
        s += g(f'''    <path d="M8 {cy+14} C8 {cy+6} 28 {cy+6} 30 {cy+14} C30 {cy+22} 8 {cy+22} 8 {cy+14} Z" fill="{SAND}"/>
    <path d="M4 {cy+26} C4 {cy+20} 20 {cy+20} 22 {cy+26} C22 {cy+33} 4 {cy+33} 4 {cy+26} Z" fill="{SAND}"/>
    <path d="M20 {cy+24} C20 {cy+16} 42 {cy+16} 44 {cy+24} C44 {cy+32} 20 {cy+32} 20 {cy+24} Z" fill="{SAND}"/>''', sw=2.5)
    return s


def banner(x, y, h=30, w=16):
    return g(f'''    <path d="M{x} {y} L{x+w} {y} L{x+w} {y+h} L{x+w-4} {y+h-4} L{x+w/2} {y+h+4} L{x+4} {y+h-4} L{x} {y+h} Z" fill="{TEAM_M}"/>''', sw=2.5) + f'''
  <path d="M{x+2} {y+3} L{x+w-2} {y+3}" stroke="{TEAM}" stroke-width="1.5"/>
  <path d="M{x+w/2-4} {y+10} L{x+w/2+4} {y+10} L{x+w/2} {y+18} Z" fill="{INK}" opacity="0.55"/>'''


def smoke(x, y):
    return f'''  <circle cx="{x}" cy="{y}" r="5" fill="#8a8a8a" opacity="0.45"/><circle cx="{x+4}" cy="{y-9}" r="6.5" fill="#9a9a9a" opacity="0.35"/>
  <circle cx="{x+1}" cy="{y-20}" r="7.5" fill="#aaaaaa" opacity="0.25"/>'''


def cannon():
    bunker = g(f'''    <path d="M26 128 L26 96 C26 80 44 70 64 70 C84 70 102 80 102 96 L102 128 C90 138 38 138 26 128 Z" fill="{METAL}"/>
    <path d="M64 70 C84 70 102 80 102 96 L102 128 C96 133 82 136 64 137 Z" fill="{METAL_D}" stroke="none"/>
    <ellipse cx="64" cy="94" rx="36" ry="14" fill="#4b5058"/>
    <rect x="44" y="108" width="40" height="8" rx="2" fill="#1c1e22"/>''') + f'''
  <path d="M26 104 C40 112 88 112 102 104 L102 112 C88 120 40 120 26 112 Z" fill="{TEAM_M}"/>
  <path d="M26 104 C40 112 88 112 102 104" stroke="{TEAM}" stroke-width="1.2" fill="none"/>
  <path d="M34 90 C44 84 58 82 70 82" stroke="{METAL_HI}" stroke-width="1.8" fill="none"/>
  <rect x="48" y="110" width="8" height="4" fill="{PLASMA}"/>
''' + rivets([(32, 122), (96, 122), (48, 128), (80, 128)], r=1.4)
    svg("b_cannon", platform() + "\n" + bunker, h=176, anchor=(64, 140), world=0.36, scale=1,
        note="Armata: stalowy bunkier z moździerzem plazmowym (lufa osobno: b_cannon_gun).")
    gun = g(f'''    <circle cx="14" cy="16" r="12" fill="#4b5058"/>
    <path d="M14 7 L50 4 L56 10 L56 22 L50 28 L14 25 Z" fill="#2b2e33"/>
    <rect x="54" y="2" width="10" height="28" rx="3" fill="{METAL_D}"/>''') + f'''
  <path d="M24 6 L24 26 M32 5.5 L32 26.5 M40 5 L40 27" stroke="{PLASMA}" stroke-width="2.2"/>
  <path d="M18 9 L50 7" stroke="{METAL_HI}" stroke-width="1.5"/>
  <rect x="60" y="9" width="3" height="14" fill="{PLASMA}"/><rect x="61" y="12" width="1.5" height="8" fill="{PLASMA_C}"/>
  <circle cx="14" cy="16" r="4" fill="{PLASMA}"/>'''
    svg("b_cannon_gun", gun, w=68, h=32, anchor=(14, 16), world=0.36, scale=1, note="Lufa moździerza plazmowego.")


def frost():
    base = g(f'''    <path d="M34 130 L40 100 L88 100 L94 130 C84 138 44 138 34 130 Z" fill="{METAL}"/>
    <ellipse cx="64" cy="100" rx="24" ry="8" fill="#4b5058"/>
    <rect x="22" y="104" width="12" height="26" rx="4" fill="#5a8aa8"/>
    <rect x="94" y="104" width="12" height="26" rx="4" fill="#5a8aa8"/>''') + f'''
  <path d="M24 110 L32 110 M96 110 L104 110" stroke="{ICE_L}" stroke-width="1.5"/>
  <path d="M36 118 C48 124 80 124 92 118 L92 126 C80 132 48 132 36 126 Z" fill="{TEAM_M}"/>
  <path d="M36 118 C48 124 80 124 92 118" stroke="{TEAM}" stroke-width="1.2" fill="none"/>'''
    arms = g(f'''    <path d="M42 100 L30 60 L38 58 L50 98 Z" fill="#4b5058"/>
    <path d="M86 100 L98 60 L90 58 L78 98 Z" fill="#4b5058"/>''', sw=2.5) + f'''
  <path d="M34 62 L40 60 M94 62 L88 60" stroke="{ICE}" stroke-width="2"/>'''
    crystal = g(f'''    <path d="M64 18 L80 52 L72 86 L64 92 L56 86 L48 52 Z" fill="{ICE}"/>''', sw=2.5) + f'''
  <path d="M64 18 L56 86 L48 52 Z" fill="{ICE_L}" opacity="0.8"/>
  <path d="M64 18 L72 86 L80 52 Z" fill="{ICE_D}" opacity="0.7"/>
  <path d="M64 30 L62 70" stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>
  <path d="M40 40 L44 30 L48 40 L44 50 Z M86 34 L89 26 L92 34 L89 42 Z" fill="{ICE_L}" stroke="{INK}" stroke-width="1.5"/>'''
    frost_ = f'''  <path d="M26 132 L32 128 L30 136 Z M96 134 L102 130 L100 138 Z M58 144 L64 140 L66 146 Z" fill="{ICE_L}" opacity="0.8"/>'''
    svg("b_frost", platform(bags=False) + "\n" + base + "\n" + arms + "\n" + crystal + "\n" + frost_, h=176,
        anchor=(64, 140), world=0.36, scale=1, note="Mróz: kryształ lodu (magia) unoszony w ramie z chłodnicami (technika).")


def barracks():
    hall = g(f'''    <path d="M16 132 L16 92 L112 92 L112 132 C96 140 32 140 16 132 Z" fill="#5a4e44"/>
    <path d="M64 92 L112 92 L112 132 C104 136 88 138 64 139 Z" fill="#453b33" stroke="none"/>
    <path d="M8 96 L30 56 L98 56 L120 96 Z" fill="{ROOF}"/>
    <path d="M30 56 L64 40 L98 56 Z" fill="#5a463a"/>
    <path d="M50 138 L50 108 C50 100 78 100 78 108 L78 138 Z" fill="#1c1612"/>''') + f'''
  <path d="M14 90 L114 90" stroke="{METAL}" stroke-width="4"/>
  <path d="M18 100 L46 100 M82 100 L110 100 M20 114 L46 114 M82 114 L108 114" stroke="#3a3028" stroke-width="2"/>
  <path d="M20 84 L40 64 M36 86 L52 64 M76 64 L92 86 M88 64 L108 86" stroke="#3a2c24" stroke-width="2"/>
  <path d="M54 108 L74 108 M54 118 L74 118 M54 128 L74 128" stroke="{METAL}" stroke-width="2.5"/>
  <path d="M40 60 C52 52 66 48 78 50" stroke="#7a6454" stroke-width="2" fill="none"/>
  <rect x="24" y="104" width="12" height="10" fill="#1c1612" stroke="{INK}" stroke-width="1.5"/>
  <rect x="92" y="104" width="12" height="10" fill="#ffb84a" stroke="{INK}" stroke-width="1.5" opacity="0.9"/>
''' + rivets([(18, 96), (110, 96), (18, 126), (110, 126)], r=1.4)
    b = banner(56, 60, 26, 16)
    svg("b_barracks", platform(rx=56) + "\n" + hall + "\n" + b + "\n" + smoke(96, 44), h=176, anchor=(64, 140), world=0.36, scale=1,
        note="Koszary: umocniona hala z blachą i belkami, brama, proporzec drużyny.")


def range_():
    tower = g(f'''    <path d="M30 132 L40 50 L48 50 L42 132 Z" fill="{WOOD}"/>
    <path d="M86 132 L80 50 L88 50 L98 132 Z" fill="{WOOD}"/>
    <path d="M36 96 L92 96 L92 102 L36 102 Z" fill="{WOOD_L}"/>
    <path d="M28 44 L100 44 L96 58 L32 58 Z" fill="{WOOD_L}"/>
    <path d="M24 44 L64 18 L104 44 Z" fill="{ROOF}"/>''') + f'''
  <path d="M40 60 L86 94 M88 60 L42 94 M42 104 L84 128 M86 104 L44 128" stroke="{WOOD}" stroke-width="3"/>
  <path d="M34 50 L94 50" stroke="#5a3e24" stroke-width="1.5"/>
  <path d="M40 30 C50 24 62 20 72 21" stroke="#6a5446" stroke-width="2" fill="none"/>'''
    target = g(f'''    <circle cx="104" cy="104" r="14" fill="#e8dcc0"/>
    <path d="M104 118 L100 134 M104 118 L108 134" stroke-width="3"/>''', sw=2.5) + f'''
  <circle cx="104" cy="104" r="9" fill="{TEAM_M}"/><circle cx="104" cy="104" r="4" fill="#e8dcc0"/>
  <path d="M100 100 L112 94 M106 108 L116 106" stroke="{INK}" stroke-width="1.5"/>
  <path d="M112 94 L116 92 M116 106 L120 105" stroke="{LASER}" stroke-width="2"/>'''
    lookout = f'''  <rect x="54" y="30" width="20" height="10" fill="#1c1612" stroke="{INK}" stroke-width="1.5"/>
  <path d="M58 36 L70 36" stroke="{LASER}" stroke-width="2"/>'''
    svg("b_range", platform(bags=False) + "\n" + tower + "\n" + lookout + "\n" + target, h=176, anchor=(64, 140), world=0.36, scale=1,
        note="Strzelnica: drewniana wieża obserwacyjna z tarczą strzelniczą w barwach drużyny.")


def workshop():
    shed = g(f'''    <path d="M20 132 L20 86 L96 86 L96 132 C84 140 32 140 20 132 Z" fill="#5a5048"/>
    <path d="M14 90 L58 62 L102 90 Z" fill="{ROOF}"/>
    <rect x="30" y="102" width="40" height="30" fill="#1c1612"/>
    <rect x="98" y="60" width="12" height="72" fill="#5a4e44"/>''') + f'''
  <path d="M32 106 L68 106 M32 114 L68 114 M32 122 L68 122" stroke="{METAL}" stroke-width="2"/>
  <path d="M20 98 C40 104 76 104 96 98 L96 104 C76 110 40 110 20 104 Z" fill="{TEAM_M}"/>
  <path d="M20 98 C40 104 76 104 96 98" stroke="{TEAM}" stroke-width="1.2" fill="none"/>
  <rect x="82" y="104" width="10" height="10" fill="#ff8a2a" stroke="{INK}" stroke-width="1.5"/>
  <path d="M30 70 C42 64 52 62 58 62" stroke="#7a6454" stroke-width="2" fill="none"/>'''
    crane = g(f'''    <path d="M104 60 L104 20" stroke-width="5"/>
    <path d="M104 22 L40 30 L40 36 L104 30 Z" fill="#b88a2a"/>
    <path d="M52 34 L52 58" stroke-width="1.5"/>''', sw=3) + f'''
  <path d="M104 60 L104 20" stroke="{METAL}" stroke-width="2.5"/>
  <path d="M48 58 L56 58 L56 66 L48 66 Z" fill="{METAL}" stroke="{INK}" stroke-width="1.5"/>
  <path d="M60 26 L68 34 M76 24 L84 32 M92 22 L100 30" stroke="#7a5a1a" stroke-width="1.5"/>'''
    gear = g(f'''    <circle cx="28" cy="62" r="12" fill="{METAL}"/>
    <circle cx="28" cy="62" r="4" fill="{METAL_D}"/>''', sw=2.5) + f'''
  <path d="M28 46 L28 50 M28 74 L28 78 M12 62 L16 62 M40 62 L44 62 M17 51 L20 54 M36 70 L39 73 M39 51 L36 54 M20 70 L17 73" stroke="{INK}" stroke-width="4"/>'''
    svg("b_workshop", platform(rx=56) + "\n" + shed + "\n" + gear + "\n" + crane + "\n" + smoke(104, 50), h=176, anchor=(64, 140), world=0.36, scale=1,
        note="Warsztat: szopa z bramą, dźwig, koło zębate, kuźnia z dymem.")


def extractor():
    rig = g(f'''    <path d="M36 128 L54 28 L74 28 L92 128 Z" fill="none" stroke-width="5"/>
    <rect x="44" y="96" width="40" height="30" rx="3" fill="{METAL}"/>
    <rect x="56" y="20" width="16" height="10" fill="{METAL}"/>''') + f'''
  <path d="M36 128 L54 28 L74 28 L92 128" stroke="#b8872a" stroke-width="2.5" fill="none"/>
  <path d="M44 88 L84 88 M48 66 L80 66 M52 46 L76 46 M42 100 L58 66 M86 100 L70 66 M50 66 L60 46 M78 66 L68 46" stroke="#8a6420" stroke-width="2"/>
  <path d="M64 30 L64 130" stroke="{INK}" stroke-width="5"/><path d="M64 30 L64 130" stroke="{METAL_HI}" stroke-width="2"/>
  <path d="M44 104 C56 110 72 110 84 104 L84 112 C72 118 56 118 44 112 Z" fill="{TEAM_M}"/>
  <path d="M44 104 C56 110 72 110 84 104" stroke="{TEAM}" stroke-width="1.2" fill="none"/>
  <rect x="48" y="116" width="10" height="6" fill="{GOLD}" stroke="{INK}" stroke-width="1"/>
  <path d="M84 116 C98 116 100 124 110 126" stroke="{INK}" stroke-width="5" fill="none"/>
  <path d="M84 116 C98 116 100 124 110 126" stroke="#5a5048" stroke-width="2.5" fill="none"/>
  <circle cx="64" cy="18" r="3" fill="{LASER}" stroke="{INK}" stroke-width="1"/>'''
    crates = g(f'''    <rect x="94" y="118" width="18" height="14" fill="{WOOD_L}"/>
    <path d="M94 118 L112 132 M112 118 L94 132" stroke-width="1.5"/>''', sw=2) + f'''
  <path d="M98 116 L102 110 L106 116 Z" fill="{GOLD}" stroke="{INK}" stroke-width="1.2"/>'''
    svg("b_extractor", rig + "\n" + crates, h=150, anchor=(64, 134), world=0.36, scale=1,
        note="Wydobywacz: wieża wiertnicza nad złożem kryształów, rura i skrzynki z urobkiem.")


def base():
    walls = g(f'''    <path d="M10 170 L10 118 L190 118 L190 170 C160 186 40 186 10 170 Z" fill="#6a645a"/>
    <path d="M100 118 L190 118 L190 170 C176 177 140 183 100 184 Z" fill="#524d45" stroke="none"/>
    <path d="M36 128 L36 44 L164 44 L164 128 Z" fill="#6f695e"/>
    <path d="M100 44 L164 44 L164 128 L100 128 Z" fill="#57524a" stroke="none"/>
    <path d="M80 184 L80 146 C80 132 120 132 120 146 L120 184 Z" fill="#1c1612"/>''') + f'''
  <path d="M8 118 L192 118" stroke="{METAL}" stroke-width="5"/>
  <path d="M84 148 L116 148 M84 158 L116 158 M84 168 L116 168 M84 178 L116 178" stroke="{METAL}" stroke-width="3"/>
  <path d="M100 136 L100 184" stroke="{METAL}" stroke-width="3"/>
  <g stroke="#3a352e" stroke-width="2" fill="none">
    <path d="M36 70 L164 70 M36 96 L164 96 M60 44 L60 70 M100 70 L100 96 M140 44 L140 70 M80 96 L80 128 M124 96 L124 128"/>
    <path d="M10 140 L80 140 M120 140 L190 140 M10 160 L80 160 M120 160 L190 160 M40 118 L40 140 M160 118 L160 140 M60 140 L60 160 M140 140 L140 160"/>
  </g>
  <path d="M130 60 L140 76 L134 90" stroke="{INK}" stroke-width="2" fill="none"/>
  <path d="M28 150 L36 142 L42 152 L34 162 Z" fill="#2a2622" stroke="{INK}" stroke-width="1.5"/>
  <rect x="56" y="80" width="12" height="16" fill="#ffb84a" stroke="{INK}" stroke-width="2" opacity="0.9"/>
  <rect x="132" y="80" width="12" height="16" fill="#1c1612" stroke="{INK}" stroke-width="2"/>'''
    battl = g("\n".join(f'    <rect x="{x}" y="32" width="14" height="14" fill="#7d776a"/>' for x in range(36, 164, 22)))
    towers = g(f'''    <path d="M2 176 L2 88 L38 88 L38 176 C28 182 12 182 2 176 Z" fill="#6f695e"/>
    <path d="M162 176 L162 88 L198 88 L198 176 C188 182 172 182 162 176 Z" fill="#57524a"/>
    <path d="M0 90 L20 64 L40 90 Z" fill="{ROOF}"/>
    <path d="M160 90 L180 64 L200 90 Z" fill="{ROOF}"/>''') + f'''
  <rect x="14" y="104" width="10" height="14" fill="#1c1612" stroke="{INK}" stroke-width="1.5"/>
  <rect x="176" y="104" width="10" height="14" fill="#1c1612" stroke="{INK}" stroke-width="1.5"/>'''
    tech = g(f'''    <path d="M120 32 L124 6" stroke-width="3"/>
    <path d="M110 12 C112 2 136 2 138 12 C132 18 116 18 110 12 Z" fill="{METAL}"/>''', sw=2.5) + f'''
  <circle cx="124" cy="8" r="2.5" fill="{LASER}"/>
  <path d="M70 32 L70 10" stroke="{INK}" stroke-width="3"/><path d="M70 12 L60 4 L80 4 Z" fill="#b48cff" stroke="{INK}" stroke-width="2"/>
  <path d="M70 5 L70 10" stroke="#e8d8ff" stroke-width="1.5"/>'''
    flags = banner(48, 48, 34, 20) + "\n" + banner(132, 48, 34, 20) + "\n" + banner(90, 100, 26, 20)
    svg("b_base", walls + "\n" + battl + "\n" + towers + "\n" + tech + "\n" + flags, w=200, h=190, anchor=(100, 172), world=0.55, scale=0.9,
        note="Forteca: kamienny donżon z blankami, dwie baszty, brama z kratą, antena i kryształ na dachu, sztandary drużyny.")


def drill_turret():
    legs = g(f'''    <path d="M64 96 L30 136 M64 96 L98 136 M64 96 L64 140" stroke-width="6"/>''') + f'''
  <path d="M64 96 L30 136 M64 96 L98 136 M64 96 L64 140" stroke="#b8872a" stroke-width="3"/>'''
    body = g(f'''    <rect x="44" y="70" width="40" height="30" rx="6" fill="#d9a032"/>
    <rect x="52" y="60" width="14" height="12" fill="{METAL}"/>''') + f'''
  <path d="M44 84 L84 84 L84 90 L44 90 Z" fill="{TEAM_M}"/>
  <path d="M44 85 L84 85" stroke="{TEAM}" stroke-width="1"/>
  <circle cx="54" cy="76" r="3" fill="#ffc233" stroke="{INK}" stroke-width="1"/>'''
    svg("b_drill_turret", legs + "\n" + body, h=150, anchor=(64, 138), world=0.34, scale=1, note="Wiertło-wieżyczka Sapera: trójnóg z obrotowym wiertłem.")
    gun = g(f'''    <rect x="4" y="6" width="22" height="16" rx="4" fill="#d9a032"/>
    <path d="M26 5 L58 14 L26 23 Z" fill="{METAL_L}"/>''', sw=2.5) + f'''
  <path d="M32 7 L34 21 M40 9 L42 19 M48 11 L49 17" stroke="{INK}" stroke-width="1.5"/>
  <path d="M28 8 L54 13" stroke="{METAL_HI}" stroke-width="1.2"/>'''
    svg("b_drill_turret_gun", gun, w=62, h=28, anchor=(12, 14), world=0.34, scale=1, note="Obrotowe wiertło wieżyczki.")


def volcano():
    cone = g(f'''    <path d="M8 136 C20 120 36 70 50 50 L78 50 C92 70 108 120 120 136 C96 146 32 146 8 136 Z" fill="#3a2e28"/>
    <ellipse cx="64" cy="50" rx="14" ry="5" fill="#ff6a1a"/>''') + f'''
  <path d="M60 50 C58 70 50 90 46 120 L52 120 C56 96 62 74 64 52 Z" fill="#ff6a1a" stroke="{INK}" stroke-width="1.5"/>
  <path d="M70 52 C74 72 84 92 94 112 L88 114 C80 94 72 76 68 54 Z" fill="#ff8a2a" stroke="{INK}" stroke-width="1.5"/>
  <path d="M61 56 C59 72 54 90 50 112" stroke="#ffd060" stroke-width="1.5" fill="none"/>
  <path d="M24 120 C34 100 40 80 48 62" stroke="#5a4a40" stroke-width="2" fill="none"/>
  <path d="M40 130 L46 122 L52 128 L58 118 L66 128 L74 120 L80 128 L88 122 L92 132" fill="none" stroke="{TEAM_M}" stroke-width="3"/>
  <circle cx="58" cy="40" r="4" fill="#ff8a2a" opacity="0.7"/><circle cx="70" cy="30" r="3" fill="#ffd060" opacity="0.7"/>
  <circle cx="62" cy="22" r="6" fill="#5a4a44" opacity="0.4"/><circle cx="70" cy="12" r="7" fill="#6a5a54" opacity="0.3"/>'''
    svg("b_volcano", cone, h=150, anchor=(64, 138), world=0.36, scale=1, note="Wulkan Magmy (magia ognia): stożek z lawą, runy drużyny u podstawy.")


def totem(name, eye_col, top, note, gun=False):
    pole = g(f'''    <path d="M50 138 L50 40 L78 40 L78 138 Z" fill="{WOOD}"/>
    <path d="M44 138 C44 130 84 130 84 138 C84 144 44 144 44 138 Z" fill="#4a3a2a"/>''') + f'''
  <path d="M50 70 L78 70 M50 104 L78 104" stroke="{INK}" stroke-width="2.5"/>
  <path d="M54 80 L60 90 L54 98 M74 80 L68 90 L74 98" stroke="{eye_col}" stroke-width="2.4" fill="none"/>
  <path d="M56 112 L72 112 L72 128 L56 128 Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2"/>
  <path d="M56 113.5 L72 113.5" stroke="{TEAM}" stroke-width="1"/>
  <path d="M52 44 L56 132" stroke="{WOOD_L}" stroke-width="2"/>'''
    svg(name, pole + "\n" + top, h=150, anchor=(64, 140), world=0.34, scale=1, note=note)


def totems():
    # głowa dzika z oczami-runami: wieżyczka (strzela), puls (leczy), odpychacz (róg)
    head_ = lambda col: g(f'''    <path d="M42 44 C40 28 52 16 64 16 C76 16 88 28 86 44 L92 48 L86 54 C80 60 48 60 42 54 L36 48 Z" fill="{WOOD_L}"/>
    <path d="M44 20 L38 4 L52 14 Z M84 20 L90 4 L76 14 Z" fill="{WOOD}"/>
    <path d="M40 52 C36 44 36 36 40 30 C42 38 44 44 48 50 Z M88 52 C92 44 92 36 88 30 C86 38 84 44 80 50 Z" fill="#efe6cf"/>''') + f'''
  <circle cx="56" cy="34" r="4" fill="{col}" stroke="{INK}" stroke-width="1.5"/><circle cx="72" cy="34" r="4" fill="{col}" stroke="{INK}" stroke-width="1.5"/>
  <ellipse cx="64" cy="48" rx="8" ry="5" fill="#8a5a44" stroke="{INK}" stroke-width="1.5"/>'''
    totem("b_totem_turret", "#ff9a3c", head_("#ff9a3c"), "Totem-wieżyczka Inżyniera (magia): głowa dzika z oczami-runami miota ogniste pociski.")
    heal = head_("#7dff9a") + f'''
  <path d="M64 6 L64 -2 M60 2 L68 2" stroke="#7dff9a" stroke-width="2.5"/>
  <circle cx="30" cy="70" r="3" fill="#7dff9a" opacity="0.7"/><circle cx="98" cy="84" r="2.5" fill="#7dff9a" opacity="0.7"/>'''
    totem("b_pulse_totem", "#7dff9a", heal, "Totem pulsu (magia): leczy własne jednostki — zielone runy.")
    horn = g(f'''    <path d="M50 44 C40 28 44 12 60 6 C58 18 62 28 70 36 Z" fill="#efe6cf"/>
    <path d="M42 44 L86 44 L80 58 L48 58 Z" fill="{WOOD_L}"/>''') + f'''
  <path d="M52 16 L58 20 M48 26 L56 28" stroke="#a89c80" stroke-width="2"/>
  <path d="M86 26 C96 24 104 30 108 38 M84 34 C94 34 100 40 102 48" stroke="#8fd8ff" stroke-width="2.5" fill="none" opacity="0.8"/>
  <circle cx="64" cy="51" r="3.5" fill="#8fd8ff" stroke="{INK}" stroke-width="1.2"/>'''
    totem("b_repeller", "#8fd8ff", horn, "Odpychacz (magia): totem z rogiem wojennym — podmuch cofa wrogów.")


def hydra():
    # przywołaniec zająca (Przywoływacz): omszały kopiec, z którego wyrastają trzy łby węża-ducha
    mound = g(f'''    <path d="M12 136 C14 112 36 96 64 96 C92 96 114 112 116 136 C92 146 36 146 12 136 Z" fill="{STONE_S}"/>
    <path d="M22 118 C34 104 52 100 64 100 C60 108 44 114 30 126 Z" fill="#4a6a3a"/>''') + f'''
  <path d="M40 132 L46 124 L52 130 L58 122 L66 130 L74 122 L80 130 L88 124 L92 134" fill="none" stroke="{TEAM_M}" stroke-width="3"/>
  <path d="M80 104 C90 106 100 112 106 122" stroke="#4a6a3a" stroke-width="3" fill="none"/>'''

    def neck(x0, x1, y1, lean):
        return g(f'''    <path d="M{x0-8} 110 C{x0-8} 90 {x1-10} {y1+26} {x1-6} {y1+6} L{x1+8} {y1+8} C{x1+4} {y1+30} {x0+8} 92 {x0+8} 110 Z" fill="#5a8a4a"/>
    <path d="M{x1-10} {y1} C{x1-8} {y1-12} {x1+10} {y1-14} {x1+16+lean} {y1-4} L{x1+24+lean} {y1+2} L{x1+14+lean} {y1+6} C{x1+8} {y1+12} {x1-8} {y1+12} {x1-10} {y1} Z" fill="#6aa058"/>''') + f'''
  <circle cx="{x1+6}" cy="{y1-4}" r="2.4" fill="#d8ff70" stroke="{INK}" stroke-width="1"/>
  <path d="M{x1+14+lean} {y1+4} L{x1+20+lean} {y1+10} L{x1+22+lean} {y1+6}" stroke="#e87060" stroke-width="1.5" fill="none"/>
  <path d="M{x0-4} 104 C{x0-2} 90 {x1-6} {y1+24} {x1-2} {y1+10}" stroke="#8ac070" stroke-width="1.5" fill="none"/>'''
    heads = neck(40, 32, 58, -2) + "\n" + neck(84, 90, 52, 2) + "\n" + neck(62, 62, 30, 0)
    svg("b_hydra", mound + "\n" + heads, h=150, anchor=(64, 138), world=0.34, scale=1,
        note="Hydra Przywoływacza (magia): omszały kopiec z trzema łbami węża-ducha, runy drużyny u podstawy.")


def sentry():
    # działko jeża-Bastiona: oliwkowy trójnóg z obrotową lufą kolcową
    legs = g('''    <path d="M64 100 L32 136 M64 100 L96 136 M64 100 L64 140" stroke-width="6"/>''') + '''
  <path d="M64 100 L32 136 M64 100 L96 136 M64 100 L64 140" stroke="#4a5530" stroke-width="3"/>'''
    body = g('''    <path d="M40 104 C40 84 50 74 64 74 C78 74 88 84 88 104 Z" fill="#6f7d45"/>''') + f'''
  <path d="M40 96 L88 96 L88 104 L40 104 Z" fill="{TEAM_M}"/>
  <path d="M40 97 L88 97" stroke="{TEAM}" stroke-width="1"/>
  <rect x="58" y="82" width="12" height="6" rx="1" fill="#b8ff4a" stroke="{INK}" stroke-width="1"/>
  <path d="M46 80 L40 70 M56 76 L54 64 M72 76 L74 64 M82 80 L88 70" stroke="{INK}" stroke-width="4"/>
  <path d="M46 80 L40 70 M56 76 L54 64 M72 76 L74 64 M82 80 L88 70" stroke="#8b939e" stroke-width="2"/>'''
    svg("b_sentry", legs + "\n" + body, h=150, anchor=(64, 138), world=0.34, scale=1,
        note="Działko Bastiona (sci-fi): oliwkowy trójnóg z grzebieniem stalowych kolców.")
    gun = g('''    <rect x="4" y="6" width="22" height="16" rx="4" fill="#4a5530"/>
    <rect x="26" y="9" width="30" height="10" rx="2" fill="#3b3f45"/>''', sw=2.5) + '''
  <path d="M30 11 L52 11" stroke="#8b939e" stroke-width="1.5"/>
  <circle cx="57" cy="14" r="2.5" fill="#b8ff4a"/>'''
    svg("b_sentry_gun", gun, w=62, h=28, anchor=(12, 14), world=0.34, scale=1, note="Obrotowa lufa działka Bastiona.")


if __name__ == "__main__":
    cannon(); frost(); barracks(); range_(); workshop(); extractor(); base(); drill_turret(); volcano(); totems(); hydra()
    sentry()
    print("buildings ok")
