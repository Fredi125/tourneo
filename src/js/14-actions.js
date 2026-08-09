/* ==========================================================================
   13. ACTIONS
   ========================================================================== */
function reindexerRangs(m){
  var cl = Object.keys(m.rangs).filter(function(j){ return m.rangs[j] > 0; })
                 .sort(function(a,b){ return m.rangs[a] - m.rangs[b]; });
  var neuf = {}, precedent = null, courant = 0;
  cl.forEach(function(j){
    if (m.rangs[j] !== precedent){ courant++; precedent = m.rangs[j]; }
    neuf[j] = courant;
  });
  m.rangs = neuf;
}
function prochainRangLibre(m){
  var pris = Object.keys(m.rangs).map(function(k){ return m.rangs[k]; }).filter(function(r){ return r>0; });
  return pris.length ? Math.max.apply(null, pris) + 1 : 1;
}
function fermerPanneaux(){ panneauOuvert = null; motifRefus = null; }

document.addEventListener("click", function(evt){
  if (MIROIR) return;
  var o = evt.target.closest("[data-onglet]");
  if (o){
    E.onglet = o.getAttribute("data-onglet");
    fermerPanneaux(); epreuveOuverte = null; choixPreset = false;
    rendre(); window.scrollTo(0,0); return;
  }
  var b = evt.target.closest("[data-act]");
  if (!b || b.tagName === "SELECT" || b.tagName === "INPUT") return;
  var a = b.getAttribute("data-act");
  if (a === "annuler"){ annuler(); return; }   // jamais empilé sur lui-même
  var avant = instantane();
  try { traiterClic(a, b); } finally { memoriser(avant, a); }
});

