/* ==========================================================================
   14. DÉMARRAGE
   ========================================================================== */
if (!MIROIR){
  document.getElementById("btn-annuler").addEventListener("click", annuler);
  document.getElementById("btn-tv").addEventListener("click", ouvrirTV);
  document.getElementById("btn-fenetre").addEventListener("click", function(){
    window.open(location.href.split("#")[0] + "#tv", "tourneo-tv", "width=1280,height=760");
  });
  document.getElementById("tv-fermer").addEventListener("click", fermerTV);
  document.getElementById("recap-fermer").addEventListener("click", function(){
    document.getElementById("recap").classList.remove("actif");
  });
  document.getElementById("recap-tel").addEventListener("click", function(){
    var a = document.createElement("a");
    a.href = document.getElementById("recap-img").src;
    a.download = (E.nom || "tourneo").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") +
                 "-" + new Date().toISOString().slice(0,10) + ".png";
    document.body.appendChild(a); a.click(); a.remove();
  });
  document.addEventListener("keydown", function(e){
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z"){ e.preventDefault(); annuler(); return; }
    if (e.key !== "Escape") return;
    if (document.getElementById("recap").classList.contains("actif"))
      document.getElementById("recap").classList.remove("actif");
    else fermerTV();
  });
  // Chronomètre : on ne redessine pas toute l'interface chaque seconde.
  setInterval(function(){
    if (!E.reglages.chronoActif) return;
    Array.prototype.forEach.call(document.querySelectorAll("[data-chrono]"), function(el){
      var x = ep(el.getAttribute("data-chrono"));
      if (x) el.textContent = chronoTexte(x);
    });
  }, 1000);
} else {
  document.body.classList.add("miroir");
  document.getElementById("tv-fermer").hidden = true;
}

document.getElementById("tv-prec").addEventListener("click", function(){ changerPanneau(-1); });
document.getElementById("tv-suiv").addEventListener("click", function(){ changerPanneau(1); });
document.getElementById("tv-pause").addEventListener("click", function(){
  tvPause = !tvPause;
  this.innerHTML = tvPause ? "&#9654;" : "&#10074;&#10074;";
  this.setAttribute("aria-label", tvPause ? "Reprendre la rotation" : "Mettre en pause");
  relancerProgres();
});
document.addEventListener("keydown", function(e){
  if (!document.getElementById("tv").classList.contains("actif")) return;
  if (e.key === "ArrowRight") changerPanneau(1);
  if (e.key === "ArrowLeft")  changerPanneau(-1);
});

window.addEventListener("storage", function(e){
  if (e.key !== CLE) return;
  charger();
  if (MIROIR) rendreTV(); else rendre();
});

if (!Stockage.dispo){
  var bandeau = document.getElementById("bandeau-stockage");
  bandeau.hidden = false;
  bandeau.innerHTML = "La sauvegarde automatique est bloquée dans cet aperçu — le tournoi vivra seulement le temps de l'onglet. " +
    "Téléchargez <code>tourneo.html</code> et ouvrez-le directement pour retrouver l'enregistrement au fil de la saisie. " +
    "En attendant, <strong>Réglages &#8594; Exporter</strong> conserve tout dans un fichier.";
}

charger();
if (MIROIR){ ouvrirTV(); } else { rendre(); }

if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0){
  navigator.serviceWorker.register("./sw.js").catch(function(){ /* servi sans cache hors ligne */ });
}
