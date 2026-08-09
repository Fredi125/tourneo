/* ==========================================================================
   1. STOCKAGE
   localStorage quand il est disponible, mémoire vive sinon, et le mode
   dégradé est annoncé à l'écran : perdre une soirée sans avertissement
   serait pire que de ne rien sauvegarder du tout.
   ========================================================================== */
var MIROIR = location.hash === "#tv";

var Stockage = (function(){
  var dispo = false;
  try {
    var t = "__essai_tourneo__";
    window.localStorage.setItem(t, "1");
    window.localStorage.removeItem(t);
    dispo = true;
  } catch (e) { dispo = false; }
  var memoire = {};
  // L'application s'est appelée « Tournoi maison » avant Tourneo : on
  // récupère les soirées enregistrées sous l'ancien nom, une fois, sans
  // effacer l'original au cas où il faudrait revenir en arrière.
  var HERITAGE = { "tourneo-v1":"tournoi-maison-v1", "tourneo-archives":"tournoi-maison-archives" };
  return {
    dispo: dispo,
    lire: function(cle){
      try {
        var v = dispo ? window.localStorage.getItem(cle) : (memoire[cle] === undefined ? null : memoire[cle]);
        if (v === null && dispo && HERITAGE[cle]){
          v = window.localStorage.getItem(HERITAGE[cle]);
          if (v !== null) this.ecrire(cle, v);
        }
        return v;
      }
      catch(e){ return memoire[cle] === undefined ? null : memoire[cle]; }
    },
    ecrire: function(cle, val){
      memoire[cle] = val;
      if (!dispo) return false;
      try { window.localStorage.setItem(cle, val); return true; } catch(e){ return false; }
    },
    effacer: function(cle){
      delete memoire[cle];
      if (dispo) { try { window.localStorage.removeItem(cle); } catch(e){} }
    }
  };
})();
var CLE = "tourneo-v1";
var CLE_ARCHIVES = "tourneo-archives";
