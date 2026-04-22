# OwnTracks → ioBroker → Loxone

## Description

Ce projet fournit un script ioBroker qui récupère **toutes les données brutes**
envoyées par l'application **OwnTracks** (géolocalisation des téléphones) et les
pousse automatiquement vers le **Loxone Miniserver** via ses entrées virtuelles HTTP.

### Architecture

```
📱 Téléphone (OwnTracks App)
        │
        │  MQTT (port 1884)
        ▼
🖥️  ioBroker — broker mqtt.0 + adaptateur owntracks.0
        │
        │  owntracks.0.users.<NOM>.*
        ▼
📜 Script : owntracks_to_loxone.js
        │
        │  HTTP GET → Virtual Input
        ▼
🏠 Loxone Miniserver
        │
        │  (optionnel) setState → ioBroker
        ▼
🎮 Commandes → Téléphone (reportLocation, setWaypoints...)
```

---

## Philosophie

- **Pas de logique métier dans le script** : le script pousse les données brutes,
  c'est Loxone qui gère la domotique
- **Détection automatique des utilisateurs** : pas besoin de configurer manuellement
  chaque téléphone — le script les détecte automatiquement dès la première connexion
- **Commandes bidirectionnelles** : ioBroker peut envoyer des commandes aux téléphones
  (forcer GPS, modifier zones, changer config…)
- **Code lisible et commenté** : des balises claires permettent de modifier facilement
  le comportement sans tout comprendre

---

## Structure du projet

```
owntrack-iobroker-loxone/
├── README.md                              ← Ce fichier
├── config.example.js                      ← ✅ Modèle de config à copier (public, safe à partager)
├── config.js                              ← ⚠️  Ta config privée (dans .gitignore, JAMAIS sur GitHub)
├── .gitignore                             ← Protège config.js
├── scripts/
│   └── owntracks_to_loxone.js            ← Script principal ioBroker v3.0
├── loxone/
│   └── virtual_inputs.md                 ← Liste des entrées virtuelles à créer dans Loxone Config
└── owntracks/
    ├── owntracks_ios_guide_complet.md    ← Guide complet paramétrage iOS OwnTracks
    └── commands.md                        ← Documentation commandes bidirectionnelles
```

---

## Prérequis

### ioBroker
- Adaptateur **OwnTracks** (`owntracks.0`) installé et actif
- Adaptateur **MQTT** (`mqtt.0`) installé et actif — port **1884**
- Adaptateur **JavaScript** installé (pour exécuter le script)

### Application OwnTracks (iPhone)
- Mode de connexion : **MQTT Private**
- Host : `IOBROKER_IP` (IP de ton serveur ioBroker — voir `config.js`)
- Port : **1884** (broker `mqtt.0`)
- DeviceID : prénom de la personne (ex: `Kevin`, `David`, `Carole`)
- Extended Data : **ON** (pour WiFi, pression, connexion)

### Loxone
- Miniserver accessible en HTTP sur le réseau local
- Entrées virtuelles HTTP créées (voir `loxone/virtual_inputs.md`)

---

## Installation

### 1. Créer ta configuration

Copier `config.example.js` → `config.js` et renseigner tes valeurs :

```javascript
const CONFIG = {
    LOXONE_IP   : "LOXONE_IP",     // ← IP de ton Loxone Miniserver
    LOXONE_PORT : 80,
    LOXONE_USER : "LOXONE_USER",   // ← Utilisateur Loxone Config
    LOXONE_PASS : "LOXONE_PASS",   // ← Mot de passe Loxone

    IOBROKER_IP   : "IOBROKER_IP", // ← IP de ton serveur ioBroker
    MQTT_BROKER_IP: "MQTT_BROKER_IP", // ← souvent la même IP qu'ioBroker

    USERS : ["Kevin", "David", "Carole"],
    ZONES : { HOME: "Maison" },
    // ...
};
```

> ⚠️ `config.js` est dans `.gitignore` — il ne sera **jamais** publié sur GitHub.
> Partager `config.example.js` avec tes collègues Loxone à la place.

