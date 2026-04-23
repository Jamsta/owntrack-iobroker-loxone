# 🎮 Commandes Bidirectionnelles OwnTracks — ioBroker → iPhone

> **Version :** 2.1 — 2026-04-22  
> **Script :** owntracks_to_loxone.js v5.4+

---

## Sommaire

1. [Principe de fonctionnement](#1-principe)
2. [Prérequis](#2-prérequis)
3. [Liste des commandes](#3-commandes)
4. [Fonctions prêtes à l'emploi](#4-fonctions)
5. [États ioBroker créés automatiquement](#5-états-iobroker)
6. [Intégration Loxone](#6-loxone)
7. [Exemples concrets](#7-exemples)
8. [Dépannage](#8-dépannage)

---

## 1. Principe

```
ioBroker / Loxone
     │
     │  JSON publié sur topic MQTT
     ▼
mqtt.0 (broker, port 1884)
     │
     │  owntracks/owntracks/<deviceId>/cmd
     ▼
iPhone OwnTracks
     │
     │  exécute la commande
     ▼
Réponse automatique (location, steps, dump...)
     │
     ▼
mqtt.0.owntracks.owntracks.<user> → script → Loxone
```

**Topic de commande :** `owntracks/owntracks/<deviceId>/cmd`  
Exemple pour kevin : `owntracks/owntracks/kevin/cmd`

---

## 2. Prérequis

| Élément | Valeur |
|---|---|
| Adaptateur MQTT | `mqtt.0` actif sur port **1884** |
| Script principal | `owntracks_to_loxone.js` v5.0+ |
| `COMMANDS_ENABLED` | `true` dans `config.js` |
| `DEVICES` | `{"kevin":"kevin", "carole":"carole"}` — DeviceID = UserID lowercase |
| iPhone OwnTracks | **cmd : ON** dans Settings → Advanced |

---

## 3. Commandes

### 3.1 `reportLocation` — Forcer un fix GPS immédiat

```json
{ "_type": "cmd", "action": "reportLocation" }
```
**Effet :** Le téléphone publie immédiatement sa position GPS  
**Délai :** < 5 secondes  
**Réponse :** `_type=location` normal

---

### 3.2 `reportSteps` — Demander le podomètre

```json
{ "_type": "cmd", "action": "reportSteps" }
```
**Effet :** Le téléphone publie ses données podomètre  
**Réponse :** `_type=steps` avec steps, distance, floorsUp, floorsDown  
**Nécessite :** Autorisation "Mouvement & Fitness" sur l'iPhone

---

### 3.3 `restart` — Redémarrer l'app OwnTracks

```json
{ "_type": "cmd", "action": "restart" }
```
**⚠️ Attention :** Interrompt le tracking ~10 secondes  
**Utilité :** Résoudre un blocage sans toucher le téléphone

---

### 3.4 `dump` — Rapport complet d'état

```json
{ "_type": "cmd", "action": "dump" }
```
**Réponse :** Configuration complète + waypoints + état app  
**Utilité :** Diagnostic, vérification config à distance  
**Données Loxone mises à jour :** deviceId, trackerID, extendedData, cmdEnabled, waypointsCount

---

### 3.5 `setWaypoints` — Envoyer des zones géographiques

```json
{
  "_type": "cmd",
  "action": "setWaypoints",
  "waypoints": {
    "_type": "waypoints",
    "waypoints": [
      {
        "_type" : "waypoint",
        "desc"  : "Maison",
        "lat"   : 44.7015,
        "lon"   : -0.8464,
        "rad"   : 50,
        "tst"   : 1776898604
      }
    ]
  }
}
```

**Champs waypoint :**

| Champ | Type | Description |
|---|---|---|
| `desc` | string | Nom de la zone (affiché dans l'app) |
| `lat` | float | Latitude du centre |
| `lon` | float | Longitude du centre |
| `rad` | int | Rayon en mètres |
| `tst` | int | Timestamp epoch |
| `rid` | string | ID unique (auto-généré si absent) |

---

### 3.6 `setConfiguration` — Modifier la config à distance

```json
{
  "_type": "cmd",
  "action": "setConfiguration",
  "configuration": {
    "_type": "configuration",
    "monitoring": 2
  }
}
```

**Paramètres utiles :**

| Paramètre | Type | Valeurs | Description |
|---|---|---|---|
| `monitoring` | int | `1` / `2` | 1=significant (éco) / 2=move (précis) |
| `locatorDisplacement` | int | mètres | Distance min avant nouvelle position |
| `locatorInterval` | int | secondes | Intervalle max entre deux positions |
| `downgrade` | int | % batterie | Passer en éco sous ce niveau |
| `pubRetain` | bool | true/false | Messages MQTT retained |

---

## 4. Fonctions

Toutes ces fonctions sont disponibles directement dans le script :

```javascript
// Forcer un fix GPS
cmdReportLocation("kevin");

// Demander le podomètre
cmdReportSteps("kevin");

// Redémarrer l'app (avec précaution)
cmdRestart("kevin");

// Rapport d'état complet
cmdDump("kevin");

// Envoyer des zones géographiques
cmdSetWaypoints("kevin", [
    {
        _type : "waypoint",
        desc  : "Maison",
        lat   : 44.7015,
        lon   : -0.8464,
        rad   : 50,
        tst   : Math.floor(Date.now() / 1000)
    }
]);

// Modifier la config
cmdSetConfiguration("kevin", { monitoring: 1 }); // éco batterie
cmdSetConfiguration("kevin", { monitoring: 2 }); // mode précis

// Envoyer les mêmes zones à tous les utilisateurs
var zones = [
    { _type:"waypoint", desc:"Maison",        lat:44.7015, lon:-0.8464, rad:50,  tst:Math.floor(Date.now()/1000) },
    { _type:"waypoint", desc:"Ecole Gustave", lat:44.7007, lon:-0.8465, rad:100, tst:Math.floor(Date.now()/1000) }
];
["kevin", "carole"].forEach(function(u) { cmdSetWaypoints(u, zones); });
```

---

## 5. États ioBroker créés automatiquement

Au démarrage, pour chaque utilisateur dans `CONFIG.USERS` :

```
javascript.0.
├── OT_CMD_reportLocation_kevin   ← mettre à 1 pour forcer GPS
├── OT_CMD_reportLocation_carole
├── OT_CMD_reportSteps_kevin
├── OT_CMD_reportSteps_carole
├── OT_CMD_restart_kevin
├── OT_CMD_restart_carole
├── OT_CMD_dump_kevin
└── OT_CMD_dump_carole
```

**Comportement :** Mettre à `1` → déclenche la commande → remet à `0` automatiquement (bouton pulse).

---

## 6. Intégration Loxone

### Option A — Via simple-api ioBroker (⭐ Recommandé)

#### Installation de l'adaptateur simple-api

1. ioBroker **Admin → Adaptateurs → Chercher "simple-api"**
2. Installer → il tourne sur le **port 8087** par défaut

#### Créer une Sortie Virtuelle HTTP dans Loxone Config

1. Loxone Config → **Périphériques virtuels → Ajouter → Sortie HTTP virtuelle**
2. **Adresse** : `http://192.168.10.20:8087`
3. Ajouter des **commandes de sortie** (une par action) :

| Commande Loxone | URL à configurer | Effet |
|---|---|---|
| GPS Kevin | `/setBulk?javascript.0.OT_CMD_reportLocation_kevin=1` | Force fix GPS Kevin |
| GPS Carole | `/setBulk?javascript.0.OT_CMD_reportLocation_carole=1` | Force fix GPS Carole |
| Pas Kevin | `/setBulk?javascript.0.OT_CMD_reportSteps_kevin=1` | Podomètre Kevin |
| Pas Carole | `/setBulk?javascript.0.OT_CMD_reportSteps_carole=1` | Podomètre Carole |
| Dump Kevin | `/setBulk?javascript.0.OT_CMD_dump_kevin=1` | Diagnostic Kevin |
| Dump Carole | `/setBulk?javascript.0.OT_CMD_dump_carole=1` | Diagnostic Carole |
| Restart Kevin | `/setBulk?javascript.0.OT_CMD_restart_kevin=1` | Redémarre app Kevin |
| Restart Carole | `/setBulk?javascript.0.OT_CMD_restart_carole=1` | Redémarre app Carole |

**URL complète exemple :**
```
http://192.168.10.20:8087/setBulk?javascript.0.OT_CMD_reportLocation_kevin=1
```

> ⚠️ Le port **8081** (Admin ioBroker) ne supporte **pas** `/setBulk` — utiliser **8087** (simple-api).  
> ⚠️ Le port **8082** est l'ancien port de l'adaptateur "web" — préférer **8087** (simple-api dédié).

---

### Option B — Via l'adaptateur loxone.0

```javascript
// Dans un script ioBroker séparé
on({ id: "loxone.0.trigger_forcer_gps_kevin", change: "any" }, function(obj) {
    if (obj.state.val === 1) {
        setState("javascript.0.OT_CMD_reportLocation_kevin", 1, true);
    }
});
```

---

### Option C — Appel direct dans le script principal

```javascript
// Dans owntracks_to_loxone.js, dans un on() existant
on({ id: "loxone.0.capteur_porte", change: "any" }, function(obj) {
    if (obj.state.val === 1) {
        cmdReportLocation("kevin");
    }
});
```

---

## 7. Exemples concrets

### Forcer GPS à l'ouverture de la porte

```javascript
on({ id: "loxone.0.capteur_porte_entree", change: "any" }, function(obj) {
    if (obj.state.val === 1) {
        setTimeout(function() { cmdReportLocation("kevin");  }, 0);
        setTimeout(function() { cmdReportLocation("carole"); }, 500);
    }
});
```

### Mode économie la nuit

```javascript
// 23h00 : mode économie
schedule("0 23 * * *", function() {
    ["kevin", "carole"].forEach(function(u) {
        cmdSetConfiguration(u, { monitoring: 1, locatorDisplacement: 500 });
    });
});

// 7h00 : mode normal
schedule("0 7 * * *", function() {
    ["kevin", "carole"].forEach(function(u) {
        cmdSetConfiguration(u, { monitoring: 2, locatorDisplacement: 30 });
    });
});
```

### Diagnostic quotidien

```javascript
schedule("0 8 * * *", function() {
    ["kevin", "carole"].forEach(function(u) { cmdDump(u); });
});
```

### Déployer les zones sur tous les téléphones

```javascript
var zones = [
    { _type:"waypoint", desc:"Maison",        lat:44.7015, lon:-0.8464, rad:50,  tst:Math.floor(Date.now()/1000) },
    { _type:"waypoint", desc:"Ecole Gustave", lat:44.7007, lon:-0.8465, rad:100, tst:Math.floor(Date.now()/1000) }
];
["kevin", "carole"].forEach(function(u) { cmdSetWaypoints(u, zones); });
```

---

## 8. Dépannage

### La commande n'arrive pas au téléphone

1. Vérifier que `mqtt.0` est **actif** (vert dans Instances)
2. Vérifier le topic dans les logs ioBroker : `owntracks/owntracks/<deviceId>/cmd`
3. Vérifier que `DEVICES[userName]` = le bon DeviceID (en minuscules)
4. Vérifier que l'iPhone est connecté à `mqtt.0` port 1884
5. Dans l'app OwnTracks : **cmd doit être ON** (Settings → Advanced)

### `/setBulk` retourne une erreur 404

- Vérifier que l'adaptateur **simple-api** est installé et actif (port 8087)
- Tester dans le navigateur : `http://192.168.10.20:8087/get/javascript.0.OT_CMD_reportLocation_kevin`
- Si "Not found" → vérifier que l'état existe dans ioBroker (script démarré ?)

### `sendTo("mqtt.0", ...)` retourne une erreur

- Vérifier que l'adaptateur `mqtt.0` est installé (pas seulement `owntracks.0`)
- Vérifier que `COMMANDS_ENABLED: true` dans `config.js`

### `reportSteps` retourne 0 ou ne répond pas

- Vérifier l'autorisation **Mouvement & Fitness** sur l'iPhone :
  `Réglages → OwnTracks → Mouvement et fitness → Autoriser`

---

## Fichiers associés

| Fichier | Description |
|---|---|
| `config.js` | COMMANDS_ENABLED, DEVICES, USERS |
| `scripts/owntracks_to_loxone.js` | Script principal — toutes les fonctions |
| `loxone/virtual_inputs.md` | Entrées virtuelles Loxone à créer |
