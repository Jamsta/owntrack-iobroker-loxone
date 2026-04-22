/**
 * ============================================================
 *  SCRIPT : owntracks_to_loxone.js
 *  AUTEUR : Kevin (config) + GenSpark AI (génération)
 *  VERSION: 5.3.0
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

            // Nombre de zones actives
            var regionCount = Array.isArray(data.inregions) ? data.inregions.length : 0;
            sendToLoxone(loxoneName(userName, "inregionsCount"), regionCount);

            // isHome — zone maison (CONFIG.ZONES.HOME)
            var homeZone = (CONFIG.ZONES && CONFIG.ZONES.HOME) ? CONFIG.ZONES.HOME : "Maison";
            var isHome   = (Array.isArray(data.inregions) && data.inregions.indexOf(homeZone) !== -1) ? 1 : 0;
            sendToLoxone(loxoneName(userName, "isHome"), isHome);

            // isWork — zone travail (CONFIG.ZONES.WORK) — optionnel
            if (CONFIG.ZONES && CONFIG.ZONES.WORK) {
                var isWork = (Array.isArray(data.inregions) && data.inregions.indexOf(CONFIG.ZONES.WORK) !== -1) ? 1 : 0;
                sendToLoxone(loxoneName(userName, "isWork"), isWork);
            }

            // Zone active courante (première de la liste, ou vide)
            var currentZone = (Array.isArray(data.inregions) && data.inregions.length > 0)
                ? data.inregions[0]
                : "";
            sendToLoxone(loxoneName(userName, "currentZone"), currentZone);
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
        // Podomètre iOS (envoyé après cmdReportSteps ou automatiquement)
        if (data.steps      !== undefined) sendToLoxone(loxoneName(userName, "steps"),       data.steps);
        if (data.from       !== undefined) sendToLoxone(loxoneName(userName, "stepsFrom"),   data.from);
        if (data.to         !== undefined) sendToLoxone(loxoneName(userName, "stepsTo"),     data.to);
        if (data.distance   !== undefined) sendToLoxone(loxoneName(userName, "stepsDistance"),  data.distance);
        if (data.floorsup   !== undefined) sendToLoxone(loxoneName(userName, "stepsFloorsUp"),  data.floorsup);
        if (data.floorsdown !== undefined) sendToLoxone(loxoneName(userName, "stepsFloorsDown"),data.floorsdown);
        if (data.tst        !== undefined) sendToLoxone(loxoneName(userName, "stepsTst"),    data.tst);
    }

    // ── _type = waypoint ──────────────────────────────────────
    // Reçu quand l'utilisateur crée/modifie une zone dans l'app
    else if (data._type === "waypoint") {
        // Stocker la dernière zone créée/modifiée
        if (data.desc !== undefined) sendToLoxone(loxoneName(userName, "lastWaypointDesc"), data.desc);
        if (data.lat  !== undefined) sendToLoxone(loxoneName(userName, "lastWaypointLat"),  data.lat);
        if (data.lon  !== undefined) sendToLoxone(loxoneName(userName, "lastWaypointLon"),  data.lon);
        if (data.rad  !== undefined) sendToLoxone(loxoneName(userName, "lastWaypointRad"),  data.rad);
        if (data.rid  !== undefined) sendToLoxone(loxoneName(userName, "lastWaypointRid"),  data.rid);
        if (data.tst  !== undefined) sendToLoxone(loxoneName(userName, "lastWaypointTst"),  data.tst);
        log_debug("🗺️  Waypoint reçu : " + (data.desc || "?") + " r=" + (data.rad || "?") + "m");
    }

    // ── _type = dump ──────────────────────────────────────────
    // Reçu en réponse à cmdDump — contient la config complète de l'app
    else if (data._type === "dump") {
        var conf = data.configuration || {};
        // Infos utiles extraites de la config
        if (conf.deviceId  !== undefined) sendToLoxone(loxoneName(userName, "deviceId"),     conf.deviceId);
        if (conf.tid       !== undefined) sendToLoxone(loxoneName(userName, "trackerID"),     conf.tid);
        if (conf.monitoring !== undefined) sendToLoxone(loxoneName(userName, "monitoringMode"), conf.monitoring);
        if (conf.extendedData !== undefined) sendToLoxone(loxoneName(userName, "extendedData"), conf.extendedData ? 1 : 0);
        if (conf.cmd       !== undefined) sendToLoxone(loxoneName(userName, "cmdEnabled"),    conf.cmd ? 1 : 0);
        // Nombre de waypoints configurés sur l'iPhone
        if (conf.waypoints !== undefined) sendToLoxone(loxoneName(userName, "waypointsCount"), conf.waypoints.length);
        log_debug("📊 Dump reçu pour " + userName + " — " + (conf.waypoints ? conf.waypoints.length : 0) + " waypoint(s)");
    }

    // ── _type = status ────────────────────────────────────────
    // Reçu en réponse à cmdDump ou au démarrage de l'app
    else if (data._type === "status") {
        var ios = data.iOS || {};
        if (ios.deviceModel         !== undefined) sendToLoxone(loxoneName(userName, "deviceModel"),    ios.deviceModel);
        if (ios.deviceSystemVersion !== undefined) sendToLoxone(loxoneName(userName, "iOSVersion"),     ios.deviceSystemVersion);
        if (ios.version             !== undefined) sendToLoxone(loxoneName(userName, "appVersion"),     ios.version);
        if (ios.locale              !== undefined) sendToLoxone(loxoneName(userName, "locale"),         ios.locale);
        if (ios.backgroundRefreshStatus !== undefined) {
            var bgOk = ios.backgroundRefreshStatus === "UIBackgroundRefreshStatusAvailable" ? 1 : 0;
            sendToLoxone(loxoneName(userName, "backgroundRefresh"), bgOk);
        }
        if (ios.locationManagerAuthorizationStatus !== undefined) {
            var gpsOk = ios.locationManagerAuthorizationStatus === "kCLAuthorizationStatusAuthorizedAlways" ? 1 : 0;
            sendToLoxone(loxoneName(userName, "gpsAuthorized"), gpsOk);
        }
        log_debug("📱 Status reçu pour " + userName + " — iOS " + (ios.deviceSystemVersion || "?") + " / OwnTracks " + (ios.version || "?"));
    }

    // ── _type = lwt ───────────────────────────────────────────
    else if (data._type === "lwt") {
        var now     = Math.floor(Date.now() / 1000);
        var elapsed = data.tst ? now - data.tst : 0;
        sendToLoxone(loxoneName(userName, "lastSeen"),        data.tst || now);
        sendToLoxone(loxoneName(userName, "lastSeenElapsed"), elapsed);
    }

    // ── _type inconnu ─────────────────────────────────────────
    else {
        log_debug("⚠️  Payload _type=" + data._type + " non géré pour " + userName);
    }
}

// ============================================================
// 👥  GESTION DYNAMIQUE DES UTILISATEURS
// ============================================================

var detectedUsers = {};

/**
 * Construit le chemin ioBroker mqtt.0 (topic principal location)
 * Topic  : owntracks/<OWNTRACKS_USER>/<userName>
 * Chemin : mqtt.0.owntracks.<OWNTRACKS_USER>.<userName>
 */
