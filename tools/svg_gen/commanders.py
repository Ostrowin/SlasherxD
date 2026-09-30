# Dowódcy (D30): każdy jest albo sci-fi, albo fantasy — w każdej rasie są obie odmiany.
#   krety:  Saper (sci-fi), Snajper (sci-fi), Magma (fantasy)
#   gibony: Żelazny Chwyt (sci-fi), Niszczyciel (sci-fi), Bojowy Rytm (fantasy)
#   hieny:  Nekromanta (fantasy), Padlinożerca (fantasy), Rechot (sci-fi)
#   dziki:  Inżynier Totemów (fantasy), Stratowanie (sci-fi), Kły (fantasy)
#   zające, wydry — commanders_hare_otter.py; niedźwiedzie, wilki, jeże — commanders_bwh.py (uruchamiane też stąd)
from common import *
import hyena as H
import gibbon as GB
import mole as M
import boar as B
import commanders_hare_otter
import commanders_bwh

W = 0.27  # dowódca ~30% większy od piechura


def cmd(name, body, note, world=W, anchor=(64, 136), w=128):
    svg("cmd_" + name, body, w=w, world=world, anchor=anchor, scale=0.85, note=note)


def cape(col=CLOTH, x0=60):
    return g(f'''    <path d="M{x0} 66 C44 70 30 84 24 120 L34 116 L38 126 L46 116 L52 124 L58 112 C60 96 64 82 70 72 Z" fill="{col}"/>''')


# ------------------------------------------------------------------ krety

def sapper():
    pack = g(f'''    <rect x="24" y="58" width="26" height="40" rx="5" fill="{LEATHER}"/>
    <rect x="22" y="62" width="10" height="16" rx="2" fill="#c0392b"/>
    <rect x="22" y="80" width="10" height="16" rx="2" fill="#c0392b"/>''') + f'''
  <path d="M24 66 L30 66 M24 84 L30 84" stroke="{M.LAMP}" stroke-width="2"/>
  <path d="M34 60 C30 46 40 38 48 44" stroke="{INK}" stroke-width="3" fill="none"/><path d="M34 60 C30 46 40 38 48 44" stroke="#c0392b" stroke-width="1.5" fill="none"/>'''
    det = g(f'''    <rect x="84" y="80" width="16" height="22" rx="3" fill="{METAL}"/>
    <path d="M92 80 L92 70" stroke-width="3"/>''', sw=2.5) + f'''
  <circle cx="92" cy="68" r="3.5" fill="#ff3a2a" stroke="{INK}" stroke-width="1.5"/>
  <rect x="87" y="86" width="10" height="5" fill="{M.LAMP}"/>'''
    far = g(f'    <path d="M56 76 C48 84 50 94 58 96 L66 92 C60 90 60 84 62 80 Z" fill="{M.FUR_D}"/>')
    arm = g(f'    <path d="M78 70 C88 74 92 82 90 90 L82 92 C82 86 78 80 74 78 Z" fill="{M.FUR}"/>')
    vest = f'''  <path d="M50 84 L88 84 L86 112 L54 112 Z" fill="#8a6a2a" stroke="{INK}" stroke-width="2.5"/>
  <path d="M52 94 L86 94 M52 104 L86 104" stroke="{M.HELM}" stroke-width="3"/>
  <path d="M56 94 L60 104 M66 94 L70 104 M76 94 L80 104" stroke="{INK}" stroke-width="1.5"/>
  <path d="M60 84 L78 84 L78 90 L60 90 Z" fill="{TEAM_M}"/>'''
    body = "\n".join([pack, far, M.LEGS, M.TORSO, vest, arm, det, M.hand(90, 96, 5.5), M.head()])
    cmd("sapper", body, "Saper (sci-fi): plecak ładunków, detonator, kamizelka ostrzegawcza.")


