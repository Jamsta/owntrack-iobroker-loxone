# Entrées Virtuelles Loxone — OwnTracks iOS v5.4

## Introduction

Ce fichier liste **TOUTES** les Virtual HTTP Inputs à créer dans **Loxone Config**
pour recevoir l'intégralité des données OwnTracks iOS depuis ioBroker.

Le script pousse les données via :
```
http://LOXONE_USER:LOXONE_PASS@LOXONE_IP/dev/sps/io/<NOM_ENTREE>/<VALEUR>
```

---

## Comment créer une Virtual HTTP Input dans Loxone Config

1. **Loxone Config** → Périphériques virtuels → **Ajouter** → **Entrée HTTP virtuelle**
2. **Nom** : exactement comme indiqué ci-dessous
3. **Commande pour ON/Analogue** : `/dev/sps/io/<NOM_ENTREE>/<v>`
4. Répéter pour chaque entrée

> ⚠️ Les noms sont **sensibles à la casse** — respecter exactement majuscules/minuscules
> ⚠️ Remplacer `<user>` par le DeviceID en minuscules : `kevin`, `carole`, etc.

---

## 📍 Position GPS (10 entrées)

| Nom entrée Loxone | Type | Unité | Description |
|---|---|---|---|
| `OT_<user>_latitude` | Analogique | degrés | Latitude GPS |
| `OT_<user>_longitude` | Analogique | degrés | Longitude GPS |
| `OT_<user>_accuracy` | Analogique | mètres | Précision horizontale GPS (↓ = meilleur) |
| `OT_<user>_altitude` | Analogique | mètres | Altitude au-dessus du niveau de la mer |
| `OT_<user>_verticalAccuracy` | Analogique | mètres | Précision verticale de l'altitude (iOS) |
| `OT_<user>_velocity` | Analogique | km/h | Vitesse de déplacement |
| `OT_<user>_course` | Analogique | degrés | Cap / direction (0-360°) |
| `OT_<user>_pressure` | Analogique | kPa | Pression barométrique (iOS + extendedData) |
| `OT_<user>_distanceHome` | Analogique | mètres | Distance depuis la maison (Haversine) |
| `OT_<user>_distanceHomeKm` | Analogique | km | Distance depuis la maison en kilomètres |

---

## 🔋 Batterie (2 entrées)

| Nom entrée Loxone | Type | Unité | Description |
|---|---|---|---|
| `OT_<user>_battery` | Analogique | % | Niveau de batterie du téléphone |
| `OT_<user>_batteryStatus` | Analogique | 0-3 | 0=inconnu / 1=débranché / 2=charge / 3=plein |

---

## ⏱️ Horodatage (2 entrées)

| Nom entrée Loxone | Type | Unité | Description |
|---|---|---|---|
| `OT_<user>_timestamp` | Analogique | epoch | Timestamp UNIX du fix GPS |
| `OT_<user>_datetime` | Texte | — | Date/heure lisible ex: "23/04/2026 01:22:29" |

---

## 📶 Connectivité réseau (4 entrées)

| Nom entrée Loxone | Type | Unité | Description |
|---|---|---|---|
| `OT_<user>_connection` | Texte | — | "w"=WiFi / "m"=mobile / "o"=offline |
| `OT_<user>_connectionInt` | Analogique | 0/1/2 | 0=offline / 1=mobile / 2=WiFi |
| `OT_<user>_ssid` | Texte | — | Nom du réseau WiFi (iOS + extendedData) |
| `OT_<user>_bssid` | Texte | — | Adresse MAC du point d'accès WiFi (iOS) |

---

## 📍 Zones géographiques (6 entrées)

| Nom entrée Loxone | Type | Unité | Description |
|---|---|---|---|
| `OT_<user>_inregions` | Texte | JSON[] | Zones actives ex: `["Maison","Ecole Gustave"]` |
| `OT_<user>_inregionsCount` | Analogique | entier | Nombre de zones actives simultanément |
| `OT_<user>_isHome` | Analogique | 0/1 | 1 = dans la zone HOME (CONFIG.ZONES.HOME) |
| `OT_<user>_isWork` | Analogique | 0/1 | 1 = dans la zone WORK (CONFIG.ZONES.WORK) |
| `OT_<user>_currentZone` | Texte | — | Nom de la zone principale actuelle (ou vide) |
| `OT_<user>_inrids` | Texte | JSON[] | IDs internes des zones actives |

