# OwnTracks → ioBroker → Loxone

## Description

Ce projet fournit un script ioBroker qui récupère **toutes les données brutes**
envoyées par l'application **OwnTracks** (géolocalisation des téléphones iOS) et les
pousse automatiquement vers le **Loxone Miniserver** via ses entrées virtuelles HTTP.

### Architecture

```
📱 Téléphone (OwnTracks App iOS)
        │
        │  MQTT (port 1884)
        ▼
🖥️  ioBroker — broker mqtt.0 + adaptateur owntracks.0
        │
        │  owntracks.0.users.<NOM>.*  (44 variables par utilisateur)
        ▼
📜 Script : owntracks_to_loxone.js  (v4.0)
        │
        │  HTTP GET → Virtual Input
        ▼
🏠 Loxone Miniserver
        │
        │  (optionnel) setState → ioBroker
        ▼
🎮 Commandes → Téléphone (reportLocation, setWaypoints, setConfiguration...)
```

---

## Philosophie

- **Zéro logique métier** : le script pousse les données brutes telles quelles — c'est Loxone qui décide quoi en faire
- **Détection automatique des utilisateurs** : tout nouveau téléphone qui se connecte est détecté immédiatement, sans aucune configuration manuelle
- **Détection automatique du DeviceID** : extrait depuis le champ `topic` ioBroker — `DEVICES` dans `config.js` n'est plus obligatoire
- **Commandes bidirectionnelles** : ioBroker/Loxone peut envoyer des commandes vers les téléphones (forcer GPS, envoyer des zones, changer la config…)
- **Séparation public/privé** : `config.js` (IPs, mots de passe) reste local et hors GitHub — `config.example.js` est partageable librement
- **Code commenté et balisé** : chaque champ est documenté, facile à modifier sans tout comprendre

---

## Structure du projet

```
owntrack-iobroker-loxone/
├── README.md                              ← Ce fichier
├── config.example.js                      ← ✅ Modèle public à partager avec des collègues
├── config.js                              ← ⚠️  Config privée (dans .gitignore — JAMAIS sur GitHub)
├── .gitignore                             ← Protège config.js
├── scripts/
│   └── owntracks_to_loxone.js            ← Script principal ioBroker (v4.0)
├── loxone/
│   └── virtual_inputs.md                 ← Liste complète des entrées virtuelles Loxone
└── owntracks/
    ├── owntracks_ios_guide_complet.md    ← Guide complet paramétrage iOS OwnTracks
    └── commands.md                        ← Documentation commandes bidirectionnelles
```

---

## Prérequis

### ioBroker
- Adaptateur **OwnTracks** (`owntracks.0`) installé et actif — port **1884**
- Adaptateur **MQTT** (`mqtt.0`) installé et actif — port **1884**
- Adaptateur **JavaScript** installé (pour exécuter le script)

### Application OwnTracks (iPhone)
- Mode de connexion : **MQTT Private**
- Host : IP de ton serveur ioBroker (voir `config.js → IOBROKER_IP`)
- Port : **1884** (broker `mqtt.0`)
- DeviceID : prénom de la personne (ex : `Kevin`, `David`, `Carole`)
- **Extended Data : ON** — indispensable pour recevoir WiFi, pression barométrique, type de connexion
- Autorisation **Localisation → Toujours** obligatoire pour le tracking en arrière-plan
- Autorisation **Mouvement & Fitness** pour le podomètre (`steps`)

### Loxone
- Miniserver accessible en HTTP sur le réseau local
- Entrées virtuelles HTTP créées (voir `loxone/virtual_inputs.md`)

---

## Installation

### 1. Créer ta configuration

Copier `config.example.js` → `config.js` et renseigner tes valeurs :

