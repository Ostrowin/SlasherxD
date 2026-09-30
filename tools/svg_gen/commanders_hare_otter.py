# Dowódcy zajęcy i wydr (D30: w każdej rasie są odmiany sci-fi i fantasy).
#   zające: Skoczek (sci-fi), Przywoływacz (fantasy), Mistrz Aur (sci-fi)
#   wydry:  Pani Przypływu (fantasy), Lustrzany Nurt (sci-fi), Figlarz (fantasy)
#
#   python tools/svg_gen/commanders_hare_otter.py   (albo razem z resztą: commanders.py)
from common import *
import hare as HR
import otter as OT

W = 0.27  # jak w commanders.py — dowódca ~30% większy od piechura


def cmd(name, body, note, h=144, anchor=(64, 136)):
    svg("cmd_" + name, body, h=h, world=W, anchor=anchor, scale=0.85, note=note)


def hare_cmd(name, body, note):
    """Dowódca-zając: płótno wyższe o HR.EARS (uszy), stopy w tym samym miejscu."""
    cmd(name, tr(body, dy=HR.EARS), note, h=144 + HR.EARS, anchor=(64, 136 + HR.EARS))


# ------------------------------------------------------------------ zające

def slipstream():
    boots = f'''  <path d="M42 128 L40 138 L66 138 L64 128 Z M66 130 L66 140 L96 140 L94 130 Z" fill="{METAL}" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M40 140 C36 142 34 143 30 143 M52 140 C50 142 48 143 46 143 M70 142 C68 143 66 143 62 143" stroke="{HR.WIND}" stroke-width="2.5" stroke-linecap="round"/>
  <rect x="46" y="130" width="10" height="4" fill="{HR.WIND}"/><rect x="76" y="132" width="12" height="4" fill="{HR.WIND}"/>'''
    scarf = g(f'''    <path d="M58 68 C44 64 30 70 16 64 C24 72 30 74 36 74 C28 78 22 80 14 80 C26 86 42 80 56 76 Z" fill="{TEAM_M}"/>''') + f'''
  <path d="M56 70 C44 68 32 72 20 68" stroke="{TEAM}" stroke-width="1.2" fill="none"/>'''

    def dagger(x1, y1, x2, y2):
        return f'''  <path d="M{x1} {y1} L{x2} {y2}" stroke="{INK}" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M{x1} {y1} L{x2} {y2}" stroke="{HR.CERAMIC}" stroke-width="3.2" stroke-linecap="round"/>
  <path d="M{x1} {y1} L{x2} {y2}" stroke="{HR.WIND}" stroke-width="1" stroke-linecap="round"/>'''
    far = g(f'    <path d="M58 76 C48 72 40 70 32 72 L32 80 C40 80 48 82 54 88 Z" fill="{HR.FUR_D}"/>') + HR.paw(30, 76, 5) + dagger(28, 78, 12, 100)
    near = g(f'    <path d="M80 70 C92 72 100 78 104 86 L96 92 C92 86 86 82 76 80 Z" fill="{HR.FUR}"/>') + HR.paw(102, 90, 5) + dagger(104, 88, 124, 64)
    suit = g(f'''    <path d="M54 76 C64 70 80 70 90 76 C94 92 90 106 80 112 L60 112 C50 106 48 92 54 76 Z" fill="#2c3440"/>''') + f'''
  <path d="M58 84 L90 84 M56 94 L90 94" stroke="{HR.WIND}" stroke-width="1.5"/>
  <path d="M64 74 L74 74 L74 112 L64 112 Z" fill="{TEAM_M}" opacity="0.9"/>'''
    body = "\n".join([scarf, HR.TAIL, far, HR.LEGS, boots, HR.TORSO, suit, near, HR.head(ears_back=True)])
    hare_cmd("slipstream", body, "Skoczek (sci-fi): buty odrzutowe ze smugą wiatru, dwa ceramiczne sztylety, szal koloru drużyny.")


