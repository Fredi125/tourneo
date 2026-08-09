/* ==========================================================================
   11. AFFICHAGE TV
   ========================================================================== */
var DUREE_PANNEAU = 13000;
var iPanneau = 0, tvPause = false, minuterieTV = null;

function panneauxDisponibles(){
  var p = [{ id:"classement", lib: estAveugle() ? "Classement scellé" : "Classement général" }];
  var v = epreuveVedette();
  if (v) p.push({ id:"derniere", lib:v.nom, ep:v });
  if (E.epreuves.length) p.push({ id:"jeux", lib:"Le tableau des jeux" });
  if (Object.keys(pairesAlliance()).length) p.push({ id:"alliances", lib:"Le réseau d'alliances" });
  if (faitsSaillants().length) p.push({ id:"saillants", lib:"Faits saillants" });
  return p;
}

function rendreTV(){
  var dispo = panneauxDisponibles();
  if (iPanneau >= dispo.length) iPanneau = 0;
  var p = dispo[iPanneau] || dispo[0];
  var corps = document.getElementById("tv-corps");

  var finies = E.epreuves.length - epreuvesRestantes();
  var aVenir = null;
  E.epreuves.forEach(function(e){ if (!aVenir && e.statut === "declarations") aVenir = e; });
  if (!aVenir) E.epreuves.forEach(function(e){ if (!aVenir && e.statut === "a_venir") aVenir = e; });

  document.getElementById("tv-titre").textContent = p ? p.lib : (E.nom || "Classement");
  document.getElementById("tv-sous").textContent =
    (E.nom ? E.nom.toUpperCase() + " · " : "") + finies + " / " + E.epreuves.length + " jeux" +
    (aVenir ? " · à suivre : " + aVenir.nom : "");
  document.getElementById("tv-points").innerHTML =
    dispo.map(function(x,i){ return '<span class="'+(i===iPanneau?'on':'')+'"></span>'; }).join("");

  var avant = {};
  Array.prototype.forEach.call(corps.querySelectorAll("[data-jid]"), function(el){
    avant[el.getAttribute("data-jid")] = el.getBoundingClientRect().top;
  });

  if (!p) corps.innerHTML = '<div class="tv-vide">Ajoutez des joueurs pour lancer le classement.</div>';
  else if (p.id === "classement") corps.innerHTML = tvClassement();
  else if (p.id === "derniere")   corps.innerHTML = tvDerniere(p.ep);
  else if (p.id === "jeux")       corps.innerHTML = tvJeux();
  else if (p.id === "alliances")  corps.innerHTML = tvAlliances();
  else                            corps.innerHTML = tvSaillants();

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches && corps.querySelector("[data-jid]")){
    Array.prototype.forEach.call(corps.querySelectorAll("[data-jid]"), function(el){
      var a = avant[el.getAttribute("data-jid")];
      if (a === undefined) return;
      var d = a - el.getBoundingClientRect().top;
      if (Math.abs(d) < 2 || !el.animate) return;
      el.animate([{ transform:"translateY("+d+"px)" }, { transform:"translateY(0)" }],
                 { duration:560, easing:"cubic-bezier(.2,.7,.3,1)" });
    });
  }
  relancerProgres();
}

function tvClassement(){
  if (estAveugle()){
    var reste = epreuvesRestantes();
    return '<div class="tv-vide"><div><div class="sceau">&#9878;</div><b>Classement scellé</b>'+
      'Il reste '+reste+' jeu'+(reste>1?'x':'')+'. Les points s\'accumulent en silence.</div></div>';
  }
  var cl = classement();
  if (!cl.length) return '<div class="tv-vide">Ajoutez des joueurs pour lancer le classement.</div>';
  var tete = cl[0].total, mv = mouvements(), hc = horsCourse(cl);
  return '<div class="tv-grille">' + cl.slice(0,12).map(function(r,i){
    var largeur = tete > 0 ? Math.max(0,(r.total/tete)*100) : 0;
    var d = mv ? (mv.rangAvant[r.joueur.id] - (i+1)) : null;
    var ecart = r.departage ? '<span style="color:var(--laiton)">= '+esc(r.departage.court)+'</span>'
             : (i === 0 ? "" : "&#8722;" + fmt(arrondir(tete - r.total)));
    return '<div class="tv-l'+(i===0 && r.total>0?' tete':'')+(hc[r.joueur.id]?' horscourse':'')+'" data-jid="'+r.joueur.id+'">'+
      '<div class="jauge" style="width:'+largeur+'%"></div>'+
      '<span class="place">'+(i+1)+'</span>'+ badgeDelta(d) + jeton(r.joueur.id, true)+
      '<span class="nom">'+esc(r.joueur.nom)+'</span><span class="ecart">'+ecart+'</span>'+
      '<span class="total">'+fmt(r.total)+'</span></div>';
  }).join("") + '</div>';
}

