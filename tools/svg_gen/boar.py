# Dziki: plemienne fantasy — żelazo i skóry, runy żarzące się jak węgle, malunki wojenne, kły.
from common import *

FUR = "#7a4a2e"
FUR_D = "#4a2a18"
FUR_L = "#9c6a44"
MANE = "#2e1a10"
SNOUT = "#c98a7a"
SNOUT_D = "#8a4a44"
TUSK = "#efe6cf"
RUNE = "#ff9a3c"
RUNE_C = "#ffe0a0"
WOOD = "#6a4a2e"
WOOD_L = "#8a6a44"
IRON = "#4a4a4c"
IRON_L = "#7a7a7c"
PELT = "#3a2e26"
PAINT = "#e8e0c8"


def head(helm=False):
    s = g(f'''    <path d="M84 20 L90 2 L98 18 Z" fill="{FUR_D}"/>
    <path d="M44 50 C42 32 56 18 74 18 C88 18 98 28 100 40 L114 42 C121 44 123 54 119 60 L100 62 C92 68 80 70 68 68 C54 66 44 60 44 50 Z" fill="{FUR}"/>
    <path d="M58 28 L50 4 L66 14 L64 20 L70 22 Z" fill="{FUR}"/>''')
    s += f'''
  <path d="M57 24 L53 10 L62 17 Z" fill="{SNOUT_D}"/>
  <ellipse cx="119" cy="51" rx="5" ry="8" fill="{SNOUT}" stroke="{INK}" stroke-width="2"/>
  <ellipse cx="119" cy="48" rx="1.3" ry="2" fill="{INK}"/><ellipse cx="119" cy="55" rx="1.3" ry="2" fill="{INK}"/>
  <path d="M46 54 C52 64 64 68 76 68 C64 64 54 58 50 48 Z" fill="{FUR_D}" opacity="0.7"/>
  <path d="M100 42 L112 44" stroke="{FUR_L}" stroke-width="1.8"/>
  <path d="M62 24 C70 20 80 20 88 22" fill="none" stroke="{FUR_L}" stroke-width="2"/>
  <path d="M42 30 L46 38 L38 40 L46 46 L38 52 L46 56 L40 64 L50 62 L54 42 L50 28 Z" fill="{MANE}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M70 46 L90 50 M72 54 L88 56" stroke="{PAINT}" stroke-width="2.5" opacity="0.85"/>
  <path d="M78 36 C82 32 88 32 91 36 C88 39 82 39 78 36 Z" fill="#d8402a" stroke="#120c08" stroke-width="1.5"/>
  <circle cx="85.5" cy="36" r="1.5" fill="#120c08"/>
  <path d="M76 31 L93 33" stroke="{MANE}" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M92 26 L96 40" stroke="#b86a5c" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M104 62 C112 60 116 52 115 44 C119 52 118 62 108 67 Z" fill="{TUSK}" stroke="{INK}" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M96 64 C100 62 102 58 102 54 C105 58 104 64 99 67 Z" fill="#d8ceb0" stroke="{INK}" stroke-width="1.5"/>
  <path d="M100 62 C104 64 110 64 114 62" stroke="#120c08" stroke-width="1.6" fill="none"/>'''
    if helm:
        s += g(f'''    <path d="M52 30 C54 16 70 10 84 12 C92 14 98 20 99 28 C84 24 66 24 52 30 Z" fill="{IRON}"/>
    <path d="M74 12 L76 0 L80 12 Z" fill="{TUSK}"/>''', sw=2.2) + f'''
  <path d="M60 22 C68 16 78 15 88 16" stroke="{IRON_L}" stroke-width="1.6" fill="none"/>
  <path d="M66 22 L70 28 M72 21 L75 27" stroke="{RUNE}" stroke-width="1.6"/>'''
    return s