---

## 🚶 Activité & Mouvement (5 entrées)

| Nom entrée Loxone | Type | Unité | Description |
|---|---|---|---|
| `OT_<user>_motionactivities` | Texte | — | stationary / walking / running / automotive / cycling |
| `OT_<user>_motionactivitiescode` | Analogique | 1-5 | 1=stationary / 2=walking / 3=running / 4=automotive / 5=cycling |
| `OT_<user>_monitoringMode` | Analogique | 1/2 | 1=significant (éco batterie) / 2=move (précis) |
| `OT_<user>_trigger` | Texte | — | p=ping / c=zone / r=cmd / u=manuel / t=timer |
| `OT_<user>_tag` | Texte | — | Nom de la zone actuelle (tag OwnTracks) |

---

## 🏷️ Identifiant (2 entrées)

| Nom entrée Loxone | Type | Unité | Description |
|---|---|---|---|
| `OT_<user>_trackerID` | Texte | — | Initiales affichées sur la carte (ex: "KV") |
| `OT_<user>_topic` | Texte | — | Topic MQTT source (ex: owntracks/owntracks/kevin) |

---

## 🔔 Transitions entrée/sortie de zones (7 entrées)

| Nom entrée Loxone | Type | Unité | Description |
|---|---|---|---|
| `OT_<user>_lastTransitionEvent` | Texte | — | "enter" ou "leave" |
| `OT_<user>_lastTransitionEventInt` | Analogique | 0/1 | 1=enter / 0=leave |
| `OT_<user>_lastTransitionRegion` | Texte | — | Nom de la zone concernée |
| `OT_<user>_lastTransitionRegionId` | Texte | — | ID interne de la zone |
| `OT_<user>_lastTransitionLat` | Analogique | degrés | Latitude à l'événement |
| `OT_<user>_lastTransitionLon` | Analogique | degrés | Longitude à l'événement |
| `OT_<user>_lastTransitionTst` | Analogique | epoch | Timestamp de l'événement |

---

## 👣 Podomètre / Steps (7 entrées)

| Nom entrée Loxone | Type | Unité | Description |
|---|---|---|---|
| `OT_<user>_steps` | Analogique | pas | Nombre de pas |
| `OT_<user>_stepsDistance` | Analogique | mètres | Distance parcourue |
| `OT_<user>_stepsFloorsUp` | Analogique | étages | Étages montés |
| `OT_<user>_stepsFloorsDown` | Analogique | étages | Étages descendus |
| `OT_<user>_stepsFrom` | Analogique | epoch | Début de la période mesurée |
| `OT_<user>_stepsTo` | Analogique | epoch | Fin de la période mesurée |
| `OT_<user>_stepsTst` | Analogique | epoch | Timestamp du rapport podomètre |

---

## 📱 Infos appareil — dump/status (8 entrées)

| Nom entrée Loxone | Type | Unité | Description |
|---|---|---|---|
| `OT_<user>_deviceId` | Texte | — | DeviceID configuré dans l'app (ex: "kevin") |
| `OT_<user>_deviceModel` | Texte | — | Modèle (ex: "iPhone") |
| `OT_<user>_iOSVersion` | Texte | — | Version iOS (ex: "26.4") |
| `OT_<user>_appVersion` | Texte | — | Version OwnTracks (ex: "26.1.1") |
| `OT_<user>_locale` | Texte | — | Locale (ex: "fr_FR") |
| `OT_<user>_gpsAuthorized` | Analogique | 0/1 | 1 = GPS autorisé en permanence |
| `OT_<user>_backgroundRefresh` | Analogique | 0/1 | 1 = actualisation arrière-plan active |
| `OT_<user>_extendedData` | Analogique | 0/1 | 1 = Extended Data activé dans l'app |
| `OT_<user>_cmdEnabled` | Analogique | 0/1 | 1 = commandes activées dans l'app |
| `OT_<user>_waypointsCount` | Analogique | entier | Nombre de zones configurées sur le téléphone |

