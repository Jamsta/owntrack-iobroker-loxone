/**
 * ============================================================
 *  SCRIPT : owntracks_to_loxone.js
 *  AUTEUR : Kevin (config) + GenSpark AI (génération)
 *  VERSION: 3.0.0
 *  DATE   : 2026-04-22
 * ============================================================
 *
 *  RÔLE DU SCRIPT
 *  --------------
 *  Ce script écoute TOUTES les données brutes envoyées par
 *  l'adaptateur OwnTracks (owntracks.0) vers ioBroker,
 *  et les pousse vers le Loxone Miniserver via HTTP Virtual Inputs.
 *
 *  NOUVEAUTÉS v3.0
 *  ---------------
 *  ✅ Chiffrement OwnTracks (libsodium secretbox) — optionnel
 *  ✅ Commandes bidirectionnelles ioBroker → Téléphone
 *     - reportLocation  : forcer un fix GPS immédiat
 *     - reportSteps     : demander le podomètre
 *     - setWaypoints    : envoyer/modifier des zones géo
 *     - setConfiguration: modifier la config de l'app à distance
 *     - restart         : redémarrer l'app OwnTracks
 *     - dump            : rapport d'état complet
 *  ✅ Helpers Loxone → commande (via Virtual HTTP Input dédiée)
 *
 *  PLATEFORME CIBLE : iOS UNIQUEMENT
 *  ----------------------------------
 *  Tous les champs disponibles sur iOS sont couverts :
 *   - _type=location    : position GPS + données étendues
 *   - _type=transition  : entrée/sortie de zones
 *   - _type=steps       : podomètre (pas marchés)
 *   - _type=lwt         : last will (déconnexion)
 *
 *  DÉTECTION AUTOMATIQUE DES UTILISATEURS
 *  ----------------------------------------
 *  Dès qu'un nouveau téléphone envoie sa position, il est
 *  détecté et ses données sont automatiquement poussées vers
 *  Loxone sans aucune configuration manuelle.
 *
 *  PHILOSOPHIE
 *  -----------
 *  - ZÉRO logique métier ici → c'est Loxone qui décide
 *  - TOUTES les données brutes iOS exposées telles quelles
 *  - Commentaires et balises pour modifier facilement
 *
 *  UTILISATION DANS iBROKER
 *  -------------------------
 *  Coller d'abord le contenu de config.js, puis ce fichier,
 *  dans un seul script JavaScript ioBroker.
 *
 *  ENTRÉES VIRTUELLES LOXONE À CRÉER
 *  -----------------------------------
 *  Voir le fichier : loxone/virtual_inputs.md
 *
 *  DOCUMENTATION DES COMMANDES
 *  ----------------------------
 *  Voir le fichier : owntracks/commands.md
 *
 * ============================================================
 */

// ============================================================
// ⚙️  CONFIGURATION — CHARGÉE DEPUIS config.js
// ============================================================
// ⚠️  NE PAS METTRE DE MOTS DE PASSE OU D'IPs ICI !
// Toutes les valeurs sont dans config.js (non publié sur GitHub)
//
// Fallback si config.js n'est pas collé avant ce script :
if (typeof CONFIG === 'undefined') {
    var CONFIG = {
        LOXONE_IP            : "LOXONE_IP",
        LOXONE_PORT          : 80,
        LOXONE_USER          : "LOXONE_USER",
        LOXONE_PASS          : "LOXONE_PASS",
        OWNTRACKS_INSTANCE   : "owntracks.0",
        MQTT_BROKER_IP       : "MQTT_BROKER_IP",
        MQTT_BROKER_PORT     : 1884,
        MQTT_USER            : "owntracks",
        MQTT_PASS            : "MQTT_PASS",
        ENCRYPTION_ENABLED   : false,
        ENCRYPTION_KEY       : "",
        COMMANDS_ENABLED     : true,
        DEVICES              : {},
        ZONES                : { HOME: "Maison" },
        POLLING_INTERVAL_MS  : 30000,
        DEBUG                : true,
    };
}

