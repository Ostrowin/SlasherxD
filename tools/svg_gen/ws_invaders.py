# Najeźdźcy WebSlashera (plan-grafik.md, Etap 3; grafika.md p. 6): 5 typów hordy + 7 bossów.
#
# Czytelność w hordzie (~400 sztuk) trzyma SYLWETKA z dawnych wielokątów:
#   alien = trójkąt (smukły owad, szpiczasta głowa), demon = romb (rogi, szerokie barki),
#   mag = sześciokąt (szata do ziemi, unosi się, korona z kryształów), robot = ośmiokąt (kanciasty, jedno oko),
#   brute = ostrze w dół (chitynowy ogr z młotem z meteorytu — wybór użytkownika).
# Paleta ZIMNA i obca (chityna, sina tkanka, chłodna stal) — ssaki są ciepłe, więc swój/wróg widać od razu.
# Oczy i rdzenie w kolorze typu z gry (ENEMIES[].color) — płaski jasny kolor w rysunku, BEZ obiektów poświaty
# (plan: 0 dodatkowych obiektów na wroga w hordzie). Bossowie mają poświatę z kodu (`data-glow`), bo jest ich kilku.
#
# Kotwica = środek hitboxu (sim trzyma wroga jako koło). BODY = promień rysunku w jedn. SVG, który gra
# dopasowuje do promienia z symulacji (× INVADER_SIZE w manifeście).
#
#   python tools/svg_gen/ws_invaders.py
import math

from common import *
import grit

# chityna, sina tkanka, chłodna stal, kość, szata
CH, CH_D, CH_L = "#4d5c4a", "#313d30", "#6f8468"
FL, FL_D, FL_L = "#5e4a6e", "#3c2e4a", "#7e6690"
ST, ST_D, ST_L = "#4a5562", "#2c333c", "#76889a"
BONE = "#cfd6c4"
ROBE, ROBE_D = "#2c3450", "#1c2236"
ROCK, ROCK_D = "#3a3230", "#241e1c"


def _write(name, body, w, h, anchor, glow, grime, note):
    svg(name, body, w=w, h=h, anchor=anchor, grime=grime, note=note)
    if not glow:
        return
    path = os.path.join(OUT, name + ".svg")
    with open(path, encoding="utf-8") as f:
        text = f.read()
    attrs = "; ".join(f"{x} {y} {r}" for x, y, r in glow)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text.replace("<svg ", f'<svg data-glow="{attrs}" ', 1))


def mob(name, body, note, grime=0.9):
    """Wróg hordy: płótno 96×96, środek ciała (48, 56), BODY = 30 jedn."""
    _write("inv_" + name, body, 96, 96, (48, 56), None, grime, note)


def boss(name, body, note, glow, grime=0.9):
    """Boss: płótno 160×160, środek ciała (80, 86), BODY = 56 jedn."""
    _write("boss_" + name, body, 160, 160, (80, 86), glow, grime, note)


def eye(x, y, r, col, slit=False):
    if slit:
        return f'  <ellipse cx="{x}" cy="{y}" rx="{r * 1.4:.1f}" ry="{r * 0.55:.1f}" fill="{col}" stroke="{INK}" stroke-width="1"/>'
    return f'  <circle cx="{x}" cy="{y}" r="{r}" fill="{col}" stroke="{INK}" stroke-width="1"/>'


def shadow(cx, cy, rx, ry):
    return f'  <ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#000" opacity="0.3"/>'


# ------------------------------------------------------------------ horda

def alien():
    """Trójkąt: smukły owad pochylony do przodu, szpiczasta głowa, kosy z kości."""
    col = "#39ff8a"
    legs = g(f'''    <path d="M40 62 L32 74 L36 86" fill="none" stroke-width="5"/>
    <path d="M52 62 L58 74 L54 86" fill="none" stroke-width="5"/>''', sw=0) + f'''
  <path d="M40 62 L32 74 L36 86 M52 62 L58 74 L54 86" fill="none" stroke="{CH_D}" stroke-width="2.6" stroke-linecap="round"/>'''
    body = g(f'''    <ellipse cx="34" cy="60" rx="12" ry="9" fill="{CH_D}"/>
    <path d="M40 66 C36 56 42 44 52 42 C60 42 62 52 58 62 C54 68 46 70 40 66 Z" fill="{CH}"/>
    <path d="M50 46 C50 32 58 20 66 10 C70 22 68 36 62 48 Z" fill="{CH}"/>''')
    detail = f'''  <path d="M28 56 L22 50 M34 52 L30 44 M40 50 L38 42" stroke="{BONE}" stroke-width="2" stroke-linecap="round"/>
  <path d="M54 22 C58 18 62 14 64 12" stroke="{CH_L}" stroke-width="1.6" fill="none"/>
  <path d="M44 50 C48 48 54 48 56 52" stroke="{CH_L}" stroke-width="1.6" fill="none"/>
{eye(61, 30, 2.4, col, slit=True)}
{eye(58, 38, 1.8, col, slit=True)}'''
    arm = g(f'''    <path d="M56 50 L72 52 L80 66 L74 60 L66 58 L56 56 Z" fill="{BONE}"/>''', sw=2) + f'''
  <path d="M58 52 L70 54" stroke="{CH_D}" stroke-width="1.5"/>'''
    mob("alien", "\n".join([shadow(46, 84, 16, 4), legs, body, detail, arm]),
        "Alien (trójkąt): smukły owad pochylony do przodu, szpiczasta głowa, kosy z kości, zielone oczy.")


