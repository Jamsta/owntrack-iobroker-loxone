# Entrées Virtuelles Loxone — OwnTracks

## Introduction

Ce fichier liste toutes les **Virtual HTTP Inputs** à créer dans **Loxone Config**
pour recevoir les données OwnTracks depuis ioBroker.

Le script `scripts/owntracks_to_loxone.js` pousse les données via cette URL :
```
http://admin:admin@192.168.1.77/dev/sps/io/<NOM_ENTREE>/<VALEUR>
```

---

## Comment créer une Virtual HTTP Input dans Loxone Config

1. Ouvrir **Loxone Config**
2. Dans l'arborescence : **Périphériques virtuels** → **Ajouter** → **Entrée HTTP virtuelle**
3. Configurer :
   - **Nom** : exactement comme indiqué dans le tableau ci-dessous
   - **Adresse** : `http://<IP_IOBROKER>` *(l'ioBroker envoie, Loxone reçoit)*
   - **Commande pour ON/Analogue** : `/dev/sps/io/<NOM_ENTREE>/<VALEUR>`
4. Répéter pour chaque entrée

> ⚠️ Les noms doivent être **exactement identiques** à ceux du script (sensible à la casse)

---

## Entrées à créer — PAR UTILISATEUR

Remplace `<USER>` par le nom exact du DeviceID OwnTracks (ex: `David`, `Carole`, `Kevin`...)

### 📍 Position GPS

| Nom de l'entrée Loxone       | Type    | Unité   | Description                        |
|------------------------------|---------|---------|------------------------------------|
| `OT_<USER>_latitude`         | Analogique | degrés | Latitude GPS                      |
| `OT_<USER>_longitude`        | Analogique | degrés | Longitude GPS                     |
| `OT_<USER>_accuracy`         | Analogique | mètres | Précision de la mesure GPS        |
| `OT_<USER>_altitude`         | Analogique | mètres | Altitude au-dessus du niveau mer  |
| `OT_<USER>_velocity`         | Analogique | km/h   | Vitesse de déplacement            |
| `OT_<USER>_course`           | Analogique | degrés | Cap / direction (0-360°)          |

### 🔋 Batterie téléphone

| Nom de l'entrée Loxone       | Type    | Unité   | Description                        |
|------------------------------|---------|---------|------------------------------------|
| `OT_<USER>_battery`          | Analogique | %      | Niveau de batterie du téléphone   |
| `OT_<USER>_batteryStatus`    | Analogique | —      | 0=inconnu 1=débranché 2=charge 3=plein |

### ⏱️ Horodatage

| Nom de l'entrée Loxone       | Type    | Unité   | Description                        |
|------------------------------|---------|---------|------------------------------------|
| `OT_<USER>_timestamp`        | Analogique | epoch  | Timestamp UNIX de la position     |
| `OT_<USER>_datetime`         | Texte   | —      | Date/heure lisible (ISO string)   |

### 📶 Connectivité

| Nom de l'entrée Loxone       | Type    | Unité   | Description                                      |
|------------------------------|---------|---------|--------------------------------------------------|
| `OT_<USER>_connection`       | Texte   | —      | Type : "w"=WiFi / "m"=mobile / "o"=offline       |
| `OT_<USER>_connectionInt`    | Analogique | —   | 0=offline / 1=mobile / 2=WiFi (valeur numérique) |
| `OT_<USER>_ssid`             | Texte   | —      | Nom du réseau WiFi (si connecté)                 |

### 📍 Zones géographiques (Regions/Waypoints)

| Nom de l'entrée Loxone       | Type    | Unité   | Description                                      |
|------------------------------|---------|---------|--------------------------------------------------|
| `OT_<USER>_regions`          | Texte   | —      | Zones actuelles (JSON array ex: ["Maison"])      |
| `OT_<USER>_isHome`           | Numérique | 0/1  | 1 = dans la zone "Maison" / 0 = absent          |

### 🚶 Activité / Mouvement

| Nom de l'entrée Loxone       | Type    | Unité   | Description                                      |
|------------------------------|---------|---------|--------------------------------------------------|
| `OT_<USER>_motionactivities` | Texte   | —      | Activité : stationary/walking/running/automotive/cycling |
| `OT_<USER>_trigger`          | Texte   | —      | Déclencheur : p=ping c=zone r=cmd u=manuel t=timer |

### 🏷️ Identifiant

| Nom de l'entrée Loxone       | Type    | Unité   | Description                        |
|------------------------------|---------|---------|------------------------------------|
| `OT_<USER>_trackerID`        | Texte   | —      | Initiales affichées sur la carte  |

---

## Exemple concret pour David et Carole

### Entrées pour David

```
OT_David_latitude
OT_David_longitude
OT_David_accuracy
OT_David_altitude
OT_David_velocity
OT_David_course
OT_David_battery
OT_David_batteryStatus
OT_David_timestamp
OT_David_datetime
OT_David_connection
OT_David_connectionInt
OT_David_ssid
OT_David_regions
OT_David_isHome
OT_David_motionactivities
OT_David_trigger
OT_David_trackerID
```

### Entrées pour Carole

```
OT_Carole_latitude
OT_Carole_longitude
OT_Carole_accuracy
OT_Carole_altitude
OT_Carole_velocity
OT_Carole_course
OT_Carole_battery
OT_Carole_batteryStatus
OT_Carole_timestamp
OT_Carole_datetime
OT_Carole_connection
OT_Carole_connectionInt
OT_Carole_ssid
OT_Carole_regions
OT_Carole_isHome
OT_Carole_motionactivities
OT_Carole_trigger
OT_Carole_trackerID
```

> ✅ Pour un futur utilisateur (ex: Kevin), il suffit de créer les 18 entrées
> préfixées `OT_Kevin_` et le script les alimentera automatiquement.

---

## Conseil : Nommage dans Loxone Config

Pour retrouver facilement tes entrées dans Loxone, regroupe-les dans un
**bloc fonctionnel** ou **dossier** nommé `OwnTracks` dans l'arborescence.
