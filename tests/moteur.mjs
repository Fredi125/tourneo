#!/usr/bin/env node
/**
 * Suite de régression du moteur.
 *
 *     node tests/moteur.mjs
 *
 * Charge dist/tourneo.html, évalue son script dans un DOM minimal et
 * vérifie les invariants du tournoi. Aucune dépendance : Node seul.
 * Lancez outils/build.py avant, sinon vous testez la version précédente.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const RACINE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const HTML = path.join(RACINE, "dist", "tourneo.html");

if (!fs.existsSync(HTML)) {
  console.error("dist/tourneo.html absent — lancez d'abord : python3 outils/build.py");
  process.exit(1);
}
const html = fs.readFileSync(HTML, "utf8");
const source = html.match(/<script>\n([\s\S]*?)\n<\/script>/)[1];

/* ── DOM minimal : assez pour que le module se charge sans navigateur ── */
const faux = {
  addEventListener() {}, click() {}, focus() {}, setAttribute() {},
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  style: {}, querySelectorAll: () => [], querySelector: () => null,
  hidden: false, textContent: "", innerHTML: "",
  getContext: () => ({
    fillRect() {}, fillText() {}, beginPath() {}, moveTo() {}, arcTo() {},
    arc() {}, closePath() {}, fill() {}, stroke() {}, drawImage() {},
    measureText: () => ({ width: 10 }),
  }),
  toDataURL: () => "data:image/png;base64,TEST",
};
global.window = {
  localStorage: {
    _: {},
    getItem(k) { return this._[k] ?? null; },
    setItem(k, v) { this._[k] = v; },
    removeItem(k) { delete this._[k]; },
  },
  matchMedia: () => ({ matches: false }),
  addEventListener() {}, open() {}, scrollTo() {},
};
global.location = { hash: "", href: "http://local/t.html", protocol: "http:" };
global.document = {
  addEventListener() {}, getElementById: () => faux, querySelector: () => null,
  documentElement: {}, body: { classList: { add() {} } },
  activeElement: null, createElement: () => faux,
};
Object.defineProperty(global, "navigator", { value: {}, configurable: true });
global.setTimeout = () => 0;
global.clearTimeout = () => {};
global.setInterval = () => 0;
global.Blob = class {};
global.URL = { createObjectURL: () => "", revokeObjectURL() {} };
global.Image = class {};
global.confirm = () => true;
global.alert = () => {};

const EXPORTS = [
  "getE:()=>E", "reglagesDefaut", "etatVierge", "normaliserEpreuve", "barmeAutoPour",
  "calculerEpreuve", "classement", "criteresTous", "podium", "faitsSaillants",
  "estAveugle", "pointsRestants", "epreuvesRestantes", "maxPointsEpreuve",
  "partenairesDe", "blocageAffiliation", "porteursPossibles", "archiverSoiree",
  "ligue", "lireArchives", "traiterClic", "instantane", "memoriser", "annuler",
  "historique", "APERCUS", "ICONES", "PRESETS", "PALETTE", "apercuDe", "blason",
  "vueTournoi", "vueCeSoir", "vueLigue", "vueJoueurs", "vueReglages", "vueDeroulement",
  "catalogueJeux", "panneauEpreuve", "carteJeu", "tvClassement", "tvDerniere",
  "tvJeux", "tvAlliances", "tvSaillants", "panneauxDisponibles", "dessinerRecap", "id",
];
const A = new Function(source + "; return {" + EXPORTS.join(",") + "};")();

/* ── Micro-harnais ──────────────────────────────────────────────────── */
let reussis = 0, echecs = [];
const groupes = [];
function groupe(nom) { groupes.push(nom); console.log("\n" + nom); }
function verifie(quoi, condition, detail) {
  if (condition) { reussis++; console.log("  ok   " + quoi); }
  else { echecs.push(quoi + (detail ? " — " + detail : "")); console.log("  ÉCHEC " + quoi + (detail ? "  (" + detail + ")" : "")); }
}
function egal(quoi, obtenu, attendu) {
  verifie(quoi, JSON.stringify(obtenu) === JSON.stringify(attendu),
          `obtenu ${JSON.stringify(obtenu)}, attendu ${JSON.stringify(attendu)}`);
}