```javascript
const CONFIG = {
    LOXONE_IP   : "192.168.x.x",   // ← IP de ton Loxone Miniserver
    LOXONE_PORT : 80,
    LOXONE_USER : "admin",          // ← Utilisateur Loxone Config
    LOXONE_PASS : "motdepasse",     // ← Mot de passe Loxone

    IOBROKER_IP      : "192.168.x.x",  // ← IP de ton serveur ioBroker
    MQTT_BROKER_IP   : "192.168.x.x",  // ← souvent la même IP qu'ioBroker
    MQTT_BROKER_PORT : 1884,

    OWNTRACKS_INSTANCE : "owntracks.0",
    OWNTRACKS_PASS     : "motdepasse",  // ← Mot de passe MQTT OwnTracks

    USERS : ["Kevin", "David", "Carole"],  // ← Prénoms des utilisateurs (DeviceID dans l'app)
    ZONES : { HOME: "Maison" },            // ← Nom exact de ta zone maison dans OwnTracks

    COMMANDS_ENABLED : true,
    ENCRYPTION_ENABLED : false,

    POLLING_INTERVAL_MS : 30000,
    DEBUG : true,
};
```

> ⚠️ `config.js` est dans `.gitignore` — il ne sera **jamais** publié sur GitHub.
> Partager `config.example.js` avec tes collègues à la place.

### 2. Créer les entrées virtuelles dans Loxone Config

Se référer à `loxone/virtual_inputs.md` pour la liste complète des 44 entrées par utilisateur.

Format : `OT_<NomUtilisateur>_<champ>`  — exemples :
- `OT_Kevin_latitude` / `OT_Kevin_isHome` / `OT_Kevin_battery`
- `OT_David_velocity` / `OT_David_lastTransitionEvent`
- `OT_Carole_ssid` / `OT_Carole_steps`

### 3. Importer le script dans ioBroker

1. Ouvrir l'interface **ioBroker Admin**
2. Aller dans **Scripts** → adaptateur JavaScript
3. Créer un nouveau script de type **JavaScript**
4. Coller **d'abord** le contenu de `config.js`, **puis** le contenu de `scripts/owntracks_to_loxone.js`
5. **Sauvegarder** et **Démarrer** le script

---

## Détection automatique

### Utilisateurs
Dès qu'un téléphone envoie sa première position, le script crée automatiquement
sa surveillance et pousse ses données vers Loxone — sans aucune configuration.

### DeviceID (nouveau — v4.0)
Le script extrait le DeviceID directement depuis le champ `owntracks.0.users.<NOM>.topic` :

```
topic = "owntracks/Kevin/iPhone"  →  DeviceID détecté = "iPhone"  ✅
```

**Ordre de priorité pour les commandes :**

| Priorité | Source | Quand actif |
|---|---|---|
| 1 | Auto-détection depuis `topic` ioBroker | Dès la 1ère position reçue ✅ |
| 2 | `CONFIG.DEVICES[userName]` dans config.js | Fallback avant 1ère connexion |
| 3 | `"iPhone"` | Fallback ultime |

> `DEVICES` dans `config.js` n'est **plus obligatoire** — simple filet de secours.

---

## Données disponibles par utilisateur (44 variables)

