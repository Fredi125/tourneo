/* ==========================================================================
   9. OUTILS
   ========================================================================== */
function trouverJoueur(jid){
  for (var i=0;i<E.joueurs.length;i++) if (E.joueurs[i].id === jid) return E.joueurs[i];
  return null;
}
function nomDe(jid){ var j = trouverJoueur(jid); return j ? j.nom : "?"; }
function couleurDe(jid){ var j = trouverJoueur(jid); return j ? j.couleur : "#666"; }
function initiales(nom){
  var m = String(nom||"").trim().split(/\s+/);
  return ((m[0]||"?")[0] + (m[1] ? m[1][0] : "")).toUpperCase();
}
function esc(s){
  return String(s === null || s === undefined ? "" : s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
// Valeur calculée d'un jeton CSS. Le canvas et les attributs de
// présentation SVG ne comprennent pas var() : on la leur résout.
function jetonCSS(nom, secours){
  try {
    var v = getComputedStyle(document.documentElement).getPropertyValue(nom).trim();
    return v || secours;
  } catch(e){ return secours; }
}

function jeton(jid, gros){
  return '<span class="jeton'+(gros?' gros':'')+'" style="background:'+esc(couleurDe(jid))+'">'+
         esc(initiales(nomDe(jid)))+'</span>';
}
function badgeDelta(d){
  if (d === null || d === undefined) return "";
  if (d > 0)  return '<span class="delta monte">&#9650; '+d+'</span>';
  if (d < 0)  return '<span class="delta descend">&#9660; '+Math.abs(d)+'</span>';
  return '<span class="delta stable">&#8212;</span>';
}
function dureeTexte(ms){
  var s = Math.max(0, Math.floor(ms/1000));
  var h = Math.floor(s/3600), m = Math.floor((s%3600)/60), r = s%60;
  if (h) return h + " h " + (m<10?"0":"") + m;
  return m + ":" + (r<10?"0":"") + r;
}
function nombre(v){
  var n = Number(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}
function ep(epId){
  for (var i=0;i<E.epreuves.length;i++) if (E.epreuves[i].id === epId) return E.epreuves[i];
  return null;
}
/* Un œillet, un titre déclaratif, un mot en italique : la structure
   éditoriale de GameCrawler, transposée à l'application. */
function entete(oeil, titre, sous){
  return '<div class="entete"><span class="oeil">'+esc(oeil)+'</span><h2>'+titre+'</h2>'+
         (sous ? '<p class="sous">'+sous+'</p>' : '')+'</div>';
}

var LIB_STATUT = { a_venir:"À venir", declarations:"Déclarations ouvertes", en_jeu:"En jeu", terminee:"Terminée" };

// Les trois premiers d'un jeu, participants et affiliés confondus.
function podium(x, combien){
  var r = calculerEpreuve(x);
  return Object.keys(r.parJoueur)
    .filter(function(k){ return r.parJoueur[k].pts !== null && r.parJoueur[k].role !== "parie"; })
    .sort(function(a,b){
      return r.parJoueur[b].pts - r.parJoueur[a].pts || nomDe(a).localeCompare(nomDe(b),"fr");
    })
    .slice(0, combien || 3)
    .map(function(k){ return { jid:k, v:r.parJoueur[k] }; });
}

function blason(x, taille, classe){
  var src = apercuDe(x);
  if (src) return '<span class="blason '+(classe||'')+'"><img src="'+esc(src)+'" alt="" loading="lazy"></span>';
  return '<span class="blason '+(classe||'')+'" style="background:'+esc(x.teinte)+'22;color:'+esc(x.teinte)+'">'+
         svgIcone(x.icone, taille)+'</span>';
}

function indexManche(x){
  var i = mancheActive[x.id];
  if (i === undefined || i < 0 || i >= x.manches.length) i = x.manches.length - 1;
  return i;
}
