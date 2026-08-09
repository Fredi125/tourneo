/* ==========================================================================
   2. ÉTAT
   ========================================================================== */
var PALETTE = ["#F5903C","#84B4EA","#86C39B","#F0705E","#E5B34A","#E58BB4",
               "#9E8CE0","#6FC6C0","#E0855C","#B8C46A","#7FA8E8","#D89A6A"];

function id(){ return Math.random().toString(36).slice(2,10); }

function reglagesDefaut(){
  return {
    ptsBase: 2, ptsEtendue: 8, pointsEntiers: true, decimales: 0,
    tauxHeritage: 100, bonusPorteur: 0,
    capaciteActive: true, capaciteAffilies: 2,
    plafondActif: true, plafondPartenaires: 3, plafondBidirectionnel: true,
    affiliationObligatoire: true,
    parisActifs: true, gainPari: 3,
    aveugleActif: false, aveugleDernieres: 2,
    chronoActif: false
  };
}

function etatVierge(){
  return { version:3, nom:"Tournoi maison", reglages:reglagesDefaut(),
           joueurs:[], epreuves:[], compteurFin:0, aveugleLeve:false, onglet:"tournoi" };
}

var E = etatVierge();

// État d'interface pur — jamais sauvegardé, jamais exporté.
var panneauOuvert  = null;  // { type:"porteur"|"pari", ep, j }
var motifRefus     = null;  // { ep, j, texte }
var epreuveOuverte = null;  // id de l'épreuve dont les réglages sont affichés
var choixPreset    = false;
var mancheActive   = {};    // { epId: index }
var ongletRang     = "soir";// "soir" | "ligue"

/* --- Pile d'annulation ---------------------------------------------------
   On photographie l'état AVANT chaque geste, puis on compare : si rien n'a
   bougé, rien n'est empilé. Les archives de ligue entrent dans la photo,
   sinon annuler un archivage laisserait la soirée versée deux fois.        */
var historique = [];
var LIB_ACTION = {
  "joueur-ajoute":"l'ajout d'un joueur", "joueur-retire":"le retrait d'un joueur",
  "joueur-nom":"le changement de nom", "joueur-couleur":"le changement de couleur",
  "epreuve-ajoute":"l'ajout d'un jeu", "ajouter-preset":"l'ajout d'un jeu",
  "ep-retire":"la suppression d'un jeu", "ep-monte":"le déplacement du jeu",
  "ep-descend":"le déplacement du jeu", "ep-nom":"le changement de nom du jeu",
  "ep-poids":"le changement de poids", "ep-mode":"le changement de barème",
  "ep-cumul":"le changement de cumul des manches", "ep-bareme":"la modification du barème",
  "bareme-auto":"le remplissage du barème", "bareme-plus":"l'ajout d'une position",
  "bareme-moins":"le retrait d'une position", "ep-icone":"le changement de pictogramme",
  "ep-teinte":"le changement de teinte", "ep-image":"le changement d'image",
  "ep-image-vider":"le retrait de l'image",
  "declare-joue":"la déclaration", "declare-vide":"l'effacement des choix",
  "choisir-porteur":"le choix du porteur", "choisir-pari":"le pari",
  "annuler-pari":"le retrait du pari",
  "statut":"le changement d'état du jeu", "lancer":"le lancement du jeu",
  "deverrouiller":"la réouverture des déclarations",
  "manche-plus":"l'ajout d'une manche", "manche-moins":"le retrait d'une manche",
  "manche-vider":"l'effacement de la manche",
  "rang-suivant":"la saisie du rang", "rang-select":"la saisie du rang",
  "reveler":"la révélation du classement", "resceller":"la remise du sceau",
  "archiver":"l'archivage de la soirée", "archive-retire":"le retrait d'une soirée",
  "reinit":"l'effacement du tournoi", "exemple":"le chargement de la soirée d'exemple",
  "importe":"l'import du fichier",
  "r-nom":"le changement de nom du tournoi", "r-num":"le changement de réglage",
  "r-bool":"le changement de réglage"
};

function instantane(){
  try { return JSON.stringify({ e:E, a:lireArchives() }); } catch(err){ return null; }
}
function memoriser(avant, action){
  if (avant === null || MIROIR) return;
  if (instantane() === avant) return;
  historique.push({ etat:avant, libelle: LIB_ACTION[action] || "la dernière modification" });
  if (historique.length > 12) historique.shift();
  majAnnuler();
}
function majAnnuler(){
  var b = document.getElementById("btn-annuler");
  if (!b) return;
  var h = historique[historique.length-1];
  b.hidden = !h;
  if (h) b.title = "Annuler " + h.libelle;
}
function annuler(){
  var h = historique.pop();
  if (!h) return;
  var o;
  try { o = JSON.parse(h.etat); } catch(err){ majAnnuler(); return; }
  E = Object.assign(etatVierge(), o.e);
  E.reglages = Object.assign(reglagesDefaut(), (o.e && o.e.reglages) || {});
  E.epreuves = ((o.e && o.e.epreuves) || []).map(normaliserEpreuve);
  ecrireArchives(o.a || []);
  fermerPanneaux(); epreuveOuverte = null; choixPreset = false; mancheActive = {};
  rendre();
  majAnnuler();
}

function charger(){
  var brut = Stockage.lire(CLE);
  if (!brut) return false;
  try {
    var o = JSON.parse(brut);
    if (!o || typeof o !== "object") return false;
    E = Object.assign(etatVierge(), o);
    E.reglages = Object.assign(reglagesDefaut(), o.reglages || {});
    E.joueurs = Array.isArray(o.joueurs) ? o.joueurs : [];
    E.epreuves = (Array.isArray(o.epreuves) ? o.epreuves : []).map(normaliserEpreuve);
    E.compteurFin = Number(o.compteurFin) || 0;
    return true;
  } catch(e){ return false; }
}

var minuterieSauvegarde = null;
function sauvegarder(){
  if (MIROIR) return;
  clearTimeout(minuterieSauvegarde);
  minuterieSauvegarde = setTimeout(function(){
    Stockage.ecrire(CLE, JSON.stringify(E));
  }, 160);
}

function normaliserEpreuve(ep){
  var x = Object.assign({
    id:id(), nom:"Épreuve", poids:1, mode:"auto", baremeManuel:[],
    icone:"manette", teinte:"#84B4EA", image:"",
    statut:"a_venir", participants:[], affiliations:{}, paris:{},
    manches:[], cumul:"somme", debutA:0, finA:0, rangFin:0
  }, ep || {});
  // Reprise des fichiers d'avant les manches multiples.
  if ((!x.manches || !x.manches.length)){
    x.manches = [{ id:id(), rangs: (ep && ep.rangs) ? ep.rangs : {} }];
  }
  x.manches = x.manches.map(function(m){ return { id:m.id||id(), rangs:m.rangs||{} }; });
  delete x.rangs;
  return x;
}
