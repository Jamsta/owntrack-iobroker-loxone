/**
 * ============================================================
 *  SCRIPT : owntracks_to_loxone.js
 *  AUTEUR : Kevin (config) + GenSpark AI (génération)
 *  VERSION: 5.0.0
 *  DATE   : 2026-04-23
 * ============================================================
 *
 *  RÔLE DU SCRIPT
 *  --------------
 *  Ce script lit le JSON brut publié par OwnTracks iOS depuis
 *  mqtt.0 et pousse TOUS les champs vers Loxone via HTTP
 *  Virtual Inputs.
 *
 *  NOUVEAUTÉS v5.0
 *  ---------------
 *  ✅ Source de données : mqtt.0 (JSON brut complet)
 *     → Tous les champs iOS disponibles (19+ champs)
 *     → owntracks.0 ne remontait que 6 champs — problème résolu
 *  ✅ Parsing JSON direct depuis mqtt.0.owntracks.owntracks.<user>
 *  ✅ Détection automatique des utilisateurs depuis mqtt.0
 *  ✅ Commandes bidirectionnelles conservées (mqtt.0 port 1884)
 *  ✅ Support _type=location, transition, steps, lwt
 *
 *  ARCHITECTURE
 *  ------------
 *  iPhone → MQTT (port 1883) → owntracks.0 (parse protocol)
 *  iPhone → MQTT (port 1883) → mqtt.0 (JSON brut complet) ← ON LIT ICI
 *  ioBroker → mqtt.0 (port 1884) → iPhone (commandes cmd)
 *
 *  CHEMIN mqtt.0
 *  -------------
 *  Topic iPhone  : owntracks/owntracks/kevin
 *  État ioBroker : mqtt.0.owntracks.owntracks.kevin
 *  Valeur        : {"_type":"location","lat":44.7,"lon":-0.8,...}
 *
 *  PLATEFORME CIBLE : iOS UNIQUEMENT
 *  ----------------------------------
 *  Champs _type=location disponibles :
 *   acc, alt, batt, bs, cog, conn, inregions, inrids,
 *   lat, lon, m, motionactivities, p, t, tag, tid,
 *   tst, vac, vel + dérivés : isHome, connectionInt,
 *   lastSeenElapsed, datetime
 *
 *  UTILISATION DANS iBROKER
 *  -------------------------
 *  Coller d'abord config.js puis ce fichier dans un seul script.
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
        res.resume();
    }).on("error", function(e) {
        log_error("Impossible d'envoyer à Loxone [" + inputName + "] : " + e.message);
    });
}

/**
 * Construit le nom de l'entrée virtuelle Loxone
 * Format : OT_<NOM_UTILISATEUR>_<CHAMP>
 * Exemples : OT_kevin_latitude / OT_carole_battery / OT_kevin_isHome
 *
 * @param {string} userName
 * @param {string} field
 * @returns {string}
 */
function loxoneName(userName, field) {
    return "OT_" + userName + "_" + field;
}

// ============================================================
// 🔐  CHIFFREMENT OWNTRACKS
// ============================================================
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
//  Topic de commande : owntracks/<OWNTRACKS_USER>/<DeviceID>/cmd
//  Exemple           : owntracks/owntracks/kevin/cmd
//
//  OWNTRACKS_USER = CONFIG.OWNTRACKS_USER (UserID dans l'app)
//  DeviceID       = CONFIG.DEVICES[userName] ou userName
//
// ============================================================

/**
 * Construit le topic de commande MQTT pour un utilisateur
 * Format : owntracks/<MQTT_USER>/<DeviceID>/cmd
 *
 * @param {string} userName
 * @returns {string}
 */
function resolveCommandTopic(userName) {
    var deviceId = (CONFIG.DEVICES && CONFIG.DEVICES[userName])
        ? CONFIG.DEVICES[userName]
        : userName;
    var mqttUser = CONFIG.OWNTRACKS_USER || "owntracks";
    return "owntracks/" + mqttUser + "/" + deviceId;
}

/**
 * Envoie une commande MQTT vers un téléphone OwnTracks
 *
 * @param {string} userName  - Nom de l'utilisateur (ex: "kevin")
 * @param {object} payload   - Objet JSON de la commande OwnTracks
 */