function traiterClic(a, b){
  var e = b.getAttribute("data-ep") ? ep(b.getAttribute("data-ep")) : null;
  var j, p, i, k, m, b2, champ, nom, c2, sans, blocage, arch;

  switch(a){
    case "exemple": chargerExemple(); return;
    case "onglet-rang": ongletRang = b.getAttribute("data-v"); break;

    case "joueur-ajoute":
      champ = document.getElementById("nouveau-joueur");
      nom = (champ.value||"").trim();
      if (!nom){ champ.focus(); return; }
      E.joueurs.push({ id:id(), nom:nom, couleur: PALETTE[E.joueurs.length % PALETTE.length] });
      champ.value = "";
      rendre();
      c2 = document.getElementById("nouveau-joueur"); if (c2) c2.focus();
      return;
    case "joueur-retire":
      j = trouverJoueur(b.getAttribute("data-j"));
      if (!j || !confirm("Retirer " + j.nom + " du tournoi ? Ses résultats seront effacés.")) return;
      E.joueurs = E.joueurs.filter(function(x){ return x.id !== j.id; });
      E.epreuves.forEach(function(x){
        x.participants = x.participants.filter(function(q){ return q !== j.id; });
        x.manches.forEach(function(mm){ delete mm.rangs[j.id]; reindexerRangs(mm); });
        delete x.affiliations[j.id];
        delete x.paris[j.id];
        Object.keys(x.affiliations).forEach(function(q){ if (x.affiliations[q] === j.id) delete x.affiliations[q]; });
        Object.keys(x.paris).forEach(function(q){ if (x.paris[q] === j.id) delete x.paris[q]; });
      });
      break;

    case "epreuve-ajoute":
      champ = document.getElementById("nouvelle-epreuve");
      nom = (champ.value||"").trim();
      if (!nom){ champ.focus(); return; }
      p = normaliserEpreuve({ id:id(), nom:nom });
      E.epreuves.push(p);
      champ.value = "";
      choixPreset = false; epreuveOuverte = p.id;
      break;
    case "ouvrir-preset": choixPreset = true; epreuveOuverte = null; break;
    case "fermer-preset": choixPreset = false; break;
    case "ajouter-preset":
      k = Math.max(1, Number(b.getAttribute("data-manches")) || 1);
      m = [];
      for (i=0;i<k;i++) m.push({ id:id(), rangs:{} });
      E.epreuves.push(normaliserEpreuve({
        id:id(), nom:b.getAttribute("data-nom"), icone:b.getAttribute("data-icone"),
        poids:Number(b.getAttribute("data-poids"))||1, teinte:b.getAttribute("data-teinte"), manches:m
      }));
      break;
    case "ouvrir-epreuve": epreuveOuverte = e.id; choixPreset = false; break;
    case "fermer-epreuve": epreuveOuverte = null; break;
    case "aller-jeu":
      E.onglet = "deroulement"; epreuveOuverte = null; choixPreset = false;
      rendre();
      c2 = document.getElementById("jeu-" + e.id);
      if (c2) c2.scrollIntoView({ behavior:"smooth", block:"start" });
      return;
    case "ep-icone": e.icone = b.getAttribute("data-i"); e.image = ""; break;
    case "ep-image-choisir":
      c2 = document.getElementById("img-" + e.id);
      if (c2) c2.click();
      return;
    case "ep-image-vider": e.image = ""; break;
    case "ep-retire":
      if (!e || !confirm("Supprimer « " + e.nom + " » et ses résultats ?")) return;
      E.epreuves = E.epreuves.filter(function(x){ return x.id !== e.id; });
      epreuveOuverte = null;
      break;
    case "ep-monte":
      i = E.epreuves.indexOf(e);
      if (i>0){ E.epreuves.splice(i,1); E.epreuves.splice(i-1,0,e); }
      break;
    case "ep-descend":
      i = E.epreuves.indexOf(e);
      if (i<E.epreuves.length-1){ E.epreuves.splice(i,1); E.epreuves.splice(i+1,0,e); }
      break;
    case "bareme-auto": e.baremeManuel = barmeAutoPour(Math.max(e.participants.length, E.joueurs.length, 2)); break;
    case "bareme-plus":
      b2 = (e.baremeManuel && e.baremeManuel.length) ? e.baremeManuel.slice() : barmeAutoPour(Math.max(E.joueurs.length,2));
      b2.push(0); e.baremeManuel = b2;
      break;
    case "bareme-moins":
      b2 = (e.baremeManuel||[]).slice();
      if (b2.length>1){ b2.pop(); e.baremeManuel = b2; }
      break;

    /* déclarations */
    case "declare-joue":
      j = b.getAttribute("data-j");
      delete e.affiliations[j];
      if (e.participants.indexOf(j) === -1) e.participants.push(j);
      // on ne peut pas parier sur soi-même
      if (e.paris[j] === j) delete e.paris[j];
      Object.keys(e.paris).forEach(function(q){ if (q === j && e.paris[q] === j) delete e.paris[q]; });
      fermerPanneaux();
      break;
    case "declare-vide":
      j = b.getAttribute("data-j");
      e.participants = e.participants.filter(function(q){ return q !== j; });
      e.manches.forEach(function(mm){ delete mm.rangs[j]; reindexerRangs(mm); });
      delete e.affiliations[j];
      delete e.paris[j];
      Object.keys(e.affiliations).forEach(function(q){ if (e.affiliations[q] === j) delete e.affiliations[q]; });
      Object.keys(e.paris).forEach(function(q){ if (e.paris[q] === j) delete e.paris[q]; });
      fermerPanneaux();
      break;
    case "ouvrir-porteur":
      j = b.getAttribute("data-j");
      panneauOuvert = (panneauOuvert && panneauOuvert.type==="porteur" && panneauOuvert.ep===e.id && panneauOuvert.j===j)
        ? null : { type:"porteur", ep:e.id, j:j };
      motifRefus = null;
      break;
    case "ouvrir-pari":
      j = b.getAttribute("data-j");
      panneauOuvert = (panneauOuvert && panneauOuvert.type==="pari" && panneauOuvert.ep===e.id && panneauOuvert.j===j)
        ? null : { type:"pari", ep:e.id, j:j };
      motifRefus = null;
      break;
    case "fermer-panneau": fermerPanneaux(); break;
    case "choisir-porteur":
      j = b.getAttribute("data-j"); p = b.getAttribute("data-p");
      blocage = blocageAffiliation(e, j, p);
      if (blocage){ motifRefus = { ep:e.id, j:j, texte:blocage.texte }; break; }
      e.participants = e.participants.filter(function(q){ return q !== j; });
      e.manches.forEach(function(mm){ delete mm.rangs[j]; reindexerRangs(mm); });
      Object.keys(e.affiliations).forEach(function(q){ if (e.affiliations[q] === j) delete e.affiliations[q]; });
      e.affiliations[j] = p;
      if (e.paris[j] === j) delete e.paris[j];
      fermerPanneaux();
      break;
    case "porteur-refus":
      j = b.getAttribute("data-j"); p = b.getAttribute("data-p");
      blocage = blocageAffiliation(e, j, p);
      motifRefus = { ep:e.id, j:j, texte: blocage ? blocage.texte : "" };
      break;
    case "choisir-pari":
      j = b.getAttribute("data-j"); p = b.getAttribute("data-p");
      if (j === p) break;
      e.paris[j] = p;
      fermerPanneaux();
      break;
    case "annuler-pari":
      delete e.paris[b.getAttribute("data-j")];
      fermerPanneaux();
      break;

    /* déroulement */
    case "statut":
      e.statut = b.getAttribute("data-val");
      if (e.statut === "terminee"){
        E.compteurFin = (E.compteurFin||0) + 1;
        e.rangFin = E.compteurFin;
        if (E.reglages.chronoActif && e.debutA && !e.finA) e.finA = Date.now();
      }
      if (e.statut === "en_jeu" && E.reglages.chronoActif) e.finA = 0;
      fermerPanneaux();
      break;
    case "lancer":
      if (E.reglages.affiliationObligatoire){
        sans = E.joueurs.filter(function(q){ return roleDans(e, q.id) === "absent" && !e.paris[q.id]; })
                        .map(function(q){ return q.nom; });
        if (sans.length && !confirm("Ces joueurs n'ont ni partie, ni porteur, ni pari et marqueront 0 :\n\n" +
            sans.join(", ") + "\n\nLancer quand même ?")) return;
      }
      e.statut = "en_jeu";
      if (E.reglages.chronoActif && !e.debutA) e.debutA = Date.now();
      fermerPanneaux();
      break;
    case "deverrouiller":
      if (!confirm("Rouvrir les déclarations ? Les rangs déjà saisis seront effacés.")) return;
      e.manches = [{ id:id(), rangs:{} }];
      e.statut = "declarations";
      e.debutA = 0; e.finA = 0;
      break;
    case "manche": mancheActive[e.id] = Number(b.getAttribute("data-k")); break;
    case "manche-plus":
      e.manches.push({ id:id(), rangs:{} });
      mancheActive[e.id] = e.manches.length - 1;
      break;
    case "manche-moins":
      if (e.manches.length <= 1) break;
      k = Number(b.getAttribute("data-k"));
      if (!confirm("Retirer la manche " + (k+1) + " et ses résultats ?")) return;
      e.manches.splice(k, 1);
      mancheActive[e.id] = Math.max(0, Math.min(k, e.manches.length - 1));
      break;
    case "manche-vider":
      k = Number(b.getAttribute("data-k"));
      if (e.manches[k]) e.manches[k].rangs = {};
      break;
    case "rang-suivant":
      j = b.getAttribute("data-j");
      m = e.manches[indexManche(e)];
      if (m.rangs[j]){ delete m.rangs[j]; reindexerRangs(m); }
      else m.rangs[j] = prochainRangLibre(m);
      break;

    /* suspense, récap, ligue */
    case "reveler":
      if (!confirm("Révéler le classement général à tout le monde ? Le sceau ne se remet pas tout seul.")) return;
      E.aveugleLeve = true;
      break;
    case "resceller": E.aveugleLeve = false; break;
    case "recap": ouvrirRecap(); return;
    case "archiver":
      if (!confirm("Verser le classement dans la ligue, puis effacer les résultats de la soirée ?\n\n" +
                   "Les joueurs et les jeux sont conservés pour la prochaine fois.")) return;
      if (!archiverSoiree()){ alert("Rien à archiver : ajoutez des joueurs d'abord."); return; }
      E.epreuves.forEach(function(x){
        x.statut = "a_venir"; x.participants = []; x.affiliations = {}; x.paris = {};
        x.manches = [{ id:id(), rangs:{} }]; x.rangFin = 0; x.debutA = 0; x.finA = 0;
      });
      E.compteurFin = 0; E.aveugleLeve = false;
      mancheActive = {};
      ongletRang = "ligue";
      break;
    case "archive-retire":
      if (!confirm("Retirer cette soirée de la ligue ?")) return;
      arch = lireArchives().filter(function(s){ return s.id !== b.getAttribute("data-a"); });
      ecrireArchives(arch);
      break;

    case "exporte": exporter(); return;
    case "importe": document.getElementById("fichier-import").click(); return;
    case "reinit":
      if (!confirm("Effacer entièrement la soirée en cours ? Les archives de ligue sont conservées.")) return;
      Stockage.effacer(CLE);
      E = etatVierge();
      fermerPanneaux(); epreuveOuverte = null; choixPreset = false; mancheActive = {};
      E.onglet = "reglages";
      break;
    default: return;
  }
  rendre();
}

