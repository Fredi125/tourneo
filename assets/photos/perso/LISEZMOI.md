# Vos visuels à vous

Ce dossier est **ignoré par git**. Ce que vous y déposez reste sur votre
machine : ça n'est jamais versionné, jamais poussé, jamais distribué.
Seul ce mode d'emploi est suivi par le dépôt.

C'est la porte de sortie prévue pour les visuels que le dépôt ne peut pas
porter — une jaquette, une capture, un logo. `CLAUDE.md`, invariant n°2,
interdit d'en verser dans `assets/photos/` parce que le dépôt se partage.
Votre `tourneo.html` à vous, personne ne le distribue : ce qui s'y trouve
ne regarde que vous.

## Comment faire

Déposez une image carrée ou verticale nommée d'après la **clé** du jeu,
puis relancez la fabrication :

```bash
python3 outils/generer-apercus.py
python3 outils/build.py
```

Formats acceptés : `.jpg`, `.jpeg`, `.png`, `.webp`.

**Une seule dépendance : `python -m pip install pillow`.** Un visuel
personnel se compose sans SVG, donc sans `cairosvg` — la bibliothèque
native Cairo qu'il réclame n'est pas fournie avec Python sous Windows.
Sans elle, le générateur laisse les 29 aperçus versionnés tels quels,
ce qui est exactement ce qu'on veut : ils sont déjà justes.

```
assets/photos/perso/kart.jpg        → Mario Kart
assets/photos/perso/impact.png      → Super Smash Bros.
assets/photos/perso/epees.jpg       → Soul Calibur
```

Les clés sont listées dans `../SOURCES.md`, colonne « Clé ». Elles valent
aussi pour les trois pictogrammes sans photo : `manette`, `pion`,
`trophee`.

## Ce qui change à l'écran

Un visuel personnel passe **avant** la photo libre de droit, et il est
posé tel quel : ni bichromie, ni pictogramme par-dessus. C'est votre
image qu'on veut voir. Elle est montrée en entier — une jaquette verticale
n'est pas recadrée, le vide sur les côtés est comblé par une copie floue
et assombrie de l'image. Un dégradé discret assombrit le bas pour que le
nom du jeu reste lisible dans la tuile, et le liseré de la famille reste
en place.

L'aperçu fabriqué ne remplace pas celui du dépôt : il est écrit à part,
dans `assets/apercus/perso/`, lui aussi ignoré par git. `outils/build.py`
le préfère au moment d'assembler le fichier unique. Les 29 aperçus libres
de droit restent intacts, et `git status` reste propre.

Retirez le fichier, relancez le script : son aperçu personnel est effacé
et le jeu retrouve sa photo libre de droit. Rien n'est perdu.

## Sans toucher aux fichiers

Pour une seule soirée, plus court encore : engrenage du jeu → **Utiliser
une image**. La photo est recadrée en 128 px et rangée dans le navigateur,
pas dans le dépôt. Aucune reconstruction nécessaire.