def demon():
    """Romb: rogi, szerokie barki zwężające się w pas i nogi, kolczasty ogon."""
    col = "#ff2965"
    tail = g(f'    <path d="M30 62 C20 66 14 72 10 78 L16 76 L12 84 C20 78 28 72 34 68 Z" fill="{FL_D}"/>', sw=2)
    legs = g(f'''    <path d="M42 66 L38 86 L46 86 L48 68 Z" fill="{FL_D}"/>
    <path d="M52 66 L56 86 L64 86 L58 66 Z" fill="{FL}"/>''', sw=2.5)
    torso = g(f'''    <path d="M36 38 C44 34 56 34 62 38 L76 50 C70 58 60 62 56 70 L42 70 C38 62 26 58 20 50 Z" fill="{FL}"/>''') + f'''
  <path d="M26 50 C34 56 40 60 42 68 L56 68 C58 62 62 58 70 54 C60 58 52 60 48 64 C44 60 36 56 26 50 Z" fill="{FL_D}" opacity="0.7"/>
  <path d="M40 40 C46 38 52 38 58 40" stroke="{FL_L}" stroke-width="2" fill="none"/>
  <path d="M44 50 L48 56 L52 50 M46 58 L48 62 L50 58" stroke="{col}" stroke-width="1.8" fill="none"/>'''
    head = g(f'''    <circle cx="50" cy="32" r="8" fill="{FL_L}"/>
    <path d="M44 28 C38 24 34 18 34 10 C40 16 44 20 48 24 Z" fill="{BONE}"/>
    <path d="M54 26 C60 20 62 14 62 6 C66 14 64 22 58 28 Z" fill="{BONE}"/>''', sw=2.2) + f'''
{eye(54, 31, 1.8, col)}
  <path d="M52 37 L58 36" stroke="{INK}" stroke-width="1.5"/>'''
    claws = g(f'''    <path d="M72 48 L82 54 L78 56 L84 60 L74 60 L66 54 Z" fill="{BONE}"/>
    <path d="M24 48 L16 56 L22 56 L18 62 L28 56 Z" fill="{BONE}"/>''', sw=2)
    mob("demon", "\n".join([shadow(48, 86, 18, 4), tail, legs, torso, claws, head]),
        "Demon (romb): rogi, szerokie barki, wąski pas, kolczasty ogon, czerwone runy i oko.")


def mage():
    """Sześciokąt: szata do ziemi, unosi się nad ziemią, korona z kryształów, kula w dłoni."""
    col, col_l = "#22d4ff", "#aef2ff"
    hover = f'''  <ellipse cx="48" cy="90" rx="14" ry="3" fill="{col}" opacity="0.35"/>'''
    robe = g(f'''    <path d="M48 24 L66 34 L68 68 L60 82 L54 78 L48 84 L42 78 L36 82 L28 68 L30 34 Z" fill="{ROBE}"/>''') + f'''
  <path d="M32 40 L30 66 L36 78 C34 64 36 50 40 38 Z" fill="{ROBE_D}" opacity="0.8"/>
  <path d="M48 44 L48 80" stroke="{FL_L}" stroke-width="2"/>
  <path d="M42 56 L48 50 L54 56 L48 62 Z" fill="none" stroke="{col}" stroke-width="1.8"/>'''
    hood = g(f'''    <path d="M36 34 C36 20 44 14 50 14 C58 14 62 22 62 34 C56 38 42 38 36 34 Z" fill="{ROBE_D}"/>''', sw=2.5) + f'''
  <path d="M42 30 C44 24 54 24 58 30 C54 34 46 34 42 30 Z" fill="#0c0f1a"/>
{eye(47, 29, 1.6, col)}
{eye(54, 29, 1.6, col)}'''
    crown = g(f'''    <path d="M40 18 L38 6 L44 14 Z" fill="{col}"/>
    <path d="M48 14 L49 0 L53 12 Z" fill="{col}"/>
    <path d="M56 16 L62 6 L60 18 Z" fill="{col}"/>''', sw=1.6) + f'''
  <path d="M49 3 L50 10" stroke="{col_l}" stroke-width="1.2"/>'''
    hand = g(f'    <path d="M62 44 C70 46 72 52 70 56 L64 56 C64 52 62 50 60 50 Z" fill="{ROBE}"/>', sw=2) + f'''
  <circle cx="68" cy="60" r="5.5" fill="{col}" stroke="{INK}" stroke-width="1.8"/>
  <circle cx="66.5" cy="58.5" r="1.8" fill="{col_l}"/>'''
    mob("mage", "\n".join([hover, robe, hand, hood, crown]),
        "Alien Mage (sześciokąt): szata do ziemi, unosi się, korona z kryształów i kula w kolorze cyjanu.")


