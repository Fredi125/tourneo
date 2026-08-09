/* ==========================================================================
   3. MOTEUR DE POINTAGE
   ========================================================================== */
function pointsRang(ep, rang, N){
  if (!rang || rang < 1) return 0;
  if (ep.mode === "manuel"){
    var b = ep.baremeManuel || [];
    if (!b.length) return 0;
    return Number(rang <= b.length ? b[rang-1] : b[b.length-1]) || 0;
  }
  var base = Number(E.reglages.ptsBase) || 0;
  var etendue = Number(E.reglages.ptsEtendue) || 0;
  var v = (N <= 1) ? base + etendue
                   : base + etendue * (N - Math.min(rang, N)) / (N - 1);
  return E.reglages.pointsEntiers ? Math.round(v) : v;
}

function barmeAutoPour(N){
  var out = [], n = Math.max(N, 1);
  for (var r = 1; r <= n; r++) out.push(pointsRang({mode:"auto"}, r, n));
  return out;
}

function mancheClassee(m){
  return Object.keys(m.rangs || {}).some(function(k){ return m.rangs[k] > 0; });
}

/**
 * Résultats complets d'une épreuve : points de chacun, rôle, pari.
 */
function calculerEpreuve(ep){
  var poids = Number(ep.poids) || 1;
  var parJoueur = {};
  var participants = (ep.participants || []).filter(function(j){ return trouverJoueur(j); });
  var manches = (ep.manches || []).filter(mancheClassee);

  var compteAffilies = {};
  Object.keys(ep.affiliations || {}).forEach(function(a){
    var p = ep.affiliations[a];
    compteAffilies[p] = (compteAffilies[p]||0) + 1;
  });

  // Points bruts d'épreuve, avant bonus et pondération.
  var brut = {}, nbManches = {};
  participants.forEach(function(j){ brut[j] = 0; nbManches[j] = 0; });

  manches.forEach(function(m){
    var N = participants.filter(function(j){ return m.rangs[j] > 0; }).length;
    participants.forEach(function(j){
      var r = m.rangs[j] || 0;
      if (!r) return;
      brut[j] += pointsRang(ep, r, N);
      nbManches[j]++;
    });
  });
  if (ep.cumul === "moyenne"){
    participants.forEach(function(j){ if (nbManches[j] > 1) brut[j] = brut[j] / nbManches[j]; });
  }

  var classee = manches.length > 0;

  // Vainqueur de l'épreuve — sert aux paris. Égalités admises.
  var meilleur = -Infinity, vainqueurs = [];
  if (classee){
    participants.forEach(function(j){
      if (nbManches[j] === 0) return;
      if (brut[j] > meilleur){ meilleur = brut[j]; vainqueurs = [j]; }
      else if (brut[j] === meilleur) vainqueurs.push(j);
    });
  }

  participants.forEach(function(j){
    var bonus = (Number(E.reglages.bonusPorteur)||0) * (compteAffilies[j]||0);
    parJoueur[j] = { pts: nbManches[j] ? arrondir((brut[j] + bonus) * poids) : null,
                     brut: brut[j], bonus: bonus, manches: nbManches[j],
                     role:"joue", porteur:null, pariSur:null, pariGagne:false, gainPari:0 };
  });

  var taux = (Number(E.reglages.tauxHeritage)||0) / 100;
  Object.keys(ep.affiliations || {}).forEach(function(aff){
    var port = ep.affiliations[aff];
    if (!trouverJoueur(aff)) return;
    var src = brut[port] || 0;
    var ok = (nbManches[port] || 0) > 0;
    parJoueur[aff] = { pts: ok ? arrondir(src * taux * poids) : null,
                       brut: src, bonus:0, manches:0,
                       role:"suit", porteur:port, pariSur:null, pariGagne:false, gainPari:0 };
  });

  // Les paris s'ajoutent par-dessus le rôle, quel qu'il soit.
  if (E.reglages.parisActifs){
    Object.keys(ep.paris || {}).forEach(function(jid){
      if (!trouverJoueur(jid)) return;
      var mise = ep.paris[jid];
      if (!parJoueur[jid])
        parJoueur[jid] = { pts:null, brut:0, bonus:0, manches:0, role:"parie",
                           porteur:null, pariSur:mise, pariGagne:false, gainPari:0 };
      parJoueur[jid].pariSur = mise;
      if (!classee) return;
      var gagne = vainqueurs.indexOf(mise) !== -1;
      parJoueur[jid].pariGagne = gagne;
      parJoueur[jid].gainPari = gagne ? (Number(E.reglages.gainPari)||0) : 0;
      parJoueur[jid].pts = arrondir((parJoueur[jid].pts || 0) + parJoueur[jid].gainPari);
    });
  }

  return { parJoueur: parJoueur, classee: classee, vainqueurs: vainqueurs, manches: manches.length };
}

