# OwnTracks → ioBroker → Loxone

## Description

Ce projet fournit un script ioBroker qui récupère **toutes les données brutes**
envoyées par l'application **OwnTracks** (géolocalisation des téléphones) et les
pousse automatiquement vers le **Loxone Miniserver** via ses entrées virtuelles HTTP.

### Architecture

```
📱 Téléphone (OwnTracks App)
        │
        │  MQTT / HTTP
        ▼
🖥️  ioBroker (Adaptateur OwnTracks)
        │
        │  owntracks.0.users.<NOM>.*
        ▼
📜 Script : owntracks_to_loxone.js
        │
        │  HTTP GET → Virtual Input
        ▼
🏠 Loxone Miniserver
```

---

## Philosophie

- **Pas de logique métier dans le script** : le script pousse les données brutes,
  c'est Loxone qui gère la domotique
- **Détection automatique des utilisateurs** : pas besoin de configurer manuellement
  chaque téléphone, le script les détecte tout seul
- **Code lisible et commenté** : des balises claires permettent de modifier facilement
  le comportement sans tout comprendre

---

## Structure du projet

```
owntrack-iobroker-loxone/
├── README.md                        ← Ce fichier
├── scripts/
│   └── owntracks_to_loxone.js       ← Script principal ioBroker (JavaScript)
└── loxone/
    └── virtual_inputs.md            ← Liste des entrées virtuelles à créer dans Loxone Config
```

---

## Prérequis

### ioBroker
- Adaptateur **OwnTracks** installé et configuré (`owntracks.0`)
- Adaptateur **JavaScript** installé (pour exécuter le script)

### Application OwnTracks (téléphone)
- Mode de connexion : **MQTT Private**
- Host : IP de ton serveur ioBroker
- Port : 1883 (par défaut de l'adaptateur OwnTracks)
- DeviceID : prénom de la personne (ex: `David`, `Carole`, `Kevin`)

### Loxone
- Miniserver accessible en HTTP sur le réseau local
- Entrées virtuelles HTTP créées (voir `loxone/virtual_inputs.md`)

---

## Installation

### 1. Configurer le script

Ouvrir `scripts/owntracks_to_loxone.js` et modifier la section `CONFIG` :

```javascript
const CONFIG = {
    LOXONE_IP   : "192.168.1.77",   // ← IP de ton Loxone Miniserver
    LOXONE_PORT : 80,               // ← Port HTTP (80 par défaut)
    LOXONE_USER : "admin",          // ← Utilisateur Loxone
    LOXONE_PASS : "admin",          // ← Mot de passe Loxone

    OWNTRACKS_INSTANCE : "owntracks.0",   // ← Instance OwnTracks

    POLLING_INTERVAL_MS : 30000,    // ← Polling de sécurité (30s)

    DEBUG : true,                   // ← true = logs détaillés
};
```

### 2. Créer les entrées virtuelles dans Loxone Config

Se référer à `loxone/virtual_inputs.md` pour la liste complète.

Format du nom : `OT_<NomUtilisateur>_<champ>`

Exemples :
- `OT_David_latitude`
- `OT_Carole_battery`
- `OT_Kevin_isHome`

### 3. Importer le script dans ioBroker

1. Ouvrir l'interface ioBroker Admin
2. Aller dans **Scripts** (adaptateur JavaScript)
3. Créer un nouveau script de type **JavaScript**
4. Coller le contenu de `scripts/owntracks_to_loxone.js`
5. **Sauvegarder** et **Démarrer** le script

---

## Données disponibles par utilisateur

| Variable Loxone              | Description                            | Type       |
|------------------------------|----------------------------------------|------------|
| `OT_<USER>_latitude`         | Latitude GPS                           | float      |
| `OT_<USER>_longitude`        | Longitude GPS                          | float      |
| `OT_<USER>_accuracy`         | Précision GPS (mètres)                 | int        |
| `OT_<USER>_altitude`         | Altitude (mètres)                      | int        |
| `OT_<USER>_velocity`         | Vitesse (km/h)                         | int        |
| `OT_<USER>_course`           | Cap/direction (degrés)                 | int        |
| `OT_<USER>_battery`          | Batterie téléphone (%)                 | int        |
| `OT_<USER>_batteryStatus`    | État batterie (0/1/2/3)               | int        |
| `OT_<USER>_timestamp`        | Timestamp UNIX                         | int        |
| `OT_<USER>_datetime`         | Date/heure lisible                     | string     |
| `OT_<USER>_connection`       | Type connexion (w/m/o)                | string     |
| `OT_<USER>_connectionInt`    | Connexion numérique (0/1/2)           | int        |
| `OT_<USER>_ssid`             | Nom réseau WiFi                        | string     |
| `OT_<USER>_regions`          | Zones actuelles (JSON)                 | string     |
| `OT_<USER>_isHome`           | Présence à la maison (0/1)            | int        |
| `OT_<USER>_motionactivities` | Activité détectée                      | string     |
| `OT_<USER>_trigger`          | Déclencheur de la mise à jour         | string     |
| `OT_<USER>_trackerID`        | Initiales (2 caractères)              | string     |

---

## Ajout d'un nouvel utilisateur

**Aucune modification du script nécessaire.**

1. Sur le nouveau téléphone, configurer OwnTracks avec :
   - Le même serveur MQTT (ioBroker)
   - Un DeviceID unique (ex: `Kevin`)
2. Dès que le téléphone envoie sa première position, le script détecte
   automatiquement le nouvel utilisateur
3. Créer les entrées virtuelles correspondantes dans Loxone Config
   (ex: `OT_Kevin_latitude`, `OT_Kevin_battery`, etc.)

---

## Personnalisation

### Changer le nom de la zone "Maison"

Dans le script, chercher la balise :
```javascript
// 💡 BALISE — Présence à la maison
```
Et modifier `"Maison"` par le nom exact de ta zone OwnTracks.

### Ajouter d'autres champs

Le script est conçu pour être étendu facilement.
Chaque champ suit le même pattern :
```javascript
on({ id: base + "<champ_owntracks>", change: "any" }, function(obj) {
    sendToLoxone(loxoneName(userName, "<nom_loxone>"), obj.state.val);
});
```

---

## Auteur

**David** — Installation domotique Loxone + ioBroker + OwnTracks

---

## Version

| Version | Date       | Description              |
|---------|------------|--------------------------|
| 1.0.0   | 2026-04-22 | Version initiale         |