// ============================================================
// 📦  RÉFÉRENCE COMPLÈTE — DONNÉES iOS OwnTracks
// ============================================================
//
//  ── _type = location ──────────────────────────────────────
//  owntracks.0.users.<NOM>.
//    ├── [GPS]
//    │   ├── latitude          float   degrés        Latitude GPS
//    │   ├── longitude         float   degrés        Longitude GPS
//    │   ├── accuracy          int     mètres        Précision horizontale GPS
//    │   ├── altitude          int     mètres        Altitude / niveau mer
//    │   ├── verticalAccuracy  int     mètres        Précision verticale (alt)
//    │   ├── velocity          int     km/h          Vitesse de déplacement
//    │   ├── course            int     degrés        Cap / direction (0-360°)
//    │   └── pressure          float   kPa           Pression barométrique (extendedData)
//    ├── [BATTERIE]
//    │   ├── battery           int     %             Niveau batterie téléphone
//    │   └── batteryStatus     int     0-3           0=inconnu 1=débranché 2=charge 3=plein
//    ├── [HORODATAGE]
//    │   ├── timestamp         int     epoch         Timestamp UNIX de la position GPS
//    │   ├── created_at        int     epoch         Timestamp construction du message
//    │   └── datetime          string  ISO           Date/heure lisible
//    ├── [CONNECTIVITÉ]
//    │   ├── connection        string  w/m/o         Type: w=WiFi m=mobile o=offline
//    │   ├── connectionInt     int     0/1/2         0=offline 1=mobile 2=WiFi (numérique)
//    │   ├── ssid              string  —             Nom réseau WiFi
//    │   └── bssid             string  —             Adresse MAC point d'accès WiFi
//    ├── [ZONES GÉOGRAPHIQUES]
//    │   ├── inregions         string  JSON[]        Zones actuelles ex: ["Maison","Garage"]
//    │   ├── inrids            string  JSON[]        IDs des zones actuelles
//    │   ├── isHome            int     0/1           1=dans zone HOME configurée
//    │   └── regionRadius      int     mètres        Rayon de la zone lors enter/leave
//    ├── [ACTIVITÉ & MOUVEMENT]
//    │   ├── motionactivities  string  —             stationary/walking/running/automotive/cycling
//    │   └── monitoringMode    int     1/2           1=significant 2=move
//    ├── [DÉCLENCHEUR]
//    │   └── trigger           string  —             p=ping c=zone C=follow b=beacon r=cmd u=manuel t=timer v=iOS
//    ├── [POINT D'INTÉRÊT]
//    │   ├── poi               string  —             Nom du point d'intérêt
//    │   └── tag               string  —             Tag associé à la position
//    └── [IDENTIFIANT]
//        ├── trackerID         string  —             Initiales (2 car.) affichées carte
//        └── topic             string  —             Topic MQTT source
//
//  ── _type = transition ────────────────────────────────────
//  owntracks.0.users.<NOM>.
//    ├── lastTransitionEvent   string  enter/leave   Dernier événement zone
//    ├── lastTransitionRegion  string  —             Nom de la zone concernée
//    ├── lastTransitionRegionId string —             ID de la zone concernée
//    ├── lastTransitionLat     float   degrés        Lat où l'événement s'est produit
//    ├── lastTransitionLon     float   degrés        Lon où l'événement s'est produit
//    ├── lastTransitionAcc     int     mètres        Précision GPS à l'événement
//    ├── lastTransitionTst     int     epoch         Timestamp de l'événement
//    └── lastTransitionTrigger string c/b            c=géo-zone b=beacon
//
//  ── _type = steps ─────────────────────────────────────────
//  owntracks.0.users.<NOM>.
//    ├── steps                 int     pas           Nombre de pas (podomètre)
//    ├── stepsFrom             int     epoch         Début de la période mesurée
//    └── stepsTo               int     epoch         Fin de la période mesurée
//
//  ── _type = lwt ───────────────────────────────────────────
//  owntracks.0.users.<NOM>.
//    └── lastSeen              int     epoch         Dernier contact avec le téléphone
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
 * URL Loxone : http://<USER>:<PASS>@<IP>/dev/sps/io/<NOM_ENTREE>/<VALEUR>
 *
 * @param {string} inputName  - Nom exact de l'entrée virtuelle dans Loxone Config
 * @param {*}      value      - Valeur à envoyer
 */
function sendToLoxone(inputName, value) {
    if (value === null || value === undefined) return;

    var encodedValue = encodeURIComponent(String(value));

    var url = "http://" + CONFIG.LOXONE_USER + ":" + CONFIG.LOXONE_PASS
            + "@" + CONFIG.LOXONE_IP + ":" + CONFIG.LOXONE_PORT
            + "/dev/sps/io/" + inputName + "/" + encodedValue;

    log_debug("→ Loxone : " + inputName + " = " + value);

    require("http").get(url, function(res) {
        res.resume(); // fire and forget
    }).on("error", function(e) {
        log_error("Impossible d'envoyer à Loxone [" + inputName + "] : " + e.message);
    });
}

/**
 * Construit le nom de l'entrée virtuelle Loxone
 * Format : OT_<NOM_UTILISATEUR>_<CHAMP>
 * Exemples : OT_David_latitude / OT_Carole_battery / OT_Kevin_isHome
 *
 * ⚠️  Ces noms doivent correspondre EXACTEMENT aux entrées dans Loxone Config
 *
 * @param {string} userName  - DeviceID OwnTracks (ex: "Kevin")
 * @param {string} field     - Nom du champ
 * @returns {string}
 */