function neuf(joueurs = ["Ariane", "Bruno", "Carmen", "Dorval", "Ema"]) {
  const E = A.getE();
  Object.assign(E, A.etatVierge());
  E.joueurs = joueurs.map((n, i) => ({ id: "j" + i, nom: n, couleur: A.PALETTE[i] }));
  E.epreuves = [];
  return E;
}
const bouton = (a, at = {}) => ({ getAttribute: (k) => (k === "data-act" ? a : at[k] ?? null), tagName: "BUTTON" });
function geste(a, at = {}) {
  const avant = A.instantane();
  A.traiterClic(a, bouton(a, at));
  A.memoriser(avant, a);
}

/* ── 1. Barème ──────────────────────────────────────────────────────── */
groupe("Barème normalisé");
{
  neuf();
  egal("six participants donnent des entiers", A.barmeAutoPour(6), [10, 8, 7, 5, 4, 2]);
  for (const n of [2, 3, 4, 6, 8, 12]) {
    const b = A.barmeAutoPour(n);
    const moy = b.reduce((s, x) => s + x, 0) / n;
    verifie(`espérance constante à N=${n}`, Math.abs(moy - 6) < 0.6, `moyenne ${moy.toFixed(2)}`);
  }
  verifie("le premier touche toujours le maximum", A.barmeAutoPour(9)[0] === 10);
  verifie("le dernier touche toujours la base", A.barmeAutoPour(9)[8] === 2);
}

/* ── 2. Manches ─────────────────────────────────────────────────────── */
groupe("Manches multiples");
{
  const E = neuf();
  const x = A.normaliserEpreuve({
    id: "mk", nom: "Kart", statut: "terminee", participants: ["j0", "j1", "j2"],
    manches: [{ id: "a", rangs: { j0: 1, j1: 2, j2: 3 } },
              { id: "b", rangs: { j0: 3, j1: 1, j2: 2 } },
              { id: "c", rangs: { j0: 2, j1: 1, j2: 3 } }],
  });
  E.epreuves = [x];
  const somme = A.calculerEpreuve(x).parJoueur;
  egal("somme des trois manches", [somme.j0.pts, somme.j1.pts, somme.j2.pts], [18, 26, 10]);
  x.cumul = "moyenne";
  const moy = A.calculerEpreuve(x).parJoueur;
  egal("moyenne des trois manches", [moy.j0.pts, moy.j1.pts, moy.j2.pts], [6, 9, 3]);
  verifie("la moyenne ne dépend pas du nombre de manches",
          A.maxPointsEpreuve(x) === A.maxPointsEpreuve(A.normaliserEpreuve({ id: "z", cumul: "moyenne" })));
}

/* ── 3. Affiliation ─────────────────────────────────────────────────── */
groupe("Affiliation");
{
  const E = neuf();
  const x = A.normaliserEpreuve({
    id: "e", nom: "Catan", poids: 2, statut: "terminee", participants: ["j0", "j1", "j2"],
    manches: [{ id: "a", rangs: { j0: 1, j1: 2, j2: 3 } }], affiliations: { j3: "j0" },
  });
  E.epreuves = [x];
  const r = A.calculerEpreuve(x).parJoueur;
  egal("héritage à 100 %, poids appliqué", [r.j0.pts, r.j3.pts], [20, 20]);
  E.reglages.tauxHeritage = 70; E.reglages.decimales = 1;
  egal("héritage à 70 %", A.calculerEpreuve(x).parJoueur.j3.pts, 14);
  E.reglages.tauxHeritage = 100; E.reglages.decimales = 0;

  verifie("on ne peut pas se suivre soi-même", !!A.blocageAffiliation(x, "j1", "j1"));
  verifie("le porteur doit jouer", !!A.blocageAffiliation(x, "j3", "j4"));
  x.affiliations = { j3: "j0", j4: "j0" };
  verifie("capacité d'accueil respectée", A.blocageAffiliation(x, "j2", "j0")?.court === "complet");
}

