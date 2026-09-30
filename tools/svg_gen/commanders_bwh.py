# Dowódcy niedźwiedzi, wilków i jeży (D30: w każdej rasie są odmiany sci-fi i fantasy).
#   niedźwiedzie: Grawitant (sci-fi), Szał (fantasy), Kolos (sci-fi)
#   wilki:        Grom (sci-fi), Alfa (fantasy), Wilkołak (fantasy)
#   jeże:         Sonik (sci-fi), Kłębek (fantasy), Bastion (sci-fi)
#
#   python tools/svg_gen/commanders_bwh.py   (albo razem z resztą: commanders.py)
from common import *
import bear as BR
import wolf as WF
import hedgehog as HG

W = 0.27  # jak w commanders.py — dowódca ~30% większy od piechura


def cmd(name, body, note, world=W, anchor=(64, 136)):
    svg("cmd_" + name, body, world=world, anchor=anchor, scale=0.85, note=note)


# ------------------------------------------------------------------ niedźwiedzie

def gravity():
    orb = lambda cx, cy, r: f'''  <circle cx="{cx}" cy="{cy}" r="{r + 6}" fill="{BR.RUNE}" opacity="0.2"/>
  <circle cx="{cx}" cy="{cy}" r="{r}" fill="#2a1a40" stroke="{INK}" stroke-width="2"/>
  <circle cx="{cx}" cy="{cy}" r="{r * 0.5}" fill="{BR.RUNE}"/>
  <ellipse cx="{cx}" cy="{cy}" rx="{r + 8}" ry="{r * 0.4}" fill="none" stroke="{BR.RUNE_C}" stroke-width="1.2" opacity="0.8"/>'''
    far = g(f'    <path d="M50 74 C40 70 30 66 22 64 L20 74 C30 76 40 80 46 86 Z" fill="{BR.FUR_D}"/>') + g(
        f'    <rect x="12" y="62" width="16" height="16" rx="4" fill="{METAL}"/>', sw=2.2) + orb(18, 52, 7)
    near = g(f'''    <path d="M82 66 C96 68 106 74 110 82 L102 90 C98 84 90 80 78 78 Z" fill="{BR.FUR}"/>
    <rect x="100" y="78" width="18" height="16" rx="4" fill="{METAL}"/>''', sw=2.5) + orb(112, 62, 9)
    collar = g(f'''    <path d="M42 70 C54 60 84 60 96 70 L92 78 C80 70 58 70 46 78 Z" fill="{METAL}"/>''') + f'''
  <circle cx="58" cy="70" r="2" fill="{BR.RUNE}"/><circle cx="70" cy="68" r="2" fill="{BR.RUNE}"/><circle cx="82" cy="70" r="2" fill="{BR.RUNE}"/>'''
    coat = g(f'''    <path d="M44 76 C54 70 84 70 94 76 C98 94 94 112 84 118 L56 118 C44 112 40 94 44 76 Z" fill="#2c2a38"/>''') + f'''
  <path d="M64 76 L74 76 L74 118 L64 118 Z" fill="{TEAM_M}"/>
  <path d="M50 96 C58 100 64 100 70 96" stroke="{BR.RUNE}" stroke-width="2" fill="none"/>'''
    visor = f'''
  <path d="M80 38 C88 34 98 36 100 42 C98 48 90 50 84 49 C80 48 78 44 80 38 Z" fill="{BR.RUNE}" stroke="{INK}" stroke-width="2"/>'''
    body = "\n".join([far, BR.LEGS, BR.TORSO, coat, collar, near, BR.head(helm=False, extra=visor)])
    cmd("gravity", body, "Grawitant (sci-fi): rękawice grawitacyjne z kulami osobliwości, płaszcz badacza, fioletowy wizjer.")


