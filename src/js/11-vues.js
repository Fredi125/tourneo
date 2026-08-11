/* ==========================================================================
   10. RENDU
   ========================================================================== */
var VUES = [
  { id:"tournoi",     lib:"Jeux",       g:"\u25A6" },
  { id:"classement",  lib:"Classement", g:"\u25C6" },
  { id:"deroulement", lib:"En jeu",     g:"\u25B6" },
  { id:"joueurs",     lib:"Joueurs",    g:"\u25CF" },
  { id:"reglages",    lib:"Réglages",   g:"\u2699" }
];

function rendre(){
  if (MIROIR){ rendreTV(); return; }

  var actif = document.activeElement;
  var cle = actif && actif.dataset ? actif.dataset.focus : null;
  var debut = actif && actif.selectionStart != null ? actif.selectionStart : null;

  document.getElementById("titre-appli").textContent = E.nom || "Tournoi maison";
  var finies = E.epreuves.length - epreuvesRestantes();
  document.getElementById("cadence").textContent =
    E.epreuves.length ? finies + " / " + E.epreuves.length + " jeux" : "";

  document.getElementById("onglets").innerHTML = VUES.map(function(v){
    return '<button data-onglet="'+v.id+'" aria-current="'+(E.onglet===v.id)+'">'+
           '<span class="g">'+v.g+'</span>'+v.lib+'</button>';
  }).join("");

  document.getElementById("vue-tournoi").innerHTML     = vueTournoi();
  document.getElementById("vue-classement").innerHTML  = vueClassement();
  document.getElementById("vue-deroulement").innerHTML = vueDeroulement();
  document.getElementById("vue-joueurs").innerHTML     = vueJoueurs();
  document.getElementById("vue-reglages").innerHTML    = vueReglages();
  VUES.forEach(function(v){
    document.getElementById("vue-"+v.id).classList.toggle("actif", E.onglet === v.id);
  });

  if (document.getElementById("tv").classList.contains("actif")) rendreTV();

  if (cle){
    var cible = document.querySelector('[data-focus="'+cle+'"]');
    if (cible){
      cible.focus();
      if (debut != null && cible.setSelectionRange){ try { cible.setSelectionRange(debut, debut); } catch(e){} }
    }
  }
  sauvegarder();
}

/* ---------- Vue : les jeux ---------- */
function vueTournoi(){
  if (epreuveOuverte){
    var e = ep(epreuveOuverte);
    if (e) return panneauEpreuve(e);
    epreuveOuverte = null;
  }
  if (choixPreset) return catalogueJeux();

  var h = entete("Le programme", "Ce qu'on <em>joue</em>.",
    E.epreuves.length ? "Touchez une tuile pour aller la jouer, l'engrenage pour ses réglages." : null);

  if (!E.epreuves.length){
    return h + '<div class="carte"><div class="vide-etat"><strong>Rien au programme.</strong>'+
      'Choisissez vos jeux dans le catalogue : Mario Kart, Catan, baby-foot, dards&hellip; chacun devient une manche notée à part.'+
      '<div style="margin-top:18px;display:flex;gap:9px;justify-content:center;flex-wrap:wrap">'+
      '<button class="btn primaire" data-act="ouvrir-preset">Ouvrir le catalogue</button>'+
      '<button class="btn" data-act="exemple">Soirée d\'exemple</button></div></div></div>';
  }

  h += '<div class="grille-jeux">' + E.epreuves.map(function(x){
    var p = podium(x, 3);
    var nbM = (x.manches||[]).length;
    var ap = apercuDe(x);
    var t = '<button class="tuile-jeu" data-act="aller-jeu" data-ep="'+x.id+'">'+
      (ap ? '<img class="fond-jeu" src="'+esc(ap)+'" alt="" loading="lazy">' : '')+
      '<div class="halo" style="background:'+esc(x.teinte)+'"></div>'+ blason(x, 30)+
      '<div><div class="nom-jeu">'+esc(x.nom)+'</div><div class="etat-jeu">'+LIB_STATUT[x.statut]+
        (nbM>1 ? ' &middot; '+nbM+' manches' : '') + (Number(x.poids)!==1 ? ' &middot; &#215;'+esc(x.poids) : '')+
      '</div></div><div class="podium-mini">';
    if (p.length){
      t += p.map(function(o,i){
        return '<span class="pl'+(o.v.role==="suit"?" suit":"")+'"><span class="n">'+(i+1)+'</span>'+
          '<span class="q">'+esc(nomDe(o.jid))+(o.v.role==="suit"?' &#8627;':'')+'</span>'+
          '<span class="p">'+fmt(o.v.pts)+'</span></span>';
      }).join("");
    } else {
      t += '<span class="creux">'+(x.statut==="declarations"
        ? x.participants.length+' inscrit'+(x.participants.length>1?'s':'')+
          ', '+Object.keys(x.affiliations).length+' affilié'+(Object.keys(x.affiliations).length>1?'s':'')
        : 'Podium à venir')+'</span>';
    }
    t += '</div></button><button class="reglage-jeu" data-act="ouvrir-epreuve" data-ep="'+x.id+'" '+
         'aria-label="Réglages de '+esc(x.nom)+'">&#9881;</button>';
    return '<div class="case-jeu">'+t+'</div>';
  }).join("") +
  '<button class="tuile-jeu tuile-ajout" data-act="ouvrir-preset">'+
    '<span class="plus">+</span><span style="font-size:.84rem;font-weight:650">Ajouter un jeu</span></button></div>';

  h += '<div class="petit sourdine">&#8627; signale un podium obtenu par affiliation.</div>';
  return h;
}

