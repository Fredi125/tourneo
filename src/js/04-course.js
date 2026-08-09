/* ==========================================================================
   4. LECTURE DE COURSE
   ========================================================================== */
function epreuveVedette(){
  var enJeu = null, best = null;
  E.epreuves.forEach(function(ep){
    if (!enJeu && ep.statut === "en_jeu" && calculerEpreuve(ep).classee) enJeu = ep;
  });
  if (enJeu) return enJeu;
  E.epreuves.forEach(function(ep){
    if (ep.statut !== "terminee" || !calculerEpreuve(ep).classee) return;
    if (!best || (ep.rangFin||0) > (best.rangFin||0)) best = ep;
  });
  return best;
}

function mouvements(){
  var notees = E.epreuves.filter(function(ep){ return calculerEpreuve(ep).classee; });
  if (notees.length < 2) return null;
  var v = epreuveVedette();
  if (!v) return null;
  var rangAvant = {};
  classement(v.id).forEach(function(r,i){ rangAvant[r.joueur.id] = i+1; });
  return { epreuve:v, rangAvant:rangAvant };
}

function maxPointsEpreuve(ep){
  var poids = Number(ep.poids) || 1, base;
  if (ep.mode === "manuel"){
    var b = (ep.baremeManuel||[]).map(Number).filter(function(x){ return !isNaN(x); });
    base = b.length ? Math.max.apply(null, b) : 0;
  } else {
    base = (Number(E.reglages.ptsBase)||0) + (Number(E.reglages.ptsEtendue)||0);
  }
  var nbM = Math.max(1, (ep.manches||[]).length);
  if (ep.cumul !== "moyenne") base = base * nbM;
  var cap = (E.reglages.capaciteActive && Number(E.reglages.capaciteAffilies) > 0)
    ? Number(E.reglages.capaciteAffilies) : 0;
  var pari = E.reglages.parisActifs ? (Number(E.reglages.gainPari)||0) : 0;
  return (base + (Number(E.reglages.bonusPorteur)||0) * cap) * poids + pari;
}

function pointsRestants(){
  return E.epreuves.filter(function(ep){ return ep.statut !== "terminee"; })
                   .reduce(function(s, ep){ return s + maxPointsEpreuve(ep); }, 0);
}

function horsCourse(cl){
  var out = {};
  if (!cl.length) return out;
  var reste = pointsRestants(), meneur = cl[0].total;
  cl.forEach(function(r){ out[r.joueur.id] = (r.total + reste) < meneur; });
  return out;
}

function epreuvesRestantes(){
  return E.epreuves.filter(function(ep){ return ep.statut !== "terminee"; }).length;
}

// Le classement général se scelle pour les dernières épreuves.
function estAveugle(){
  var R = E.reglages;
  if (!R.aveugleActif || E.aveugleLeve) return false;
  var finies = E.epreuves.length - epreuvesRestantes();
  if (finies < 1) return false;
  var reste = epreuvesRestantes();
  return reste > 0 && reste <= Number(R.aveugleDernieres);
}