document.addEventListener("change", function(evt){
  var el = evt.target;
  if (el.id === "fichier-import"){ importer(el); return; }
  if (MIROIR) return;
  var a = el.getAttribute ? el.getAttribute("data-act") : null;
  if (!a) return;
  var avant = instantane();
  try { traiterChangement(a, el); } finally { memoriser(avant, a); }
});

function traiterChangement(a, el){
  var e = el.getAttribute("data-ep") ? ep(el.getAttribute("data-ep")) : null;
  var j, r, b2, m;

  switch(a){
    case "ep-image": importerImage(el, e); return;
    case "ep-teinte": e.teinte = el.value; e.image = ""; break;
    case "joueur-nom":
      j = trouverJoueur(el.getAttribute("data-j"));
      if (j) j.nom = el.value.trim() || j.nom;
      break;
    case "joueur-couleur":
      j = trouverJoueur(el.getAttribute("data-j"));
      if (j) j.couleur = el.value;
      break;
    case "ep-nom": e.nom = el.value.trim() || e.nom; break;
    case "ep-poids": e.poids = nombre(el.value); break;
    case "ep-cumul": e.cumul = el.value; break;
    case "ep-mode":
      e.mode = el.value;
      if (e.mode === "manuel" && (!e.baremeManuel || !e.baremeManuel.length))
        e.baremeManuel = barmeAutoPour(Math.max(e.participants.length, E.joueurs.length, 2));
      break;
    case "ep-bareme":
      r = Number(el.getAttribute("data-r"));
      b2 = (e.baremeManuel && e.baremeManuel.length) ? e.baremeManuel.slice() : barmeAutoPour(Math.max(E.joueurs.length,2));
      b2[r-1] = nombre(el.value);
      e.baremeManuel = b2;
      break;
    case "rang-select":
      j = el.getAttribute("data-j");
      m = e.manches[indexManche(e)];
      if (Number(el.value) > 0) m.rangs[j] = Number(el.value); else delete m.rangs[j];
      break;
    case "r-nom": E.nom = el.value.trim() || "Tournoi maison"; break;
    case "r-num": E.reglages[el.getAttribute("data-k")] = nombre(el.value); break;
    case "r-bool": E.reglages[el.getAttribute("data-k")] = el.checked; break;
    default: return;
  }
  rendre();
}