LEGS = g(f'''    <path d="M48 106 L42 124 L42 134 L60 134 L60 122 L62 108 Z" fill="{FUR_D}"/>
    <path d="M68 108 L66 124 L66 134 L86 134 L84 122 L84 108 Z" fill="{FUR}"/>
    <path d="M40 128 L40 138 L62 138 L61 128 Z M64 128 L64 138 L88 138 L87 128 Z" fill="#2a1e16"/>''')
TORSO = g(f'    <path d="M34 92 C32 72 48 60 66 60 C84 60 96 72 96 90 C96 108 84 118 66 118 C48 118 36 110 34 92 Z" fill="{FUR}"/>')


def gear(rune=True):
    s = g(f'''    <path d="M48 80 C58 72 80 72 90 82 C92 96 88 108 80 112 L56 112 C48 104 46 92 48 80 Z" fill="{LEATHER}"/>
    <path d="M38 70 C44 58 64 54 76 62 C70 70 56 74 44 80 Z" fill="{PELT}"/>''')
    s += f'''
  <path d="M42 66 L40 60 M48 62 L47 56 M56 60 L56 54 M64 60 L66 54" stroke="{PELT}" stroke-width="3"/>
  <path d="M56 86 L82 86 L80 104 L68 110 L58 104 Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2"/>
  <path d="M57 87.5 L81 87.5" stroke="{TEAM}" stroke-width="1.2"/>
  <path d="M50 106 L86 106" stroke="#2a1e16" stroke-width="4"/>
  <circle cx="68" cy="106" r="3.5" fill="{IRON}" stroke="{INK}" stroke-width="1.2"/>'''
    if rune:
        s += f'''
  <path d="M66 92 L70 100 L74 92 M70 100 L70 96" stroke="{RUNE}" stroke-width="1.8" fill="none"/>'''
    return s


def soldier():
    far_arm = g(f'    <path d="M54 76 C46 84 48 94 56 98 L64 94 C58 90 58 84 60 80 Z" fill="{FUR_D}"/>')
    axe = g(f'''    <path d="M86 88 L114 124" stroke="{INK}" stroke-width="7"/>
    <path d="M86 88 L114 124" stroke="{WOOD_L}" stroke-width="3.5"/>
    <path d="M104 118 C108 106 122 104 128 110 C124 118 122 126 124 136 C116 134 108 128 104 118 Z" fill="{IRON}"/>''') + f'''
  <path d="M110 112 C116 108 122 108 126 111" stroke="{IRON_L}" stroke-width="1.6" fill="none"/>
  <path d="M112 120 L116 124 L114 128" stroke="{RUNE}" stroke-width="1.6" fill="none"/>'''
    arm = g(f'''    <path d="M76 66 C88 70 94 80 92 90 L82 92 C82 84 78 78 72 76 Z" fill="{FUR}"/>
    <circle cx="87" cy="90" r="6" fill="{FUR_D}"/>''') + f'''
  <path d="M80 72 L90 78" stroke="{PAINT}" stroke-width="2" opacity="0.8"/>'''
    body = "\n".join([far_arm, LEGS, TORSO, gear(), head(), axe, arm])
    svg("boar_soldier", body, note="Dzik-piechur: brodaty topór z runą, futro na barkach, malunki wojenne, kły.")