def sniper():
    cloak = g(f'''    <path d="M58 60 C40 66 30 90 28 128 L40 124 L44 132 L52 122 L60 128 L62 110 C64 92 66 76 72 66 Z" fill="#3a4a3a"/>''')
    rail = g(f'''    <path d="M24 84 L40 80 L42 92 L28 96 Z" fill="{METAL}"/>
    <rect x="38" y="80" width="76" height="9" rx="2" fill="{METAL_D}"/>
    <rect x="58" y="70" width="26" height="8" rx="3" fill="{METAL}"/>
    <path d="M104 92 L100 104 M110 92 L114 104" stroke-width="2.5"/>''', sw=2.5) + f'''
  <path d="M60 80 L60 89 M68 80 L68 89 M76 80 L76 89 M84 80 L84 89 M92 80 L92 89" stroke="#8ad8ff" stroke-width="2.2"/>
  <path d="M42 82 L110 82" stroke="{METAL_HI}" stroke-width="1"/>
  <circle cx="84" cy="74" r="3" fill="#8ad8ff" stroke="{INK}" stroke-width="1"/>
  <rect x="112" y="82" width="4" height="5" fill="#e8f8ff"/>'''
    arm = g(f'    <path d="M78 70 C88 74 92 80 90 88 L82 90 C82 84 78 80 74 78 Z" fill="{M.FUR}"/>')
    hood = f'''
  <path d="M44 42 C44 22 60 12 76 14 C90 16 100 26 100 38 C88 30 60 30 44 42 Z" fill="#3a4a3a" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M60 18 L68 18 L70 30 L60 31 Z" fill="{TEAM_M}"/>
  <circle cx="96" cy="44" r="6.5" fill="{METAL}" stroke="{INK}" stroke-width="1.8"/><circle cx="96" cy="44" r="4" fill="#8ad8ff"/>
  <path d="M96 44 L104 44" stroke="{INK}" stroke-width="1"/>'''
    body = "\n".join([cloak, M.LEGS, M.TORSO, M.overalls(), arm, rail, M.hand(90, 90, 5.5), M.head(helmet=False, goggles="down", extra=hood)])
    cmd("sniper", body, "Snajper (sci-fi): karabin szynowy z cewkami, peleryna maskująca, lunetka na oku.")


def magma():
    robe = g(f'''    <path d="M44 72 C40 96 38 120 36 136 L96 136 C94 118 92 96 88 72 C80 64 52 64 44 72 Z" fill="#3a2220"/>
    <path d="M60 70 L64 136 L72 136 L76 70 Z" fill="#5a2a1e"/>''') + f'''
  <path d="M40 132 L96 132" stroke="#ff6a1a" stroke-width="3"/>
  <path d="M44 124 L50 128 L56 122 L62 128 L70 122 L78 128 L86 122 L92 128" stroke="#ffb040" stroke-width="1.5" fill="none"/>
  <path d="M62 82 L68 92 L74 82 M68 92 L68 100" stroke="#ff8a2a" stroke-width="2" fill="none"/>
  <path d="M46 80 L88 80 L88 86 L46 86 Z" fill="{TEAM_M}"/>'''
    staff = g(f'''    <path d="M100 136 L104 28" stroke-width="7"/>
    <path d="M94 30 L104 8 L114 30 L104 38 Z" fill="#1c1418"/>''') + f'''
  <path d="M100 136 L104 28" stroke="#4a3228" stroke-width="3.5"/>
  <path d="M104 12 L108 28 L104 34 L100 28 Z" fill="#ff6a1a"/><path d="M104 18 L106 28 L104 30 Z" fill="#ffd060"/>
  <circle cx="104" cy="24" r="12" fill="#ff6a1a" opacity="0.2"/>
  <path d="M98 44 C94 50 96 56 100 58 M108 50 C112 56 110 62 106 64" stroke="#ff8a2a" stroke-width="1.5" fill="none" opacity="0.8"/>'''
    arm = g(f'''    <path d="M78 70 C90 72 98 76 100 80 L96 88 C90 84 82 82 74 80 Z" fill="#3a2220"/>''') + M.hand(101, 82, 5.5)
    hood = f'''
  <path d="M42 50 C38 26 56 10 76 12 C92 14 102 26 102 40 C94 34 88 32 80 32 C66 32 54 38 46 56 Z" fill="#3a2220" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M50 30 C58 20 70 16 82 18" stroke="#5a3a2e" stroke-width="2" fill="none"/>
  <circle cx="89" cy="44" r="2.4" fill="#ffb040"/><circle cx="97" cy="43" r="1.8" fill="#ffb040"/>
  <circle cx="89" cy="44" r="5" fill="#ff8a2a" opacity="0.25"/>'''
    body = "\n".join([robe, staff, arm, M.head(helmet=False, goggles="none", extra=hood)])
    cmd("magma", body, "Magma (fantasy): szaman ognia w kapturze, obsydianowy kostur z płomieniem, runy lawy na szacie.")


