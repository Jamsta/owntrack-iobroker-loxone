# Entrées Virtuelles Loxone — OwnTracks iOS (Complet)

## Introduction

Ce fichier liste **TOUTES** les Virtual HTTP Inputs à créer dans **Loxone Config**
pour recevoir l'intégralité des données OwnTracks iOS depuis ioBroker.

Le script pousse les données via :
```
http://admin:***@192.168.10.20/dev/sps/io/<NOM_ENTREE>/<VALEUR>
```

---

## Comment créer une Virtual HTTP Input dans Loxone Config

1. **Loxone Config** → Périphériques virtuels → **Ajouter** → **Entrée HTTP virtuelle**
2. **Nom** : exactement comme indiqué dans les tableaux ci-dessous
3. **Commande pour ON/Analogue** : `/dev/sps/io/<NOM_ENTREE>/<VALEUR>`
4. Répéter pour chaque entrée

> ⚠️ Les noms sont **sensibles à la casse** — respecter majuscules/minuscules

---

## Entrées à créer — PAR UTILISATEUR

Remplace `<USER>` par : `David`, `Carole`, `Kevin`...

---

### 📍 Position GPS

| Nom entrée Loxone               | Type        | Unité   | Description                              |
|---------------------------------|-------------|---------|------------------------------------------|
| `OT_<USER>_latitude`            | Analogique  | degrés  | Latitude GPS                             |
| `OT_<USER>_longitude`           | Analogique  | degrés  | Longitude GPS                            |
| `OT_<USER>_accuracy`            | Analogique  | mètres  | Précision horizontale GPS (↓ = meilleur) |
| `OT_<USER>_altitude`            | Analogique  | mètres  | Altitude au-dessus du niveau de la mer   |
| `OT_<USER>_verticalAccuracy`    | Analogique  | mètres  | Précision verticale de l'altitude (iOS)  |
| `OT_<USER>_velocity`            | Analogique  | km/h    | Vitesse de déplacement                   |
| `OT_<USER>_course`              | Analogique  | degrés  | Cap / direction (0-360°) (iOS)           |
| `OT_<USER>_pressure`            | Analogique  | kPa     | Pression barométrique (iOS, extendedData)|

---

### 🔋 Batterie téléphone

| Nom entrée Loxone               | Type        | Unité   | Description                              |
|---------------------------------|-------------|---------|------------------------------------------|
| `OT_<USER>_battery`             | Analogique  | %       | Niveau de batterie du téléphone          |
| `OT_<USER>_batteryStatus`       | Analogique  | 0-3     | 0=inconnu 1=débranché 2=charge 3=plein   |

---

### ⏱️ Horodatage

| Nom entrée Loxone               | Type        | Unité   | Description                              |
|---------------------------------|-------------|---------|------------------------------------------|
| `OT_<USER>_timestamp`           | Analogique  | epoch   | Timestamp UNIX du fix GPS                |
| `OT_<USER>_created_at`          | Analogique  | epoch   | Timestamp construction du message (iOS)  |
| `OT_<USER>_datetime`            | Texte       | —       | Date/heure lisible (ISO string)          |

---

### 📶 Connectivité réseau

| Nom entrée Loxone               | Type        | Unité   | Description                              |
|---------------------------------|-------------|---------|------------------------------------------|
| `OT_<USER>_connection`          | Texte       | —       | Type : "w"=WiFi / "m"=mobile / "o"=offline |
| `OT_<USER>_connectionInt`       | Analogique  | 0/1/2   | 0=offline / 1=mobile / 2=WiFi (numérique)|
| `OT_<USER>_ssid`                | Texte       | —       | Nom du réseau WiFi (iOS)                 |
| `OT_<USER>_bssid`               | Texte       | —       | Adresse MAC du point d'accès WiFi (iOS)  |

---

### 📍 Zones géographiques (Regions / Waypoints)