function sendCommand(userName, payload) {
    if (!CONFIG.COMMANDS_ENABLED) {
        log_debug("⚠️  Commandes désactivées (COMMANDS_ENABLED=false dans config.js)");
        return;
    }

    var baseTopic = resolveCommandTopic(userName);
    var topic     = baseTopic + "/cmd";
    var message   = JSON.stringify(payload);

    log_debug("📤 Commande → " + userName + " [" + topic + "] : " + message);

    sendTo("mqtt.0", "sendMessage2Client", {
        topic   : topic,
        message : message
    }, function(result) {
        if (result && result.error) {
            log_error("Commande échouée pour " + userName + " : " + result.error);
        } else {
            log_debug("✅ Commande envoyée à " + userName + " → topic: " + topic);
        }
    });
}

// ============================================================
// 🎮  HELPERS DE COMMANDES
// ============================================================

function cmdReportLocation(userName) {
    log_debug("📍 Commande reportLocation → " + userName);
    sendCommand(userName, { _type: "cmd", action: "reportLocation" });
}

function cmdReportSteps(userName) {
    log_debug("👣 Commande reportSteps → " + userName);
    sendCommand(userName, { _type: "cmd", action: "reportSteps" });
}

function cmdRestart(userName) {
    log_debug("🔄 Commande restart → " + userName);
    sendCommand(userName, { _type: "cmd", action: "restart" });
}

function cmdDump(userName) {
    log_debug("📊 Commande dump → " + userName);
    sendCommand(userName, { _type: "cmd", action: "dump" });
}

function cmdSetWaypoints(userName, waypoints) {
    if (!Array.isArray(waypoints) || waypoints.length === 0) {
        log_error("cmdSetWaypoints : tableau de waypoints invalide ou vide");
        return;
    }
    log_debug("🗺️  Commande setWaypoints → " + userName + " (" + waypoints.length + " zones)");
    sendCommand(userName, {
        _type     : "cmd",
        action    : "setWaypoints",
        waypoints : { _type: "waypoints", waypoints: waypoints }
    });
}

function cmdSetConfiguration(userName, configParams) {
    log_debug("⚙️  Commande setConfiguration → " + userName);
    sendCommand(userName, {
        _type         : "cmd",
        action        : "setConfiguration",
        configuration : Object.assign({ _type: "configuration" }, configParams)
    });
}

// ============================================================
// 🎮  ÉTATS DE COMMANDES ioBroker (déclencheurs Loxone)
// ============================================================

if (CONFIG.COMMANDS_ENABLED) {
    (CONFIG.USERS || []).forEach(function(userName) {

        createState("OT_CMD_reportLocation_" + userName, 0, {
            name: "Commande: forcer GPS pour " + userName,
            type: "number", role: "button", read: true, write: true
        });
        createState("OT_CMD_reportSteps_" + userName, 0, {
            name: "Commande: demander podomètre pour " + userName,
            type: "number", role: "button", read: true, write: true
        });
        createState("OT_CMD_restart_" + userName, 0, {
            name: "Commande: redémarrer OwnTracks pour " + userName,
            type: "number", role: "button", read: true, write: true
        });
        createState("OT_CMD_dump_" + userName, 0, {
            name: "Commande: dump état pour " + userName,
            type: "number", role: "button", read: true, write: true
        });

        on({ id: "javascript.0.OT_CMD_reportLocation_" + userName, change: "any" }, function(obj) {
            if (obj.state.val == 1 || obj.state.val === true) {
                cmdReportLocation(userName);
                setState("OT_CMD_reportLocation_" + userName, 0, true);
            }
        });
        on({ id: "javascript.0.OT_CMD_reportSteps_" + userName, change: "any" }, function(obj) {
            if (obj.state.val == 1 || obj.state.val === true) {
                cmdReportSteps(userName);
                setState("OT_CMD_reportSteps_" + userName, 0, true);
            }
        });
        on({ id: "javascript.0.OT_CMD_restart_" + userName, change: "any" }, function(obj) {
            if (obj.state.val == 1 || obj.state.val === true) {
                cmdRestart(userName);
                setState("OT_CMD_restart_" + userName, 0, true);
            }
        });
        on({ id: "javascript.0.OT_CMD_dump_" + userName, change: "any" }, function(obj) {
            if (obj.state.val == 1 || obj.state.val === true) {
                cmdDump(userName);
                setState("OT_CMD_dump_" + userName, 0, true);
            }
        });

        log_debug("🎮 États de commandes créés pour : " + userName);
    });
}

