/* ==========================================================================
   8. PICTOGRAMMES ET PRÉRÉGLAGES
   Dessins originaux sur une grille de 24. Aucun logo ni personnage sous
   licence : ce sont des familles de jeu, pas des marques.
   ========================================================================== */
var ICONES = {
  kart:      '<path d="M4 14.6h16"/><path d="M6.2 14.6 8 10.3A2 2 0 0 1 9.8 9h4.4a2 2 0 0 1 1.8 1.3l1.8 4.3"/><circle cx="7.6" cy="17" r="2.3"/><circle cx="16.4" cy="17" r="2.3"/><path d="M15.4 9V6.6h3"/>',
  bolide:    '<circle cx="15" cy="12" r="5.2"/><path d="M8.2 8.4 3.6 6M8.2 12H3M8.2 15.6 3.6 18"/>',
  ballon:    '<circle cx="12" cy="12" r="8.4"/><path d="m12 7.4 3.6 2.6-1.4 4.2H9.8L8.4 10z"/><path d="M12 3.6v3.8M4.4 9.8l4 .2M19.6 9.8l-4 .2M7.4 19.6l2.4-3.4M16.6 19.6l-2.4-3.4"/>',
  raquette:  '<ellipse cx="10.4" cy="9.4" rx="5.8" ry="6.4"/><path d="m8.6 15.2-2 5.2"/><circle cx="19" cy="16.6" r="2.1"/>',
  tennis:    '<ellipse cx="13.6" cy="8.4" rx="5" ry="5.8"/><path d="M13.6 14.2 10.8 21"/><circle cx="5.2" cy="16.4" r="2.2"/>',
  golf:      '<path d="M9 3.2v15.2"/><path d="M9 4 17.2 7 9 10z"/><ellipse cx="12" cy="19.6" rx="7.6" ry="2.1"/><circle cx="16.4" cy="17.1" r="1.6"/>',
  impact:    '<circle cx="12" cy="12" r="3.4"/><path d="M12 2.8v3.4M12 17.8v3.4M2.8 12h3.4M17.8 12h3.4M5.5 5.5 7.9 7.9M16.1 16.1l2.4 2.4M18.5 5.5l-2.4 2.4M7.9 16.1l-2.4 2.4"/>',
  epees:     '<path d="M4.6 4 15 14.4M19.4 4 9 14.4"/><path d="m13.4 15.6 3.4 3.4 2-2-3.4-3.4M10.6 15.6 7.2 19l-2-2 3.4-3.4"/>',
  poing:     '<path d="M6.4 8.6A4.2 4.2 0 0 1 10.6 4.4h3.6a5 5 0 0 1 5 5v2.8a2.6 2.6 0 0 1-2.6 2.6H6.4z"/><path d="M6.4 14.8h9.6v2.8a2.4 2.4 0 0 1-2.4 2.4H8.8a2.4 2.4 0 0 1-2.4-2.4z"/><path d="M6.4 9.6H5A1.6 1.6 0 0 0 3.4 11.2v1.6A1.6 1.6 0 0 0 5 14.4h1.4"/>',
  chateau:   '<path d="M4 20.4V9.2l1.9-1.4V4.6h2.5v2.4L12 4.6l3.6 2.4V4.6h2.5v3.2L20 9.2v11.2z"/><path d="M10 20.4V16h4v4.4"/><path d="M7.6 11.8h1.6M14.8 11.8h1.6"/>',
  vaisseau:  '<path d="M12 2.6 16.6 12v6.4L12 16.1 7.4 18.4V12z"/><path d="M7.4 12 3.3 15.2v3.5l4.1-2.3M16.6 12l4.1 3.2v3.5l-4.1-2.3"/><path d="M12 19.2v2.2"/>',
  hache:     '<path d="M9.6 7 18.6 20"/><path d="M9.6 7C7 5.5 4.2 6 2.6 8c1.4 2.4 4 3.6 6.6 3.2"/><path d="M9.6 7c2.6-1.5 5.4-1 7 1-1.4 2.4-4 3.6-6.6 3.2"/>',
  piece:     '<path d="M6.6 20.6h10.8"/><path d="M8.2 18.6h7.6l.9-6.8-3.1 2.3L12 9.2l-1.6 4.9-3.1-2.3z"/><circle cx="12" cy="6.2" r="1.9"/>',
  babyfoot:  '<path d="M3 7.4h18"/><path d="M12 7.4v3.3"/><path d="M9.7 10.7h4.6v4.5H9.7z"/><path d="M10.5 15.2 9 20.4M13.5 15.2 15 20.4"/><circle cx="18.6" cy="18" r="1.9"/>',
  cible:     '<circle cx="10.8" cy="13.2" r="7.8"/><circle cx="10.8" cy="13.2" r="4.4"/><circle cx="10.8" cy="13.2" r="1.3"/><path d="m13.4 10.6 6.6-6.6M17.4 3.2h3.4v3.4"/>',
  bille:     '<circle cx="9.4" cy="14.6" r="5.4"/><circle cx="9.4" cy="14.6" r="2"/><path d="m14.2 10.4 6.6-6.6"/>',
  poche:     '<path d="M4 19.8 8.6 6.6h9.6L20 19.8z"/><ellipse cx="12.7" cy="10.8" rx="1.9" ry="1.5"/><rect x="9.2" y="14.6" width="4.8" height="3.4" rx="1.2"/>',
  disque:    '<circle cx="12" cy="12" r="8.8"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1.3"/><circle cx="12" cy="7.7" r=".65"/><circle cx="15" cy="9" r=".65"/><circle cx="16.3" cy="12" r=".65"/><circle cx="15" cy="15" r=".65"/><circle cx="12" cy="16.3" r=".65"/><circle cx="9" cy="15" r=".65"/><circle cx="7.7" cy="12" r=".65"/><circle cx="9" cy="9" r=".65"/>',
  hexagone:  '<path d="m8.6 2.8 4.4 2.5v5.1l-4.4 2.5-4.4-2.5V5.3z"/><path d="m15.4 10.9 4.4 2.5v5.1l-4.4 2.5-4.4-2.5v-5.1z"/>',
  jetons:    '<ellipse cx="12" cy="7.6" rx="7" ry="3"/><path d="M5 7.6v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"/><path d="M5 11.6v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"/>',
  de:        '<rect x="3.8" y="3.8" width="16.4" height="16.4" rx="3.6"/><circle cx="8.8" cy="8.8" r="1.35" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.35" fill="currentColor" stroke="none"/><circle cx="15.2" cy="15.2" r="1.35" fill="currentColor" stroke="none"/>',
  question:  '<rect x="4" y="3.4" width="16" height="17.2" rx="3.2"/><path d="M9.5 9.4a2.6 2.6 0 1 1 3.5 2.5c-.7.3-1 .9-1 1.6v.5"/><circle cx="12" cy="17" r="1.1" fill="currentColor" stroke="none"/>',
  note:      '<path d="M9.2 17.8V5.4l9.6-2v12"/><ellipse cx="6.6" cy="17.8" rx="2.6" ry="2.2"/><ellipse cx="16.2" cy="15.4" rx="2.6" ry="2.2"/>',
  micro:     '<rect x="9" y="2.6" width="6" height="11" rx="3"/><path d="M5.4 11.4a6.6 6.6 0 0 0 13.2 0"/><path d="M12 18v3.4M8.6 21.4h6.8"/>',
  danse:     '<circle cx="13.8" cy="4.6" r="2"/><path d="m13.2 8-3.6 2.8 1.8 3.4-2.6 6"/><path d="m11.4 14.2 4.4 1.6 1.6 4.4"/><path d="M9.6 10.8 5 12.2M13.2 8l4.4 2.4"/>',
  blocs:     '<rect x="3.6" y="3.6" width="6.6" height="6.6" rx="1.2"/><rect x="13.8" y="3.6" width="6.6" height="6.6" rx="1.2"/><rect x="3.6" y="13.8" width="6.6" height="6.6" rx="1.2"/><rect x="13.8" y="13.8" width="6.6" height="6.6" rx="1.2"/>',
  manette:   '<path d="M8.5 7.6h7a5.4 5.4 0 0 1 5.3 4.4l.8 4.4a2.6 2.6 0 0 1-4.8 1.9l-1.5-2.3H8.7l-1.5 2.3a2.6 2.6 0 0 1-4.8-1.9l.8-4.4a5.4 5.4 0 0 1 5.3-4.4z"/><path d="M6.2 12.4h3M7.7 10.9v3"/><circle cx="15.6" cy="11.9" r=".95" fill="currentColor" stroke="none"/><circle cx="17.8" cy="13.7" r=".95" fill="currentColor" stroke="none"/>',
  pion:      '<path d="M12 3.2a2.8 2.8 0 0 1 1.9 4.9l3.5 1.5a2 2 0 0 1 1.2 1.9v1.4h-4.2l1.4 6.6H8.2l1.4-6.6H5.4v-1.4a2 2 0 0 1 1.2-1.9l3.5-1.5A2.8 2.8 0 0 1 12 3.2z"/>',
  trophee:   '<path d="M8 4h8v5.4a4 4 0 0 1-8 0z"/><path d="M8 5.4H5.4v1.8A3 3 0 0 0 8.4 10.2M16 5.4h2.6v1.8a3 3 0 0 1-3 3"/><path d="M12 13.4v3.2M9 20.4h6l-.8-3.8H9.8z"/>'
};