def rampage():
    paint = f'''  <path d="M52 86 L60 96 M50 98 L58 108 M84 86 L78 96" stroke="#c0392b" stroke-width="3" opacity="0.85"/>'''
    pelt = g(f'''    <path d="M34 68 C42 56 74 52 92 60 L96 70 C82 64 56 64 42 80 Z" fill="{BR.PELT}"/>
    <path d="M40 76 L32 96 L42 90 L40 102 L50 86 Z" fill="{BR.PELT}"/>''') + f'''
  <path d="M46 62 L44 68 M56 58 L55 64 M68 57 L68 63 M80 58 L81 64" stroke="#5a4a38" stroke-width="1.5"/>
  <path d="M86 58 C92 54 98 56 98 62" stroke="{BONE}" stroke-width="3" fill="none"/>'''
    belt = g(f'    <path d="M40 102 C56 110 82 110 98 102 L98 110 C82 118 56 118 40 110 Z" fill="{TEAM_M}"/>')
    axe = g(f'''    <path d="M92 100 L114 42" stroke-width="7"/>
    <path d="M104 40 C94 30 100 12 118 10 C126 20 126 40 116 50 Z" fill="{BR.IRON}"/>''') + f'''
  <path d="M92 100 L114 42" stroke="#6a4a2e" stroke-width="3.5"/>
  <path d="M108 20 C114 16 120 16 122 22" stroke="{BR.IRON_L}" stroke-width="1.5" fill="none"/>
  <path d="M110 28 L116 30 M108 36 L114 40" stroke="#c0392b" stroke-width="2.5" opacity="0.8"/>'''
    far = g(f'    <path d="M50 76 C38 84 36 96 42 102 L52 98 C48 92 52 86 56 82 Z" fill="{BR.FUR_D}"/>') + BR.paw(44, 104, 7)
    near = g(f'    <path d="M84 68 C98 72 102 84 98 96 L88 98 C90 88 86 82 80 80 Z" fill="{BR.FUR}"/>') + BR.paw(94, 100, 7)
    scar = f'''
  <path d="M84 30 L92 50" stroke="#b86a5c" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M82 40 C86 38 92 38 94 40" stroke="#c0392b" stroke-width="2"/>'''
    body = "\n".join([far, BR.LEGS, BR.TORSO, paint, belt, pelt, near, axe, BR.head(helm=False, extra=scar)])
    cmd("rampage", body, "Szał (fantasy): berserker w skórze, czerwone malunki wojenne, zakrwawiony topór, blizna.")


def colossus():
    frame = g(f'''    <path d="M26 68 C30 52 50 46 68 46 C90 46 106 54 110 70 L110 112 C100 124 36 124 26 112 Z" fill="{BR.IRON}"/>
    <path d="M18 60 C18 48 40 44 44 56 L44 72 L20 74 Z M92 54 C98 44 118 46 118 60 L116 74 L92 72 Z" fill="{BR.IRON_L}"/>''') + f'''
  <path d="M30 84 L106 84 L106 96 L30 96 Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2"/>
  <path d="M30 85.5 L106 85.5" stroke="{TEAM}" stroke-width="1.5"/>
  <circle cx="68" cy="106" r="7" fill="{BR.IRON_D}" stroke="{INK}" stroke-width="2"/><circle cx="68" cy="106" r="3.5" fill="{BR.RUNE}"/>
''' + rivets([(24, 66), (40, 66), (98, 64), (112, 66), (36, 110), (100, 110)], r=1.8)
    legs = g(f'''    <path d="M34 112 L30 136 L60 136 L58 114 Z" fill="{BR.IRON_D}"/>
    <path d="M76 114 L74 136 L104 136 L100 112 Z" fill="{BR.IRON}"/>''')
    fists = g(f'''    <rect x="4" y="74" width="24" height="30" rx="6" fill="{BR.IRON_D}"/>
    <rect x="104" y="74" width="24" height="30" rx="6" fill="{BR.IRON}"/>''') + f'''
  <path d="M8 84 L24 84 M8 94 L24 94 M108 84 L124 84 M108 94 L124 94" stroke="{BR.IRON_L}" stroke-width="2"/>'''
    h = tr(BR.head(helm=False), dx=10, dy=-2, s=0.72)
    dome = f'''  <path d="M36 44 C36 18 56 6 72 6 C90 6 104 20 104 44" fill="#8ad8ff" opacity="0.25" stroke="{INK}" stroke-width="2.5"/>
  <path d="M48 20 C56 12 66 10 74 10" stroke="#e0f6ff" stroke-width="2" fill="none"/>'''
    body = "\n".join([legs, frame, fists, h, dome])
    cmd("colossus", body, "Kolos (sci-fi): niedźwiedź w ciężkim egzoszkielecie pod szklaną kopułą, pięści-tłoki, rdzeń grawitacji.")


# ------------------------------------------------------------------ wilki