---

## 🗺️ Dernier waypoint reçu (6 entrées)

| Nom entrée Loxone | Type | Unité | Description |
|---|---|---|---|
| `OT_<user>_lastWaypointDesc` | Texte | — | Nom de la zone créée/modifiée |
| `OT_<user>_lastWaypointLat` | Analogique | degrés | Latitude |
| `OT_<user>_lastWaypointLon` | Analogique | degrés | Longitude |
| `OT_<user>_lastWaypointRad` | Analogique | mètres | Rayon |
| `OT_<user>_lastWaypointRid` | Texte | — | ID interne de la zone |
| `OT_<user>_lastWaypointTst` | Analogique | epoch | Timestamp de création/modification |

---

## 📡 Connexion LWT (2 entrées)

| Nom entrée Loxone | Type | Unité | Description |
|---|---|---|---|
| `OT_<user>_lastSeen` | Analogique | epoch | Timestamp du dernier contact MQTT |
| `OT_<user>_lastSeenElapsed` | Analogique | secondes | Secondes écoulées depuis le dernier contact |

---

## 📋 Liste complète à copier/coller — pour kevin

```
OT_kevin_latitude
OT_kevin_distanceHome
OT_kevin_distanceHomeKm
OT_kevin_longitude
OT_kevin_accuracy
OT_kevin_altitude
OT_kevin_verticalAccuracy
OT_kevin_velocity
OT_kevin_course
OT_kevin_pressure
OT_kevin_battery
OT_kevin_batteryStatus
OT_kevin_timestamp
OT_kevin_datetime
OT_kevin_connection
OT_kevin_connectionInt
OT_kevin_ssid
OT_kevin_bssid
OT_kevin_inregions
OT_kevin_inregionsCount
OT_kevin_isHome
OT_kevin_isWork
OT_kevin_currentZone
OT_kevin_inrids
OT_kevin_motionactivities
OT_kevin_motionactivitiescode
OT_kevin_monitoringMode
OT_kevin_trigger
OT_kevin_tag
OT_kevin_trackerID
OT_kevin_topic
OT_kevin_lastTransitionEvent
OT_kevin_lastTransitionEventInt
OT_kevin_lastTransitionRegion
OT_kevin_lastTransitionRegionId
OT_kevin_lastTransitionLat
OT_kevin_lastTransitionLon
OT_kevin_lastTransitionTst
OT_kevin_steps
OT_kevin_stepsDistance
OT_kevin_stepsFloorsUp
OT_kevin_stepsFloorsDown
OT_kevin_stepsFrom
OT_kevin_stepsTo
OT_kevin_stepsTst
OT_kevin_deviceId
OT_kevin_deviceModel
OT_kevin_iOSVersion
OT_kevin_appVersion
OT_kevin_locale
OT_kevin_gpsAuthorized
OT_kevin_backgroundRefresh
OT_kevin_extendedData
OT_kevin_cmdEnabled
OT_kevin_waypointsCount
OT_kevin_lastWaypointDesc
OT_kevin_lastWaypointLat
OT_kevin_lastWaypointLon
OT_kevin_lastWaypointRad
OT_kevin_lastWaypointRid
OT_kevin_lastWaypointTst
OT_kevin_lastSeen
OT_kevin_lastSeenElapsed
```

> ✅ Pour un autre utilisateur : remplacer `kevin` par son DeviceID (ex: `carole`, `david`).
> Le script alimente automatiquement ces entrées dès la première connexion du téléphone.

---

## Notes importantes

### Activer Extended Data
Requis pour : `pressure`, `connection`, `ssid`, `bssid`
> iPhone OwnTracks → **Settings → Advanced → Extended Data → ON**

### Activer les commandes (cmd)
Requis pour recevoir les commandes depuis ioBroker
> iPhone OwnTracks → **Settings → Advanced → cmd → ON**

### Activer le podomètre
Requis pour : `steps`, `stepsDistance`, `stepsFloorsUp`, `stepsFloorsDown`
> **Réglages iPhone → OwnTracks → Mouvement et fitness → Autoriser**

