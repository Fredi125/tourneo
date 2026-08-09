# Tourneo

Pointage pour tournoi maison multidisciplinaire — jeux vidéo et jeux de
table dans la même soirée, chacun noté séparément, cumul en un classement
général.

Sa particularité : un joueur qui ne participe pas à un jeu peut se
déclarer derrière un participant et **hériter de ses points**. Les équipes
se forment au fil de la soirée, avec un plafond de coéquipiers qui force
les noyaux à se dessiner.

Une page. Aucune dépendance. Aucun réseau. Rien ne quitte l'appareil.

## Utiliser

Téléchargez `dist/tourneo.html` et ouvrez-le. C'est tout.

Pour l'installer comme application sur un téléphone, servez les trois
fichiers de `dist/` en HTTPS : le service worker et le manifeste feront
le reste.

## Construire

```bash
python3 outils/build.py     # src/ → dist/tourneo.html
node tests/moteur.mjs       # 72 vérifications de régression
```

Python 3 et Node suffisent. `cairosvg` n'est nécessaire que pour
régénérer les illustrations.

## Structure

```
src/index.html      squelette, avec marqueurs d'injection
src/styles.css      un seul bloc de jetons de couleur en tête
src/js/*.js         concaténés dans l'ordre alphabétique
assets/apercus/     27 illustrations PNG originales
outils/build.py     assemble le fichier unique
outils/generer-apercus.py   régénère les illustrations
tests/moteur.mjs    suite de régression
dist/               produit, non versionné
```

## Documents

- **CLAUDE.md** — constitution du projet, invariants, règles du tournoi
- **HANDOFF.md** — état, décisions prises, points ouverts
- **DEVELOPMENT_PLAN.md** — suite des travaux, par phases

## Licence et visuels

Les illustrations de `assets/apercus/` sont originales. Aucun visuel de
jeu sous licence n'est utilisé, et il ne faut pas en ajouter — voir
`CLAUDE.md`, invariant n°2.