def archer():
    bundle = g(f'''    <path d="M30 96 L52 40" stroke="{INK}" stroke-width="4"/>
    <path d="M36 98 L58 42" stroke="{INK}" stroke-width="4"/>''', sw=3) + f'''
  <path d="M30 96 L52 40 M36 98 L58 42" stroke="{WOOD_L}" stroke-width="2"/>
  <path d="M50 44 L54 34 L56 44 Z M56 46 L60 36 L62 46 Z" fill="{IRON_L}" stroke="{INK}" stroke-width="1"/>
  <rect x="32" y="78" width="16" height="18" rx="3" fill="{LEATHER_L}" stroke="{INK}" stroke-width="2" transform="rotate(20 40 86)"/>'''
    javelin = f'''  <path d="M20 22 L112 6" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>
  <path d="M20 22 L112 6" stroke="{WOOD_L}" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M110 1 L126 3 L112 12 Z" fill="{IRON}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M114 5 L122 4" stroke="{RUNE}" stroke-width="1.8"/>
  <path d="M24 18 L18 12 M26 20 L20 24" stroke="{CLOTH}" stroke-width="2.5"/>'''
    arm = g(f'''    <path d="M44 64 C38 50 40 30 48 16 L58 20 C52 32 52 48 56 60 Z" fill="{FUR}"/>
    <circle cx="52" cy="16" r="6" fill="{FUR_D}"/>''')
    near_arm = g(f'    <path d="M78 66 C90 72 98 80 104 86 L98 94 C92 88 84 82 74 78 Z" fill="{FUR}"/>\n    <circle cx="103" cy="90" r="5.5" fill="{FUR_D}"/>')
    body = "\n".join([bundle, arm, LEGS, TORSO, gear(), head(), javelin, near_arm])
    svg("boar_archer", body, note="Dzik-miotacz: oszczep z runicznym grotem wzniesiony do rzutu, wiązka oszczepów na plecach.")


def shield():
    spear = g(f'''    <path d="M118 128 L118 24" stroke="{INK}" stroke-width="6"/>
    <path d="M118 128 L118 24" stroke="{WOOD_L}" stroke-width="3"/>
    <path d="M118 2 L124 22 L112 22 Z" fill="{IRON}"/>''') + f'''
  <path d="M118 8 L118 18" stroke="{RUNE}" stroke-width="1.6"/>
  <path d="M112 26 L106 34 M124 26 L128 34" stroke="{CLOTH}" stroke-width="2.5"/>'''
    sh = g(f'''    <circle cx="90" cy="98" r="30" fill="{WOOD}"/>
    <circle cx="90" cy="98" r="9" fill="{IRON}"/>''') + f'''
  <circle cx="90" cy="98" r="27" fill="none" stroke="{IRON}" stroke-width="4"/>
  <path d="M63 90 A28 28 0 0 1 117 90 L110 92 A21 21 0 0 0 70 92 Z" fill="{TEAM_M}"/>
  <path d="M66 86 A27 27 0 0 1 114 86" stroke="{TEAM}" stroke-width="1.2" fill="none"/>
  <path d="M72 104 L76 118 M104 104 L100 118 M90 110 L90 124" stroke="#4a3220" stroke-width="2"/>
  <path d="M86 94 L90 90 L94 94 L90 102 Z" fill="none" stroke="{RUNE}" stroke-width="1.8"/>
  <circle cx="87" cy="95" r="2" fill="{IRON_L}"/>
  <path d="M104 78 L110 86 L106 90" stroke="{INK}" stroke-width="1.3" fill="none"/>
''' + rivets([(66, 100), (114, 100), (90, 72), (90, 124)], r=1.6, col=IRON_L)
    body = "\n".join([LEGS, TORSO, gear(rune=False), head(helm=True), spear, sh, g(f'    <circle cx="118" cy="68" r="5.5" fill="{FUR_D}"/>')])
    svg("boar_shield", body, world=0.22, note="Dzik-tarczownik: okrągła tarcza z żelaznym umbem i runą, włócznia, hełm z kłem.")