groupe("Plafond de coéquipiers (bidirectionnel)");
{
  const E = neuf();
  E.epreuves = [
    A.normaliserEpreuve({ id: "a", participants: ["j0"], affiliations: { j1: "j0" } }),
    A.normaliserEpreuve({ id: "b", participants: ["j0"], affiliations: { j2: "j0" } }),
    A.normaliserEpreuve({ id: "c", participants: ["j0"], affiliations: { j3: "j0" } }),
  ];
  egal("trois liens consommés", A.partenairesDe("j0").sort(), ["j1", "j2", "j3"]);
  const d = A.normaliserEpreuve({ id: "d", participants: ["j0", "j1"] });
  E.epreuves.push(d);
  verifie("quatrième partenaire refusé", A.blocageAffiliation(d, "j4", "j0")?.court === "son cercle est plein");
  verifie("lien déjà consommé réutilisable", A.blocageAffiliation(d, "j2", "j0") === null);
  E.reglages.plafondBidirectionnel = false;
  verifie("porter ne coûte rien en mode unidirectionnel", A.blocageAffiliation(d, "j4", "j0") === null);
  E.reglages.plafondBidirectionnel = true;
}

/* ── 4. Paris ───────────────────────────────────────────────────────── */
groupe("Paris de salon");
{
  const E = neuf();
  const x = A.normaliserEpreuve({
    id: "p", statut: "terminee", participants: ["j0", "j1"],
    manches: [{ id: "a", rangs: { j0: 2, j1: 1 } }], paris: { j3: "j1", j4: "j0" },
  });
  E.epreuves = [x];
  const r = A.calculerEpreuve(x).parJoueur;
  egal("le vainqueur est bien identifié", A.calculerEpreuve(x).vainqueurs, ["j1"]);
  egal("bon pronostic payé", r.j3.pts, 3);
  egal("mauvais pronostic à zéro", r.j4.pts, 0);
  verifie("le pari s'ajoute au rôle", (() => {
    x.affiliations = { j3: "j1" };
    const v = A.calculerEpreuve(x).parJoueur.j3;
    return v.pts === 10 + 3;
  })(), "héritage + pronostic");
}

/* ── 5. Départage ───────────────────────────────────────────────────── */
groupe("Départage des égalités");
{
  const E = neuf(["Ariane", "Zoé", "Marc"]);
  E.epreuves = [
    A.normaliserEpreuve({ id: "g1", statut: "terminee", participants: ["j0", "j1", "j2"],
      manches: [{ id: "m", rangs: { j1: 1, j2: 2, j0: 3 } }] }),
    A.normaliserEpreuve({ id: "g2", statut: "terminee", participants: ["j0", "j1", "j2"],
      manches: [{ id: "m", rangs: { j0: 1, j2: 2, j1: 3 } }] }),
  ];
  const cl = A.classement();
  verifie("égalité parfaite de points", cl.every((r) => r.total === cl[0].total));
  verifie("celui sans victoire tombe dernier", cl[2].crit.victoires === 0);
  verifie("le motif du départage est annoncé", cl.some((r) => r.departage));
  verifie("l'égalité irréductible est avouée",
          cl.some((r) => r.departage && /alphab/.test(r.departage.long)));
}

