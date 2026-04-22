# 🎮 Commandes Bidirectionnelles OwnTracks — ioBroker → iPhone

> **Fichier :** `owntracks/commands.md`  
> **Version :** 1.0 — 2026-04-22  
> **Contexte :** Installation Kevin / David / Carole — ioBroker + OwnTracks + Loxone

---

## 📋 Sommaire

1. [Principe de fonctionnement](#1-principe-de-fonctionnement)
2. [Prérequis](#2-prérequis)
3. [Liste des commandes disponibles](#3-liste-des-commandes-disponibles)
4. [Fonctions prêtes à l'emploi (script)](#4-fonctions-prêtes-à-lemploi-script)
5. [Intégration Loxone → commande](#5-intégration-loxone--commande)
6. [États ioBroker créés automatiquement](#6-états-iobroker-créés-automatiquement)
7. [Exemples concrets d'usage](#7-exemples-concrets-dusage)
8. [Chiffrement et commandes](#8-chiffrement-et-commandes)
9. [Dépannage](#9-dépannage)

---

## 1. Principe de fonctionnement

OwnTracks supporte un mécanisme de **commandes bidirectionnelles** via MQTT.

```
ioBroker/Loxone
     │
     │  publie JSON sur topic MQTT
     ▼
mqtt.0 (broker, port 1884)
     │
     │  owntracks/<user>/<device>/cmd
     ▼
iPhone OwnTracks
     │
     │  exécute la commande (ex: force GPS)
     ▼
Réponse automatique (location, steps, dump...)
     │
     ▼
owntracks.0 → ioBroker → Loxone (données mises à jour)
```

**Le flux retour est automatique** : après une commande `reportLocation`, le téléphone envoie immédiatement une mise à jour de position qui suit le chemin normal `owntracks.0 → script → Loxone`.

---

## 2. Prérequis

| Élément | Valeur / Exigence |
|---|---|
| Adaptateur MQTT | `mqtt.0` actif sur port **1884** |
| Adaptateur OwnTracks | `owntracks.0` actif sur port **1884** |
| Script principal | `owntracks_to_loxone.js` v4.0+ |
| `COMMANDS_ENABLED` | `true` dans `config.js` |
| `DEVICES` | ✅ **Optionnel** — détecté automatiquement depuis le champ `topic` |
| ioBroker JS adapter | ≥ v5.0 (pour `sendTo()` avec callback) |

### DeviceID OwnTracks — Détection automatique ✅

Depuis la v4.0, **le DeviceID est détecté automatiquement** : le script lit le champ
`owntracks.0.users.<NOM>.topic` qui contient `owntracks/Kevin/iPhone` et en extrait
`iPhone` sans aucune configuration manuelle.

**Ordre de priorité dans le script :**

| Priorité | Source | Quand utilisé |
|---|---|---|
| 1 | `detectedDevices[userName]` | Dès la 1ère position reçue — automatique ✅ |
| 2 | `CONFIG.DEVICES[userName]` | Fallback config.js (avant 1ère connexion) |
| 3 | `"iPhone"` | Fallback ultime si rien d'autre |

`DEVICES` dans `config.js` reste utile **uniquement** si tu veux envoyer une commande
before que le téléphone ait envoyé sa première position (ex: tout premier démarrage).

---

## 3. Liste des commandes disponibles

### 3.1 `reportLocation` — Forcer un fix GPS immédiat

| Attribut | Valeur |
|---|---|
| **Effet** | Le téléphone publie immédiatement sa position GPS |
| **Réponse** | Message `_type=location` normal |
| **Délai** | < 5 secondes en règle générale |
| **Utilité** | Forcer une synchro sans attendre le cycle automatique |

```json
{
  "_type"  : "cmd",
  "action" : "reportLocation"
}
```

---

### 3.2 `reportSteps` — Demander le podomètre

| Attribut | Valeur |
|---|---|
| **Effet** | Le téléphone publie le nombre de pas depuis minuit |
| **Réponse** | Message `_type=steps` avec `steps`, `stepsFrom`, `stepsTo` |
| **Nécessite** | Autorisation "Fitness & Motion" accordée sur l'iPhone |

```json
{
  "_type"  : "cmd",
  "action" : "reportSteps"
}
```

---

### 3.3 `restart` — Redémarrer l'app OwnTracks

| Attribut | Valeur |
|---|---|
| **Effet** | Ferme et relance l'application OwnTracks |
| **⚠️ Attention** | Interrompt le tracking pendant ~10 secondes |
| **Utilité** | Résoudre un blocage de l'app sans intervention manuelle |

```json
{
  "_type"  : "cmd",
  "action" : "restart"
}
```

---

### 3.4 `dump` — Rapport complet d'état

| Attribut | Valeur |
|---|---|
| **Effet** | Le téléphone publie sa configuration complète |
| **Réponse** | Configuration + waypoints actuels + état de l'app |
| **Utilité** | Diagnostic, vérification de la config à distance |

```json
{
  "_type"  : "cmd",
  "action" : "dump"
}
```

---

### 3.5 `setWaypoints` — Envoyer/modifier des zones géographiques

| Attribut | Valeur |
|---|---|
| **Effet** | Crée ou met à jour des zones géo sur le téléphone |
| **Fusion** | Les waypoints existants sont conservés (merge par `rid`) |
| **⚠️ Attention** | Un waypoint avec le même `rid` écrase l'ancien |

```json
{
  "_type"  : "cmd",
  "action" : "setWaypoints",
  "waypoints" : {
    "_type"     : "waypoints",
    "waypoints" : [
      {
        "_type" : "waypoint",
        "desc"  : "Maison",
        "lat"   : 48.8566,
        "lon"   : 2.3522,
        "rad"   : 100,
        "tst"   : 1700000000
      },
      {
        "_type" : "waypoint",
        "desc"  : "Bureau",
        "lat"   : 48.8600,
        "lon"   : 2.3400,
        "rad"   : 75,
        "tst"   : 1700000001
      }
    ]
  }
}
```

**Champs waypoint :**

| Champ | Type | Description |
|---|---|---|
| `_type` | string | Toujours `"waypoint"` |
| `desc` | string | Nom de la zone (affiché dans l'app) |
| `lat` | float | Latitude du centre |
| `lon` | float | Longitude du centre |
| `rad` | int | Rayon en mètres (> 0) |
| `tst` | int | Timestamp epoch (utiliser `Date.now()/1000`) |
| `rid` | string | ID unique optionnel (auto-généré si absent) |

---

### 3.6 `setConfiguration` — Modifier la config de l'app à distance

| Attribut | Valeur |
|---|---|
| **Effet** | Modifie les paramètres de l'app OwnTracks |
| **⚠️ Attention** | Certains changements redémarrent le tracking |
| **Utilité** | Changer le mode GPS, fréquence, etc. sans toucher au téléphone |

```json
{
  "_type"  : "cmd",
  "action" : "setConfiguration",
  "configuration" : {
    "_type"      : "configuration",
    "monitoring" : 2
  }
}
```

**Paramètres `setConfiguration` les plus utiles :**

| Paramètre | Type | Valeurs | Description |
|---|---|---|---|
| `monitoring` | int | `1` / `2` | 1=significant (eco) / 2=move (précis) |
| `locatorDisplacement` | int | mètres | Distance min avant nouvelle position |
| `locatorInterval` | int | secondes | Intervalle max entre deux positions |
| `pubQos` | int | `0`/`1`/`2` | Qualité de service MQTT |
| `pubRetain` | bool | true/false | Messages MQTT retained |
| `keepalive` | int | secondes | Intervalle keepalive MQTT |
| `downgrade` | int | % batterie | Passer en mode significant sous ce seuil |
| `ranging` | bool | true/false | Activer le ranging iBeacon |

---

## 4. Fonctions prêtes à l'emploi (script)

Le script `owntracks_to_loxone.js` v3.0 expose ces fonctions directement utilisables :

```javascript
// Forcer un fix GPS immédiat
cmdReportLocation("Kevin");
cmdReportLocation("David");
cmdReportLocation("Carole");

// Demander le nombre de pas
cmdReportSteps("Kevin");

// Redémarrer l'app (avec précaution !)
cmdRestart("Kevin");

// Rapport d'état complet
cmdDump("Kevin");

// Envoyer des zones géographiques
cmdSetWaypoints("Kevin", [
    {
        _type : "waypoint",
        desc  : "Maison",
        lat   : 48.8566,
        lon   : 2.3522,
        rad   : 100,
        tst   : Math.floor(Date.now() / 1000)
    }
]);

// Modifier la config (ex: passer en mode move)
cmdSetConfiguration("Kevin", { monitoring: 2 });

// Modifier la config (ex: repasser en économie batterie)
cmdSetConfiguration("Kevin", { monitoring: 1 });
```

---

## 5. Intégration Loxone → Commande

### Méthode recommandée : États ioBroker comme "boutons"

Le script crée automatiquement des états ioBroker pour chaque utilisateur :

| État ioBroker | Rôle |
|---|---|
| `javascript.0.OT_CMD_reportLocation_Kevin` | Forcer GPS Kevin (mettre à 1) |
| `javascript.0.OT_CMD_reportLocation_David` | Forcer GPS David |
| `javascript.0.OT_CMD_reportLocation_Carole` | Forcer GPS Carole |
| `javascript.0.OT_CMD_reportSteps_Kevin` | Demander pas Kevin |
| `javascript.0.OT_CMD_restart_Kevin` | Redémarrer app Kevin |
| `javascript.0.OT_CMD_dump_Kevin` | Rapport état Kevin |

**Comportement :** Mettre la valeur à `1` déclenche la commande, le script la remet à `0` automatiquement (comportement "bouton pulse").

### Depuis Loxone Config

Pour déclencher une commande depuis Loxone, tu as deux options :

#### Option A — Via l'adaptateur loxone.0 (si installé)
```
Loxone Virtual Output → ioBroker loxone.0 → setState("javascript.0.OT_CMD_reportLocation_Kevin", 1)
```

#### Option B — Via un script ioBroker dédié (plus simple)
Créer un second script ioBroker qui écoute un état Loxone et déclenche la commande :

```javascript
// Script séparé : "loxone_commands_trigger.js"
// Ce script écoute les états mis à jour par Loxone
// et déclenche les commandes OwnTracks correspondantes

on({ id: "loxone.0.OT_CMD_reportLocation_Kevin", change: "any" }, function(obj) {
    if (obj.state.val === 1) {
        setState("javascript.0.OT_CMD_reportLocation_Kevin", 1, true);
    }
});
```

#### Option C — Appel direct depuis ce script
Tu peux aussi appeler directement `cmdReportLocation("Kevin")` depuis n'importe quel `on()` dans le script principal.

---

## 6. États ioBroker créés automatiquement

Au démarrage du script, les états suivants sont créés dans `javascript.0` :

```
javascript.0.
├── OT_CMD_reportLocation_Kevin
├── OT_CMD_reportLocation_David
├── OT_CMD_reportLocation_Carole
├── OT_CMD_reportSteps_Kevin
├── OT_CMD_reportSteps_David
├── OT_CMD_reportSteps_Carole
├── OT_CMD_restart_Kevin
├── OT_CMD_restart_David
├── OT_CMD_restart_Carole
├── OT_CMD_dump_Kevin
├── OT_CMD_dump_David
└── OT_CMD_dump_Carole
```

Ces états sont visibles dans `ioBroker → Objets → javascript.0`.  
Ils peuvent être utilisés dans des Blockly, des règles ou d'autres scripts.

---

## 7. Exemples concrets d'usage

### 🏠 Exemple 1 — Forcer un fix GPS quand quelqu'un arrive à la maison

Dans Loxone, un capteur de porte déclenche un Virtual Output → ioBroker met l'état à 1 → script force le GPS des deux utilisateurs.

```javascript
// Dans owntracks_to_loxone.js ou un script séparé
on({ id: "loxone.0.capteur_porte_entree", change: "any" }, function(obj) {
    if (obj.state.val === 1) {
        // La porte s'ouvre — forcer un fix GPS de tous les utilisateurs
        setTimeout(function() { cmdReportLocation("Kevin");  }, 0);
        setTimeout(function() { cmdReportLocation("David");  }, 500);
        setTimeout(function() { cmdReportLocation("Carole"); }, 1000);
    }
});
```

### 🌙 Exemple 2 — Passer tous les téléphones en mode économie la nuit

```javascript
// À 23h00 : mode économie batterie (significant change)
schedule("0 23 * * *", function() {
    ["Kevin", "David", "Carole"].forEach(function(user) {
        cmdSetConfiguration(user, { monitoring: 1, locatorDisplacement: 500 });
    });
    log("OwnTracks : mode nuit activé (économie batterie)");
});

// À 7h00 : repasser en mode normal
schedule("0 7 * * *", function() {
    ["Kevin", "David", "Carole"].forEach(function(user) {
        cmdSetConfiguration(user, { monitoring: 2, locatorDisplacement: 100 });
    });
    log("OwnTracks : mode jour activé (précision normale)");
});
```

### 📍 Exemple 3 — Mettre à jour les zones géographiques sur tous les téléphones

```javascript
// Mettre à jour la zone "Maison" sur tous les téléphones
var maison = {
    _type : "waypoint",
    desc  : "Maison",
    lat   : 48.8566,        // ← Remplacer par les vraies coordonnées
    lon   : 2.3522,         // ← Remplacer par les vraies coordonnées
    rad   : 100,
    tst   : Math.floor(Date.now() / 1000)
};

["Kevin", "David", "Carole"].forEach(function(user) {
    cmdSetWaypoints(user, [maison]);
});
```

### 🩺 Exemple 4 — Diagnostic quotidien

```javascript
// Tous les matins à 8h : dump complet pour vérifier que tout va bien
schedule("0 8 * * *", function() {
    ["Kevin", "David", "Carole"].forEach(function(user) {
        cmdDump(user);
    });
});
```

---

## 8. Chiffrement et commandes

Si le chiffrement est activé (`ENCRYPTION_ENABLED: true` dans `config.js`) :

- Les **payloads OwnTracks → ioBroker** sont chiffrés (géré par owntracks.0)
- Les **commandes ioBroker → OwnTracks** via mqtt.0 sont **en clair** par défaut
- Pour chiffrer aussi les commandes, il faut utiliser une implémentation libsodium côté ioBroker

> **Recommandation :** Sur un réseau local (LAN), le chiffrement des commandes n'est pas indispensable. Il devient important uniquement si le broker MQTT est exposé sur Internet.

---

## 9. Dépannage

### La commande ne semble pas arriver au téléphone

1. **Vérifier que `mqtt.0` est actif** : ioBroker → Instances → mqtt.0 → statut vert
2. **Vérifier le topic MQTT** :
   - Dans ioBroker → mqtt.0 → Log : chercher la publication sur `owntracks/<user>/<device>/cmd`
   - Le DeviceID dans `config.js → DEVICES` doit correspondre exactement à l'app OwnTracks
3. **Vérifier la connexion MQTT du téléphone** :
   - L'app OwnTracks doit être connectée au broker mqtt.0 (port 1884)
   - Vérifier dans l'app : `Settings → Status` ou icône de connexion

### `sendTo("mqtt.0", ...)` retourne une erreur

- S'assurer que l'adaptateur `mqtt.0` est installé (pas seulement `owntracks.0`)
- Les deux adaptateurs sont nécessaires :
  - `owntracks.0` : reçoit les données des téléphones (port 1883/1884)
  - `mqtt.0` : publie les commandes vers les téléphones (port 1884)
- Vérifier que `mqtt.0` autorise les publications depuis des clients locaux

### La commande `setConfiguration` n'a pas d'effet

- Certains paramètres nécessitent un redémarrage de l'app
- Utiliser `cmdRestart()` après `cmdSetConfiguration()` si nécessaire
- iOS peut limiter certains changements de configuration en arrière-plan

### `reportSteps` retourne -1

- L'iPhone ne dispose pas du podomètre (ancien modèle) **ou**
- L'autorisation **Fitness & Motion** n'est pas accordée à OwnTracks :  
  `Réglages iOS → Confidentialité → Mouvement et fitness → OwnTracks → Activer`

---

## 📁 Fichiers associés

| Fichier | Description |
|---|---|
| `config.js` | Configuration (COMMANDS_ENABLED, DEVICES) |
| `scripts/owntracks_to_loxone.js` | Script principal avec toutes les fonctions de commande |
| `loxone/virtual_inputs.md` | Entrées virtuelles Loxone à créer |
| `owntracks/owntracks_ios_guide_complet.md` | Guide complet iOS OwnTracks |
