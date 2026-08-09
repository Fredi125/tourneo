# CLAUDE.md — Tourneo

Constitution du projet. À lire en entier avant toute modification.
Les règles marquées **INVARIANT** ne se changent pas sans instruction
explicite de Fred : elles définissent ce qu'est l'application.

---

## 1. Ce qu'est le projet

Une application de pointage pour tournoi maison multidisciplinaire :
jeux vidéo et jeux de table dans la même soirée, chacun noté séparément,
cumul en un classement général.

Sa particularité, et sa raison d'être, est le **mécanisme d'affiliation** :
un joueur qui ne participe pas à un jeu peut se déclarer derrière un
participant et hériter de ses points. C'est ce qui permet à quelqu'un qui
ne touche pas à Mario Kart de rester dans la course, et c'est ce qui
fabrique des noyaux d'équipe au fil de la soirée.

**Tourneo est le nom de l'application. Ce n'est pas le nom de la soirée.**
`E.nom` porte le nom de l'événement — « Tournoi maison » par défaut,
modifiable dans les réglages — et c'est lui qui s'affiche en gros dans
l'en-tête et sur le téléviseur. La marque, elle, vit dans le sigle de
l'en-tête, le titre de l'onglet, le manifeste, le pied de page et le
récapitulatif. Ne pas confondre les deux ni les fusionner.

**Utilisateur unique connu :** Fred, organisateur, qui tient l'appareil.
Les autres joueurs regardent le téléviseur. L'application n'a pas de
compte, pas de serveur, pas de réseau.

---

## 2. Invariants de l'application

**INVARIANT — Un seul fichier.** `dist/tourneo.html` doit rester ouvrable
en double-cliquant dessus, hors ligne, sans serveur. Zéro CDN, zéro
police distante, zéro requête réseau. Le test `Charte visuelle → aucune
dépendance externe` garde cette porte.

**INVARIANT — Aucun visuel sous licence.** Les jaquettes, logos et
personnages de jeux (Nintendo, Blizzard, Bandai Namco, Valve…) sont
protégés. Ne jamais télécharger ni intégrer d'art officiel, même « juste
pour tester ». Les aperçus de `assets/apercus/` n'ont donc que deux
sources permises :

- une **photo libre de droit** — CC0 ou domaine public, rien d'autre :
  ces deux-là n'imposent aucune condition à qui reçoit le fichier, alors
  qu'une CC-BY réclame un crédit qu'un fichier unique porte mal. Gare au
  faux ami : sur un site de photos, « libre de droit » veut souvent dire
  « payé une fois ». La photo va dans `assets/photos/<clé>.jpg`, sa
  provenance dans `assets/photos/SOURCES.md`. Elle montre un **sujet
  générique** : un kart pour Mario Kart, une cible pour les dards, un
  échiquier pour les échecs. Jamais une capture, une boîte, un
  personnage ;
- à défaut, une **illustration originale** composée des tracés de `ICONES`.

`outils/generer-apercus.py` fabrique les deux, en bichromie aux couleurs de
la famille, pictogramme par-dessus. Pour changer un visuel : remplacer le
JPEG carré dans `assets/photos/` et relancer le script. Si Fred veut ses
propres visuels pour une soirée, le champ `image` de chaque jeu existe
aussi, sans passer par le build.

**Cet invariant protège le dépôt, pas la machine de Fred.** Le dépôt se
partage, donc il ne porte rien qui ne soit pas libre. Le `tourneo.html`
que Fred fabrique chez lui, personne ne le distribue : ce qu'il y met ne
regarde que lui. `assets/photos/perso/` est là pour ça — ignoré par git,
prioritaire sur la photo libre de droit, posé tel quel sans bichromie ni
pictogramme. Mode d'emploi dans son `LISEZMOI.md`. Ne jamais verser le
contenu de ce dossier dans git, ni le contourner en écrivant dans
`assets/photos/`.

**INVARIANT — Les affiliations se déclarent avant la partie.** Le cycle
d'un jeu est `a_venir → declarations → en_jeu → terminee`. Les
affiliations et les paris ne sont modifiables qu'en `declarations`. Une
fois `en_jeu`, ils sont figés. Pouvoir choisir son porteur après avoir vu
le résultat détruirait le jeu. Ce verrou n'est pas paramétrable.

**INVARIANT — Rien ne sort de l'appareil.** Pas de télémétrie, pas
d'analytique, pas d'appel sortant. Fred construit sous une philosophie
qu'il appelle *anti-enshittification* : local d'abord, souveraineté des
données. Toute suggestion d'abonnement, de compte ou de synchronisation
infonuagique est hors sujet.

