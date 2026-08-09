# Plan de développement — Tourneo

Phases ordonnées par risque décroissant, pas par intérêt. Chaque lot est
autonome et livrable seul : build vert, tests verts, application
utilisable à la fin de chaque phase.

Estimations en deux colonnes, **solo** et **assisté par IA**. Le ratio est
meilleur qu'à l'accoutumée sur ce projet parce que le domaine est petit et
entièrement spécifié : une fois la règle écrite, le reste est du rendu et
de la manipulation d'état. Le coût qui ne s'accélère pas, c'est le test
avec de vrais joueurs.

---

## Phase 1 — Boucher les trous connus

Rien de spectaculaire. C'est ce qui évite qu'une soirée réussie se
termine sur une engueulade.

### 1.1 Alerter quand un porteur n'a pas de rang

**Problème.** Un participant accueille deux affiliés, puis abandonne en
cours de partie et ne reçoit aucun rang. Ses affiliés touchent zéro, en
silence, et l'apprennent au classement une heure plus tard.

**À faire.** Dans `carteJeu()`, signaler tout porteur sans rang alors que
la manche est notée. Bloquer la clôture, ou au minimum avertir dans la
boîte de confirmation, comme pour les joueurs sans camp.

**Test à ajouter.** Un porteur sans rang, deux affiliés : la clôture
avertit et les affiliés sont nommés.

| Solo | Assisté |
|---|---|
| 1 h – 1 h 30 | 20 – 30 min |

### 1.2 Classement à la moyenne par jeu disputé

**Problème.** Quelqu'un qui arrive au troisième jeu ne peut
mathématiquement plus gagner et se voit étiqueté « hors course » dès son
arrivée. C'est exact et socialement désastreux.

**À faire.** Un troisième segment dans la vue Classement, à côté de
*Ce soir* et *La ligue* : classement à la moyenne par jeu où le joueur
avait un rôle. Le vainqueur officiel reste celui du cumul ; c'est un
classement d'honneur.

**Attention.** Ce classement révèle des totaux — il doit se taire en mode
aveugle, comme les faits saillants.

| Solo | Assisté |
|---|---|
| 2 – 3 h | 40 – 60 min |

### 1.3 Profils de règles

**Problème.** Quinze paramètres dans les réglages. Trop long à parcourir
en soirée, et personne ne sait quelle combinaison est cohérente.

**À faire.** Trois boutons en tête des réglages — *Amical*, *Compétitif*,
*Chaos* — qui posent un jeu complet de valeurs. Les détails restent
modifiables ensuite. Suggestions de départ :

| | Amical | Compétitif | Chaos |
|---|---|---|---|
| Héritage | 100 % | 70 % | 100 % |
| Bonus porteur | 1 | 0 | 2 |
| Capacité d'accueil | 2 | 1 | illimitée |
| Plafond de coéquipiers | 3 | 3 | 0 |
| Paris | oui, 3 pts | oui, 2 pts | oui, 5 pts |
| Mode aveugle | non | oui, 2 jeux | oui, 3 jeux |

**Règle.** Le prochain travail sur les réglages doit en **retirer** un,
pas en ajouter.

| Solo | Assisté |
|---|---|
| 1 h 30 – 2 h | 30 – 45 min |

**Total phase 1 : 4 h 30 – 6 h 30 solo · 1 h 30 – 2 h 15 assisté**

---

## Phase 2 — Les vraies couleurs

### 2.1 Synchroniser la charte avec GameCrawler

**Prérequis.** Obtenir de Dan les valeurs et les noms de ses jetons.
Détails dans `HANDOFF.md`, section « Ce qui est incertain ».

**À faire.** Remplacer le bloc `:root` de `src/styles.css`. Si les noms
diffèrent, renommer dans tout le dépôt — c'est mécanique, la couche de
correspondance est déjà isolée. Régénérer les 27 aperçus, qui lisent les
mêmes jetons — la bichromie des photos en dépend autant que les dessins. Ajuster `public/manifest.webmanifest`.

**Vérifier.** Le test `Charte visuelle` doit rester vert, et les
aperçus rester lisibles à 54 px : contrôler à la taille réelle
d'affichage, pas seulement en grand.

| Solo | Assisté |
|---|---|
| 1 h 30 – 2 h 30 | 30 – 45 min |

### 2.2 Police d'affichage partagée, si elle existe