def brute():
    maul = g(f'''    <path d="M92 104 L64 20" stroke="{INK}" stroke-width="9"/>
    <path d="M92 104 L64 20" stroke="{WOOD_L}" stroke-width="5"/>
    <path d="M44 20 C44 8 66 2 80 8 C88 12 88 30 80 34 C66 40 44 34 44 20 Z" fill="#6a6660"/>''') + f'''
  <path d="M50 16 C58 10 70 8 78 11" stroke="#9a9690" stroke-width="2" fill="none"/>
  <path d="M56 22 L60 16 L64 22 L60 28 Z M68 20 L72 26" stroke="{RUNE}" stroke-width="2" fill="none"/>
  <path d="M50 30 L54 26 M78 30 L74 26" stroke="{INK}" stroke-width="1.5"/>'''
    legs = g(f'''    <path d="M36 106 L28 124 L28 138 L54 138 L54 124 L58 108 Z" fill="{FUR_D}"/>
    <path d="M68 108 L66 124 L66 138 L94 138 L92 124 L90 108 Z" fill="{FUR}"/>''')
    torso = g(f'''    <path d="M20 88 C18 62 40 44 66 44 C92 44 110 62 108 88 C106 110 90 120 64 120 C38 120 22 110 20 88 Z" fill="{FUR}"/>
    <path d="M18 64 C24 44 56 36 78 46 C68 58 44 64 28 76 Z" fill="{PELT}"/>''')
    armor = f'''  <path d="M22 62 L18 52 M30 54 L28 44 M40 48 L40 38 M52 44 L54 34" stroke="{PELT}" stroke-width="4"/>
  <path d="M44 84 L84 84 L86 110 L66 118 L46 110 Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M46 86 L83 86" stroke="{TEAM}" stroke-width="1.5"/>
  <path d="M56 96 L66 106 L76 96" stroke="{RUNE}" stroke-width="2" fill="none"/>
  <path d="M34 80 C46 92 62 96 80 92" stroke="{INK}" stroke-width="2" fill="none"/>
  <path d="M40 84 L38 92 L44 90 Z M52 90 L51 98 L56 95 Z M66 92 L66 100 L70 96 Z" fill="{TUSK}" stroke="{INK}" stroke-width="1.2"/>
  <path d="M24 92 C30 110 46 120 64 120 C46 114 32 104 28 88 Z" fill="{FUR_D}" opacity="0.7"/>'''
    arm = g(f'''    <path d="M84 62 C98 68 104 84 100 100 L88 102 C90 90 86 80 78 76 Z" fill="{FUR}"/>
    <circle cx="94" cy="102" r="8" fill="{FUR_D}"/>''') + f'''
  <path d="M86 72 L98 80 M85 80 L97 88" stroke="{PAINT}" stroke-width="2.4" opacity="0.8"/>
  <path d="M86 94 L102 96" stroke="{IRON}" stroke-width="4"/>'''
    h = tr(head(), dx=14, dy=18, s=0.8)
    body = "\n".join([maul, legs, torso, armor, h, arm])
    svg("boar_brute", body, world=0.3, anchor=(62, 136), note="Dzik-osiłek: berserker w skórach, kamienny młot z runami, naszyjnik z kłów.")


