# Dekoracje terenu i złoże: pole bitwy w lesie — osmalone drzewa, wraki, kości bestii, kryształy.
from common import *

LEAF = "#2f4a26"
LEAF_D = "#1f331a"
LEAF_L = "#4a6a34"
BARK = "#4a3526"
BARK_D = "#2e2018"
BURNT = "#3a2e22"
ROCK = "#6a665c"
ROCK_D = "#46423a"
ROCK_L = "#8a867a"
MOSS = "#4a5a2a"
GOLD = "#ffd24a"
GOLD_L = "#fff4b8"
GOLD_D = "#b8871a"


def tree():
    s = g(f'''    <path d="M42 106 L44 70 L38 58 L46 62 L48 50 L52 62 L58 56 L54 70 L56 106 Z" fill="{BARK}"/>
    <path d="M18 56 C8 50 10 34 22 30 C22 16 38 8 50 14 C60 4 80 10 80 24 C92 26 94 44 84 52 C88 64 72 72 62 66 C54 74 36 72 34 64 C24 68 14 64 18 56 Z" fill="{LEAF}"/>''')
    s += f'''
  <path d="M22 36 C30 26 42 20 52 20 C60 14 70 14 76 22" stroke="{LEAF_L}" stroke-width="3" fill="none"/>
  <path d="M26 58 C34 62 44 62 50 58 M60 60 C68 62 76 58 80 50" stroke="{LEAF_D}" stroke-width="3" fill="none"/>
  <path d="M60 28 C66 26 72 30 70 36 C64 38 58 34 60 28 Z" fill="{BURNT}"/>
  <path d="M28 44 C32 42 36 46 34 50 C30 50 26 48 28 44 Z" fill="{BURNT}"/>
  <path d="M46 78 L50 96" stroke="{BARK_D}" stroke-width="1.5"/>
  <path d="M40 104 C44 100 54 100 58 104" stroke="{BARK_D}" stroke-width="2" fill="none"/>'''
    svg("deco_tree", s, w=96, h=112, anchor=(49, 104), world=0.4, scale=0.8, grime=0.6, note="Drzewo z osmalonymi plamami.")


def tree_dead():
    s = g(f'''    <path d="M42 106 L44 64 L28 40 L20 42 L26 34 L36 44 L44 30 L40 14 L48 26 L50 44 L60 28 L68 30 L60 36 L54 56 L66 48 L78 50 L68 54 L56 66 L56 106 Z" fill="{BURNT}"/>''')
    s += f'''
  <path d="M46 70 L48 100 M52 60 L52 80" stroke="#1c1612" stroke-width="1.5"/>
  <path d="M44 44 L42 30" stroke="#5a4838" stroke-width="1.5"/>
  <path d="M36 104 C44 98 54 98 62 104" stroke="#1c1612" stroke-width="2" fill="none"/>'''
    svg("deco_tree_dead", s, w=96, h=112, anchor=(49, 104), world=0.4, scale=0.8, grime=0.6, note="Martwe, spalone drzewo.")


def stump():
    s = g(f'''    <path d="M26 70 L28 44 C34 38 58 38 64 44 L68 70 C58 78 34 78 26 70 Z" fill="{BARK}"/>
    <ellipse cx="46" cy="44" rx="18" ry="6" fill="#9a7a58"/>''') + f'''
  <ellipse cx="46" cy="44" rx="10" ry="3" fill="none" stroke="#6a5038" stroke-width="1.2"/>
  <path d="M52 40 L64 20" stroke="{INK}" stroke-width="4"/><path d="M52 40 L64 20" stroke="#8a6a44" stroke-width="2"/>
  <path d="M58 26 L70 20 L68 30 Z" fill="{METAL_L}" stroke="{INK}" stroke-width="1.5"/>
  <path d="M30 70 L22 76 M62 70 L72 76" stroke="{BARK_D}" stroke-width="3"/>'''
    svg("deco_stump", s, w=96, h=84, anchor=(46, 74), world=0.4, scale=0.8, grime=0.7, note="Pień z wbitym toporem.")