function catalogueJeux(){
  var h = '<div class="rangee entre" style="align-items:flex-end">'+
    entete("Le catalogue", "Choisissez vos <em>jeux</em>.")+
    '<button class="btn mini" data-act="fermer-preset" style="margin-bottom:18px">Retour</button></div>';

  h += '<div class="carte"><div class="rangee" style="gap:8px">'+
    '<input type="text" id="nouvelle-epreuve" data-focus="nouvelle-epreuve" placeholder="Ou tapez un jeu maison&hellip;" autocomplete="off">'+
    '<button class="btn primaire" data-act="epreuve-ajoute" style="flex:0 0 auto">Créer</button></div>'+
    '<div class="petit sourdine" style="margin-top:8px">Vous choisirez son pictogramme, ses manches et son poids ensuite.</div></div>';

  h += PRESETS.map(function(f){
    return '<div class="famille"><span class="etiq">'+esc(f.cat)+'</span><div class="grille-presets">'+
      f.jeux.map(function(g){
        var deja = E.epreuves.some(function(x){ return x.nom === g.nom; });
        return '<button class="preset" data-act="ajouter-preset" data-nom="'+esc(g.nom)+'" data-icone="'+esc(g.icone)+'" '+
          'data-poids="'+g.poids+'" data-manches="'+g.manches+'" data-teinte="'+esc(f.teinte)+'"'+(deja?' disabled':'')+'>'+
          (APERCUS[g.icone]
            ? '<span class="blason mini"><img src="'+esc(APERCUS[g.icone])+'" alt="" loading="lazy"></span>'
            : '<span class="blason mini" style="background:'+esc(f.teinte)+'22;color:'+esc(f.teinte)+'">'+svgIcone(g.icone,20)+'</span>')+
          '<span class="t"><b>'+esc(g.nom)+'</b><span>'+(deja?'déjà au programme':esc(g.note))+'</span></span></button>';
      }).join("")+'</div></div>';
  }).join("");
  return h;
}

function panneauEpreuve(x){
  var nbPart = Math.max(x.participants.length, E.joueurs.length, 2);
  var bareme = (x.baremeManuel && x.baremeManuel.length) ? x.baremeManuel : barmeAutoPour(nbPart);
  var i = E.epreuves.indexOf(x);

  var h = '<div class="rangee entre" style="align-items:flex-end">'+
    entete("Réglages", "Ce jeu en <em>détail</em>.")+
    '<button class="btn mini" data-act="fermer-epreuve" style="margin-bottom:18px">Retour</button></div>';

  h += '<div class="carte"><div class="rangee" style="gap:11px;margin-bottom:13px">'+ blason(x, 30)+
    '<input type="text" value="'+esc(x.nom)+'" data-act="ep-nom" data-ep="'+x.id+'" data-focus="en-'+x.id+'" aria-label="Nom du jeu">'+
    '</div><div class="duo">'+
    '<label class="champ"><span class="nom">Poids</span>'+
    '<input type="number" step="any" min="0" value="'+esc(x.poids)+'" data-act="ep-poids" data-ep="'+x.id+'" data-focus="ep-'+x.id+'">'+
    '<span class="aide">Multiplie les points de ce jeu. Les flèches avancent d\'un cran ; les décimales restent permises au clavier.</span></label>'+
    '<label class="champ"><span class="nom">Plusieurs manches</span>'+
    '<select data-act="ep-cumul" data-ep="'+x.id+'">'+
      '<option value="somme"'+(x.cumul==="somme"?" selected":"")+'>Additionner les manches</option>'+
      '<option value="moyenne"'+(x.cumul==="moyenne"?" selected":"")+'>Moyenne des manches</option></select>'+
    '<span class="aide">'+(x.cumul==="somme"
      ? 'Trois manches rapportent trois fois plus qu\'un jeu unique — la durée est récompensée.'
      : 'Le jeu garde le même poids quel que soit le nombre de manches ; la chance est lissée.')+'</span></label></div>';

  h += '<label class="champ"><span class="nom">Barème</span>'+
    '<select data-act="ep-mode" data-ep="'+x.id+'">'+
      '<option value="auto"'+(x.mode==="auto"?" selected":"")+'>Automatique (normalisé)</option>'+
      '<option value="manuel"'+(x.mode==="manuel"?" selected":"")+'>Manuel (points par position)</option></select>'+
    '<span class="aide">'+(x.mode==="auto"
      ? 'Points = '+esc(E.reglages.ptsBase)+' + '+esc(E.reglages.ptsEtendue)+' &#215; (N &#8722; rang) &#247; (N &#8722; 1)'+
        (E.reglages.pointsEntiers ? ', arrondi au point.' : '.')
      : 'Vous fixez vous-même la valeur de chaque position.')+'</span></label>';

  if (x.mode === "manuel"){
    h += '<div class="etiq" style="margin-bottom:7px">Points par position</div><div class="grille-bareme">';
    for (var r=1; r<=bareme.length; r++){
      h += '<div><label for="bm-'+x.id+'-'+r+'">'+r+(r===1?"er":"e")+' place</label>'+
        '<input id="bm-'+x.id+'-'+r+'" type="number" step="any" value="'+esc(bareme[r-1])+'" '+
        'data-act="ep-bareme" data-ep="'+x.id+'" data-r="'+r+'" data-focus="bm-'+x.id+'-'+r+'"></div>';
    }
    h += '</div><div class="rangee" style="gap:8px;margin-top:10px;flex-wrap:wrap">'+
      '<button class="btn mini" data-act="bareme-auto" data-ep="'+x.id+'">Remplir depuis la formule</button>'+
      '<button class="btn mini" data-act="bareme-plus" data-ep="'+x.id+'">Ajouter une position</button>'+
      '<button class="btn mini" data-act="bareme-moins" data-ep="'+x.id+'">Retirer la dernière</button></div>'+
      '<div class="petit sourdine" style="margin-top:8px">Les flèches montent par point entier. Tapez 6,5 si vous voulez une demie.</div>';
  }
  h += '</div>';

  h += '<div class="carte"><div class="etiq" style="margin-bottom:9px">Pictogramme</div><div class="grille-icones">'+
    Object.keys(ICONES).map(function(k){
      return '<button class="puce-icone'+(x.icone===k && !x.image?' actif':'')+'" data-act="ep-icone" data-ep="'+x.id+
             '" data-i="'+k+'" aria-label="'+k+'">'+
             (APERCUS[k] ? '<img src="'+esc(APERCUS[k])+'" alt="" loading="lazy">' : svgIcone(k,22))+'</button>';
    }).join("")+'</div>'+
    '<div class="rangee" style="gap:10px;margin-top:14px;flex-wrap:wrap">'+
      '<label class="rangee" style="gap:9px;flex:0 0 auto"><span class="petit sourdine">Teinte</span>'+
      '<input type="color" value="'+esc(x.teinte)+'" data-act="ep-teinte" data-ep="'+x.id+'" aria-label="Teinte du jeu"></label>'+
      '<button class="btn mini" data-act="ep-image-choisir" data-ep="'+x.id+'">'+(x.image?'Remplacer l\'image':'Utiliser une image')+'</button>'+
      (x.image ? '<button class="btn mini lien" data-act="ep-image-vider" data-ep="'+x.id+'">Revenir au pictogramme</button>' : '')+
      '<input type="file" accept="image/*" data-act="ep-image" data-ep="'+x.id+'" id="img-'+x.id+'" hidden></div>'+
    '<div class="petit sourdine" style="margin-top:9px">L\'image est recadrée en carré de 128&nbsp;px et stockée dans ce navigateur. '+
    'Utilisez vos propres visuels : les jaquettes officielles sont protégées par le droit d\'auteur.</div></div>';

  h += '<div class="carte"><div class="rangee" style="gap:8px;flex-wrap:wrap">'+
    '<button class="btn mini" data-act="ep-monte" data-ep="'+x.id+'"'+(i===0?' disabled':'')+'>&#8593; Plus tôt</button>'+
    '<button class="btn mini" data-act="ep-descend" data-ep="'+x.id+'"'+(i===E.epreuves.length-1?' disabled':'')+'>&#8595; Plus tard</button>'+
    '<button class="btn mini danger pousse" data-act="ep-retire" data-ep="'+x.id+'">Supprimer ce jeu</button></div></div>';
  return h;
}