# ------------------------------------------------------------------ gibony

def iron_grip():
    claws = lambda x, y, s=1: g(f'''    <path d="M{x-12} {y-10} L{x+12} {y-10} L{x+14} {y+8} L{x-14} {y+8} Z" fill="{GB.GEAR}"/>
    <path d="M{x-12} {y+6} L{x-16} {y+22} L{x-8} {y+16} M{x} {y+8} L{x} {y+26} L{x+4} {y+16} M{x+12} {y+6} L{x+16} {y+22} L{x+8} {y+16}" fill="{METAL_L}" stroke-width="2.2"/>''') + f'''
  <path d="M{x-11} {y-4} L{x+11} {y-4}" stroke="{GB.CYAN}" stroke-width="2"/>'''
    far = g(f'''    <path d="M56 70 C40 78 30 96 28 112 L40 114 C42 100 50 88 62 80 Z" fill="{GB.FUR_D}"/>''') + claws(34, 118)
    near = g(f'''    <path d="M76 66 C94 68 104 82 106 98 L94 100 C92 88 86 80 72 78 Z" fill="{GB.FUR}"/>
    <path d="M86 70 L104 72 L108 90 L92 92 Z" fill="{GB.ARMOR}"/>''') + claws(100, 108) + f'''
  <path d="M88 76 L104 78" stroke="{GB.ARMOR_L}" stroke-width="2"/>
  <path d="M86 90 C82 100 84 108 90 110" stroke="{INK}" stroke-width="4" fill="none"/><path d="M86 90 C82 100 84 108 90 110" stroke="#6f8a90" stroke-width="2" fill="none"/>'''
    armor = g(f'''    <path d="M50 74 C58 64 82 64 90 74 C94 88 92 102 84 110 L56 110 C48 102 46 88 50 74 Z" fill="{GB.ARMOR}"/>
    <path d="M44 70 C46 60 60 58 64 66 C62 74 52 76 44 70 Z" fill="{GB.ARMOR_L}"/>''') + f'''
  <path d="M64 70 L74 70 L74 110 L64 110 Z" fill="{TEAM_M}"/><path d="M64 70 L64 110" stroke="{TEAM}" stroke-width="1.2"/>
  <circle cx="82" cy="88" r="5.5" fill="#1c1f22" stroke="{BRASS}" stroke-width="1.5"/><circle cx="82" cy="88" r="3" fill="{GB.CYAN}"/>
''' + rivets([(54, 80), (86, 80), (56, 102), (84, 102)])
    body = "\n".join([far, GB.LEGS, GB.TORSO, armor, GB.head(eye="implant"), near])
    cmd("iron_grip", body, "Żelazny Chwyt (sci-fi): hydrauliczne szpony na obu rękach, ciężki pancerz, implant oka.")