def thunder_fang():
    coils = g(f'''    <rect x="26" y="58" width="22" height="40" rx="5" fill="{WF.STEEL_D}"/>''') + f'''
  <path d="M28 62 L46 62 M28 70 L46 70 M28 78 L46 78 M28 86 L46 86 M28 94 L46 94" stroke="#b8872a" stroke-width="2.5"/>
  <path d="M36 58 L32 46 L40 50 L36 36" stroke="{WF.BOLT}" stroke-width="2.5" fill="none"/>
  <circle cx="36" cy="36" r="6" fill="{WF.BOLT}" opacity="0.4"/>'''
    gauntlet = g(f'''    <path d="M80 68 C92 70 100 76 104 84 L96 90 C92 84 86 80 76 80 Z" fill="{WF.STEEL}"/>
    <rect x="96" y="80" width="18" height="16" rx="4" fill="{WF.STEEL_D}"/>''', sw=2.5) + f'''
  <path d="M114 84 L122 80 L118 88 L128 86 L120 94" stroke="{WF.BOLT}" stroke-width="2.5" fill="none"/>
  <path d="M114 84 L122 80 L118 88 L128 86 L120 94" stroke="{WF.BOLT_C}" stroke-width="1" fill="none"/>'''
    suit = g(f'''    <path d="M52 76 C62 70 80 70 90 76 C94 92 90 106 80 112 L60 112 C50 106 48 92 52 76 Z" fill="{WF.STEEL_D}"/>''') + f'''
  <path d="M54 80 L90 100 L88 106 L52 86 Z" fill="{TEAM_M}"/>
  <path d="M60 96 L66 92 L64 100 L70 96" stroke="{WF.BOLT}" stroke-width="1.8" fill="none"/>'''
    far = g(f'    <path d="M58 78 C50 86 52 94 60 96 L66 92 C60 90 62 84 64 80 Z" fill="{WF.FUR_D}"/>')
    body = "\n".join([coils, WF.TAIL, far, WF.LEGS, WF.TORSO, suit, gauntlet, WF.head()])
    cmd("thunder_fang", body, "Grom (sci-fi): plecak z cewkami Tesli, rękawica-generator sypiąca błyskawicami.")


def alpha():
    cloak = g(f'''    <path d="M56 62 C38 68 28 92 26 128 L38 124 L44 132 L52 122 L60 128 C62 106 64 86 70 68 Z" fill="{WF.FUR_D}"/>''') + f'''
  <path d="M32 120 C38 96 46 80 60 68" stroke="{WF.FUR_L}" stroke-width="2" fill="none"/>'''
    skull = f'''
  <path d="M48 38 C46 20 60 12 74 14 C86 16 94 24 94 34 C84 30 62 30 48 38 Z" fill="{BONE}" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M54 22 L50 10 L60 20 M76 16 L80 4 L84 18" fill="{BONE}" stroke="{INK}" stroke-width="2"/>
  <circle cx="68" cy="26" r="2.2" fill="{INK}"/><circle cx="80" cy="26" r="2.2" fill="{INK}"/>'''
    spear = g(f'''    <path d="M84 110 L118 18" stroke-width="6"/>
    <path d="M114 6 L124 24 L112 22 Z" fill="{BONE}"/>''') + f'''
  <path d="M84 110 L118 18" stroke="#6a4a2e" stroke-width="3"/>
  <path d="M110 34 L104 40 M112 30 L118 36" stroke="{TEAM_M}" stroke-width="3"/>'''
    far = g(f'    <path d="M58 78 C50 86 52 94 60 96 L66 92 C60 90 62 84 64 80 Z" fill="{WF.FUR_D}"/>')
    near = g(f'    <path d="M78 72 C90 76 94 86 90 96 L82 96 C84 88 80 82 74 80 Z" fill="{WF.FUR}"/>') + WF.paw(90, 96)
    necklace = f'''  <path d="M56 70 C64 78 78 78 86 70" stroke="{INK}" stroke-width="1.5" fill="none"/>
  <path d="M60 74 L58 80 L62 78 Z M70 77 L69 84 L73 80 Z M80 74 L82 80 L84 75 Z" fill="{BONE}" stroke="{INK}" stroke-width="1"/>'''
    body = "\n".join([cloak, WF.TAIL, far, WF.LEGS, WF.TORSO, WF.mail(), necklace, spear, near, WF.head(extra=skull)])
    cmd("alpha", body, "Alfa (fantasy): płaszcz z wilczej skóry, hełm z czaszki basiora, kościana włócznia, naszyjnik z kłów.")