/* ---------- Vue : classement ---------- */
function vueClassement(){
  var h = '<div class="segments">'+
    '<button data-act="onglet-rang" data-v="soir" aria-pressed="'+(ongletRang==="soir")+'">Ce soir</button>'+
    '<button data-act="onglet-rang" data-v="ligue" aria-pressed="'+(ongletRang==="ligue")+'">La ligue</button></div>';
  return h + (ongletRang === "ligue" ? vueLigue() : vueCeSoir());
}

function vueCeSoir(){
  if (!E.joueurs.length){
    return '<div class="carte"><div class="vide-etat"><strong>Personne autour du feu.</strong>'+
      'Ajoutez les personnes présentes dans l\'onglet Joueurs, puis choisissez vos jeux.'+
      '<div style="margin-top:18px"><button class="btn primaire" data-act="exemple">Soirée d\'exemple</button></div></div></div>';
  }

  var aveugle = estAveugle();
  var h = "";

  if (aveugle){
    var reste = epreuvesRestantes();
    h += '<div class="scelle"><div class="sceau">&#9878;</div>'+
      '<strong>Classement scellé</strong>'+
      '<p>Il reste '+reste+' jeu'+(reste>1?'x':'')+'. Les points continuent d\'être comptés, mais personne ne voit '+
      'où il en est — ni sur les téléphones, ni sur le téléviseur. Le classement se révélera à la fin.</p>'+
      '<button class="btn primaire" data-act="reveler">Briser le sceau maintenant</button></div>';
  } else {
    var cl = classement();
    var tete = cl.length ? cl[0].total : 0;
    var mv = mouvements();
    var hc = horsCourse(cl);

    h += entete("Ce soir", "Qui <em>mène</em>.");
    if (mv) h += '<div class="carte mince petit sourdine" style="margin-bottom:9px">Les flèches montrent le mouvement provoqué par <strong style="color:var(--texte)">'+esc(mv.epreuve.nom)+'</strong>.</div>';

    h += cl.map(function(r,i){
      var largeur = tete > 0 ? Math.max(0,(r.total/tete)*100) : 0;
      var d = mv ? (mv.rangAvant[r.joueur.id] - (i+1)) : null;
      var ecart = i === 0 ? null : arrondir(tete - r.total);
      return '<div class="ligne-classement'+(i===0 && r.total>0?' tete':'')+(hc[r.joueur.id]?' horscourse':'')+'">'+
        '<div class="jauge" style="width:'+largeur+'%"></div>'+
        '<span class="place chiffre">'+(i+1)+'</span>'+ jeton(r.joueur.id)+
        '<span class="bloc-nom"><span class="nom">'+esc(r.joueur.nom)+'</span><span class="sous">'+ badgeDelta(d)+
          (ecart !== null && ecart > 0 ? '<span class="chiffre">&#8722;'+fmt(ecart)+' du meneur</span>' : '')+
          (r.departage ? '<span style="color:var(--laiton)">devance '+esc(r.departage.sur)+' '+esc(r.departage.long)+'</span>' : '')+
          (hc[r.joueur.id] ? '<span class="pastille horscourse">hors course</span>' : '')+
        '</span></span><span class="total">'+fmt(r.total)+'</span></div>';
    }).join("");

    var restePts = pointsRestants();
    if (restePts > 0 && E.epreuves.some(function(x){ return calculerEpreuve(x).classee; }))
      h += '<div class="petit sourdine" style="margin-top:5px">Il reste au maximum '+fmt(restePts)+' points à distribuer.</div>';
  }

  // Cercles d'équipe : ne révèlent aucun total, visibles même sous sceau.
  if (E.reglages.plafondActif && Number(E.reglages.plafondPartenaires) > 0){
    h += entete("Alliances", "Qui <em>suit</em> qui.");
    h += '<div class="carte mince petit sourdine" style="margin-bottom:10px">Chaque joueur peut faire équipe avec '+
      esc(E.reglages.plafondPartenaires)+' personne'+(E.reglages.plafondPartenaires>1?'s':'')+' au maximum ce soir'+
      (E.reglages.plafondBidirectionnel ? ' — porter quelqu\'un consomme un lien des deux côtés.' : '.')+'</div>';
    h += E.joueurs.slice().sort(function(a,b){ return a.nom.localeCompare(b.nom,"fr"); }).map(function(j){
      var p = partenairesDe(j.id);
      var libres = Math.max(0, Number(E.reglages.plafondPartenaires) - p.length);
      return '<div class="carte mince rangee" style="gap:10px">'+ jeton(j.id)+
        '<span style="font-weight:650;font-size:.89rem;min-width:78px">'+esc(j.nom)+'</span>'+
        '<span class="cercle pousse">'+
          p.map(function(x){ return '<span class="lien">'+jeton(x)+esc(nomDe(x))+'</span>'; }).join("")+
          new Array(libres+1).join('<span class="encoche"></span>')+
          (p.length===0 && libres===0 ? '<span class="petit sourdine">aucun lien</span>' : '')+
        '</span></div>';
    }).join("");
  }

  var fs = faitsSaillants();
  if (fs.length){
    h += entete("Les moments", "Ce qui <em>restera</em>.")+'<div class="faits">'+
      fs.map(function(f){
        return '<div class="fait '+f.ton+'"><span class="etiq">'+esc(f.etiq)+'</span>'+
          '<div class="v">'+esc(f.v)+'</div><div class="q">'+esc(f.q)+'</div><div class="d">'+esc(f.d)+'</div></div>';
      }).join("")+'</div>';
  }

  var jouees = E.epreuves.filter(function(x){ return calculerEpreuve(x).classee; });
  if (jouees.length && !aveugle){
    var cl2 = classement();
    h += entete("Le détail", "Jeu par <em>jeu</em>.");
    h += '<div class="defile"><table class="matrice"><thead><tr><th>Joueur</th>'+
      jouees.map(function(x){
        return '<th>'+esc(x.nom)+(Number(x.poids)!==1?' <span class="sourdine">&#215;'+esc(x.poids)+'</span>':'')+'</th>';
      }).join("")+'<th>Total</th></tr></thead><tbody>'+
      cl2.map(function(r){
        return '<tr><td>'+esc(r.joueur.nom)+'</td>'+
          jouees.map(function(x){
            var d = r.detail[x.id];
            if (!d || d.pts === null) return '<td class="val vide">&middot;</td>';
            var suit = d.role === "suit";
            return '<td class="val'+(suit?' herite':'')+'" title="'+(suit?'Hérité de '+esc(nomDe(d.porteur)):'')+'">'+
              (suit?'&#8627;':'')+fmt(d.pts)+'</td>';
          }).join("")+'<td class="val tot">'+fmt(r.total)+'</td></tr>';
      }).join("")+'</tbody></table></div>'+
      '<div class="petit sourdine" style="margin-top:8px">&#8627; = points hérités d\'un porteur.</div>';
  }

  h += '<div class="carte" style="margin-top:16px"><div class="rangee" style="gap:9px;flex-wrap:wrap">'+
    '<button class="btn primaire" data-act="recap">Récapitulatif partageable</button>'+
    '<button class="btn" data-act="archiver">Clore et archiver la soirée</button></div>'+
    '<div class="petit sourdine" style="margin-top:9px">L\'archivage verse le classement dans la ligue, '+
    'puis efface les résultats en gardant les joueurs et les jeux pour la prochaine fois.</div></div>';
  return h;
}