function tvDerniere(x){
  var r = calculerEpreuve(x);
  var liste = Object.keys(r.parJoueur)
    .filter(function(k){ return r.parJoueur[k].pts !== null; })
    .sort(function(a,b){ return r.parJoueur[b].pts - r.parJoueur[a].pts; });
  if (!liste.length) return '<div class="tv-vide">Résultats à venir.</div>';
  return '<div class="tv-liste">' + liste.slice(0,12).map(function(jid, i){
    var v = r.parJoueur[jid];
    var cls = v.role === "suit" ? " suit" : (v.role === "parie" ? " parie" : "");
    var marque = v.role === "suit" ? "&#8627;" : (v.role === "parie" ? "&#9733;" : String(i+1));
    var note = "";
    if (v.role === "suit") note = ' <span class="sourdine" style="font-weight:400">a suivi '+esc(nomDe(v.porteur))+'</span>';
    else if (v.role === "parie") note = ' <span class="sourdine" style="font-weight:400">pronostic gagnant</span>';
    else if (v.gainPari) note = ' <span class="sourdine" style="font-weight:400">+'+fmt(v.gainPari)+' pronostic</span>';
    else if (v.bonus) note = ' <span class="sourdine" style="font-weight:400">+'+fmt(v.bonus)+' porteur</span>';
    return '<div class="tv-r'+cls+'" data-jid="d-'+jid+'"><span class="rg">'+marque+'</span>'+ jeton(jid, true)+
      '<span class="nm">'+esc(nomDe(jid))+note+'</span><span class="pt">'+fmt(v.pts)+'</span></div>';
  }).join("") + '</div>';
}

function tvJeux(){
  if (!E.epreuves.length) return '<div class="tv-vide">Aucun jeu au programme.</div>';
  return '<div class="tv-jeux">' + E.epreuves.map(function(x){
    var p = podium(x, 3);
    var c = '<div class="tv-jeu"><div class="en">'+ blason(x, 22, 'mini')+
      '<span class="nm">'+esc(x.nom)+'</span>'+
      (Number(x.poids)!==1 ? '<span class="creux">&#215;'+esc(x.poids)+'</span>' : '')+'</div>';
    if (p.length){
      c += p.map(function(o,i){
        return '<span class="pl'+(o.v.role==="suit"?" suit":"")+'"><span class="n">'+(i+1)+'</span>'+
          '<span class="q">'+esc(nomDe(o.jid))+(o.v.role==="suit"?' &#8627;':'')+'</span></span>';
      }).join("");
    } else c += '<span class="creux">'+LIB_STATUT[x.statut]+'</span>';
    return c + '</div>';
  }).join("") + '</div>';
}

/* Chaque joueur sur un cercle, une corde par équipe formée.
   L'épaisseur dit combien de fois le duo a joué ensemble. */