function apercuDe(x){
  return x.image || APERCUS[x.icone] || "";
}

/* Reconnaître un jeu à son nom. Un jeu tapé à la main, ou repris d'un
   fichier d'avant les pictogrammes, arrive sans blason. Plutôt que la
   manette générique, on regarde s'il est au catalogue sous un autre nom :
   « Fléchettes » retrouve la cible des dards, « FIFA » son ballon. */
var SYNONYMES = {
  "flechettes":"Dards", "darts":"Dards",
  "babyfoot":"Baby-foot", "kicker":"Baby-foot", "soccer sur table":"Baby-foot",
  "tennis de table":"Ping-pong", "pong":"Ping-pong",
  "tennis":"Mario Tennis", "golf":"Mario Golf", "mini golf":"Mario Golf",
  "echec":"Échecs", "chess":"Échecs",
  "pool":"Billard", "8-ball":"Billard", "snooker":"Billard",
  "poches":"Jeu de poches", "sacs de sable":"Jeu de poches", "cornhole":"Jeu de poches",
  "fifa":"EA Sports FC", "soccer":"EA Sports FC", "football":"EA Sports FC",
  "smash":"Super Smash Bros.", "smash bros":"Super Smash Bros.",
  "age of empires":"Age of Empires II", "aoe":"Age of Empires II",
  "warcraft":"Warcraft III", "starcraft II":"StarCraft",
  "colons de catane":"Catan", "catane":"Catan",
  "blind test":"Quiz musical", "quiz":"Quiz musical",
  "karaoke":"Karaoké", "dance":"Just Dance",
  "tetris 99":"Tetris", "mario kart 8":"Mario Kart", "rocket":"Rocket League"
};

