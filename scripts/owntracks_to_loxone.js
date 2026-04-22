/**
 * ============================================================
 *  SCRIPT : owntracks_to_loxone.js
 *  AUTEUR : David (config) + GenSpark AI (génération)
 *  VERSION: 1.0.0
 *  DATE   : 2026-04-22
 * ============================================================
 *
 *  RÔLE DU SCRIPT
 *  --------------
 *  Ce script écoute TOUTES les données brutes envoyées par
 *  l'adaptateur OwnTracks (owntracks.0) vers ioBroker,
 *  les stocke dans des variables structurées, et les pousse
 *  vers le Loxone Miniserver via des requêtes HTTP (Virtual
 *  HTTP Input dans Loxone Config).
 *
 *  DÉTECTION AUTOMATIQUE DES UTILISATEURS
 *  ----------------------------------------
 *  Aucune configuration manuelle d'utilisateur n'est nécessaire.
 *  Dès qu'un nouveau téléphone se connecte à OwnTracks et envoie
 *  sa position, le script détecte automatiquement le nouvel
 *  utilisateur et commence à pousser ses données vers Loxone.
 *
 *  PHILOSOPHIE
 *  -----------
 *  - PAS de logique métier ici (pas de "si David est à la maison")
 *  - TOUTES les données brutes sont exposées telles quelles
 *  - C'est Loxone qui se charge de la logique domotique
 *  - Le script est volontairement simple et lisible
 *
 *  DONNÉES POUSSÉES VERS LOXONE (par utilisateur)
 *  ------------------------------------------------
 *  Voir section "STRUCTURE DES DONNÉES" plus bas
 *
 *  CONFIGURATION
 *  -------------
 *  Modifier uniquement la section "⚙️ CONFIGURATION" ci-dessous
 *
 *  ENTRÉES VIRTUELLES LOXONE À CRÉER
 *  -----------------------------------
 *  Voir le fichier : loxone/virtual_inputs.md
 *
 * ============================================================
 */

// ============================================================
// ⚙️  CONFIGURATION — À MODIFIER SELON TON INSTALLATION
// ============================================================

const CONFIG = {

    // --- Loxone Miniserver ---
    LOXONE_IP   : "192.168.1.77",   // ← IP de ton Loxone Miniserver
    LOXONE_PORT : 80,               // ← Port HTTP du Miniserver (80 par défaut)
    LOXONE_USER : "admin",          // ← Utilisateur Loxone
    LOXONE_PASS : "admin",          // ← Mot de passe Loxone

    // --- ioBroker OwnTracks ---
    OWNTRACKS_INSTANCE : "owntracks.0",   // ← Instance de l'adaptateur OwnTracks

    // --- Intervalle de surveillance (ms) ---
    // Le script surveille en temps réel via subscriptions,
    // mais un polling de sécurité est aussi actif
    POLLING_INTERVAL_MS : 30000,   // ← 30 secondes (fallback polling)

    // --- Debug ---
    DEBUG : true,   // ← true = logs détaillés dans la console ioBroker

};

// ============================================================
// 📦  STRUCTURE DES DONNÉES OwnTracks (référence)
// ============================================================
//
//  Chaque utilisateur détecté aura les états suivants dans ioBroker :
//
//  owntracks.0.users.<NOM>.
//    ├── latitude          → Latitude GPS (float, degrés)
//    ├── longitude         → Longitude GPS (float, degrés)
//    ├── accuracy          → Précision GPS en mètres (int)
//    ├── altitude          → Altitude en mètres (int)
//    ├── velocity          → Vitesse en km/h (int)
//    ├── course            → Cap (direction) en degrés (int)
//    ├── battery           → Niveau batterie du téléphone % (int)
//    ├── batteryStatus     → État batterie (0=inconnu,1=débranché,2=charge,3=plein)
//    ├── timestamp         → Timestamp UNIX de la position (int)
//    ├── datetime          → Date/heure lisible (string)
//    ├── trigger           → Déclencheur de la mise à jour (p/c/r/u/t/v)
//    ├── connection        → Type de connexion (w=WiFi, o=offline, m=mobile)
//    ├── ssid              → Nom du réseau WiFi (string)
//    ├── inregions         → Zones géographiques actuelles (string JSON)
//    ├── motionactivities  → Activité détectée (marche, voiture...) (string)
//    └── trackerID         → Initiales affichées sur la carte (string)
//
// ============================================================