def wrecker():
    hammer = g(f'''    <path d="M86 96 L70 20" stroke-width="7"/>
    <rect x="48" y="4" width="40" height="22" rx="4" fill="{GB.GEAR}" transform="rotate(-12 68 15)"/>
    <rect x="40" y="8" width="10" height="16" rx="2" fill="{METAL_D}" transform="rotate(-12 68 15)"/>''') + f'''
  <path d="M86 96 L70 20" stroke="{METAL}" stroke-width="3.5"/>
  <path d="M40 10 C32 8 26 12 22 16 M40 18 C32 18 28 22 24 26" stroke="{GB.CYAN}" stroke-width="3" fill="none" opacity="0.8" transform="rotate(-12 68 15)"/>
  <path d="M56 8 L56 24 M64 6 L64 24 M72 6 L72 24" stroke="{GB.CYAN}" stroke-width="1.8" transform="rotate(-12 68 15)"/>'''
    far = g(f'''    <path d="M58 70 C42 80 32 100 30 124 L40 126 C42 104 50 88 64 80 Z" fill="{GB.FUR_D}"/>
    <circle cx="35" cy="129" r="7" fill="{GB.HAND}"/>''')
    near = g(f'''    <path d="M76 66 C88 70 92 82 90 96 L80 96 C80 86 78 80 70 78 Z" fill="{GB.FUR}"/>
    <circle cx="86" cy="98" r="6.5" fill="{GB.HAND}"/>''')
    body = "\n".join([hammer, far, GB.LEGS, GB.TORSO, GB.vest(), GB.head(eye="visor", scar=True), near])
    cmd("wrecker", body, "Niszczyciel (sci-fi): młot z odrzutem (cyjanowe dysze), gogle bojowe.")


def warbeat():
    drum = g(f'''    <ellipse cx="96" cy="100" rx="22" ry="10" fill="#e8dcc0"/>
    <path d="M74 100 L74 124 C74 132 118 132 118 124 L118 100 Z" fill="#7a4a2e"/>
    <ellipse cx="96" cy="100" rx="22" ry="10" fill="#e8dcc0"/>''') + f'''
  <path d="M78 106 L84 124 M90 108 L90 128 M102 108 L102 128 M114 106 L108 124" stroke="{INK}" stroke-width="1.5"/>
  <path d="M86 98 L92 104 L100 96 L106 102" stroke="#8adfff" stroke-width="2.2" fill="none"/>
  <path d="M74 112 L118 112" stroke="{TEAM_M}" stroke-width="4"/>
  <path d="M120 88 C126 92 126 100 122 104 M124 82 C132 88 132 102 126 108" stroke="#8adfff" stroke-width="2" fill="none" opacity="0.7"/>'''
    feathers = f'''  <path d="M50 26 L38 8 L46 26 M54 22 L48 2 L56 22" stroke="{INK}" stroke-width="4"/>
  <path d="M50 26 L38 8 M54 22 L48 2" stroke="#c0392b" stroke-width="2.2"/>
  <path d="M46 34 C56 28 76 28 90 32" stroke="{BONE}" stroke-width="4" fill="none"/>
  <circle cx="56" cy="30" r="2" fill="#8adfff"/><circle cx="70" cy="28.5" r="2" fill="#8adfff"/>'''
    far = g(f'''    <path d="M58 70 C46 78 40 90 44 100 L54 98 C52 90 56 84 64 80 Z" fill="{GB.FUR_D}"/>''') + f'''
  <path d="M48 100 L78 88" stroke="{INK}" stroke-width="4"/><path d="M48 100 L78 88" stroke="#c8b890" stroke-width="2"/>
  <circle cx="79" cy="87" r="3.5" fill="{BONE}" stroke="{INK}" stroke-width="1.2"/>'''
    near = g(f'''    <path d="M76 66 C90 64 104 68 110 76 L106 84 C98 78 88 76 72 78 Z" fill="{GB.FUR}"/>
    <circle cx="110" cy="80" r="5.5" fill="{GB.HAND}"/>''') + f'''
  <path d="M110 80 L106 96" stroke="{INK}" stroke-width="4"/><path d="M110 80 L106 96" stroke="#c8b890" stroke-width="2"/>
  <circle cx="106" cy="97" r="3.5" fill="{BONE}" stroke="{INK}" stroke-width="1.2"/>'''
    paint = f'''  <path d="M54 80 L62 88 M54 90 L62 98" stroke="#e8e0c8" stroke-width="2.4" opacity="0.8"/>
  <path d="M60 104 L80 104" stroke="#7a4a2e" stroke-width="4"/>'''
    body = "\n".join([GB.SCARF, far, GB.LEGS, GB.TORSO, paint, GB.head(eye="normal", helmet=feathers), drum, near])
    cmd("warbeat", body, "Bojowy Rytm (fantasy): bęben wojenny z runami dźwięku, pióra i kościany diadem, malunki.")