function tvAlliances(){
  var js = E.joueurs, n = js.length;
  if (n < 2) return '<div class="tv-vide">Il faut au moins deux joueurs.</div>';
  var paires = pairesAlliance(), cles = Object.keys(paires);
  if (!cles.length) return '<div class="tv-vide">Aucune équipe formée pour l\'instant.</div>';

  var W = 1000, H = 600, cx = 500, cy = 300, R = 200, pos = {};
  js.forEach(function(j,i){
    var a = -Math.PI/2 + i*2*Math.PI/n;
    pos[j.id] = { x: cx + R*Math.cos(a), y: cy + R*Math.sin(a), a:a };
  });
  var maxN = Math.max.apply(null, cles.map(function(k){ return paires[k]; }));
  var s = '<svg class="tv-svg" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Réseau des alliances">';

  cles.forEach(function(k){
    var duo = k.split("|"), a = duo[0], b = duo[1], cnt = paires[k];
    if (!pos[a] || !pos[b]) return;
    s += '<path d="M'+pos[a].x.toFixed(1)+' '+pos[a].y.toFixed(1)+' Q'+cx+' '+cy+' '+
         pos[b].x.toFixed(1)+' '+pos[b].y.toFixed(1)+'" fill="none" stroke="'+jetonCSS("--color-cool","#84B4EA")+'" stroke-width="'+
         (3 + (cnt/maxN)*11).toFixed(1)+'" stroke-linecap="round" opacity="'+(0.3 + 0.5*cnt/maxN).toFixed(2)+'"/>';
  });
  js.forEach(function(j){
    var p = pos[j.id];
    var liens = partenairesDe(j.id).length;
    var lx = cx + (p.x-cx)*1.17, ly = cy + (p.y-cy)*1.17;
    var cosA = Math.cos(p.a);
    var anc = cosA > 0.3 ? "start" : (cosA < -0.3 ? "end" : "middle");
    s += '<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="21" fill="'+esc(j.couleur)+'"/>'+
      '<text x="'+p.x.toFixed(1)+'" y="'+(p.y+6).toFixed(1)+'" text-anchor="middle" font-family="system-ui,sans-serif" '+
      'font-size="17" font-weight="800" fill="'+jetonCSS("--color-bg","#0F0D12")+'">'+esc(initiales(j.nom))+'</text>'+
      '<text x="'+lx.toFixed(1)+'" y="'+ly.toFixed(1)+'" text-anchor="'+anc+'" dominant-baseline="middle" '+
      'font-family="system-ui,sans-serif" font-size="22" font-weight="700" fill="'+jetonCSS("--color-fg","#F3EEE9")+'">'+esc(j.nom)+'</text>'+
      '<text x="'+lx.toFixed(1)+'" y="'+(ly+22).toFixed(1)+'" text-anchor="'+anc+'" dominant-baseline="middle" '+
      'font-family="system-ui,sans-serif" font-size="15" fill="'+jetonCSS("--color-muted","#9C90A6")+'">'+liens+' lien'+(liens>1?'s':'')+'</text>';
  });
  return s + '</svg>';
}

function tvSaillants(){
  var fs = faitsSaillants();
  if (!fs.length) return '<div class="tv-vide">Les faits saillants arrivent après le premier jeu.</div>';
  return '<div class="tv-podium">' + fs.map(function(f){
    return '<div class="tv-carte '+f.ton+'"><span class="etiq">'+esc(f.etiq)+'</span>'+
      '<div class="gros">'+esc(f.v)+'</div><div class="qui">'+esc(f.q)+'</div>'+
      '<div class="quoi">'+esc(f.d)+'</div></div>';
  }).join("") + '</div>';
}

function relancerProgres(){
  var barre = document.getElementById("tv-progres");
  barre.classList.remove("court");
  void barre.offsetWidth;
  barre.style.animationDuration = (DUREE_PANNEAU/1000) + "s";
  barre.classList.add("court");
  barre.style.animationPlayState = tvPause ? "paused" : "running";
  clearTimeout(minuterieTV);
  if (!tvPause) minuterieTV = setTimeout(function(){ changerPanneau(1); }, DUREE_PANNEAU);
}
function changerPanneau(d){
  var n = panneauxDisponibles().length || 1;
  iPanneau = ((iPanneau + d) % n + n) % n;
  rendreTV();
}
var tv = document.getElementById("tv");
function ouvrirTV(){
  tv.classList.add("actif");
  iPanneau = 0;
  rendreTV();
  if (!MIROIR){ try { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); } catch(e){} }
}
function fermerTV(){
  if (MIROIR) return;
  tv.classList.remove("actif");
  clearTimeout(minuterieTV);
  try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen(); } catch(e){}
}