def werewolf():
    body_ = g(f'''    <path d="M30 96 C24 70 42 50 66 48 C92 46 108 64 106 88 C104 108 90 120 66 120 C44 120 32 110 30 96 Z" fill="{WF.FUR_D}"/>''') + f'''
  <path d="M36 70 L28 62 L40 66 L34 54 L46 60 L44 46 L54 56" fill="{WF.FUR_D}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M60 60 C80 60 94 72 94 90 C88 82 76 76 62 74 Z" fill="{WF.FUR}" opacity="0.8"/>
  <path d="M40 100 L92 98 L90 108 L42 110 Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2"/>
  <path d="M48 108 L44 118 M60 110 L58 120 M76 110 L78 118" stroke="{TEAM_M}" stroke-width="3"/>'''
    legs = g(f'''    <path d="M40 112 L32 128 L30 136 L52 136 L52 124 L56 114 Z" fill="{WF.FUR_D}"/>
    <path d="M70 114 L70 126 L66 136 L90 136 L86 124 L84 114 Z" fill="{WF.FUR}"/>''') + f'''
  <path d="M30 136 L26 138 M36 136 L34 139 M66 136 L62 139 M72 136 L70 139" stroke="{BONE}" stroke-width="2"/>'''
    claws = lambda x, y: f'''  <path d="M{x} {y} L{x + 12} {y - 6} M{x + 2} {y + 4} L{x + 16} {y + 2} M{x} {y + 8} L{x + 12} {y + 12}" stroke="{BONE}" stroke-width="3" stroke-linecap="round"/>
  <path d="M{x} {y} L{x + 12} {y - 6} M{x + 2} {y + 4} L{x + 16} {y + 2} M{x} {y + 8} L{x + 12} {y + 12}" stroke="{INK}" stroke-width="0.8" stroke-linecap="round"/>'''
    far = g(f'    <path d="M44 70 C30 74 20 84 16 96 L26 100 C30 90 38 82 50 80 Z" fill="{WF.FUR_D}"/>') + claws(8, 96)
    near = g(f'    <path d="M84 62 C100 66 110 78 110 92 L98 94 C98 84 92 76 82 74 Z" fill="{WF.FUR}"/>') + claws(106, 92)
    eyes = f'''
  <path d="M82 42 C86 38 92 38 94 42 C90 45 86 45 82 42 Z" fill="#ff3a2a" stroke="{INK}" stroke-width="1.2"/>
  <circle cx="88" cy="42" r="6" fill="#ff3a2a" opacity="0.25"/>
  <path d="M100 60 L102 66 L104 61 L106 67 L108 61" fill="#ffffff" stroke="{INK}" stroke-width="1"/>'''
    body = "\n".join([WF.TAIL, far, legs, body_, near, tr(WF.head(extra=eyes), dx=4, dy=-4, s=1.02)])
    cmd("werewolf", body, "Wilkołak (fantasy): zgarbiona bestia, najeżona sierść, czerwone ślepia, kościane pazury, strzępy barw drużyny.")


# ------------------------------------------------------------------ jeże

def sonic():
    streaks = f'''  <path d="M4 80 L30 80 M8 92 L34 92 M2 104 L28 104" stroke="{HG.LED}" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>'''
    shoes = f'''  <path d="M40 128 L40 138 L66 138 L64 128 Z M64 130 L64 140 L94 140 L92 130 Z" fill="#d8322a" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M42 134 L64 134 M66 136 L92 136" stroke="#ffffff" stroke-width="2.5"/>
  <circle cx="44" cy="140" r="2.5" fill="{HG.LED}"/><circle cx="70" cy="142" r="2.5" fill="{HG.LED}"/>'''
    suit = g(f'''    <path d="M54 76 C64 70 80 70 90 76 C94 92 90 106 80 112 L60 112 C50 106 48 92 54 76 Z" fill="#26303a"/>''') + f'''
  <path d="M56 84 L90 84 L90 92 L56 92 Z" fill="{TEAM_M}"/>
  <path d="M60 100 L84 100" stroke="{HG.LED}" stroke-width="2"/>'''
    visor = f'''
  <path d="M80 40 C90 38 100 40 104 46 C100 50 92 52 86 51 C82 50 78 46 80 40 Z" fill="{HG.LED}" stroke="{INK}" stroke-width="2" opacity="0.9"/>'''
    far = g(f'    <path d="M58 76 C48 72 40 70 32 72 L32 80 C40 80 48 82 54 88 Z" fill="{HG.FACE_D}"/>') + HG.paw(30, 76)
    near = g(f'    <path d="M80 70 C92 72 100 78 104 86 L96 92 C92 86 86 82 76 80 Z" fill="{HG.QUILL_L}"/>') + HG.paw(102, 90)
    body = "\n".join([streaks, HG.BACK, far, HG.LEGS, shoes, HG.TORSO, suit, near, HG.head(extra=visor)])
    cmd("sonic", body, "Sonik (sci-fi): kombinezon biegacza, buty z odrzutem, zielony wizjer, smugi prędkości.")