/* --- image personnalisée : recadrée en 128 px pour ne pas saturer le stockage --- */
function importerImage(input, e){
  var f = input.files && input.files[0];
  input.value = "";
  if (!f || !e) return;
  var avant = instantane();
  var url = URL.createObjectURL(f);
  var img = new Image();
  img.onload = function(){
    var T = 128, cv = document.createElement("canvas");
    cv.width = T; cv.height = T;
    var ctx = cv.getContext("2d");
    var cote = Math.min(img.width, img.height);
    ctx.drawImage(img, (img.width-cote)/2, (img.height-cote)/2, cote, cote, 0, 0, T, T);
    try { e.image = cv.toDataURL("image/jpeg", 0.82); } catch(err){ e.image = ""; }
    URL.revokeObjectURL(url);
    rendre();
    memoriser(avant, "ep-image");
  };
  img.onerror = function(){ URL.revokeObjectURL(url); alert("Image illisible. Essayez un PNG, un JPEG ou un WebP."); };
  img.src = url;
}

/* --- import / export --- */
function exporter(){
  var blob = new Blob([JSON.stringify(E, null, 2)], { type:"application/json" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = (E.nom || "tourneo").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") +
               "-" + new Date().toISOString().slice(0,10) + ".json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){ URL.revokeObjectURL(url); }, 1500);
}
function importer(input){
  var f = input.files && input.files[0];
  if (!f) return;
  var fr = new FileReader();
  var avant = instantane();
  fr.onload = function(){
    try {
      var o = JSON.parse(fr.result);
      if (!o || !Array.isArray(o.joueurs)) throw new Error("format");
      E = Object.assign(etatVierge(), o);
      E.reglages = Object.assign(reglagesDefaut(), o.reglages || {});
      E.epreuves = (o.epreuves||[]).map(normaliserEpreuve);
      fermerPanneaux(); epreuveOuverte = null; choixPreset = false; mancheActive = {};
      E.onglet = "classement";
      rendre();
      memoriser(avant, "importe");
    } catch(err){
      alert("Ce fichier n'est pas un tournoi exportable. Choisissez un JSON produit par « Exporter ».");
    }
  };
  fr.readAsText(f);
  input.value = "";
}

/* --- soirée d'exemple --- */
function chargerExemple(){
  if (E.joueurs.length && !confirm("Remplacer le contenu actuel par la soirée d'exemple ?")) return;
  E = etatVierge();
  ["Fred","Marie","Tommy","Sophie","Ludo","Ariane"].forEach(function(n,i){
    E.joueurs.push({ id:id(), nom:n, couleur:PALETTE[i % PALETTE.length] });
  });
  ["Mario Kart","Baby-foot","Catan","Dards","Super Smash Bros.","Quiz musical"].forEach(function(nom){
    PRESETS.forEach(function(f){
      f.jeux.forEach(function(g){
        if (g.nom !== nom) return;
        var m = [];
        for (var i=0;i<g.manches;i++) m.push({ id:id(), rangs:{} });
        E.epreuves.push(normaliserEpreuve({ id:id(), nom:g.nom, icone:g.icone, poids:g.poids, teinte:f.teinte, manches:m }));
      });
    });
  });
  fermerPanneaux(); epreuveOuverte = null; choixPreset = false; mancheActive = {};
  E.onglet = "tournoi";
  rendre();
}
