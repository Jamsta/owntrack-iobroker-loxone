/**
 * ============================================================
 *  build.js — Générateur du fichier ioBroker prêt à déployer
 * ============================================================
 *
 *  Ce script fusionne config.js + scripts/owntracks_to_loxone.js
 *  en un seul fichier deploy/owntracks_complet.js
 *  prêt à être copié-collé dans l'éditeur ioBroker.
 *
 *  UTILISATION :
 *    node build.js
 *
 *  RÉSULTAT :
 *    deploy/owntracks_complet.js  ← coller ce fichier dans ioBroker
 *
 *  ⚠️  deploy/ est dans .gitignore — jamais publié sur GitHub
 *
 *  WORKFLOW :
 *    1. Je mets à jour scripts/owntracks_to_loxone.js sur GitHub
 *    2. Tu fais : git pull
 *    3. Tu lances : node build.js
 *    4. Tu copies deploy/owntracks_complet.js dans ioBroker
 *    5. Tu sauvegardes et redémarres le script
 *
 * ============================================================
 */

const fs   = require("fs");
const path = require("path");

// ── Chemins ────────────────────────────────────────────────
const ROOT        = __dirname;
const CONFIG_FILE = path.join(ROOT, "config.js");
const SCRIPT_FILE = path.join(ROOT, "scripts", "owntracks_to_loxone.js");
const DEPLOY_DIR  = path.join(ROOT, "deploy");
const OUTPUT_FILE = path.join(DEPLOY_DIR, "owntracks_complet.js");

// ── Vérifications ──────────────────────────────────────────
if (!fs.existsSync(CONFIG_FILE)) {
    console.error("❌ config.js introuvable !");
    console.error("   → Copie config.example.js → config.js et remplis tes valeurs.");
    process.exit(1);
}
if (!fs.existsSync(SCRIPT_FILE)) {
    console.error("❌ scripts/owntracks_to_loxone.js introuvable !");
    process.exit(1);
}

// ── Lecture des fichiers ───────────────────────────────────
var configContent = fs.readFileSync(CONFIG_FILE, "utf8");
var scriptContent = fs.readFileSync(SCRIPT_FILE, "utf8");

// ── Extraction de la version dans le script ───────────────
var versionMatch = scriptContent.match(/VERSION\s*:\s*([\d.]+)/);
var version      = versionMatch ? versionMatch[1] : "?";

// ── Génération du header ───────────────────────────────────
var now    = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
var header = [
    "/**",
    " * ============================================================",
    " *  FICHIER GÉNÉRÉ AUTOMATIQUEMENT — NE PAS MODIFIER ICI",
    " *  Généré le : " + now,
    " *  Version script : " + version,
    " * ============================================================",
    " *",
    " *  Ce fichier est la fusion de :",
    " *    1. config.js                        (tes données privées)",
    " *    2. scripts/owntracks_to_loxone.js   (script principal)",
    " *",
    " *  Pour mettre à jour :",
    " *    git pull && node build.js",
    " *",
    " *  ⚠️  NE JAMAIS PUBLIER CE FICHIER — il contient tes mots de passe",
    " * ============================================================",
    " */",
    ""
].join("\n");

// ── Séparateurs lisibles dans l'éditeur ioBroker ──────────
var sep1 = [
    "",
    "// ============================================================",
    "// PARTIE 1 — CONFIGURATION (config.js)",
    "// ============================================================",
    ""
].join("\n");

var sep2 = [
    "",
    "// ============================================================",
    "// PARTIE 2 — SCRIPT PRINCIPAL (owntracks_to_loxone.js)",
    "// ============================================================",
    ""
].join("\n");

// ── Fusion ────────────────────────────────────────────────
var output = header + sep1 + configContent + sep2 + scriptContent;

// ── Écriture ──────────────────────────────────────────────
if (!fs.existsSync(DEPLOY_DIR)) {
    fs.mkdirSync(DEPLOY_DIR);
}
fs.writeFileSync(OUTPUT_FILE, output, "utf8");

// ── Résumé ────────────────────────────────────────────────
var lines = output.split("\n").length;
var size  = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1);

console.log("");
console.log("✅ Fichier généré avec succès !");
console.log("   📄 " + OUTPUT_FILE);
console.log("   📊 " + lines + " lignes — " + size + " Ko");
console.log("   🔖 Version script : " + version);
console.log("");
console.log("👉 Étapes suivantes :");
console.log("   1. Ouvrir ioBroker → Scripts → ton script Owntracks");
console.log("   2. Sélectionner tout (Ctrl+A) et supprimer");
console.log("   3. Coller le contenu de deploy/owntracks_complet.js");
console.log("   4. Sauvegarder et redémarrer le script");
console.log("");