// ============================================================
// 🔄  PARSING ET ENVOI DES DONNÉES iOS VERS LOXONE
// ============================================================
//
//  Source : mqtt.0.owntracks.owntracks.<userName>
//  Format : JSON brut OwnTracks (tous les champs iOS)
//
//  Champs _type=location :
//    lat, lon, acc, alt, vac, vel, cog, p       → GPS + capteurs
//    batt, bs                                    → Batterie
//    tst, created_at                             → Horodatage
//    conn, ssid, bssid                           → Réseau
//    inregions, inrids, tid, tag, t, m           → Zones + meta
//    motionactivities                            → Activité
//
//  Champs calculés ajoutés par le script :
//    isHome          → 1 si dans CONFIG.ZONES.HOME
//    connectionInt   → 0=offline / 1=mobile / 2=WiFi
//    datetime        → date lisible depuis tst
//    lastSeenElapsed → secondes depuis dernier contact
//
// ============================================================

/**
 * Parse et envoie toutes les données d'un payload OwnTracks vers Loxone
 *
 * @param {string} userName  - Nom de l'utilisateur
 * @param {string} rawJson   - JSON brut reçu depuis mqtt.0
 */
function processPayload(userName, rawJson) {
    var data;
    try {
        data = JSON.parse(rawJson);
    } catch(e) {
        log_error("JSON invalide pour " + userName + " : " + e.message);
        return;
    }

    if (!data || !data._type) {
        log_debug("Payload sans _type ignoré pour " + userName);
        return;
    }

    log_debug("📨 Payload reçu pour " + userName + " (_type=" + data._type + ")");

    // ── _type = location ──────────────────────────────────────
    if (data._type === "location") {

        // GPS
        if (data.lat  !== undefined) sendToLoxone(loxoneName(userName, "latitude"),         data.lat);
        if (data.lon  !== undefined) sendToLoxone(loxoneName(userName, "longitude"),        data.lon);
        if (data.acc  !== undefined) sendToLoxone(loxoneName(userName, "accuracy"),         data.acc);
        if (data.alt  !== undefined) sendToLoxone(loxoneName(userName, "altitude"),         data.alt);
        if (data.vac  !== undefined) sendToLoxone(loxoneName(userName, "verticalAccuracy"), data.vac);
        if (data.vel  !== undefined) sendToLoxone(loxoneName(userName, "velocity"),         data.vel);
        if (data.cog  !== undefined) sendToLoxone(loxoneName(userName, "course"),           data.cog);
        if (data.p    !== undefined) sendToLoxone(loxoneName(userName, "pressure"),         data.p);

        // Batterie
        if (data.batt !== undefined) sendToLoxone(loxoneName(userName, "battery"),       data.batt);
        if (data.bs   !== undefined) sendToLoxone(loxoneName(userName, "batteryStatus"), data.bs);

        // Horodatage
        if (data.tst !== undefined) {
            sendToLoxone(loxoneName(userName, "timestamp"), data.tst);
            // Date lisible calculée depuis le timestamp
            var d  = new Date(data.tst * 1000);
            var dt = d.toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
            sendToLoxone(loxoneName(userName, "datetime"), dt);
        }
        if (data.created_at !== undefined) sendToLoxone(loxoneName(userName, "created_at"), data.created_at);

        // Connectivité
        if (data.conn !== undefined) {
            sendToLoxone(loxoneName(userName, "connection"), data.conn);
            var connInt = (data.conn === "w") ? 2 : (data.conn === "m") ? 1 : 0;
            sendToLoxone(loxoneName(userName, "connectionInt"), connInt);
        }
        if (data.ssid  !== undefined) sendToLoxone(loxoneName(userName, "ssid"),  data.ssid);
        if (data.bssid !== undefined) sendToLoxone(loxoneName(userName, "bssid"), data.bssid);

        // Zones géographiques
        if (data.inregions !== undefined) {
            var regions = Array.isArray(data.inregions)
                ? JSON.stringify(data.inregions)
                : data.inregions;
            sendToLoxone(loxoneName(userName, "inregions"), regions);

            // isHome calculé depuis CONFIG.ZONES.HOME
            var homeZone = (CONFIG.ZONES && CONFIG.ZONES.HOME) ? CONFIG.ZONES.HOME : "Maison";
            var isHome   = (Array.isArray(data.inregions) && data.inregions.indexOf(homeZone) !== -1) ? 1 : 0;
            sendToLoxone(loxoneName(userName, "isHome"), isHome);
        }
        if (data.inrids !== undefined) {
            sendToLoxone(loxoneName(userName, "inrids"),
                Array.isArray(data.inrids) ? JSON.stringify(data.inrids) : data.inrids);
        }

        // Activité & Mouvement
        if (data.motionactivities !== undefined) {
            sendToLoxone(loxoneName(userName, "motionactivities"),
                Array.isArray(data.motionactivities)
                    ? data.motionactivities.join(",")
                    : data.motionactivities);
        }
        if (data.m !== undefined) sendToLoxone(loxoneName(userName, "monitoringMode"), data.m);

        // Déclencheur
        if (data.t   !== undefined) sendToLoxone(loxoneName(userName, "trigger"),   data.t);

        // Point d'intérêt
        if (data.tag !== undefined) sendToLoxone(loxoneName(userName, "tag"), data.tag);
        if (data.poi !== undefined) sendToLoxone(loxoneName(userName, "poi"), data.poi);

        // Identifiant
        if (data.tid !== undefined) sendToLoxone(loxoneName(userName, "trackerID"), data.tid);

        // Topic source
        sendToLoxone(loxoneName(userName, "topic"),
            "owntracks/" + (CONFIG.OWNTRACKS_USER || "owntracks") + "/" + userName);
    }

    // ── _type = transition ────────────────────────────────────
    else if (data._type === "transition") {
        if (data.event !== undefined) {
            sendToLoxone(loxoneName(userName, "lastTransitionEvent"), data.event);
            sendToLoxone(loxoneName(userName, "lastTransitionEventInt"), data.event === "enter" ? 1 : 0);
        }
        if (data.desc !== undefined) sendToLoxone(loxoneName(userName, "lastTransitionRegion"),   data.desc);
        if (data.rid  !== undefined) sendToLoxone(loxoneName(userName, "lastTransitionRegionId"), data.rid);
        if (data.lat  !== undefined) sendToLoxone(loxoneName(userName, "lastTransitionLat"),      data.lat);
        if (data.lon  !== undefined) sendToLoxone(loxoneName(userName, "lastTransitionLon"),      data.lon);
        if (data.acc  !== undefined) sendToLoxone(loxoneName(userName, "lastTransitionAcc"),      data.acc);
        if (data.tst  !== undefined) sendToLoxone(loxoneName(userName, "lastTransitionTst"),      data.tst);
        if (data.t    !== undefined) sendToLoxone(loxoneName(userName, "lastTransitionTrigger"),  data.t);
    }

    // ── _type = steps ─────────────────────────────────────────
    else if (data._type === "steps") {
        if (data.steps !== undefined) sendToLoxone(loxoneName(userName, "steps"),     data.steps);
        if (data.from  !== undefined) sendToLoxone(loxoneName(userName, "stepsFrom"), data.from);
        if (data.to    !== undefined) sendToLoxone(loxoneName(userName, "stepsTo"),   data.to);
    }

    // ── _type = lwt ───────────────────────────────────────────
    else if (data._type === "lwt") {
        var now     = Math.floor(Date.now() / 1000);
        var elapsed = data.tst ? now - data.tst : 0;
        sendToLoxone(loxoneName(userName, "lastSeen"),        data.tst || now);
        sendToLoxone(loxoneName(userName, "lastSeenElapsed"), elapsed);
    }
}

