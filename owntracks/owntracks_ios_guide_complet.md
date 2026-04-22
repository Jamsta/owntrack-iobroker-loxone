# Guide Complet — Paramétrage OwnTracks iOS
## Configuration, Mode Expert & Toutes les Fonctionnalités

---

## TABLE DES MATIÈRES

1. [Installation & Premier démarrage](#1-installation--premier-démarrage)
2. [Écrans principaux de l'app](#2-écrans-principaux-de-lapp)
3. [Configuration de la connexion (MQTT)](#3-configuration-de-la-connexion-mqtt)
4. [Paramètres de localisation](#4-paramètres-de-localisation)
5. [Les 4 modes de surveillance](#5-les-4-modes-de-surveillance)
6. [Mode Expert — Tous les paramètres avancés](#6-mode-expert--tous-les-paramètres-avancés)
7. [Zones géographiques (Waypoints / Regions / Geofences)](#7-zones-géographiques-waypoints--regions--geofences)
8. [iBeacons](#8-ibeacons)
9. [Extended Data — Données étendues](#9-extended-data--données-étendues)
10. [Chiffrement des payloads](#10-chiffrement-des-payloads)
11. [Configuration à distance (Remote Config)](#11-configuration-à-distance-remote-config)
12. [Podomètre (Steps)](#12-podomètre-steps)
13. [Points d'intérêt (POI) & Tags](#13-points-dintérêt-poi--tags)
14. [Changements automatiques de mode](#14-changements-automatiques-de-mode)
15. [Export GPX & Mode Offline](#15-export-gpx--mode-offline)
16. [Paramétrage recommandé pour ioBroker + Loxone](#16-paramétrage-recommandé-pour-iobroker--loxone)

---

## 1. Installation & Premier démarrage

### Téléchargement
- **App Store iOS** : rechercher "OwnTracks"
- Lien direct : https://itunes.apple.com/en/app/mqttitude/id692424691?mt=8
- Compatible : iPhone, iPad, Mac (non testé sur iPod)

### Permissions requises au premier lancement

| Permission | Pourquoi | Recommandation |
|-----------|----------|----------------|
| **Localisation** | Indispensable pour fonctionner | ✅ Toujours autoriser (en arrière-plan) |
| **Contacts** | Afficher les photos des amis sur la carte | ✅ Autoriser (optionnel) |
| **Mouvement & Fitness** | Podomètre (comptage de pas) | ✅ Autoriser pour avoir `steps` |
| **Notifications** | Alertes entrée/sortie de zones | ✅ Autoriser pour les transitions |
| **Bluetooth** | Surveillance des iBeacons | ✅ Autoriser si tu utilises des beacons |

> ⚠️ **Important** : pour que le tracking fonctionne en arrière-plan, la localisation doit être sur **"Toujours"** (pas "En cours d'utilisation")

---

## 2. Écrans principaux de l'app

### Accès aux paramètres
→ Taper sur le `ⓘ` en haut à gauche de la carte

### Navigation principale
```
ⓘ (Info/Settings)
├── Status          → État de la connexion MQTT, statistiques
├── Settings        → TOUS les paramètres (voir section 3 et 6)
├── Friends         → Carte des autres utilisateurs
├── Regions         → Gestion des zones géographiques
└── Map             → Carte principale
```

### Icônes de mode (affichées dans l'app)
| Icône | Mode |
|-------|------|
| `[]`  | Quiet (silencieux) |
| `\|\|` | Manual (manuel) |
| `\|>` | Significant (standard) |
| `\|\|>` | Move (fréquent) |
| `Significant!` | Significant (rétrogradé depuis Move, batterie faible) |
| `Significant#` | Significant (rétrogradé automatiquement via adapt) |

---

## 3. Configuration de la connexion (MQTT)

### Accès
`ⓘ → Settings → Connection`

---

### 3.1 Mode de connexion

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| **Mode** | `MQTT` | Connexion directe à un broker MQTT (recommandé avec ioBroker) |
| **Mode** | `HTTP` | Envoi via requête HTTP POST vers un endpoint |
| **Mode** | `Public` | Connexion au broker OwnTracks public (test uniquement) |

> ✅ **Pour ioBroker** : utiliser **MQTT Private**

---

### 3.2 Paramètres Host (MQTT)

| Paramètre | Valeur pour ioBroker | Description |
|-----------|----------------------|-------------|
| **Host** | `192.168.10.20` | IP de ton serveur ioBroker |
| **Port** | `1884` | Port du broker MQTT (mqtt.0) |
| **WebSockets** | `OFF` | Ne pas activer sauf besoin spécifique |
| **TLS/SSL** | `OFF` | Désactiver si réseau local (activer si internet) |

---

### 3.3 Authentification

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| **Username** | `owntracks` | Identifiant configuré dans l'adaptateur ioBroker |
| **Password** | `voir config.js` | Mot de passe configuré dans ioBroker |
| **Device ID** | `Kevin`, `David` ou `Carole` | ⚠️ NOM EXACT → préfixe des entrées Loxone (`OT_Kevin_...`) |
| **Tracker ID** | `KE`, `DA` ou `CA` | 2 initiales affichées sur la carte |

> ⚠️ **Device ID est CRITIQUE** : il détermine le nom des états ioBroker et des entrées Loxone.
> - Kevin → états `owntracks.0.users.Kevin.*` → Loxone `OT_Kevin_*`
> - David → états `owntracks.0.users.David.*` → Loxone `OT_David_*`
> - Carole → états `owntracks.0.users.Carole.*` → Loxone `OT_Carole_*`

---

### 3.4 Options MQTT avancées

| Paramètre | Valeur recommandée | Description |
|-----------|--------------------|-------------|
| **Clean Session** | `ON` | Nouvelle session à chaque connexion |
| **Keepalive** | `60` secondes | Intervalle heartbeat MQTT |
| **QoS** | `1` | At least once (recommandé) |
| **Retained** | `ON` | Loxone reçoit la dernière valeur même hors connexion |
| **MQTT Protocol** | `MQTT 3.1.1` (v4) ou `MQTT 5` | Version du protocole |
| **Client ID** | auto | Généré automatiquement (`username_deviceId`) |

---

## 4. Paramètres de localisation

### Accès
`ⓘ → Settings → Advanced` ou `ⓘ → Settings → Move` (selon version)

---

### 4.1 Paramètres principaux

| Paramètre iOS | Clé JSON | Valeur défaut | Description |
|---------------|----------|---------------|-------------|
| **Locator Displacement** | `locatorDisplacement` | `100` mètres | Distance minimale à parcourir avant une nouvelle publication (Move Mode) |
| **Locator Interval** | `locatorInterval` | `300` secondes | Intervalle maximum entre deux publications (Move Mode) |
| **Ignore Inaccurate Locations** | `ignoreInaccurateLocations` | `0` (off) | Supprimer les positions dont la précision est > X mètres (0 = off) |
| **Ignore Stale Locations** | `ignoreStaleLocations` | `0` jours | Filtrer les positions des amis plus vieilles que X jours |
| **Positions** | `positions` | `50` | Nombre de positions à conserver localement et afficher |
| **Days** | `days` | `-1` | Jours de conservation locale (0=off, -1=utilise `positions`) |

---

### 4.2 Monitoring mode (Mode de surveillance)

| Clé JSON | Valeur | Description |
|----------|--------|-------------|
| `monitoring` | `-1` | Quiet — aucune publication automatique |
| `monitoring` | `0` | Manual — publication manuelle uniquement |
| `monitoring` | `1` | Significant — standard, économique |
| `monitoring` | `2` | Move — fréquent, précis, consomme la batterie |

---

## 5. Les 4 modes de surveillance

### 5.1 Mode Quiet `[]`
- **Publication** : uniquement manuelle (l'utilisateur appuie sur "Publish")
- **Zones** : aucune transition publiée
- **Batterie** : impact minimal
- **Usage** : vie privée totale, pas de tracking

---

### 5.2 Mode Manual `||`
- **Publication** : manuelle uniquement (l'utilisateur décide quand publier)
- **Zones** : les transitions enter/leave des zones sont toujours publiées automatiquement
- **Batterie** : impact minimal
- **Usage** : discrétion avec suivi des zones importantes

---

### 5.3 Mode Significant `|>`
- **Publication** : automatique lors de "changements significatifs"
- **Critère Apple** : ≥ 500 mètres ET ≥ 5 minutes écoulées
- **Ping** : un message de type `p` (ping) est envoyé périodiquement même sans mouvement
- **Batterie** : impact faible ✅ (recommandé au quotidien)
- **Usage** : suivi quotidien normal

> 📌 **Comportement** : si tu ne bouges pas, aucune publication — même après des heures. Un ping est quand même envoyé.

---

### 5.4 Mode Move `||>`
- **Publication** : dès que `locatorDisplacement` mètres sont parcourus OU après `locatorInterval` secondes
- **GPS** : utilisation permanente du GPS
- **Batterie** : impact élevé ⚠️ (comme une appli de navigation)
- **Usage** : déplacements actifs, suivi en temps réel, branché sur chargeur

> 📌 **Recommandation** : utiliser Move Mode uniquement en voiture/vélo branché. Sinon Significant.

---

## 6. Mode Expert — Tous les paramètres avancés

### Accès
`ⓘ → Settings → Advanced` (certaines options selon version de l'app)

---

### 6.1 Tableau complet des paramètres expert iOS

| Paramètre App | Clé JSON Config | Type | Défaut | Description détaillée |
|---------------|-----------------|------|--------|----------------------|
| **Extended Data** | `extendedData` | bool | `false` | Active les champs `conn` (connexion) et `p` (pression baro) dans chaque message — **activer pour avoir connectionInt, ssid, bssid, pressure dans Loxone** |
| **Locator Displacement** | `locatorDisplacement` | int (m) | `100` | Distance min en mètres avant nouvelle publication en Move Mode |
| **Locator Interval** | `locatorInterval` | int (s) | `300` | Intervalle max en secondes entre deux publications en Move Mode |
| **Adapt** | `adapt` | int (min) | `0` | Minutes d'immobilité avant passage auto de Move → Significant (0 = désactivé) |
| **Downgrade** | `downgrade` | int (%) | `0` | Seuil batterie (%) en-dessous duquel Move passe auto en Significant (0 = désactivé) |
| **Max History** | `maxHistory` | int | `0` | Nombre de notifications à garder (0 = pas d'historique) |
| **Positions** | `positions` | int | `50` | Nombre de positions conservées pour soi et les amis |
| **Days** | `days` | int | `-1` | Jours de conservation locale des positions (0=off, -1=utilise positions) |
| **Ignore Inaccurate** | `ignoreInaccurateLocations` | int (m) | `0` | Supprime les positions < X mètres de précision (0 = off) |
| **Ignore Stale** | `ignoreStaleLocations` | int (jours) | `0` | Masquer positions amis > X jours (0 = off) |
| **Ranging** | `ranging` | bool | `false` | Active le ranging iBeacon (mesure de distance aux beacons en continu — attention batterie) |
| **Allow Remote Location** | `allowRemoteLocation` | bool | `true` | Répond aux commandes `reportLocation` distantes |
| **cmd** | `cmd` | bool | `true` | Répond aux commandes distantes (reportLocation, dump, status, etc.) |
| **Remote Configuration** | `remoteConfiguration` | bool | `false` | Accepte la reconfig complète à distance via `setConfiguration` |
| **Lock** | `locked` | bool | `false` | Verrouille l'écran Settings sur l'appareil (empêche modification manuelle) |
| **No Map** | `noMap` | int | `0` | Désactive l'interaction avec la carte (1=off, -1=on) |
| **No Reverse Geo** | `noRevgeo` | int | `0` | Désactive le géocodage inverse (1=off, -1=on) |
| **Pub Retain** | `pubRetain` | bool | `true` | MQTT retain flag sur les messages publiés |
| **Pub QoS** | `pubQos` | int | `1` | QoS MQTT (0/1/2) |
| **Clean Session** | `cleanSession` | bool | `false` | Session MQTT propre à chaque connexion |
| **Keepalive** | `keepalive` | int (s) | `60` | Intervalle keepalive MQTT |
| **Sub Topic** | `subTopic` | string | auto | Topics MQTT auxquels s'abonner (espace entre topics multiples) |
| **Pub Topic Base** | `pubTopicBase` | string | `owntracks/%u/%d` | Base topic de publication (%u=username, %d=deviceId) |
| **HTTP Headers** | `httpHeaders` | string | — | Headers HTTP supplémentaires (mode HTTP uniquement) |
| **OSM Template** | `osmTemplate` | string | OpenStreetMap | URL template pour tuiles cartographiques alternatives |
| **Encryption Key** | `encryptionKey` | string | — | Clé de chiffrement payload (jusqu'à 32 caractères) |
| **MQTT Protocol** | `mqttProtocolLevel` | int | `4` | 3=MQTT3 / 4=MQTT3.1.1 / 5=MQTT5 |
| **TLS** | `tls` | bool | `false` | Activer TLS sur la connexion MQTT |
| **Client pkcs12** | `clientpkcs` | string | — | Fichier certificat client pkcs12 |
| **WebSockets** | `ws` | bool | `false` | MQTT over WebSocket |

---

### 6.2 Paramètres Extended Data (données supplémentaires)

> ⚠️ **ACTIVER ABSOLUMENT** dans l'app pour avoir toutes les données dans Loxone !

Chemin : `ⓘ → Settings → Advanced → Extended Data → ON`

Champs débloqués une fois activé :
| Champ | Données ajoutées |
|-------|-----------------|
| `conn` | Type de connexion : `w`=WiFi / `m`=mobile / `o`=offline |
| `p` | Pression barométrique en kPa |

Ces champs alimentent dans Loxone :
- `OT_<USER>_connection` / `OT_<USER>_connectionInt`
- `OT_<USER>_pressure`

---

### 6.3 Paramètre "Downgrade" (batterie)

Protège la batterie automatiquement :
```
Si batterie < downgrade% ET mode = Move
  → Bascule automatiquement en Significant Mode
  → Affichage : "Significant!" dans l'app

Si chargeur reconnecté
  → Rebascule automatiquement en Move Mode
```

**Recommandation** : `downgrade = 20` (bascule à 20% de batterie)

---

### 6.4 Paramètre "Adapt" (inactivité)

Économise la batterie quand tu ne bouges plus :
```
Si immobile depuis adapt minutes ET mode = Move
  → Bascule automatiquement en Significant Mode
  → Affichage : "Significant#" dans l'app

Dès que mouvement détecté
  → Rebascule automatiquement en Move Mode
```

> ⚠️ **Prérequis** : une zone `+follow` doit être configurée pour que `adapt` fonctionne

**Recommandation** : `adapt = 5` (bascule après 5 min d'immobilité)

---

## 7. Zones géographiques (Waypoints / Regions / Geofences)

### Accès
`ⓘ → Regions` puis `+` pour ajouter

### 7.1 Créer une zone

| Champ | Description | Exemple |
|-------|-------------|---------|
| **Description** | Nom de la zone (utilisé dans `inregions`) | `Maison` |
| **Latitude** | Latitude du centre | `48.8566` |
| **Longitude** | Longitude du centre | `2.3522` |
| **Radius** | Rayon en mètres (> 0 active la surveillance) | `100` |
| **UUID** | UUID iBeacon (optionnel — voir section 8) | — |
| **Major** | Numéro major beacon | — |
| **Minor** | Numéro minor beacon | — |

> 📌 **Le nom de la zone doit correspondre exactement à `CONFIG.ZONES.HOME` dans config.js**

### 7.2 Comportement des zones

```
Entrée dans la zone → publication _type=transition event="enter"
Sortie de la zone   → publication _type=transition event="leave"
Position en zone    → champ "inregions": ["NomZone"] dans _type=location
```

### 7.3 Zone spéciale `+follow`

Créer une zone dont le nom commence par `+` :
- **Nom** : `+follow` (ou `+60follow` pour 60 secondes)
- **Radius** : > 0 (ex: 50)
- **Effet** : les coordonnées sont mises à jour dynamiquement à chaque position publiée, le rayon = distance parcourue en 30s (min 50m)
- **Usage** : réveille l'app en background pour un suivi plus régulier, requis pour `adapt`
- ⚠️ Ne déclenche pas d'events enter/leave (trigger `C`)

### 7.4 Zone avec changement de mode automatique

Nommer la zone avec le suffixe `|<mode_entrée>|<mode_sortie>` :
```
Exemple : "Maison|1|2"
→ Entre dans "Maison" : bascule en mode Significant (1)
→ Sort de "Maison"    : bascule en mode Move (2)
```

Modes : `-1`=Quiet / `0`=Manual / `1`=Significant / `2`=Move
> ⚠️ Ne pas utiliser `-1` (Quiet) en mode sortie — arrête toute détection de zones

### 7.5 Zone avec beacon mobile (radius négatif)

Mettre le radius à `-1` :
- Les coordonnées du waypoint se mettent à jour à chaque enter/leave
- Utile pour **suivre des objets mobiles** (voiture, bagage)

---

## 8. iBeacons

### Principe
Les iBeacons sont des émetteurs Bluetooth Low Energy qui permettent une détection de présence précise à quelques mètres (bien plus précis que le GPS en intérieur).

### Configuration d'un beacon dans OwnTracks

Dans `Regions → + → Nouvelle zone` :
| Champ | Valeur |
|-------|--------|
| **Description** | `NomBeacon` (ex: `EntréeMaison`) |
| **Radius** | `0` (zéro = mode beacon, pas GPS) |
| **UUID** | `XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX` |
| **Major** | `0` = tous / `1-65535` = spécifique |
| **Minor** | `0` = tous / `1-65535` = spécifique |

### Exemples de configurations

```
# Surveiller TOUS les beacons d'un UUID
Nom   : Maison
UUID  : CA271EAE-5FA8-4E80-8F08-2A302A95A959
Major : 0
Minor : 0

# Surveiller un beacon précis (une pièce)
Nom   : Salon
UUID  : CA271EAE-5FA8-4E80-8F08-2A302A95A959
Major : 1
Minor : 42
```

### Beacon avec tenue de connexion (hold-down)

Mettre un `-` comme premier caractère du nom :
```
Nom : -EntréeMaison
```
→ Ignore les courtes interruptions de signal (évite les faux leave/enter)

### Ranging (mesure de distance en temps réel)

`Settings → Advanced → Ranging → ON`
- Publie en continu la distance et la puissance du signal (`rssi`, `prox`, `acc`)
- ⚠️ **Impact fort sur la batterie** — utiliser ponctuellement

### Format de l'event transition beacon
```json
{
    "_type": "transition",
    "t": "b",
    "event": "enter",
    "desc": "EntréeMaison",
    "lat": 48.8566,
    "lon": 2.3522,
    "acc": 65,
    "tst": 1433342520,
    "tid": "DA"
}
```

---

## 9. Extended Data — Données étendues

### Activation
`ⓘ → Settings → Advanced → Extended Data → ON`

### Champs supplémentaires activés

| Champ JSON | Donnée | Loxone |
|-----------|--------|--------|
| `conn` | Type connexion (`w`/`m`/`o`) | `OT_<USER>_connection` + `connectionInt` |
| `p` | Pression barométrique (kPa) | `OT_<USER>_pressure` |
| `SSID` | Nom réseau WiFi | `OT_<USER>_ssid` |
| `BSSID` | MAC point d'accès WiFi | `OT_<USER>_bssid` |

> 📌 Sans Extended Data, les champs `connection`, `pressure`, `ssid`, `bssid` ne seront jamais envoyés.

---

## 10. Chiffrement des payloads

### Principe
Chiffre tout le contenu JSON avec une clé symétrique (libsodium).
Le payload devient : `{"_type":"encrypted","data":"...base64..."}`

### Configuration
`ⓘ → Settings → Advanced → Encryption Key`

| Paramètre | Valeur |
|-----------|--------|
| **Encryption Key** | Passphrase jusqu'à 32 caractères |

> ⚠️ **Pour ioBroker** : si tu actives le chiffrement, tu dois configurer la même clé dans l'adaptateur OwnTracks ioBroker (`Clé de chiffrement` dans la config de l'instance). Sans ça, ioBroker ne pourra pas lire les données.

---

## 11. Configuration à distance (Remote Config)

### Activation sur le téléphone
`ⓘ → Settings → Advanced → Remote Configuration → ON`

### Ce que ça permet
Envoyer une configuration complète au téléphone via MQTT sans y toucher physiquement.

### Format du fichier de config (`.otrc`)
```json
{
    "_type": "configuration",
    "host": "192.168.10.20",
    "port": 1884,
    "username": "owntracks",
    "password": "VOIR_config.js",
    "deviceId": "Kevin",
    "tid": "KE",
    "monitoring": 1,
    "extendedData": true,
    "locatorDisplacement": 100,
    "locatorInterval": 300,
    "downgrade": 20,
    "adapt": 5,
    "pubRetain": true,
    "pubQos": 1,
    "keepalive": 60,
    "cleanSession": false,
    "cmd": true,
    "allowRemoteLocation": true
}
```

### Envoi par URL (le plus simple)
```
owntracks:///config?inline=<BASE64 DU FICHIER>
```

Générer le lien :
```bash
openssl enc -a -A -in config.otrc
```

### Envoi par MQTT (commande)
Publier sur le topic `owntracks/<user>/<device>/cmd` :
```json
{
    "_type": "cmd",
    "action": "setConfiguration",
    "configuration": {
        "_type": "configuration",
        "monitoring": 2,
        "extendedData": true
    }
}
```

### Commandes distantes disponibles (si `cmd=true`)

| Commande | Effet |
|----------|-------|
| `reportLocation` | Force une publication de position immédiate |
| `reportSteps` | Publie le compteur de pas actuel |
| `dump` | Publie la configuration complète de l'app |
| `status` | Publie l'état système de l'app |
| `waypoints` | Publie la liste des zones configurées |
| `clearWaypoints` | Supprime toutes les zones |
| `setWaypoints` | Importe/remplace des zones à distance |
| `setConfiguration` | Modifie la configuration à distance |

---

## 12. Podomètre (Steps)

### Activation sur iPhone
`Réglages iPhone → Confidentialité → Mouvement et fitness → OwnTracks → Autoriser`

### Activation dans OwnTracks
Le podomètre se déclenche via la commande distante `reportSteps` ou automatiquement.

### Données publiées
```json
{
    "_type": "steps",
    "tst": 1700000000,
    "steps": 3842,
    "from": 1699913600,
    "to":   1700000000
}
```

| Champ | Description | Loxone |
|-------|-------------|--------|
| `steps` | Nombre de pas (-1 si non supporté) | `OT_<USER>_steps` |
| `from` | Début de la période (epoch) | `OT_<USER>_stepsFrom` |
| `to` | Fin de la période (epoch) | `OT_<USER>_stepsTo` |

---

## 13. Points d'intérêt (POI) & Tags

### Accès
→ Appui long sur la carte **ou** bouton "Publish" → sélectionner l'action

### POI (Point of Interest)
- L'utilisateur saisit une description lors d'une publication manuelle
- Ajouté dans le JSON : `"poi": "Meilleur restaurant sushi"`
- Publication unique — ne persiste pas aux publications suivantes

### Tag
- L'utilisateur saisit un tag qui sera ajouté à **toutes** les publications suivantes
- Persiste jusqu'à ce que l'utilisateur le supprime
- Ajouté dans le JSON : `"tag": "Vacances été 2026"`
- Fonctionne dans tous les modes (Significant, Move, etc.)

| Champ | Type | Loxone | Comportement |
|-------|------|--------|--------------|
| `poi` | string | `OT_<USER>_poi` | Publication unique, manuel |
| `tag` | string | `OT_<USER>_tag` | Persistant jusqu'à suppression |

---

## 14. Changements automatiques de mode

### 14.1 Contrôle par la batterie (Downgrade)
```
Condition    : batterie < downgrade% ET mode actuel = Move
Action       : Move → Significant (affiché "Significant!")
Restauration : chargeur branché → Significant → Move automatiquement
Config JSON  : "downgrade": 20
```

### 14.2 Contrôle par l'inactivité (Adapt)
```
Condition    : pas de mouvement pendant adapt minutes ET mode = Move
               + zone +follow active (obligatoire)
Action       : Move → Significant (affiché "Significant#")
Restauration : prochain mouvement détecté → Significant → Move
Config JSON  : "adapt": 5
```

### 14.3 Contrôle par les zones géographiques
```
Nom de zone  : "Maison|1|2"
Entrée zone  → bascule en mode 1 (Significant)
Sortie zone  → bascule en mode 2 (Move)
```

### Combinaison recommandée (usage quotidien optimal)
```json
{
    "monitoring": 1,
    "downgrade": 20,
    "adapt": 5
}
+ Zone : "Maison|1|2"
+ Zone : "+follow" (radius: 50)
```
→ Move quand tu quittes la maison, Significant à la maison, protection batterie automatique.

---

## 15. Export GPX & Mode Offline

### Mode Offline
- Sélectionner MQTT + Port `0` (zéro)
- L'app stocke les positions localement sans les envoyer
- Nombre de jours stockés : paramètre `days`

### Export GPX
`ⓘ → Status → Export GPX`
- Exporte toutes les positions stockées localement au format GPX
- Utile pour importer dans des apps de cartographie (Komoot, Maps, etc.)

---

## 16. Paramétrage recommandé pour ioBroker + Loxone

### Configuration complète optimale

```json
{
    "_type": "configuration",

    "host"     : "192.168.10.20",
    "port"     : 1884,
    "username" : "owntracks",
    "password" : "VOIR_config.js",
    "deviceId" : "Kevin",
    "tid"      : "KE",

    "monitoring"          : 1,
    "extendedData"        : true,

    "locatorDisplacement" : 100,
    "locatorInterval"     : 300,
    "downgrade"           : 20,
    "adapt"               : 5,

    "pubRetain"           : true,
    "pubQos"              : 1,
    "keepalive"           : 60,
    "cleanSession"        : false,

    "cmd"                 : true,
    "allowRemoteLocation" : true,
    "remoteConfiguration" : false,

    "ignoreInaccurateLocations" : 150,
    "positions"                 : 50,

    "tls" : false,
    "ws"  : false
}
```

### Zones à configurer dans l'app

| Nom | Latitude | Longitude | Radius | Rôle |
|-----|----------|-----------|--------|------|
| `Maison` | ta lat | ton lon | `100` | Détection présence maison → `isHome` dans Loxone |
| `+follow` | ta lat | ton lon | `50` | Réveille l'app, requis pour `adapt` |

> ✅ Remplacer `Maison` par le nom exact de ta zone dans `config.js → ZONES.HOME`

### Checklist avant de tester

- [ ] **Extended Data = ON** (pour avoir connexion/WiFi/pression)
- [ ] **Localisation = Toujours** dans les réglages iPhone
- [ ] **Mouvement & Fitness autorisé** pour OwnTracks (pour les pas)
- [ ] **Device ID = Kevin** (ou David, ou Carole) — PAS d'espace, respect de la casse
- [ ] **Zone "Maison"** créée avec radius > 0
- [ ] **Zone "+follow"** créée avec radius > 0
- [ ] **Connexion MQTT vérifiée** : `ⓘ → Status → Connected`
- [ ] **ioBroker** : adaptateur owntracks.0 vert ✅

---

*Document généré le 2026-04-22 — Installation Kevin / David / Carole (ioBroker + Loxone + OwnTracks iOS)*