function vueLigue(){
  var arch = lireArchives();
  var L = ligue(true);
  if (!L.length){
    return '<div class="carte"><div class="vide-etat"><strong>Aucune soirée archivée.</strong>'+
      'Archivez une première soirée depuis l\'onglet « Ce soir » et le cumul démarrera ici.</div></div>';
  }
  var tete = L[0].total;
  var h = entete("La ligue", "Le cumul des <em>soirées</em>.");
  h += '<div class="carte mince petit sourdine" style="margin-bottom:10px">'+
    arch.length+' soirée'+(arch.length>1?'s':'')+' archivée'+(arch.length>1?'s':'')+
    ', plus celle en cours. Le cumul se fait par nom : gardez les mêmes orthographes d\'une fois à l\'autre.</div>';

  h += L.map(function(r,i){
    var largeur = tete > 0 ? Math.max(0,(r.total/tete)*100) : 0;
    return '<div class="ligne-classement'+(i===0?' tete':'')+'">'+
      '<div class="jauge" style="width:'+largeur+'%"></div>'+
      '<span class="place chiffre">'+(i+1)+'</span>'+
      '<span class="bloc-nom"><span class="nom">'+esc(r.nom)+'</span><span class="sous">'+
        '<span class="chiffre">'+r.soirees+' soirée'+(r.soirees>1?'s':'')+'</span>'+
        (r.victoires ? '<span class="chiffre" style="color:var(--laiton)">'+r.victoires+' victoire'+(r.victoires>1?'s':'')+'</span>' : '')+
        (r.podiums ? '<span class="chiffre">'+r.podiums+' podium'+(r.podiums>1?'s':'')+'</span>' : '')+
      '</span></span><span class="total">'+fmt(r.total)+'</span></div>';
  }).join("");

  if (arch.length){
    h += entete("Les archives", "Ce qu'on a <em>déjà</em> joué.");
    h += arch.map(function(s){
      return '<div class="carte mince rangee" style="gap:10px">'+
        '<div style="flex:1;min-width:0"><div style="font-weight:650;font-size:.9rem">'+esc(s.nom)+'</div>'+
        '<div class="petit sourdine">'+esc(s.date)+' &middot; '+s.nbJeux+' jeu'+(s.nbJeux>1?'x':'')+
        ' &middot; vainqueur : '+esc(s.classement[0] ? s.classement[0].nom : "—")+'</div></div>'+
        '<button class="btn mini danger" data-act="archive-retire" data-a="'+s.id+'">Retirer</button></div>';
    }).join("");
  }
  return h;
}

/* ---------- Vue : déroulement ---------- */
function vueDeroulement(){
  if (!E.epreuves.length)
    return '<div class="carte"><div class="vide-etat"><strong>Rien au programme.</strong>'+
      'Choisissez vos jeux dans l\'onglet Jeux. Chacun devient une manche notée séparément.</div></div>';
  return E.epreuves.map(carteJeu).join("");
}