def robot():
    """Ośmiokąt: kanciasty korpus z płyt, jedno oko-sensor, krótkie nogi, antena."""
    col = "#ffcc00"
    octo = " L".join(f"{48 + math.cos(a) * 22:.1f} {50 + math.sin(a) * 22:.1f}" for a in [k * math.pi / 4 + math.pi / 8 for k in range(8)])
    legs = g(f'''    <rect x="34" y="66" width="11" height="16" rx="2" fill="{ST_D}"/>
    <rect x="51" y="66" width="11" height="16" rx="2" fill="{ST}"/>
    <path d="M30 84 L48 84 M48 84 L66 84" stroke-width="3"/>''', sw=2.2) + f'''
  <path d="M30 84 L48 84 L48 86 L30 86 Z M48 84 L66 84 L66 86 L48 86 Z" fill="{ST_D}" stroke="{INK}" stroke-width="1.5"/>'''
    ant = g(f'    <path d="M38 32 L32 18" stroke-width="3"/>', sw=0) + f'''
  <path d="M38 32 L32 18" stroke="{ST_L}" stroke-width="1.6"/>
  <circle cx="32" cy="17" r="2.6" fill="{col}" stroke="{INK}" stroke-width="1"/>'''
    body = g(f'    <path d="M{octo} Z" fill="{ST}"/>') + f'''
  <path d="M30 38 L48 28 L62 34" stroke="{ST_L}" stroke-width="2" fill="none"/>
  <path d="M34 62 L48 70 L62 64" stroke="{ST_D}" stroke-width="2.5" fill="none"/>
  <path d="M28 50 L68 50" stroke="{ST_D}" stroke-width="1.5"/>
''' + rivets([(32, 44), (64, 44), (34, 58), (62, 58)], r=1.4, col=ST_L)
    sensor = f'''  <circle cx="54" cy="46" r="8.5" fill="{INK}"/>
  <circle cx="54" cy="46" r="6.5" fill="#3a2e10" stroke="{ST_D}" stroke-width="1.2"/>
  <circle cx="55" cy="46" r="4" fill="{col}"/>
  <circle cx="53.5" cy="44.5" r="1.3" fill="#fff4c0"/>'''
    arm = g(f'''    <rect x="66" y="52" width="14" height="8" rx="2" fill="{ST_D}"/>
    <path d="M80 50 L86 54 L80 62 Z" fill="{ST}"/>''', sw=2)
    marks = grit.scratches(30, 36, 34, 26, n=5, seed=301, length=(2.0, 5.0))
    mob("robot", "\n".join([shadow(48, 86, 20, 4), legs, ant, body, arm, sensor, marks]),
        "Robot (ośmiokąt): kanciasty korpus z płyt, jedno żółte oko-sensor, antena, krótkie nogi. Mocno brudny.", grime=1.0)