function loxoneName(userName, field) {
    return "OT_" + userName + "_" + field;
}

// ============================================================
// 🔐  CHIFFREMENT OWNTRACKS — INFORMATIONS
// ============================================================
//
//  OwnTracks utilise libsodium secretbox pour chiffrer les
//  payloads JSON. Le chiffrement est géré AUTOMATIQUEMENT
//  par l'adaptateur owntracks.0 d'ioBroker si la clé est
//  configurée dans l'adaptateur.
//
//  ÉTAPES DE CONFIGURATION DU CHIFFREMENT :
//
//  1. Dans ioBroker → Adaptateurs → owntracks.0 → Configuration
//     → Champ "Encryption key" → saisir la clé (max 32 cars)
//
//  2. Sur chaque iPhone OwnTracks :
//     → Settings → (nom du compte) → Encryption
//     → Activer et saisir la MÊME clé
//
//  3. Dans config.js de ce projet :
//     → ENCRYPTION_ENABLED : true
//     → ENCRYPTION_KEY     : "ta_clé_secrète"
//     (utilisé uniquement pour la documentation et le log)
//
//  ⚠️  IMPORTANT : une fois activé, tous les appareils doivent
//     utiliser la même clé. Un appareil sans clé sera ignoré.
//
//  Ce script ne fait PAS le déchiffrement lui-même — c'est
//  l'adaptateur owntracks.0 qui le fait en amont. Les états
//  ioBroker reçus ici sont déjà en clair.
//
if (CONFIG.ENCRYPTION_ENABLED) {
    log("[OwnTracks→Loxone] 🔐 Chiffrement : ACTIVÉ (libsodium secretbox)", "info");
    log("[OwnTracks→Loxone] 🔐 Clé configurée dans owntracks.0 et sur les iPhones", "info");
} else {
    log("[OwnTracks→Loxone] 🔓 Chiffrement : désactivé (réseau local uniquement)", "info");
}

// ============================================================
// 📤  COMMANDES BIDIRECTIONNELLES (ioBroker → Téléphone)
// ============================================================
//
//  Les commandes permettent à ioBroker (ou Loxone via une
//  entrée virtuelle) d'envoyer des instructions aux téléphones.
//
//  MÉCANISME :
//  -----------
//  ioBroker publie un message JSON sur le topic MQTT :
//    owntracks/<username>/<deviceId>/cmd
//
//  L'app OwnTracks sur le téléphone reçoit la commande et agit.
//
//  PRÉREQUIS :
//  -----------
//  L'adaptateur mqtt.0 doit être actif (port 1884)
//  Les DEVICES doivent être configurés dans config.js
//
// ============================================================

/**
 * Envoie une commande MQTT vers un téléphone OwnTracks
 *
 * @param {string} userName  - Nom de l'utilisateur (ex: "Kevin")
 * @param {object} payload   - Objet JSON de la commande OwnTracks
 *
 * Exemple :
 *   sendCommand("Kevin", { _type: "cmd", action: "reportLocation" })
 */
function sendCommand(userName, payload) {
    if (!CONFIG.COMMANDS_ENABLED) {
        log_debug("⚠️  Commandes désactivées (COMMANDS_ENABLED=false dans config.js)");
        return;
    }

    var deviceId = (CONFIG.DEVICES && CONFIG.DEVICES[userName])
                   ? CONFIG.DEVICES[userName]
                   : "iPhone";

    var topic   = "owntracks/" + userName + "/" + deviceId + "/cmd";
    var message = JSON.stringify(payload);

    log_debug("📤 Commande → " + userName + " [" + topic + "] : " + message);

    // Publication via l'adaptateur mqtt.0 d'ioBroker
    // sendTo() est l'API ioBroker pour envoyer à un adaptateur
    sendTo("mqtt.0", "sendMessage2Client", {
        topic   : topic,
        message : message
    }, function(result) {
        if (result && result.error) {
            log_error("Commande échouée pour " + userName + " : " + result.error);
        } else {
            log_debug("✅ Commande envoyée à " + userName);
        }
    });
}

// ============================================================
// 🎮  HELPERS DE COMMANDES — APPELS DIRECTS
// ============================================================
// Ces fonctions peuvent être appelées depuis :
//   - Ce script (ex: depuis un on() sur état Loxone)
//   - Un autre script ioBroker
//   - Un Blockly / règle d'automatisation ioBroker
//
// ────────────────────────────────────────────────────────────

/**
 * 📍 reportLocation — Force une mise à jour GPS immédiate
 *
 * Le téléphone envoie immédiatement sa position actuelle.
 * Utile pour forcer une synchro sans attendre le prochain cycle.
 *
 * Déclencheur Loxone suggéré : OT_CMD_reportLocation (entrée virtuelle)
 *
 * @param {string} userName
 */
