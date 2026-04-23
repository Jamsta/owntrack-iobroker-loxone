# OwnTracks → ioBroker → Loxone

## 🛠️ Générateur de Virtual Inputs

> **👉 [https://jamsta.github.io/owntrack-iobroker-loxone/](https://jamsta.github.io/owntrack-iobroker-loxone/)**
>
> Saisis ton prénom → génère instantanément la liste complète des Virtual HTTP Inputs à créer dans Loxone Config — avec copie presse-papier et téléchargement `.txt`.

---

## Description

Ce projet fournit un script ioBroker qui récupère **toutes les données brutes**
envoyées par l'application **OwnTracks** (géolocalisation des téléphones iOS) et les
pousse automatiquement vers le **Loxone Miniserver** via ses entrées virtuelles HTTP.

### Architecture

```
📱 Téléphone (OwnTracks App iOS)
        │
        │  MQTT (port 1884) — broker mqtt.0
        ▼
🖥️  ioBroker — adaptateur mqtt.0 (JSON brut complet)
        │
        │  mqtt.0.owntracks.owntracks.<user>  (tous les champs iOS)
        ▼
📜 Script : owntracks_to_loxone.js  (v5.4)
        │
        │  HTTP GET → Virtual Input
        ▼
🏠 Loxone Miniserver
        │
        │  (optionnel) commandes retour
        ▼
🎮 ioBroker → mqtt.0 → Téléphone (reportLocation, setWaypoints, setConfiguration...)
```

---

## Philosophie

- **Zéro logique métier** : le script pousse les données brutes telles quelles — c'est Loxone qui décide quoi en faire
- **Toutes les données iOS** : lecture depuis `mqtt.0` (JSON brut) — 40+ champs disponibles vs 6 avec `owntracks.0` seul
- **Détection automatique des utilisateurs** : tout nouveau téléphone qui se connecte est détecté immédiatement, sans configuration manuelle
- **Commandes bidirectionnelles** : ioBroker/Loxone peut envoyer des commandes vers les téléphones
- **Séparation public/privé** : `config.js` (IPs, mots de passe) reste local — jamais sur GitHub
- **Build simple** : `node build.js` fusionne `config.js` + script → fichier prêt pour ioBroker

---

## Structure du projet

```
owntrack-iobroker-loxone/
├── README.md                              ← Ce fichier
├── config.js                              ← ✅ Modèle public — copier et remplir tes valeurs
├── .gitignore                             ← Protège ton config.js local (avec tes vraies données)
├── build.js                               ← Génère deploy/owntracks_complet.js
├── scripts/
│   └── owntracks_to_loxone.js            ← Script principal ioBroker (v5.4)
├── loxone/
│   └── virtual_inputs.md                 ← Liste complète des entrées virtuelles Loxone (~40 par user)
└── owntracks/
    └── commands.md                        ← Documentation commandes bidirectionnelles
```

---

## Prérequis

### ioBroker
- Adaptateur **MQTT** (`mqtt.0`) installé et actif — port **1884**
- Adaptateur **JavaScript** installé (pour exécuter le script)

### Application OwnTracks (iPhone)
- Mode de connexion : **MQTT Private**
- Host : IP de ton serveur ioBroker
- Port : **1884** (broker `mqtt.0`)
- UserID : `owntracks` (pour l'authentification MQTT)
- DeviceID : prénom en minuscules (`kevin`, `carole`...)
- **Extended Data : ON** — indispensable pour WiFi, pression, type de connexion
- **cmd : ON** — pour recevoir les commandes
- Autorisation **Localisation → Toujours** obligatoire
- Autorisation **Mouvement & Fitness** pour le podomètre

### Loxone
- Miniserver accessible en HTTP sur le réseau local
- Entrées virtuelles HTTP créées (voir `loxone/virtual_inputs.md`)

---

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/Jamsta/owntrack-iobroker-loxone.git
cd owntrack-iobroker-loxone
```

### 2. Remplir ta configuration

Ouvrir `config.js` et remplacer les placeholders par tes vraies valeurs :

```javascript
const CONFIG = {
    LOXONE_IP   : "192.168.x.x",     // ← IP de ton Loxone Miniserver
    LOXONE_PORT : 80,
    LOXONE_USER : "admin",            // ← Utilisateur Loxone Config
    LOXONE_PASS : "motdepasse",       // ← Mot de passe Loxone

    IOBROKER_IP      : "192.168.x.x",
    MQTT_BROKER_IP   : "192.168.x.x",
    MQTT_BROKER_PORT : 1884,
    OWNTRACKS_USER   : "owntracks",   // UserID MQTT dans l'app OwnTracks
    OWNTRACKS_PASS   : "motdepasse",
    MQTT_USER        : "owntracks",
    MQTT_PASS        : "motdepasse",

    USERS : ["kevin", "carole"],      // ← DeviceID en minuscules
    DEVICES : {
        "kevin"  : "kevin",           // DeviceID dans l'app OwnTracks
        "carole" : "carole",
    },
    ZONES : {
        HOME : "Maison",              // ← Nom exact de ta zone HOME dans OwnTracks
        // WORK : "Bureau",           // ← Décommenter si besoin
    },

    COMMANDS_ENABLED    : true,
    ENCRYPTION_ENABLED  : false,
    POLLING_INTERVAL_MS : 30000,
    DEBUG               : true,
};
```

> 💡 Une fois rempli avec tes vraies valeurs, **ne committe jamais** ce fichier sur GitHub.
> Garde une copie de sauvegarde hors du dossier git (ex: `Documents/config_owntracks.js`).

### 3. Générer le script ioBroker

Installer Node.js puis lancer :

```bash
node build.js
```

→ Génère `deploy/owntracks_complet.js` (config + script fusionnés, prêt à coller dans ioBroker)

### 4. Importer dans ioBroker

1. Ouvrir **ioBroker Admin** → **Scripts**
2. Créer un nouveau script **JavaScript**
3. Coller le contenu de `deploy/owntracks_complet.js`
4. **Sauvegarder** et **Démarrer**

### 5. Créer les entrées virtuelles dans Loxone Config

Voir `loxone/virtual_inputs.md` — format : `OT_<user>_<champ>`

Exemples : `OT_kevin_latitude`, `OT_kevin_isHome`, `OT_kevin_battery`

---

## Workflow — mise à jour

```bash
# 1. Récupérer les dernières mises à jour du script
git pull

# 2. Régénérer le fichier ioBroker avec ta config locale
node build.js

# 3. Dans ioBroker : Ctrl+A → Supprimer → Coller deploy/owntracks_complet.js → Save → Restart
```

> ⚠️ `config.js` **est suivi par git** — un `git pull` peut écraser tes valeurs locales.
> Toujours sauvegarder ton `config.js` rempli avant de faire un `git pull`.

---

## Détection automatique des utilisateurs

### Au démarrage
Les utilisateurs listés dans `CONFIG.USERS` sont initialisés immédiatement.

### Nouveau téléphone
Dès qu'un nouveau téléphone publie sur MQTT, il est détecté automatiquement et ajouté sans redémarrage.

### Tous les sous-topics sont surveillés (v5.3+)
```
mqtt.0.owntracks.owntracks.kevin           ← _type=location  (GPS, batterie, zones...)
mqtt.0.owntracks.owntracks.kevin.dump      ← _type=dump      (config complète de l'app)
mqtt.0.owntracks.owntracks.kevin.status    ← _type=status    (infos iOS, autorisations)
mqtt.0.owntracks.owntracks.kevin.step      ← _type=steps     (podomètre)
mqtt.0.owntracks.owntracks.kevin.waypoint  ← _type=waypoint  (zones créées/modifiées)
```

---

## Données disponibles par utilisateur (~40 variables)

### 📍 Position GPS
| Variable Loxone | Description | Type |
|---|---|---|
| `OT_<user>_latitude` | Latitude GPS | float |
| `OT_<user>_longitude` | Longitude GPS | float |
| `OT_<user>_accuracy` | Précision horizontale (mètres) | int |
| `OT_<user>_altitude` | Altitude (mètres) | int |
| `OT_<user>_verticalAccuracy` | Précision verticale (mètres) | int |
| `OT_<user>_velocity` | Vitesse (km/h) | int |
| `OT_<user>_course` | Cap / direction (0-360°) | int |
| `OT_<user>_pressure` | Pression barométrique (kPa) | float |

### 🔋 Batterie
| Variable Loxone | Description | Type |
|---|---|---|
| `OT_<user>_battery` | Niveau batterie (%) | int |
| `OT_<user>_batteryStatus` | 0=inconnu / 1=débranché / 2=charge / 3=plein | int |

### ⏱️ Horodatage
| Variable Loxone | Description | Type |
|---|---|---|
| `OT_<user>_timestamp` | Timestamp UNIX du fix GPS | int |
| `OT_<user>_datetime` | Date/heure lisible (fr-FR) | string |

### 📶 Connectivité
| Variable Loxone | Description | Type |
|---|---|---|
| `OT_<user>_connection` | "w"=WiFi / "m"=mobile / "o"=offline | string |
| `OT_<user>_connectionInt` | 0=offline / 1=mobile / 2=WiFi | int |
| `OT_<user>_ssid` | Nom réseau WiFi | string |
| `OT_<user>_bssid` | MAC du point d'accès WiFi | string |

### 📍 Zones géographiques
| Variable Loxone | Description | Type |
|---|---|---|
| `OT_<user>_inregions` | Zones actuelles JSON ex: `["Maison"]` | string |
| `OT_<user>_inregionsCount` | Nombre de zones actives | int |
| `OT_<user>_isHome` | 1 = dans la zone HOME | int |
| `OT_<user>_isWork` | 1 = dans la zone WORK (si CONFIG.ZONES.WORK défini) | int |
| `OT_<user>_currentZone` | Nom de la zone principale actuelle | string |
| `OT_<user>_inrids` | IDs des zones actives | string |

### 🚶 Activité
| Variable Loxone | Description | Type |
|---|---|---|
| `OT_<user>_motionactivities` | stationary/walking/running/automotive/cycling | string |
| `OT_<user>_motionactivitiescode` | 1=stationary / 2=walking / 3=running / 4=automotive / 5=cycling | int |
| `OT_<user>_monitoringMode` | 1=significant (éco) / 2=move (précis) | int |
| `OT_<user>_trigger` | p=ping / c=zone / r=cmd / u=manuel / t=timer | string |
| `OT_<user>_tag` | Tag de la zone actuelle | string |
| `OT_<user>_trackerID` | Initiales (2 caractères) | string |

### 👣 Podomètre
| Variable Loxone | Description | Type |
|---|---|---|
| `OT_<user>_steps` | Nombre de pas | int |
| `OT_<user>_stepsDistance` | Distance parcourue (mètres) | float |
| `OT_<user>_stepsFloorsUp` | Étages montés | int |
| `OT_<user>_stepsFloorsDown` | Étages descendus | int |
| `OT_<user>_stepsFrom` | Début période (epoch) | int |
| `OT_<user>_stepsTo` | Fin période (epoch) | int |

### 🔔 Transitions (entrée/sortie zones)
| Variable Loxone | Description | Type |
|---|---|---|
| `OT_<user>_lastTransitionEvent` | "enter" ou "leave" | string |
| `OT_<user>_lastTransitionEventInt` | 1=enter / 0=leave | int |
| `OT_<user>_lastTransitionRegion` | Nom de la zone | string |
| `OT_<user>_lastTransitionLat` | Latitude de l'événement | float |
| `OT_<user>_lastTransitionLon` | Longitude de l'événement | float |

### 📱 Infos appareil (depuis dump/status)
| Variable Loxone | Description | Type |
|---|---|---|
| `OT_<user>_deviceModel` | "iPhone" | string |
| `OT_<user>_iOSVersion` | Version iOS | string |
| `OT_<user>_appVersion` | Version OwnTracks | string |
| `OT_<user>_gpsAuthorized` | 1 = GPS toujours autorisé | int |
| `OT_<user>_backgroundRefresh` | 1 = actualisation arrière-plan OK | int |
| `OT_<user>_deviceId` | DeviceID configuré dans l'app | string |
| `OT_<user>_extendedData` | 1 = Extended Data activé | int |
| `OT_<user>_waypointsCount` | Nombre de zones sur le téléphone | int |

### 🗺️ Dernier waypoint reçu
| Variable Loxone | Description | Type |
|---|---|---|
| `OT_<user>_lastWaypointDesc` | Nom de la zone créée/modifiée | string |
| `OT_<user>_lastWaypointLat` | Latitude | float |
| `OT_<user>_lastWaypointLon` | Longitude | float |
| `OT_<user>_lastWaypointRad` | Rayon (mètres) | int |

### 📡 Connexion LWT
| Variable Loxone | Description | Type |
|---|---|---|
| `OT_<user>_lastSeen` | Dernier contact (epoch) | int |
| `OT_<user>_lastSeenElapsed` | Secondes depuis dernier contact | int |

---

## Commandes bidirectionnelles (ioBroker → Téléphone)

États créés automatiquement dans `javascript.0` — mettre à `1` déclenche la commande :

| État ioBroker | Effet |
|---|---|
| `OT_CMD_reportLocation_<user>` | Force un fix GPS immédiat |
| `OT_CMD_reportSteps_<user>` | Demande le podomètre |
| `OT_CMD_restart_<user>` | Redémarre l'app OwnTracks |
| `OT_CMD_dump_<user>` | Rapport complet d'état |

### Depuis Loxone — via simple-api (port 8087)

1. Installer l'adaptateur **simple-api** dans ioBroker (port **8087**)
2. Créer une **Sortie Virtuelle HTTP** dans Loxone Config :
   - Adresse : `http://192.168.10.20:8087`
   - Ajouter des commandes de sortie :

```
GPS Kevin    → /setBulk?javascript.0.OT_CMD_reportLocation_kevin=1
GPS Carole   → /setBulk?javascript.0.OT_CMD_reportLocation_carole=1
Pas Kevin    → /setBulk?javascript.0.OT_CMD_reportSteps_kevin=1
Dump Kevin   → /setBulk?javascript.0.OT_CMD_dump_kevin=1
```

> ⚠️ Port **8081** (Admin) = ne supporte pas `/setBulk`  
> ✅ Port **8087** (simple-api) = requis

### Depuis un script ioBroker

```javascript
cmdReportLocation("kevin");
cmdReportSteps("kevin");
cmdDump("kevin");
cmdSetWaypoints("kevin", [{ _type:"waypoint", desc:"Maison", lat:44.7015, lon:-0.8464, rad:50, tst:Math.floor(Date.now()/1000) }]);
cmdSetConfiguration("kevin", { monitoring: 1 }); // mode économie batterie
```

> 📖 Documentation complète dans `owntracks/commands.md`

---

## Zones géographiques

Les zones se créent **directement dans l'app OwnTracks** sur chaque téléphone (onglet Régions → +),
ou s'envoient à distance via `cmdSetWaypoints()`.

Le script calcule automatiquement :
- `isHome` = 1 si le téléphone est dans la zone `CONFIG.ZONES.HOME`
- `isWork` = 1 si le téléphone est dans la zone `CONFIG.ZONES.WORK`
- `currentZone` = nom de la zone principale actuelle

---

## Sécurité — config.js

| Fichier | Sur GitHub | Contenu |
|---|---|---|
| `config.js` | ✅ Oui — **placeholders uniquement** | Modèle public, aucune donnée réelle |
| `deploy/` | ❌ Non — dans `.gitignore` | Généré localement par `node build.js` |

**Workflow :**
1. Clone le repo → `config.js` contient des placeholders
2. Remplis tes vraies valeurs directement dans `config.js` **localement**
3. `node build.js` génère `deploy/owntracks_complet.js`
4. `git pull` met à jour le script → ton `config.js` local **est écrasé** (voir note ci-dessous)

> ⚠️ **Important** : si tu as modifié ton `config.js` local avec tes vraies valeurs,
> **sauvegarde-le avant un `git pull`** car il sera remplacé par la version placeholder du repo.
> Astuce : garde une copie dans un dossier hors du repo (ex: `Documents/config_owntracks.js`).

---

## Chiffrement (optionnel)

OwnTracks supporte le chiffrement libsodium (clé symétrique max 32 caractères).

1. `config.js` → `ENCRYPTION_ENABLED: true` + `ENCRYPTION_KEY: "ta_clé"`
2. iPhone → Settings → **Encryption** → même clé

---

## Auteur

Projet développé pour une installation domotique **Loxone + ioBroker + OwnTracks iOS**.

---

## Historique des versions

| Version | Date | Description |
|---|---|---|
| **5.5.0** | 2026-04-23 | motionactivitiescode — code numérique activité (1=stationary…5=cycling) |
| **5.4.0** | 2026-04-23 | Filtrage nœuds réservés mqtt.0 — suppression faux utilisateur "owntracks" |
| **5.3.0** | 2026-04-23 | Surveillance de tous les sous-topics mqtt.0 (dump/status/step/waypoint) |
| **5.2.0** | 2026-04-23 | isWork, currentZone, inregionsCount |
| **5.1.0** | 2026-04-23 | Gestion complète steps/waypoint/dump/status |
| **5.0.0** | 2026-04-23 | Lecture JSON brut depuis mqtt.0 — tous les champs iOS (vs 6 avec owntracks.0) |
| **4.x** | 2026-04-22 | Corrections topic MQTT commandes |
| **3.0.0** | 2026-04-22 | Chiffrement libsodium + commandes bidirectionnelles |
| **2.0.0** | 2026-04-22 | Couverture complète iOS, config séparée public/privé |
| **1.0.0** | 2026-04-22 | Version initiale |
