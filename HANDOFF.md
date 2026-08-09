# Handoff — Tourneo

État au moment du passage dans Claude Code. Ce document dit **où en est
le projet, pourquoi il est comme ça, et ce qui reste ouvert**. Les règles
à respecter sont dans `CLAUDE.md`, la suite des travaux dans
`DEVELOPMENT_PLAN.md`.

---

## Où en est le projet

L'application est **fonctionnelle et complète pour une première soirée**.
Rien n'est à moitié fait ; tout ce qui est là marche et est couvert par
les tests.

Ce qui existe :

| Domaine | État |
|---|---|
| Barème normalisé, points entiers, barème manuel par jeu | complet |
| Manches multiples, somme ou moyenne | complet |
| Affiliation : héritage, capacité, plafond bidirectionnel | complet |
| Paris de salon | complet |
| Départage explicite des égalités | complet |
| Mode aveugle (classement scellé) | complet |
| Annulation, 12 niveaux, `Ctrl+Z` | complet |
| Ligue multi-soirées, archives locales | complet |
| Récapitulatif PNG partageable | complet |
| Affichage TV, 5 panneaux en rotation, fenêtre miroir | complet |
| Chronomètre par jeu | complet, désactivé par défaut |
| 24 préréglages, 27 illustrations PNG originales | complet |
| Charte visuelle inspirée de GameCrawler | complet, valeurs à confirmer |

**Non fait, et assumé :** pas de serveur, pas de compte, pas
d'appariements pour les duels, pas de saisie depuis le téléphone des
joueurs. Voir le plan de développement.

---

## Le renommage en Tourneo

L'application s'appelait « Tournoi maison ». Elle s'appelle **Tourneo**
depuis le passage en dépôt. Le changement touche le titre, le manifeste,
le sigle de l'en-tête, le pied de page, le récapitulatif, le nom du
fichier produit (`dist/tourneo.html`) et les clés de stockage.

**« Tournoi maison » reste le nom par défaut de la soirée**, modifiable
dans les réglages. Marque et événement sont deux champs distincts : ne
pas les refusionner.

`Stockage.lire` reprend une fois les données enregistrées sous les
anciennes clés `tournoi-maison-v1` et `tournoi-maison-archives`, sans
effacer l'original. Ce pont peut être retiré après quelques soirées.

---

## Le passage du monolithe aux sources

L'application vivait dans un `tournoi.html` de 2 850 lignes contenant
126 ko de base64. Ingérable en git : chaque régénération d'image
réécrivait le fichier entier, et les diffs étaient illisibles.

Le dépôt sépare donc **sources** et **produit** :

```
src/          ce qu'on édite    → versionné, diffable
assets/       les 27 PNG        → versionné, binaire, stable
outils/       build et générateur
dist/         le produit        → NON versionné, reconstruit
```

Le build reconstitue exactement le fichier unique : mêmes 115
déclarations de haut niveau, CSS identique au caractère près. Vérifié à
la reprise.

**Conséquence pratique :** ne jamais éditer `dist/`. La boucle est
`src/` → `python3 outils/build.py` → `node tests/moteur.mjs`.

---

## Décisions de conception à ne pas défaire par accident