# ------------------------------------------------------------------ hieny

def necromancer():
    robe = g(f'''    <path d="M42 72 C36 96 34 120 30 136 L96 136 C94 118 92 96 88 72 C78 62 50 62 42 72 Z" fill="#1e1a22"/>
    <path d="M58 70 L60 136 L70 136 L74 70 Z" fill="#2e2a34"/>''') + f'''
  <path d="M32 130 L96 130" stroke="{H.NECRO_D}" stroke-width="3"/>
  <path d="M40 120 L46 126 L52 118 L58 126" stroke="{H.NECRO}" stroke-width="1.5" fill="none" opacity="0.8"/>
  <path d="M46 80 L86 80 L86 86 L46 86 Z" fill="{TEAM_M}"/>
  <path d="M50 90 C56 96 64 96 70 92" stroke="{BONE}" stroke-width="2.5" fill="none"/>
  <circle cx="56" cy="95" r="2.5" fill="{BONE}" stroke="{INK}" stroke-width="1"/><circle cx="64" cy="96" r="2.5" fill="{BONE}" stroke="{INK}" stroke-width="1"/>'''
    staff = g(f'''    <path d="M104 136 L108 30" stroke-width="7"/>
    <path d="M96 30 C96 18 120 18 120 30 C120 38 114 42 108 42 C102 42 96 38 96 30 Z" fill="{BONE}"/>''') + f'''
  <path d="M104 136 L108 30" stroke="#3a2e26" stroke-width="3.5"/>
  <circle cx="103" cy="29" r="2.8" fill="{H.NECRO}"/><circle cx="113" cy="29" r="2.8" fill="{H.NECRO}"/>
  <path d="M104 37 L104 40 M108 37 L108 41 M112 37 L112 40" stroke="{INK}" stroke-width="1.2"/>
  <circle cx="108" cy="28" r="15" fill="{H.NECRO}" opacity="0.15"/>
  <path d="M100 14 C98 6 104 2 106 8 C108 2 116 4 112 14" stroke="{H.NECRO}" stroke-width="2" fill="none" opacity="0.8"/>
  <path d="M104 50 L100 60 M110 56 L114 64" stroke="{H.NECRO}" stroke-width="1.5" opacity="0.6"/>'''
    arm = g(f'''    <path d="M80 70 C92 70 102 72 106 78 L102 86 C94 82 86 80 76 80 Z" fill="#1e1a22"/>
    <circle cx="106" cy="82" r="5" fill="#9c7a30"/>''')
    crown = f'''
  <path d="M50 26 L52 14 L58 22 L62 8 L68 20 L74 10 L78 22" fill="{BONE}" stroke="{INK}" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M48 28 C58 22 72 20 82 24" stroke="{BONE_D}" stroke-width="3" fill="none"/>
  <path d="M78 36 C83 32 90 33 92 38 C88 41 82 41 78 36 Z" fill="{H.NECRO}"/>
  <circle cx="86" cy="37" r="7" fill="{H.NECRO}" opacity="0.2"/>'''
    hood = g(f'''    <path d="M40 60 C36 40 44 24 56 20 C52 34 52 50 60 66 Z" fill="#1e1a22"/>''', sw=2.5)
    body = "\n".join([robe, hood, H.head(scar=False, jaw=crown), staff, arm])
    cmd("necromancer", body, "Nekromanta (fantasy): szata, kościana korona, kostur z czaszką i zielonym ogniem dusz.")