Si GameCrawler auto-héberge une police, copier le woff2 à côté du HTML et
le déclarer en `@font-face` avec la pile système en repli. **Ne pas
introduire de CDN** : c'est un invariant.

| Solo | Assisté |
|---|---|
| 45 min – 1 h 30 | 20 – 30 min |

---

## Phase 3 — Décharger l'organisateur

Le goulot d'étranglement de la soirée, c'est Fred. Dix personnes lui
dictent leurs choix pendant qu'il tapote.

### 3.1 Mode « passe l'appareil »

Un écran plein cadran qui affiche un joueur à la fois : nom en grand,
trois grandes zones *Joue / Suit / Parie*, puis *Suivant*. Il fait le tour
de la table pendant la phase de déclarations, Fred récupère l'appareil à
la fin. Aucun serveur.

**Points d'attention.** Le sélecteur de porteur doit tenir dans le format
plein écran ; les blocages (cercle plein, porteur complet) doivent rester
lisibles et explicables sans que Fred ait à intervenir.

| Solo | Assisté |
|---|---|
| 3 – 5 h | 1 h – 1 h 30 |

### 3.2 Annonces vocales sur le téléviseur

`SpeechSynthesis`, intégré aux navigateurs, aucun fichier à héberger.
« Marie prend la tête. » au moment où le classement bascule. Déclencher
sur le changement de meneur détecté par `mouvements()`, jamais plus d'une
annonce par épreuve, désactivable.

| Solo | Assisté |
|---|---|
| 1 h – 1 h 30 | 20 – 30 min |

### 3.3 Feuille de secours imprimable

Une feuille de style `@media print` : joueurs en lignes, jeux en
colonnes, cases vides, barème rappelé en bas. Si l'appareil meurt à 23 h,
la soirée continue au crayon.

| Solo | Assisté |
|---|---|
| 1 – 2 h | 20 – 30 min |

---

## Phase 4 — Les duels

### 4.1 Appariements

La moitié du catalogue est en 1 contre 1 : Tekken, échecs, billard, Soul
Calibur. L'application laisse Fred seul avec « qui joue contre qui ».

**À faire.** Pour un jeu marqué « duels », générer un calendrier — ronde
suisse ou poules selon le nombre de participants — l'afficher, saisir les
résultats match par match, et convertir le tableau final en rangs pour le
moteur existant. **Ne pas toucher au moteur de pointage :** les
appariements produisent des rangs, rien de plus.

C'est le plus gros morceau du plan et le plus utile si les soirées
penchent vers le versus.

| Solo | Assisté |
|---|---|
| 6 – 9 h | 2 – 3 h |

---

## Phase 5 — Après plusieurs soirées

À n'entreprendre que si l'événement se répète vraiment. Chacun de ces
points est un projet, pas une amélioration.

- **Application par joueur avec serveur.** React Router 7 + Postgres +
  SSE sur le VPS. Les joueurs déclarent depuis leur téléphone, la TV suit
  en direct. Estimé plus tôt à **21 – 31 h solo / 7 – 9 h assisté**.
  Attention : ça sacrifie l'invariant du fichier unique.
- **Liaison avec GameCrawler.** Importer une bibliothèque de jeux pour
  peupler le catalogue. À discuter avec Dan avant toute ligne de code.
- **Statistiques de long terme.** Elo, profils de joueurs, tendances. La
  ligue par cumul dit déjà l'essentiel ; ne pas se lancer là-dedans sans
  un besoin exprimé.

---

## Déconseillé

- **Un framework.** Le rendu complet suffit largement à douze joueurs et
  le projet n'a aucune dépendance. C'est un atout, pas une dette.
- **Plus de jeux au catalogue.** Vingt-quatre, c'est déjà plus que ce qui
  sera joué en trois soirées.
- **Des visuels officiels de jeux.** Voir `CLAUDE.md`, invariant n°2.
- **Un abonnement, un compte, une synchronisation infonuagique.** Hors
  sujet pour cette application.
- **Toute forme de transaction.** Prix, achat intégré, version « pro »,
  publicité, don : rien de tout ça n'entrera. Voir `CLAUDE.md`,
  invariant n°5.

---

## Repères de qualité

Avant chaque livraison :

```bash
python3 outils/build.py && node tests/moteur.mjs
```

Et pour tout ce qui touche l'interface, la question qui tranche : **est-ce
que ça se manipule debout, à une main, dans un salon mal éclairé, avec du
bruit ?** Si non, ce n'est pas fini.