function carteJeu(x){
  var res = calculerEpreuve(x);
  var nbM = (x.manches||[]).length;

  var h = '<div class="carte" id="jeu-'+x.id+'"><div class="rangee" style="margin-bottom:12px;gap:11px">'+
    blason(x, 20, 'mini')+
    '<div style="flex:1;min-width:0"><div style="font-weight:700">'+esc(x.nom)+'</div>'+
    '<div class="petit sourdine">'+(x.mode==="manuel"?"Barème manuel":"Barème automatique")+
      (Number(x.poids)!==1?" &middot; poids &#215;"+esc(x.poids):"")+
      (nbM>1 ? " &middot; "+(x.cumul==="moyenne"?"moyenne":"somme")+" de "+nbM+" manches" : "")+
      (E.reglages.chronoActif && x.debutA ? ' &middot; <span data-chrono="'+x.id+'">'+chronoTexte(x)+'</span>' : '')+
    '</div></div>'+
    '<span class="pastille etat '+x.statut+'">'+LIB_STATUT[x.statut]+'</span></div>';

  if (x.statut === "a_venir"){
    return h + '<p class="petit sourdine" style="margin:0 0 13px">Personne n\'a encore choisi son camp. '+
      'Ouvrez les déclarations quand le groupe est prêt.</p>'+
      '<button class="btn primaire" data-act="statut" data-ep="'+x.id+'" data-val="declarations">Ouvrir les déclarations</button></div>';
  }

  if (x.statut === "declarations"){
    h += '<div class="avis">Les affiliations et les paris se déclarent <strong>maintenant</strong>, avant que la partie commence. '+
         'Une fois le jeu lancé, tout est figé.</div>';
    h += '<div class="pile">' + E.joueurs.map(function(j){ return carteDeclaration(x, j); }).join("") + '</div>';
    var sans = E.joueurs.filter(function(j){ return roleDans(x, j.id) === "absent" && !x.paris[j.id]; });
    if (sans.length && E.reglages.affiliationObligatoire)
      h += '<div class="avis grave" style="margin-top:13px">Sans camp ni pari : '+
           sans.map(function(j){ return esc(j.nom); }).join(", ")+'. Ces joueurs marqueront 0 pour ce jeu.</div>';
    return h + '<div class="rangee" style="gap:9px;margin-top:14px;flex-wrap:wrap">'+
      '<button class="btn primaire" data-act="lancer" data-ep="'+x.id+'"'+(x.participants.length<1?' disabled':'')+'>Verrouiller et lancer</button>'+
      '<button class="btn lien" data-act="statut" data-ep="'+x.id+'" data-val="a_venir">Rouvrir la préparation</button></div></div>';
  }

  // Manches
  var iM = indexManche(x);
  var m = x.manches[iM];
  if (nbM > 1 || x.statut === "en_jeu"){
    h += '<div class="manches">' + x.manches.map(function(mm, k){
      return '<button class="manche" data-act="manche" data-ep="'+x.id+'" data-k="'+k+'" aria-pressed="'+(k===iM)+'">'+
        'Manche '+(k+1)+(mancheClassee(mm)?' <span class="ok">&#10003;</span>':'')+'</button>';
    }).join("") +
    (x.statut === "en_jeu"
      ? '<button class="manche ajout" data-act="manche-plus" data-ep="'+x.id+'">+ Manche</button>'+
        (nbM>1 ? '<button class="manche ajout" data-act="manche-moins" data-ep="'+x.id+'" data-k="'+iM+'">&#8722; Retirer</button>' : '')
      : '') + '</div>';
  }

  var parts = x.participants.slice().sort(function(a,b){
    var ra = m.rangs[a]||99, rb = m.rangs[b]||99;
    return ra - rb || nomDe(a).localeCompare(nomDe(b),"fr");
  });
  var N = parts.filter(function(p){ return m.rangs[p] > 0; }).length;

  h += '<div class="etiq" style="margin-bottom:8px">Ordre d\'arrivée &#8212; manche '+(iM+1)+' &#8212; touchez dans l\'ordre</div>';
  h += '<div class="pile">' + parts.map(function(p){
    var rang = m.rangs[p] || 0;
    var pts = res.parJoueur[p];
    var opts = ['<option value="0"'+(rang?"":" selected")+'>&#8212;</option>'];
    for (var r=1; r<=parts.length; r++) opts.push('<option value="'+r+'"'+(rang===r?" selected":"")+'>'+r+'</option>');
    return '<div class="rangee" style="gap:8px">'+
      '<button class="tuile-rang'+(rang?' classe':'')+'" data-act="rang-suivant" data-ep="'+x.id+'" data-j="'+p+'">'+
        '<span class="badge-rang'+(rang?'':' creux')+'">'+(rang||"&#8212;")+'</span>'+ jeton(p)+
        '<span class="nom">'+esc(nomDe(p))+'</span>'+
        (pts && pts.pts!==null ? '<span class="chiffre" style="color:var(--laiton);font-weight:700">'+fmt(pts.pts)+'</span>':'')+
      '</button>'+
      '<select style="width:74px;flex:0 0 auto" data-act="rang-select" data-ep="'+x.id+'" data-j="'+p+'" '+
      'aria-label="Rang de '+esc(nomDe(p))+'">'+opts.join("")+'</select></div>';
  }).join("") + '</div>';

  var suiveurs = Object.keys(x.affiliations);
  if (suiveurs.length){
    h += '<div class="etiq" style="margin:15px 0 8px">Affiliations verrouillées</div><div class="pile">'+
      suiveurs.map(function(a){
        var pts = res.parJoueur[a];
        return '<div class="tuile-suiveur">'+jeton(a)+
          '<span style="flex:1;min-width:0;font-weight:600;font-size:.9rem">'+esc(nomDe(a))+
          ' <span class="sourdine">suit</span> '+esc(nomDe(x.affiliations[a]))+'</span>'+
          (pts && pts.pts!==null ? '<span class="chiffre" style="color:var(--pervenche);font-weight:700">'+fmt(pts.pts)+'</span>':'')+
        '</div>';
      }).join("")+'</div>';
  }

  var parieurs = Object.keys(x.paris || {});
  if (parieurs.length && E.reglages.parisActifs){
    h += '<div class="etiq" style="margin:15px 0 8px">Paris de salon</div><div class="pile">'+
      parieurs.map(function(a){
        var v = res.parJoueur[a];
        var etat = !res.classee ? '' :
          (v && v.pariGagne ? '<span class="pastille jeu">gagné +'+fmt(v.gainPari)+'</span>' : '<span class="pastille absent">perdu</span>');
        return '<div class="tuile-suiveur paris">'+jeton(a)+
          '<span style="flex:1;min-width:0;font-weight:600;font-size:.9rem">'+esc(nomDe(a))+
          ' <span class="sourdine">mise sur</span> '+esc(nomDe(x.paris[a]))+'</span>'+etat+'</div>';
      }).join("")+'</div>';
  }

  h += '<div class="petit sourdine" style="margin-top:11px">'+N+' joueur'+(N>1?'s':'')+' classé'+(N>1?'s':'')+
       ' sur '+parts.length+' dans cette manche. Les égalités sont permises : donnez le même rang à deux joueurs.</div>';
  h += '<div class="rangee" style="gap:9px;margin-top:13px;flex-wrap:wrap">';
  h += x.statut === "en_jeu"
    ? '<button class="btn primaire" data-act="statut" data-ep="'+x.id+'" data-val="terminee"'+(res.classee?'':' disabled')+'>Clôturer le jeu</button>'
    : '<button class="btn" data-act="statut" data-ep="'+x.id+'" data-val="en_jeu">Corriger les résultats</button>';
  h += '<button class="btn lien" data-act="manche-vider" data-ep="'+x.id+'" data-k="'+iM+'">Effacer cette manche</button>'+
       '<button class="btn lien" data-act="deverrouiller" data-ep="'+x.id+'">Rouvrir les déclarations</button></div>';
  return h + '</div>';
}