### Transitions entrée/sortie
Requis pour `lastTransitionEvent*` : créer au moins une zone dans l'onglet **Régions** de l'app OwnTracks.

---

## 🎮 Sorties Virtuelles HTTP — Commandes vers les téléphones

Ces sorties permettent à Loxone d'envoyer des commandes directement aux iPhones via ioBroker.

### Prérequis — Installer l'adaptateur simple-api

1. ioBroker **Admin → Adaptateurs → Chercher "simple-api"**
2. Installer → il tourne sur le **port 8087** par défaut
3. Vérifier dans **Instances** que `simple-api.0` est vert

> ⚠️ Le port **8081** (Admin ioBroker) **ne supporte PAS** `/setBulk`  
> ✅ Utiliser uniquement le port **8087** (simple-api)

---

### Créer le périphérique Sortie Virtuelle HTTP

1. Loxone Config → **Périphériques virtuels → Ajouter → Sortie HTTP virtuelle**
2. **Nom** : `ioBroker Commands`
3. **Adresse** : `http://192.168.10.20:8087`
4. Laisser **Commande** vide au niveau du périphérique
5. Ajouter les **commandes de sortie** ci-dessous (une par bouton)

---

### 📋 Commandes de sortie à créer

#### Pour Kevin

| Nom de la commande | Commande HTTP (chemin) | Effet |
|---|---|---|
| `GPS_Kevin` | `/setBulk?javascript.0.OT_CMD_reportLocation_kevin=1` | Force fix GPS immédiat |
| `Steps_Kevin` | `/setBulk?javascript.0.OT_CMD_reportSteps_kevin=1` | Demande podomètre |
| `Dump_Kevin` | `/setBulk?javascript.0.OT_CMD_dump_kevin=1` | Rapport d'état complet |
| `Restart_Kevin` | `/setBulk?javascript.0.OT_CMD_restart_kevin=1` | Redémarre app OwnTracks |

#### Pour Carole

| Nom de la commande | Commande HTTP (chemin) | Effet |
|---|---|---|
| `GPS_Carole` | `/setBulk?javascript.0.OT_CMD_reportLocation_carole=1` | Force fix GPS immédiat |
| `Steps_Carole` | `/setBulk?javascript.0.OT_CMD_reportSteps_carole=1` | Demande podomètre |
| `Dump_Carole` | `/setBulk?javascript.0.OT_CMD_dump_carole=1` | Rapport d'état complet |
| `Restart_Carole` | `/setBulk?javascript.0.OT_CMD_restart_carole=1` | Redémarre app OwnTracks |

---

### URL complètes (pour tester dans le navigateur)

```
# Forcer GPS Kevin
http://192.168.10.20:8087/setBulk?javascript.0.OT_CMD_reportLocation_kevin=1

# Forcer GPS Carole
http://192.168.10.20:8087/setBulk?javascript.0.OT_CMD_reportLocation_carole=1

# Demander podomètre Kevin
http://192.168.10.20:8087/setBulk?javascript.0.OT_CMD_reportSteps_kevin=1

# Rapport d'état Kevin
http://192.168.10.20:8087/setBulk?javascript.0.OT_CMD_dump_kevin=1
```

> 💡 Coller ces URLs dans un navigateur sur le réseau local pour tester **avant** de configurer Loxone.

---

### Schéma de flux

```
Bouton Loxone (appui)
     │
     │  HTTP GET
     ▼
http://192.168.10.20:8087/setBulk?javascript.0.OT_CMD_reportLocation_kevin=1
     │
     │  simple-api.0 → setState("javascript.0.OT_CMD_reportLocation_kevin", 1)
     ▼
Script owntracks_to_loxone.js (détecte le changement d'état)
     │
     │  sendTo("mqtt.0", "publish", { topic: "owntracks/owntracks/kevin/cmd", ...})
     ▼
mqtt.0 (broker port 1884) → iPhone Kevin
     │
     │  {"_type":"cmd","action":"reportLocation"}
     ▼
iPhone publie sa position → Loxone OT_kevin_latitude/longitude mis à jour
```