def scavenger():
    cleaver = g(f'''    <path d="M92 94 L112 56" stroke-width="7"/>
    <path d="M104 62 L96 26 L118 16 L126 30 L120 36 L124 44 L112 58 Z" fill="{METAL}"/>''') + f'''
  <path d="M92 94 L112 56" stroke="{LEATHER_L}" stroke-width="3.5"/>
  <path d="M98 28 L118 19" stroke="{METAL_HI}" stroke-width="1.8"/>
  <path d="M104 36 L112 50 M110 32 L118 44" stroke="#7a2a1e" stroke-width="3" opacity="0.8"/>
  <path d="M120 36 L124 44" stroke="{INK}" stroke-width="1.5"/>'''
    bonearmor = f'''  <path d="M54 72 C66 64 86 66 92 80 C94 94 86 106 74 108 C64 110 56 104 55 96 Z" fill="{BONE_D}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>
  <path d="M58 80 C66 76 80 76 88 82 M57 90 C66 86 80 86 90 92 M58 100 C66 96 78 96 86 100" stroke="{BONE}" stroke-width="3" fill="none"/>
  <path d="M62 72 L90 90 L89 96 L60 79 Z" fill="{TEAM_M}"/>
  <path d="M72 108 L70 118 L76 116 L78 124" stroke="{BONE}" stroke-width="2.5" fill="none"/>'''
    necklace = f'''  <path d="M60 64 C70 72 84 72 92 64" stroke="{INK}" stroke-width="1.5" fill="none"/>
  <path d="M64 68 L62 74 L66 72 Z M72 71 L71 78 L75 74 Z M80 71 L81 78 L84 73 Z M88 67 L90 73 L92 68 Z" fill="{BONE}" stroke="{INK}" stroke-width="1"/>'''
    arm = g(f'''    <path d="M80 70 C92 74 96 84 94 94 L86 96 C86 88 82 82 76 80 Z" fill="{H.FUR}"/>
    <circle cx="91" cy="94" r="6" fill="#9c7a30"/>''')
    far = g(f'    <path d="M58 78 C52 86 54 94 62 98 L68 94 C62 90 62 84 64 80 Z" fill="{H.FUR_D}"/>')
    body = "\n".join([H.TAIL, H.FAR_LEG, far, H.TORSO, H.SPOTS, H.NEAR_LEG, H.BELT, bonearmor, H.MANE, H.head(), necklace, cleaver, arm])
    cmd("scavenger", body, "Padlinożerca (fantasy): pancerz z kości, zakrwawiony tasak, naszyjnik z kłów.")


def cackle():
    blade = lambda x1, y1, x2, y2: f'''  <path d="M{x1} {y1} L{x2} {y2}" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>
  <path d="M{x1} {y1} L{x2} {y2}" stroke="{H.LASER}" stroke-width="3" stroke-linecap="round"/>
  <path d="M{x1} {y1} L{x2} {y2}" stroke="{H.LASER_C}" stroke-width="1" stroke-linecap="round"/>'''
    suit = g(f'''    <path d="M56 70 C70 62 88 66 92 80 C94 94 86 106 74 108 C64 110 56 104 55 96 Z" fill="#2a2a30"/>''') + f'''
  <path d="M58 76 L90 84 L90 90 L57 82 Z" fill="{TEAM_M}"/>
  <path d="M62 94 L70 100 L80 96" stroke="{H.LASER}" stroke-width="1.5" fill="none"/>
  <rect x="80" y="92" width="6" height="12" rx="2" fill="#7dff6a" stroke="{INK}" stroke-width="1.2"/>
  <rect x="72" y="94" width="6" height="12" rx="2" fill="#7dff6a" stroke="{INK}" stroke-width="1.2"/>'''
    far = g(f'''    <path d="M58 76 C48 70 40 66 30 66 L30 74 C40 76 48 80 54 88 Z" fill="{H.FUR_D}"/>
    <circle cx="28" cy="70" r="5" fill="#7d5f24"/>''') + blade(26, 72, 10, 96)
    near = g(f'''    <path d="M80 70 C92 72 100 78 104 86 L96 92 C92 86 86 82 76 80 Z" fill="{H.FUR}"/>
    <circle cx="102" cy="90" r="5" fill="#9c7a30"/>''') + blade(104, 88, 124, 66)
    mask = f'''
  <path d="M84 38 C96 34 110 38 114 48 L112 56 L92 58 C88 52 86 46 84 38 Z" fill="#2a2a30" stroke="{INK}" stroke-width="1.8"/>
  <path d="M94 48 L110 46 M94 52 L108 51" stroke="{H.LASER}" stroke-width="1.5"/>
  <path d="M77 35 L93 33 L93 40 L78 41 Z" fill="{H.LASER}" stroke="{INK}" stroke-width="1.5"/>'''
    body = "\n".join([H.TAIL, H.FAR_LEG, far, H.TORSO, H.SPOTS, H.NEAR_LEG, suit, H.MANE, H.head(jaw=mask), near])
    cmd("cackle", body, "Rechot (sci-fi): zabójca z laserowymi sztyletami, wizjer i maska, zastrzyki stymulantów.")