function cmdReportLocation(userName) {
    log_debug("📍 Commande reportLocation → " + userName);
    sendCommand(userName, {
        _type  : "cmd",
        action : "reportLocation"
    });
}

/**
 * 👣 reportSteps — Demande le nombre de pas (podomètre)
 *
 * Le téléphone répond avec un message _type=steps contenant
 * les champs : steps, stepsFrom, stepsTo
 *
 * @param {string} userName
 */
function cmdReportSteps(userName) {
    log_debug("👣 Commande reportSteps → " + userName);
    sendCommand(userName, {
        _type  : "cmd",
        action : "reportSteps"
    });
}

/**
 * 🔄 restart — Redémarre l'application OwnTracks
 *
 * ⚠️  Utiliser avec précaution — interrompt brièvement le tracking
 *
 * @param {string} userName
 */
function cmdRestart(userName) {
    log_debug("🔄 Commande restart → " + userName);
    sendCommand(userName, {
        _type  : "cmd",
        action : "restart"
    });
}

/**
 * 📊 dump — Demande un rapport complet d'état
 *
 * Le téléphone répond avec une configuration complète incluant :
 * waypoints, configuration actuelle, et état de l'app.
 *
 * @param {string} userName
 */
function cmdDump(userName) {
    log_debug("📊 Commande dump → " + userName);
    sendCommand(userName, {
        _type  : "cmd",
        action : "dump"
    });
}

/**
 * 🗺️  setWaypoints — Envoie/met à jour des zones géographiques
 *
 * Permet d'ajouter ou modifier des zones (waypoints) sur le
 * téléphone à distance, sans intervention manuelle.
 *
 * @param {string} userName
 * @param {Array}  waypoints - Tableau d'objets waypoint OwnTracks
 *
 * Exemple de waypoint :
 * {
 *   _type : "waypoint",
 *   desc  : "Maison",          // Nom de la zone
 *   lat   : 48.8566,           // Latitude centre
 *   lon   : 2.3522,            // Longitude centre
 *   rad   : 100,               // Rayon en mètres
 *   tst   : 1700000000         // Timestamp (epoch) — utiliser Date.now()/1000
 * }
 */
function cmdSetWaypoints(userName, waypoints) {
    if (!Array.isArray(waypoints) || waypoints.length === 0) {
        log_error("cmdSetWaypoints : tableau de waypoints invalide ou vide");
        return;
    }
    log_debug("🗺️  Commande setWaypoints → " + userName + " (" + waypoints.length + " zones)");
    sendCommand(userName, {
        _type     : "cmd",
        action    : "setWaypoints",
        waypoints : {
            _type     : "waypoints",
            waypoints : waypoints
        }
    });
}

/**
 * ⚙️  setConfiguration — Modifie la configuration de l'app à distance
 *
 * ⚠️  Utiliser avec précaution — change le comportement de l'app
 * Voir owntracks/commands.md pour la liste complète des paramètres
 *
 * @param {string} userName
 * @param {object} configParams - Paramètres à modifier
 *
 * Exemple : changer le mode de monitoring
 *   cmdSetConfiguration("Kevin", { monitoring: 2 })
 *   → 1 = significant change (économie batterie)
 *   → 2 = move mode (précis, consomme plus)
 */
function cmdSetConfiguration(userName, configParams) {
    log_debug("⚙️  Commande setConfiguration → " + userName);
    var payload = Object.assign({
        _type  : "cmd",
        action : "setConfiguration",
        configuration : Object.assign({ _type: "configuration" }, configParams)
    });
    sendCommand(userName, payload);
}

// ============================================================
// 🔗  ÉCOUTE DES ENTRÉES VIRTUELLES LOXONE → COMMANDES
// ============================================================
//
//  Ces on() écoutent des états ioBroker qui sont mis à jour
//  quand Loxone envoie une valeur via une entrée virtuelle.
//
//  Pour que ça fonctionne, il faut :
//   1. Créer des états ioBroker de type "virtual" (javascript.0.OT_CMD_*)
//   2. Créer des entrées Loxone → ioBroker via l'adaptateur loxone.0
//      OU utiliser des scripts ioBroker déclenchés par Loxone
//
//  💡 Voir owntracks/commands.md section "Intégration Loxone"
//
// ────────────────────────────────────────────────────────────