| Nom entrée Loxone               | Type        | Unité   | Description                              |
|---------------------------------|-------------|---------|------------------------------------------|
| `OT_<USER>_inregions`           | Texte       | JSON[]  | Zones actuelles ex: `["Maison","Garage"]`|
| `OT_<USER>_inrids`              | Texte       | JSON[]  | IDs des zones actuelles (iOS)            |
| `OT_<USER>_isHome`              | Analogique  | 0/1     | 1 = dans la zone HOME / 0 = absent       |
| `OT_<USER>_regionRadius`        | Analogique  | mètres  | Rayon de la zone lors enter/leave (iOS)  |

---

### 🚶 Activité & Mouvement

| Nom entrée Loxone               | Type        | Unité   | Description                              |
|---------------------------------|-------------|---------|------------------------------------------|
| `OT_<USER>_motionactivities`    | Texte       | —       | stationary/walking/running/automotive/cycling (iOS) |
| `OT_<USER>_monitoringMode`      | Analogique  | 1/2     | 1=significant (éco) / 2=move (précis) (iOS) |

---

### 🎯 Déclencheur de mise à jour

| Nom entrée Loxone               | Type        | Unité   | Description                              |
|---------------------------------|-------------|---------|------------------------------------------|
| `OT_<USER>_trigger`             | Texte       | —       | p=ping / c=zone / C=follow / b=beacon / r=cmd / u=manuel / t=timer / v=iOS |

---

### 📌 Point d'intérêt

| Nom entrée Loxone               | Type        | Unité   | Description                              |
|---------------------------------|-------------|---------|------------------------------------------|
| `OT_<USER>_poi`                 | Texte       | —       | Nom du point d'intérêt (iOS)             |
| `OT_<USER>_tag`                 | Texte       | —       | Tag associé à la position (iOS)          |

---

### 🏷️ Identifiant utilisateur

| Nom entrée Loxone               | Type        | Unité   | Description                              |
|---------------------------------|-------------|---------|------------------------------------------|
| `OT_<USER>_trackerID`           | Texte       | —       | Initiales (2 caractères max)             |
| `OT_<USER>_topic`               | Texte       | —       | Topic MQTT source                        |

---

### 🔔 Transitions (entrée/sortie de zones) — iOS uniquement

| Nom entrée Loxone                    | Type        | Unité   | Description                              |
|--------------------------------------|-------------|---------|------------------------------------------|
| `OT_<USER>_lastTransitionEvent`      | Texte       | —       | "enter" ou "leave"                       |
| `OT_<USER>_lastTransitionEventInt`   | Analogique  | 0/1     | 1=enter / 0=leave (numérique)            |
| `OT_<USER>_lastTransitionRegion`     | Texte       | —       | Nom de la zone concernée                 |
| `OT_<USER>_lastTransitionRegionId`   | Texte       | —       | ID de la zone concernée (iOS)            |
| `OT_<USER>_lastTransitionLat`        | Analogique  | degrés  | Latitude de l'événement                  |
| `OT_<USER>_lastTransitionLon`        | Analogique  | degrés  | Longitude de l'événement                 |
| `OT_<USER>_lastTransitionAcc`        | Analogique  | mètres  | Précision GPS à l'événement              |
| `OT_<USER>_lastTransitionTst`        | Analogique  | epoch   | Timestamp de l'événement                 |
| `OT_<USER>_lastTransitionTrigger`    | Texte       | —       | "c"=zone géo / "b"=beacon                |

---

### 👣 Podomètre (Steps) — iOS uniquement

| Nom entrée Loxone               | Type        | Unité   | Description                              |
|---------------------------------|-------------|---------|------------------------------------------|
| `OT_<USER>_steps`               | Analogique  | pas     | Nombre de pas (-1 si non supporté)       |
| `OT_<USER>_stepsFrom`           | Analogique  | epoch   | Début de la période mesurée              |
| `OT_<USER>_stepsTo`             | Analogique  | epoch   | Fin de la période mesurée                |