function mqttPath(userName) {
    var mqttUser = CONFIG.OWNTRACKS_USER || "owntracks";
    return "mqtt.0.owntracks." + mqttUser + "." + userName;
}

/**
 * Sous-topics mqtt.0 créés automatiquement par l'adaptateur
 * pour chaque utilisateur (un état par type de message reçu)
 *
 * Structure observée dans ioBroker :
 *   mqtt.0.owntracks.owntracks.kevin           ← _type=location
 *   mqtt.0.owntracks.owntracks.kevin.cmd       ← (null — commandes sortantes)
 *   mqtt.0.owntracks.owntracks.kevin.dump      ← _type=dump
 *   mqtt.0.owntracks.owntracks.kevin.status    ← _type=status
 *   mqtt.0.owntracks.owntracks.kevin.step      ← _type=steps
 *   mqtt.0.owntracks.owntracks.kevin.waypoint  ← _type=waypoint
 */
function mqttSubPaths(userName) {
    var base = mqttPath(userName);
    return [
        base,
        base + ".dump",
        base + ".status",
        base + ".step",
        base + ".waypoint"
        // base + ".cmd" ignoré — c'est une sortie, pas une entrée
    ];
}

/**
 * Surveille TOUS les sous-topics mqtt.0 d'un utilisateur
 * + push initial au démarrage pour chaque sous-topic
 */
function watchUser(userName) {
    var paths = mqttSubPaths(userName);
    var base  = mqttPath(userName);
    log_debug("👁️  Surveillance mqtt.0 activée pour : " + userName + " [" + base + ".*]");

    paths.forEach(function(p) {
        on({ id: p, change: "any" }, function(obj) {
            if (obj.state && obj.state.val) {
                processPayload(userName, obj.state.val);
            }
        });

        // Push initial — données déjà présentes dans ioBroker au démarrage
        getState(p, function(err, state) {
            if (!err && state && state.val) {
                log_debug("📤 Push initial [" + p.split(".").pop() + "] → " + userName);
                processPayload(userName, state.val);
            }
        });
    });
}

