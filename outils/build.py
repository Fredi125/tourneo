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
APERCUS_PERSO = APERCUS / "perso"
PUBLIC = RACINE / "public"


TYPES = {".png": "image/png", ".jpg": "image/jpeg"}

# Rempli au passage : sert à prévenir avant de recopier le fichier construit
# par-dessus la version que le dépôt distribue.
PERSO_UTILISES = []


def banque_apercus():
    """Encode les aperçus en une seule déclaration JS."""
    fichiers = sorted(f for f in APERCUS.iterdir() if f.suffix in TYPES)
    if not fichiers:
        sys.exit("Aucun aperçu dans assets/apercus — lancez outils/generer-apercus.py")
    # Une clé, un aperçu : deux extensions pour la même clé écriraient deux
    # fois la même propriété dans la banque, et la dernière gagnerait.
    vus = set()
    doubles = sorted({f.stem for f in fichiers if f.stem in vus or vus.add(f.stem)})
    if doubles:
        sys.exit("Deux aperçus pour la même clé : " + ", ".join(doubles))
    # Le visuel personnel l'emporte, sans jamais remplacer le fichier
    # versionné : il vit dans un sous-dossier ignoré par git.
    maison = {f.stem: f for f in sorted(APERCUS_PERSO.glob("*.jpg"))} if APERCUS_PERSO.is_dir() else {}
    fichiers = [maison.pop(f.stem, f) for f in fichiers]
    PERSO_UTILISES.extend(sorted(set(f.stem for f in fichiers if f.parent == APERCUS_PERSO)))
    if maison:
        print("  aperçus personnels sans clé connue, ignorés : " + ", ".join(sorted(maison)))
    lignes = []
    for f in fichiers:
        b64 = base64.b64encode(f.read_bytes()).decode()
        lignes.append(f'  {f.stem}:"data:{TYPES[f.suffix]};base64,{b64}"')
    return ("/* ==========================================================================\n"
            "   APERÇUS — GÉNÉRÉ, NE PAS ÉDITER\n"
            "   Source : assets/apercus/, régénérables par outils/generer-apercus.py.\n"
            "   Dessins originaux et photos libres de droit (CC0 ou domaine public,\n"
            "   provenance dans assets/photos/SOURCES.md) : aucun visuel de jeu\n"
            "   sous licence.\n"
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

    # newline="\n" : sans ça, Python écrit en CRLF sous Windows. Le fichier
    # unique est versionné ; il doit sortir identique au bit près, quelle que
    # soit la machine qui le construit.
    (DIST / "tourneo.html").write_text(html, encoding="utf-8", newline="\n")
    for f in PUBLIC.glob("*"):
        (DIST / f.name).write_bytes(f.read_bytes())

    ko = len(html.encode()) / 1024
    print(f"dist/tourneo.html — {ko:.0f} ko, {html.count(chr(10))+1} lignes, 0 dépendance")
    print("dist/manifest.webmanifest, dist/sw.js")
    if PERSO_UTILISES:
        print("\nCe fichier contient " + str(len(PERSO_UTILISES)) + " visuel(s) personnel(s) : "
              + ", ".join(PERSO_UTILISES) + ".")
        print("Il est pour vous. Ne le recopiez pas sur tourneo.html à la racine,")
        print("qui est versionné et ne doit porter que des visuels libres de droit.")


if __name__ == "__main__":
    main()