// Comparaison indulgente : sans accents, sans ponctuation, sans espaces.
function cleNom(s){
  return String(s || "").toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

var INDEX_NOMS = null;
function familleDuNom(nom){
  if (!INDEX_NOMS){
    INDEX_NOMS = {};
    PRESETS.forEach(function(f){
      f.jeux.forEach(function(g){ INDEX_NOMS[cleNom(g.nom)] = { icone:g.icone, teinte:f.teinte }; });
    });
    Object.keys(SYNONYMES).forEach(function(k){
      var cible = INDEX_NOMS[cleNom(SYNONYMES[k])];
      if (cible) INDEX_NOMS[cleNom(k)] = cible;
    });
  }
  return INDEX_NOMS[cleNom(nom)] || null;
}

function svgIcone(cle, taille){
  var d = ICONES[cle] || ICONES.manette;
  return '<svg viewBox="0 0 24 24" width="'+taille+'" height="'+taille+'" fill="none" stroke="currentColor" '+
         'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
}

var PRESETS = [
  { cat:"Course & sport", teinte:"#F0705E", jeux:[
    { nom:"Mario Kart",        icone:"kart",     poids:1, manches:3, note:"3 Grands Prix, ordre d'arrivée" },
    { nom:"Rocket League",     icone:"bolide",   poids:1, manches:2, note:"Score final, équipes classées" },
    { nom:"EA Sports FC",      icone:"ballon",   poids:1, manches:1, note:"Duels ou mini-tournoi" },
    { nom:"Mario Tennis",      icone:"tennis",   poids:1, manches:2, note:"Simples ou doubles, victoires cumulées" },
    { nom:"Mario Golf",        icone:"golf",     poids:1, manches:1, note:"Le plus bas pointage prend le premier rang" },
    { nom:"Ping-pong",         icone:"raquette", poids:1, manches:1, note:"Ronde rapide, classée aux victoires" }
  ]},
  { cat:"Combat", teinte:"#F5903C", jeux:[
    { nom:"Super Smash Bros.", icone:"impact",   poids:1, manches:3, note:"Mêlées à 4, ordre d'élimination" },
    { nom:"Soul Calibur",      icone:"epees",    poids:1, manches:2, note:"Duels, victoires cumulées" },
    { nom:"Tekken",            icone:"poing",    poids:1, manches:2, note:"Manches courtes, plusieurs duels" }
  ]},
  { cat:"Stratégie", teinte:"#9E8CE0", jeux:[
    { nom:"Age of Empires II", icone:"chateau",  poids:2, manches:1, note:"Partie longue, poids doublé" },
    { nom:"StarCraft",         icone:"vaisseau", poids:2, manches:1, note:"Partie longue, poids doublé" },
    { nom:"Warcraft III",      icone:"hache",    poids:2, manches:1, note:"Partie longue, poids doublé" },
    { nom:"Échecs",            icone:"piece",    poids:1, manches:3, note:"Blitz en ronde suisse" }
  ]},
  { cat:"Adresse & réflexes", teinte:"#86C39B", jeux:[
    { nom:"Baby-foot",         icone:"babyfoot", poids:1, manches:2, note:"Équipes de deux, quatre joueurs classés" },
    { nom:"Dards",             icone:"cible",    poids:1, manches:2, note:"501 ou cricket" },
    { nom:"Billard",           icone:"bille",    poids:1, manches:1, note:"8-ball en duel ou en ronde" },
    { nom:"Jeu de poches",     icone:"poche",    poids:1, manches:2, note:"Deux équipes, 21 points" },
    { nom:"Crokinole",         icone:"disque",   poids:1, manches:2, note:"Duel ou 2 contre 2" },
    { nom:"Tetris",            icone:"blocs",    poids:1, manches:3, note:"Meilleur score, ou dernier debout" }
  ]},
  { cat:"Table", teinte:"#84B4EA", jeux:[
    { nom:"Catan",             icone:"hexagone", poids:2, manches:1, note:"Classement aux points de victoire" },
    { nom:"Poker",             icone:"jetons",   poids:2, manches:1, note:"Ordre d'élimination inversé" },
    { nom:"Mario Party",       icone:"de",       poids:2, manches:1, note:"Classement final du plateau" },
    { nom:"Trivial Pursuit",   icone:"question", poids:1, manches:1, note:"Classement aux camemberts" }
  ]},
  { cat:"Ambiance", teinte:"#E58BB4", jeux:[
    { nom:"Quiz musical",      icone:"note",     poids:1, manches:3, note:"Manches de 10 titres" },
    { nom:"Karaoké",           icone:"micro",    poids:1, manches:1, note:"Le salon vote et classe" },
    { nom:"Just Dance",        icone:"danse",    poids:1, manches:2, note:"Score de l'écran converti en rang" }
  ]}
];