if (CONFIG.COMMANDS_ENABLED) {

    // ----------------------------------------------------------
    // 📍 OT_CMD_reportLocation_<userName>
    // ----------------------------------------------------------
    // Entrée virtuelle dans Loxone Config :
    //   Nom : OT_CMD_reportLocation_Kevin
    //   Envoyer 1 pour déclencher la commande
    // ----------------------------------------------------------
    (CONFIG.USERS || []).forEach(function(userName) {

        // Créer l'état ioBroker s'il n'existe pas
        createState("OT_CMD_reportLocation_" + userName, 0, {
            name : "Commande: forcer GPS pour " + userName,
            type : "number", role: "button", read: true, write: true
        });
        createState("OT_CMD_reportSteps_" + userName, 0, {
            name : "Commande: demander podomètre pour " + userName,
            type : "number", role: "button", read: true, write: true
        });
        createState("OT_CMD_restart_" + userName, 0, {
            name : "Commande: redémarrer OwnTracks pour " + userName,
            type : "number", role: "button", read: true, write: true
        });
        createState("OT_CMD_dump_" + userName, 0, {
            name : "Commande: dump état pour " + userName,
            type : "number", role: "button", read: true, write: true
        });

        // Écoute des états de commande
        // → Déclenché quand Loxone (ou script) met la valeur à 1

        on({ id: "javascript.0.OT_CMD_reportLocation_" + userName, change: "any" }, function(obj) {
            if (obj.state.val === 1 || obj.state.val === true) {
                cmdReportLocation(userName);
                // Remettre à 0 après déclenchement (bouton)
                setState("OT_CMD_reportLocation_" + userName, 0, true);
            }
        });

        on({ id: "javascript.0.OT_CMD_reportSteps_" + userName, change: "any" }, function(obj) {
            if (obj.state.val === 1 || obj.state.val === true) {
                cmdReportSteps(userName);
                setState("OT_CMD_reportSteps_" + userName, 0, true);
            }
        });

        on({ id: "javascript.0.OT_CMD_restart_" + userName, change: "any" }, function(obj) {
            if (obj.state.val === 1 || obj.state.val === true) {
                cmdRestart(userName);
                setState("OT_CMD_restart_" + userName, 0, true);
            }
        });

        on({ id: "javascript.0.OT_CMD_dump_" + userName, change: "any" }, function(obj) {
            if (obj.state.val === 1 || obj.state.val === true) {
                cmdDump(userName);
                setState("OT_CMD_dump_" + userName, 0, true);
            }
        });

        log_debug("🎮 États de commandes créés pour : " + userName);
    });
}

// ============================================================
// 👥  GESTION DYNAMIQUE DES UTILISATEURS
// ============================================================

var detectedUsers = {};

/**
 * Découverte de tous les utilisateurs OwnTracks connus dans ioBroker
 */
function discoverUsers() {
    getObjectView("system", "state", {
        startkey : CONFIG.OWNTRACKS_INSTANCE + ".users.",
        endkey   : CONFIG.OWNTRACKS_INSTANCE + ".users.\u9999"
    }, function(err, objects) {
        if (err || !objects || !objects.rows) {
            log_debug("Aucun utilisateur OwnTracks trouvé pour l'instant.");
            return;
        }
        objects.rows.forEach(function(row) {
            if (row && row.id) {
                var parts    = row.id.split(".");
                var userName = parts[3];
                if (userName && !detectedUsers[userName]) {
                    detectedUsers[userName] = true;
                    log_debug("✅ Utilisateur détecté : " + userName);
                    watchUser(userName);
                }
            }
        });
    });
}

// ============================================================
// 👁️  SURVEILLANCE COMPLÈTE D'UN UTILISATEUR (iOS)
// ============================================================

/**
 * Souscrit à TOUS les états ioBroker d'un utilisateur OwnTracks iOS
 * et pousse chaque changement vers Loxone en temps réel.
 *
 * @param {string} userName - DeviceID OwnTracks (ex: "Kevin")
 */
