/* ==========================================================================
   7. ARCHIVES ET LIGUE
   ========================================================================== */
function lireArchives(){
  try { var a = JSON.parse(Stockage.lire(CLE_ARCHIVES) || "[]"); return Array.isArray(a) ? a : []; }
  catch(e){ return []; }
}
function ecrireArchives(a){ Stockage.ecrire(CLE_ARCHIVES, JSON.stringify(a)); }

function archiverSoiree(){
  var cl = classement();
  if (!cl.length) return false;
  var a = lireArchives();
  a.unshift({
    id: id(),
    nom: E.nom,
    date: new Date().toISOString().slice(0,10),
    nbJeux: E.epreuves.filter(function(x){ return calculerEpreuve(x).classee; }).length,
    classement: cl.map(function(r){ return { nom:r.joueur.nom, total:r.total }; })
  });
  ecrireArchives(a.slice(0, 60));
  return true;
}

// Cumul par nom : c'est le seul identifiant stable d'une soirée à l'autre.
function ligue(inclureCourante){
  var t = {};
  function ajouter(nom, pts, place){
    var k = nom.trim().toLowerCase();
    if (!t[k]) t[k] = { nom:nom.trim(), total:0, soirees:0, victoires:0, podiums:0 };
    t[k].total += pts; t[k].soirees++;
    if (place === 1) t[k].victoires++;
    if (place <= 3) t[k].podiums++;
  }
  lireArchives().forEach(function(s){
    s.classement.forEach(function(r,i){ ajouter(r.nom, Number(r.total)||0, i+1); });
  });
  if (inclureCourante){
    var cl = classement();
    if (cl.length && cl[0].total > 0) cl.forEach(function(r,i){ ajouter(r.joueur.nom, r.total, i+1); });
  }
  return Object.keys(t).map(function(k){ return t[k]; })
    .sort(function(a,b){ return b.total - a.total || b.victoires - a.victoires || a.nom.localeCompare(b.nom,"fr"); });
}
