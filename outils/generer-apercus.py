#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fabrique un aperçu carré par famille de jeu.

Deux fonds possibles, une seule mise en page :

  · une photo libre de droit (CC0 ou domaine public) quand
    assets/photos/<clé>.jpg existe — voir SOURCES.md pour la provenance ;
  · une couche décorative dessinée, sinon.

Dans les deux cas le tracé du pictogramme est posé par-dessus et le rendu
suit les jetons de couleur de l'interface. Aucun visuel de jeu sous licence
n'est utilisé : ni jaquette, ni logo, ni personnage. Les photos montrent la
famille de jeu — un kart, une cible, un échiquier — jamais une marque.
"""
import re, io, base64, math, random, pathlib
from PIL import Image, ImageFilter, ImageOps, ImageStat

# cairosvg réclame la bibliothèque native Cairo, absente d'une installation
# Python nue sous Windows. Elle ne sert qu'aux aperçus dessinés ; les visuels
# personnels se composent avec Pillow seul. Sans elle, on ne refabrique donc
# pas les 29 aperçus versionnés — ils sont déjà là, et ils sont justes.
try:
    import cairosvg
except Exception:
    cairosvg = None

RACINE = pathlib.Path(__file__).resolve().parent.parent
SRC = RACINE / "src" / "js" / "09-donnees.js"
SORTIE = RACINE / "assets" / "apercus"
SORTIE_PERSO = SORTIE / "perso"
PHOTOS = RACINE / "assets" / "photos"
PERSO = PHOTOS / "perso"
COTE = 256

# Les visuels personnels sont posés tels quels : c'est déjà l'image que Fred
# a choisie, la retravailler n'aurait pas de sens. Ils passent avant tout le
# reste et ne sont jamais versionnés — voir assets/photos/perso/LISEZMOI.md.
FORMATS_PERSO = (".jpg", ".jpeg", ".png", ".webp")

# La charte est sombre : toute photo est ramenée à cette luminance moyenne
# avant d'être teintée, sinon une vignette claire crève l'écran à côté des
# autres.
LUMIERE_CIBLE = 100

# Le grain d'une photo double le poids du fichier pour un détail que personne
# ne verra dans une pastille de 54 px. On le lisse juste avant l'encodage.
ADOUCI = 0.6

# Les dessins restent en PNG : à plat, une palette de 64 teintes les rend au
# bit près pour 4 ko. Les photos partent en JPEG, deux fois plus léger qu'un
# PNG à qualité égale — et tout est embarqué dans le fichier unique.
QUALITE_JPEG = 76

# ── Jetons, alignés sur le bloc :root de l'application ──────────────────
BG      = "#0F0D12"
SURFACE = "#191620"
FG      = "#F3EEE9"

# Famille de chaque pictogramme : teinte + couche décorative
FAMILLES = {
    "kart":("#F0705E","vitesse"), "bolide":("#F0705E","vitesse"),
    "ballon":("#F0705E","vitesse"), "raquette":("#F0705E","vitesse"),
    "tennis":("#F0705E","vitesse"), "golf":("#F0705E","vitesse"),
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


def carre(im):
    """Recadre au centre, en carré, à la taille de travail."""
    c = min(im.width, im.height)
    return im.crop(((im.width - c) // 2, (im.height - c) // 2,
                    (im.width - c) // 2 + c, (im.height - c) // 2 + c)).resize((320, 320), Image.LANCZOS)


def photo_perso(cle):
    """Visuel personnel, s'il y en a un. Local à la machine de Fred.

    L'image est montrée en entier : une jaquette est plus haute que large,
    la recadrer en carré lui couperait le titre. Le vide est comblé par une
    copie floue et assombrie de l'image elle-même.
    """
    for ext in FORMATS_PERSO:
        f = PERSO / (cle + ext)
        if not f.exists():
            continue
        im = Image.open(f).convert("RGB")
        fond = Image.blend(carre(im).filter(ImageFilter.GaussianBlur(14)),
                           Image.new("RGB", (320, 320), BG), 0.45)
        r = min(320 / im.width, 320 / im.height)
        avant = im.resize((max(1, round(im.width * r)), max(1, round(im.height * r))), Image.LANCZOS)
        fond.paste(avant, ((320 - avant.width) // 2, (320 - avant.height) // 2))
        return fond
    return None


def photo_teintee(cle, teinte):
    """Photo libre de droit → bichromie sombre aux couleurs de la famille.

    On passe par le gris avant de reteinter : deux photos venues de deux
    ateliers différents ressortent alors avec la même température, et la
    grille de tuiles reste une seule image plutôt qu'un album de vacances.
    """
    f = PHOTOS / (cle + ".jpg")
    if not f.exists():
        return None
    gris = ImageOps.autocontrast(ImageOps.grayscale(carre(Image.open(f).convert("RGB"))), cutoff=1)

    # Même luminance moyenne pour toutes : une photo de neige et une photo
    # de nuit doivent peser pareil dans la grille. La courbe en S recreuse
    # ensuite les noirs, que le nivellement avait remontés en gris de brume.
    moyenne = max(6.0, min(249.0, ImageStat.Stat(gris).mean[0]))
    gamma = math.log(LUMIERE_CIBLE / 255.0) / math.log(moyenne / 255.0)
    table = []
    for v in range(256):
        x = (v / 255.0) ** gamma
        x = 0.35 * x + 0.65 * (x * x * (3 - 2 * x))
        table.append(round(3 + 219 * x))
    gris = gris.point(table).filter(ImageFilter.GaussianBlur(ADOUCI))

    return ImageOps.colorize(gris,
                             black=melange(BG, teinte, 0.08),
                             mid=melange(SURFACE, teinte, 0.30),
                             white=melange(FG, teinte, 0.62))


def composer_perso(im, teinte):
    """Aperçu d'un visuel personnel, sans SVG : Pillow suffit.

    Pas de bichromie, pas de pictogramme — juste de quoi garder le nom du
    jeu lisible dans la tuile, et le liseré de la famille en bas.
    """
    bande = Image.new("L", (1, 320))
    bande.putdata([round(255 * 0.55 * max(0.0, (y / 319 - 0.55) / 0.45)) for y in range(320)])
    im = Image.composite(Image.new("RGB", (320, 320), BG), im, bande.resize((320, 320)))
    im.paste(Image.blend(im.crop((0, 316, 320, 320)), Image.new("RGB", (320, 4), teinte), 0.5), (0, 316))
    return im


def en_donnees(im):
    """PNG encodé pour être posé tel quel dans le SVG."""
    tampon = io.BytesIO()
    im.save(tampon, "PNG")
    return "data:image/png;base64," + base64.b64encode(tampon.getvalue()).decode()


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
    photo = photo_teintee(cle, teinte)

    if photo is None:
        fond = (f'<rect width="320" height="320" fill="url(#fond)"/>\n'
                f'<rect width="320" height="320" fill="url(#lueur)"/>\n'
                f'{decor(genre, teinte, sum(map(ord, cle)))}')
        couronne = '<rect width="320" height="320" fill="url(#vignette)"/>'
        pose, ampleur, ombre = 78, 7, ""
    else:
        # Le voile reprend les trois paliers du dégradé dessiné : la photo
        # s'assombrit vers le bas pour que le nom du jeu reste lisible
        # par-dessus dans la tuile. La lueur et la vignette, elles, sont
        # bien plus discrètes qu'en dessin : sinon elles noient la photo.
        fond = (f'<image x="0" y="0" width="320" height="320" xlink:href="{en_donnees(photo)}"/>\n'
                f'<rect width="320" height="320" fill="url(#voile)"/>\n'
                f'<rect width="320" height="320" fill="url(#braise)"/>')
        couronne = '<rect width="320" height="320" fill="url(#bordure)"/>'
        pose, ampleur = 95, 5.4
        ombre = (f'<g transform="translate({pose},{pose}) scale({ampleur})" fill="none" stroke="{BG}" '
                 f'stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" color="{BG}" '
                 f'filter="url(#halo)" opacity="0.85">{tracé}</g>\n')

    return f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{COTE}" height="{COTE}" viewBox="0 0 320 320">
<defs>
  <linearGradient id="fond" x1="0" y1="0" x2="0.32" y2="1">
    <stop offset="0.00" stop-color="{haut}"/>
    <stop offset="0.34" stop-color="{haut}"/>
    <stop offset="0.35" stop-color="{SURFACE}"/>
    <stop offset="0.72" stop-color="{SURFACE}"/>
    <stop offset="0.73" stop-color="{BG}"/>
    <stop offset="1.00" stop-color="{BG}"/>
  </linearGradient>
  <linearGradient id="voile" x1="0" y1="0" x2="0.32" y2="1">
    <stop offset="0.00" stop-color="{BG}" stop-opacity="0.06"/>
    <stop offset="0.34" stop-color="{BG}" stop-opacity="0.06"/>
    <stop offset="0.35" stop-color="{BG}" stop-opacity="0.26"/>
    <stop offset="0.72" stop-color="{BG}" stop-opacity="0.26"/>
    <stop offset="0.73" stop-color="{BG}" stop-opacity="0.52"/>
    <stop offset="1.00" stop-color="{BG}" stop-opacity="0.72"/>
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
  <radialGradient id="braise" cx="0.5" cy="0.42" r="0.72">
    <stop offset="0.00" stop-color="{teinte}" stop-opacity="0.16"/>
    <stop offset="0.55" stop-color="{teinte}" stop-opacity="0.09"/>
    <stop offset="1.00" stop-color="{teinte}" stop-opacity="0.02"/>
  </radialGradient>
  <radialGradient id="bordure" cx="0.5" cy="0.46" r="0.82">
    <stop offset="0.55" stop-color="{BG}" stop-opacity="0"/>
    <stop offset="0.80" stop-color="{BG}" stop-opacity="0.16"/>
    <stop offset="1.00" stop-color="{BG}" stop-opacity="0.46"/>
  </radialGradient>
  <filter id="halo" x="-45%" y="-45%" width="190%" height="190%">
    <feGaussianBlur stdDeviation="11"/>
  </filter>
</defs>

{fond}
{couronne}

{ombre}<g transform="translate({pose},{pose}) scale({ampleur})" fill="none" stroke="{teinte}" stroke-width="1.5"
   stroke-linecap="round" stroke-linejoin="round" color="{teinte}"
   filter="url(#halo)" opacity="0.85">{tracé}</g>

<g transform="translate({pose},{pose}) scale({ampleur})" fill="none" stroke="{motif}" stroke-width="1.35"
   stroke-linecap="round" stroke-linejoin="round" color="{motif}">{tracé}</g>

<rect x="0" y="316" width="320" height="4" fill="{teinte}" opacity="0.5"/>
</svg>'''


def en_jpeg(im):
    out = io.BytesIO()
    im.resize((COTE, COTE), Image.LANCZOS).save(
        out, "JPEG", quality=QUALITE_JPEG, optimize=True, progressive=True, subsampling=2)
    return out.getvalue()


def encoder(svg, photo):
    """Rend le SVG puis l'encode au format le plus léger pour son contenu."""
    brut = cairosvg.svg2png(bytestring=svg.encode(), output_width=COTE, output_height=COTE)
    im = Image.open(io.BytesIO(brut)).convert("RGB")
    out = io.BytesIO()
    if photo:
        im.save(out, "JPEG", quality=QUALITE_JPEG, optimize=True, progressive=True, subsampling=2)
        return ".jpg", out.getvalue()
    # Octree sans tramage : le bruit de tramage triple le poids d'un PNG
    # pour un gain invisible dans une vignette de 54 px.
    im = im.quantize(colors=64, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    im.save(out, "PNG", optimize=True)
    return ".png", out.getvalue()


if __name__ == "__main__":
    icones = lire_icones()
    manquants = [k for k in FAMILLES if k not in icones]
    if manquants:
        raise SystemExit("Tracés introuvables : " + ", ".join(manquants))

    SORTIE.mkdir(parents=True, exist_ok=True)
    total, avec_photo, perso, conserves = 0, 0, 0, 0
    for cle in sorted(FAMILLES):
        maison = photo_perso(cle)
        if maison is not None:
            # Sortie séparée et ignorée par git : un visuel personnel ne doit
            # jamais écraser l'aperçu libre de droit que le dépôt distribue.
            SORTIE_PERSO.mkdir(parents=True, exist_ok=True)
            data = en_jpeg(composer_perso(maison, FAMILLES.get(cle, ("#F5903C", ""))[0]))
            (SORTIE_PERSO / (cle + ".jpg")).write_bytes(data)
            perso += 1
            print(f"  {cle:<10} {len(data)/1024:6.1f} ko  perso")
            continue

        # Le visuel personnel a été retiré : son aperçu ne doit pas survivre.
        ancien = SORTIE_PERSO / (cle + ".jpg")
        if ancien.exists():
            ancien.unlink()
            print(f"  {cle:<10} visuel personnel retiré, retour à la photo libre")

        photo = (PHOTOS / (cle + ".jpg")).exists()
        if cairosvg is None:
            conserves += 1
            continue
        avec_photo += photo
        ext, data = encoder(svg_apercu(cle, icones[cle]), photo)
        (SORTIE / (cle + ext)).write_bytes(data)
        # Une clé n'a qu'un aperçu : si elle passe du dessin à la photo, la
        # version précédente doit disparaître, sinon le build en voit deux.
        autre = SORTIE / (cle + (".png" if ext == ".jpg" else ".jpg"))
        if autre.exists():
            autre.unlink()
        total += len(data)
        print(f"  {cle:<10} {len(data)/1024:6.1f} ko  {'photo' if photo else 'dessin'}")

    if conserves:
        print(f"\ncairosvg indisponible : les {conserves} aperçus versionnés sont laissés "
              "tels quels.\nIls sont déjà justes — rien à refaire tant que photos et "
              "pictogrammes ne bougent pas.")
    else:
        print(f"\n{len(FAMILLES) - perso} aperçus dans assets/apercus/ · {total/1024:.0f} ko "
              f"· {avec_photo} sur photo libre de droit")
    if perso:
        print(f"{perso} visuel(s) personnel(s) dans assets/apercus/perso/ — ignorés par git.")
    print("Lancez outils/build.py pour les embarquer dans dist/tourneo.html")