function carteDeclaration(x, j){
  var role = roleDans(x, j.id);
  var pari = x.paris[j.id];
  var ouvertPorteur = panneauOuvert && panneauOuvert.type==="porteur" && panneauOuvert.ep===x.id && panneauOuvert.j===j.id;
  var ouvertPari    = panneauOuvert && panneauOuvert.type==="pari"    && panneauOuvert.ep===x.id && panneauOuvert.j===j.id;

  var etat;
  if (role === "suit") etat = '<span class="pastille suit">suit '+esc(nomDe(x.affiliations[j.id]))+'</span>';
  else if (role === "joue"){
    var n = 0;
    Object.keys(x.affiliations).forEach(function(k){ if (x.affiliations[k] === j.id) n++; });
    var cap = (E.reglages.capaciteActive && Number(E.reglages.capaciteAffilies) > 0) ? Number(E.reglages.capaciteAffilies) : null;
    etat = '<span class="pastille jeu">joue'+(n?' &middot; porte '+n+(cap?'/'+cap:''):'')+'</span>';
  } else etat = '<span class="pastille absent">sans camp</span>';
  if (pari && E.reglages.parisActifs) etat += ' <span class="pastille parie">mise sur '+esc(nomDe(pari))+'</span>';

  var h = '<div class="carte-joueur '+(role==="joue"?"joue":(role==="suit"?"suit":""))+'">'+
    '<div class="rangee" style="gap:10px;margin-bottom:10px;flex-wrap:wrap">'+ jeton(j.id)+
    '<span style="font-weight:700;font-size:.93rem;flex:1;min-width:0">'+esc(j.nom)+'</span>'+etat+'</div>';

  h += '<div class="trio">'+
    '<button class="'+(role==="joue"?"on-joue":"")+'" data-act="declare-joue" data-ep="'+x.id+'" data-j="'+j.id+'">Joue</button>'+
    '<button class="'+(role==="suit"||ouvertPorteur?"on-suit":"")+'" data-act="ouvrir-porteur" data-ep="'+x.id+'" data-j="'+j.id+'">'+
      (role==="suit"?"Suit &#9662;":"Suit")+'</button>'+
    (E.reglages.parisActifs
      ? '<button class="'+(pari||ouvertPari?"on-parie":"")+'" data-act="ouvrir-pari" data-ep="'+x.id+'" data-j="'+j.id+'">'+
        (pari?"Parie &#9662;":"Parie")+'</button>'
      : '<button disabled>Parie</button>')+
    '</div>';

  if (role !== "absent" || pari)
    h += '<div style="margin-top:9px"><button class="btn lien" data-act="declare-vide" data-ep="'+x.id+'" data-j="'+j.id+'">Effacer ses choix</button></div>';

  if (ouvertPorteur){
    var porteurs = porteursPossibles(x, j.id);
    h += '<div class="choix-liste">';
    if (!porteurs.length){
      h += '<span class="petit sourdine">Personne ne joue encore ce jeu. Inscrivez d\'abord un participant.</span>'+
           '<button class="puce-choix puce-annule" data-act="fermer-panneau">Fermer</button>';
    } else {
      h += porteurs.map(function(p){
        var actuel = x.affiliations[j.id] === p.id;
        var bloque = p.blocage && !actuel;
        return '<button class="puce-choix'+(actuel?' actuel':'')+(bloque?' bloque':'')+'" '+
          'data-act="'+(bloque?'porteur-refus':'choisir-porteur')+'" data-ep="'+x.id+'" data-j="'+j.id+'" data-p="'+p.id+'"'+
          (bloque?' title="'+esc(p.blocage.texte)+'"':'')+'>'+ jeton(p.id)+esc(p.nom)+
          (bloque ? '<span class="motif">'+esc(p.blocage.court)+'</span>' : '')+'</button>';
      }).join("") + '<button class="puce-choix puce-annule" data-act="fermer-panneau">Annuler</button>';
    }
    h += '</div>';
    if (motifRefus && motifRefus.ep === x.id && motifRefus.j === j.id)
      h += '<div class="petit" style="color:var(--alerte);margin-top:9px">'+esc(motifRefus.texte)+'</div>';
  }

  if (ouvertPari){
    var mises = misesPossibles(x, j.id);
    h += '<div class="choix-liste paris">';
    if (!mises.length){
      h += '<span class="petit sourdine">Personne ne joue encore ce jeu. Inscrivez d\'abord un participant.</span>'+
           '<button class="puce-choix puce-annule" data-act="fermer-panneau">Fermer</button>';
    } else {
      h += '<span class="petit sourdine" style="width:100%;margin-bottom:2px">Qui va gagner ce jeu ? '+
           'Bon pronostic = +'+fmt(E.reglages.gainPari)+' points.</span>';
      h += mises.map(function(p){
        return '<button class="puce-choix'+(x.paris[j.id]===p.id?' actuel':'')+'" data-act="choisir-pari" '+
          'data-ep="'+x.id+'" data-j="'+j.id+'" data-p="'+p.id+'">'+ jeton(p.id)+esc(p.nom)+'</button>';
      }).join("") +
      (x.paris[j.id] ? '<button class="puce-choix puce-annule" data-act="annuler-pari" data-ep="'+x.id+'" data-j="'+j.id+'">Retirer la mise</button>' : '')+
      '<button class="puce-choix puce-annule" data-act="fermer-panneau">Annuler</button>';
    }
    h += '</div>';
  }
  return h + '</div>';
}