function watchUser(userName) {
    var base = CONFIG.OWNTRACKS_INSTANCE + ".users." + userName + ".";
    log_debug("👁️  Surveillance activée pour : " + userName);

    // ==========================================================
    // 📍  POSITION GPS
    // ==========================================================

    // Latitude GPS (float, degrés)
    on({ id: base + "latitude", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "latitude"), obj.state.val);
    });

    // Longitude GPS (float, degrés)
    on({ id: base + "longitude", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "longitude"), obj.state.val);
    });

    // Précision horizontale GPS (int, mètres) — plus petit = meilleur
    on({ id: base + "accuracy", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "accuracy"), obj.state.val);
    });

    // Altitude au-dessus du niveau de la mer (int, mètres)
    on({ id: base + "altitude", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "altitude"), obj.state.val || 0);
    });

    // Précision verticale de l'altitude (int, mètres) — iOS uniquement
    on({ id: base + "verticalAccuracy", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "verticalAccuracy"), obj.state.val || 0);
    });

    // Vitesse de déplacement (int, km/h)
    on({ id: base + "velocity", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "velocity"), obj.state.val || 0);
    });

    // Cap / Direction de déplacement (int, degrés 0-360°) — iOS uniquement
    on({ id: base + "course", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "course"), obj.state.val || 0);
    });

    // Pression barométrique (float, kPa) — iOS uniquement, nécessite extendedData=true
    on({ id: base + "pressure", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "pressure"), obj.state.val || 0);
    });

    // ==========================================================
    // 🔋  BATTERIE TÉLÉPHONE
    // ==========================================================

    // Niveau de batterie (int, %)
    on({ id: base + "battery", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "battery"), obj.state.val);
    });

    // État de la batterie (int) : 0=inconnu / 1=débranché / 2=en charge / 3=plein
    on({ id: base + "batteryStatus", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "batteryStatus"), obj.state.val || 0);
    });

    // ==========================================================
    // ⏱️  HORODATAGE
    // ==========================================================

    // Timestamp UNIX du fix GPS (int, secondes epoch)
    on({ id: base + "timestamp", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "timestamp"), obj.state.val);
    });

    // Timestamp UNIX de construction du message (int, secondes epoch) — iOS uniquement
    // Peut différer de timestamp si le fix GPS est en cache
    on({ id: base + "created_at", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "created_at"), obj.state.val || 0);
    });

    // Date/heure lisible (string, format ISO)
    on({ id: base + "datetime", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "datetime"), obj.state.val);
    });

    // ==========================================================
    // 📶  CONNECTIVITÉ RÉSEAU
    // ==========================================================

    // Type de connexion Internet (string) : "w"=WiFi / "m"=mobile / "o"=offline
    // Nécessite extendedData=true dans l'app
    on({ id: base + "connection", change: "any" }, function(obj) {
        var conn    = obj.state.val;
        var connInt = (conn === "w") ? 2 : (conn === "m") ? 1 : 0;
        sendToLoxone(loxoneName(userName, "connection"),    conn || "o");
        // Version numérique pour faciliter les conditions dans Loxone
        // 0=offline / 1=mobile / 2=WiFi
        sendToLoxone(loxoneName(userName, "connectionInt"), connInt);
    });

    // Nom du réseau WiFi (string) — iOS uniquement
    on({ id: base + "ssid", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "ssid"), obj.state.val || "");
    });

    // Adresse MAC du point d'accès WiFi (string) — iOS uniquement
    on({ id: base + "bssid", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "bssid"), obj.state.val || "");
    });

    // ==========================================================
    // 📍  ZONES GÉOGRAPHIQUES (Regions / Waypoints)
    // ==========================================================

    // Liste des zones dans lesquelles l'utilisateur se trouve (string JSON array)
    // Exemple : ["Maison","Garage"] ou []
    on({ id: base + "inregions", change: "any" }, function(obj) {
        var regions = obj.state.val;
        sendToLoxone(loxoneName(userName, "inregions"), regions || "[]");

        // -------------------------------------------------------
        // 💡 BALISE — Présence à la maison (0 ou 1)
        // -------------------------------------------------------
        // Nom de la zone configuré dans config.js → ZONES.HOME
        // Modifier uniquement dans config.js
        var homeZone = (CONFIG.ZONES && CONFIG.ZONES.HOME) ? CONFIG.ZONES.HOME : "Maison";
        var isHome   = (regions && regions.indexOf(homeZone) !== -1) ? 1 : 0;
        sendToLoxone(loxoneName(userName, "isHome"), isHome);
        // -------------------------------------------------------
    });

    // Liste des IDs de zones (string JSON array) — iOS uniquement
    // Exemple : ["6da9cf","3defa7"]
    on({ id: base + "inrids", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "inrids"), obj.state.val || "[]");
    });

    // Rayon de la zone lors d'un enter/leave (int, mètres) — iOS uniquement
    on({ id: base + "regionRadius", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "regionRadius"), obj.state.val || 0);
    });

    // ==========================================================
    // 🚶  ACTIVITÉ & MOUVEMENT
    // ==========================================================

    // Activité détectée par CoreMotion iOS (string)
    // Valeurs : stationary / walking / running / automotive / cycling / unknown
    on({ id: base + "motionactivities", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "motionactivities"), obj.state.val || "unknown");
    });

    // Mode de surveillance GPS au moment de la mise à jour (int) — iOS uniquement
    // 1 = significant (économique) / 2 = move (précis, consomme plus)
    on({ id: base + "monitoringMode", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "monitoringMode"), obj.state.val || 0);
    });

    // ==========================================================
    // 🎯  DÉCLENCHEUR DE LA MISE À JOUR
    // ==========================================================

    // Raison de la mise à jour de position (string)
    // p=ping auto / c=zone circulaire / C=follow zone / b=beacon
    // r=réponse commande / u=manuel utilisateur / t=timer move mode / v=iOS frequent locations
    on({ id: base + "trigger", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "trigger"), obj.state.val || "p");
    });

    // ==========================================================
    // 📌  POINT D'INTÉRÊT
    // ==========================================================

    // Nom du point d'intérêt associé à la position (string) — iOS uniquement
    on({ id: base + "poi", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "poi"), obj.state.val || "");
    });

    // Tag associé à la position (string) — iOS uniquement
    on({ id: base + "tag", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "tag"), obj.state.val || "");
    });

    // ==========================================================
    // 🏷️  IDENTIFIANT UTILISATEUR
    // ==========================================================

    // Initiales affichées sur la carte OwnTracks (string, 2 caractères max)
    on({ id: base + "trackerID", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "trackerID"), obj.state.val || "");
    });

    // Topic MQTT source (string) — présent dans les payloads HTTP
    on({ id: base + "topic", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "topic"), obj.state.val || "");
    });

    // ==========================================================
    // 🔔  TRANSITIONS (entrée/sortie de zones) — iOS uniquement
    // ==========================================================
    // Ces états sont mis à jour par l'adaptateur OwnTracks
    // lors de la réception d'un message _type=transition

    // Dernier événement de zone (string) : "enter" ou "leave"
    on({ id: base + "lastTransitionEvent", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "lastTransitionEvent"), obj.state.val || "");
        // Version numérique : 1=enter / 0=leave (plus simple pour Loxone)
        var eventInt = (obj.state.val === "enter") ? 1 : 0;
        sendToLoxone(loxoneName(userName, "lastTransitionEventInt"), eventInt);
    });

    // Nom de la zone concernée par la dernière transition (string)
    on({ id: base + "lastTransitionRegion", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "lastTransitionRegion"), obj.state.val || "");
    });

    // ID de la zone concernée par la dernière transition (string) — iOS uniquement
    on({ id: base + "lastTransitionRegionId", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "lastTransitionRegionId"), obj.state.val || "");
    });

    // Latitude de l'événement de transition (float, degrés)
    on({ id: base + "lastTransitionLat", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "lastTransitionLat"), obj.state.val || 0);
    });

    // Longitude de l'événement de transition (float, degrés)
    on({ id: base + "lastTransitionLon", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "lastTransitionLon"), obj.state.val || 0);
    });

    // Précision GPS à l'événement de transition (int, mètres)
    on({ id: base + "lastTransitionAcc", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "lastTransitionAcc"), obj.state.val || 0);
    });

    // Timestamp de la dernière transition (int, epoch)
    on({ id: base + "lastTransitionTst", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "lastTransitionTst"), obj.state.val || 0);
    });

    // Déclencheur de la transition (string) : "c"=zone géo / "b"=beacon
    on({ id: base + "lastTransitionTrigger", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "lastTransitionTrigger"), obj.state.val || "");
    });

    // ==========================================================
    // 👣  PODOMÈTRE (steps) — iOS uniquement
    // ==========================================================

    // Nombre de pas marchés sur la période (int)
    // -1 si l'appareil ne supporte pas le podomètre
    on({ id: base + "steps", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "steps"), obj.state.val || 0);
    });

    // Timestamp début de la période de mesure des pas (int, epoch)
    on({ id: base + "stepsFrom", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "stepsFrom"), obj.state.val || 0);
    });

    // Timestamp fin de la période de mesure des pas (int, epoch)
    on({ id: base + "stepsTo", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "stepsTo"), obj.state.val || 0);
    });

    // ==========================================================
    // 📡  LAST WILL & TESTAMENT (lwt) — déconnexion téléphone
    // ==========================================================

    // Timestamp du dernier contact connu avec le téléphone (int, epoch)
    // Mis à jour par le broker MQTT quand le téléphone se déconnecte
    on({ id: base + "lastSeen", change: "any" }, function(obj) {
        sendToLoxone(loxoneName(userName, "lastSeen"), obj.state.val || 0);
        // Calcul du temps écoulé depuis le dernier contact (secondes)
        var elapsed = obj.state.val ? Math.floor(Date.now() / 1000) - obj.state.val : 0;
        sendToLoxone(loxoneName(userName, "lastSeenElapsed"), elapsed);
    });

    // ==========================================================
    // 🔁  PUSH COMPLET INITIAL AU DÉMARRAGE
    // ==========================================================
    // Envoie immédiatement toutes les valeurs actuelles vers Loxone
    // sans attendre un changement (utile au redémarrage du script)
    pushAllValues(userName);
}