def wreck():
    s = g(f'''    <path d="M8 74 C8 50 26 34 48 34 C70 34 88 48 90 70 L84 78 L14 80 Z" fill="#4b5058"/>
    <path d="M40 40 L50 40 L56 60 L36 62 Z" fill="#2b2e33"/>
    <path d="M60 18 L66 16 L74 44 L68 46 Z" fill="{METAL}"/>''') + f'''
  <path d="M14 58 C22 44 36 38 50 38" stroke="{METAL_HI}" stroke-width="2" fill="none"/>
  <circle cx="46" cy="50" r="5" fill="#1c1e22" stroke="{INK}" stroke-width="1.5"/><circle cx="46" cy="50" r="2.2" fill="#ff5a36" opacity="0.8"/>
  <path d="M20 66 L30 60 L28 70 Z M70 60 L80 64 L74 70 Z" fill="#6a3a22" opacity="0.8"/>
  <path d="M58 58 L66 62 L62 70" stroke="{INK}" stroke-width="1.5" fill="none"/>
  <path d="M4 80 C20 74 76 74 94 80 C80 86 20 86 4 80 Z" fill="#4a3d2c"/>
  <path d="M64 16 L70 12 M60 18 L58 12" stroke="{INK}" stroke-width="1.5"/>'''
    svg("deco_wreck", s, w=100, h=90, anchor=(50, 80), world=0.42, scale=0.8, grime=1, note="Wrak mecha/kapsuły w ziemi — ślad dawnych bitew.")


def crystal():
    s = g(f'''    <path d="M40 72 L36 30 L46 14 L54 34 L52 72 Z" fill="#9a6ae0"/>
    <path d="M52 72 L58 40 L68 30 L72 48 L64 72 Z" fill="#7a4ac0"/>
    <path d="M28 74 L22 50 L30 44 L38 58 L38 74 Z" fill="#8a5ad0"/>''', sw=2.5) + f'''
  <path d="M46 14 L40 72 L36 30 Z" fill="#d8c0ff" opacity="0.7"/>
  <path d="M68 30 L64 72 L58 40 Z" fill="#b89aff" opacity="0.6"/>
  <path d="M44 24 L42 50" stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>
  <path d="M16 76 C28 70 64 70 80 76 C64 82 28 82 16 76 Z" fill="{ROCK_D}"/>'''
    svg("deco_crystal", s, w=96, h=86, anchor=(48, 76), world=0.4, scale=0.8, grime=0.4, note="Kryształ many (magia) wyrastający z ziemi.")


def bones():
    s = g(f'''    <path d="M24 66 C20 50 26 36 36 30" fill="none" stroke-width="8"/>
    <path d="M38 68 C34 48 42 30 54 26" fill="none" stroke-width="8"/>
    <path d="M52 70 C50 50 58 34 70 30" fill="none" stroke-width="8"/>
    <path d="M14 70 L80 58" stroke-width="7"/>''') + f'''
  <path d="M24 66 C20 50 26 36 36 30 M38 68 C34 48 42 30 54 26 M52 70 C50 50 58 34 70 30 M14 70 L80 58" stroke="{BONE}" stroke-width="4" fill="none" stroke-linecap="round"/>''' + g(f'''
    <path d="M72 70 C70 58 82 50 94 56 L100 62 L96 72 C90 78 76 78 72 70 Z" fill="{BONE}"/>
    <path d="M94 60 C100 56 104 48 102 40 C108 50 106 60 100 66 Z" fill="{BONE}"/>''', sw=2.5) + f'''
  <circle cx="82" cy="64" r="3" fill="{INK}"/>
  <path d="M4 74 C24 68 84 68 104 74 C84 80 24 80 4 74 Z" fill="#4a3d2c" opacity="0.8"/>'''
    svg("deco_bones", s, w=110, h=84, anchor=(54, 74), world=0.4, scale=0.8, grime=0.8, note="Szkielet wielkiej bestii.")


def rock():
    s = g(f'''    <path d="M4 26 C2 14 12 6 22 8 C30 2 42 8 42 18 C44 28 36 32 22 32 C12 32 4 32 4 26 Z" fill="{ROCK}"/>''', sw=2) + f'''
  <path d="M10 14 C16 10 24 10 30 12" stroke="{ROCK_L}" stroke-width="2" fill="none"/>
  <path d="M26 30 C34 28 40 24 42 18 C40 26 34 32 24 32 Z" fill="{ROCK_D}"/>
  <path d="M8 22 C14 18 20 20 22 24" stroke="{MOSS}" stroke-width="3" fill="none"/>'''
    svg("deco_rock", s, w=46, h=36, anchor=(23, 32), world=0.35, scale=1, grime=0.5, note="Głaz z mchem.")


def rock_big():
    s = g(f'''    <path d="M30 70 C22 60 26 40 40 34 C44 20 62 16 70 26 C84 24 94 36 90 50 C96 60 90 72 78 72 L36 74 C32 74 30 72 30 70 Z" fill="{ROCK}"/>
    <path d="M8 76 C4 68 10 58 20 60 C26 54 38 58 38 66 C40 74 32 78 22 78 C14 78 8 80 8 76 Z" fill="{ROCK_D}"/>''') + f'''
  <path d="M40 40 C48 32 60 28 70 30" stroke="{ROCK_L}" stroke-width="2.5" fill="none"/>
  <path d="M64 56 L70 48 L78 52" stroke="{INK}" stroke-width="1.5" fill="none"/>
  <path d="M34 52 C42 46 52 48 56 54" stroke="{MOSS}" stroke-width="4" fill="none"/>
  <path d="M60 72 C72 70 84 66 90 56 C92 66 86 74 76 74 Z" fill="{ROCK_D}"/>
  <path d="M2 80 C24 74 80 74 98 80 C80 86 24 86 2 80 Z" fill="#4a3d2c" opacity="0.7"/>'''
    svg("deco_rock_big", s, w=100, h=88, anchor=(50, 78), world=0.4, scale=0.8, grime=0.6, note="Skały z mchem.")


