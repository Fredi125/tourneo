#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fabrique une illustration PNG originale par famille de jeu.

Aucun visuel sous licence n'est utilisé : chaque vignette est composée à
partir des tracés déjà présents dans l'application, enrichis d'un fond
dégradé, d'une couche décorative propre à la famille et d'une lueur.
Le rendu suit les mêmes jetons de couleur que l'interface.
"""
import re, io, base64, math, random, pathlib
import cairosvg
from PIL import Image

RACINE = pathlib.Path(__file__).resolve().parent.parent
SRC = RACINE / "src" / "js" / "09-donnees.js"
SORTIE = RACINE / "assets" / "apercus"
COTE = 256

# ── Jetons, alignés sur le bloc :root de l'application ──────────────────
BG      = "#0F0D12"
SURFACE = "#191620"
FG      = "#F3EEE9"

# Famille de chaque pictogramme : teinte + couche décorative
FAMILLES = {
    "kart":("#F0705E","vitesse"), "bolide":("#F0705E","vitesse"),
    "ballon":("#F0705E","vitesse"), "raquette":("#F0705E","vitesse"),
    "impact":("#F5903C","rayons"), "epees":("#F5903C","rayons"), "poing":("#F5903C","rayons"),
    "chateau":("#9E8CE0","etoiles"), "vaisseau":("#9E8CE0","etoiles"),
    "hache":("#9E8CE0","etoiles"), "piece":("#9E8CE0","etoiles"),
    "babyfoot":("#86C39B","anneaux"), "cible":("#86C39B","anneaux"),
    "bille":("#86C39B","anneaux"), "poche":("#86C39B","anneaux"),
    "disque":("#86C39B","anneaux"), "blocs":("#86C39B","anneaux"),
    "hexagone":("#84B4EA","grille"), "jetons":("#84B4EA","grille"),
    "de":("#84B4EA","grille"), "question":("#84B4EA","grille"),
    "note":("#E58BB4","ondes"), "micro":("#E58BB4","ondes"), "danse":("#E58BB4","ondes"),
    "manette":("#F5903C","grille"), "pion":("#84B4EA","grille"), "trophee":("#F5B841","rayons"),
}


def lire_icones():
    """Récupère les tracés depuis l'application, pour qu'ils ne divergent jamais."""
    src = SRC.read_text(encoding="utf-8")
    bloc = re.search(r"var ICONES = \{(.*?)\n\};", src, re.S).group(1)
    return dict(re.findall(r"(\w+):\s*'(.*?)',?\s*\n", bloc + "\n", re.S))


def melange(a, b, t):
    """Interpole deux couleurs hexadécimales."""
    a = [int(a[i:i+2], 16) for i in (1, 3, 5)]
    b = [int(b[i:i+2], 16) for i in (1, 3, 5)]
    return "#%02X%02X%02X" % tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def decor(genre, teinte, graine):
    """Couche décorative : elle raconte la famille, pas le jeu précis."""
    rnd = random.Random(graine)
    p = []
    if genre == "vitesse":
        for i in range(9):
            y = 26 + i * 34 + rnd.randint(-6, 6)
            lg = rnd.randint(46, 132)
            x = rnd.randint(-20, 200)
            p.append(f'<path d="M{x} {y} L{x+lg} {y-lg*0.34:.0f}" stroke="{teinte}" '
                     f'stroke-width="{rnd.choice([2,3,4])}" stroke-linecap="round" opacity="0.20"/>')
    elif genre == "rayons":
        for i in range(16):
            a = i * math.pi / 8 + 0.19
            x1, y1 = 160 + 78 * math.cos(a), 160 + 78 * math.sin(a)
            x2, y2 = 160 + 210 * math.cos(a), 160 + 210 * math.sin(a)
            p.append(f'<path d="M{x1:.0f} {y1:.0f} L{x2:.0f} {y2:.0f}" stroke="{teinte}" '
                     f'stroke-width="{5 if i%2 else 2.5}" stroke-linecap="round" opacity="0.16"/>')
    elif genre == "etoiles":
        for _ in range(58):
            x, y = rnd.randint(6, 314), rnd.randint(6, 314)
            r = rnd.choice([1, 1, 1.5, 2, 2.8])
            p.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{teinte}" '
                     f'opacity="{rnd.choice([0.2,0.3,0.45,0.6])}"/>')
    elif genre == "anneaux":
        for r in range(52, 250, 38):
            p.append(f'<circle cx="160" cy="160" r="{r}" fill="none" stroke="{teinte}" '
                     f'stroke-width="2" opacity="0.15"/>')
    elif genre == "grille":
        for gx in range(0, 340, 30):
            for gy in range(0, 340, 30):
                d = math.hypot(gx - 160, gy - 160) / 230
                p.append(f'<circle cx="{gx}" cy="{gy}" r="1.9" fill="{teinte}" '
                         f'opacity="{max(0.07, 0.4 - d*0.32):.2f}"/>')
    elif genre == "ondes":
        for i in range(17):
            x = 12 + i * 18.4
            h = 26 + abs(math.sin(i * 0.86)) * 96
            p.append(f'<rect x="{x:.0f}" y="{320-h:.0f}" width="9" height="{h:.0f}" rx="4.5" '
                     f'fill="{teinte}" opacity="0.18"/>')
    return "".join(p)


def svg_apercu(cle, tracé):
    teinte, genre = FAMILLES.get(cle, ("#F5903C", "grille"))
    haut = melange(BG, teinte, 0.17)
    motif = melange(FG, teinte, 0.30)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{COTE}" height="{COTE}" viewBox="0 0 320 320">
<defs>
  <linearGradient id="fond" x1="0" y1="0" x2="0.32" y2="1">
    <stop offset="0.00" stop-color="{haut}"/>
    <stop offset="0.34" stop-color="{haut}"/>
    <stop offset="0.35" stop-color="{SURFACE}"/>
    <stop offset="0.72" stop-color="{SURFACE}"/>
    <stop offset="0.73" stop-color="{BG}"/>
    <stop offset="1.00" stop-color="{BG}"/>
  </linearGradient>
  <radialGradient id="lueur" cx="0.5" cy="0.44" r="0.64">
    <stop offset="0.00" stop-color="{teinte}" stop-opacity="0.30"/>
    <stop offset="0.22" stop-color="{teinte}" stop-opacity="0.30"/>
    <stop offset="0.23" stop-color="{teinte}" stop-opacity="0.21"/>
    <stop offset="0.44" stop-color="{teinte}" stop-opacity="0.21"/>
    <stop offset="0.45" stop-color="{teinte}" stop-opacity="0.20"/>
    <stop offset="0.68" stop-color="{teinte}" stop-opacity="0.20"/>
    <stop offset="0.69" stop-color="{teinte}" stop-opacity="0.06"/>
    <stop offset="1.00" stop-color="{teinte}" stop-opacity="0.06"/>
  </radialGradient>
  <radialGradient id="vignette" cx="0.5" cy="0.46" r="0.80">
    <stop offset="0.52" stop-color="{BG}" stop-opacity="0"/>
    <stop offset="0.53" stop-color="{BG}" stop-opacity="0.24"/>
    <stop offset="0.74" stop-color="{BG}" stop-opacity="0.24"/>
    <stop offset="0.75" stop-color="{BG}" stop-opacity="0.52"/>
    <stop offset="1.00" stop-color="{BG}" stop-opacity="0.74"/>
  </radialGradient>
  <filter id="halo" x="-45%" y="-45%" width="190%" height="190%">
    <feGaussianBlur stdDeviation="11"/>
  </filter>
</defs>

<rect width="320" height="320" fill="url(#fond)"/>
<rect width="320" height="320" fill="url(#lueur)"/>
{decor(genre, teinte, sum(map(ord, cle)))}
<rect width="320" height="320" fill="url(#vignette)"/>

<g transform="translate(78,78) scale(7)" fill="none" stroke="{teinte}" stroke-width="1.5"
   stroke-linecap="round" stroke-linejoin="round" color="{teinte}"
   filter="url(#halo)" opacity="0.85">{tracé}</g>

<g transform="translate(78,78) scale(7)" fill="none" stroke="{motif}" stroke-width="1.35"
   stroke-linecap="round" stroke-linejoin="round" color="{motif}">{tracé}</g>

<rect x="0" y="316" width="320" height="4" fill="{teinte}" opacity="0.5"/>
</svg>'''


def png_optimise(svg):
    brut = cairosvg.svg2png(bytestring=svg.encode(), output_width=COTE, output_height=COTE)
    im = Image.open(io.BytesIO(brut)).convert("RGB")
    # Octree sans tramage : le bruit de tramage triple le poids d'un PNG
    # pour un gain invisible dans une vignette de 54 px.
    im = im.quantize(colors=64, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    out = io.BytesIO()
    im.save(out, "PNG", optimize=True)
    return out.getvalue()


if __name__ == "__main__":
    icones = lire_icones()
    manquants = [k for k in FAMILLES if k not in icones]
    if manquants:
        raise SystemExit("Tracés introuvables : " + ", ".join(manquants))

    SORTIE.mkdir(parents=True, exist_ok=True)
    total = 0
    for cle in sorted(FAMILLES):
        data = png_optimise(svg_apercu(cle, icones[cle]))
        (SORTIE / f"{cle}.png").write_bytes(data)
        total += len(data)
        print(f"  {cle:<10} {len(data)/1024:6.1f} ko")
    print(f"\n{len(FAMILLES)} illustrations dans assets/apercus/ · {total/1024:.0f} ko")
    print("Lancez outils/build.py pour les embarquer dans dist/tourneo.html")