def brute():
    """Ostrze w dół: garbaty chitynowy ogr, masywne barki, mała głowa, młot z kawałka meteorytu."""
    col = "#ff6b1a"
    legs = g(f'''    <path d="M56 94 L50 116 L60 116 L64 96 Z" fill="{CH_D}"/>
    <path d="M70 94 L74 116 L84 116 L78 94 Z" fill="{CH}"/>''', sw=2.5)
    body = g(f'''    <path d="M22 44 C28 28 56 22 76 26 C96 30 108 42 104 58 C100 76 84 90 72 98 L56 98 C44 90 28 72 22 44 Z" fill="{CH}"/>''', sw=3) + f'''
  <path d="M28 56 C36 74 48 88 58 96 L70 96 C58 86 44 72 36 54 Z" fill="{CH_D}" opacity="0.75"/>
  <path d="M30 40 C40 30 62 26 78 30" stroke="{CH_L}" stroke-width="3" fill="none"/>
  <path d="M40 34 L36 22 M52 30 L50 16 M64 28 L66 14 M76 30 L82 18" stroke="{BONE}" stroke-width="4" stroke-linecap="round"/>
  <path d="M40 34 L36 22 M52 30 L50 16 M64 28 L66 14 M76 30 L82 18" stroke="{INK}" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
  <path d="M46 52 C54 48 66 48 74 52 M50 64 C56 60 66 60 72 64" stroke="{CH_D}" stroke-width="2" fill="none"/>'''
    head = g(f'''    <circle cx="86" cy="52" r="10" fill="{CH_D}"/>
    <path d="M92 58 L100 64 L94 64 Z M88 60 L92 68 L86 64 Z" fill="{BONE}"/>''', sw=2.2) + f'''
{eye(90, 49, 2, col)}
{eye(85, 50, 1.5, col)}'''
    rock_pts = " L".join(f"{104 + math.cos(a) * r:.1f} {18 + math.sin(a) * r:.1f}" for a, r in
                         [(k * math.pi / 4, 16 if k % 2 else 13) for k in range(8)])
    hammer = g(f'''    <path d="M94 70 L104 22" stroke-width="8"/>''', sw=0) + f'''
  <path d="M94 70 L104 22" stroke="{INK}" stroke-width="8" stroke-linecap="round"/>
  <path d="M94 70 L104 22" stroke="#5a4636" stroke-width="4.5" stroke-linecap="round"/>
''' + g(f'    <path d="M{rock_pts} Z" fill="{ROCK}"/>', sw=2.5) + f'''
  <path d="M94 12 L100 18 L96 24 M108 10 L106 18 L114 22" stroke="{col}" stroke-width="2.2" fill="none" stroke-linejoin="round"/>
  <path d="M96 8 C100 6 106 6 110 8" stroke="#6a5a54" stroke-width="2" fill="none"/>'''
    arm = g(f'''    <path d="M80 40 C96 42 104 56 100 68 L90 72 C90 62 86 54 78 52 Z" fill="{CH}"/>''', sw=3) + f'''
  <circle cx="95" cy="68" r="7" fill="{CH_D}" stroke="{INK}" stroke-width="2"/>'''
    marks = grit.scratches(34, 36, 50, 30, n=5, seed=311, length=(3.0, 7.0))
    _write("inv_brute", "\n".join([shadow(66, 116, 26, 5), legs, body, marks, head, hammer, arm]), 128, 128, (64, 72), None, 0.9,
           "Brute (ostrze w dół): garbaty chitynowy ogr, kolce na grzbiecie, młot z meteorytu z żarem.")


# ------------------------------------------------------------------ bossowie

def void_warden():
    """VOID WARDEN (fala 5, szybki, szarże): wysoki rycerz pustki w poszarpanej pelerynie, fioletowy wizjer i rdzeń."""
    col, col_l = "#9d4edd", "#e2c8ff"
    cloak = g(f'''    <path d="M56 50 C44 70 36 104 32 138 L44 130 L50 140 L58 128 L66 138 L70 120 C70 94 72 70 76 54 Z" fill="#2a2038"/>''')
    legs = g(f'''    <path d="M70 110 L64 144 L78 144 L80 112 Z" fill="{ST_D}"/>
    <path d="M86 110 L92 144 L106 144 L98 110 Z" fill="{ST}"/>''')
    torso = g(f'''    <path d="M60 50 C68 40 96 40 104 50 L108 96 C100 112 66 112 58 96 Z" fill="{ST}"/>''') + f'''
  <path d="M64 60 C74 54 92 54 100 60" stroke="{ST_L}" stroke-width="2.5" fill="none"/>
  <circle cx="82" cy="80" r="11" fill="#1a1024" stroke="{INK}" stroke-width="2.5"/>
  <circle cx="82" cy="80" r="6" fill="{col}"/><circle cx="80" cy="78" r="2" fill="{col_l}"/>
  <path d="M62 96 C74 104 92 104 104 96" stroke="{ST_D}" stroke-width="3" fill="none"/>'''
    head = g(f'''    <path d="M68 44 C66 26 74 14 84 14 C96 14 102 26 100 44 C92 50 76 50 68 44 Z" fill="{ST_D}"/>
    <path d="M84 14 L86 0 L90 16 Z" fill="{ST}"/>''') + f'''
  <path d="M76 32 C82 28 94 28 98 32 L96 38 C90 36 82 36 78 38 Z" fill="{col}" stroke="{INK}" stroke-width="1.5"/>'''
    arm = g(f'''    <path d="M102 54 C116 58 124 70 122 84 L112 86 C112 74 108 66 100 64 Z" fill="{ST}"/>
    <path d="M112 84 L136 58 L140 62 L118 92 Z" fill="{ST_D}"/>''') + f'''
  <path d="M116 86 L138 60" stroke="{col}" stroke-width="2"/>'''
    marks = grit.scratches(64, 56, 40, 40, n=6, seed=401)
    boss("void_warden", "\n".join([shadow(84, 146, 36, 6), cloak, legs, torso, marks, head, arm]),
         "Void Warden: rycerz pustki w poszarpanej pelerynie, fioletowy wizjer, rdzeń i ostrze.",
         glow=[(82, 80, 10), (87, 34, 8), (127, 72, 6)])