/* ── 6. Mode aveugle ────────────────────────────────────────────────── */
groupe("Classement scellé");
{
  const E = neuf(["Ariane", "Bruno", "Carmen"]);
  E.reglages.aveugleActif = true;
  E.reglages.aveugleDernieres = 2;
  E.epreuves = [
    A.normaliserEpreuve({ id: "f1", statut: "terminee", participants: ["j0", "j1", "j2"],
      manches: [{ id: "m", rangs: { j0: 1, j1: 2, j2: 3 } }] }),
    A.normaliserEpreuve({ id: "f2", statut: "terminee", participants: ["j0", "j1", "j2"],
      manches: [{ id: "m", rangs: { j1: 1, j0: 2, j2: 3 } }] }),
    A.normaliserEpreuve({ id: "r1", statut: "a_venir" }),
  ];
  verifie("le sceau tombe au bon moment", A.estAveugle());
  const vue = A.vueCeSoir();
  verifie("la vue masque les totaux", !/class="total"/.test(vue));
  verifie("la vue affiche le sceau", /scell/i.test(vue));
  verifie("la TV masque aussi", /scell/i.test(A.tvClassement()));
  const etiq = A.faitsSaillants().map((f) => f.etiq).join("|");
  verifie("aucune fuite par les faits saillants", !/Lutte|Encore en jeu/.test(etiq), etiq);
  verifie("les cercles d'équipe restent visibles", /Cercles|Alliances|suit/i.test(vue));
  E.aveugleLeve = true;
  verifie("la révélation rétablit tout", !A.estAveugle() && /class="total"/.test(A.vueCeSoir()));
}

/* ── 7. Annulation ──────────────────────────────────────────────────── */
groupe("Annulation");
{
  neuf(["Ariane", "Bruno", "Carmen"]);
  A.getE().epreuves = [
    A.normaliserEpreuve({ id: "g1", nom: "Kart", statut: "terminee", participants: ["j0", "j1", "j2"],
      manches: [{ id: "m", rangs: { j0: 1, j1: 2, j2: 3 } }] }),
    A.normaliserEpreuve({ id: "g2", nom: "Dards", statut: "terminee", participants: ["j0", "j1"],
      manches: [{ id: "m", rangs: { j0: 1, j1: 2 } }] }),
  ];
  A.historique.length = 0;
  geste("ep-retire", { "data-ep": "g1" });
  egal("suppression effective", A.getE().epreuves.length, 1);
  A.annuler();
  egal("suppression annulée", A.getE().epreuves.map((x) => x.nom), ["Kart", "Dards"]);
  egal("les rangs reviennent", Object.keys(A.getE().epreuves[0].manches[0].rangs).length, 3);

  geste("archiver");
  const apres = A.lireArchives().length;
  A.annuler();
  egal("l'archivage est réversible, archives comprises", A.lireArchives().length, apres - 1);

  geste("reinit");
  egal("réinitialisation effective", A.getE().joueurs.length, 0);
  A.annuler();
  egal("« tout effacer » est annulable", A.getE().joueurs.length, 3);

  const n = A.historique.length;
  geste("action-inexistante");
  egal("un geste sans effet n'empile rien", A.historique.length, n);
}

/* ── 8. Ligue ───────────────────────────────────────────────────────── */
groupe("Ligue");
{
  const E = neuf(["Ariane", "Bruno"]);
  E.nom = "Soirée test";
  E.epreuves = [A.normaliserEpreuve({ id: "g", statut: "terminee", participants: ["j0", "j1"],
    manches: [{ id: "m", rangs: { j0: 1, j1: 2 } }] })];
  const avant = A.lireArchives().length;
  A.archiverSoiree();
  A.archiverSoiree();
  egal("deux soirées archivées", A.lireArchives().length, avant + 2);
  const L = A.ligue(false).filter((r) => ["Ariane", "Bruno"].includes(r.nom));
  verifie("cumul par nom", L[0].soirees >= 2 && L[0].victoires >= 2, JSON.stringify(L[0]));
}