---

### 📡 Connexion téléphone (LWT)

| Nom entrée Loxone               | Type        | Unité   | Description                              |
|---------------------------------|-------------|---------|------------------------------------------|
| `OT_<USER>_lastSeen`            | Analogique  | epoch   | Timestamp du dernier contact             |
| `OT_<USER>_lastSeenElapsed`     | Analogique  | secondes| Secondes écoulées depuis le dernier contact |

---

## Récapitulatif — Liste complète pour copier/coller

### Pour David (44 entrées)

```
OT_David_latitude
OT_David_longitude
OT_David_accuracy
OT_David_altitude
OT_David_verticalAccuracy
OT_David_velocity
OT_David_course
OT_David_pressure
OT_David_battery
OT_David_batteryStatus
OT_David_timestamp
OT_David_created_at
OT_David_datetime
OT_David_connection
OT_David_connectionInt
OT_David_ssid
OT_David_bssid
OT_David_inregions
OT_David_inrids
OT_David_isHome
OT_David_regionRadius
OT_David_motionactivities
OT_David_monitoringMode
OT_David_trigger
OT_David_poi
OT_David_tag
OT_David_trackerID
OT_David_topic
OT_David_lastTransitionEvent
OT_David_lastTransitionEventInt
OT_David_lastTransitionRegion
OT_David_lastTransitionRegionId
OT_David_lastTransitionLat
OT_David_lastTransitionLon
OT_David_lastTransitionAcc
OT_David_lastTransitionTst
OT_David_lastTransitionTrigger
OT_David_steps
OT_David_stepsFrom
OT_David_stepsTo
OT_David_lastSeen
OT_David_lastSeenElapsed
```

### Pour Carole (identique, préfixe OT_Carole_)

```
OT_Carole_latitude
OT_Carole_longitude
OT_Carole_accuracy
OT_Carole_altitude
OT_Carole_verticalAccuracy
OT_Carole_velocity
OT_Carole_course
OT_Carole_pressure
OT_Carole_battery
OT_Carole_batteryStatus
OT_Carole_timestamp
OT_Carole_created_at
OT_Carole_datetime
OT_Carole_connection
OT_Carole_connectionInt
OT_Carole_ssid
OT_Carole_bssid
OT_Carole_inregions
OT_Carole_inrids
OT_Carole_isHome
OT_Carole_regionRadius
OT_Carole_motionactivities
OT_Carole_monitoringMode
OT_Carole_trigger
OT_Carole_poi
OT_Carole_tag
OT_Carole_trackerID
OT_Carole_topic
OT_Carole_lastTransitionEvent
OT_Carole_lastTransitionEventInt
OT_Carole_lastTransitionRegion
OT_Carole_lastTransitionRegionId
OT_Carole_lastTransitionLat
OT_Carole_lastTransitionLon
OT_Carole_lastTransitionAcc
OT_Carole_lastTransitionTst
OT_Carole_lastTransitionTrigger
OT_Carole_steps
OT_Carole_stepsFrom
OT_Carole_stepsTo
OT_Carole_lastSeen
OT_Carole_lastSeenElapsed
```

> ✅ Pour un futur utilisateur (ex: Kevin) : dupliquer la liste en remplaçant
> `David` par `Kevin`. Le script les alimentera automatiquement.

---

## Notes importantes

### Activer les données étendues (extendedData)
Les champs suivants nécessitent `extendedData = true` dans l'app OwnTracks :
- `pressure` (pression barométrique)
- `connection` (type de connexion WiFi/mobile)

Dans l'app OwnTracks iOS :
> **Settings → Advanced → Extended Data → ON**

### Activer le podomètre
Le champ `steps` nécessite l'autorisation CoreMotion sur l'iPhone :
> **Réglages iPhone → OwnTracks → Mouvement et fitness → Autoriser**
