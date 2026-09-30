# Ikona aplikacji: kret w żółtym kasku górniczym z zapaloną lampą (rasa domyślna, D30) na ciemnym tle.
# Prosty, duży kształt — czytelny w 48 px na ekranie telefonu.
#
#   python tools/svg_gen/icon.py   → art/icon/*.svg, potem tools/make_icon.gd → art/icon/*.png
#
#   icon.svg     — ikona klasyczna (tło + postać), 512×512: projekt i starsze Androidy
#   icon_bg.svg  — tło ikony adaptacyjnej 432×432
#   icon_fg.svg  — pierwszy plan ikony adaptacyjnej 432×432 (postać w bezpiecznym kole 66%)
from common import *
import os
import mole as M

OUT_I = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "art", "icon")


def write(name, size, body):
    os.makedirs(OUT_I, exist_ok=True)
    text = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">\n'
            f'{body}\n</svg>\n')
    with open(os.path.join(OUT_I, name + ".svg"), "w", encoding="utf-8") as f:
        f.write(text)


def background(size):
    c = size / 2
    return f'''  <defs>
    <radialGradient id="bg" cx="0.62" cy="0.3" r="0.85">
      <stop offset="0" stop-color="#3e5a3a"/><stop offset="0.55" stop-color="#1f2e22"/><stop offset="1" stop-color="#0e1510"/>
    </radialGradient>
    <radialGradient id="beam" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffe89a" stop-opacity="0.55"/><stop offset="1" stop-color="#ffc233" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="{size}" height="{size}" fill="url(#bg)"/>
  <circle cx="{c * 1.45}" cy="{c * 0.55}" r="{c * 0.7}" fill="url(#beam)"/>
  <path d="M0 {size * 0.82} C{size * 0.3} {size * 0.74} {size * 0.7} {size * 0.9} {size} {size * 0.8} L{size} {size} L0 {size} Z" fill="#141c14"/>'''


def mole(size):
    """Głowa kreta w kasku, wyśrodkowana; mieści się w kole 66% rozmiaru (strefa bezpieczna)."""
    s = size / 112.0
    # głowa z kaskiem zajmuje w przestrzeni sprite'a x 42–125, y 14–69 (środek ~ 86, 42)
    head = M.head()
    for k, v in {TEAM: "#6aa8ff", TEAM_M: "#4a84e0", TEAM_D: "#2e5aa8"}.items():
        head = head.replace(k, v)  # magenta drużyny → niebieski gracza
    head = tr(head, dx=size / 2 - 86 * s, dy=size / 2 - 42 * s, s=s)
    lamp_x = size / 2 + (96 - 86) * s
    lamp_y = size / 2 + (28 - 42) * s
    glow = f'''  <circle cx="{lamp_x}" cy="{lamp_y}" r="{9 * s}" fill="#fff2c0" opacity="0.5"/>'''
    return head + "\n" + glow


def main():
    write("icon", 512, background(512) + "\n" + mole(512))
    write("icon_bg", 432, background(432))
    # pierwszy plan: postać w 66% (Android przycina do koła/zaokrąglonego kwadratu)
    write("icon_fg", 432, tr(mole(432), dx=432 * 0.17, dy=432 * 0.17, s=0.66))


if __name__ == "__main__":
    main()
    print("icon ok")