def summoner():
    robe = g(f'''    <path d="M44 72 C38 96 36 120 32 136 L96 136 C94 118 92 96 88 72 C80 64 52 64 44 72 Z" fill="#3a5a3e"/>
    <path d="M60 70 L62 136 L70 136 L74 70 Z" fill="#4a7050"/>''') + f'''
  <path d="M34 130 L96 130" stroke="#9ae070" stroke-width="3"/>
  <path d="M40 120 C46 116 50 124 56 120 C62 116 66 124 72 120" stroke="#b8f090" stroke-width="1.5" fill="none"/>
  <path d="M46 80 L88 80 L88 86 L46 86 Z" fill="{TEAM_M}"/>'''
    branches = "M106 34 C98 26 94 16 98 6 M106 34 C112 24 120 20 124 10 M106 30 C104 22 108 14 112 10"
    staff = g(f'''    <path d="M104 136 L106 30" stroke-width="7"/>
    <path d="{branches}" fill="none" stroke-width="5"/>''') + f'''
  <path d="M104 136 L106 30" stroke="#6a4a2e" stroke-width="3.5"/>
  <path d="{branches}" fill="none" stroke="#8a6a44" stroke-width="2.5"/>
  <circle cx="108" cy="22" r="6" fill="#9ae070" stroke="{INK}" stroke-width="1.5"/><circle cx="108" cy="22" r="14" fill="#9ae070" opacity="0.2"/>'''
    spirits = f'''  <path d="M18 60 C10 52 14 40 24 42 C30 36 38 42 34 50 C38 58 28 66 18 60 Z" fill="#b8f0d0" opacity="0.55" stroke="#70c090" stroke-width="1.5"/>
  <circle cx="22" cy="50" r="1.6" fill="{INK}"/><circle cx="28" cy="50" r="1.6" fill="{INK}"/>
  <path d="M20 100 C14 94 18 86 24 88 C28 84 34 88 32 94 C34 100 26 104 20 100 Z" fill="#b8f0d0" opacity="0.45" stroke="#70c090" stroke-width="1.2"/>'''
    arm = g(f'''    <path d="M80 70 C92 70 100 72 104 78 L100 86 C92 82 86 80 76 80 Z" fill="#3a5a3e"/>''') + HR.paw(104, 82, 5)
    hood = f'''
  <path d="M46 56 C42 40 50 30 62 32 C58 42 58 52 64 66 Z" fill="#3a5a3e" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M64 30 L68 22 L72 30" fill="#9ae070" stroke="{INK}" stroke-width="1.5"/>'''
    body = "\n".join([spirits, robe, HR.head(visor=False, extra=hood), staff, arm])
    hare_cmd("summoner", body, "Przywoływacz (fantasy): druid w zielonej szacie, kostur z gałęzi z kryształem, duchy-przywołańce.")


def aura_master():
    rig = g(f'''    <rect x="30" y="62" width="20" height="40" rx="5" fill="{HR.CERAMIC_D}"/>
    <path d="M40 62 L40 30" stroke-width="3"/>''', sw=2.2) + f'''
  <path d="M40 62 L40 30" stroke="{METAL_L}" stroke-width="1.5"/>
  <circle cx="40" cy="28" r="4" fill="#ffffff" stroke="{INK}" stroke-width="1.5"/>
  <circle cx="24" cy="36" r="6" fill="#7dff9a" stroke="{INK}" stroke-width="1.5"/><circle cx="24" cy="36" r="11" fill="#7dff9a" opacity="0.2"/>
  <circle cx="54" cy="24" r="6" fill="{HR.WIND}" stroke="{INK}" stroke-width="1.5"/><circle cx="54" cy="24" r="11" fill="{HR.WIND}" opacity="0.2"/>
  <circle cx="18" cy="60" r="6" fill="#ffd060" stroke="{INK}" stroke-width="1.5"/><circle cx="18" cy="60" r="11" fill="#ffd060" opacity="0.2"/>
  <path d="M40 28 C30 24 26 30 24 36 M40 28 C46 22 50 22 54 24 M40 36 C30 44 22 52 18 60" stroke="#ffffff" stroke-width="1" fill="none" opacity="0.6" stroke-dasharray="3 3"/>'''
    baton = f'''  <path d="M100 90 L118 60" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>
  <path d="M100 90 L118 60" stroke="{HR.CERAMIC}" stroke-width="3" stroke-linecap="round"/>
  <circle cx="119" cy="58" r="4" fill="#ffd060" stroke="{INK}" stroke-width="1.5"/>'''
    far = g(f'    <path d="M58 78 C50 86 52 94 60 96 L66 92 C60 90 62 84 64 80 Z" fill="{HR.FUR_D}"/>')
    near = g(f'    <path d="M78 72 C90 74 98 82 100 90 L92 94 C88 86 82 82 74 80 Z" fill="{HR.FUR}"/>') + HR.paw(98, 92, 5)
    body = "\n".join([rig, HR.TAIL, far, HR.LEGS, HR.TORSO, HR.vest(), near, baton, HR.head()])
    hare_cmd("aura_master", body, "Mistrz Aur (sci-fi): plecak-nadajnik z trzema kulami aur (leczenie, osłona, blask), batuta.")