/**
 * Initialise les utilisateurs depuis CONFIG.USERS (garanti au démarrage)
 * + découverte dynamique dans mqtt.0 pour les téléphones inconnus
 */
function discoverUsers() {
    // ── 1. Utilisateurs connus depuis CONFIG.USERS ─────────────
    (CONFIG.USERS || []).forEach(function(userName) {
        if (!detectedUsers[userName]) {
            detectedUsers[userName] = true;
            log_debug("✅ Utilisateur initialisé (CONFIG.USERS) : " + userName);
            watchUser(userName);
        }
    });

    // ── 2. Découverte dynamique dans mqtt.0 ────────────────────
    var mqttUser = CONFIG.OWNTRACKS_USER || "owntracks";
    try {
        var ids = $("mqtt.0.owntracks." + mqttUser + ".*");
        if (ids && ids.length > 0) {
            ids.each(function(id) {
                var parts    = id.split(".");
                var userName = parts[3]; // mqtt.0.owntracks.owntracks.<userName>[.<sub>]
                if (userName && !detectedUsers[userName]) {
                    detectedUsers[userName] = true;
                    log_debug("🆕 Téléphone découvert dans mqtt.0 : " + userName);
                    watchUser(userName);
                }
            });
        }
    } catch(e) {
        log_debug("discoverUsers (mqtt.0 scan) : " + e.message);
    }
}

// ============================================================
// 🆕  DÉTECTION AUTOMATIQUE DES NOUVEAUX TÉLÉPHONES
// ============================================================
// Dès qu'un nouveau téléphone publie pour la première fois,
// il est détecté via la regex sur mqtt.0 et ajouté dynamiquement

on({
    id    : new RegExp("^mqtt\\.0\\.owntracks\\." +
                (CONFIG.OWNTRACKS_USER || "owntracks").replace(".", "\\.") +
                "\\.[^.]+"),   // matche kevin ET kevin.dump, kevin.status, etc.
    type  : "state",
    change: "any"
}, function(obj) {
    var parts    = obj.id.split(".");
    var userName = parts[3];
    if (userName && !detectedUsers[userName]) {
        detectedUsers[userName] = true;
        log_debug("🆕 Nouveau téléphone détecté automatiquement : " + userName);
        watchUser(userName);
    }
});

// ============================================================
// ⏰  POLLING DE SÉCURITÉ
// ============================================================

setInterval(function() {
    log_debug("🔄 Polling de sécurité — synchronisation Loxone...");
    // Re-découverte (nouveaux téléphones éventuels)
    discoverUsers();
    // Re-push de TOUS les sous-topics vers Loxone
    Object.keys(detectedUsers).forEach(function(userName) {
        mqttSubPaths(userName).forEach(function(p) {
            getState(p, function(err, state) {
                if (!err && state && state.val) {
                    processPayload(userName, state.val);
                }
            });
        });
    });
}, CONFIG.POLLING_INTERVAL_MS);

// ============================================================
// 🚀  DÉMARRAGE
// ============================================================

log("[OwnTracks→Loxone] ✅ Script v5.3 démarré !", "info");
log("[OwnTracks→Loxone] 🎯 Loxone    : " + CONFIG.LOXONE_IP + ":" + CONFIG.LOXONE_PORT, "info");
log("[OwnTracks→Loxone] 📡 Source    : mqtt.0 (JSON brut — tous les champs iOS)", "info");
log("[OwnTracks→Loxone] 🏠 Zone HOME : " + ((CONFIG.ZONES && CONFIG.ZONES.HOME) ? CONFIG.ZONES.HOME : "Maison"), "info");
log("[OwnTracks→Loxone] 📱 Plateforme cible : iOS", "info");
log("[OwnTracks→Loxone] 👥 Découverte automatique des utilisateurs activée", "info");
log("[OwnTracks→Loxone] 🔐 Chiffrement : " + (CONFIG.ENCRYPTION_ENABLED ? "ACTIVÉ" : "désactivé"), "info");
log("[OwnTracks→Loxone] 🎮 Commandes  : " + (CONFIG.COMMANDS_ENABLED ? "ACTIVÉES" : "désactivées"), "info");

discoverUsers();