// ============================================================
// 👥  GESTION DYNAMIQUE DES UTILISATEURS
// ============================================================

var detectedUsers = {};

/**
 * Construit le chemin ioBroker mqtt.0 depuis le userName
 * Topic  : owntracks/<OWNTRACKS_USER>/<userName>
 * Chemin : mqtt.0.owntracks.<OWNTRACKS_USER>.<userName>
 *
 * @param {string} userName
 * @returns {string}
 */
function mqttPath(userName) {
    var mqttUser = CONFIG.OWNTRACKS_USER || "owntracks";
    return "mqtt.0.owntracks." + mqttUser + "." + userName;
}

/**
 * Découverte des utilisateurs existants dans mqtt.0
 * Pattern : mqtt.0.owntracks.<OWTTRACKS_USER>.*
 */
function discoverUsers() {
    var mqttUser = CONFIG.OWNTRACKS_USER || "owntracks";
    var pattern  = "mqtt.0.owntracks." + mqttUser + ".*";

    try {
        var ids = $(pattern);
        if (!ids || ids.length === 0) {
            log_debug("Aucun utilisateur OwnTracks dans mqtt.0 (téléphone connecté ?)");
            return;
        }
        ids.each(function(id) {
            // mqtt.0.owntracks.owntracks.kevin → parts[3] = kevin
            var parts    = id.split(".");
            var userName = parts[3];
            // Ignorer les sous-chemins (cmd, status...)
            if (userName && parts.length === 4 && !detectedUsers[userName]) {
                detectedUsers[userName] = true;
                log_debug("✅ Utilisateur détecté : " + userName);
                watchUser(userName);
            }
        });
    } catch(e) {
        log_debug("discoverUsers : " + e.message);
    }
}