function chronoTexte(x){
  if (!x.debutA) return "";
  var fin = x.finA || Date.now();
  return dureeTexte(fin - x.debutA) + (x.finA ? "" : " en cours");
}

/* ---------- Vue : joueurs ---------- */
function vueJoueurs(){
  var h = entete("Autour de la table", "Qui est <em>là</em>.");
  h += '<div class="carte"><div class="rangee" style="gap:9px">'+
    '<input type="text" id="nouveau-joueur" data-focus="nouveau-joueur" placeholder="Nom du joueur" autocomplete="off">'+
    '<button class="btn primaire" data-act="joueur-ajoute" style="flex:0 0 auto">Ajouter</button></div></div>';
  if (!E.joueurs.length)
    return h + '<div class="carte"><div class="vide-etat"><strong>Personne autour du feu.</strong>Ajoutez au moins deux personnes pour commencer.'+
      '<div style="margin-top:18px"><button class="btn" data-act="exemple">Soirée d\'exemple</button></div></div></div>';
  return h + E.joueurs.map(function(j){
    return '<div class="carte mince rangee" style="gap:10px">'+
      '<input type="color" value="'+esc(j.couleur)+'" data-act="joueur-couleur" data-j="'+j.id+'" aria-label="Couleur de '+esc(j.nom)+'">'+
      '<input type="text" value="'+esc(j.nom)+'" data-act="joueur-nom" data-j="'+j.id+'" data-focus="jn-'+j.id+'" aria-label="Nom">'+
      '<button class="btn mini danger" data-act="joueur-retire" data-j="'+j.id+'" style="flex:0 0 auto">Retirer</button></div>';
  }).join("");
}