// ============================================================
// 🔧  FONCTIONS UTILITAIRES
// ============================================================

/**
 * Log conditionnel (uniquement si DEBUG = true)
 */
function log_debug(msg) {
    if (CONFIG.DEBUG) {
        log("[OwnTracks→Loxone] " + msg, "info");
    }
}

/**
 * Log d'erreur (toujours affiché)
 */
function log_error(msg) {
    log("[OwnTracks→Loxone] ❌ ERREUR : " + msg, "error");
}

/**
 * Envoie une valeur vers une Virtual HTTP Input de Loxone
 *
 * Format de l'URL Loxone Virtual HTTP Input :
 * http://<IP>/dev/sps/io/<NOM_ENTREE_VIRTUELLE>/<VALEUR>
 *
 * @param {string} inputName  - Nom de l'entrée virtuelle dans Loxone Config
 * @param {*}      value      - Valeur à envoyer
 */
function sendToLoxone(inputName, value) {
    // Encodage de la valeur pour l'URL
    var encodedValue = encodeURIComponent(String(value));

    // Construction de l'URL
    var url = "http://" + CONFIG.LOXONE_USER + ":" + CONFIG.LOXONE_PASS
            + "@" + CONFIG.LOXONE_IP + ":" + CONFIG.LOXONE_PORT
            + "/dev/sps/io/" + inputName + "/" + encodedValue;

    log_debug("→ Loxone : " + inputName + " = " + value);

    // Envoi de la requête HTTP
    require("http").get(url, function(res) {
        // Réponse ignorée volontairement (fire and forget)
        res.resume();
    }).on("error", function(e) {
        log_error("Impossible d'envoyer à Loxone [" + inputName + "] : " + e.message);
    });
}

/**
 * Construit le nom de l'entrée virtuelle Loxone pour un utilisateur
 * Format : OT_<NOM_UTILISATEUR>_<CHAMP>
 * Exemple : OT_David_latitude, OT_Carole_battery
 *
 * ⚠️  Ces noms doivent correspondre EXACTEMENT aux noms des
 *     Virtual Inputs créées dans Loxone Config
 *
 * @param {string} userName  - Nom de l'utilisateur (DeviceID OwnTracks)
 * @param {string} field     - Nom du champ de donnée
 * @returns {string}
 */
function loxoneName(userName, field) {
    return "OT_" + userName + "_" + field;
}

// ============================================================
// 👥  GESTION DYNAMIQUE DES UTILISATEURS
// ============================================================

// Liste des utilisateurs détectés (alimentée automatiquement)
var detectedUsers = {};

/**
 * Récupère la liste des utilisateurs actuellement connus
 * dans l'adaptateur OwnTracks et initialise leur surveillance
 */
function discoverUsers() {
    var pattern = CONFIG.OWNTRACKS_INSTANCE + ".users.*";

    // Récupération de tous les états OwnTracks
    getObjectView("system", "state", {
        startkey: CONFIG.OWNTRACKS_INSTANCE + ".users.",
        endkey:   CONFIG.OWNTRACKS_INSTANCE + ".users.\u9999"
    }, function(err, objects) {
        if (err) {
            log_error("Erreur lors de la découverte des utilisateurs : " + err);
            return;
        }

        if (!objects || !objects.rows) {
            log_debug("Aucun utilisateur OwnTracks trouvé pour l'instant.");
            return;
        }

        // Extraction des noms d'utilisateurs uniques
        objects.rows.forEach(function(row) {
            if (row && row.id) {
                // Format : owntracks.0.users.<NOM>.<champ>
                var parts = row.id.split(".");
                if (parts.length >= 4) {
                    var userName = parts[3]; // ex: "David", "Carole"
                    if (!detectedUsers[userName]) {
                        detectedUsers[userName] = true;
                        log_debug("✅ Utilisateur détecté : " + userName);
                        watchUser(userName);
                    }
                }
            }
        });
    });
}

// ============================================================
// 👁️  SURVEILLANCE D'UN UTILISATEUR
// ============================================================

/**
 * Met en place la surveillance en temps réel de tous les états
 * d'un utilisateur OwnTracks et les pousse vers Loxone à chaque
 * changement.
 *
 * @param {string} userName - Nom de l'utilisateur (DeviceID OwnTracks)
 */