/**
 * Surveille le chemin mqtt.0 d'un utilisateur
 * Déclenché à chaque nouveau payload JSON reçu
 *
 * @param {string} userName
 */
function watchUser(userName) {
    var path = mqttPath(userName);
    log_debug("👁️  Surveillance mqtt.0 activée pour : " + userName + " [" + path + "]");

    on({ id: path, change: "any" }, function(obj) {
        if (obj.state && obj.state.val) {
            processPayload(userName, obj.state.val);
        }
    });

    // Push initial — envoie les données actuelles dès le démarrage
    getState(path, function(err, state) {
        if (!err && state && state.val) {
            log_debug("📤 Push initial pour : " + userName);
            processPayload(userName, state.val);
        }
    });
}

// ============================================================
// 🆕  DÉTECTION AUTOMATIQUE DES NOUVEAUX UTILISATEURS
// ============================================================
// Dès qu'un nouveau téléphone publie pour la première fois,
// son chemin mqtt.0 est créé et le script le détecte

on({
    id    : new RegExp("^mqtt\\.0\\.owntracks\\." +
                (CONFIG.OWNTRACKS_USER || "owntracks").replace(".", "\\.") +
                "\\.[^.]+$"),
    type  : "state",
    change: "any"
}, function(obj) {
    var parts    = obj.id.split(".");
    var userName = parts[3];
    if (userName && parts.length === 4 && !detectedUsers[userName]) {
        detectedUsers[userName] = true;
        log_debug("🆕 Nouvel utilisateur détecté automatiquement : " + userName);
        watchUser(userName);
    }
});

// ============================================================
// ⏰  POLLING DE SÉCURITÉ
// ============================================================

setInterval(function() {
    log_debug("🔄 Polling de sécurité — synchronisation Loxone...");
    discoverUsers();
    Object.keys(detectedUsers).forEach(function(userName) {
        var path = mqttPath(userName);
        getState(path, function(err, state) {
            if (!err && state && state.val) {
                processPayload(userName, state.val);
            }
        });
    });
}, CONFIG.POLLING_INTERVAL_MS);

// ============================================================
// 🚀  DÉMARRAGE
// ============================================================

log("[OwnTracks→Loxone] ✅ Script v5.0 démarré !", "info");
log("[OwnTracks→Loxone] 🎯 Loxone    : " + CONFIG.LOXONE_IP + ":" + CONFIG.LOXONE_PORT, "info");
log("[OwnTracks→Loxone] 📡 Source    : mqtt.0 (JSON brut — tous les champs iOS)", "info");
log("[OwnTracks→Loxone] 🏠 Zone HOME : " + ((CONFIG.ZONES && CONFIG.ZONES.HOME) ? CONFIG.ZONES.HOME : "Maison"), "info");
log("[OwnTracks→Loxone] 📱 Plateforme cible : iOS", "info");
log("[OwnTracks→Loxone] 👥 Découverte automatique des utilisateurs activée", "info");
log("[OwnTracks→Loxone] 🔐 Chiffrement : " + (CONFIG.ENCRYPTION_ENABLED ? "ACTIVÉ" : "désactivé"), "info");
log("[OwnTracks→Loxone] 🎮 Commandes  : " + (CONFIG.COMMANDS_ENABLED ? "ACTIVÉES" : "désactivées"), "info");

discoverUsers();