**Le barème normalisé plutôt qu'un barème fixe.** `base + étendue ×
(N−rang)÷(N−1)` avec `N` = participants classés dans la manche. Un barème
fixe type 10/7/5/3 transforme les jeux peu fréquentés en mines d'or : à
trois joueurs, finir troisième rapporterait 5 points pour une performance
médiocre. La formule normalisée donne la même espérance quel que soit le
nombre de participants. C'est testé, et c'est fragile à toute
« simplification ».

**Le plafond de coéquipiers est bidirectionnel.** Porter quelqu'un
consomme un lien chez le porteur aussi. C'est ce qui remplace la règle
d'exclusivité que j'avais d'abord proposée : le meilleur joueur de la
soirée sature son cercle après trois personnes et ne peut plus être
choisi, ce qui casse la boule de neige *et* force les noyaux d'équipe.
Fred a explicitement demandé cette version.

**L'héritage est à 100 %.** Choix de Fred, tournoi amical. Conséquence
assumée : un affilié peut apparaître sur le podium d'un jeu auquel il n'a
pas touché, avec exactement le score de son porteur. Si ça grince en
soirée, le taux descend à 70-80 % dans les réglages. **La capacité
d'accueil (2) est le seul frein réel à 100 %** — ne pas la retirer sans
baisser l'héritage.

**Les points sont entiers.** Sans arrondi, six participants donnent
10 / 8,4 / 6,8 / 5,2 / 3,6 / 2 : illisible sur un téléviseur. L'arrondi
ne casse pas la normalisation, vérifié à N = 2, 3, 4, 6, 8, 12.

**Le rendu est complet à chaque changement.** Pas de diff, pas de
réactivité, pas de framework. `rendre()` réécrit tout et restaure le
focus et le caret. À douze joueurs c'est instantané, et c'est infiniment
plus simple à raisonner qu'un arbre réactif. Ne pas « optimiser » ça sans
un problème mesuré.

**L'annulation photographie l'état plutôt que de déclarer les actions
destructrices.** Elle compare avant/après et n'empile que si quelque
chose a bougé. Résultat : impossible d'oublier de rendre une nouvelle
action annulable. Les archives de ligue sont dans la photo, sinon annuler
un archivage laisserait la soirée versée en double.

---

## Ce qui est incertain

**Les couleurs.** La charte s'inspire de GameCrawler, l'application de
Daniel Richard, en vue d'une liaison entre les deux produits. Je n'ai pas
pu extraire les vraies valeurs : `web_fetch` rend le texte, pas la
feuille de style, et le CSS de Next.js est derrière un nom haché. Les
jetons actuels sont une **interprétation** de sa métaphore déclarée
(« a shared bonfire ») et de sa convention de nommage Tailwind v4,
visible dans son `meta theme-color: var(--color-bg)`.

Ce qu'il faut demander à Dan, par ordre d'utilité :

1. Le bloc `@theme` ou les valeurs calculées de `:root`.
2. Les **noms** exacts de ses jetons. J'ai parié sur `--color-bg`,
   `--color-fg`, `--color-muted`, `--color-border`. Mes `--color-ember` et
   `--color-cool` sont mon invention ; s'il utilise `--color-accent`, il
   faut renommer.
3. Sa police d'affichage, si elle est auto-hébergée. Le fichier woff2
   peut être copié à côté du HTML sans casser l'autonomie hors ligne.

Une capture d'écran de l'application suffirait pour lire les couleurs
directement.

**Le comportement de `localStorage` en `file://`.** La fenêtre miroir se
synchronise par l'événement `storage`, qui exige la même origine. En
`file://` les navigateurs sont inégaux. En HTTPS depuis le VPS, ça marche.
À tester en vrai avant de compter dessus le soir de la soirée.

**Le poids du fichier.** 314 ko dont 126 ko d'images. Acceptable pour une
application locale mise en cache une fois. Si ça devient gênant, le plan
prévoit de passer les images en fichiers séparés — mais ça coûte
l'autonomie du fichier unique, qui est un invariant du produit.

---

## Les trois premières choses à faire

Elles sont détaillées dans `DEVELOPMENT_PLAN.md`, phase 1.

1. **Alerter quand un porteur n'a pas de rang.** Si quelqu'un accueille
   deux affiliés puis abandonne la partie, ses affiliés touchent zéro
   sans le moindre avertissement, et ne le découvrent qu'au classement.
   C'est le dernier trou fonctionnel connu.
2. **Le classement à la moyenne par jeu disputé.** Un joueur qui arrive
   au troisième jeu est déclaré « hors course » dès son arrivée, ce qui
   est brutal et faux socialement.
3. **Les profils de règles.** Les réglages comptent quinze paramètres et
   sont trop longs. Trois boutons — *Amical*, *Compétitif*, *Chaos* —
   posent un jeu de règles cohérent d'un coup.

---

## Contexte utile

Fred organise la soirée chez lui, à Portneuf. Il tient l'appareil ; les
autres regardent le téléviseur. L'application n'a jamais été testée avec
de vrais joueurs — **c'est le test qui compte**, et celui qu'aucune suite
de régression ne remplace. Les règles vont probablement bouger après la
première soirée : c'est prévu, tout est paramétrable.

Estimations : Fred veut systématiquement une estimation **solo** et une
estimation **assistée par IA** côte à côte pour tout travail chiffré.