// ============================================================
// 📤  PUSH COMPLET DE TOUTES LES VALEURS
// ============================================================

/**
 * Lit tous les états ioBroker d'un utilisateur et les envoie à Loxone
 * Appelé au démarrage et lors du polling de sécurité
 *
 * @param {string} userName
 */
function pushAllValues(userName) {
    var base = CONFIG.OWNTRACKS_INSTANCE + ".users." + userName + ".";

    // Liste exhaustive de tous les champs iOS
    var fields = [
        // GPS
        "latitude", "longitude", "accuracy", "altitude",
        "verticalAccuracy", "velocity", "course", "pressure",
        // Batterie
        "battery", "batteryStatus",
        // Horodatage
        "timestamp", "created_at", "datetime",
        // Connectivité
        "connection", "ssid", "bssid",
        // Zones
        "inregions", "inrids", "regionRadius",
        // Activité
        "motionactivities", "monitoringMode",
        // Déclencheur
        "trigger",
        // Point d'intérêt
        "poi", "tag",
        // Identifiant
        "trackerID", "topic",
        // Transitions
        "lastTransitionEvent", "lastTransitionRegion", "lastTransitionRegionId",
        "lastTransitionLat", "lastTransitionLon", "lastTransitionAcc",
        "lastTransitionTst", "lastTransitionTrigger",
        // Podomètre
        "steps", "stepsFrom", "stepsTo",
        // Last Will
        "lastSeen"
    ];

    fields.forEach(function(field) {
        getState(base + field, function(err, state) {
            if (err || !state || state.val === null || state.val === undefined) return;

            sendToLoxone(loxoneName(userName, field), state.val);

            // Traitements dérivés
            if (field === "connection") {
                var conn    = state.val;
                var connInt = (conn === "w") ? 2 : (conn === "m") ? 1 : 0;
                sendToLoxone(loxoneName(userName, "connectionInt"), connInt);
            }
            if (field === "inregions") {
                var homeZone = (CONFIG.ZONES && CONFIG.ZONES.HOME) ? CONFIG.ZONES.HOME : "Maison";
                var isHome   = (state.val && state.val.indexOf(homeZone) !== -1) ? 1 : 0;
                sendToLoxone(loxoneName(userName, "isHome"), isHome);
            }
            if (field === "lastTransitionEvent") {
                var eventInt = (state.val === "enter") ? 1 : 0;
                sendToLoxone(loxoneName(userName, "lastTransitionEventInt"), eventInt);
            }
            if (field === "lastSeen") {
                var elapsed = state.val ? Math.floor(Date.now() / 1000) - state.val : 0;
                sendToLoxone(loxoneName(userName, "lastSeenElapsed"), elapsed);
            }
        });
    });
}