def siege():
    sled = g(f'''    <path d="M8 118 C8 110 14 108 20 108 L110 108 C118 108 124 112 122 120 L116 126 L14 126 Z" fill="{WOOD}"/>
    <path d="M26 108 L40 64 L50 64 L60 108 Z" fill="{WOOD}"/>
    <path d="M70 108 L84 64 L94 64 L104 108 Z" fill="{WOOD}"/>
    <path d="M36 70 L98 70" stroke-width="5"/>''') + f'''
  <path d="M36 70 L98 70" stroke="{WOOD_L}" stroke-width="2.5"/>
  <path d="M12 114 L120 114" stroke="{WOOD_L}" stroke-width="1.5"/>
  <path d="M20 112 L30 122 M50 112 L60 122 M80 112 L90 122" stroke="#4a3220" stroke-width="2"/>'''
    arm = g(f'''    <path d="M66 74 L22 36" stroke="{INK}" stroke-width="8"/>
    <path d="M66 74 L22 36" stroke="{WOOD_L}" stroke-width="4.5"/>
    <path d="M8 36 C8 24 30 22 32 34 C32 42 24 46 18 46 C12 46 8 42 8 36 Z" fill="{LEATHER}"/>''')
    boulder = f'''  <circle cx="20" cy="30" r="10" fill="#6a6660" stroke="{INK}" stroke-width="2"/>
  <path d="M15 28 L19 24 L23 28 L19 34 Z" stroke="{RUNE}" stroke-width="2" fill="none"/>
  <circle cx="19" cy="29" r="1.5" fill="{RUNE_C}"/>'''
    skull = g(f'''    <path d="M100 60 C100 48 120 48 122 58 L126 64 L120 70 C116 74 104 74 100 68 Z" fill="{TUSK}"/>
    <path d="M118 66 C124 62 126 54 124 48 C128 56 128 64 122 70 Z" fill="{TUSK}"/>''', sw=2) + f'''
  <circle cx="110" cy="58" r="2.8" fill="{INK}"/><circle cx="110" cy="58" r="1.1" fill="{RUNE}"/>'''
    banner = g(f'''    <path d="M100 108 L100 76" stroke-width="3"/>''') + f'''
  <path d="M88 40 L100 40 L100 76 L88 70 Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2"/>
  <path d="M89 42 L99 42" stroke="{TEAM}" stroke-width="1.2"/>'''
    body = "\n".join([sled, arm, boulder, banner, skull])
    svg("boar_siege", body, world=0.3, anchor=(64, 132), note="Machina dzików: katapulta na płozach z czaszką dzika, głaz z runą.")


def flyer():
    balloon = g(f'''    <path d="M24 44 C18 20 40 2 64 2 C88 2 110 20 104 44 C100 62 84 74 76 80 L52 80 C44 74 28 62 24 44 Z" fill="#9a7a58"/>''') + f'''
  <path d="M44 6 C36 22 36 48 52 80 M64 2 L64 80 M84 6 C92 22 92 48 76 80" stroke="#6a4a30" stroke-width="2" fill="none"/>
  <path d="M26 40 C44 46 84 46 102 40 L100 50 C84 56 44 56 28 50 Z" fill="{TEAM_M}"/>
  <path d="M27 41 C44 47 84 47 101 41" stroke="{TEAM}" stroke-width="1.2" fill="none"/>
  <rect x="70" y="14" width="14" height="12" fill="#7a5a3a" stroke="{INK}" stroke-width="1.5"/>
  <path d="M72 16 L82 24 M82 16 L72 24" stroke="{INK}" stroke-width="1"/>
  <path d="M40 16 C46 10 56 8 62 8" stroke="#c0a07a" stroke-width="2.5" fill="none"/>'''
    ropes = f'''  <path d="M52 80 L50 96 M76 80 L78 96 M60 80 L58 96 M68 80 L70 96" stroke="{INK}" stroke-width="1.5"/>
  <path d="M60 84 C58 90 62 94 64 96 C66 92 70 90 68 84 Z" fill="{RUNE}"/><path d="M62 88 C62 92 64 94 64 94 C65 92 66 90 65 88 Z" fill="{RUNE_C}"/>'''
    h = tr(head(), dx=34, dy=66, s=0.42)
    basket = g(f'''    <path d="M44 96 L84 96 L80 118 L48 118 Z" fill="#8a6a3e"/>''') + f'''
  <path d="M46 102 L82 102 M47 108 L81 108 M48 113 L80 113" stroke="#5a4226" stroke-width="1.5"/>
  <path d="M52 96 L50 118 M60 96 L59 118 M68 96 L68 118 M76 96 L77 118" stroke="#5a4226" stroke-width="1.2"/>'''
    body = "\n".join([balloon, ropes, h, basket])
    svg("boar_flyer", body, world=0.24, anchor=(64, 120), note="Latający dzik: balon z łatanej skóry z palnikiem, dzik w wiklinowym koszu.")


if __name__ == "__main__":
    soldier(); archer(); shield(); brute(); siege(); flyer()
    print("boar ok")