# ------------------------------------------------------------------ wydry

def tidecaller():
    robe = g(f'''    <path d="M44 72 C38 96 36 120 32 136 L96 136 C94 118 92 96 88 72 C80 64 52 64 44 72 Z" fill="#1f5a66"/>
    <path d="M60 70 L62 136 L70 136 L74 70 Z" fill="#2a7480"/>''') + f'''
  <path d="M34 128 C42 122 48 132 56 126 C64 120 70 132 78 126 C86 120 90 130 96 126" stroke="{OT.WATER}" stroke-width="3" fill="none"/>
  <path d="M46 80 L88 80 L88 86 L46 86 Z" fill="{TEAM_M}"/>
  <path d="M50 92 C56 98 64 98 70 94" stroke="{OT.SHELL}" stroke-width="2.5" fill="none"/>'''
    staff = g('    <path d="M104 136 L106 34" stroke-width="7"/>') + f'''
  <path d="M104 136 L106 34" stroke="{OT.ROPE}" stroke-width="3.5"/>
  <circle cx="106" cy="24" r="12" fill="{OT.WATER}" stroke="{INK}" stroke-width="2.5"/>
  <circle cx="102" cy="20" r="4" fill="{OT.WATER_C}"/><circle cx="106" cy="24" r="20" fill="{OT.WATER}" opacity="0.18"/>
  <path d="M96 30 C92 40 100 44 106 40 C112 36 118 42 114 50" stroke="{OT.WATER}" stroke-width="2" fill="none" opacity="0.8"/>'''
    crown = f'''
  <path d="M54 30 L50 16 L58 24 L60 10 L66 22 L70 12 L74 26" fill="#e87060" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M52 32 C60 26 72 24 82 28" stroke="{OT.SHELL}" stroke-width="3" fill="none"/>'''
    arm = g(f'''    <path d="M80 70 C92 70 100 72 104 78 L100 86 C92 82 86 80 76 80 Z" fill="#1f5a66"/>''') + OT.paw(104, 82, 5)
    body = "\n".join([OT.TAIL, robe, OT.head(hat=crown), staff, arm])
    cmd("tidecaller", body, "Pani Przypływu (fantasy): szata z falami, korona z koralowca, kostur z kulą wody.")