**INVARIANT — Aucune transaction, jamais.** Tourneo ne se vend pas, ne
se loue pas et ne rapporte rien à personne. Pas de prix, pas d'achat
intégré, pas de version « pro », pas de publicité, pas de don, pas de
mécénat. C'est une application de salon qu'on ouvre entre amis, et elle
le reste. Toute proposition qui suppose de l'argent quelque part est à
écarter sans discussion — y compris les formulations douces du genre
« payez ce que vous voulez ».

**INVARIANT — L'annulation.** Toute action qui modifie l'état doit rester
annulable. Le mécanisme photographie l'état avant chaque geste et compare
après ; il ne demande aucune déclaration de la part du code appelant.
Ne pas contourner `traiterClic` / `traiterChangement`.

---

## 3. Règles du tournoi

Le moteur est dans `src/js/03-pointage.js`, les règles sociales dans
`05-affiliation.js`, la lecture de course dans `04-course.js`.

### Barème normalisé

```
points = base + étendue × (N − rang) ÷ (N − 1)
```

`N` est le nombre de **participants réellement classés dans la manche**,
pas le nombre de joueurs présents. C'est la clé : l'espérance vaut
`base + étendue/2` quel que soit `N`, donc un jeu à trois ne rapporte pas
plus facilement qu'un jeu à huit. **Ne pas remplacer par un barème fixe
type F1 sans comprendre ce que ça casse.** Le test
`Barème → espérance constante` protège cette propriété.

Défauts : base 2, étendue 8, arrondi à l'entier. Les égalités sont
permises : deux joueurs au même rang touchent la même chose.

### Manches

Un jeu contient une ou plusieurs manches, chacune avec ses rangs.
`cumul` vaut `"somme"` (la durée est récompensée) ou `"moyenne"`
(le poids du jeu reste constant, la chance est lissée).

### Affiliation

- Héritage à 100 % par défaut, paramétrable.
- Capacité d'accueil : 2 affiliés par porteur et par jeu (0 = illimité).
  C'est le **seul frein** quand l'héritage est à 100 %.
- Plafond de coéquipiers : 3 personnes distinctes pour la soirée,
  **bidirectionnel** — porter quelqu'un consomme un lien des deux côtés.
  C'est ce qui fabrique les noyaux d'équipe et empêche la boule de neige.
- Un porteur qui bascule vers une affiliation emporte ses propres
  affiliés, qui retombent « sans camp ». Comportement voulu, signalé.

### Paris

N'importe qui mise sur le vainqueur d'un jeu, sauf sur soi-même. Bon
pronostic = 3 points, **non pondérés** par le poids du jeu. Le gain
s'ajoute par-dessus le rôle : un affilié qui parie juste touche les deux.

### Départage

Cascade : points → jeux gagnés (en jouant seulement) → meilleure manche →
nombre de jeux disputés → alphabétique. Le motif est **affiché**. Si tout
est identique, l'application l'avoue plutôt que de trancher en silence.

### Mode aveugle

Quand il ne reste plus que N jeux, le classement général disparaît des
écrans. Les faits saillants qui révéleraient le cumul (« Lutte la plus
serrée », « Encore en jeu ») se taisent automatiquement. Les podiums par
jeu et les cercles d'équipe restent, ils ne divulguent aucun total.
**Toute nouvelle statistique doit être auditée contre ce mode.**

---

## 4. Charte visuelle

Inspirée de [GameCrawler](https://gamecrawler.app), l'application de
Daniel Richard, partenaire de développement de Fred, en vue d'une
éventuelle liaison entre les deux applications. Direction : *« a shared
bonfire »* — braise chaude sur nuit profonde.

**INVARIANT — Un seul bloc de couleurs.** Tout part du bloc `:root` en
tête de `src/styles.css`, nommé selon la convention Tailwind v4 de
GameCrawler (`--color-bg`, `--color-fg`, `--color-ember`…). Les fonds
teintés dérivent par `color-mix`. Le canvas et le SVG lisent les jetons
via `jetonCSS()` au moment du dessin.

**Aucune couleur codée en dur hors de ce bloc.** `outils/build.py`
refuse de construire si un `#RRGGBB` traîne ailleurs dans le CSS, et le
test `Charte visuelle` le revérifie.

Les valeurs actuelles sont une **interprétation**, pas les vraies : je
n'ai pas pu extraire le `@theme` de GameCrawler. Quand Fred les obtiendra
de Dan, il suffit de remplacer le bloc.

### Typographie et voix

Structure éditoriale de GameCrawler : œillet en petites capitales
ambrées, puis un titre déclaratif court avec un mot en italique.
*Ce qu'on joue. · Qui mène. · Qui suit qui. · Ce qui restera.*
Le helper est `entete(oeil, titre, sous)`.

Toute l'interface est en **français québécois**. Ton direct, phrases
courtes, pas de jargon technique côté utilisateur. Les vide-états sont
des invitations à agir, pas des excuses. Les erreurs disent ce qui s'est
passé et comment le réparer.

Pas de police web : pile système uniquement. Une PWA hors ligne ne
dépend pas d'un CDN.

### Tactile

Cibles à 46 px minimum (`--tap`), `touch-action: manipulation`, retour
visuel à l'appui. L'application se manipule debout, une main, avec un
verre dans l'autre. Toute nouvelle commande respecte ça.

---

## 5. Conventions de code

- **JavaScript simple, sans transpilation.** `var`, `function`, pas de
  modules ES, pas de classes, pas de `async` sauf nécessité. Les fichiers
  de `src/js/` sont concaténés dans l'ordre alphabétique et partagent la
  portée globale. C'est volontaire : zéro outillage, zéro `node_modules`.
- **Aucune dépendance d'exécution.** Ni au build (Python standard +
  `cairosvg` pour les images seulement), ni au runtime.