// ============================================================
// 🆕  DÉTECTION AUTOMATIQUE DES NOUVEAUX UTILISATEURS
// ============================================================

// Dès qu'un nouveau téléphone envoie sa première latitude,
// le script le détecte et démarre automatiquement sa surveillance
on({
    id    : new RegExp("^" + CONFIG.OWNTRACKS_INSTANCE.replace(".", "\\.") + "\\.users\\.([^.]+)\\.latitude$"),
    type  : "state",
    change: "any"
}, function(obj) {
    var parts    = obj.id.split(".");
    var userName = parts[3];
    if (userName && !detectedUsers[userName]) {
        detectedUsers[userName] = true;
        log_debug("🆕 Nouvel utilisateur détecté automatiquement : " + userName);
        watchUser(userName);
    }
});

// ============================================================
// ⏰  POLLING DE SÉCURITÉ
// ============================================================
// Re-découverte des utilisateurs + re-push complet toutes les
// POLLING_INTERVAL_MS millisecondes (défaut : 30 secondes)
// Garantit la synchronisation même si un événement a été manqué

setInterval(function() {
    log_debug("🔄 Polling de sécurité — synchronisation Loxone...");
    discoverUsers();
    Object.keys(detectedUsers).forEach(function(userName) {
        pushAllValues(userName);
    });
}, CONFIG.POLLING_INTERVAL_MS);

// ============================================================
// 🚀  DÉMARRAGE
// ============================================================

log("[OwnTracks→Loxone] ✅ Script v3.0 démarré !");
log("[OwnTracks→Loxone] 🎯 Loxone    : " + CONFIG.LOXONE_IP + ":" + CONFIG.LOXONE_PORT);
log("[OwnTracks→Loxone] 📡 OwnTracks : " + CONFIG.OWNTRACKS_INSTANCE);
log("[OwnTracks→Loxone] 🏠 Zone HOME : " + ((CONFIG.ZONES && CONFIG.ZONES.HOME) ? CONFIG.ZONES.HOME : "Maison"));
log("[OwnTracks→Loxone] 📱 Plateforme cible : iOS");
log("[OwnTracks→Loxone] 👥 Découverte automatique des utilisateurs activée");
log("[OwnTracks→Loxone] 🔐 Chiffrement : " + (CONFIG.ENCRYPTION_ENABLED ? "ACTIVÉ" : "désactivé"));
log("[OwnTracks→Loxone] 🎮 Commandes  : " + (CONFIG.COMMANDS_ENABLED ? "ACTIVÉES" : "désactivées"));

discoverUsers();