# ------------------------------------------------------------------ dziki

def totem_engineer():
    pack = g(f'''    <path d="M26 110 L26 40 L46 40 L46 110 Z" fill="{B.WOOD}"/>
    <path d="M22 44 C22 30 50 30 50 44 L46 50 L26 50 Z" fill="{B.WOOD_L}"/>''') + f'''
  <circle cx="32" cy="40" r="2.5" fill="{B.RUNE}"/><circle cx="40" cy="40" r="2.5" fill="{B.RUNE}"/>
  <path d="M28 64 L44 64 M28 86 L44 86" stroke="{INK}" stroke-width="2"/>
  <path d="M30 72 L36 78 L42 72" stroke="{B.RUNE}" stroke-width="1.8" fill="none"/>'''
    tool = g(f'''    <path d="M88 94 L112 58" stroke-width="6"/>
    <path d="M104 52 L118 46 L122 58 L112 64 Z" fill="{B.IRON}"/>''') + f'''
  <path d="M88 94 L112 58" stroke="{B.WOOD_L}" stroke-width="3"/>
  <path d="M108 54 L116 52" stroke="{B.RUNE}" stroke-width="1.8"/>'''
    feathers = f'''
  <path d="M56 20 L44 2 M62 16 L58 -2 M70 16 L74 0" stroke="{INK}" stroke-width="4.5"/>
  <path d="M56 20 L44 2 M62 16 L58 -2 M70 16 L74 0" stroke="#d8c060" stroke-width="2.4"/>
  <path d="M50 24 C60 18 74 16 86 20" stroke="{BONE}" stroke-width="4" fill="none"/>'''
    arm = g(f'''    <path d="M76 66 C88 70 94 80 92 90 L82 92 C82 84 78 78 72 76 Z" fill="{B.FUR}"/>
    <circle cx="87" cy="92" r="6" fill="{B.FUR_D}"/>''')
    body = "\n".join([pack, B.LEGS, B.TORSO, B.gear(), B.head() + feathers, tool, arm])
    cmd("totem_engineer", body, "Inżynier Totemów (fantasy): plecak-totem z oczami-runami, dłuto runiczne, pióra.")