def plasma_reaver():
    """PLASMA REAVER (fala 7): smukły zabójca-owad z dwiema plazmowymi kosami, cyjanowe ostrza."""
    col, col_l = "#00e5ff", "#b8f8ff"
    legs = g(f'''    <path d="M62 104 L48 128 L54 146" fill="none" stroke-width="7"/>
    <path d="M84 104 L96 128 L90 146" fill="none" stroke-width="7"/>
    <path d="M72 106 L72 130 L66 146" fill="none" stroke-width="6"/>''', sw=0) + f'''
  <path d="M62 104 L48 128 L54 146 M84 104 L96 128 L90 146 M72 106 L72 130 L66 146" fill="none" stroke="{ST_D}" stroke-width="3.6" stroke-linecap="round"/>'''
    body = g(f'''    <ellipse cx="54" cy="96" rx="22" ry="14" fill="{ST_D}"/>
    <path d="M60 104 C54 84 62 64 80 60 C98 58 104 76 98 94 C92 106 72 110 60 104 Z" fill="{ST}"/>
    <path d="M84 64 C84 46 94 30 106 18 C112 32 108 50 100 66 Z" fill="{ST}"/>''') + f'''
  <path d="M40 92 L30 84 M48 88 L42 76 M58 86 L54 74" stroke="{col}" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M68 72 C76 68 88 68 94 74" stroke="{ST_L}" stroke-width="2.5" fill="none"/>
{eye(99, 38, 3, col, slit=True)}
{eye(95, 48, 2.2, col, slit=True)}'''
    def scythe(x, y, dx, dy):
        return g(f'    <path d="M{x} {y} L{x + dx} {y + dy} L{x + dx + 18} {y + dy + 26} L{x + dx + 4} {y + dy + 12} Z" fill="{col}"/>', sw=2.2) + f'''
  <path d="M{x + dx + 2} {y + dy + 4} L{x + dx + 12} {y + dy + 18}" stroke="{col_l}" stroke-width="1.8"/>'''
    arms = "\n".join([
        g(f'    <path d="M90 76 L112 72 L116 80 L94 86 Z" fill="{ST}"/>', sw=2.5),
        scythe(112, 74, 8, -14),
        g(f'    <path d="M76 84 L100 96 L96 102 L72 92 Z" fill="{ST_D}"/>', sw=2.5),
        scythe(98, 98, 10, -6),
    ])
    marks = grit.scratches(64, 70, 30, 30, n=5, seed=402)
    boss("plasma_reaver", "\n".join([shadow(72, 146, 34, 6), legs, body, marks, arms]),
         "Plasma Reaver: smukły zabójca-owad z dwiema plazmowymi kosami, cyjanowe ostrza i oczy.",
         glow=[(99, 38, 6), (122, 70, 9), (112, 96, 9)])