- **Rendu complet à chaque changement.** `rendre()` réécrit toutes les
  vues et restaure le focus. Pas de diff, pas de réactivité. Suffisant
  pour douze joueurs, et beaucoup plus simple à raisonner.
- **L'état d'interface ne se sauvegarde pas.** `panneauOuvert`,
  `epreuveOuverte`, `choixPreset`, `mancheActive`, `ongletRang` sont des
  variables de module, jamais sérialisées ni exportées.
- **Clés de stockage.** `tourneo-v1` et `tourneo-archives`. `Stockage.lire`
  reprend automatiquement les anciennes clés `tournoi-maison-*` la
  première fois, sans effacer l'original. Ce pont pourra disparaître
  après quelques soirées.
- **Migrations.** `normaliserEpreuve()` doit rester capable de lire les
  formats précédents. Elle convertit déjà `rangs` (avant les manches) en
  `manches[0].rangs`. Elle reconnaît aussi un jeu à son nom quand il n'a
  que la manette générique — `familleDuNom()` et sa table `SYNONYMES`
  rendent sa cible à « Fléchettes ». Le drapeau `blasonManuel`, posé dès
  que Fred choisit un pictogramme ou une teinte, coupe cette
  reconnaissance : un choix à la main ne se fait jamais écraser au
  chargement. Toute évolution du modèle passe par là.
- **Commentaires** : en français, sur le *pourquoi*, pas le *quoi*.
- Français dans le code comme dans l'interface. Ne pas angliciser les
  identifiants existants.

---

## 6. Travailler sur ce dépôt

```bash
python3 outils/build.py          # sources → dist/tourneo.html
node tests/moteur.mjs            # 79 vérifications, sortie non nulle si échec
python3 outils/generer-apercus.py  # régénère les 27 aperçus (cairosvg + Pillow)
```

**Boucle obligatoire : modifier `src/` → build → tests.** Ne jamais
éditer `dist/tourneo.html` directement, il est écrasé au build.

`src/js/08-apercus.js` n'existe pas dans le dépôt : la banque d'images
est fabriquée au build à partir de `assets/apercus/` — les photos en
`.jpg`, les dessins en `.png`, une seule extension par clé. Ne pas la
créer à la main.

Servir en local :

```bash
cd dist && python3 -m http.server 8080
```

Le service worker et l'installation PWA n'existent qu'en HTTP(S) ; en
`file://` tout fonctionne sauf le cache hors ligne, dont l'application
n'a de toute façon pas besoin.

---

## 7. Pièges connus

- **`localStorage` peut être indisponible** (mode privé, iframe, certains
  `file://`). Le module `Stockage` bascule en mémoire vive et l'affiche
  dans un bandeau rouge. Ne jamais supprimer cet avertissement : perdre
  une soirée de points en silence serait pire que ne rien sauvegarder.
- **La fenêtre miroir** (`#tv`) est en lecture seule et se synchronise
  par l'événement `storage`. Elle ne doit jamais écrire.
- **Le récapitulatif** est dessiné au canvas, pas via SVG sérialisé, pour
  éviter les canvas tachés. Il demande confirmation si le classement est
  encore scellé.
- **La ligue cumule par nom**, seul identifiant stable entre deux
  soirées. Une faute de frappe crée un joueur fantôme. Documenté dans
  l'interface, à ne pas « corriger » par des identifiants.
- Le fichier construit pèse ~391 ko dont 182 ko d'images — 24 photos et
  3 dessins. Normal. Les photos sortent en JPEG plutôt qu'en PNG pour
  cette raison ; c'est aussi pour ça qu'elles sont lissées avant
  l'encodage. Ne pas gonfler `COTE` sans regarder ce que ça coûte : les
  aperçus s'affichent à 54 px dans un blason et à ~300 px en fond de tuile.
