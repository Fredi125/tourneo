#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Assemble les sources en un fichier unique et autonome.

    python3 outils/build.py

Produit dist/tourneo.html, dist/manifest.webmanifest et dist/sw.js.
Le HTML n'a aucune dépendance externe : pas de CDN, pas de police
distante, pas de requête réseau. C'est ce qui permet de l'ouvrir en
double-cliquant dessus, hors ligne, chez n'importe qui.
"""
import base64, pathlib, re, sys

RACINE = pathlib.Path(__file__).resolve().parent.parent
SRC, DIST = RACINE / "src", RACINE / "dist"
APERCUS = RACINE / "assets" / "apercus"
PUBLIC = RACINE / "public"


def banque_apercus():
    """Encode les PNG en une seule déclaration JS."""
    fichiers = sorted(APERCUS.glob("*.png"))
    if not fichiers:
        sys.exit("Aucun aperçu dans assets/apercus — lancez outils/generer-apercus.py")
    lignes = []
    for f in fichiers:
        b64 = base64.b64encode(f.read_bytes()).decode()
        lignes.append(f'  {f.stem}:"data:image/png;base64,{b64}"')
    return ("/* ==========================================================================\n"
            "   APERÇUS — GÉNÉRÉ, NE PAS ÉDITER\n"
            "   Source : assets/apercus/*.png, régénérables par outils/generer-apercus.py.\n"
            "   Illustrations originales : aucun visuel de jeu sous licence.\n"
            "   ========================================================================== */\n"
            "var APERCUS = {\n" + ",\n".join(lignes) + "\n};")


def script():
    parties = [banque_apercus()]
    for f in sorted((SRC / "js").glob("*.js")):
        parties.append(f.read_text(encoding="utf-8").rstrip())
    # 00-entete.js porte le "use strict" : il doit rester en tête.
    entete = [p for p in parties if p.startswith('"use strict"')]
    if entete:
        parties.remove(entete[0])
        parties.insert(0, entete[0])
    return "\n\n".join(parties)


def main():
    DIST.mkdir(exist_ok=True)
    html = (SRC / "index.html").read_text(encoding="utf-8")
    css = (SRC / "styles.css").read_text(encoding="utf-8").rstrip()

    for marque, contenu in (("/* @@STYLES@@ */", css), ("/* @@SCRIPT@@ */", script())):
        if marque not in html:
            sys.exit(f"Marqueur absent de src/index.html : {marque}")
        html = html.replace(marque, contenu)

    # Garde-fou : la charte impose que toute couleur vienne des jetons.
    bloc = css[css.index(":root{"): css.index("/* Noms internes")]
    egarees = set(re.findall(r"#[0-9A-Fa-f]{6}", css.replace(bloc, "")))
    if egarees:
        sys.exit("Couleurs codées en dur hors du bloc de jetons : " + ", ".join(sorted(egarees)))

    (DIST / "tourneo.html").write_text(html, encoding="utf-8")
    for f in PUBLIC.glob("*"):
        (DIST / f.name).write_bytes(f.read_bytes())

    ko = len(html.encode()) / 1024
    print(f"dist/tourneo.html — {ko:.0f} ko, {html.count(chr(10))+1} lignes, 0 dépendance")
    print("dist/manifest.webmanifest, dist/sw.js")


if __name__ == "__main__":
    main()