/* ---------- Vue : réglages ---------- */
function vueReglages(){
  var R = E.reglages;
  var h = entete("Réglages", "Comment ça <em>compte</em>.",
    "Quinze paramètres, tous facultatifs. Les valeurs par défaut font une soirée amicale équilibrée.");
  h += '<div class="carte"><label class="champ"><span class="nom">Nom du tournoi</span>'+
    '<input type="text" value="'+esc(E.nom)+'" data-act="r-nom" data-focus="r-nom"></label></div>';

  h += '<h2 class="titre">Barème automatique</h2><div class="carte">'+
    '<div class="avis info">Points d\'un jeu = <strong>base + étendue &#215; (N &#8722; rang) &#247; (N &#8722; 1)</strong>, '+
    'où N est le nombre de participants réels. Le premier touche toujours le maximum, le dernier toujours la base. '+
    'Un jeu à trois joueurs ne rapporte donc pas plus facilement qu\'un jeu à huit.</div>'+
    '<div class="duo">'+
      '<label class="champ"><span class="nom">Prime de participation (base)</span>'+
      '<input type="number" step="any" value="'+esc(R.ptsBase)+'" data-act="r-num" data-k="ptsBase" data-focus="r-ptsBase">'+
      '<span class="aide">Ce que touche le dernier classé.</span></label>'+
      '<label class="champ"><span class="nom">Étendue</span>'+
      '<input type="number" step="any" value="'+esc(R.ptsEtendue)+'" data-act="r-num" data-k="ptsEtendue" data-focus="r-ptsEtendue">'+
      '<span class="aide">Écart entre le dernier et le premier. Maximum = '+esc(Number(R.ptsBase)+Number(R.ptsEtendue))+'.</span></label></div>'+
    '<label class="bascule"><input type="checkbox" data-act="r-bool" data-k="pointsEntiers"'+(R.pointsEntiers?' checked':'')+'>'+
    '<span><strong>Arrondir aux points entiers</strong><br><span class="petit sourdine">Recommandé. '+
    'Sans arrondi, six participants donnent 10 / 8,4 / 6,8 / 5,2 / 3,6 / 2 &#8212; illisible sur un téléviseur.</span></span></label>'+
    '<label class="champ"><span class="nom">Décimales affichées</span>'+
    '<input type="number" min="0" max="3" step="1" value="'+esc(R.decimales)+'" data-act="r-num" data-k="decimales" data-focus="r-decimales">'+
    '<span class="aide">Passez à 1 si vous baissez le taux d\'héritage sous 100 %.</span></label></div>';

  h += '<h2 class="titre">Affiliation</h2><div class="carte">'+
    '<label class="champ"><span class="nom">Taux d\'héritage (%)</span>'+
    '<input type="number" min="0" max="200" step="5" value="'+esc(R.tauxHeritage)+'" data-act="r-num" data-k="tauxHeritage" data-focus="r-tauxHeritage">'+
    '<span class="aide">Part des points du porteur que reçoit l\'affilié. À 100 %, suivre quelqu\'un rapporte autant que de jouer soi-même '+
    '&#8212; c\'est la capacité d\'accueil qui devient le seul frein.</span></label>'+
    '<label class="champ"><span class="nom">Bonus au porteur</span>'+
    '<input type="number" step="any" value="'+esc(R.bonusPorteur)+'" data-act="r-num" data-k="bonusPorteur" data-focus="r-bonusPorteur">'+
    '<span class="aide">Points accordés au porteur pour chaque affilié accueilli.</span></label><hr class="sep">'+
    '<label class="bascule"><input type="checkbox" data-act="r-bool" data-k="capaciteActive"'+(R.capaciteActive?' checked':'')+'>'+
    '<span><strong>Limiter le nombre d\'affiliés par porteur</strong><br><span class="petit sourdine">'+
    'Empêche tout le monde de se ranger derrière le meilleur joueur d\'un jeu.</span></span></label>'+
    (R.capaciteActive ? '<label class="champ"><span class="nom">Affiliés maximum par porteur, par jeu</span>'+
      '<input type="number" min="0" step="1" value="'+esc(R.capaciteAffilies)+'" data-act="r-num" data-k="capaciteAffilies" data-focus="r-capaciteAffilies">'+
      '<span class="aide">0 = illimité.</span></label>' : '')+'<hr class="sep">'+
    '<label class="bascule"><input type="checkbox" data-act="r-bool" data-k="plafondActif"'+(R.plafondActif?' checked':'')+'>'+
    '<span><strong>Plafonner le cercle d\'équipe</strong><br><span class="petit sourdine">'+
    'Limite le nombre de personnes distinctes avec qui on peut faire équipe dans la soirée. Force les noyaux à se former.</span></span></label>'+
    (R.plafondActif ? '<label class="champ"><span class="nom">Coéquipiers distincts maximum</span>'+
      '<input type="number" min="0" step="1" value="'+esc(R.plafondPartenaires)+'" data-act="r-num" data-k="plafondPartenaires" data-focus="r-plafondPartenaires">'+
      '<span class="aide">0 = illimité.</span></label>'+
      '<label class="bascule"><input type="checkbox" data-act="r-bool" data-k="plafondBidirectionnel"'+(R.plafondBidirectionnel?' checked':'')+'>'+
      '<span><strong>Compter les liens dans les deux sens</strong><br><span class="petit sourdine">'+
      'Activé : porter quelqu\'un consomme un lien chez le porteur aussi.</span></span></label>' : '')+'<hr class="sep">'+
    '<label class="bascule"><input type="checkbox" data-act="r-bool" data-k="affiliationObligatoire"'+(R.affiliationObligatoire?' checked':'')+'>'+
    '<span><strong>Signaler les joueurs sans camp</strong><br><span class="petit sourdine">'+
    'Avertit avant de lancer si quelqu\'un ne joue, ne suit ni ne parie.</span></span></label></div>';

  h += '<h2 class="titre">Départage</h2><div class="carte">'+
    '<div class="avis">En cas d\'égalité de points, l\'ordre se décide dans cet ordre : '+
    '<strong>jeux gagnés</strong>, puis <strong>meilleure manche</strong>, puis <strong>nombre de jeux disputés</strong>. '+
    'Le motif s\'affiche à côté du joueur, pour que personne ne croie à un tri au hasard. '+
    'Si tout est identique, l\'application le dit franchement plutôt que de trancher en silence.</div></div>';

  h += '<h2 class="titre">Paris de salon</h2><div class="carte">'+
    '<label class="bascule"><input type="checkbox" data-act="r-bool" data-k="parisActifs"'+(R.parisActifs?' checked':'')+'>'+
    '<span><strong>Activer les paris</strong><br><span class="petit sourdine">'+
    'Avant chaque jeu, n\'importe qui peut miser sur le vainqueur &#8212; y compris un joueur qui participe, tant qu\'il ne mise pas sur lui-même. '+
    'Ça donne quelque chose à faire aux spectateurs.</span></span></label>'+
    (R.parisActifs ? '<label class="champ"><span class="nom">Points d\'un bon pronostic</span>'+
      '<input type="number" step="any" min="0" value="'+esc(R.gainPari)+'" data-act="r-num" data-k="gainPari" data-focus="r-gainPari">'+
      '<span class="aide">Versés tels quels, sans pondération par le poids du jeu.</span></label>' : '')+'</div>';

  h += '<h2 class="titre">Suspense</h2><div class="carte">'+
    '<label class="bascule"><input type="checkbox" data-act="r-bool" data-k="aveugleActif"'+(R.aveugleActif?' checked':'')+'>'+
    '<span><strong>Sceller le classement en fin de soirée</strong><br><span class="petit sourdine">'+
    'Les points continuent d\'être comptés, mais le classement général disparaît des écrans jusqu\'à la révélation.</span></span></label>'+
    (R.aveugleActif ? '<label class="champ"><span class="nom">Sceller pendant les derniers jeux</span>'+
      '<input type="number" min="1" max="9" step="1" value="'+esc(R.aveugleDernieres)+'" data-act="r-num" data-k="aveugleDernieres" data-focus="r-aveugleDernieres">'+
      '<span class="aide">Le sceau s\'active quand il ne reste plus que ce nombre de jeux.</span></label>' : '')+
    (E.aveugleLeve ? '<div class="petit sourdine">Le sceau a été brisé pour cette soirée. '+
      '<button class="btn lien" data-act="resceller">Le remettre</button></div>' : '')+'</div>';

  h += '<h2 class="titre">Chronomètre</h2><div class="carte">'+
    '<label class="bascule"><input type="checkbox" data-act="r-bool" data-k="chronoActif"'+(R.chronoActif?' checked':'')+'>'+
    '<span><strong>Mesurer la durée de chaque jeu</strong><br><span class="petit sourdine">'+
    'Optionnel. Démarre au lancement, s\'arrête à la clôture. Sert surtout à corriger les poids d\'une soirée à l\'autre.</span></span></label></div>';

  h += '<h2 class="titre">Données</h2><div class="carte">'+
    '<p class="petit sourdine" style="margin-top:0">'+(Stockage.dispo
      ? 'Tout est enregistré dans ce navigateur au fil de la saisie. Exportez avant de changer d\'appareil.'
      : 'La sauvegarde locale est bloquée ici. Exportez régulièrement, ou téléchargez ce fichier et ouvrez-le directement.')+'</p>'+
    '<div class="rangee" style="gap:9px;flex-wrap:wrap">'+
      '<button class="btn" data-act="exporte">Exporter en JSON</button>'+
      '<button class="btn" data-act="importe">Importer un fichier</button>'+
      '<button class="btn danger pousse" data-act="reinit">Tout effacer</button></div>'+
    '<input type="file" id="fichier-import" accept="application/json,.json" hidden></div>';

  return h + '<div class="petit sourdine" style="text-align:center;padding:10px 0 20px">'+
    'Tourneo &middot; fonctionne hors ligne, aucune donnée ne quitte l\'appareil.</div>';
}