function totaux(exclureId){
  var t = {};
  E.joueurs.forEach(function(j){ t[j.id] = { total:0, detail:{} }; });
  E.epreuves.forEach(function(ep){
    if (exclureId && ep.id === exclureId) return;
    var r = calculerEpreuve(ep);
    Object.keys(r.parJoueur).forEach(function(jid){
      var v = r.parJoueur[jid];
      if (!t[jid]) return;
      t[jid].detail[ep.id] = v;
      if (typeof v.pts === "number") t[jid].total += v.pts;
    });
  });
  Object.keys(t).forEach(function(k){ t[k].total = arrondir(t[k].total); });
  return t;
}

/* Critères de départage, dans l'ordre où on les applique. */
var DEPARTAGES = [
  { cle:"victoires", long:"aux jeux gagnés",            court:"jeux gagnés" },
  { cle:"meilleur",  long:"à la meilleure manche",      court:"meilleure manche" },
  { cle:"joues",     long:"au nombre de jeux disputés", court:"jeux disputés" }
];

function criteresTous(exclureId){
  var c = {};
  E.joueurs.forEach(function(j){ c[j.id] = { victoires:0, meilleur:0, joues:0 }; });
  E.epreuves.forEach(function(x){
    if (exclureId && x.id === exclureId) return;
    var r = calculerEpreuve(x);
    r.vainqueurs.forEach(function(v){ if (c[v]) c[v].victoires++; });
    Object.keys(r.parJoueur).forEach(function(jid){
      if (!c[jid]) return;
      var v = r.parJoueur[jid];
      if (v.pts === null) return;
      if (v.pts > c[jid].meilleur) c[jid].meilleur = v.pts;
      if (v.role === "joue") c[jid].joues++;
    });
  });
  return c;
}

function classement(exclureId){
  var t = totaux(exclureId);
  var c = criteresTous(exclureId);
  var out = E.joueurs.map(function(j){
    return { joueur:j, total:t[j.id].total, detail:t[j.id].detail, crit:c[j.id], departage:null };
  }).sort(function(a,b){
    if (b.total !== a.total) return b.total - a.total;
    for (var i=0;i<DEPARTAGES.length;i++){
      var k = DEPARTAGES[i].cle;
      if (b.crit[k] !== a.crit[k]) return b.crit[k] - a.crit[k];
    }
    return a.joueur.nom.localeCompare(b.joueur.nom, "fr");
  });
  // On dit pourquoi, sinon le salon croit à un tri au hasard.
  for (var i=0; i<out.length-1; i++){
    if (out[i].total !== out[i+1].total) continue;
    var motif = null;
    for (var k=0; k<DEPARTAGES.length; k++){
      var cle = DEPARTAGES[k].cle;
      if (out[i].crit[cle] !== out[i+1].crit[cle]){ motif = DEPARTAGES[k]; break; }
    }
    out[i].departage = { sur: out[i+1].joueur.nom,
                         long: motif ? motif.long : "par ordre alphabétique, faute de mieux",
                         court: motif ? motif.court : "ex æquo" };
  }
  return out;
}

function arrondir(n){
  var d = Math.max(0, Math.min(3, Number(E.reglages.decimales) || 0));
  var f = Math.pow(10, d);
  return Math.round(n * f) / f;
}
function fmt(n){
  if (n === null || n === undefined) return "—";
  var d = Math.max(0, Math.min(3, Number(E.reglages.decimales) || 0));
  return Number(n).toFixed(d);
}
