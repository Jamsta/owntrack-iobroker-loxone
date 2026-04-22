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
    LOXONE_IP   : "LOXONE_IP",           // IP du Loxone Miniserver (ex: 192.168.1.100)
    LOXONE_PORT : 80,                     // Port HTTP (80 par défaut)
    LOXONE_USER : "LOXONE_USER",         // Utilisateur Loxone Config
    LOXONE_PASS : "LOXONE_PASS",         // Mot de passe Loxone

    // ----------------------------------------------------------
    // 🖥️  iBROKER — SERVEUR
    // ----------------------------------------------------------
    IOBROKER_IP   : "IOBROKER_IP",       // IP du serveur ioBroker (ex: 192.168.1.100)
    IOBROKER_PORT : 8081,                 // Port interface Admin ioBroker

    // ----------------------------------------------------------
    // 📡  ADAPTATEUR OWNTRACKS (MQTT interne ioBroker)
    // ----------------------------------------------------------
    OWNTRACKS_INSTANCE  : "owntracks.0", // Instance de l'adaptateur (ne pas changer)
    OWNTRACKS_MQTT_PORT : 1884,          // Port MQTT de l'adaptateur owntracks.0
    OWNTRACKS_USER      : "owntracks",   // Utilisateur MQTT OwnTracks
    OWNTRACKS_PASS      : "OWNTRACKS_PASS", // Mot de passe MQTT OwnTracks

    // ----------------------------------------------------------
    // 📡  ADAPTATEUR MQTT (broker mqtt.0 — port séparé)
    // ----------------------------------------------------------
    MQTT_BROKER_IP   : "MQTT_BROKER_IP", // IP du broker MQTT (souvent même IP qu'ioBroker)
    MQTT_BROKER_PORT : 1884,             // Port du broker mqtt.0
    MQTT_USER        : "owntracks",      // Utilisateur broker MQTT
    MQTT_PASS        : "MQTT_PASS",      // Mot de passe broker MQTT

    // ----------------------------------------------------------
    // 🔐  CHIFFREMENT OWNTRACKS (libsodium secretbox)
    // ----------------------------------------------------------
    // Active le chiffrement de bout en bout entre l'app et ioBroker.
    // La clé doit être identique dans l'app OwnTracks et dans l'adaptateur owntracks.0.
    //
    // ⚙️  Activation :
    //   1. ioBroker → owntracks.0 → Config → "Encryption key" → saisir la clé
    //   2. iPhone OwnTracks → Settings → Encryption → même clé
    //   3. Passer ENCRYPTION_ENABLED à true ici
    //
    // ⚠️  Clé max 32 caractères — même clé sur TOUS les appareils
    //
    ENCRYPTION_ENABLED : false,           // true = activer le chiffrement
    ENCRYPTION_KEY     : "",             // Clé secrète (max 32 caractères)

    // ----------------------------------------------------------
    // 📤  COMMANDES BIDIRECTIONNELLES (ioBroker → Téléphone)
    // ----------------------------------------------------------
    // Permet d'envoyer des commandes vers les iPhones via MQTT.
    // Voir owntracks/commands.md pour la documentation complète.
    //
    COMMANDS_ENABLED : true,             // true = activer les commandes
    //
    // DeviceID de chaque utilisateur (doit correspondre à l'app OwnTracks)
    // Settings → (compte) → Device ID
    DEVICES : {
        "Prenom1" : "iPhone",   // Topic: owntracks/Prenom1/iPhone/cmd
        "Prenom2" : "iPhone",   // Topic: owntracks/Prenom2/iPhone/cmd
        // "Prenom3" : "iPhone", // ← Décommenter pour ajouter un utilisateur
    },

    // ----------------------------------------------------------
    // 👥  UTILISATEURS OWNTRACKS
    // ----------------------------------------------------------
    // DeviceID configuré dans l'app OwnTracks sur chaque téléphone.
    // Ces noms servent de préfixe aux entrées virtuelles Loxone.
    // Ex : OT_Prenom1_latitude, OT_Prenom2_battery
    //
    // ✅ DÉTECTION AUTOMATIQUE : tout nouveau téléphone qui se connecte
    //    est détecté et ajouté automatiquement — pas besoin de modifier
    //    ce tableau pour les nouveaux utilisateurs.
    // 💡 Ce tableau sert uniquement à créer les états de commandes
    //    au démarrage du script pour les utilisateurs connus.
    USERS : [
        "Prenom1",    // Téléphone de la personne 1
        "Prenom2",    // Téléphone de la personne 2
        // "Prenom3", // ← Décommenter pour ajouter un utilisateur connu
    ],

    // ----------------------------------------------------------
    // 📍  ZONES GÉOGRAPHIQUES (Waypoints OwnTracks)
    // ----------------------------------------------------------
    // Noms EXACTS des zones configurées dans l'app OwnTracks.
    //
    // ⚠️  Ces noms sont UNIQUEMENT utilisés pour calculer isHome, isWork, etc.
    //     Les zones elles-mêmes sont créées MANUELLEMENT dans l'app OwnTracks
    //     (ou envoyées via la commande cmdSetWaypoints — voir commands.md).
    //     Elles ne sont PAS créées automatiquement par ce script.
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