### 2. Créer les entrées virtuelles dans Loxone Config

Se référer à `loxone/virtual_inputs.md` pour la liste complète.

Format du nom : `OT_<NomUtilisateur>_<champ>`

Exemples :
- `OT_Kevin_latitude`
- `OT_David_battery`
- `OT_Carole_isHome`

### 3. Importer le script dans ioBroker

1. Ouvrir l'interface ioBroker Admin
2. Aller dans **Scripts** (adaptateur JavaScript)
3. Créer un nouveau script de type **JavaScript**
4. Coller d'abord le contenu de `config.js`, puis le contenu de `scripts/owntracks_to_loxone.js`
5. **Sauvegarder** et **Démarrer** le script

---

## Données disponibles par utilisateur (42 variables)

| Variable Loxone                   | Description                          | Type   |
|-----------------------------------|--------------------------------------|--------|
| `OT_<USER>_latitude`              | Latitude GPS                         | float  |
| `OT_<USER>_longitude`             | Longitude GPS                        | float  |
| `OT_<USER>_accuracy`              | Précision GPS (mètres)               | int    |
| `OT_<USER>_altitude`              | Altitude (mètres)                    | int    |
| `OT_<USER>_verticalAccuracy`      | Précision verticale (mètres)         | int    |
| `OT_<USER>_velocity`              | Vitesse (km/h)                       | int    |
| `OT_<USER>_course`                | Cap/direction (degrés 0-360°)        | int    |
| `OT_<USER>_pressure`              | Pression barométrique (kPa)          | float  |
| `OT_<USER>_battery`               | Batterie téléphone (%)               | int    |
| `OT_<USER>_batteryStatus`         | État batterie (0=inconnu/1=déb/2=charge/3=plein) | int |
| `OT_<USER>_timestamp`             | Timestamp UNIX du fix GPS            | int    |
| `OT_<USER>_created_at`            | Timestamp construction message       | int    |
| `OT_<USER>_datetime`              | Date/heure lisible (ISO)             | string |
| `OT_<USER>_connection`            | Type connexion (w=WiFi/m=mobile/o=offline) | string |
| `OT_<USER>_connectionInt`         | Connexion numérique (0/1/2)          | int    |
| `OT_<USER>_ssid`                  | Nom réseau WiFi                      | string |
| `OT_<USER>_bssid`                 | MAC point d'accès WiFi               | string |
| `OT_<USER>_inregions`             | Zones actuelles (JSON array)         | string |
| `OT_<USER>_inrids`                | IDs des zones actuelles              | string |
| `OT_<USER>_isHome`                | Présence maison (0/1)                | int    |
| `OT_<USER>_regionRadius`          | Rayon zone enter/leave (mètres)      | int    |
| `OT_<USER>_motionactivities`      | Activité (stationary/walking/…)      | string |
| `OT_<USER>_monitoringMode`        | Mode GPS (1=significant/2=move)      | int    |
| `OT_<USER>_trigger`               | Déclencheur mise à jour (p/c/b/u…)   | string |
| `OT_<USER>_poi`                   | Point d'intérêt                      | string |
| `OT_<USER>_tag`                   | Tag associé à la position            | string |
| `OT_<USER>_trackerID`             | Initiales (2 caractères)             | string |
| `OT_<USER>_topic`                 | Topic MQTT source                    | string |
| `OT_<USER>_lastTransitionEvent`   | Dernier event zone (enter/leave)     | string |
| `OT_<USER>_lastTransitionEventInt`| Event numérique (1=enter/0=leave)    | int    |
| `OT_<USER>_lastTransitionRegion`  | Nom zone transition                  | string |
| `OT_<USER>_lastTransitionLat`     | Latitude événement transition        | float  |
| `OT_<USER>_lastTransitionLon`     | Longitude événement transition       | float  |
| `OT_<USER>_lastTransitionTst`     | Timestamp transition                 | int    |
| `OT_<USER>_steps`                 | Nombre de pas (podomètre)            | int    |
| `OT_<USER>_stepsFrom`             | Début période podomètre              | int    |
| `OT_<USER>_stepsTo`               | Fin période podomètre                | int    |
| `OT_<USER>_lastSeen`              | Dernier contact (epoch)              | int    |
| `OT_<USER>_lastSeenElapsed`       | Secondes depuis dernier contact      | int    |