def tufts():
    t1 = f'''  <path d="M6 22 C6 14 4 8 2 4 C8 8 10 14 11 20 M12 22 C12 12 14 6 18 2 C18 10 16 16 16 22 M18 22 C20 16 24 12 28 10 C26 16 24 20 22 23" stroke="{INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M6 22 C6 14 4 8 2 4 C8 8 10 14 11 20 M12 22 C12 12 14 6 18 2 C18 10 16 16 16 22 M18 22 C20 16 24 12 28 10 C26 16 24 20 22 23" stroke="#5a6a34" stroke-width="1.8" fill="none" stroke-linecap="round"/>'''
    svg("deco_tuft", t1, w=30, h=26, anchor=(14, 23), world=0.35, scale=1.2, grime=0.2, note="Kępka trawy.")
    t2 = t1.replace("#5a6a34", "#7a7a3a")
    svg("deco_tuft2", t2, w=30, h=26, anchor=(14, 23), world=0.35, scale=1.2, grime=0.2, note="Kępka suchej trawy.")
    fl = t1.replace("#5a6a34", "#4a5a2a") + f'''
  <circle cx="4" cy="6" r="2.4" fill="#e8c860" stroke="{INK}" stroke-width="1"/><circle cx="18" cy="4" r="2.4" fill="#d890c0" stroke="{INK}" stroke-width="1"/>
  <circle cx="27" cy="11" r="2.2" fill="#e8e0c8" stroke="{INK}" stroke-width="1"/>'''
    svg("deco_flowers", fl, w=30, h=26, anchor=(14, 23), world=0.35, scale=1.2, grime=0.2, note="Polne kwiaty.")
    pb = f'''  <ellipse cx="8" cy="12" rx="5" ry="3.5" fill="{ROCK}" stroke="{INK}" stroke-width="1.5"/>
  <ellipse cx="18" cy="15" rx="4" ry="2.8" fill="{ROCK_L}" stroke="{INK}" stroke-width="1.5"/>
  <ellipse cx="24" cy="10" rx="3" ry="2.2" fill="{ROCK_D}" stroke="{INK}" stroke-width="1.5"/>'''
    svg("deco_pebbles", pb, w=30, h=20, anchor=(15, 16), world=0.35, scale=1.2, grime=0.3, note="Kamyki.")


def deposit():
    s = g(f'''    <path d="M6 60 C4 46 16 38 26 40 C30 30 46 28 54 36 C66 30 84 36 86 48 C94 54 90 66 80 68 L14 68 C8 68 6 64 6 60 Z" fill="{ROCK}"/>''') + f'''
  <path d="M12 50 C18 44 26 42 32 44 M56 38 C64 36 74 38 80 44" stroke="{ROCK_L}" stroke-width="2" fill="none"/>
  <path d="M60 66 C72 64 82 60 86 50 C90 60 86 68 78 70 Z" fill="{ROCK_D}"/>''' + g(f'''
    <path d="M30 56 L26 26 L36 12 L44 30 L42 56 Z" fill="{GOLD}"/>
    <path d="M42 56 L48 24 L58 18 L60 38 L54 58 Z" fill="#f0b830"/>
    <path d="M56 58 L62 38 L70 34 L72 48 L66 60 Z" fill="{GOLD}"/>
    <path d="M18 60 L16 44 L22 40 L28 50 L26 60 Z" fill="#f0b830"/>''', sw=2.5) + f'''
  <path d="M36 12 L30 56 L26 26 Z" fill="{GOLD_L}" opacity="0.8"/>
  <path d="M58 18 L54 58 L48 24 Z" fill="{GOLD_D}" opacity="0.6"/>
  <path d="M34 22 L32 46 M60 40 L64 52" stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>'''
    svg("deposit", s, w=92, h=74, anchor=(46, 62), world=0.5, scale=1, grime=0.6, note="Złoże: złote kryształy energii w skale.")


if __name__ == "__main__":
    tree(); tree_dead(); stump(); wreck(); crystal(); bones(); rock(); rock_big(); tufts(); deposit()
    print("decor ok")