def hive_colossus():
    """HIVE COLOSSUS (fala 9, czołg): olbrzymi żuk ulowy — kopulasty pancerz z kolcami, pomarańczowe worki jaj."""
    col, col_l = "#ff8c1a", "#ffd08a"
    legs = "\n".join(g(f'    <path d="M{x} 108 L{x + dx} 132 L{x + dx + 4} 146" fill="none" stroke-width="7"/>', sw=0)
                     + f'\n  <path d="M{x} 108 L{x + dx} 132 L{x + dx + 4} 146" fill="none" stroke="{CH_D}" stroke-width="4" stroke-linecap="round"/>'
                     for x, dx in [(40, -12), (62, -6), (98, 6), (120, 12)])
    shell = g(f'''    <path d="M18 100 C14 60 46 30 84 30 C122 30 150 60 144 100 C130 118 32 118 18 100 Z" fill="{CH}"/>''', sw=3.5) + f'''
  <path d="M26 96 C24 64 50 40 84 38" stroke="{CH_L}" stroke-width="4" fill="none"/>
  <path d="M84 32 L84 112" stroke="{CH_D}" stroke-width="3"/>
  <path d="M30 104 C60 116 110 116 138 104 C120 110 50 110 30 104 Z" fill="{CH_D}"/>'''
    spikes = "\n".join(g(f'    <path d="M{x - 6} {y + 6} L{x} {y - 14} L{x + 6} {y + 6} Z" fill="{BONE}"/>', sw=2)
                       for x, y in [(52, 40), (72, 30), (96, 30), (116, 40), (134, 58)])
    sacs = "\n".join(f'  <ellipse cx="{x}" cy="{y}" rx="{r}" ry="{r * 0.8:.1f}" fill="{col}" stroke="{INK}" stroke-width="2"/>\n'
                     f'  <ellipse cx="{x - r * 0.3:.1f}" cy="{y - r * 0.3:.1f}" rx="{r * 0.35:.1f}" ry="{r * 0.25:.1f}" fill="{col_l}"/>'
                     for x, y, r in [(46, 70, 9), (62, 58, 7), (106, 60, 8), (122, 76, 9), (84, 72, 10)])
    head = g(f'''    <path d="M136 84 C148 78 160 84 158 96 C156 106 144 108 136 102 Z" fill="{CH_D}"/>
    <path d="M152 100 L160 110 L150 106 Z" fill="{BONE}"/>''', sw=2.5) + f'''
{eye(150, 90, 2.5, col)}'''
    marks = grit.scratches(30, 50, 100, 40, n=8, seed=403)
    boss("hive_colossus", "\n".join([shadow(84, 146, 60, 7), legs, shell, marks, spikes, sacs, head]),
         "Hive Colossus: olbrzymi żuk ulowy — pancerz z kolcami, pomarańczowe worki jaj.",
         glow=[(84, 72, 10), (46, 70, 8), (122, 76, 8)])


def hive_queen():
    """HIVE QUEEN (finał stacji): królowa — wyprostowany tors z koroną, wielki odwłok z jajami, skrzydła."""
    col, col_l = "#ff3ea5", "#ffc0de"
    wings = f'''  <path d="M70 60 C40 30 20 34 14 50 C30 56 50 64 66 72 Z" fill="#b8c8d8" opacity="0.35" stroke="{INK}" stroke-width="2"/>
  <path d="M74 56 C60 18 40 10 30 20 C44 32 56 46 70 64 Z" fill="#b8c8d8" opacity="0.3" stroke="{INK}" stroke-width="2"/>'''
    abdomen = g(f'''    <path d="M72 96 C44 92 18 104 16 122 C16 140 44 146 70 136 C84 130 88 112 82 100 Z" fill="{FL}"/>''') + f'''
  <path d="M30 104 C28 116 30 128 36 138 M46 98 C44 112 46 126 52 140 M62 96 C60 110 62 124 66 136" stroke="{FL_D}" stroke-width="3" fill="none"/>
  <ellipse cx="38" cy="122" rx="5" ry="4" fill="{col}" stroke="{INK}" stroke-width="1.5"/>
  <ellipse cx="54" cy="118" rx="5" ry="4" fill="{col}" stroke="{INK}" stroke-width="1.5"/>'''
    legs = g(f'''    <path d="M84 116 L78 146 M100 116 L106 146" fill="none" stroke-width="6"/>''', sw=0) + f'''
  <path d="M84 116 L78 146 M100 116 L106 146" stroke="{FL_D}" stroke-width="3.5" stroke-linecap="round"/>'''
    torso = g(f'''    <path d="M76 58 C84 48 104 48 110 60 L112 106 C104 118 82 118 76 106 Z" fill="{FL_L}"/>''') + f'''
  <path d="M80 70 C88 66 100 66 108 70 M80 84 C88 80 100 80 108 84 M80 98 C88 94 100 94 108 98" stroke="{FL}" stroke-width="2.5" fill="none"/>'''
    head = g(f'''    <path d="M80 50 C78 34 86 26 96 26 C106 26 112 34 110 50 C104 56 86 56 80 50 Z" fill="{FL}"/>
    <path d="M82 30 L78 8 L90 24 L96 4 L102 24 L114 8 L110 30 Z" fill="{BONE}"/>''') + f'''
{eye(100, 40, 3, col)}
{eye(91, 40, 2.4, col)}
  <path d="M96 20 L96 12" stroke="{col}" stroke-width="3" stroke-linecap="round"/>'''
    arms = g(f'''    <path d="M110 62 C126 66 132 80 128 92 L122 90 C122 80 118 74 108 72 Z" fill="{FL}"/>
    <path d="M124 90 L140 100 L126 98 Z" fill="{BONE}"/>''', sw=2.5)
    boss("hive_queen", "\n".join([shadow(76, 146, 58, 7), wings, abdomen, legs, torso, arms, head]),
         "Hive Queen: królowa z koroną z kości, wielki odwłok z jajami, półprzezroczyste skrzydła, różowe oczy.",
         glow=[(96, 40, 9), (96, 16, 5), (46, 120, 8)])


