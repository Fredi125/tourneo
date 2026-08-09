/* ==========================================================================
   5. RÈGLES D'AFFILIATION
   ========================================================================== */
function partenairesDe(jid, override){
  var s = {};
  E.epreuves.forEach(function(ep){
    var aff = (override && override.epreuveId === ep.id) ? override.affiliations : (ep.affiliations || {});
    Object.keys(aff).forEach(function(a){
      var p = aff[a];
      if (a === jid) s[p] = 1;
      else if (p === jid && E.reglages.plafondBidirectionnel) s[a] = 1;
    });
  });
  delete s[jid];
  return Object.keys(s);
}

function blocageAffiliation(ep, affId, portId){
  if (affId === portId) return { texte:"Un joueur ne peut pas se suivre lui-même.", court:"c'est vous" };
  if (ep.participants.indexOf(portId) === -1) return { texte:"Le porteur doit jouer cette épreuve.", court:"ne joue pas" };

  var R = E.reglages;
  if (R.capaciteActive && Number(R.capaciteAffilies) > 0){
    var n = 0;
    Object.keys(ep.affiliations).forEach(function(k){ if (ep.affiliations[k] === portId) n++; });
    if (n >= Number(R.capaciteAffilies))
      return { texte:nomDe(portId)+" accueille déjà "+n+" affilié"+(n>1?"s":"")+" sur "+R.capaciteAffilies+" pour ce jeu.",
               court:"complet" };
  }
  if (R.plafondActif && Number(R.plafondPartenaires) > 0){
    var projet = Object.assign({}, ep.affiliations);
    projet[affId] = portId;
    var ov = { epreuveId: ep.id, affiliations: projet };
    var max = Number(R.plafondPartenaires);
    if (partenairesDe(affId, ov).length > max && partenairesDe(affId).indexOf(portId) === -1)
      return { texte:nomDe(affId)+" a déjà "+max+" coéquipier"+(max>1?"s":"")+" pour la soirée : "+
               partenairesDe(affId).map(nomDe).join(", ")+".", court:"cercle plein" };
    if (R.plafondBidirectionnel && partenairesDe(portId, ov).length > max && partenairesDe(portId).indexOf(affId) === -1)
      return { texte:nomDe(portId)+" a déjà "+max+" coéquipier"+(max>1?"s":"")+" pour la soirée : "+
               partenairesDe(portId).map(nomDe).join(", ")+".", court:"son cercle est plein" };
  }
  return null;
}

function porteursPossibles(ep, affId){
  return ep.participants
    .filter(function(p){ return p !== affId; })
    .map(function(p){ return { id:p, nom:nomDe(p), blocage:blocageAffiliation(ep, affId, p) }; })
    .sort(function(a,b){
      var ba = a.blocage ? 1 : 0, bb = b.blocage ? 1 : 0;
      return ba - bb || a.nom.localeCompare(b.nom,"fr");
    });
}

function misesPossibles(ep, jid){
  return ep.participants
    .filter(function(p){ return p !== jid; })
    .map(function(p){ return { id:p, nom:nomDe(p) }; })
    .sort(function(a,b){ return a.nom.localeCompare(b.nom,"fr"); });
}

function roleDans(ep, jid){
  if (ep.participants.indexOf(jid) !== -1) return "joue";
  if (ep.affiliations[jid]) return "suit";
  return "absent";
}

function pairesAlliance(){
  var m = {};
  E.epreuves.forEach(function(ep){
    Object.keys(ep.affiliations || {}).forEach(function(a){
      var p = ep.affiliations[a];
      if (!trouverJoueur(a) || !trouverJoueur(p)) return;
      var k = [a,p].sort().join("|");
      m[k] = (m[k]||0) + 1;
    });
  });
  return m;
}
