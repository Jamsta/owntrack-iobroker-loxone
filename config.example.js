/**
 * ============================================================
 *  FICHIER : config.example.js
 *  ✅  FICHIER PUBLIC — SAFE À PARTAGER / COMMITTER SUR GITHUB
 * ============================================================
 *
 *  Modèle de configuration pour le projet OwnTracks → ioBroker → Loxone
 *
 *  INSTRUCTIONS :
 *  1. Copier ce fichier et le renommer en "config.js"
 *  2. Remplir toutes les valeurs avec tes propres paramètres
 *  3. Ne jamais committer config.js sur GitHub (déjà dans .gitignore)
 *
 * ============================================================
 */

const CONFIG = {

    // ----------------------------------------------------------
    // 🏠  LOXONE MINISERVER
    // ----------------------------------------------------------
    LOXONE_IP   : "192.168.X.X",       // IP du Loxone Miniserver sur ton réseau
    LOXONE_PORT : 80,                   // Port HTTP (80 par défaut)
    LOXONE_USER : "admin",              // Utilisateur Loxone Config
    LOXONE_PASS : "TON_MOT_DE_PASSE",  // Mot de passe Loxone

    // ----------------------------------------------------------
    // 🖥️  iBROKER — SERVEUR
    // ----------------------------------------------------------
    IOBROKER_IP   : "192.168.X.X",     // IP du serveur ioBroker
    IOBROKER_PORT : 8081,              // Port interface Admin ioBroker

    // ----------------------------------------------------------
    // 📡  ADAPTATEUR OWNTRACKS (MQTT interne ioBroker)
    // ----------------------------------------------------------
    OWNTRACKS_INSTANCE  : "owntracks.0",       // Instance de l'adaptateur (ne pas changer)
    OWNTRACKS_MQTT_PORT : 1883,                // Port MQTT de l'adaptateur owntracks.0
    OWNTRACKS_USER      : "owntracks",         // Utilisateur MQTT OwnTracks
    OWNTRACKS_PASS      : "TON_MOT_DE_PASSE", // Mot de passe MQTT OwnTracks

    // ----------------------------------------------------------
    // 📡  ADAPTATEUR MQTT (broker mqtt.0 — port séparé)
    // ----------------------------------------------------------
    MQTT_BROKER_PORT : 1884,                   // Port du broker mqtt.0
    MQTT_USER        : "owntracks",            // Utilisateur broker MQTT
    MQTT_PASS        : "TON_MOT_DE_PASSE",    // Mot de passe broker MQTT

    // ----------------------------------------------------------
    // 👥  UTILISATEURS OWNTRACKS
    // ----------------------------------------------------------
    // DeviceID configuré dans l'app OwnTracks sur chaque téléphone
    // Ces noms servent de préfixe aux entrées virtuelles Loxone
    // Ex : OT_David_latitude, OT_Carole_battery
    USERS : [
        "Prenom1",    // Téléphone de la personne 1
        "Prenom2",    // Téléphone de la personne 2
        // "Prenom3", // ← Décommenter pour ajouter un utilisateur
    ],

    // ----------------------------------------------------------
    // 📍  ZONES GÉOGRAPHIQUES (Waypoints OwnTracks)
    // ----------------------------------------------------------
    // Noms EXACTS des zones configurées dans l'app OwnTracks
    ZONES : {
        HOME : "Maison",    // ← Nom exact de ta zone "maison" dans OwnTracks
        // WORK : "Bureau", // ← Décommenter si tu crées une zone bureau
    },

    // ----------------------------------------------------------
    // ⚙️  PARAMÈTRES DU SCRIPT
    // ----------------------------------------------------------
    POLLING_INTERVAL_MS : 30000,   // Polling de sécurité en ms (30000 = 30 secondes)
    DEBUG               : true,    // true = logs détaillés dans ioBroker / false = silencieux

};