| Variable Loxone                      | Description                                       | Type   |
|--------------------------------------|---------------------------------------------------|--------|
| `OT_<USER>_latitude`                 | Latitude GPS                                      | float  |
| `OT_<USER>_longitude`                | Longitude GPS                                     | float  |
| `OT_<USER>_accuracy`                 | Précision horizontale GPS (mètres)                | int    |
| `OT_<USER>_altitude`                 | Altitude (mètres)                                 | int    |
| `OT_<USER>_verticalAccuracy`         | Précision verticale altitude (mètres) — iOS       | int    |
| `OT_<USER>_velocity`                 | Vitesse de déplacement (km/h)                     | int    |
| `OT_<USER>_course`                   | Cap / direction (degrés 0-360°) — iOS             | int    |
| `OT_<USER>_pressure`                 | Pression barométrique (kPa) — iOS + extendedData  | float  |
| `OT_<USER>_battery`                  | Batterie téléphone (%)                            | int    |
| `OT_<USER>_batteryStatus`            | État batterie (0=inconnu / 1=débranché / 2=charge / 3=plein) | int |
| `OT_<USER>_timestamp`                | Timestamp UNIX du fix GPS                         | int    |
| `OT_<USER>_created_at`               | Timestamp construction du message — iOS           | int    |
| `OT_<USER>_datetime`                 | Date/heure lisible (ISO string)                   | string |
| `OT_<USER>_connection`               | Type connexion : `w`=WiFi / `m`=mobile / `o`=offline — extendedData | string |
| `OT_<USER>_connectionInt`            | Connexion numérique : 0=offline / 1=mobile / 2=WiFi | int  |
| `OT_<USER>_ssid`                     | Nom du réseau WiFi — iOS + extendedData           | string |
| `OT_<USER>_bssid`                    | MAC du point d'accès WiFi — iOS + extendedData    | string |
| `OT_<USER>_inregions`                | Zones actuelles (JSON array) ex: `["Maison"]`     | string |
| `OT_<USER>_inrids`                   | IDs des zones actuelles — iOS                     | string |
| `OT_<USER>_isHome`                   | Présence dans la zone HOME : 1=oui / 0=non        | int    |
| `OT_<USER>_regionRadius`             | Rayon de la zone enter/leave (mètres) — iOS       | int    |
| `OT_<USER>_motionactivities`         | Activité : stationary / walking / running / automotive / cycling | string |
| `OT_<USER>_monitoringMode`           | Mode GPS : 1=significant (éco) / 2=move (précis) — iOS | int |
| `OT_<USER>_trigger`                  | Déclencheur : p=ping / c=zone / b=beacon / r=cmd / u=manuel / t=timer | string |
| `OT_<USER>_poi`                      | Nom du point d'intérêt — iOS                      | string |
| `OT_<USER>_tag`                      | Tag associé à la position — iOS                   | string |
| `OT_<USER>_trackerID`                | Initiales affichées sur la carte (2 car. max)     | string |
| `OT_<USER>_topic`                    | Topic MQTT source (contient le DeviceID)          | string |
| `OT_<USER>_lastTransitionEvent`      | Dernier événement zone : `enter` ou `leave`       | string |
| `OT_<USER>_lastTransitionEventInt`   | Événement numérique : 1=enter / 0=leave           | int    |
| `OT_<USER>_lastTransitionRegion`     | Nom de la zone concernée par la transition        | string |
| `OT_<USER>_lastTransitionRegionId`   | ID de la zone transition — iOS                    | string |
| `OT_<USER>_lastTransitionLat`        | Latitude de l'événement de transition             | float  |
| `OT_<USER>_lastTransitionLon`        | Longitude de l'événement de transition            | float  |
| `OT_<USER>_lastTransitionAcc`        | Précision GPS à l'événement (mètres)              | int    |
| `OT_<USER>_lastTransitionTst`        | Timestamp de la dernière transition               | int    |
| `OT_<USER>_lastTransitionTrigger`    | Déclencheur transition : `c`=zone / `b`=beacon    | string |
| `OT_<USER>_steps`                    | Nombre de pas — podomètre iOS (-1 si non supporté)| int    |
| `OT_<USER>_stepsFrom`                | Début de la période podomètre (epoch)             | int    |
| `OT_<USER>_stepsTo`                  | Fin de la période podomètre (epoch)               | int    |
| `OT_<USER>_lastSeen`                 | Dernier contact MQTT connu (epoch)                | int    |
| `OT_<USER>_lastSeenElapsed`          | Secondes écoulées depuis le dernier contact       | int    |

> 📄 Liste complète avec instructions de création dans `loxone/virtual_inputs.md`

---

## Commandes bidirectionnelles (ioBroker → Téléphone)

Le script crée automatiquement des **états-boutons** dans ioBroker pour chaque utilisateur
listé dans `config.js → USERS`. Mettre la valeur à `1` déclenche la commande (remise à `0` automatiquement).

| État ioBroker (`javascript.0.*`)       | Effet                              |
|----------------------------------------|------------------------------------|
| `OT_CMD_reportLocation_<USER>`         | Force un fix GPS immédiat          |
| `OT_CMD_reportSteps_<USER>`            | Demande le podomètre               |
| `OT_CMD_restart_<USER>`               | Redémarre l'app OwnTracks          |
| `OT_CMD_dump_<USER>`                  | Rapport complet d'état             |