---

## Commandes bidirectionnelles (ioBroker → Téléphone)

Le script crée automatiquement des états ioBroker pour chaque utilisateur défini dans `USERS` :

| État ioBroker                              | Effet (mettre à 1 pour déclencher) |
|--------------------------------------------|------------------------------------|
| `javascript.0.OT_CMD_reportLocation_Kevin` | Force un fix GPS immédiat          |
| `javascript.0.OT_CMD_reportSteps_Kevin`    | Demande le podomètre               |
| `javascript.0.OT_CMD_restart_Kevin`        | Redémarre l'app OwnTracks          |
| `javascript.0.OT_CMD_dump_Kevin`           | Rapport complet d'état             |

Ou directement depuis un script ioBroker :
```javascript
cmdReportLocation("Kevin");
cmdSetWaypoints("Kevin", [{ desc: "Maison", lat: 48.85, lon: 2.35, rad: 100 }]);
cmdSetConfiguration("Kevin", { monitoring: 1 }); // mode économie batterie
```

> 📖 Voir `owntracks/commands.md` pour la documentation complète.

---

## Zones géographiques (Waypoints)

> ⚠️ **Les zones ne sont PAS créées automatiquement par ce script.**

Les zones sont définies **manuellement dans l'app OwnTracks** sur chaque téléphone,
ou envoyées à distance via la commande `cmdSetWaypoints()`.

Le script utilise uniquement le **nom** de la zone HOME (configuré dans `config.js → ZONES.HOME`)
pour calculer la variable `OT_<USER>_isHome`.

Pour envoyer les zones sur tous les téléphones à distance :
```javascript
var zones = [{ _type: "waypoint", desc: "Maison", lat: 48.85, lon: 2.35, rad: 100, tst: Math.floor(Date.now()/1000) }];
["Kevin", "David", "Carole"].forEach(function(u) { cmdSetWaypoints(u, zones); });
```

---

## Ajout d'un nouvel utilisateur

**Aucune modification du script nécessaire pour recevoir ses données.**

1. Sur le nouveau téléphone, configurer OwnTracks avec le même broker MQTT
2. Choisir un DeviceID unique (ex: `Sophie`)
3. Dès la première position reçue, le script détecte automatiquement le nouvel utilisateur
4. Créer les entrées virtuelles correspondantes dans Loxone Config

> 💡 Pour activer les **commandes** vers ce nouvel utilisateur, ajouter son prénom dans
> `config.js → USERS` et `config.js → DEVICES`.

---

## Chiffrement (optionnel)

OwnTracks supporte le chiffrement libsodium (clé symétrique max 32 caractères).

1. ioBroker → `owntracks.0` → Config → **Encryption key** → saisir ta clé
2. iPhone → Settings → Encryption → même clé
3. `config.js` → `ENCRYPTION_ENABLED: true` + ta clé

> Le déchiffrement est géré par `owntracks.0`. Le script reçoit toujours les données en clair.

---

## Fichiers de configuration

| Fichier | Visibilité | Rôle |
|---|---|---|
| `config.js` | ⚠️ **Privé** (`.gitignore`) | Tes vraies valeurs (IPs, mots de passe) |
| `config.example.js` | ✅ **Public** (GitHub) | Modèle vide à partager avec des collègues |

---

## Auteur

**Kevin** — Installation domotique Loxone + ioBroker + OwnTracks

---

## Version

| Version | Date       | Description                                             |
|---------|------------|---------------------------------------------------------|
| 3.0.0   | 2026-04-22 | Chiffrement + commandes bidirectionnelles               |
| 2.0.0   | 2026-04-22 | Couverture complète iOS (42 variables), config séparée  |
| 1.0.0   | 2026-04-22 | Version initiale                                        |