def curl():
    caps = HG.spikes(60, 92, 30, n=11, a0=130, a1=300, length=18, col=METAL_L)
    armor = g(f'''    <path d="M50 74 C60 66 82 66 92 74 C96 90 92 106 82 112 L60 112 C48 106 46 90 50 74 Z" fill="{METAL}"/>''') + f'''
  <path d="M50 84 L94 84 M50 98 L94 98" stroke="{BRASS}" stroke-width="3"/>
  <path d="M64 72 L74 72 L74 112 L64 112 Z" fill="{TEAM_M}"/>
''' + rivets([(54, 78), (88, 78), (56, 106), (86, 106)])
    shield = g(f'''    <circle cx="104" cy="92" r="20" fill="{METAL}"/>
    <circle cx="104" cy="92" r="8" fill="{BRASS}"/>''') + f'''
  <path d="M104 68 L104 60 M124 92 L132 92 M104 116 L104 124 M88 76 L82 70 M120 76 L126 70 M88 108 L82 114 M120 108 L126 114" stroke="{INK}" stroke-width="4"/>
  <path d="M104 68 L104 60 M124 92 L132 92 M104 116 L104 124 M88 76 L82 70 M120 76 L126 70 M88 108 L82 114 M120 108 L126 114" stroke="{METAL_L}" stroke-width="2"/>
  <path d="M90 84 C96 76 110 76 116 82" stroke="{METAL_HI}" stroke-width="1.5" fill="none"/>'''
    helm = f'''
  <path d="M50 44 C52 30 64 24 76 26 C88 28 96 34 98 42 C84 38 64 38 50 44 Z" fill="{METAL}" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M74 26 L76 14 L80 26" fill="{METAL_L}" stroke="{INK}" stroke-width="1.5"/>'''
    body = "\n".join([caps, HG.LEGS, HG.TORSO, armor, HG.head(crest=False, extra=helm), shield])
    cmd("curl", body, "Kłębek (fantasy): rycerz-jeż, kolce okute stalą, okrągła tarcza z kolcami, mosiężne obręcze.")


def bastion():
    hat = f'''
  <path d="M50 40 C52 26 64 20 78 22 C90 24 98 30 100 38 L104 40 L48 44 Z" fill="#e8b830" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M66 22 L70 22 L72 38 L66 39 Z" fill="{TEAM_M}"/>'''
    wrench = g(f'''    <path d="M88 100 L112 56" stroke-width="6"/>
    <path d="M106 44 C104 36 114 32 120 38 L114 42 L118 48 L124 44 C126 52 118 58 110 54 Z" fill="{METAL_L}"/>''') + f'''
  <path d="M88 100 L112 56" stroke="{METAL}" stroke-width="3"/>'''
    belt = f'''  <path d="M50 104 L90 104" stroke="{LEATHER}" stroke-width="5"/>
  <rect x="54" y="100" width="8" height="12" rx="1" fill="{LEATHER_L}" stroke="{INK}" stroke-width="1.2"/>
  <rect x="78" y="100" width="8" height="12" rx="1" fill="{LEATHER_L}" stroke="{INK}" stroke-width="1.2"/>
  <path d="M58 100 L58 94 M82 100 L84 94" stroke="{METAL_L}" stroke-width="2"/>'''
    drone = g(f'''    <rect x="14" y="30" width="22" height="12" rx="3" fill="{HG.OLIVE}"/>''', sw=2) + f'''
  <path d="M10 28 L22 28 M28 28 L40 28" stroke="{METAL_L}" stroke-width="2"/>
  <circle cx="25" cy="42" r="2.5" fill="{HG.LED}"/>'''
    near = g(f'    <path d="M78 72 C88 74 92 82 90 92 L82 94 C82 86 80 82 74 80 Z" fill="{HG.QUILL_L}"/>') + HG.paw(88, 96)
    far = g(f'    <path d="M58 78 C50 86 52 94 60 96 L66 92 C60 90 62 84 64 80 Z" fill="{HG.FACE_D}"/>')
    body = "\n".join([drone, HG.BACK, far, HG.LEGS, HG.TORSO, HG.armor(), belt, near, wrench, HG.head(extra=hat)])
    cmd("bastion", body, "Bastion (sci-fi): inżynier w kasku, klucz, pas z narzędziami, dron zwiadowczy.")


def all_():
    gravity(); rampage(); colossus(); thunder_fang(); alpha(); werewolf(); sonic(); curl(); bastion()


if __name__ == "__main__":
    all_()
    print("commanders bear/wolf/hedgehog ok")
