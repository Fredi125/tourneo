/* ==========================================================================
   12. RÉCAPITULATIF PARTAGEABLE
   Dessiné directement au canvas plutôt que via SVG : pas de dépendance à
   la sérialisation, pas de canvas taché, ça marche partout.
   ========================================================================== */
function coinsArrondis(c, x, y, w, h, r){
  c.beginPath();
  c.moveTo(x+r, y);
  c.arcTo(x+w, y,   x+w, y+h, r);
  c.arcTo(x+w, y+h, x,   y+h, r);
  c.arcTo(x,   y+h, x,   y,   r);
  c.arcTo(x,   y,   x+w, y,   r);
  c.closePath();
}
function tronquer(c, texte, largeur){
  if (c.measureText(texte).width <= largeur) return texte;
  var t = texte;
  while (t.length > 1 && c.measureText(t + "…").width > largeur) t = t.slice(0, -1);
  return t + "…";
}

function dessinerRecap(){
  var W = 1080, H = 1500;
  var cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  var c = cv.getContext("2d");
  var S = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
  var M = "ui-monospace,Menlo,Consolas,monospace";

  var T = {
    bg:     jetonCSS("--color-bg","#0F0D12"),
    surf:   jetonCSS("--color-surface","#191620"),
    bord:   jetonCSS("--color-border-soft","#241E2C"),
    fg:     jetonCSS("--color-fg","#F3EEE9"),
    muet:   jetonCSS("--color-muted","#9C90A6"),
    ember:  jetonCSS("--color-ember","#F5903C"),
    emberD: jetonCSS("--color-ember-dim","#7A4A18"),
    cool:   jetonCSS("--color-cool","#84B4EA"),
    moss:   jetonCSS("--color-moss","#86C39B"),
    rose:   jetonCSS("--color-rose","#E58BB4"),
    argent: jetonCSS("--color-silver","#C6CBD4"),
    bronze: jetonCSS("--color-bronze","#C08A55")
  };

  c.fillStyle = T.bg;    c.fillRect(0,0,W,H);
  c.fillStyle = T.surf;  c.fillRect(0,0,W,10);
  c.fillStyle = T.ember; c.fillRect(0,0,W*0.38,10);

  var y = 96;
  c.fillStyle = T.muet; c.font = "700 26px "+S;
  c.fillText(new Date().toLocaleDateString("fr-CA", {year:"numeric", month:"long", day:"numeric"}).toUpperCase(), 72, y);
  y += 62;
  c.fillStyle = T.fg; c.font = "800 60px "+S;
  c.fillText(tronquer(c, E.nom || "Tournoi maison", W-144), 72, y);

  var cl = classement();
  var jouees = E.epreuves.filter(function(x){ return calculerEpreuve(x).classee; });
  y += 34;
  c.fillStyle = T.muet; c.font = "600 27px "+S;
  c.fillText(cl.length + " joueurs · " + jouees.length + " jeux disputés", 72, y);

  // Podium
  y += 56;
  var hauteurs = [190, 150, 128];
  var tons = [T.ember, T.argent, T.bronze];
  for (var i=0; i<Math.min(3, cl.length); i++){
    var hh = hauteurs[i];
    coinsArrondis(c, 72, y, W-144, hh, 22);
    c.fillStyle = T.surf; c.fill();
    c.strokeStyle = i===0 ? T.emberD : T.bord; c.lineWidth = 2; c.stroke();

    c.fillStyle = tons[i]; c.font = "800 " + (i===0?76:56) + "px " + M;
    c.fillText(String(i+1), 108, y + hh/2 + (i===0?26:19));

    c.beginPath();
    c.arc(230, y + hh/2, i===0?42:34, 0, Math.PI*2);
    c.fillStyle = cl[i].joueur.couleur; c.fill();
    c.fillStyle = T.bg; c.font = "800 " + (i===0?32:26) + "px " + S;
    c.textAlign = "center";
    c.fillText(initiales(cl[i].joueur.nom), 230, y + hh/2 + (i===0?11:9));
    c.textAlign = "left";

    c.fillStyle = T.fg; c.font = "750 " + (i===0?52:42) + "px " + S;
    c.fillText(tronquer(c, cl[i].joueur.nom, 480), 292, y + hh/2 + (i===0?18:15));

    c.fillStyle = i===0 ? T.ember : T.fg; c.font = "800 " + (i===0?70:52) + "px " + M;
    c.textAlign = "right";
    c.fillText(fmt(cl[i].total), W-108, y + hh/2 + (i===0?25:19));
    c.textAlign = "left";
    y += hh + 14;
  }

  // Reste du classement
  if (cl.length > 3){
    y += 18;
    c.fillStyle = T.muet; c.font = "700 23px "+S;
    c.fillText("SUITE DU CLASSEMENT", 72, y);
    y += 26;
    for (var k=3; k<Math.min(cl.length, 10); k++){
      y += 46;
      c.fillStyle = T.muet; c.font = "700 30px "+M;
      c.fillText(String(k+1), 76, y);
      c.fillStyle = T.fg; c.font = "650 31px "+S;
      c.fillText(tronquer(c, cl[k].joueur.nom, 560), 140, y);
      c.fillStyle = T.muet; c.font = "700 31px "+M;
      c.textAlign = "right"; c.fillText(fmt(cl[k].total), W-76, y); c.textAlign = "left";
    }
    y += 22;
  }

  // Faits saillants
  var fs = faitsSaillants().slice(0, 3);
  if (fs.length){
    y += 40;
    c.fillStyle = T.muet; c.font = "700 23px "+S;
    c.fillText("FAITS SAILLANTS", 72, y);
    y += 20;
    var largeur = (W - 144 - 24) / Math.max(fs.length,1);
    var couleurs = { "":T.ember, pervenche:T.cool, sauge:T.moss, rose:T.rose };
    fs.forEach(function(f, n){
      var x = 72 + n*(largeur+12);
      coinsArrondis(c, x, y, largeur, 156, 18);
      c.fillStyle = T.surf; c.fill();
      c.strokeStyle = T.bord; c.lineWidth = 2; c.stroke();
      c.fillStyle = T.muet; c.font = "700 17px "+S;
      c.fillText(tronquer(c, f.etiq.toUpperCase(), largeur-36), x+20, y+38);
      c.fillStyle = couleurs[f.ton] || T.ember; c.font = "800 46px "+M;
      c.fillText(tronquer(c, String(f.v), largeur-36), x+20, y+88);
      c.fillStyle = T.fg; c.font = "700 25px "+S;
      c.fillText(tronquer(c, f.q, largeur-36), x+20, y+124);
    });
    y += 178;
  }

  // Vainqueurs par jeu
  if (jouees.length){
    y += 34;
    c.fillStyle = T.muet; c.font = "700 23px "+S;
    c.fillText("VAINQUEURS PAR JEU", 72, y);
    y += 14;
    jouees.slice(0, 8).forEach(function(x){
      y += 44;
      var p = podium(x, 1)[0];
      c.beginPath(); c.arc(90, y-9, 13, 0, Math.PI*2);
      c.fillStyle = x.teinte; c.fill();
      c.fillStyle = T.fg; c.font = "650 28px "+S;
      c.fillText(tronquer(c, x.nom, 460), 118, y);
      c.fillStyle = T.ember; c.font = "700 28px "+S;
      c.textAlign = "right";
      c.fillText(tronquer(c, p ? nomDe(p.jid) : "—", 380), W-76, y);
      c.textAlign = "left";
    });
  }

  c.fillStyle = T.bord; c.font = "600 22px "+S;
  c.textAlign = "center";
  c.fillText("Tourneo", W/2, H-46);
  c.textAlign = "left";

  return cv.toDataURL("image/png");
}

function ouvrirRecap(){
  if (!E.joueurs.length){ alert("Ajoutez des joueurs avant de générer un récapitulatif."); return; }
  if (estAveugle() && !confirm("Le classement est encore scellé. Le récapitulatif affichera tous les totaux.\n\nLe générer quand même ?")) return;
  var url;
  try { url = dessinerRecap(); }
  catch(e){ alert("Le récapitulatif n'a pas pu être dessiné dans ce navigateur."); return; }
  document.getElementById("recap-img").src = url;
  document.getElementById("recap").classList.add("actif");
}