Ou directement depuis un script ioBroker :
```javascript
cmdReportLocation("Kevin");
cmdReportSteps("Kevin");
cmdRestart("Kevin");
cmdDump("Kevin");
cmdSetWaypoints("Kevin", [{ _type:"waypoint", desc:"Maison", lat:48.85, lon:2.35, rad:100, tst:Math.floor(Date.now()/1000) }]);
cmdSetConfiguration("Kevin", { monitoring: 1 }); // passer en mode économie batterie
```

> 📖 Documentation complète dans `owntracks/commands.md`

---

## Zones géographiques (Waypoints)

> ⚠️ **Les zones ne sont PAS créées automatiquement par ce script.**

Les zones sont définies **manuellement dans l'app OwnTracks** sur chaque téléphone,
ou envoyées à distance via la commande `cmdSetWaypoints()`.

Le script utilise uniquement le **nom** de la zone HOME (`config.js → ZONES.HOME`)
pour calculer la variable `OT_<USER>_isHome` (0 ou 1).

Envoyer les zones sur tous les téléphones à distance :
```javascript
var zones = [{
    _type : "waypoint",
    desc  : "Maison",
    lat   : 48.8566,  // ← tes coordonnées réelles
    lon   : 2.3522,
    rad   : 100,
    tst   : Math.floor(Date.now() / 1000)
}];
["Kevin", "David", "Carole"].forEach(function(u) { cmdSetWaypoints(u, zones); });
```

---

## Ajout d'un nouvel utilisateur

**Aucune modification du script nécessaire pour recevoir ses données.**

1. Configurer OwnTracks sur le nouveau téléphone (même broker MQTT, DeviceID = prénom)
2. Dès la 1ère position reçue → détection automatique, données poussées vers Loxone
3. Créer les 44 entrées virtuelles dans Loxone Config (`OT_<Prenom>_*`)

> 💡 Pour les **commandes** vers ce nouvel utilisateur, ajouter son prénom dans
> `config.js → USERS` (et optionnellement `DEVICES` comme fallback).

---

## Chiffrement (optionnel)

OwnTracks supporte le chiffrement libsodium — clé symétrique max 32 caractères.

1. ioBroker → `owntracks.0` → Config → **Encryption key** → saisir ta clé
2. iPhone → Settings → **Encryption** → même clé
3. `config.js` → `ENCRYPTION_ENABLED: true` + `ENCRYPTION_KEY: "ta_clé"`

> Le déchiffrement est géré par l'adaptateur `owntracks.0`. Le script reçoit toujours les données en clair.

---

## Fichiers de configuration

| Fichier | Visibilité | Rôle |
|---|---|---|
| `config.js` | ⚠️ **Privé** — dans `.gitignore` | Tes vraies valeurs : IPs, mots de passe, utilisateurs |
| `config.example.js` | ✅ **Public** — sur GitHub | Modèle vide à copier et partager avec des collègues |

---

## Documentation

| Fichier | Contenu |
|---|---|
| `loxone/virtual_inputs.md` | Liste des 44 entrées virtuelles par utilisateur + instructions de création |
| `owntracks/commands.md` | Toutes les commandes bidirectionnelles + exemples d'intégration Loxone |
| `owntracks/owntracks_ios_guide_complet.md` | Guide complet paramétrage iOS : MQTT, mode expert, zones, chiffrement, remote config |

---

## Auteur

**Kevin** — Installation domotique Loxone + ioBroker + OwnTracks

---

## Historique des versions

| Version | Date       | Description                                                            |
|---------|------------|------------------------------------------------------------------------|
| 4.0.0   | 2026-04-22 | Détection automatique du DeviceID depuis le champ `topic` ioBroker    |
| 3.0.0   | 2026-04-22 | Chiffrement libsodium + commandes bidirectionnelles                    |
| 2.0.0   | 2026-04-22 | Couverture complète iOS (44 variables), config séparée public/privé    |
| 1.0.0   | 2026-04-22 | Version initiale                                                       |