def mirror_tide():
    clone = f'''  <g opacity="0.35" transform="translate(-26 -4)">
    <path d="M42 94 C40 76 52 64 68 64 C84 64 94 76 94 94 C94 110 84 118 68 118 C52 118 42 110 42 94 Z" fill="{OT.WATER}" stroke="{OT.WATER_C}" stroke-width="2"/>
    <path d="M46 52 C46 36 60 28 76 28 C92 28 104 38 104 50 C104 62 92 70 76 70 C60 70 46 64 46 52 Z" fill="{OT.WATER}" stroke="{OT.WATER_C}" stroke-width="2"/>
  </g>
  <path d="M20 70 L30 70 M16 90 L28 90 M22 110 L32 110" stroke="{OT.WATER_C}" stroke-width="1.5" opacity="0.7"/>'''
    suit = g('    <path d="M54 76 C64 70 80 70 90 76 C94 92 90 106 80 112 L60 112 C50 106 48 92 54 76 Z" fill="#222a33"/>') + f'''
  <path d="M56 80 L92 100 L90 106 L54 86 Z" fill="{TEAM_M}"/>
  <path d="M60 96 L70 102 L82 98" stroke="{OT.WATER}" stroke-width="1.8" fill="none"/>
  <circle cx="84" cy="84" r="3.5" fill="{OT.WATER}" stroke="{INK}" stroke-width="1.2"/>'''
    lance = f'''  <path d="M84 104 L126 38" stroke="{INK}" stroke-width="6" stroke-linecap="round"/>
  <path d="M84 104 L126 38" stroke="{METAL_L}" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M104 72 L126 38" stroke="{OT.WATER}" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M122 30 L128 34 L126 44 Z" fill="{OT.WATER_C}" stroke="{INK}" stroke-width="1.5"/>'''
    visor = f'''
  <path d="M80 38 C88 35 98 36 102 42 C100 48 92 50 86 49 C82 48 79 44 80 38 Z" fill="{OT.WATER}" stroke="{INK}" stroke-width="2"/>
  <path d="M50 44 C62 40 72 38 80 40" stroke="{METAL_D}" stroke-width="4" fill="none"/>
  <path d="M84 40 L98 42" stroke="{OT.WATER_C}" stroke-width="1.5"/>'''
    far = g(f'    <path d="M58 78 C50 86 52 94 60 96 L66 92 C60 90 62 84 64 80 Z" fill="{OT.FUR_D}"/>')
    near = g(f'    <path d="M78 72 C90 76 94 86 90 96 L82 96 C84 88 80 82 74 80 Z" fill="{OT.FUR}"/>') + OT.paw(88, 98)
    body = "\n".join([clone, OT.TAIL, far, OT.LEGS, OT.TORSO, suit, lance, near, OT.head(extra=visor)])
    cmd("mirror_tide", body, "Lustrzany Nurt (sci-fi): kombinezon nurka, lanca z żyłą wody, hologram-klon za plecami.")


def playful():
    bandana = f'''
  <path d="M48 42 C54 30 70 26 84 28 C94 30 100 36 102 42 C84 36 64 36 48 42 Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M50 40 C40 42 34 50 30 58 L38 54 L36 62 C42 54 46 48 52 44 Z" fill="{TEAM_M}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="64" cy="34" r="2" fill="#ffffff"/><circle cx="76" cy="32" r="2" fill="#ffffff"/>'''
    buckler = g(f'    <path d="M30 78 C30 64 52 62 54 76 C56 92 46 100 38 100 C32 98 30 90 30 78 Z" fill="{OT.SHELL_P}"/>') + f'''
  <path d="M42 66 L42 98 M36 70 L34 94 M48 70 L50 94" stroke="#b86a6a" stroke-width="1.5"/>'''
    paddle = g('''    <path d="M88 98 L112 50" stroke-width="6"/>
    <path d="M106 54 C104 40 114 30 122 34 C128 40 124 54 114 60 Z" fill="#8a6a44"/>''') + f'''
  <path d="M88 98 L112 50" stroke="#a88660" stroke-width="3"/>
  <path d="M110 50 C112 42 118 38 122 38" stroke="#c0a070" stroke-width="1.5" fill="none"/>'''
    pebbles = f'''  <circle cx="100" cy="14" r="4" fill="#9a9a9a" stroke="{INK}" stroke-width="1.5"/>
  <circle cx="116" cy="8" r="3.5" fill="{OT.SHELL}" stroke="{INK}" stroke-width="1.5"/>
  <circle cx="86" cy="10" r="3" fill="#7a8a90" stroke="{INK}" stroke-width="1.5"/>
  <path d="M92 12 C96 4 104 4 108 10 M104 8 C108 2 114 2 118 6" stroke="{OT.WATER_C}" stroke-width="1.2" fill="none" stroke-dasharray="2 3"/>'''
    wraps = f'  <path d="M20 118 L24 124 M28 112 L32 118 M36 108 L40 114" stroke="{OT.ROPE}" stroke-width="3"/>'
    near = g(f'    <path d="M78 72 C90 76 94 86 90 96 L82 96 C84 88 80 82 74 80 Z" fill="{OT.FUR}"/>') + OT.paw(88, 98)
    body = "\n".join([OT.TAIL, wraps, OT.LEGS, OT.TORSO, OT.shell_armor(), buckler, near, paddle, OT.head(hat=bandana), pebbles])
    cmd("playful", body, "Figlarz (fantasy): bandana, wiosło jako pałka, tarcza z muszli, żongluje kamykami.")


def all_():
    slipstream(); summoner(); aura_master(); tidecaller(); mirror_tide(); playful()


if __name__ == "__main__":
    all_()
    print("commanders hare/otter ok")
