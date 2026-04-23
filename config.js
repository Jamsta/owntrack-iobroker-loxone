/**
 * ============================================================
 *  FICHIER : config.js
 *  PROJET  : OwnTracks → ioBroker → Loxone
 *  VERSION : 5.4
 * ============================================================
 *
 *  INSTRUCTIONS
 *  ------------
 *  1. Cloner le dépôt → ce fichier contient des PLACEHOLDERS
 *  2. Remplacer toutes les valeurs PLACEHOLDER par tes vraies
 *     IPs, identifiants et mots de passe
 *  3. Lancer : node build.js
 *  4. Coller deploy/owntracks_complet.js dans ioBroker
 *
 *  ⚠️  NE JAMAIS committer ce fichier une fois rempli avec
 *  tes données réelles — ajouter config.js dans .gitignore
 *
 * ============================================================
 */

const CONFIG = {

    // ----------------------------------------------------------
    // 🏠  LOXONE MINISERVER
    // ----------------------------------------------------------
    LOXONE_IP   : "LOXONE_IP",           // IP du Loxone Miniserver (ex: 192.168.1.100)
    LOXONE_PORT : 80,                    // Port HTTP (80 par défaut)
    LOXONE_USER : "LOXONE_USER",         // Utilisateur Loxone Config
    LOXONE_PASS : "LOXONE_PASS",         // Mot de passe Loxone

    // ----------------------------------------------------------
    // 🖥️  iBROKER — SERVEUR
    // ----------------------------------------------------------
    IOBROKER_IP   : "IOBROKER_IP",      // IP du serveur ioBroker (ex: 192.168.1.100)
    IOBROKER_PORT : 8081,               // Port interface Admin ioBroker

    // ----------------------------------------------------------
    // 📡  OWNTRACKS — identifiants MQTT
    // ----------------------------------------------------------
    // UserID et mot de passe configurés dans l'app OwnTracks
    // (Settings → Connection → Authentication)
    OWNTRACKS_USER : "owntracks",       // UserID MQTT (même dans l'app)
    OWNTRACKS_PASS : "OWNTRACKS_PASS",  // Mot de passe MQTT OwnTracks

    // ----------------------------------------------------------
    // 📡  ADAPTATEUR MQTT (broker mqtt.0 — port séparé)
    // ----------------------------------------------------------
    MQTT_BROKER_IP   : "MQTT_BROKER_IP", // IP du broker MQTT (souvent même machine qu'ioBroker)
    MQTT_BROKER_PORT : 1884,            // Port du broker mqtt.0
    MQTT_USER        : "owntracks",     // Utilisateur broker MQTT
    MQTT_PASS        : "MQTT_PASS",     // Mot de passe broker MQTT

    // ----------------------------------------------------------
    // 🔐  CHIFFREMENT OWNTRACKS (optionnel — libsodium secretbox)
    // ----------------------------------------------------------
    // Active le chiffrement bout-en-bout entre l'app et ioBroker.
    // La clé doit être identique dans l'app (Settings → Encryption)
    // et dans ce fichier. Max 32 caractères.
    //
    ENCRYPTION_ENABLED : false,         // true = activer le chiffrement
    ENCRYPTION_KEY     : "",            // Clé secrète (max 32 caractères)

    // ----------------------------------------------------------
    // 📤  COMMANDES BIDIRECTIONNELLES (ioBroker → Téléphone)
    // ----------------------------------------------------------
    // Permet d'envoyer des commandes depuis ioBroker/Loxone
    // vers les téléphones OwnTracks via MQTT.
    //
    // ⚙️  Commandes disponibles :
    //   reportLocation  → Forcer une mise à jour GPS immédiate
    //   reportSteps     → Demander le nombre de pas
    //   setWaypoints    → Envoyer/mettre à jour des zones géo
    //   setConfiguration → Modifier la config de l'app à distance
    //   restart         → Redémarrer l'app OwnTracks
    //   dump            → Demander un rapport complet de l'état
    //
    // 💡 Voir owntracks/commands.md pour la documentation complète
    //
    COMMANDS_ENABLED : true,            // true = activer les commandes
    //
    // DEVICES : DeviceID configuré dans l'app OwnTracks (Settings → DeviceID)
    // Doit correspondre exactement, en minuscules.
    DEVICES : {
        "kevin"  : "kevin",   // DeviceID = kevin
        "carole" : "carole",  // DeviceID = carole
        // "david" : "david", // ← Ajouter quand l'iPhone de David sera configuré
    },

    // ----------------------------------------------------------
    // 👥  UTILISATEURS OWNTRACKS
    // ----------------------------------------------------------
    // DeviceID de chaque téléphone — sert de préfixe aux entrées Loxone
    // Ex : OT_kevin_latitude, OT_carole_battery
    USERS : [
        "kevin",   // Téléphone de Kevin
        "carole",  // Téléphone de Carole
        // "david", // ← Décommenter quand l'iPhone de David sera configuré
    ],

    // ----------------------------------------------------------
    // 📍  ZONES GÉOGRAPHIQUES (Waypoints OwnTracks)
    // ----------------------------------------------------------
    // Noms EXACTS des zones configurées dans l'app OwnTracks
    // Utilisés pour calculer isHome, isWork, etc.
    ZONES : {
        HOME : "Maison",         // ← Nom exact de la zone "maison" dans OwnTracks
        WORK : "Ecole Gustave",  // ← Nom exact de la zone "travail" dans OwnTracks
        // Ajouter d'autres zones ici si besoin
    },

    // ----------------------------------------------------------
    // 📐  COORDONNÉES GPS DE LA MAISON (pour distanceHome)
    // ----------------------------------------------------------
    // Utilisées pour calculer OT_<user>_distanceHome en temps réel.
    // Renseigner les coordonnées GPS exactes de ta maison.
    // (Les mêmes que dans ta zone "Maison" dans OwnTracks)
    HOME_LAT : 0.0,    // ← Latitude  de ta maison  ex: 44.701515
    HOME_LON : 0.0,    // ← Longitude de ta maison  ex: -0.846425

    // ----------------------------------------------------------
    // ⚙️  PARAMÈTRES DU SCRIPT
    // ----------------------------------------------------------
    POLLING_INTERVAL_MS : 30000,   // Polling de sécurité (30 secondes)
    DEBUG               : true,    // true = logs détaillés dans ioBroker

};

// ─────────────────────────────────────────────────────────────
// NE PAS MODIFIER SOUS CETTE LIGNE
// ─────────────────────────────────────────────────────────────
// Export pour utilisation dans owntracks_to_loxone.js
// (en environnement ioBroker, les variables sont accessibles directement)