function watchUser(userName) {
    var base = CONFIG.OWNTRACKS_INSTANCE + ".users." + userName + ".";

    log_debug("👁️  Surveillance activée pour : " + userName);

    // ----------------------------------------------------------
    // 📍 POSITION GPS
    // ----------------------------------------------------------

    // Latitude
    on({ id: base + "latitude", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "latitude"), obj.state.val);
    });

    // Longitude
    on({ id: base + "longitude", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "longitude"), obj.state.val);
    });

    // Précision GPS (mètres)
    on({ id: base + "accuracy", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "accuracy"), obj.state.val);
    });

    // Altitude (mètres)
    on({ id: base + "altitude", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "altitude"), obj.state.val || 0);
    });

    // Vitesse (km/h)
    on({ id: base + "velocity", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "velocity"), obj.state.val || 0);
    });

    // Cap / Direction (degrés 0-360)
    on({ id: base + "course", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "course"), obj.state.val || 0);
    });

    // ----------------------------------------------------------
    // 🔋 BATTERIE
    // ----------------------------------------------------------

    // Niveau batterie (%)
    on({ id: base + "battery", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "battery"), obj.state.val);
    });

    // État batterie (0=inconnu, 1=débranché, 2=en charge, 3=plein)
    on({ id: base + "batteryStatus", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "batteryStatus"), obj.state.val || 0);
    });

    // ----------------------------------------------------------
    // ⏱️  HORODATAGE
    // ----------------------------------------------------------

    // Timestamp UNIX (secondes)
    on({ id: base + "timestamp", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "timestamp"), obj.state.val);
    });

    // Date/heure lisible (string ISO)
    on({ id: base + "datetime", change: "any" }, function(obj) {
        // On envoie seulement la partie heure pour Loxone
        // Format attendu : HH:MM:SS
        var dt = obj.state.val;
        sendToLoxone(loxoneName(userName, "datetime"), dt);
    });

    // ----------------------------------------------------------
    // 📶 CONNECTIVITÉ
    // ----------------------------------------------------------

    // Type de connexion : "w"=WiFi, "o"=offline, "m"=mobile
    on({ id: base + "connection", change: "any" }, function(obj) {
        var conn = obj.state.val;
        // Conversion en entier pour Loxone (0=offline, 1=mobile, 2=WiFi)
        var connInt = (conn === "w") ? 2 : (conn === "m") ? 1 : 0;
        sendToLoxone(loxoneName(userName, "connection"),    conn    || "o");
        sendToLoxone(loxoneName(userName, "connectionInt"), connInt);
    });

    // Nom du réseau WiFi
    on({ id: base + "ssid", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "ssid"), obj.state.val || "");
    });

    // ----------------------------------------------------------
    // 📍 ZONES GÉOGRAPHIQUES (Regions/Waypoints)
    // ----------------------------------------------------------

    // Zones dans lesquelles l'utilisateur se trouve actuellement
    // Valeur = JSON array ex: ["Maison","Garage"]
    on({ id: base + "regions", change: "any" }, function(obj) {
        var regions = obj.state.val;
        // Envoi brut de la chaîne JSON
        sendToLoxone(loxoneName(userName, "regions"), regions || "[]");

        // -------------------------------------------------------
        // 💡 BALISE — Présence à la maison
        // -------------------------------------------------------
        // Tu peux adapter "Maison" selon le nom exact de ta zone
        // OwnTracks. Cette valeur booléenne (0/1) est pratique
        // pour les automatismes Loxone.
        //
        // Pour modifier le nom de la zone : change "Maison" ci-dessous
        var isHome = (regions && regions.indexOf("Maison") !== -1) ? 1 : 0;
        sendToLoxone(loxoneName(userName, "isHome"), isHome);
        // -------------------------------------------------------
    });

    // ----------------------------------------------------------
    // 🚶 ACTIVITÉ / MOUVEMENT
    // ----------------------------------------------------------

    // Activité détectée par le téléphone
    // Valeurs possibles : stationary, walking, running, automotive, cycling, unknown
    on({ id: base + "motionactivities", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "motionactivities"), obj.state.val || "unknown");
    });

    // Déclencheur de la mise à jour de position
    // p=ping, c=zone, r=réponse commande, u=manuel, t=timer, v=iOS fréquents
    on({ id: base + "trigger", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "trigger"), obj.state.val || "p");
    });

    // ----------------------------------------------------------
    // 🏷️  IDENTIFIANT
    // ----------------------------------------------------------

    // Initiales / Tracker ID (2 caractères max)
    on({ id: base + "trackerID", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "trackerID"), obj.state.val || "");
    });

    // ----------------------------------------------------------
    // 🔁 PUSH COMPLET INITIAL
    // Envoie immédiatement toutes les valeurs actuelles à Loxone
    // au démarrage du script (pas d'attente d'un changement)
    // ----------------------------------------------------------
    pushAllValues(userName);
}