def stampede():
    boost = g(f'''    <rect x="22" y="56" width="16" height="36" rx="5" fill="{METAL}"/>
    <rect x="34" y="52" width="14" height="36" rx="5" fill="#4b5058"/>''') + f'''
  <path d="M26 92 C24 104 28 114 32 118 C34 110 36 102 34 92 Z" fill="#ff9a2c" opacity="0.8"/>
  <path d="M38 88 C36 98 40 106 42 110 C44 104 46 96 44 88 Z" fill="#fff0b0" opacity="0.8"/>
  <path d="M24 62 L36 62 M36 58 L46 58" stroke="#ff9a2c" stroke-width="2"/>'''
    armor = g(f'''    <path d="M44 74 C54 62 82 62 92 76 C94 90 90 104 82 112 L54 112 C46 104 42 90 44 74 Z" fill="{METAL}"/>
    <path d="M38 64 C42 54 60 52 66 60 C64 68 52 72 40 70 Z" fill="{METAL_L}"/>''') + f'''
  <path d="M56 84 L82 84 L80 102 L68 108 L58 102 Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2"/>
  <path d="M57 85.5 L81 85.5" stroke="{TEAM}" stroke-width="1.2"/>
  <path d="M46 72 C56 66 72 64 86 70" stroke="{METAL_HI}" stroke-width="1.8" fill="none"/>
''' + rivets([(50, 80), (88, 80), (52, 104), (86, 104)])
    helm = f'''
  <path d="M50 32 C52 18 68 12 82 14 C92 16 98 22 100 30 C86 26 66 26 50 32 Z" fill="{METAL}" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M56 22 C64 18 76 16 86 18" stroke="{METAL_HI}" stroke-width="1.6" fill="none"/>
  <path d="M104 60 C112 58 116 50 115 44 L119 42 C121 52 118 62 108 67 Z" fill="{METAL_L}" stroke="{INK}" stroke-width="1.6"/>
  <path d="M78 36 C82 32 88 32 91 36 C88 39 82 39 78 36 Z" fill="#ff9a2c"/>'''
    arm = g(f'''    <path d="M76 66 C88 70 94 80 92 90 L82 92 C82 84 78 78 72 76 Z" fill="{METAL}"/>
    <circle cx="87" cy="92" r="6.5" fill="{METAL_D}"/>''')
    body = "\n".join([boost, B.LEGS, B.TORSO, armor, B.head() + helm, arm])
    cmd("stampede", body, "Stratowanie (sci-fi): pancerz szturmowy z dopalaczami, stalowe nakładki na kły.")


def tusks():
    axe = lambda hx, hy, bx, by, flip=1: g(f'''    <path d="M{hx} {hy} L{bx} {by}" stroke-width="6"/>
    <path d="M{bx-2*flip} {by-2} C{bx+10*flip} {by-12} {bx+18*flip} {by-4} {bx+16*flip} {by+8} C{bx+10*flip} {by+6} {bx+4*flip} {by+8} {bx} {by+10} Z" fill="{B.IRON}"/>''') + f'''
  <path d="M{hx} {hy} L{bx} {by}" stroke="{B.WOOD_L}" stroke-width="3"/>
  <path d="M{bx+6*flip} {by-2} L{bx+10*flip} {by+2}" stroke="{B.RUNE}" stroke-width="1.8"/>'''
    far = g(f'    <path d="M54 76 C44 80 38 88 36 98 L46 100 C48 92 54 86 60 82 Z" fill="{B.FUR_D}"/>') + axe(40, 100, 26, 58, -1)
    near = g(f'''    <path d="M76 66 C90 70 98 80 98 92 L88 94 C86 84 80 78 72 76 Z" fill="{B.FUR}"/>
    <circle cx="94" cy="94" r="6.5" fill="{B.FUR_D}"/>''') + axe(94, 94, 110, 60)
    tusksbig = f'''
  <path d="M104 62 C116 58 122 44 118 30 C126 42 126 60 110 68 Z" fill="{B.TUSK}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M112 50 L118 48 M114 42 L119 40" stroke="{B.RUNE}" stroke-width="1.6"/>
  <path d="M60 36 L72 44 M58 44 L70 50" stroke="#c0392b" stroke-width="2.6" opacity="0.85"/>'''
    body = "\n".join([far, B.LEGS, B.TORSO, B.gear(), B.head() + tusksbig, near])
    cmd("tusks", body, "Kły (fantasy): berserker z dwoma toporami, olbrzymie kły z runami, czerwone malunki.")


if __name__ == "__main__":
    sapper(); sniper(); magma(); iron_grip(); wrecker(); warbeat(); necromancer(); scavenger(); cackle()
    totem_engineer(); stampede(); tusks()
    commanders_hare_otter.all_()
    commanders_bwh.all_()
    print("commanders ok")