def core_tyrant():
    """CORE TYRANT (finał krateru): mech-tyran — blokowy pancerz, złoty reaktor w piersi, korona z kominów."""
    col, col_l = "#ffcf3f", "#fff2b8"
    legs = g(f'''    <path d="M50 110 L44 146 L70 146 L68 112 Z" fill="{ST_D}"/>
    <path d="M92 112 L90 146 L116 146 L110 110 Z" fill="{ST}"/>''')
    frame = g(f'''    <path d="M36 54 C40 40 60 34 80 34 C102 34 120 40 124 54 L126 104 C114 118 46 118 34 104 Z" fill="{ST}"/>''', sw=3.5) + f'''
  <path d="M40 56 C50 44 70 40 84 40" stroke="{ST_L}" stroke-width="3" fill="none"/>
  <path d="M34 100 C50 112 110 112 126 100" stroke="{ST_D}" stroke-width="4" fill="none"/>
''' + rivets([(44, 60), (116, 60), (44, 98), (116, 98), (60, 106), (100, 106)], r=2, col=ST_L)
    core = f'''  <circle cx="80" cy="76" r="18" fill="{INK}"/>
  <circle cx="80" cy="76" r="15" fill="#3a2c08" stroke="{ST_D}" stroke-width="2"/>
  <circle cx="80" cy="76" r="10" fill="{col}"/>
  <circle cx="77" cy="73" r="3.5" fill="{col_l}"/>
  <path d="M62 76 L52 76 M98 76 L108 76 M80 58 L80 50" stroke="{col}" stroke-width="3"/>'''
    crown = g(f'''    <rect x="58" y="16" width="10" height="20" rx="2" fill="{ST_D}"/>
    <rect x="75" y="8" width="10" height="28" rx="2" fill="{ST}"/>
    <rect x="92" y="16" width="10" height="20" rx="2" fill="{ST_D}"/>''', sw=2.5) + f'''
  <path d="M60 16 L66 16 M77 8 L83 8 M94 16 L100 16" stroke="{col}" stroke-width="3"/>
  <path d="M66 42 C72 38 88 38 94 42 L92 50 C86 48 74 48 68 50 Z" fill="{col}" stroke="{INK}" stroke-width="2"/>'''
    fists = g(f'''    <rect x="10" y="66" width="28" height="36" rx="7" fill="{ST_D}"/>
    <rect x="122" y="66" width="28" height="36" rx="7" fill="{ST}"/>''') + f'''
  <path d="M14 78 L34 78 M14 90 L34 90 M126 78 L146 78 M126 90 L146 90" stroke="{ST_L}" stroke-width="2.5"/>'''
    marks = grit.scratches(40, 50, 80, 50, n=10, seed=404)
    boss("core_tyrant", "\n".join([shadow(80, 146, 56, 7), legs, frame, marks, core, crown, fists]),
         "Core Tyrant: mech-tyran z blokowego pancerza, złoty reaktor w piersi, korona z kominów, pięści-tłoki.",
         glow=[(80, 76, 16), (80, 45, 7), (80, 8, 5)], grime=1.0)


def ember_stalker():
    """EMBER STALKER (fala 5 krateru, ruchliwy): lawowy ogar — bazaltowe płyty z żarem, grzywa z kolców."""
    col, col_l = "#ff5a2b", "#ffc07a"
    legs = g(f'''    <path d="M36 108 L28 144 L40 144 L46 112 Z" fill="{ROCK_D}"/>
    <path d="M58 110 L56 144 L68 144 L68 112 Z" fill="{ROCK}"/>
    <path d="M100 110 L98 144 L110 144 L112 110 Z" fill="{ROCK_D}"/>
    <path d="M120 106 L126 144 L138 144 L130 104 Z" fill="{ROCK}"/>''', sw=2.5)
    tail = g(f'    <path d="M28 92 C14 90 6 80 4 66 C12 74 20 80 30 82 Z" fill="{ROCK_D}"/>', sw=2.5)
    body = g(f'''    <path d="M24 96 C22 76 44 64 76 64 C108 64 132 72 136 92 C132 110 110 116 78 116 C48 116 26 112 24 96 Z" fill="{ROCK}"/>''') + f'''
  <path d="M40 76 L56 92 L52 104 M76 70 L80 88 L96 96 M110 74 L104 92" stroke="{col}" stroke-width="2.6" fill="none" stroke-linejoin="round"/>
  <path d="M32 84 C44 72 70 68 96 70" stroke="#5a4a44" stroke-width="3" fill="none"/>'''
    mane = "\n".join(g(f'    <path d="M{x - 6} {y + 4} L{x + 4} {y - h} L{x + 8} {y + 4} Z" fill="{col}"/>', sw=1.8)
                     for x, y, h in [(62, 68, 16), (78, 66, 22), (94, 68, 20), (110, 72, 16), (48, 72, 12)])
    head = g(f'''    <path d="M124 70 C132 58 150 58 156 70 C160 80 154 92 144 94 L126 92 C120 86 120 78 124 70 Z" fill="{ROCK}"/>
    <path d="M140 92 L146 102 L136 96 Z M150 90 L156 98 L148 94 Z" fill="{BONE}"/>''') + f'''
{eye(146, 74, 3, col_l)}
  <path d="M130 84 L152 84" stroke="{col}" stroke-width="2"/>'''
    boss("ember_stalker", "\n".join([shadow(82, 146, 56, 6), tail, legs, body, mane, head]),
         "Ember Stalker: lawowy ogar z bazaltowych płyt, żarzące się pęknięcia i grzywa z płomiennych kolców.",
         glow=[(146, 74, 7), (80, 66, 12), (56, 92, 7)])