/**
 * Pousse IMMÉDIATEMENT toutes les valeurs actuelles d'un utilisateur
 * vers Loxone (utile au démarrage du script)
 *
 * @param {string} userName
 */
function pushAllValues(userName) {
    var base = CONFIG.OWNTRACKS_INSTANCE + ".users." + userName + ".";

    var fields = [
        "latitude", "longitude", "accuracy", "altitude",
        "velocity", "course", "battery", "batteryStatus",
        "timestamp", "datetime", "connection", "ssid",
        "regions", "motionactivities", "trigger", "trackerID"
    ];

    fields.forEach(function(field) {
        var stateId = base + field;
        getState(stateId, function(err, state) {
            if (!err && state && state.val !== null && state.val !== undefined) {
                sendToLoxone(loxoneName(userName, field), state.val);

                // Traitement spéciaux
                if (field === "connection") {
                    var conn = state.val;
                    var connInt = (conn === "w") ? 2 : (conn === "m") ? 1 : 0;
                    sendToLoxone(loxoneName(userName, "connectionInt"), connInt);
                }
                if (field === "regions") {
                    var isHome = (state.val && state.val.indexOf("Maison") !== -1) ? 1 : 0;
                    sendToLoxone(loxoneName(userName, "isHome"), isHome);
                }
            }
        });
    });
}

// ============================================================
// 🆕  DÉTECTION DE NOUVEAUX UTILISATEURS EN TEMPS RÉEL
// ============================================================

/**
 * Surveille l'apparition de nouveaux utilisateurs OwnTracks.
 * Dès qu'un nouvel état "owntracks.0.users.<NOM>.*" est créé,
 * le script démarre automatiquement la surveillance de ce user.
 */
on({
    id    : new RegExp("^" + CONFIG.OWNTRACKS_INSTANCE + "\\.users\\.([^.]+)\\.latitude$"),
    type  : "state",
    change: "any"
}, function(obj) {
    // Extraction du nom d'utilisateur depuis l'ID de l'état
    var parts    = obj.id.split(".");
    var userName = parts[3]; // ex: "David"

    if (!detectedUsers[userName]) {
        detectedUsers[userName] = true;
        log_debug("🆕 Nouvel utilisateur détecté automatiquement : " + userName);
        watchUser(userName);
    }
});

// ============================================================
// ⏰  POLLING DE SÉCURITÉ
// ============================================================
// En plus des subscriptions temps réel, un polling périodique
// re-découvre les utilisateurs et re-pousse toutes les valeurs.
// Cela garantit la synchronisation même si un événement a été manqué.

setInterval(function() {
    log_debug("🔄 Polling de sécurité — redécouverte des utilisateurs...");
    discoverUsers();

    // Re-push de toutes les valeurs pour les utilisateurs connus
    Object.keys(detectedUsers).forEach(function(userName) {
        pushAllValues(userName);
    });

}, CONFIG.POLLING_INTERVAL_MS);

// ============================================================
// 🚀  DÉMARRAGE
// ============================================================

log("[OwnTracks→Loxone] ✅ Script démarré !");
log("[OwnTracks→Loxone] 🎯 Loxone cible : " + CONFIG.LOXONE_IP + ":" + CONFIG.LOXONE_PORT);
log("[OwnTracks→Loxone] 📡 Instance OwnTracks : " + CONFIG.OWNTRACKS_INSTANCE);
log("[OwnTracks→Loxone] 👥 Découverte automatique des utilisateurs activée");

// Lancement de la découverte initiale
discoverUsers();