/* ── 9. Aperçus ─────────────────────────────────────────────────────── */
groupe("Illustrations");
{
  egal("une illustration par pictogramme", Object.keys(A.APERCUS).length, Object.keys(A.ICONES).length);
  const orphelins = [];
  A.PRESETS.forEach((f) => f.jeux.forEach((g) => { if (!A.APERCUS[g.icone]) orphelins.push(g.nom); }));
  egal("aucun préréglage sans illustration", orphelins, []);
  verifie("toutes en PNG", Object.values(A.APERCUS).every((v) => v.startsWith("data:image/png;base64,")));
  const x = A.normaliserEpreuve({ id: "a", icone: "kart" });
  verifie("le préréglage fournit son illustration", A.apercuDe(x).startsWith("data:image/png"));
  x.image = "data:image/jpeg;base64,PERSO";
  egal("l'image personnalisée l'emporte", A.apercuDe(x), "data:image/jpeg;base64,PERSO");
  x.image = ""; x.icone = "inconnu";
  verifie("repli sur le pictogramme SVG", A.apercuDe(x) === "" && /<svg/.test(A.blason(x, 30)));
}

/* ── 10. Rendu ──────────────────────────────────────────────────────── */
groupe("Rendu de toutes les vues");
{
  const E = neuf();
  E.epreuves = [A.normaliserEpreuve({ id: "g", nom: "Kart", icone: "kart", statut: "terminee",
    participants: ["j0", "j1", "j2"], manches: [{ id: "m", rangs: { j0: 1, j1: 2, j2: 3 } }],
    affiliations: { j3: "j0" }, paris: { j4: "j0" } })];
  for (const f of ["vueTournoi", "vueCeSoir", "vueLigue", "vueJoueurs", "vueReglages",
                   "vueDeroulement", "catalogueJeux", "tvClassement", "tvJeux", "tvSaillants"]) {
    let sortie = "";
    try { sortie = A[f](); } catch (e) { sortie = "ERREUR:" + e.message; }
    verifie(f, sortie.length > 40 && !sortie.startsWith("ERREUR"), sortie.slice(0, 90));
  }
  verifie("panneauEpreuve", A.panneauEpreuve(E.epreuves[0]).length > 40);
  verifie("carteJeu", A.carteJeu(E.epreuves[0]).length > 40);
  verifie("tvDerniere", A.tvDerniere(E.epreuves[0]).length > 40);
  verifie("tvAlliances", A.tvAlliances().length > 40);
  verifie("récapitulatif", A.dessinerRecap().startsWith("data:image"));
  verifie("panneaux TV disponibles", A.panneauxDisponibles().length >= 3);
}

/* ── 11. Charte visuelle ────────────────────────────────────────────── */
groupe("Charte visuelle");
{
  const css = html.match(/<style>\n([\s\S]*?)\n<\/style>/)[1];
  const bloc = css.slice(css.indexOf(":root{"), css.indexOf("/* Noms internes"));
  const egarees = [...new Set(css.replace(bloc, "").match(/#[0-9A-Fa-f]{6}/g) || [])];
  egal("aucune couleur hors du bloc de jetons", egarees, []);
  verifie("les jetons GameCrawler sont là", /--color-bg:/.test(css) && /--color-ember:/.test(css));
  verifie("la lueur de braises est présente", /body::before/.test(css));
  verifie("cibles tactiles déclarées", /--tap:\s*4[4-9]px/.test(css));
  verifie("aucune dépendance externe",
          !/https?:\/\/[^"']*\.(css|js|woff2?)/.test(html), "CDN ou police distante détectée");
}

/* ── Bilan ──────────────────────────────────────────────────────────── */
console.log("\n" + "─".repeat(58));
if (echecs.length) {
  console.log(`${reussis} vérifications passées, ${echecs.length} ÉCHEC(S) :`);
  echecs.forEach((e) => console.log("  · " + e));
  process.exit(1);
}
console.log(`${reussis} vérifications passées sur ${groupes.length} groupes. Rien à signaler.`);