def obsidian_colossus():
    """OBSIDIAN COLOSSUS (fala 7 krateru, czołg): golem z obsydianu — tułów z odłamków, ogromne ramiona, fioletowy rdzeń."""
    col, col_l = "#b98aff", "#eadcff"
    # jaśniej niż iglice w podłodze krateru: boss walczy na ciemnym bazalcie i nie może się z nim zlać
    OB, OB_M, OB_L = "#2a2236", "#3e3450", "#8a7aa8"
    legs = g(f'''    <path d="M52 112 L44 146 L72 146 L70 114 Z" fill="{OB_M}"/>
    <path d="M90 114 L88 146 L116 146 L108 112 Z" fill="{OB}"/>''')
    torso = g(f'''    <path d="M44 56 L64 34 L96 30 L118 50 L116 104 L96 118 L64 118 L44 104 Z" fill="{OB}"/>''', sw=3.5) + f'''
  <path d="M44 56 L64 34 L82 60 L60 80 Z" fill="{OB_M}" stroke="{INK}" stroke-width="1.8"/>
  <path d="M82 60 L96 30 L118 50 L104 76 Z" fill="{OB_M}" stroke="{INK}" stroke-width="1.8"/>
  <path d="M60 80 L82 60 L104 76 L96 104 L66 104 Z" fill="{OB}" stroke="{INK}" stroke-width="1.8"/>
  <path d="M50 58 L64 40 M88 34 L100 36" stroke="{OB_L}" stroke-width="2.2"/>'''
    core = f'''  <path d="M80 70 L90 82 L80 94 L70 82 Z" fill="{col}" stroke="{INK}" stroke-width="2"/>
  <path d="M78 76 L82 72" stroke="{col_l}" stroke-width="2"/>'''
    head = g(f'    <path d="M68 34 L74 16 L90 14 L96 30 L82 38 Z" fill="{OB_M}"/>', sw=2.5) + f'''
{eye(86, 26, 2.4, col)}'''
    arms = g(f'''    <path d="M44 60 L20 72 L12 108 L30 116 L40 90 L50 80 Z" fill="{OB_M}"/>
    <path d="M118 54 L142 68 L150 104 L132 114 L122 88 L112 78 Z" fill="{OB}"/>''') + f'''
  <path d="M16 90 L28 96 M146 88 L134 94" stroke="{OB_L}" stroke-width="2"/>'''
    spikes = "\n".join(g(f'    <path d="M{x - 5} {y + 4} L{x + d} {y - h} L{x + 5} {y + 4} Z" fill="{OB_M}"/>', sw=1.8)
                       + f'\n  <path d="M{x - 1} {y} L{x + d} {y - h + 4}" stroke="{OB_L}" stroke-width="1.2"/>'
                       for x, y, h, d in [(56, 44, 18, -4), (108, 42, 20, 5), (30, 72, 14, -6), (140, 70, 14, 6)])
    boss("obsidian_colossus", "\n".join([shadow(80, 146, 58, 7), legs, arms, torso, spikes, core, head]),
         "Obsidian Colossus: golem z odłamków obsydianu, ogromne ramiona, fioletowy rdzeń.",
         glow=[(80, 82, 12), (86, 26, 5)])


if __name__ == "__main__":
    alien(); demon(); mage(); robot(); brute()
    void_warden(); plasma_reaver(); hive_colossus(); hive_queen(); core_tyrant(); ember_stalker(); obsidian_colossus()
    print("ws invaders ok")
