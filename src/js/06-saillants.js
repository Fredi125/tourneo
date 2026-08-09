/* ==========================================================================
   6. FAITS SAILLANTS
   ========================================================================== */
function faitsSaillants(){
  var f = [], cl = classement(), aveugle = estAveugle();

  var best = null, pari = null, pronos = {};
  E.epreuves.forEach(function(ep){
    var r = calculerEpreuve(ep);
    Object.keys(r.parJoueur).forEach(function(jid){
      var v = r.parJoueur[jid];
      if (v.pts !== null && v.role === "joue" && (!best || v.pts > best.pts))
        best = { pts:v.pts, jid:jid, ep:ep };
      if (v.pts !== null && v.role === "suit" && (!pari || v.pts > pari.pts))
        pari = { pts:v.pts, jid:jid, ep:ep, porteur:v.porteur };
      if (v.pariGagne) pronos[jid] = (pronos[jid]||0) + 1;
    });
  });

  if (best) f.push({ etiq:"Meilleure manche", v:fmt(best.pts), q:nomDe(best.jid), d:best.ep.nom, ton:"" });
  if (pari) f.push({ etiq:"Le pari le plus payant", v:fmt(pari.pts), q:nomDe(pari.jid),
                     d:"a suivi "+nomDe(pari.porteur)+" · "+pari.ep.nom, ton:"pervenche" });

  var topProno = Object.keys(pronos).sort(function(a,b){ return pronos[b]-pronos[a]; })[0];
  if (topProno) f.push({ etiq:"Meilleur pronostiqueur", v:String(pronos[topProno]), q:nomDe(topProno),
                         d:"pronostic"+(pronos[topProno]>1?"s":"")+" réussi"+(pronos[topProno]>1?"s":""), ton:"rose" });

  var porte = {};
  E.epreuves.forEach(function(ep){
    Object.keys(ep.affiliations||{}).forEach(function(a){ porte[ep.affiliations[a]] = (porte[ep.affiliations[a]]||0)+1; });
  });
  var topPorte = Object.keys(porte).sort(function(a,b){ return porte[b]-porte[a]; })[0];
  if (topPorte) f.push({ etiq:"Le plus recherché", v:String(porte[topPorte]), q:nomDe(topPorte),
                         d:"fois porte-drapeau ce soir", ton:"pervenche" });

  var pa = pairesAlliance();
  var topPaire = Object.keys(pa).sort(function(a,b){ return pa[b]-pa[a]; })[0];
  if (topPaire && pa[topPaire] > 1){
    var duo = topPaire.split("|");
    f.push({ etiq:"Duo le plus soudé", v:String(pa[topPaire]), q:nomDe(duo[0])+" & "+nomDe(duo[1]),
             d:"jeux côte à côte", ton:"pervenche" });
  }

  // Ces deux-là révéleraient le classement général : muets en mode aveugle.
  if (!aveugle && cl.length >= 2){
    var duel = null;
    for (var i=0; i<cl.length-1; i++){
      var ecart = arrondir(cl[i].total - cl[i+1].total);
      if (!duel || ecart < duel.ecart) duel = { ecart:ecart, a:cl[i], b:cl[i+1], place:i+1 };
    }
    if (duel && (duel.a.total > 0 || duel.b.total > 0))
      f.push({ etiq:"Lutte la plus serrée", v:fmt(duel.ecart),
               q:duel.a.joueur.nom+" / "+duel.b.joueur.nom,
               d:"points d'écart pour la "+duel.place+(duel.place===1?"re":"e")+" place", ton:"sauge" });
  }
  var nbReste = epreuvesRestantes();
  if (!aveugle && nbReste > 0 && cl.length)
    f.push({ etiq:"Encore en jeu", v:fmt(pointsRestants()), q:nbReste+" jeu"+(nbReste>1?"x":"")+" à venir",
             d:"points maximum encore atteignables", ton:"sauge" });

  if (E.reglages.chronoActif){
    var total = E.epreuves.reduce(function(s,ep){
      return s + ((ep.debutA && ep.finA) ? (ep.finA - ep.debutA) : 0);
    }, 0);
    if (total > 0) f.push({ etiq:"Temps de jeu", v:dureeTexte(total), q:"cumulés ce soir",
                            d:"sans compter les pauses entre les jeux", ton:"sauge" });
  }
  return f;
}
